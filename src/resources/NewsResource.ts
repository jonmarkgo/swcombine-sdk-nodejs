/**
 * News resource for accessing news feeds
 */

import { HttpClient } from '../http/HttpClient.js';
import { BaseResource } from './BaseResource.js';
import {
  GetNewsItemOptions,
  ListGNSOptions,
  ListSimNewsOptions,
  NewsListAttributes,
  NewsItem,
  NewsListItem,
  NewsListResponse,
  NewsPostedTimestamp,
  NewsReference,
  QueryParams,
} from '../types/index.js';

function normalizeNewsListAttributes(attributes: unknown): NewsListAttributes {
  if (!attributes || typeof attributes !== 'object') {
    return {};
  }

  const raw = attributes as Record<string, unknown>;
  const normalized: NewsListAttributes = {};

  const maybeNumber = (value: unknown): number | undefined => {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string') {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
    return undefined;
  };

  const start = maybeNumber(raw.start);
  const total = maybeNumber(raw.total);
  const count = maybeNumber(raw.count);

  if (start !== undefined) normalized.start = start;
  if (total !== undefined) normalized.total = total;
  if (count !== undefined) normalized.count = count;

  return { ...raw, ...normalized };
}

function normalizeNewsId(id: unknown): number {
  if (typeof id === 'number' && Number.isFinite(id)) {
    return id;
  }

  if (typeof id === 'string') {
    const parsed = Number(id);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function normalizeNewsListItem(item: unknown): NewsListItem {
  const raw = item && typeof item === 'object' ? (item as Record<string, unknown>) : {};
  const rawAttributes =
    raw.attributes && typeof raw.attributes === 'object' ? (raw.attributes as Record<string, unknown>) : {};

  const value =
    typeof raw.value === 'string'
      ? raw.value
      : typeof rawAttributes.title === 'string'
        ? rawAttributes.title
        : '';

  const normalized: NewsListItem = {
    ...raw,
    value,
    attributes: {
      ...rawAttributes,
      id: normalizeNewsId(rawAttributes.id),
      href: typeof rawAttributes.href === 'string' ? rawAttributes.href : '',
      title: typeof rawAttributes.title === 'string' ? rawAttributes.title : value,
    },
  };

  return normalized;
}

function normalizeNewsListResponse(response: { newsitem?: unknown[]; attributes?: unknown }): NewsListResponse {
  const items = (response.newsitem || []).map(normalizeNewsListItem);
  const list = Object.assign(items, {
    attributes: normalizeNewsListAttributes(response.attributes),
  });
  return list as NewsListResponse;
}

function normalizeNewsReference(reference: unknown): NewsReference {
  if (typeof reference === 'string') {
    return { value: reference };
  }

  if (reference && typeof reference === 'object') {
    const raw = reference as Record<string, unknown>;
    const normalized: NewsReference = {
      ...raw,
      value: typeof raw.value === 'string' ? raw.value : '',
    };

    if (raw.attributes && typeof raw.attributes === 'object') {
      const attrs = raw.attributes as Record<string, unknown>;
      normalized.attributes = {
        uid: typeof attrs.uid === 'string' ? attrs.uid : undefined,
        href: typeof attrs.href === 'string' ? attrs.href : undefined,
      };
    }

    return normalized;
  }

  return { value: '' };
}

function normalizeNewsPostedTimestamp(posted: unknown): NewsPostedTimestamp | undefined {
  if (!posted || typeof posted !== 'object') {
    return undefined;
  }

  const raw = posted as Record<string, unknown>;
  const normalized: NewsPostedTimestamp = {};

  if (typeof raw.years === 'number') normalized.years = raw.years;
  if (typeof raw.days === 'number') normalized.days = raw.days;
  if (typeof raw.hours === 'number') normalized.hours = raw.hours;
  if (typeof raw.mins === 'number') normalized.mins = raw.mins;
  if (typeof raw.secs === 'number') normalized.secs = raw.secs;
  if (typeof raw.timestamp === 'number') normalized.timestamp = raw.timestamp;

  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

function normalizeNewsItem(item: unknown): NewsItem {
  const raw = item && typeof item === 'object' ? (item as Record<string, unknown>) : {};

  const normalized: NewsItem = {
    ...raw,
    url: typeof raw.url === 'string' ? raw.url : '',
    title: typeof raw.title === 'string' ? raw.title : '',
    id: normalizeNewsId(raw.id),
    author: normalizeNewsReference(raw.author),
    faction: normalizeNewsReference(raw.faction),
  };

  if (typeof raw.logo === 'string') normalized.logo = raw.logo;
  if (typeof raw.hacked === 'number') normalized.hacked = raw.hacked;
  if (typeof raw.location === 'string') normalized.location = raw.location;
  if (typeof raw.body === 'string') normalized.body = raw.body;
  if (typeof raw.category === 'string') normalized.category = raw.category;

  const posted = normalizeNewsPostedTimestamp(raw.posted);
  if (posted) {
    normalized.posted = posted;
  }

  return normalized;
}

function normalizeNewsGetResponse(response: unknown): NewsItem {
  if (Array.isArray(response)) {
    return normalizeNewsItem(response[0]);
  }

  return normalizeNewsItem(response);
}

/**
 * Galactic News Service (GNS) resource
 *
 * @see https://www.swcombine.com/ws/v2.0/documentation/news/gns/category/ SW Combine API Documentation
 */
export class GNSResource extends BaseResource {
  /**
   * List GNS news items (paginated with optional filtering)
   * Returns headline metadata entries (`attributes.id`, `attributes.href`, `attributes.title`, `value`).
   * The returned array also includes pagination metadata at `result.attributes`
   * (`start`, `total`, `count`) from the API response.
   * @requires_auth No
   * @param options - Optional category, pagination, and filtering parameters
   * @param options.category - News category: 'auto', 'economy', 'military', 'political', 'social'
   * @param options.start_index - Starting position (1-based). Default: 1
   * @param options.item_count - Number of items to retrieve. Default: 50, Max: 50
   * @param options.faction - Filter by faction name (GNS only)
   * @param options.faction_type - Filter by faction type (GNS only)
   * @example
   * const news = await client.news.gns.list();
   * const economyNews = await client.news.gns.list({ category: 'economy' });
   * const moreNews = await client.news.gns.list({ start_index: 51, item_count: 50 });
   * const searchNews = await client.news.gns.list({ search: 'battle', author: 'John Doe' });
   * const factionNews = await client.news.gns.list({ faction: 'Empire', faction_type: 'government' });
   * console.log(news[0].attributes.title);
   * console.log(news.attributes.start, news.attributes.total, news.attributes.count);
   */
  async list(options?: ListGNSOptions): Promise<NewsListResponse> {
    const path = options?.category ? `/news/gns/${options.category}` : '/news/gns';

    const params: QueryParams = {
      start_index: options?.start_index || 1,
      item_count: options?.item_count || 50,
    };

    if (options?.start_date !== undefined) {
      params.start_date = options.start_date;
    }
    if (options?.end_date !== undefined) {
      params.end_date = options.end_date;
    }
    if (options?.search) {
      params.search = options.search;
    }
    if (options?.author) {
      params.author = options.author;
    }
    if (options?.faction) {
      params.faction = options.faction;
    }
    if (options?.faction_type) {
      params.faction_type = options.faction_type;
    }

    const response = await this.http.get<{ newsitem?: unknown[]; attributes?: unknown }>(path, { params });
    // Preserve array behavior while exposing `attributes.start/total/count`.
    return normalizeNewsListResponse(response);
  }

  /**
   * Get a specific GNS news item by numeric ID.
   * Author and faction are normalized to object references with `value`.
   * If the API returns an array, the SDK returns the first normalized item.
   * @example
   * const post = await client.news.gns.get({ id: 49108 });
   * console.log(post.author.value);
   * console.log(post.faction.value);
   */
  async get(options: GetNewsItemOptions): Promise<NewsItem> {
    const response = await this.request<unknown>('GET', `/news/gns/${options.id}`);
    return normalizeNewsGetResponse(response);
  }
}

/**
 * Sim News resource
 *
 * @see https://www.swcombine.com/ws/v2.0/documentation/news/simnews/category/ SW Combine API Documentation
 */
export class SimNewsResource extends BaseResource {
  /**
   * List Sim News items (paginated with optional filtering)
   * Returns headline metadata entries (`attributes.id`, `attributes.href`, `attributes.title`, `value`).
   * The returned array also includes pagination metadata at `result.attributes`
   * (`start`, `total`, `count`) from the API response.
   * @requires_auth No
   * @param options - Optional category, pagination, and filtering parameters
   * @param options.category - News category: 'player', 'technical', 'community'
   * @param options.start_index - Starting position (1-based). Default: 1
   * @param options.item_count - Number of items to retrieve. Default: 50, Max: 50
   * @example
   * const news = await client.news.simNews.list();
   * const playerNews = await client.news.simNews.list({ category: 'player' });
   * const moreNews = await client.news.simNews.list({ start_index: 51, item_count: 50 });
   * const searchNews = await client.news.simNews.list({ search: 'update', author: 'Admin' });
   * console.log(news[0].attributes.title);
   * console.log(news.attributes.start, news.attributes.total, news.attributes.count);
   */
  async list(options?: ListSimNewsOptions): Promise<NewsListResponse> {
    const path = options?.category ? `/news/simnews/${options.category}` : '/news/simnews';

    const params: QueryParams = {
      start_index: options?.start_index || 1,
      item_count: options?.item_count || 50,
    };

    if (options?.start_date !== undefined) {
      params.start_date = options.start_date;
    }
    if (options?.end_date !== undefined) {
      params.end_date = options.end_date;
    }
    if (options?.search) {
      params.search = options.search;
    }
    if (options?.author) {
      params.author = options.author;
    }

    const response = await this.http.get<{ newsitem?: unknown[]; attributes?: unknown }>(path, { params });
    // Preserve array behavior while exposing `attributes.start/total/count`.
    return normalizeNewsListResponse(response);
  }

  /**
   * Get a specific Sim News item by numeric ID.
   * Author and faction are normalized to object references with `value`.
   * If the API returns an array, the SDK returns the first normalized item.
   * @example
   * const post = await client.news.simNews.get({ id: 49108 });
   * console.log(post.author.value);
   * console.log(post.faction.value);
   */
  async get(options: GetNewsItemOptions): Promise<NewsItem> {
    const response = await this.request<unknown>('GET', `/news/simnews/${options.id}`);
    return normalizeNewsGetResponse(response);
  }
}

/**
 * News resource for accessing news feeds
 *
 * @see https://www.swcombine.com/ws/v2.0/documentation/news/gns/category/ SW Combine API Documentation
 */
export class NewsResource extends BaseResource {
  public readonly gns: GNSResource;
  public readonly simNews: SimNewsResource;

  constructor(http: HttpClient) {
    super(http);
    this.gns = new GNSResource(http);
    this.simNews = new SimNewsResource(http);
  }
}
