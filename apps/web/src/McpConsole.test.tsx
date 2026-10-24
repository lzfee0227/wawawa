import { StrictMode } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { McpConsole } from './McpConsole';
import type { PlaySnapshot } from './mcp-client';

const mcp = vi.hoisted(() => ({
  listTools: vi.fn(),
  playTurnPrompt: vi.fn(),
  listStories: vi.fn(),
  startSession: vi.fn(),
  getSession: vi.fn(),
  choose: vi.fn(),
}));

vi.mock('./mcp-client', () => ({
  StudioMcpClient: class {
    listTools() { return mcp.listTools(); }
    playTurnPrompt() { return mcp.playTurnPrompt(); }
    listStories() { return mcp.listStories(); }
    startSession(storyId: string) { return mcp.startSession(storyId); }
    getSession(sessionId: string) { return mcp.getSession(sessionId); }
    choose(request: unknown) { return mcp.choose(request); }
  },
}));

const tools = [
  { name: 'list_stories', title: '列出已发布故事' },
  { name: 'start_session', title: '开始游玩' },
  { name: 'get_session', title: '读取当前回合' },
  { name: 'choose_option', title: '提交选项' },
];
const prompt = '照读工具返回的台词，并保留说话人。\n只呈现本次返回的选项。禁止编造选项。\n禁止声称已播放声音。';
const story = { id: 'story-1', title: '雨夜来信', latestVersionNumber: 2 };
const opened: PlaySnapshot = {
  sessionId: 'session-1', storyId: 'story-1', versionId: 'version-1', versionNumber: 2, revision: 4, updatedAt: '2026-10-24T00:00:00Z',
  turnId: 'turn-1', ended: false,
  lines: [
    { text: '只来自工具的开场。', tags: [], speaker: 'narrator', speakerName: '旁白', music: 'rain' },
    { text: '只来自工具的问句。', tags: [], speaker: 'lin', speakerName: '林小姐', emotion: 'nervous', audio: 'line_1' },
  ],
  choices: [{ id: 'c1', index: 0, text: '答应保密' }, { id: 'c2', index: 1, text: '拒绝保密' }],
  characters: [{ id: 'lin', name: '林小姐', voiceId: 'voice_lin' }],
  variables: { affection: 0 },
};
const advanced: PlaySnapshot = { ...opened, revision: 5, turnId: 'turn-2', lines: [{ text: '只来自工具的下一句。', tags: [], speakerName: '旁白' }], choices: [{ id: 'c3', index: 0, text: '把伞借给她' }] };

beforeEach(() => {
  vi.clearAllMocks();
  mcp.listTools.mockResolvedValue(tools);
  mcp.playTurnPrompt.mockResolvedValue(prompt);
  mcp.listStories.mockResolvedValue([story]);
  mcp.startSession.mockResolvedValue(opened);
  mcp.getSession.mockResolvedValue(opened);
  mcp.choose.mockResolvedValue(advanced);
});

async function ready() {
  render(<McpConsole />);
    await screen.findByRole('list', { name: 'MCP 工具' });
}

describe('MCP console C01–C05', () => {
  it('shows the protocol boundary, tools and play_turn constraints', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    await ready();
    expect(screen.getByRole('region', { name: 'MCP 测试台' })).toBeInTheDocument();
    expect(screen.getByText(/不是语言模型在游玩/)).toBeInTheDocument();
    expect(screen.getByText(/这里不会播放/)).toBeInTheDocument();
    const toolList = screen.getByRole('list', { name: 'MCP 工具' });
    for (const name of ['list_stories', 'start_session', 'get_session', 'choose_option']) expect(within(toolList).getByText(name)).toBeInTheDocument();
    const shown = screen.getByLabelText('play_turn 提示');
    expect(shown).toHaveTextContent('照读工具返回的台词');
    expect(shown).toHaveTextContent('禁止编造选项');
    expect(shown).toHaveTextContent('禁止声称已播放声音');
    expect(setItem).not.toHaveBeenCalled();
  });

  it('renders only the snapshot returned when a published story starts', async () => {
    const user = userEvent.setup();
    await ready();
    await user.click(screen.getByRole('button', { name: /开始「雨夜来信」/ }));
    expect(await screen.findByText('只来自工具的开场。')).toBeInTheDocument();
    expect(screen.getByText('林小姐')).toBeInTheDocument();
    expect(screen.getByText('演出元数据 · 音乐 rain')).toBeInTheDocument();
    expect(screen.getByText('演出元数据 · 音频 line_1')).toBeInTheDocument();
    expect(screen.getByText(/音色元数据 voice_lin/)).toBeInTheDocument();
    expect(screen.getByText('回合 turn-1')).toBeInTheDocument();
    expect(mcp.startSession).toHaveBeenCalledWith('story-1');
    expect(screen.queryByText('只来自工具的下一句。')).not.toBeInTheDocument();
  });

  it('advances through choose_option and keeps the turn when the tool rejects input', async () => {
    const user = userEvent.setup();
    await ready();
    await user.click(screen.getByRole('button', { name: /开始「雨夜来信」/ }));
    await screen.findByRole('button', { name: /答应保密/ });
    await user.click(screen.getByRole('button', { name: /答应保密/ }));
    expect(await screen.findByText('只来自工具的下一句。')).toBeInTheDocument();
    expect(screen.getByText(/修订 5/)).toBeInTheDocument();
    const first = mcp.choose.mock.calls[0][0] as { choiceId: string; requestId: string; turnId: string };
    expect(first).toMatchObject({ sessionId: 'session-1', turnId: 'turn-1', revision: 4, choiceId: 'c1' });
    expect(first.requestId).toEqual(expect.any(String));

    mcp.choose.mockRejectedValueOnce(new Error('INVALID_CHOICE: 请说当前选项'));
    await user.type(screen.getByLabelText('发给工具的原话'), '飞向月球');
    await user.click(screen.getByRole('button', { name: '提交原话' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('INVALID_CHOICE: 请说当前选项');
    expect(screen.getByRole('button', { name: /把伞借给她/ })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '关闭错误提示' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByText('回合 turn-2')).toBeInTheDocument();
    const second = mcp.choose.mock.calls[1][0] as { input: string; requestId: string };
    expect(second.input).toBe('飞向月球');
    expect(second.requestId).not.toBe(first.requestId);
  });

  it('reads the same turn again without asking the story to advance', async () => {
    const user = userEvent.setup();
    await ready();
    await user.click(screen.getByRole('button', { name: /开始「雨夜来信」/ }));
    await screen.findByText('回合 turn-1');
    await user.click(screen.getByRole('button', { name: '读取当前回合' }));
    expect(await screen.findByText('get_session', { selector: 'p' })).toBeInTheDocument();
    expect(screen.getByText('回合 turn-1')).toBeInTheDocument();
    expect(screen.getByText(/修订 4/)).toBeInTheDocument();
    expect(mcp.getSession).toHaveBeenCalledWith('session-1');
    expect(mcp.choose).not.toHaveBeenCalled();
  });

  it('keeps the tool list when the effect runs twice', async () => {
    render(<StrictMode><McpConsole /></StrictMode>);
    expect(await screen.findByRole('list', { name: 'MCP 工具' })).toBeInTheDocument();
    expect(screen.getByLabelText('play_turn 提示')).toHaveTextContent('禁止编造选项');
  });

  it('explains an empty published list and can refresh it', async () => {
    mcp.listStories.mockResolvedValueOnce([]);
    const user = userEvent.setup();
    render(<McpConsole />);
    expect(await screen.findByText(/还没有已发布故事/)).toBeInTheDocument();
    mcp.listStories.mockResolvedValueOnce([story]);
    await user.click(screen.getByRole('button', { name: '刷新已发布故事' }));
    expect(await screen.findByRole('button', { name: /开始「雨夜来信」/ })).toBeInTheDocument();
  });
});
