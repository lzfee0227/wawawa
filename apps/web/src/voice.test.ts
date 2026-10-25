import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { audioRequest, audioUrl, browserRecognize, playAudioBlob, recordAudio, speakBrowser, type RecognitionEvent } from './voice';

let recorder: RecorderMock;
class RecorderMock {
  static isTypeSupported = (type: string) => type === 'audio/webm;codecs=opus';
  state = 'inactive';
  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null; onerror: (() => void) | null = null;
  constructor() { recorder = this; }
  start() { this.state = 'recording'; }
  stop() { this.state = 'inactive'; this.onstop?.(); }
}
let recognition: RecognitionMock;
class RecognitionMock {
  lang = ''; continuous = false; interimResults = false;
  onresult: ((event: RecognitionEvent) => void) | null = null; onerror: ((event: { error: string }) => void) | null = null; onend: (() => void) | null = null;
  start = vi.fn(); abort = vi.fn(); constructor() { recognition = this; }
}
let audio: AudioMock;
class AudioMock {
  onended: (() => void) | null = null; onerror: (() => void) | null = null;
  pause = vi.fn(); removeAttribute = vi.fn(); play = vi.fn().mockResolvedValue(undefined);
  constructor(public src: string) { audio = this; }
}
const stopTrack = vi.fn();
const media = vi.fn();
beforeEach(() => {
  stopTrack.mockReset(); media.mockReset().mockResolvedValue({ getTracks: () => [{ stop: stopTrack }] });
  vi.stubGlobal('navigator', { mediaDevices: { getUserMedia: media } });
  vi.stubGlobal('MediaRecorder', RecorderMock); vi.stubGlobal('SpeechRecognition', RecognitionMock); vi.stubGlobal('Audio', AudioMock);
  vi.stubGlobal('URL', class extends URL { static createObjectURL = vi.fn(() => 'blob:audio'); static revokeObjectURL = vi.fn(); });
});
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

describe('audio resources A03–A07', () => {
  it('records until explicit finish and closes tracks', async () => {
    let finish!: () => void;
    const promise = recordAudio(new AbortController().signal, callback => { finish = callback; });
    await Promise.resolve();
    recorder.ondataavailable?.({ data: new Blob(['sound']) });
    finish();
    expect(await promise).toMatchObject({ size: 5, type: 'audio/webm;codecs=opus' });
    expect(stopTrack).toHaveBeenCalledTimes(1);
  });
  it('stops tracks granted after cancellation and never starts recording', async () => {
    const controller = new AbortController(); controller.abort();
    await expect(recordAudio(controller.signal, vi.fn())).rejects.toMatchObject({ name: 'AbortError' });
    expect(stopTrack).toHaveBeenCalledTimes(1);
  });
  it('cancels an active recording and rejects too large or empty recordings', async () => {
    const controller = new AbortController();
    const cancelled = recordAudio(controller.signal, vi.fn()); await Promise.resolve(); controller.abort();
    await expect(cancelled).rejects.toMatchObject({ name: 'AbortError' });
    expect(recorder.state).toBe('inactive');
    const oversized = recordAudio(new AbortController().signal, vi.fn()); await Promise.resolve();
    recorder.ondataavailable?.({ data: new Blob(['x'.repeat(5_000_001)]) });
    await expect(oversized).rejects.toThrow('超过 5 MB');
    let finish!: () => void;
    const empty = recordAudio(new AbortController().signal, callback => { finish = callback; }); await Promise.resolve(); finish();
    await expect(empty).rejects.toThrow('录音为空');
    expect(stopTrack).toHaveBeenCalledTimes(3);
  });
  it('automatically finishes at 60 seconds and handles recorder errors', async () => {
    vi.useFakeTimers();
    const limited = recordAudio(new AbortController().signal, vi.fn()); await Promise.resolve();
    recorder.ondataavailable?.({ data: new Blob(['sound']) }); vi.advanceTimersByTime(60_000);
    expect((await limited).size).toBe(5);
    const failed = recordAudio(new AbortController().signal, vi.fn()); await Promise.resolve(); recorder.onerror?.();
    await expect(failed).rejects.toThrow('录音失败');
    expect(stopTrack).toHaveBeenCalledTimes(2);
  });
  it('rejects unsupported recorder or denied permission', async () => {
    media.mockRejectedValueOnce(new Error('permission denied'));
    await expect(recordAudio(new AbortController().signal, vi.fn())).rejects.toThrow('permission denied');
    vi.stubGlobal('MediaRecorder', undefined);
    await expect(recordAudio(new AbortController().signal, vi.fn())).rejects.toThrow('不支持录音');
  });
  it('releases synthesized audio on end, error or abort', async () => {
    const ended = playAudioBlob(new Blob(['audio']), new AbortController().signal);
    audio.onended?.(); await ended;
    const controller = new AbortController();
    const cancelled = playAudioBlob(new Blob(['audio']), controller.signal); controller.abort();
    await expect(cancelled).rejects.toMatchObject({ name: 'AbortError' });
    expect(audio.pause).toHaveBeenCalled();
    const failed = playAudioBlob(new Blob(['audio']), new AbortController().signal); audio.onerror?.();
    await expect(failed).rejects.toThrow('无法播放');
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(3);
  });
  it('never starts already cancelled playback or recognition', async () => {
    const controller = new AbortController(); controller.abort();
    await expect(playAudioBlob(new Blob(), controller.signal)).rejects.toMatchObject({ name: 'AbortError' });
    await expect(browserRecognize(controller.signal)).rejects.toMatchObject({ name: 'AbortError' });
    await expect(speakBrowser('text', '', controller.signal, vi.fn())).rejects.toMatchObject({ name: 'AbortError' });
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });
  it('rejects recognition with no result, excessive text, timeout or unsupported browser', async () => {
    vi.useFakeTimers();
    const empty = browserRecognize(new AbortController().signal); recognition.onend?.(); await expect(empty).rejects.toThrow('没有听到');
    const oversized = browserRecognize(new AbortController().signal); recognition.onresult?.({ results: [[{ transcript: 'a'.repeat(301) }]] });
    await expect(oversized).rejects.toThrow('有效短句');
    const timeout = browserRecognize(new AbortController().signal); vi.advanceTimersByTime(60_000); await expect(timeout).rejects.toThrow('识别超时');
    vi.stubGlobal('SpeechRecognition', undefined); await expect(browserRecognize(new AbortController().signal)).rejects.toThrow('不支持语音识别');
  });
  it('normalizes safe URLs and rejects scripts/credentials', () => {
    expect(audioUrl(' https://example.com/a.mp3 ')).toBe('https://example.com/a.mp3');
    expect(() => audioUrl('javascript:alert(1)')).toThrow();
    expect(() => audioUrl('https://user:pw@example.com/a')).toThrow();
  });
  it('uses safe error message when the service returns a non-JSON response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('private proxy error', { status: 502 })));
    await expect(audioRequest('speech', {})).rejects.toThrow('语音服务请求失败');
  });
});
