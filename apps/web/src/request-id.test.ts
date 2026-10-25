import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRequestId } from './request-id';

afterEach(() => vi.unstubAllGlobals());

describe('request IDs on localhost and HTTP LAN origins', () => {
  it('uses native randomUUID when available', () => {
    const id = '12345678-1234-4123-8123-123456789abc';
    const randomUUID = vi.fn(() => id);
    const getRandomValues = vi.fn();
    vi.stubGlobal('crypto', { randomUUID, getRandomValues });

    expect(createRequestId()).toBe(id);
    expect(randomUUID).toHaveBeenCalledOnce();
    expect(getRandomValues).not.toHaveBeenCalled();
  });

  it('uses fresh cryptographic bytes and sets UUID v4 version and variant bits without randomUUID', () => {
    const getRandomValues = vi.fn((bytes: Uint8Array) => {
      expect(bytes).toBeInstanceOf(Uint8Array);
      expect(bytes).toHaveLength(16);
      return bytes.map((_, index) => index);
    });
    vi.stubGlobal('crypto', { getRandomValues });

    expect(createRequestId()).toBe('00010203-0405-4607-8809-0a0b0c0d0e0f');
    getRandomValues.mockImplementationOnce(bytes => bytes.fill(255));
    const second = createRequestId();
    expect(second).toBe('ffffffff-ffff-4fff-bfff-ffffffffffff');
    expect(second).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(getRandomValues).toHaveBeenCalledTimes(2);
    expect(getRandomValues.mock.calls[0][0]).not.toBe(getRandomValues.mock.calls[1][0]);
  });
});
