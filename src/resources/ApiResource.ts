/**
 * API utility endpoints
 */

import { BaseResource } from './BaseResource.js';

export interface HelloWorldResponse {
  message: string;
  [key: string]: unknown;
}

export interface HelloAuthResponse {
  message: string;
  character?: string;
  [key: string]: unknown;
}

export interface Permission {
  name: string;
  description?: string;
  [key: string]: unknown;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  resetTime: string;
  [key: string]: unknown;
}

export interface TimeResponse {
  currentTime: string;
  timestamp: number;
  [key: string]: unknown;
}

export interface ResourceInfo {
  name: string;
  href?: string;
  [key: string]: unknown;
}

/**
 * API resource for utility endpoints
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
   * @example
   * const response = await client.api.helloWorld();
   */
  async helloWorld(): Promise<HelloWorldResponse> {
    return this.request<HelloWorldResponse>('GET', '/api/helloworld');
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
   */
  async permissions(): Promise<Permission[]> {
    return this.request<Permission[]>('GET', '/api/permissions');
  }

  /**
   * Get current rate limit status
   * @requires_auth No (shows public IP rate limits)
   * @example
   * const rateLimits = await client.api.rateLimits();
   */
  async rateLimits(): Promise<RateLimitInfo> {
    return this.request<RateLimitInfo>('GET', '/api/ratelimits');
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
      const data: any = {};
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
