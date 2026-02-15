import { describe, it, expect } from 'vitest';
import { BaseResource } from '../../src/resources/BaseResource.js';
import { createMockHttpClient } from './helpers/mock-http.js';
import type { HttpClient } from '../../src/http/HttpClient.js';

class TestResource extends BaseResource {
  async doRequest<T>(method: string, path: string, data?: unknown): Promise<T> {
    return this.request<T>(method, path, data);
  }
}

describe('BaseResource', () => {
  it('routes GET to http.get', async () => {
    const mockHttp = createMockHttpClient();
    mockHttp.get.mockResolvedValue({ ok: true });
    const resource = new TestResource(mockHttp as unknown as HttpClient);

    const result = await resource.doRequest('GET', '/test');
    expect(mockHttp.get).toHaveBeenCalledWith('/test');
    expect(result).toEqual({ ok: true });
  });

  it('routes POST to http.post with data', async () => {
    const mockHttp = createMockHttpClient();
    mockHttp.post.mockResolvedValue({ created: true });
    const resource = new TestResource(mockHttp as unknown as HttpClient);

    const result = await resource.doRequest('POST', '/test', { key: 'val' });
    expect(mockHttp.post).toHaveBeenCalledWith('/test', { key: 'val' });
    expect(result).toEqual({ created: true });
  });

  it('routes PUT to http.put with data', async () => {
    const mockHttp = createMockHttpClient();
    mockHttp.put.mockResolvedValue({ updated: true });
    const resource = new TestResource(mockHttp as unknown as HttpClient);

    const result = await resource.doRequest('PUT', '/test', { key: 'val' });
    expect(mockHttp.put).toHaveBeenCalledWith('/test', { key: 'val' });
    expect(result).toEqual({ updated: true });
  });

  it('routes DELETE to http.delete', async () => {
    const mockHttp = createMockHttpClient();
    mockHttp.delete.mockResolvedValue({ deleted: true });
    const resource = new TestResource(mockHttp as unknown as HttpClient);

    const result = await resource.doRequest('DELETE', '/test');
    expect(mockHttp.delete).toHaveBeenCalledWith('/test');
    expect(result).toEqual({ deleted: true });
  });

  it('throws on unsupported method', async () => {
    const mockHttp = createMockHttpClient();
    const resource = new TestResource(mockHttp as unknown as HttpClient);

    await expect(resource.doRequest('PATCH', '/test')).rejects.toThrow(
      'Unsupported HTTP method: PATCH'
    );
  });

  it('is case insensitive for method', async () => {
    const mockHttp = createMockHttpClient();
    mockHttp.get.mockResolvedValue('ok');
    const resource = new TestResource(mockHttp as unknown as HttpClient);

    await resource.doRequest('get', '/test');
    expect(mockHttp.get).toHaveBeenCalledWith('/test');
  });
});
