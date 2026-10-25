import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Session } from './api';
import { VoicePanel } from './VoicePanel';
import type { RecognitionEvent } from './voice';

const session: Session = { id: 's', storyId: 'story', versionId: 'v', versionNumber: 1, revision: 0, variables: {}, updatedAt: '',
  characters: [{ id: 'lin', name: '林', voiceId: 'LinVoice' }], turn: { id: 't', ended: false, lines: [{ text: '你好', speaker: 'lin', tags: [] }], choices: [{ id: 'c', index: 0, text: '保密' }] } };
let utterances: FakeUtterance[];
class FakeUtterance {
  lang = ''; voice: unknown = null; onend: (() => void) | null = null; onerror: (() => void) | null = null;
  constructor(public text: string) { utterances.push(this); }
}
let recognition: FakeRecognition;
class FakeRecognition {
  lang = ''; continuous = false; interimResults = false;
  onresult: ((event: RecognitionEvent) => void) | null = null; onerror: ((event: { error: string }) => void) | null = null; onend: (() => void) | null = null;
  start = vi.fn(); abort = vi.fn(); constructor() { recognition = this; }
}
const fetchMock = vi.fn();
const pause = vi.fn();
let cloud = false;
beforeEach(() => {
  utterances = []; cloud = false;
  vi.stubGlobal('fetch', fetchMock.mockReset().mockImplementation(async () => new Response(JSON.stringify({ asr: { configured: cloud }, tts: { configured: cloud } }), { headers: { 'Content-Type': 'application/json' } })));
  vi.stubGlobal('isSecureContext', true);
  vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);
  vi.stubGlobal('SpeechRecognition', FakeRecognition);
  vi.stubGlobal('speechSynthesis', { getVoices: () => [{ voiceURI: 'LinVoice', name: 'Lin', lang: 'zh-CN' }], speak: vi.fn(), cancel: vi.fn() });
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(pause.mockReset());
  vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
  vi.stubGlobal('URL', class extends URL { static createObjectURL = vi.fn(() => 'blob:test'); static revokeObjectURL = vi.fn(); });
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
async function mounted(props: Partial<React.ComponentProps<typeof VoicePanel>> = {}) {
  const callback = vi.fn(); const view = render(<VoicePanel session={session} busy={false} onRecognized={callback} {...props} />);
  await screen.findByText('云服务由服务端配置；未配置的选项不可选。');
  return { ...view, callback, user: userEvent.setup() };
}

describe('simulator speech A01–A05', () => {
  it('lists independent sources, disables missing cloud capabilities and detects insecure microphones', async () => {
    vi.stubGlobal('isSecureContext', false); vi.stubGlobal('SpeechRecognition', undefined);
    await mounted();
    expect(screen.getAllByRole('option', { name: '云服务（未配置）' })).toHaveLength(2);
    screen.getAllByRole('option', { name: '云服务（未配置）' }).forEach(option => expect(option).toBeDisabled());
    expect(screen.getByRole('button', { name: '语音输入' })).toBeDisabled();
    expect(screen.getByText(/麦克风需要 localhost 或 HTTPS/)).toBeInTheDocument();
  });

  it('reads current lines with character voice, then choices, without advancing the game', async () => {
    const { user, callback } = await mounted();
    await user.click(screen.getByRole('button', { name: '朗读当前回合' }));
    expect(utterances[0].text).toBe('你好'); expect(utterances[0].voice).toMatchObject({ voiceURI: 'LinVoice' });
    await act(async () => utterances[0].onend?.());
    expect(utterances[1].text).toBe('选项 1：保密');
    await act(async () => utterances[1].onend?.());
    expect(callback).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('reports unknown browser voice fallback and cancels old speech when the turn changes', async () => {
    const invalidVoice = { ...session, characters: [{ id: 'lin', name: '林', voiceId: 'missing' }] };
    const { user, rerender } = await mounted({ session: invalidVoice });
    await user.click(screen.getByRole('button', { name: '朗读当前回合' }));
    const lateEnd = utterances[0].onend;
    rerender(<VoicePanel session={{ ...session, turn: { ...session.turn, id: 't2' } }} busy={false} onRecognized={vi.fn()} />);
    await act(async () => lateEnd?.());
    expect(speechSynthesis.cancel).toHaveBeenCalled(); expect(utterances).toHaveLength(1);
  });

  it('fills a recognized choice only after recognition and discards cancelled late results', async () => {
    const { user, callback, rerender } = await mounted();
    await user.click(screen.getByRole('button', { name: '语音输入' }));
    await act(async () => recognition.onresult?.({ results: [[{ transcript: '第一个' }]] }));
    expect(callback).toHaveBeenCalledWith('第一个');
    expect(screen.getByText(/识别结果已填入下方输入框/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '语音输入' }));
    const oldResult = recognition.onresult;
    rerender(<VoicePanel session={session} busy onRecognized={callback} />);
    await act(async () => oldResult?.({ results: [[{ transcript: '第二个' }]] }));
    expect(callback).toHaveBeenCalledTimes(1);
    expect(recognition.abort).toHaveBeenCalled();
  });

  it('shows permission denial, then lets the user retry', async () => {
    const { user } = await mounted();
    await user.click(screen.getByRole('button', { name: '语音输入' }));
    await act(async () => recognition.onerror?.({ error: 'not-allowed' }));
    expect(screen.getByRole('alert')).toHaveTextContent('权限被拒绝');
    await user.click(screen.getByRole('button', { name: '语音输入' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '停止语音与播放' }));
    expect(screen.getByRole('status')).toHaveTextContent('已停止');
  });

  it('discards late cloud synthesis after changing source, and keeps source selections independent', async () => {
    cloud = true;
    const { user } = await mounted();
    let resolve!: (response: Response) => void;
    fetchMock.mockImplementationOnce(() => new Promise<Response>(done => { resolve = done; }));
    await user.selectOptions(screen.getByLabelText('朗读来源（TTS）'), 'cloud');
    expect(screen.getByLabelText('识别来源（ASR）')).toHaveValue('browser');
    await user.click(screen.getByRole('button', { name: '朗读当前回合' }));
    expect(fetchMock).toHaveBeenLastCalledWith('/api/audio/speech', expect.objectContaining({ body: JSON.stringify({ text: '你好', voice: 'LinVoice' }) }));
    await user.selectOptions(screen.getByLabelText('朗读来源（TTS）'), 'browser');
    await act(async () => resolve(new Response(new Blob(['mp3'], { type: 'audio/mpeg' }))));
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it('reports cloud failures without secretly using browser synthesis', async () => {
    cloud = true;
    const { user } = await mounted();
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ error: { message: '云服务拒绝请求' } }), { status: 502 }));
    await user.selectOptions(screen.getByLabelText('朗读来源（TTS）'), 'cloud');
    await user.click(screen.getByRole('button', { name: '朗读当前回合' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('云服务拒绝请求'); expect(utterances).toHaveLength(0);
  });

  it('uploads cloud recording only after finish, fills valid text, and rejects invalid responses', async () => {
    cloud = true;
    let recorder: FakeRecorder;
    class FakeRecorder {
      static isTypeSupported = () => true;
      state = 'inactive'; ondataavailable: ((event: { data: Blob }) => void) | null = null;
      onstop: (() => void) | null = null; onerror: (() => void) | null = null;
      constructor() { recorder = this; }
      start() { this.state = 'recording'; }
      stop() { this.state = 'inactive'; this.ondataavailable?.({ data: new Blob(['recording']) }); this.onstop?.(); }
    }
    const trackStop = vi.fn();
    vi.stubGlobal('MediaRecorder', FakeRecorder);
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [{ stop: trackStop }] }) } });
    const { user, callback } = await mounted();
    await user.selectOptions(screen.getByLabelText('识别来源（ASR）'), 'cloud');
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ text: '第二个' })));
    await user.click(screen.getByRole('button', { name: '语音输入' }));
    expect(await screen.findByRole('button', { name: '结束录音并识别' })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole('button', { name: '结束录音并识别' }));
    await waitFor(() => expect(callback).toHaveBeenCalledWith('第二个'));
    expect(fetchMock).toHaveBeenLastCalledWith('/api/audio/transcriptions', expect.objectContaining({ method: 'POST', headers: { 'Content-Type': 'audio/webm;codecs=opus' }, body: expect.any(Blob) }));
    expect(trackStop).toHaveBeenCalledTimes(1);
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ text: '' })));
    await user.click(screen.getByRole('button', { name: '语音输入' }));
    await user.click(await screen.findByRole('button', { name: '结束录音并识别' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('识别结果为空或过长');
    expect(callback).toHaveBeenCalledTimes(1);
    expect(recorder!.state).toBe('inactive');
  });

  it('plays local files without uploading, stops speech on playback and releases files on replacement/unmount', async () => {
    const { user, unmount } = await mounted();
    await user.click(screen.getByText('播放一段音频'));
    await user.upload(screen.getByLabelText('本地音频文件'), new File(['sound'], 'voice.mp3', { type: 'audio/mpeg' }));
    const audio = screen.getByLabelText('音频播放器'); expect(audio).toHaveAttribute('src', 'blob:test');
    await user.click(screen.getByRole('button', { name: '朗读当前回合' }));
    fireEvent.play(audio);
    expect(speechSynthesis.cancel).toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    fireEvent.change(screen.getByLabelText('音频地址'), { target: { value: 'https://example.com/voice.mp3' } });
    await user.click(screen.getByRole('button', { name: '载入音频' }));
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test');
    expect(audio).toHaveAttribute('src', 'https://example.com/voice.mp3');
    fireEvent.error(audio); expect(screen.getByRole('alert')).toHaveTextContent('音频无法播放');
    pause.mockClear(); unmount(); expect(pause).toHaveBeenCalledTimes(1);
    expect(audio).not.toHaveAttribute('src');
  });

  it('rejects unsafe audio URLs and unsupported local files', async () => {
    const { user } = await mounted();
    await user.click(screen.getByText('播放一段音频'));
    fireEvent.change(screen.getByLabelText('音频地址'), { target: { value: 'https://user:password@example.com/a' } });
    await user.click(screen.getByRole('button', { name: '载入音频' }));
    expect(screen.getByRole('alert')).toHaveTextContent('不含账号密码');
    fireEvent.change(screen.getByLabelText('本地音频文件'), { target: { files: [new File(['x'], 'file.txt', { type: 'text/plain' })] } });
    expect(screen.getByRole('alert')).toHaveTextContent('请选择音频文件');
    expect(screen.queryByLabelText('音频播放器')).not.toBeInTheDocument();
  });

  it('keeps local/browser functions available when capabilities fail', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));
    render(<VoicePanel session={null} busy={false} onRecognized={vi.fn()} />);
    expect(await screen.findByText(/无法读取云服务配置/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '朗读当前回合' })).toBeDisabled();
  });
});
