import { afterEach, describe, expect, it, vi } from 'vitest';
import { api, ApiError } from './api';

afterEach(() => vi.unstubAllGlobals());
describe('HTTP adapter', () => {
  it('sends JSON and reads successful results', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 's1' }) });
    vi.stubGlobal('fetch', fetchMock);
    expect(await api('/stories', 'POST', { title: '来信' })).toEqual({ id: 's1' });
    expect(fetchMock).toHaveBeenCalledWith('/api/stories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"title":"来信"}' });
  });
  it('does not send a body or JSON headers on GET', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => [] });
    vi.stubGlobal('fetch', fetchMock);
    await api('/stories');
    expect(fetchMock).toHaveBeenCalledWith('/api/stories', { method: 'GET' });
  });
  it('preserves status and diagnostics for failed compilation', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 422, json: async () => ({ error: { message: '无法编译', diagnostics: [{ severity: 'error', message: 'Line 2' }] } }) }));
    await expect(api('/publish')).rejects.toMatchObject({ message: '无法编译', status: 422, diagnostics: [{ severity: 'error', message: 'Line 2' }] });
  });
  it('explains invalid JSON and unknown failures', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 502, json: async () => { throw new Error('html'); } }));
    await expect(api('/stories')).rejects.toBeInstanceOf(ApiError);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) }));
    await expect(api('/stories')).rejects.toThrow('请求失败，请重试。');
  });
});
