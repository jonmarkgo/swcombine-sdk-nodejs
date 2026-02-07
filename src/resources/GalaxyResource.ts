/**
 * Galaxy resource for accessing galactic data
 */

import { HttpClient } from '../http/HttpClient.js';
import { BaseResource } from './BaseResource.js';
import {
  GalaxyPlanetListItem,
  GalaxySectorListItem,
  GalaxySystemListItem,
  GalaxyStationListItem,
  GalaxyCityListItem,
  GalaxyPlanetListRawResponse,
  GalaxySectorListRawResponse,
  GalaxySystemListRawResponse,
  GalaxyStationListRawResponse,
  GalaxyCityListRawResponse,
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
 */
export class GalaxyPlanetsResource extends BaseResource {
  async listRaw(options?: { start_index?: number; item_count?: number }): Promise<GalaxyPlanetListRawResponse> {
    const params = {
      start_index: options?.start_index || 1,
      item_count: options?.item_count || 50,
    };
    return this.http.get<GalaxyPlanetListRawResponse>('/galaxy/planets/', { params });
  }

  /**
   * List all planets (paginated)
   * @param options - Optional pagination parameters
   * @example
   * const planets = await client.galaxy.planets.list();
   * const morePlanets = await client.galaxy.planets.list({ start_index: 51, item_count: 50 });
   */
  async list(options?: { start_index?: number; item_count?: number }): Promise<GalaxyPlanetListItem[]> {
    const response = await this.listRaw(options);
    // API returns { attributes: {...}, planet: [...] }, extract just the array
    return response.planet || [];
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
 */
export class GalaxySectorsResource extends BaseResource {
  async listRaw(options?: { start_index?: number; item_count?: number }): Promise<GalaxySectorListRawResponse> {
    const params = {
      start_index: options?.start_index || 1,
      item_count: options?.item_count || 50,
    };
    return this.http.get<GalaxySectorListRawResponse>('/galaxy/sectors/', { params });
  }

  /**
   * List all sectors (paginated)
   * @param options - Optional pagination parameters
   * @example
   * const sectors = await client.galaxy.sectors.list();
   * const moreSectors = await client.galaxy.sectors.list({ start_index: 51, item_count: 50 });
   */
  async list(options?: { start_index?: number; item_count?: number }): Promise<GalaxySectorListItem[]> {
    const response = await this.listRaw(options);
    // API returns { attributes: {...}, sector: [...] }, extract just the array
    return response.sector || [];
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
 */
export class GalaxySystemsResource extends BaseResource {
  async listRaw(options?: { start_index?: number; item_count?: number }): Promise<GalaxySystemListRawResponse> {
    const params = {
      start_index: options?.start_index || 1,
      item_count: options?.item_count || 50,
    };
    return this.http.get<GalaxySystemListRawResponse>('/galaxy/systems/', { params });
  }

  /**
   * List all systems (paginated)
   * @param options - Optional pagination parameters
   * @example
   * const systems = await client.galaxy.systems.list();
   * const moreSystems = await client.galaxy.systems.list({ start_index: 51, item_count: 50 });
   */
  async list(options?: { start_index?: number; item_count?: number }): Promise<GalaxySystemListItem[]> {
    const response = await this.listRaw(options);
    // API returns { attributes: {...}, system: [...] }, extract just the array
    return response.system || [];
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
 */
export class GalaxyStationsResource extends BaseResource {
  async listRaw(options?: { start_index?: number; item_count?: number }): Promise<GalaxyStationListRawResponse> {
    const params = {
      start_index: options?.start_index || 1,
      item_count: options?.item_count || 50,
    };
    return this.http.get<GalaxyStationListRawResponse>('/galaxy/stations/', { params });
  }

  /**
   * List all stations in named systems with no ECM (paginated)
   * @param options - Optional pagination parameters
   * @example
   * const stations = await client.galaxy.stations.list();
   * const moreStations = await client.galaxy.stations.list({ start_index: 51, item_count: 50 });
   */
  async list(options?: { start_index?: number; item_count?: number }): Promise<GalaxyStationListItem[]> {
    const response = await this.listRaw(options);
    // API returns { attributes: {...}, station: [...] }, extract just the array
    return response.station || [];
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
 */
export class GalaxyCitiesResource extends BaseResource {
  async listRaw(options?: { start_index?: number; item_count?: number }): Promise<GalaxyCityListRawResponse> {
    const params = {
      start_index: options?.start_index || 1,
      item_count: options?.item_count || 50,
    };
    return this.http.get<GalaxyCityListRawResponse>('/galaxy/cities/', { params });
  }

  /**
   * List all cities (paginated)
   * @param options - Optional pagination parameters
   * @example
   * const cities = await client.galaxy.cities.list();
   * const moreCities = await client.galaxy.cities.list({ start_index: 51, item_count: 50 });
   */
  async list(options?: { start_index?: number; item_count?: number }): Promise<GalaxyCityListItem[]> {
    const response = await this.listRaw(options);
    // API returns { attributes: {...}, city: [...] }, extract just the array
    return response.city || [];
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

    // Handle paginated response
    const systems = (systemsResponse as any).system || systemsResponse;

    // Extract unique sectors
    const sectorMap = new Map<string, { uid: string; name: string; href?: string }>();

    for (const system of systems) {
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
