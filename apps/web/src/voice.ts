export type VoiceSource = 'browser' | 'cloud';
export type AudioCapabilities = { asr: { configured: boolean }; tts: { configured: boolean } };
export type RecognitionEvent = { results: ArrayLike<ArrayLike<{ transcript: string }>> };
export interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  abort(): void;
}
type RecognitionConstructor = new () => Recognition;

export function recognitionConstructor(): RecognitionConstructor | undefined {
  const browser = window as unknown as { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor };
  return browser.SpeechRecognition ?? browser.webkitSpeechRecognition;
}

export function audioUrl(value: string): string {
  const url = new URL(value.trim());
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('请输入不含账号密码的 HTTP(S) 音频地址。');
  return url.href;
}

export async function audioRequest(path: string, init: RequestInit): Promise<Response> {
  const response = await fetch(`/api/audio/${path}`, init);
  if (!response.ok) {
    let message = '语音服务请求失败，请重试。';
    try { const body = await response.json(); if (typeof body.error?.message === 'string') message = body.error.message; } catch { /* Non-JSON upstream/proxy errors use the safe local message. */ }
    throw new Error(message);
  }
  return response;
}

const cancelled = () => new DOMException('已取消', 'AbortError');

export function speakBrowser(text: string, voiceId: string | undefined, signal: AbortSignal, fallback: () => void): Promise<void> {
  if (signal.aborted) return Promise.reject(cancelled());
  return new Promise((resolve, reject) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    const voices = speechSynthesis.getVoices();
    const match = voiceId ? voices.find(voice => voice.voiceURI === voiceId || voice.name === voiceId) : undefined;
    if (match) utterance.voice = match;
    else {
      utterance.voice = voices.find(voice => voice.lang.startsWith('zh')) ?? null;
      if (voiceId) fallback();
    }
    const cleanup = () => { signal.removeEventListener('abort', abort); utterance.onend = null; utterance.onerror = null; };
    const abort = () => { cleanup(); speechSynthesis.cancel(); reject(cancelled()); };
    utterance.onend = () => { cleanup(); resolve(); };
    utterance.onerror = () => { cleanup(); reject(new Error('浏览器朗读失败，请检查系统语音支持后重试。')); };
    signal.addEventListener('abort', abort, { once: true });
    try { speechSynthesis.speak(utterance); } catch (error) { cleanup(); reject(error); }
  });
}

export function playAudioBlob(blob: Blob, signal: AbortSignal): Promise<void> {
  if (signal.aborted) return Promise.reject(cancelled());
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    let cleaned = false;
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      audio.onended = null; audio.onerror = null; signal.removeEventListener('abort', abort);
      audio.pause(); audio.removeAttribute('src'); URL.revokeObjectURL(url);
    };
    const abort = () => { cleanup(); reject(cancelled()); };
    audio.onended = () => { cleanup(); resolve(); };
    audio.onerror = () => { cleanup(); reject(new Error('合成音频无法播放，请检查音频格式。')); };
    signal.addEventListener('abort', abort, { once: true });
    try {
      Promise.resolve(audio.play()).catch(() => { cleanup(); reject(new Error('播放被浏览器阻止，请再次点击朗读。')); });
    } catch { cleanup(); reject(new Error('播放被浏览器阻止，请再次点击朗读。')); }
  });
}

export function browserRecognize(signal: AbortSignal): Promise<string> {
  const Constructor = recognitionConstructor();
  if (!Constructor) return Promise.reject(new Error('此浏览器不支持语音识别，请改用云服务或文字输入。'));
  if (signal.aborted) return Promise.reject(cancelled());
  return new Promise((resolve, reject) => {
    const recognition = new Constructor();
    recognition.lang = 'zh-CN'; recognition.continuous = false; recognition.interimResults = false;
    let received = false;
    const cleanup = () => {
      clearTimeout(timeout); signal.removeEventListener('abort', abort);
      recognition.onresult = null; recognition.onerror = null; recognition.onend = null;
    };
    const abort = () => { cleanup(); recognition.abort(); reject(cancelled()); };
    const timeout = setTimeout(() => { cleanup(); recognition.abort(); reject(new Error('识别超时，请重新开始。')); }, 60_000);
    recognition.onresult = event => {
      const text = event.results[0]?.[0]?.transcript?.trim();
      received = true; cleanup(); recognition.abort();
      if (!text || text.length > 300) reject(new Error('未识别到有效短句，请说出选项序号或完整选项。'));
      else resolve(text);
    };
    recognition.onerror = event => {
      cleanup(); recognition.abort();
      reject(new Error(event.error === 'not-allowed' || event.error === 'service-not-allowed'
        ? '麦克风或语音服务权限被拒绝，请检查浏览器权限。' : '语音识别失败，请检查网络与麦克风后重试。'));
    };
    recognition.onend = () => { cleanup(); if (!received) reject(new Error('没有听到有效语音，请重试。')); };
    signal.addEventListener('abort', abort, { once: true });
    try { recognition.start(); } catch (error) { cleanup(); reject(error); }
  });
}

export function recordingMime(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined;
  return ['audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg;codecs=opus', 'audio/webm'].find(type => MediaRecorder.isTypeSupported(type));
}

export async function recordAudio(signal: AbortSignal, ready: (finish: () => void) => void): Promise<Blob> {
  const mimeType = recordingMime();
  if (!mimeType || !navigator.mediaDevices?.getUserMedia) throw new Error('此浏览器不支持录音，请换用支持麦克风的浏览器。');
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const stopTracks = () => stream.getTracks().forEach(track => track.stop());
  if (signal.aborted) { stopTracks(); throw cancelled(); }
  return new Promise((resolve, reject) => {
    let recorder: MediaRecorder;
    try { recorder = new MediaRecorder(stream, { mimeType }); } catch (error) { stopTracks(); reject(error); return; }
    const chunks: Blob[] = [];
    let size = 0;
    const cleanup = () => {
      clearTimeout(timeout); signal.removeEventListener('abort', abort);
      recorder.ondataavailable = null; recorder.onstop = null; recorder.onerror = null;
      if (recorder.state !== 'inactive') recorder.stop();
      stopTracks();
    };
    const abort = () => { cleanup(); reject(cancelled()); };
    const finish = () => { if (recorder.state !== 'inactive') recorder.stop(); };
    const timeout = setTimeout(finish, 60_000);
    recorder.ondataavailable = event => {
      size += event.data.size;
      if (size > 5_000_000) { cleanup(); reject(new Error('录音超过 5 MB，请缩短后重试。')); }
      else if (event.data.size) chunks.push(event.data);
    };
    recorder.onerror = () => { cleanup(); reject(new Error('录音失败，请检查麦克风。')); };
    recorder.onstop = () => {
      cleanup();
      if (!size) reject(new Error('录音为空，请重新录制。'));
      else resolve(new Blob(chunks, { type: mimeType }));
    };
    signal.addEventListener('abort', abort, { once: true });
    try { recorder.start(1000); ready(finish); } catch (error) { cleanup(); reject(error); }
  });
}
