/**
 * News resource for accessing news feeds
 */

import { HttpClient } from '../http/HttpClient.js';
import { BaseResource } from './BaseResource.js';
import { NewsItem, GetNewsItemOptions, ListNewsOptions, QueryParams } from '../types/index.js';

/**
 * Galactic News Service (GNS) resource
 */
export class GNSResource extends BaseResource {
  /**
   * List GNS news items (paginated with optional filtering)
   * @param options - Optional category, pagination, and filtering parameters
   * @example
   * const news = await client.news.gns.list();
   * const economyNews = await client.news.gns.list({ category: 'economy' });
   * const moreNews = await client.news.gns.list({ start_index: 51, item_count: 50 });
   * const searchNews = await client.news.gns.list({ search: 'battle', author: 'John Doe' });
   * const factionNews = await client.news.gns.list({ faction: 'Empire', faction_type: 'government' });
   */
  async list(options?: ListNewsOptions): Promise<NewsItem[]> {
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

    const response = await this.http.get<{ newsitem?: NewsItem[]; attributes?: unknown }>(path, { params });
    // API returns { attributes: {...}, newsitem: [...] }, extract just the array
    return response.newsitem || [];
  }

  /**
   * Get specific GNS news item
   */
  async get(options: GetNewsItemOptions): Promise<NewsItem> {
    return this.request<NewsItem>('GET', `/news/gns/${options.id}`);
  }
}

/**
 * Sim News resource
 */
export class SimNewsResource extends BaseResource {
  /**
   * List Sim News items (paginated with optional filtering)
   * @param options - Optional category, pagination, and filtering parameters
   * @example
   * const news = await client.news.simNews.list();
   * const playerNews = await client.news.simNews.list({ category: 'player' });
   * const moreNews = await client.news.simNews.list({ start_index: 51, item_count: 50 });
   * const searchNews = await client.news.simNews.list({ search: 'update', author: 'Admin' });
   */
  async list(options?: ListNewsOptions): Promise<NewsItem[]> {
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
    // Note: faction and faction_type are GNS-only parameters, not used for SimNews

    const response = await this.http.get<{ newsitem?: NewsItem[]; attributes?: unknown }>(path, { params });
    // API returns { attributes: {...}, newsitem: [...] }, extract just the array
    return response.newsitem || [];
  }

  /**
   * Get specific Sim News item
   */
  async get(options: GetNewsItemOptions): Promise<NewsItem> {
    return this.request<NewsItem>('GET', `/news/simnews/${options.id}`);
  }
}

/**
 * News resource for accessing news feeds
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
