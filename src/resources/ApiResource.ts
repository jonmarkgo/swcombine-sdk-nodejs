/**
 * API utility endpoints
 */

import { BaseResource } from './BaseResource.js';

// Note: HelloWorld endpoint returns a plain string, not an object

export interface HelloAuthResponse {
  message: string;
  /** OAuth client ID that authenticated this request */
  client?: number;
  [key: string]: unknown;
}

/**
 * Permission attributes from API
 */
export interface PermissionAttributes {
  name: string;
  description: string;
  inherits: string;
}

/**
 * Single permission entry from API
 */
export interface Permission {
  attributes: PermissionAttributes;
}

/**
 * Rate limit attributes for a specific endpoint pattern
 */
export interface RateLimitAttributes {
  pattern: string;
  limit: number;
  remaining: number;
  reset: number;
  reset_time: string;
}

/**
 * Single rate limit entry from API
 */
export interface RateLimitEntry {
  attributes: RateLimitAttributes;
}

/**
 * CGT (Combine Galactic Time) response from API
 */
export interface TimeResponse {
  years: number;
  days: number;
  hours: number;
  mins: number;
  secs: number;
  /** Unix timestamp - only present in POST conversion responses */
  timestamp?: number;
  [key: string]: unknown;
}

export interface ResourceInfo {
  name: string;
  href?: string;
  [key: string]: unknown;
}

/**
 * API resource for utility endpoints
 *
 * @see https://www.swcombine.com/ws/v2.0/documentation/api/helloworld/ SW Combine API Documentation
 */
export class ApiResource extends BaseResource {
  /**
   * Get list of available API resources
   * @returns List of available API resources
   * @example
   * const resources = await client.api.getResources();
   */
  async getResources(): Promise<ResourceInfo[]> {
    return this.request<ResourceInfo[]>('GET', '/');
  }
  /**
   * Print a HelloWorld message
   * @requires_auth No
   * @returns Plain string "Hello World"
   * @example
   * const message = await client.api.helloWorld();
   * console.log(message); // "Hello World"
   */
  async helloWorld(): Promise<string> {
    return this.request<string>('GET', '/api/helloworld');
  }

  /**
   * Print a HelloWorld message for authorized clients
   * @requires_auth Yes
   * @requires_scope Any valid scope (used for testing authentication)
   * @example
   * const response = await client.api.helloAuth();
   */
  async helloAuth(): Promise<HelloAuthResponse> {
    return this.request<HelloAuthResponse>('GET', '/api/helloauth');
  }

  /**
   * Get list of available web services permissions
   * @requires_auth No
   * @example
   * const permissions = await client.api.permissions();
   * permissions.forEach(p => console.log(p.attributes.name, p.attributes.description));
   */
  async permissions(): Promise<Permission[]> {
    const response = await this.http.get<{ permission?: Permission[]; attributes?: unknown }>(
      '/api/permissions'
    );
    return response.permission || [];
  }

  /**
   * Get current rate limit status for all endpoint patterns
   * @requires_auth No (shows public IP rate limits)
   * @returns Array of rate limit entries, one per endpoint pattern
   * @example
   * const rateLimits = await client.api.rateLimits();
   * rateLimits.forEach(rl => {
   *   console.log(`${rl.attributes.pattern}: ${rl.attributes.remaining}/${rl.attributes.limit}`);
   * });
   */
  async rateLimits(): Promise<RateLimitEntry[]> {
    const response = await this.http.get<{ ratelimit?: RateLimitEntry[]; attributes?: unknown }>(
      '/api/ratelimits'
    );
    return response.ratelimit || [];
  }

  /**
   * Get current time or convert times
   * @param options - Optional conversion parameters
   * @param options.cgt - CGT format time to convert
   * @param options.time - Unix timestamp to convert
   * @example
   * // Get current time
   * const current = await client.api.time();
   * // Convert CGT to unix
   * const converted = await client.api.time({ cgt: '2023-12-01 12:00:00' });
   * // Convert unix to CGT
   * const converted = await client.api.time({ time: 1701432000 });
   */
  async time(options?: { cgt?: string; time?: number }): Promise<TimeResponse> {
    if (options && (options.cgt || options.time !== undefined)) {
      // Use POST for conversions
      const data: Record<string, string | number> = {};
      if (options.cgt) {
        data.cgt = options.cgt;
      }
      if (options.time !== undefined) {
        data.time = options.time;
      }
      return this.request<TimeResponse>('POST', '/api/time', data);
    }
    // Use GET for current time
    return this.request<TimeResponse>('GET', '/api/time');
  }
}
