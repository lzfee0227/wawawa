import { GameError } from './errors.js';

const MAX_TEXT = 4_000;
const MAX_AUDIO = 5_000_000;
const MAX_OUTPUT = 10_000_000;
const TIMEOUT_MS = 30_000;
const formats = new Set(['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/wav']);

type ProviderConfig = { baseUrl: string; apiKey: string; model: string; voice?: string };
export type AudioConfig = { asr?: ProviderConfig; tts?: ProviderConfig };

function isSafeBaseUrl(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.username || url.password || url.search || url.hash) return false;
    if (url.protocol === 'https:') return true;
    return url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  } catch { return false; }
}

function provider(baseUrl: string | undefined, apiKey: string | undefined, model: string | undefined, voice?: string): ProviderConfig | undefined {
  baseUrl = baseUrl?.trim(); apiKey = apiKey?.trim(); model = model?.trim(); voice = voice?.trim();
  if (!baseUrl || !apiKey || !model || !isSafeBaseUrl(baseUrl)) return undefined;
  return { baseUrl: baseUrl.replace(/\/$/, ''), apiKey, model, ...(voice ? { voice } : {}) };
}

export function audioConfigFromEnv(env: NodeJS.ProcessEnv = process.env): AudioConfig {
  return {
    asr: provider(env.AUDIO_ASR_BASE_URL, env.AUDIO_ASR_API_KEY, env.AUDIO_ASR_MODEL),
    tts: env.AUDIO_TTS_VOICE?.trim() ? provider(env.AUDIO_TTS_BASE_URL, env.AUDIO_TTS_API_KEY, env.AUDIO_TTS_MODEL, env.AUDIO_TTS_VOICE) : undefined
  };
}

type FetchLike = typeof fetch;
async function boundedBytes(response: Response, limit: number): Promise<Buffer> {
  const header = Number(response.headers.get('content-length') ?? 0);
  if (header > limit) {
    await response.body?.cancel();
    throw new GameError(502, 'AUDIO_TOO_LARGE', '语音服务返回内容过大。');
  }
  if (!response.body) return Buffer.from(await response.arrayBuffer());
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      size += part.value.byteLength;
      if (size > limit) throw new GameError(502, 'AUDIO_TOO_LARGE', '语音服务返回的音频过大。');
      chunks.push(part.value);
    }
  } finally { await reader.cancel().catch(() => undefined); }
  return Buffer.concat(chunks.map(chunk => Buffer.from(chunk)));
}

export class AudioService {
  constructor(private readonly config: AudioConfig, private readonly request: FetchLike = fetch) {}

  capabilities() { return { asr: { configured: Boolean(this.config.asr) }, tts: { configured: Boolean(this.config.tts) } }; }

  private async call<T>(url: string, init: RequestInit, consume: (response: Response) => Promise<T>): Promise<T> {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        controller.abort();
        reject(new GameError(504, 'AUDIO_PROVIDER_TIMEOUT', '语音服务响应超时。'));
      }, TIMEOUT_MS);
    });
    try {
      return await Promise.race([timeout, (async () => {
        const response = await this.request(url, { ...init, redirect: 'error', signal: controller.signal });
        if (!response.ok) {
          await response.body?.cancel();
          throw new GameError(502, 'AUDIO_PROVIDER_ERROR', '语音服务暂时不可用。');
        }
        return consume(response);
      })()]);
    } catch (error) {
      if (error instanceof GameError) throw error;
      throw new GameError(502, 'AUDIO_PROVIDER_ERROR', '语音服务暂时不可用。');
    } finally { clearTimeout(timer); controller.abort(); }
  }

  async speech(text: string, voice?: string): Promise<Buffer> {
    if (!this.config.tts) throw new GameError(503, 'AUDIO_TTS_UNCONFIGURED', '云端 TTS 尚未配置。');
    if (!text.trim() || text.length > MAX_TEXT) throw new GameError(400, 'AUDIO_TEXT_INVALID', '朗读文本不能为空且不得超过 4000 个字符。');
    const config = this.config.tts;
    return this.call(`${config.baseUrl}/audio/speech`, {
      method: 'POST', headers: { authorization: `Bearer ${config.apiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({ model: config.model, input: text, voice: voice?.trim() || config.voice || 'alloy', response_format: 'mp3' })
    }, async response => {
      const type = response.headers.get('content-type')?.split(';')[0].trim();
      if (type !== 'audio/mpeg' && type !== 'audio/mp3') {
        await response.body?.cancel();
        throw new GameError(502, 'AUDIO_PROVIDER_FORMAT', '语音服务返回了无效音频。');
      }
      const result = await boundedBytes(response, MAX_OUTPUT);
      if (!result.length) throw new GameError(502, 'AUDIO_PROVIDER_FORMAT', '语音服务返回了空音频。');
      return result;
    });
  }

  async transcribe(body: Buffer, contentType: string): Promise<string> {
    if (!this.config.asr) throw new GameError(503, 'AUDIO_ASR_UNCONFIGURED', '云端 ASR 尚未配置。');
    const type = contentType.split(';')[0].trim().toLowerCase();
    if (!formats.has(type)) throw new GameError(415, 'AUDIO_TYPE_UNSUPPORTED', '仅支持 webm、mp4、ogg 或 wav 音频。');
    if (body.length === 0 || body.length > MAX_AUDIO) throw new GameError(body.length > MAX_AUDIO ? 413 : 400, 'AUDIO_SIZE_INVALID', '录音不能为空且不得超过 5 MB。');
    const config = this.config.asr;
    const form = new FormData();
    form.append('file', new Blob([new Uint8Array(body)], { type }), `recording.${type.split('/')[1]}`);
    form.append('model', config.model);
    return this.call(`${config.baseUrl}/audio/transcriptions`, {
      method: 'POST', headers: { authorization: `Bearer ${config.apiKey}` }, body: form
    }, async response => {
      const bytes = await boundedBytes(response, 16_000);
      let data: unknown;
      try { data = JSON.parse(bytes.toString('utf8')); } catch { throw new GameError(502, 'AUDIO_PROVIDER_FORMAT', '语音服务返回了无效识别结果。'); }
      const text = typeof data === 'object' && data !== null && 'text' in data && typeof data.text === 'string' ? data.text : '';
      if (!text.trim() || text.length > 300) throw new GameError(502, 'AUDIO_PROVIDER_FORMAT', '语音服务返回了无效识别结果。');
      return text;
    });
  }
}

export const AUDIO_LIMITS = { MAX_TEXT, MAX_AUDIO, MAX_OUTPUT } as const;
