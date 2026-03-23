/**
 * Galaxy resource for accessing galactic data
 */

import { HttpClient } from '../http/HttpClient.js';
import { BaseResource } from './BaseResource.js';
import { Page } from '../pagination/Page.js';
import {
  GalaxyPlanetListItem,
  GalaxySectorListItem,
  GalaxySystemListItem,
  GalaxyStationListItem,
  GalaxyCityListItem,
  Planet,
  Sector,
  System,
  Station,
  City,
  GetPlanetOptions,
  GetSectorOptions,
  GetSystemOptions,
  GetStationOptions,
  GetCityOptions,
} from '../types/index.js';

/**
 * Galaxy planets resource
 *
 * @see https://www.swcombine.com/ws/v2.0/documentation/galaxy/planets/ SW Combine API Documentation
 */
export class GalaxyPlanetsResource extends BaseResource {
  /**
   * List all planets (paginated)
   * @param options - Optional pagination parameters
   * @example
   * const planets = await client.galaxy.planets.list();
   * const morePlanets = await client.galaxy.planets.list({ start_index: 51, item_count: 50 });
   */
  async list(options?: { start_index?: number; item_count?: number; pageDelay?: number }): Promise<Page<GalaxyPlanetListItem>> {
    const makeRequest = async (startIndex: number): Promise<Page<GalaxyPlanetListItem>> => {
      const params = {
        start_index: startIndex,
        item_count: options?.item_count ?? 50,
      };
      const response = await this.http.get<Record<string, unknown>>('/galaxy/planets/', { params });
      const data = (response.planet || []) as GalaxyPlanetListItem[];
      const attrs = (response.attributes || {}) as Record<string, unknown>;

      return this.createPage({
        data,
        attributes: attrs,
        defaultStart: 1,
        fetcher: makeRequest,
        pageDelay: options?.pageDelay,
      });
    };

    return makeRequest(options?.start_index ?? 1);
  }

  /**
   * Get planet by UID
   */
  async get(options: GetPlanetOptions): Promise<Planet> {
    return this.request<Planet>('GET', `/galaxy/planets/${options.uid}`);
  }
}

/**
 * Galaxy sectors resource
 *
 * @see https://www.swcombine.com/ws/v2.0/documentation/galaxy/sectors/ SW Combine API Documentation
 */
export class GalaxySectorsResource extends BaseResource {
  /**
   * List all sectors (paginated)
   * @param options - Optional pagination parameters
   * @example
   * const sectors = await client.galaxy.sectors.list();
   * const moreSectors = await client.galaxy.sectors.list({ start_index: 51, item_count: 50 });
   */
  async list(options?: { start_index?: number; item_count?: number; pageDelay?: number }): Promise<Page<GalaxySectorListItem>> {
    const makeRequest = async (startIndex: number): Promise<Page<GalaxySectorListItem>> => {
      const params = {
        start_index: startIndex,
        item_count: options?.item_count ?? 50,
      };
      const response = await this.http.get<Record<string, unknown>>('/galaxy/sectors/', { params });
      const data = (response.sector || []) as GalaxySectorListItem[];
      const attrs = (response.attributes || {}) as Record<string, unknown>;

      return this.createPage({
        data,
        attributes: attrs,
        defaultStart: 1,
        fetcher: makeRequest,
        pageDelay: options?.pageDelay,
      });
    };

    return makeRequest(options?.start_index ?? 1);
  }

  /**
   * Get sector by name or UID
   * @param options - Sector identifier (use lowercase sector name, e.g., 'seswenna')
   * @example
   * const sector = await client.galaxy.sectors.get({ uid: 'seswenna' });
   */
  async get(options: GetSectorOptions): Promise<Sector> {
    return this.request<Sector>('GET', `/galaxy/sectors/${options.uid}`);
  }
}

/**
 * Galaxy systems resource
 *
 * @see https://www.swcombine.com/ws/v2.0/documentation/galaxy/systems/ SW Combine API Documentation
 */
export class GalaxySystemsResource extends BaseResource {
  /**
   * List all systems (paginated)
   * @param options - Optional pagination parameters
   * @example
   * const systems = await client.galaxy.systems.list();
   * const moreSystems = await client.galaxy.systems.list({ start_index: 51, item_count: 50 });
   */
  async list(options?: { start_index?: number; item_count?: number; pageDelay?: number }): Promise<Page<GalaxySystemListItem>> {
    const makeRequest = async (startIndex: number): Promise<Page<GalaxySystemListItem>> => {
      const params = {
        start_index: startIndex,
        item_count: options?.item_count ?? 50,
      };
      const response = await this.http.get<Record<string, unknown>>('/galaxy/systems/', { params });
      const data = (response.system || []) as GalaxySystemListItem[];
      const attrs = (response.attributes || {}) as Record<string, unknown>;

      return this.createPage({
        data,
        attributes: attrs,
        defaultStart: 1,
        fetcher: makeRequest,
        pageDelay: options?.pageDelay,
      });
    };

    return makeRequest(options?.start_index ?? 1);
  }

  /**
   * Get system by UID
   */
  async get(options: GetSystemOptions): Promise<System> {
    return this.request<System>('GET', `/galaxy/systems/${options.uid}`);
  }
}

/**
 * Galaxy stations resource
 *
 * @see https://www.swcombine.com/ws/v2.0/documentation/galaxy/stations/ SW Combine API Documentation
 */
export class GalaxyStationsResource extends BaseResource {
  /**
   * List all stations in named systems with no ECM (paginated)
   * @param options - Optional pagination parameters
   * @example
   * const stations = await client.galaxy.stations.list();
   * const moreStations = await client.galaxy.stations.list({ start_index: 51, item_count: 50 });
   */
  async list(options?: { start_index?: number; item_count?: number; pageDelay?: number }): Promise<Page<GalaxyStationListItem>> {
    const makeRequest = async (startIndex: number): Promise<Page<GalaxyStationListItem>> => {
      const params = {
        start_index: startIndex,
        item_count: options?.item_count ?? 50,
      };
      const response = await this.http.get<Record<string, unknown>>('/galaxy/stations/', { params });
      const data = (response.station || []) as GalaxyStationListItem[];
      const attrs = (response.attributes || {}) as Record<string, unknown>;

      return this.createPage({
        data,
        attributes: attrs,
        defaultStart: 1,
        fetcher: makeRequest,
        pageDelay: options?.pageDelay,
      });
    };

    return makeRequest(options?.start_index ?? 1);
  }

  /**
   * Get station by UID
   */
  async get(options: GetStationOptions): Promise<Station> {
    return this.request<Station>('GET', `/galaxy/stations/${options.uid}`);
  }
}

/**
 * Galaxy cities resource
 *
 * @see https://www.swcombine.com/ws/v2.0/documentation/galaxy/cities/ SW Combine API Documentation
 */
export class GalaxyCitiesResource extends BaseResource {
  /**
   * List all cities (paginated)
   * @param options - Optional pagination parameters
   * @example
   * const cities = await client.galaxy.cities.list();
   * const moreCities = await client.galaxy.cities.list({ start_index: 51, item_count: 50 });
   */
  async list(options?: { start_index?: number; item_count?: number; pageDelay?: number }): Promise<Page<GalaxyCityListItem>> {
    const makeRequest = async (startIndex: number): Promise<Page<GalaxyCityListItem>> => {
      const params = {
        start_index: startIndex,
        item_count: options?.item_count ?? 50,
      };
      const response = await this.http.get<Record<string, unknown>>('/galaxy/cities/', { params });
      const data = (response.city || []) as GalaxyCityListItem[];
      const attrs = (response.attributes || {}) as Record<string, unknown>;

      return this.createPage({
        data,
        attributes: attrs,
        defaultStart: 1,
        fetcher: makeRequest,
        pageDelay: options?.pageDelay,
      });
    };

    return makeRequest(options?.start_index ?? 1);
  }

  /**
   * Get city by UID
   */
  async get(options: GetCityOptions): Promise<City> {
    return this.request<City>('GET', `/galaxy/cities/${options.uid}`);
  }
}

/**
 * Galaxy resource for accessing galactic information
 *
 * @see https://www.swcombine.com/ws/v2.0/documentation/galaxy/systems/ SW Combine API Documentation
 */
export class GalaxyResource extends BaseResource {
  public readonly planets: GalaxyPlanetsResource;
  public readonly sectors: GalaxySectorsResource;
  public readonly systems: GalaxySystemsResource;
  public readonly stations: GalaxyStationsResource;
  public readonly cities: GalaxyCitiesResource;

  constructor(http: HttpClient) {
    super(http);
    this.planets = new GalaxyPlanetsResource(http);
    this.sectors = new GalaxySectorsResource(http);
    this.systems = new GalaxySystemsResource(http);
    this.stations = new GalaxyStationsResource(http);
    this.cities = new GalaxyCitiesResource(http);
  }

  /**
   * Client-side helper method to extract unique sectors from systems list
   * Note: The API provides a direct sectors list endpoint via galaxy.sectors.list()
   * This method is an alternative that derives sector information from the systems endpoint
   * @returns Array of unique sector information extracted from systems
   * @example
   * const sectorsData = await client.galaxy.getSectorsFromSystems();
   * // Returns: [{ uid: '25:160', name: 'Seswenna', href: '...' }, ...]
   */
  async getSectorsFromSystems(): Promise<Array<{ uid: string; name: string; href?: string }>> {
    const systemsResponse = await this.systems.list();

    // Extract unique sectors
    const sectorMap = new Map<string, { uid: string; name: string; href?: string }>();

    for (const system of systemsResponse.data) {
      const sector = system.location?.container;
      if (sector?.attributes?.uid && sector.attributes.type === 'sector') {
        const uid = sector.attributes.uid;
        if (!sectorMap.has(uid)) {
          sectorMap.set(uid, {
            uid: uid,
            name: sector.value,
            href: sector.attributes.href,
          });
        }
      }
    }

    return Array.from(sectorMap.values());
  }
}
