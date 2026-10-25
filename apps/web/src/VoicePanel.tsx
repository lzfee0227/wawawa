import { useCallback, useEffect, useRef, useState } from 'react';
import type { Session } from './api';
import { audioRequest, audioUrl, browserRecognize, playAudioBlob, recognitionConstructor, recordAudio, recordingMime, speakBrowser, type AudioCapabilities, type VoiceSource } from './voice';
import './voice.css';

type Props = { session: Session | null; busy: boolean; onRecognized: (text: string) => void };
const emptyCapabilities: AudioCapabilities = { asr: { configured: false }, tts: { configured: false } };

export function VoicePanel({ session, busy, onRecognized }: Props) {
  const [capabilities, setCapabilities] = useState(emptyCapabilities);
  const [configuration, setConfiguration] = useState('正在检查云服务配置…');
  const [tts, setTts] = useState<VoiceSource>('browser');
  const [asr, setAsr] = useState<VoiceSource>('browser');
  const [activity, setActivity] = useState<'idle' | 'speaking' | 'listening' | 'recording' | 'processing'>('idle');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [url, setUrl] = useState('');
  const [source, setSource] = useState('');
  const [audioName, setAudioName] = useState('');
  const operation = useRef<AbortController | null>(null);
  const finishRecording = useRef<(() => void) | null>(null);
  const player = useRef<HTMLAudioElement>(null);
  const objectUrl = useRef<string | null>(null);
  const attachPlayer = useCallback((element: HTMLAudioElement | null) => {
    if (player.current && player.current !== element) {
      player.current.pause();
    }
    player.current = element;
  }, []);
  const secure = window.isSecureContext;
  const browserTts = typeof window.speechSynthesis !== 'undefined' && typeof window.SpeechSynthesisUtterance !== 'undefined';
  const browserAsr = Boolean(recognitionConstructor());
  const cloudRecording = Boolean(recordingMime() && navigator.mediaDevices?.getUserMedia);

  function cancel(pausePlayer = true) {
    operation.current?.abort(); operation.current = null; finishRecording.current = null;
    if (pausePlayer && player.current?.getAttribute('src')) player.current.pause();
  }
  function stop() { cancel(); setActivity('idle'); setNotice('已停止。'); }
  function begin(state: typeof activity) {
    cancel(); const controller = new AbortController(); operation.current = controller;
    setError(''); setNotice(''); setActivity(state); return controller;
  }
  function report(cause: unknown, controller: AbortController) {
    if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : '语音操作失败，请重试。');
  }
  function complete(controller: AbortController) {
    if (operation.current === controller) { operation.current = null; finishRecording.current = null; setActivity('idle'); }
  }

  useEffect(() => {
    const controller = new AbortController();
    audioRequest('capabilities', { signal: controller.signal }).then(response => response.json()).then((data: AudioCapabilities) => {
      if (controller.signal.aborted) return;
      setCapabilities({ asr: { configured: data.asr?.configured === true }, tts: { configured: data.tts?.configured === true } });
      setConfiguration('云服务由服务端配置；未配置的选项不可选。');
    }).catch(() => { if (!controller.signal.aborted) setConfiguration('无法读取云服务配置，仍可使用浏览器能力和音频试听。'); });
    return () => controller.abort();
  }, []);

  useEffect(() => { cancel(); setActivity('idle'); setNotice(''); setError(''); }, [session?.id, session?.turn.id, busy, asr, tts]);
  useEffect(() => () => { cancel(); if (objectUrl.current) URL.revokeObjectURL(objectUrl.current); }, []);

  async function speak() {
    if (!session || busy) return;
    const controller = begin('speaking');
    try {
      const pieces = [
        ...session.turn.lines.map(line => ({ text: line.text, voice: session.characters.find(character => character.id === line.speaker)?.voiceId })),
        ...session.turn.choices.map((choice, index) => ({ text: `选项 ${index + 1}：${choice.text}`, voice: '' }))
      ];
      for (const piece of pieces) {
        for (let offset = 0; offset < piece.text.length; offset += 4000) {
          if (controller.signal.aborted) return;
          const text = piece.text.slice(offset, offset + 4000);
          if (tts === 'browser') await speakBrowser(text, piece.voice, controller.signal, () => setNotice('部分角色音色在此浏览器中不存在，已使用中文或系统默认声音。'));
          else {
            const response = await audioRequest('speech', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, ...(piece.voice ? { voice: piece.voice } : {}) }), signal: controller.signal });
            await playAudioBlob(await response.blob(), controller.signal);
          }
        }
      }
    } catch (cause) { report(cause, controller); }
    finally { complete(controller); }
  }

  async function recognize() {
    if (!session || session.turn.ended || busy) return;
    const controller = begin(asr === 'browser' ? 'listening' : 'processing');
    try {
      let text: string;
      if (asr === 'browser') text = await browserRecognize(controller.signal);
      else {
        const blob = await recordAudio(controller.signal, finish => {
          finishRecording.current = finish; setActivity('recording');
        });
        if (controller.signal.aborted) return;
        setActivity('processing'); finishRecording.current = null;
        const response = await audioRequest('transcriptions', { method: 'POST', headers: { 'Content-Type': blob.type }, body: blob, signal: controller.signal });
        const data = await response.json();
        if (typeof data.text !== 'string' || !data.text.trim() || data.text.length > 300) throw new Error('识别结果为空或过长，请说出选项序号或完整选项。');
        text = data.text.trim();
      }
      if (!controller.signal.aborted) { onRecognized(text); setNotice('识别结果已填入下方输入框，请确认后提交选择。'); }
    } catch (cause) { report(cause, controller); }
    finally { complete(controller); }
  }

  function replaceAudio(next: string, name: string) {
    cancel(); setActivity('idle'); setError(''); setNotice('');
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    objectUrl.current = next.startsWith('blob:') ? next : null;
    setSource(next); setAudioName(name);
  }

  return <section className="voice-panel" aria-label="语音与音频">
    <div className="voice-heading"><h3>语音与音频</h3><span className="chip">手动试听</span></div>
    <div className="voice-sources">
      <label>朗读来源（TTS）<select value={tts} disabled={busy} onChange={event => setTts(event.target.value as VoiceSource)}>
        <option value="browser">浏览器自带{browserTts ? '' : '（不支持）'}</option><option value="cloud" disabled={!capabilities.tts.configured}>云服务{capabilities.tts.configured ? '（已配置）' : '（未配置）'}</option>
      </select></label>
      <label>识别来源（ASR）<select value={asr} disabled={busy} onChange={event => setAsr(event.target.value as VoiceSource)}>
        <option value="browser">浏览器自带{browserAsr ? '' : '（不支持）'}</option><option value="cloud" disabled={!capabilities.asr.configured}>云服务{capabilities.asr.configured ? '（已配置）' : '（未配置）'}</option>
      </select></label>
    </div>
    <p className="muted voice-hint">{configuration}</p>
    <div className="voice-actions">
      <button disabled={busy || !session || (tts === 'browser' ? !browserTts : !capabilities.tts.configured)} onClick={() => void speak()}>朗读当前回合</button>
      <button disabled={busy || !session || session.turn.ended || !secure || (asr === 'browser' ? !browserAsr : !capabilities.asr.configured || !cloudRecording)} onClick={() => void recognize()}>语音输入</button>
      {activity === 'recording' && <button onClick={() => finishRecording.current?.()}>结束录音并识别</button>}
      <button disabled={busy} onClick={stop}>停止语音与播放</button>
    </div>
    <p className="voice-status" role="status">{activity === 'speaking' ? '正在朗读…' : activity === 'listening' ? '正在聆听，请说出当前选项…' : activity === 'recording' ? '正在录音，最长 60 秒。' : activity === 'processing' ? '正在请求麦克风或识别语音…' : notice || '识别只填写文字，确认提交后才推进剧情。'}</p>
    {!secure && <p className="voice-hint">麦克风需要 localhost 或 HTTPS；局域网 HTTP 地址可使用文字输入和音频试听。</p>}
    {asr === 'browser' && !browserAsr && <p className="voice-hint">此浏览器不支持语音识别，可选择已配置的云服务或手动输入。</p>}
    {asr === 'cloud' && !cloudRecording && <p className="voice-hint">此浏览器不支持所需录音格式，请更换浏览器。</p>}
    {error && <p className="voice-error" role="alert">{error}</p>}
    <details className="voice-audio"><summary>播放一段音频</summary>
      <label>本地音频文件<input type="file" accept="audio/*" disabled={busy} onChange={event => {
        const file = event.target.files?.[0]; event.target.value = '';
        if (!file) return;
        if (!file.type.startsWith('audio/') && !/\.(mp3|wav|ogg|m4a|aac|webm|flac)$/i.test(file.name)) { setError('请选择音频文件。'); return; }
        replaceAudio(URL.createObjectURL(file), file.name);
      }} /></label>
      <form onSubmit={event => { event.preventDefault(); try { replaceAudio(audioUrl(url), '网络音频'); } catch { setError('请输入不含账号密码的 HTTP(S) 音频地址。'); } }}>
        <label>音频地址<input type="url" value={url} disabled={busy} placeholder="https://example.com/audio.mp3" onChange={event => setUrl(event.target.value)} /></label>
        <button disabled={busy || !url.trim()} type="submit">载入音频</button>
      </form>
      {source && <><p className="voice-hint">{audioName}</p><audio ref={attachPlayer} src={source} controls preload="none" aria-label="音频播放器" onPlay={() => {
        if (busy) { player.current?.pause(); return; }
        cancel(false); setActivity('idle'); setError(''); setNotice('正在播放试听音频。');
      }} onError={() => setError('音频无法播放，请检查地址、网络或文件格式。')} /></>}
      <p className="muted voice-hint">本地试听不上传文件；网络音频由浏览器直接访问。剧本中的音频标签暂不自动播放。</p>
    </details>
    <p className="muted voice-hint">浏览器识别可能使用厂商在线服务；云模式会发送台词或录音到配置的服务，可能产生费用。</p>
  </section>;
}
