import { describe, expect, it } from 'vitest';
import { CharacterMessagesResource } from '../../../src/resources/CharacterResource.js';
import { SWCError } from '../../../src/http/errors.js';
import { createMockHttpClient } from '../helpers/mock-http.js';
import type { HttpClient } from '../../../src/http/HttpClient.js';

describe('CharacterMessagesResource.create()', () => {
  function createResource() {
    const mockHttp = createMockHttpClient();
    const resource = new CharacterMessagesResource(mockHttp as unknown as HttpClient);
    return { resource, mockHttp };
  }

  it('sends PUT with a single receiver handle', async () => {
    const { resource, mockHttp } = createResource();
    mockHttp.put.mockResolvedValue({ uid: '38:105138990' });

    await resource.create({
      uid: '1:12345',
      receivers: 'recipient_handle',
      communication: 'Test',
    });

    expect(mockHttp.put).toHaveBeenCalledWith('/character/1:12345/messages', {
      receivers: 'recipient_handle',
      communication: 'Test',
    });
  });

  it('normalizes semicolon-separated receiver handles', async () => {
    const { resource, mockHttp } = createResource();
    mockHttp.put.mockResolvedValue({ uid: '38:105138990' });

    await resource.create({
      uid: '1:12345',
      receivers: '  recipient_one ;recipient_two;  recipient_three  ',
      communication: 'Test',
    });

    expect(mockHttp.put).toHaveBeenCalledWith('/character/1:12345/messages', {
      receivers: 'recipient_one;recipient_two;recipient_three',
      communication: 'Test',
    });
  });

  it('throws validation error for UID-like receiver values', async () => {
    const { resource, mockHttp } = createResource();

    let thrown: unknown;
    try {
      await resource.create({
        uid: '1:12345',
        receivers: '1:12345',
        communication: 'Test',
      });
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(SWCError);
    expect((thrown as SWCError).type).toBe('validation');
    expect((thrown as SWCError).message).toContain('looks like a UID');
    expect(mockHttp.put).not.toHaveBeenCalled();
  });

  it('throws validation error when more than 25 receiver handles are provided', async () => {
    const { resource, mockHttp } = createResource();
    const tooManyReceivers = Array.from({ length: 26 }, (_, i) => `receiver_${i + 1}`).join(';');

    let thrown: unknown;
    try {
      await resource.create({
        uid: '1:12345',
        receivers: tooManyReceivers,
        communication: 'Test',
      });
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(SWCError);
    expect((thrown as SWCError).type).toBe('validation');
    expect((thrown as SWCError).message).toContain('maximum 25 receiver handles');
    expect(mockHttp.put).not.toHaveBeenCalled();
  });

  it('throws validation error when receivers is empty after normalization', async () => {
    const { resource, mockHttp } = createResource();

    let thrown: unknown;
    try {
      await resource.create({
        uid: '1:12345',
        receivers: '  ; ;  ',
        communication: 'Test',
      });
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(SWCError);
    expect((thrown as SWCError).type).toBe('validation');
    expect((thrown as SWCError).message).toContain('at least one receiver handle');
    expect(mockHttp.put).not.toHaveBeenCalled();
  });
});
