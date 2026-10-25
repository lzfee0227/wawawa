import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';
import { AUDIO_LIMITS, AudioService, audioConfigFromEnv, type AudioConfig } from '../src/audio.js';
import { MemoryRepository } from './memory.js';

const provider = { baseUrl: 'https://voice.example/v1', apiKey: 'test-private-key', model: 'test-model', voice: 'test-voice' };
const config: AudioConfig = { asr: provider, tts: provider };
const audioResponse = () => new Response(new Uint8Array([73, 68, 51]), { headers: { 'content-type': 'audio/mpeg' } });
const apps: ReturnType<typeof createApp>[] = [];
function appWith(request = vi.fn<typeof fetch>().mockResolvedValue(audioResponse()), audio = config) {
  const app = createApp(new MemoryRepository(), { audio, audioFetch: request });
  apps.push(app);
  return { app, request };
}
afterEach(async () => { vi.useRealTimers(); await Promise.all(apps.splice(0).map(app => app.close())); });

describe('SDD-005 A01/A06/A07 cloud audio boundary', () => {
  it('requires complete, safe, independently configured providers without exposing settings', async () => {
    const env = { AUDIO_ASR_BASE_URL: 'http://localhost:9000/v1/', AUDIO_ASR_API_KEY: 'private', AUDIO_ASR_MODEL: 'asr' };
    expect(audioConfigFromEnv(env)).toEqual({ asr: { baseUrl: 'http://localhost:9000/v1', apiKey: 'private', model: 'asr' }, tts: undefined });
    for (const url of ['not-url', 'http://cloud.example', 'https://user:pass@cloud.example', 'https://cloud.example?q=key', 'https://cloud.example/#secret']) {
      expect(audioConfigFromEnv({ ...env, AUDIO_ASR_BASE_URL: url }).asr).toBeUndefined();
    }
    expect(audioConfigFromEnv({ ...env, AUDIO_ASR_API_KEY: ' ' }).asr).toBeUndefined();
    const complete = { AUDIO_TTS_BASE_URL: provider.baseUrl, AUDIO_TTS_API_KEY: provider.apiKey, AUDIO_TTS_MODEL: provider.model, AUDIO_TTS_VOICE: provider.voice };
    expect(audioConfigFromEnv(complete).tts).toEqual(provider);
    expect(audioConfigFromEnv({ ...complete, AUDIO_TTS_VOICE: '' }).tts).toBeUndefined();
    const { app } = appWith(undefined, audioConfigFromEnv(env));
    const capabilities = await app.inject('/api/audio/capabilities');
    expect(capabilities.json()).toEqual({ asr: { configured: true }, tts: { configured: false } });
    expect(capabilities.body).not.toMatch(/private|localhost|apiKey/);
  });

  it('returns unavailable instead of silently switching providers', async () => {
    const { app, request } = appWith(undefined, {});
    expect((await app.inject({ method: 'POST', url: '/api/audio/speech', payload: { text: '你好' } })).statusCode).toBe(503);
    expect((await app.inject({ method: 'POST', url: '/api/audio/transcriptions', headers: { 'content-type': 'audio/webm' }, payload: Buffer.from([1]) })).statusCode).toBe(503);
    expect(request).not.toHaveBeenCalled();
  });

  it('generates binary speech with role voice and never forwards arbitrary request fields', async () => {
    const { app, request } = appWith();
    const reply = await app.inject({ method: 'POST', url: '/api/audio/speech', payload: { text: '选择一。', voice: 'role-voice' } });
    expect(reply.statusCode).toBe(200);
    expect(reply.headers['content-type']).toBe('audio/mpeg');
    expect(reply.headers['cache-control']).toBe('no-store');
    expect(reply.rawPayload).toEqual(Buffer.from([73, 68, 51]));
    const [url, options] = request.mock.calls[0];
    expect(url).toBe('https://voice.example/v1/audio/speech');
    expect(options).toMatchObject({ method: 'POST', redirect: 'error', headers: { authorization: 'Bearer test-private-key' } });
    expect(JSON.parse(options!.body as string)).toEqual({ input: '选择一。', model: provider.model, voice: 'role-voice', response_format: 'mp3' });
  });

  it('uses configured default voice and validates text/voice before the provider call', async () => {
    const { app, request } = appWith();
    expect((await app.inject({ method: 'POST', url: '/api/audio/speech', payload: { text: '你好' } })).statusCode).toBe(200);
    expect(JSON.parse(request.mock.calls[0][1]!.body as string).voice).toBe(provider.voice);
    for (const payload of [{ text: '' }, { text: ' ' }, { text: 'a'.repeat(4001) }, { text: 'a', voice: 'v'.repeat(201) }, { text: 'a', baseUrl: 'https://evil.example' }]) {
      expect((await app.inject({ method: 'POST', url: '/api/audio/speech', payload })).statusCode).toBe(400);
    }
    expect(request).toHaveBeenCalledTimes(1);
  });

  it.each(['webm', 'mp4', 'ogg', 'wav'])('transcribes %s recording as multipart and returns only recognized text', async format => {
    const { app, request } = appWith(vi.fn<typeof fetch>().mockResolvedValue(Response.json({ text: '第二个', debug: 'provider-info' })));
    const reply = await app.inject({ method: 'POST', url: '/api/audio/transcriptions', headers: { 'content-type': `audio/${format};codecs=opus` }, payload: Buffer.from([1, 2, 3]) });
    expect(reply.statusCode).toBe(200);
    expect(reply.json()).toEqual({ text: '第二个' });
    const [url, options] = request.mock.calls[0];
    expect(url).toBe('https://voice.example/v1/audio/transcriptions');
    const form = options!.body as FormData;
    expect(form.get('model')).toBe('test-model');
    const file = form.get('file') as File;
    expect(file.name).toBe(`recording.${format}`);
    expect(file.type).toBe(`audio/${format}`);
    expect(new Uint8Array(await file.arrayBuffer())).toEqual(new Uint8Array([1, 2, 3]));
    expect(options!.headers).not.toHaveProperty('content-type');
  });

  it('rejects unsupported/empty/oversized recordings without calling a provider', async () => {
    const { app, request } = appWith();
    const send = (type: string, payload: Buffer) => app.inject({ method: 'POST', url: '/api/audio/transcriptions', headers: { 'content-type': type }, payload });
    expect((await send('audio/aac', Buffer.from([1]))).statusCode).toBe(415);
    expect((await send('audio/webm', Buffer.alloc(0))).statusCode).toBe(400);
    expect((await send('audio/webm', Buffer.alloc(AUDIO_LIMITS.MAX_AUDIO + 1))).statusCode).toBe(413);
    expect(request).not.toHaveBeenCalled();
  });

  it.each([new Response('secret-provider-body', { status: 401 }), new Response('redirect', { status: 302 })])('sanitizes upstream failures including redirects', async response => {
    const { app } = appWith(vi.fn<typeof fetch>().mockResolvedValue(response));
    const reply = await app.inject({ method: 'POST', url: '/api/audio/speech', payload: { text: '你好' } });
    expect(reply.statusCode).toBe(502);
    expect(reply.body).not.toMatch(/secret|private|redirect/);
  });

  it('sanitizes thrown network failures and invalid speech response types/empty bodies', async () => {
    const request = vi.fn<typeof fetch>().mockRejectedValueOnce(new Error('secret URL key')).mockResolvedValueOnce(Response.json({ error: 'secret' })).mockResolvedValueOnce(new Response(null, { headers: { 'content-type': 'audio/mpeg' } }));
    const { app } = appWith(request);
    for (let i = 0; i < 3; i++) {
      const reply = await app.inject({ method: 'POST', url: '/api/audio/speech', payload: { text: '你好' } });
      expect(reply.statusCode).toBe(502);
      expect(reply.body).not.toMatch(/secret|private/);
    }
  });

  it('bounds streamed output even when content-length is absent', async () => {
    const service = new AudioService(config, vi.fn<typeof fetch>().mockResolvedValue(new Response(new Uint8Array(AUDIO_LIMITS.MAX_OUTPUT + 1), { headers: { 'content-type': 'audio/mpeg' } })));
    await expect(service.speech('你好')).rejects.toMatchObject({ status: 502, code: 'AUDIO_TOO_LARGE' });
    const huge = new AudioService(config, vi.fn<typeof fetch>().mockResolvedValue(new Response('small', { headers: { 'content-type': 'audio/mpeg', 'content-length': String(AUDIO_LIMITS.MAX_OUTPUT + 1) } })));
    await expect(huge.speech('你好')).rejects.toMatchObject({ status: 502, code: 'AUDIO_TOO_LARGE' });
  });

  it.each(['not-json', JSON.stringify({ text: ' ' }), JSON.stringify({ text: 'x'.repeat(301) }), JSON.stringify({ text: 123 }), JSON.stringify(null), 'x'.repeat(16001)])('rejects malformed or oversized transcription instead of truncating choices', async value => {
    const service = new AudioService(config, vi.fn<typeof fetch>().mockResolvedValue(new Response(value)));
    await expect(service.transcribe(Buffer.from([1]), 'audio/webm')).rejects.toMatchObject({ status: 502 });
  });

  it('times out a provider that never sends headers', async () => {
    vi.useFakeTimers();
    const request = vi.fn<typeof fetch>().mockImplementation(() => new Promise(() => {}));
    const service = new AudioService(config, request);
    const result = expect(service.speech('你好')).rejects.toMatchObject({ status: 504, code: 'AUDIO_PROVIDER_TIMEOUT' });
    await vi.advanceTimersByTimeAsync(30_000);
    await result;
    expect(request.mock.calls[0][1]!.signal!.aborted).toBe(true);
  });

  it('keeps timeout active while reading the response body', async () => {
    vi.useFakeTimers();
    const request = vi.fn<typeof fetch>().mockResolvedValue(new Response(new ReadableStream({ start() {} }), { headers: { 'content-type': 'audio/mpeg' } }));
    const service = new AudioService(config, request);
    const result = expect(service.speech('你好')).rejects.toMatchObject({ status: 504 });
    await vi.advanceTimersByTimeAsync(30_000);
    await result;
    expect(request.mock.calls[0][1]!.signal!.aborted).toBe(true);
  });
});
