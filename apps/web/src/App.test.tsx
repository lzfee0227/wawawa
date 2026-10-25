import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { api, ApiError, type Draft, type Session } from './api';
import { sampleCharacters, sampleSource } from './sample';

vi.mock('./api', async importOriginal => ({ ...await importOriginal<typeof import('./api')>(), api: vi.fn() }));
const request = vi.mocked(api);
const draft: Draft = { id: 'story-1', title: '雨夜来信', source: sampleSource, characters: sampleCharacters, revision: 1, updatedAt: '2026-10-24T00:00:00Z' };
const version = { id: 'version-1', storyId: 'story-1', number: 1, createdAt: '2026-10-24T00:00:00Z' };
const session: Session = {
  id: 'session-1', storyId: 'story-1', versionId: 'version-1', versionNumber: 1, revision: 0,
  characters: sampleCharacters, variables: { affection: 0, kept_secret: false }, updatedAt: '2026-10-24T00:00:00Z',
  turn: { id: 'turn-1', ended: false, lines: [
    { text: '雨敲打着末班车站。', tags: [], speaker: 'narrator', music: 'rain' },
    { text: '这封信的事，可以先不要告诉别人吗？', tags: [], speaker: 'lin', emotion: 'nervous', audio: 'line_1' }
  ], choices: [{ id: 'c1', index: 0, text: '答应保密' }, { id: 'c2', index: 1, text: '拒绝保密' }] }
};
const ending: Session = { ...session, revision: 1, variables: { affection: 1, kept_secret: true }, turn: { id: 'turn-2', ended: true, choices: [], lines: [{ text: '结局：共同的秘密。', tags: [] }] } };
type Handler = (path: string, method?: string, body?: unknown) => unknown;

function mockApi(override?: Handler) {
  request.mockImplementation(async (path, method = 'GET', body) => {
    const custom = override?.(path, method, body);
    if (custom !== undefined) return await custom as never;
    if (path === '/stories' && method === 'GET') return [structuredClone(draft)] as never;
    if (path === '/stories' && method === 'POST') return { ...draft, ...(body as object) } as never;
    if (path === '/stories/story-1/versions') return [version] as never;
    if (path === '/stories/story-1' && method === 'GET') return structuredClone(draft) as never;
    if (path === '/stories/story-1' && method === 'PUT') return { ...draft, ...(body as object), revision: 2 } as never;
    if (path === '/compile') return { ok: true, diagnostics: [] } as never;
    if (path === '/stories/story-1/publish') return { ...version, id: 'version-2', number: 2 } as never;
    if (path === '/sessions' || path === '/sessions/session-1') return structuredClone(session) as never;
    if (path === '/sessions/session-1/choices') return structuredClone(ending) as never;
    throw new Error(`Unhandled ${method} ${path}`);
  });
}

async function loaded() {
  render(<App />);
  await screen.findByLabelText('Ink 剧本');
}
async function play(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('tab', { name: '02 对话模拟器' }));
  await user.click(screen.getByRole('button', { name: '开始模拟' }));
  await screen.findByText('这封信的事，可以先不要告诉别人吗？');
}

beforeEach(() => { request.mockReset(); vi.restoreAllMocks(); mockApi(); });

describe('authoring acceptance R01-R04', () => {
  it('creates the sample from an empty bookshelf', async () => {
    mockApi((path, method) => path === '/stories' && method === 'GET' ? [] : undefined);
    const user = userEvent.setup(); render(<App />);
    await user.click(await screen.findByRole('button', { name: '创建第一个故事' }));
    expect(await screen.findByLabelText('Ink 剧本')).toHaveValue(sampleSource);
    expect(request).toHaveBeenCalledWith('/stories', 'POST', expect.objectContaining({ characters: sampleCharacters }));
    expect(screen.getByText(/音色 ID 仅作为配置保存/)).toBeInTheDocument();
  });

  it('creates a blank template without sample characters', async () => {
    const user = userEvent.setup(); await loaded();
    await user.click(screen.getByRole('button', { name: /新建空白故事/ }));
    await screen.findByText(/空白草稿已创建/);
    expect(request).toHaveBeenCalledWith('/stories', 'POST', { title: '未命名故事', source: '// 在这里编写故事\n-> END\n', characters: [] });
    expect(screen.queryByLabelText('角色 1 名称')).not.toBeInTheDocument();
  });

  it('imports an independent source draft and never publishes automatically', async () => {
    const user = userEvent.setup(); await loaded();
    const source = '你好 # speaker:guide\n* [继续]\n    -> END\n';
    await user.upload(screen.getByLabelText('导入 Ink 文件'), new File([source], '新故事.ink', { type: 'text/plain' }));
    await screen.findByText(/已导入为独立草稿/);
    expect(request).toHaveBeenCalledWith('/stories', 'POST', { title: '新故事', source, characters: [] });
    expect(screen.getByLabelText('Ink 剧本')).toHaveValue(source);
    expect(request.mock.calls.some(call => call[0].endsWith('/publish') || call[1] === 'PUT')).toBe(false);
  });

  it('rejects empty, oversized and unsupported imports without changing the current story', async () => {
    const user = userEvent.setup({ applyAccept: false }); await loaded();
    const input = screen.getByLabelText('导入 Ink 文件');
    await user.upload(input, new File([' '], 'empty.ink'));
    expect(await screen.findByRole('alert')).toHaveTextContent('剧本不能为空');
    await user.upload(input, new File(['a'.repeat(100001)], 'long.ink'));
    expect(await screen.findByRole('alert')).toHaveTextContent('不得超过 100000');
    await user.upload(input, new File(['a'.repeat(400001)], 'huge.ink'));
    expect(await screen.findByRole('alert')).toHaveTextContent('400000 字节');
    await user.upload(input, new File(['text'], 'wrong.json'));
    expect(await screen.findByRole('alert')).toHaveTextContent('请选择 .ink');
    expect(screen.getByLabelText('Ink 剧本')).toHaveValue(sampleSource);
    expect(request.mock.calls.some(call => call[1] === 'POST')).toBe(false);
  });

  it('preserves unsaved content when leaving for blank or imported stories is cancelled', async () => {
    const user = userEvent.setup(); await loaded();
    fireEvent.change(screen.getByLabelText('Ink 剧本'), { target: { value: '未保存内容' } });
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    await user.click(screen.getByRole('button', { name: /新建空白故事/ }));
    await user.upload(screen.getByLabelText('导入 Ink 文件'), new File(['结束\n-> END'], 'new.ink'));
    expect(screen.getByLabelText('Ink 剧本')).toHaveValue('未保存内容');
    expect(request.mock.calls.some(call => call[1] === 'POST')).toBe(false);
  });

  it('keeps the editor when importing fails to save on the server', async () => {
    mockApi((path, method) => path === '/stories' && method === 'POST' ? Promise.reject(new Error('服务暂时不可用')) : undefined);
    const user = userEvent.setup(); await loaded();
    await user.upload(screen.getByLabelText('导入 Ink 文件'), new File(['结束\n-> END'], 'new.ink'));
    expect(await screen.findByRole('alert')).toHaveTextContent('服务暂时不可用');
    expect(screen.getByLabelText('Ink 剧本')).toHaveValue(sampleSource);
  });

  it('edits title/source/characters and saves the revision', async () => {
    const user = userEvent.setup(); await loaded();
    fireEvent.change(screen.getByLabelText('剧本名称'), { target: { value: '新的来信' } });
    fireEvent.change(screen.getByLabelText('Ink 剧本'), { target: { value: '新的故事\n-> END' } });
    fireEvent.change(screen.getByLabelText('角色 1 标识'), { target: { value: 'guide' } });
    fireEvent.change(screen.getByLabelText('角色 1 名称'), { target: { value: '引路人' } });
    fireEvent.change(screen.getByLabelText('角色 1 音色'), { target: { value: 'voice_guide' } });
    expect(screen.getByText('● 有未保存修改')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /添加角色/ }));
    expect(screen.getByLabelText('角色 3 名称')).toHaveValue('新角色');
    await user.click(screen.getByRole('button', { name: '移除角色 3' }));
    await user.click(screen.getByRole('button', { name: '保存草稿' }));
    await screen.findByText('草稿已保存。');
    expect(request).toHaveBeenCalledWith('/stories/story-1', 'PUT', { title: '新的来信', source: '新的故事\n-> END', revision: 1, characters: [{ id: 'guide', name: '引路人', voiceId: 'voice_guide' }, sampleCharacters[1]] });
    expect(screen.getByText('已保存 · r2')).toBeInTheDocument();
  });

  it('shows compiler diagnostics without discarding source', async () => {
    mockApi(path => path === '/compile' ? { ok: false, diagnostics: [{ severity: 'error', message: 'ERROR line 3' }, { severity: 'warning', message: '未使用节点' }] } : undefined);
    const user = userEvent.setup(); await loaded();
    await user.click(screen.getByRole('button', { name: '编译检查' }));
    expect(await screen.findByText('编译失败，尚未发布')).toBeInTheDocument();
    expect(screen.getByText('错误：ERROR line 3')).toBeInTheDocument();
    expect(screen.getByText('警告：未使用节点')).toBeInTheDocument();
    expect(screen.getByLabelText('Ink 剧本')).toHaveValue(sampleSource);
  });

  it('publishes only after save and uses the saved revision', async () => {
    const user = userEvent.setup(); await loaded();
    await user.click(screen.getByRole('button', { name: '编译检查' }));
    await screen.findByText('编译通过');
    await user.click(screen.getByRole('button', { name: '保存并发布' }));
    await screen.findByText(/版本 v2 已发布/);
    expect(request).toHaveBeenCalledWith('/stories/story-1/publish', 'POST', { revision: 2 });
    const saveCall = request.mock.calls.findIndex(call => call[1] === 'PUT');
    const publishCall = request.mock.calls.findIndex(call => call[0].endsWith('/publish'));
    expect(saveCall).toBeLessThan(publishCall);
  });

  it('starts a simulator session from the selected immutable release', async () => {
    const user = userEvent.setup(); await loaded();
    await user.click(screen.getByRole('button', { name: '从 v1 开始模拟' }));
    await screen.findByText(/已开始已发布版本 v1/);
    expect(request).toHaveBeenCalledWith('/sessions', 'POST', { storyId: 'story-1', versionId: 'version-1' });
    expect(screen.getByRole('tab', { name: '02 对话模拟器' })).toHaveAttribute('aria-selected', 'true');
  });

  it('surfaces a publishing error and allows dismissing it', async () => {
    mockApi(path => path.endsWith('/publish') ? Promise.reject(new ApiError('剧情存在错误', 422, [{ severity: 'error', message: '无法解析' }])) : undefined);
    const user = userEvent.setup(); await loaded();
    await user.click(screen.getByRole('button', { name: '保存并发布' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('剧情存在错误');
    expect(screen.getByText('错误：无法解析')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '关闭错误提示' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('explains a stale draft revision without discarding edits', async () => {
    mockApi((path, method) => path === '/stories/story-1' && method === 'PUT' ? Promise.reject(new ApiError('草稿已被修改', 409)) : undefined);
    const user = userEvent.setup(); await loaded();
    fireEvent.change(screen.getByLabelText('剧本名称'), { target: { value: '待保留的修改' } });
    await user.click(screen.getByRole('button', { name: '保存草稿' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('请先复制未保存内容');
    expect(screen.getByLabelText('剧本名称')).toHaveValue('待保留的修改');
    expect(screen.getByText('● 有未保存修改')).toBeInTheDocument();
  });

  it('creates another sample and remembers the selected story', async () => {
    mockApi((path, method, body) => {
      if (path === '/stories' && method === 'POST') return { ...draft, ...(body as object), id: 'story-2' };
      if (path === '/stories/story-2/versions') return [];
    });
    const user = userEvent.setup(); await loaded();
    const before = request.mock.calls.length;
    await user.click(screen.getByRole('button', { name: /雨夜来信.*草稿/ }));
    expect(request.mock.calls).toHaveLength(before);
    await user.click(screen.getByRole('button', { name: /新建示例故事/ }));
    await waitFor(() => expect(screen.getByLabelText('剧本名称')).toHaveValue('雨夜来信 · 2'));
    expect(localStorage.getItem('wawawa.selectedStory')).toBe('story-2');
  });

  it('prevents leaving unsaved changes unless confirmed', async () => {
    const second = { ...draft, id: 'story-2', title: '另一封信' };
    mockApi((path, method) => {
      if (path === '/stories' && method === 'GET') return [draft, second];
      if (path === '/stories/story-2') return second;
      if (path === '/stories/story-2/versions') return [];
    });
    const user = userEvent.setup(); await loaded();
    fireEvent.change(screen.getByLabelText('剧本名称'), { target: { value: '尚未保存' } });
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    await user.click(screen.getByRole('button', { name: /另一封信/ }));
    expect(screen.getByLabelText('剧本名称')).toHaveValue('尚未保存');
    await user.click(screen.getByRole('button', { name: /新建示例故事/ }));
    expect(confirm).toHaveBeenCalledTimes(2);
    const event = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(event); expect(event.defaultPrevented).toBe(true);
    confirm.mockReturnValue(true);
    await user.click(screen.getByRole('button', { name: /另一封信/ }));
    await waitFor(() => expect(screen.getByLabelText('剧本名称')).toHaveValue('另一封信'));
    await user.click(screen.getByRole('tab', { name: '02 对话模拟器' }));
    expect(screen.getByRole('button', { name: '开始模拟' })).toBeDisabled();
  });
});

describe('simulated play acceptance R05-R09', () => {
  it('renders characters, submits a choice with turn protection, and shows ending', async () => {
    const user = userEvent.setup(); await loaded(); await play(user);
    expect(screen.getByText('林小姐')).toBeInTheDocument();
    expect(screen.getByText(/音乐提示：rain/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /1 答应保密/ }));
    expect(await screen.findByText('结局：共同的秘密。')).toBeInTheDocument();
    expect(request).toHaveBeenCalledWith('/sessions/session-1/choices', 'POST', expect.objectContaining({ turnId: 'turn-1', revision: 0, requestId: expect.any(String), choiceId: 'c1' }));
    expect(localStorage.getItem('wawawa.session.story-1')).toBe('session-1');
    expect(screen.getByText('你的选择')).toBeInTheDocument();
    await user.click(screen.getByText('调试状态'));
    expect(screen.getByText(/"kept_secret": true/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '重新开始' }));
    await screen.findByRole('button', { name: /1 答应保密/ });
    expect(screen.queryByText('结局：共同的秘密。')).not.toBeInTheDocument();
  });

  it('accepts simulated speech input and preserves state after unrecognized input', async () => {
    let reject = true;
    mockApi(path => path.endsWith('/choices') && reject ? Promise.reject(new ApiError('请选择当前选项', 400)) : undefined);
    const user = userEvent.setup(); await loaded(); await play(user);
    expect(screen.getByRole('button', { name: '提交选择' })).toBeDisabled();
    await user.type(screen.getByLabelText('语音识别后的文字'), '随便聊聊');
    await user.click(screen.getByRole('button', { name: '提交选择' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('请选择当前选项');
    expect(screen.getByRole('button', { name: /1 答应保密/ })).toBeEnabled();
    reject = false;
    await user.clear(screen.getByLabelText('语音识别后的文字'));
    await user.type(screen.getByLabelText('语音识别后的文字'), '第二个');
    await user.click(screen.getByRole('button', { name: '提交选择' }));
    await screen.findByText('结局：共同的秘密。');
    expect(request).toHaveBeenLastCalledWith('/sessions/session-1/choices', 'POST', expect.objectContaining({ input: '第二个' }));
  });

  it('reuses idempotency request ID when retrying the same failed choice', async () => {
    let failures = 1;
    mockApi(path => path.endsWith('/choices') && failures-- > 0 ? Promise.reject(new Error('连接中断')) : undefined);
    const user = userEvent.setup(); await loaded(); await play(user);
    await user.click(screen.getByRole('button', { name: /1 答应保密/ }));
    await screen.findByRole('alert');
    await user.click(screen.getByRole('button', { name: /1 答应保密/ }));
    await screen.findByText('结局：共同的秘密。');
    const calls = request.mock.calls.filter(call => call[0].endsWith('/choices'));
    expect(calls).toHaveLength(2); expect(calls[0][2]).toEqual(calls[1][2]);
  });

  it('restores a saved session on load and can repeat without advancing', async () => {
    localStorage.setItem('wawawa.session.story-1', 'session-1');
    const user = userEvent.setup(); await loaded();
    await screen.findByText(/已恢复上次进度/);
    await user.click(screen.getByRole('tab', { name: '02 对话模拟器' }));
    await user.click(screen.getByRole('button', { name: '恢复当前回合' }));
    await screen.findByText('已从服务端恢复当前回合，剧情未推进。');
    expect(screen.getAllByText('这封信的事，可以先不要告诉别人吗？')).toHaveLength(1);
    expect(request.mock.calls.filter(call => call[0].endsWith('/choices'))).toHaveLength(0);
    await user.click(screen.getByRole('button', { name: '新开一局' }));
    await waitFor(() => expect(request).toHaveBeenCalledWith('/sessions', 'POST', { storyId: 'story-1' }));
  });

  it('clears only missing saved sessions and reports other restore failures', async () => {
    localStorage.setItem('wawawa.session.story-1', 'missing');
    mockApi(path => path === '/sessions/missing' ? Promise.reject(new ApiError('存档不存在', 404)) : undefined);
    await loaded();
    await waitFor(() => expect(localStorage.getItem('wawawa.session.story-1')).toBeNull());
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('retains the save reference when restoration fails temporarily', async () => {
    localStorage.setItem('wawawa.session.story-1', 'session-1');
    mockApi(path => path === '/sessions/session-1' ? Promise.reject(new ApiError('服务暂时不可用', 503)) : undefined);
    await loaded();
    expect(await screen.findByRole('alert')).toHaveTextContent('服务暂时不可用');
    expect(localStorage.getItem('wawawa.session.story-1')).toBe('session-1');
  });

  it('restores the selected bookshelf item rather than always choosing the first', async () => {
    const second = { ...draft, id: 'story-2', title: '另一封信' };
    localStorage.setItem('wawawa.selectedStory', 'story-2');
    mockApi((path, method) => {
      if (path === '/stories' && method === 'GET') return [draft, second];
      if (path === '/stories/story-2/versions') return [];
    });
    await loaded();
    expect(screen.getByLabelText('剧本名称')).toHaveValue('另一封信');
  });

  it('reports backend outage instead of pretending persistence succeeded', async () => {
    request.mockRejectedValue(new Error('无法连接 MongoDB'));
    render(<App />);
    expect(await screen.findByRole('alert')).toHaveTextContent('无法连接 MongoDB');
    expect(await screen.findByRole('button', { name: '创建第一个故事' })).toBeEnabled();
  });

  it('opens the MCP console as a protocol check rather than playback', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const user = userEvent.setup();
    await loaded();
    await user.click(screen.getByRole('tab', { name: '03 MCP 测试' }));
    expect(screen.getByRole('region', { name: 'MCP 测试台' })).toBeInTheDocument();
    expect(screen.getByText(/不是语言模型在游玩/)).toBeInTheDocument();
    expect(screen.getByText(/这里不会播放/)).toBeInTheDocument();
    expect(await screen.findByRole('alert')).toHaveTextContent('无法连接本机 MCP 服务。');
  });
});
