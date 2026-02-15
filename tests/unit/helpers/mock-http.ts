import { vi } from 'vitest';
import type { HttpClient } from '../../../src/http/HttpClient.js';

/**
 * Creates a mock HttpClient with all public methods stubbed via vi.fn().
 * Returns a typed mock suitable for passing to resource constructors.
 */
export function createMockHttpClient(): {
  [K in keyof HttpClient]: ReturnType<typeof vi.fn>;
} {
  return {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    request: vi.fn(),
    setTokenManager: vi.fn(),
    getRateLimitInfo: vi.fn(),
    setRateLimitCallback: vi.fn(),
  } as any;
}
