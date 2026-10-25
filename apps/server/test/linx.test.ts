import { describe, expect, it } from 'vitest';
import { linxCallerFromHeaders } from '../src/linx.js';

const caller = { deviceId: 'device-1', agentId: 'agent-1', sessionId: 'linx-1' };

describe('Linx caller headers L02/L04/L05', () => {
  it('reads a complete caller and ignores a request with no identity', () => {
    expect(linxCallerFromHeaders({
      'X-Linx-Device-Id': ' device-1 ',
      'X-Linx-Agent-Id': 'agent-1',
      'X-Linx-Session-Id': 'linx-1',
    })).toEqual(caller);
    expect(linxCallerFromHeaders({})).toBeUndefined();
    expect(linxCallerFromHeaders({
      'x-linx-device-id': ' ',
      'x-linx-agent-id': '',
      'x-linx-session-id': '   ',
    })).toBeUndefined();
  });

  it('rejects a partial, duplicated, or non-token caller before the game sees it', () => {
    expect(() => linxCallerFromHeaders({ 'x-linx-device-id': 'device-1' })).toThrowError(expect.objectContaining({ status: 400, code: 'VALIDATION_ERROR' }));
    expect(() => linxCallerFromHeaders({
      'x-linx-device-id': ' ',
      'x-linx-agent-id': 'agent-1',
      'x-linx-session-id': 'linx-1',
    })).toThrowError(expect.objectContaining({ code: 'VALIDATION_ERROR' }));
    expect(() => linxCallerFromHeaders({
      'x-linx-device-id': ['device-1', 'device-2'],
      'x-linx-agent-id': 'agent-1',
      'x-linx-session-id': 'linx-1',
    })).toThrowError(expect.objectContaining({ code: 'VALIDATION_ERROR' }));
    expect(() => linxCallerFromHeaders({
      'x-linx-device-id': 'bad id',
      'x-linx-agent-id': 'agent-1',
      'x-linx-session-id': 'linx-1',
    })).toThrowError(expect.objectContaining({ code: 'VALIDATION_ERROR' }));
    expect(() => linxCallerFromHeaders({
      'x-linx-device-id': 'd'.repeat(201),
      'x-linx-agent-id': 'agent-1',
      'x-linx-session-id': 'linx-1',
    })).toThrowError(expect.objectContaining({ code: 'VALIDATION_ERROR' }));
  });
});
