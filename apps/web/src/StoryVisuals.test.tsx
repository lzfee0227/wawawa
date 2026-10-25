import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { StoryVisuals } from './StoryVisuals';
import { api, type Draft } from './api';

vi.mock('./api', async original => ({ ...await original<typeof import('./api')>(), api: vi.fn() }));
// Geometry and pan/zoom are checked in the real browser; keep request-state tests independent of layout APIs.
vi.mock('@xyflow/react', () => ({ ReactFlow: () => <div>只读图形</div>, Background: () => null, Controls: () => null, MiniMap: () => null, MarkerType: { ArrowClosed: 'arrowclosed' }, Position: { Left: 'left', Right: 'right' } }));
const draft: Draft = { id: 's', title: '故事', source: 'old', revision: 0, updatedAt: '', characters: [{ id: 'a', name: '甲', voiceId: '', bio: '人物简介' }, { id: 'b', name: '乙', voiceId: '' }], relations: [{ id: 'r', from: 'a', to: 'b', type: '朋友' }] };
const graph = (title: string) => ({ ok: true, diagnostics: [], graph: { nodes: [{ id: title, kind: 'scene', title }], edges: [] } });
beforeEach(() => vi.mocked(api).mockReset());

describe('V09–V11 read-only story atlas', () => {
  it('shows relation details and searches without writing data', () => {
    render(<StoryVisuals draft={draft} />);
    fireEvent.change(screen.getByLabelText('查找人物节点'), { target: { value: '甲' } });
    fireEvent.click(screen.getByRole('button', { name: '甲' }));
    expect(screen.getByRole('heading', { name: '甲' })).toBeInTheDocument();
    expect(screen.getByText('人物简介')).toBeInTheDocument();
    expect(api).not.toHaveBeenCalled();
  });
  it('shows an empty state and no-match search result for a cast with no relations', () => {
    render(<StoryVisuals draft={{ ...draft, characters: [], relations: [] }} />);
    expect(screen.getByText('暂无可显示的节点')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('查找人物节点'), { target: { value: '不存在' } });
    expect(screen.getByText('没有匹配的节点')).toBeInTheDocument();
  });
  it('filters the plot graph by a selected scene and keeps the text list available', async () => {
    vi.mocked(api).mockResolvedValueOnce({ ok: true, diagnostics: [], graph: {
      nodes: [
        { id: 'scene:a', kind: 'scene', title: '入口', line: 1, path: 'a' },
        { id: 'choice:a', kind: 'choice', title: '选择甲', line: 2 },
        { id: 'scene:b', kind: 'scene', title: '远处', line: 3, path: 'b' },
      ],
      edges: [{ id: 'edge:a', from: 'scene:a', to: 'choice:a', kind: 'choice' }]
    }});
    render(<StoryVisuals draft={draft} />);
    fireEvent.click(screen.getByRole('button', { name: '剧情分支图' }));
    const scope = await screen.findByLabelText('查看范围');
    expect(scope.parentElement?.parentElement).toHaveTextContent('场景 2 · 选项 1 · 连线 1');
    fireEvent.change(scope, { target: { value: 'scene:a' } });
    expect(screen.getByText('节点与连线文本列表（2 个节点 / 1 条连线）')).toBeInTheDocument();
    fireEvent.click(screen.getByText('节点与连线文本列表（2 个节点 / 1 条连线）'));
    expect(screen.getByRole('button', { name: '场景 · 入口' })).toBeInTheDocument();
  });
  it('displays compile failures and retries analysis', async () => {
    vi.mocked(api).mockResolvedValueOnce({ ok: false, diagnostics: [{ severity: 'error', message: '缺少跳转目标' }] }).mockResolvedValueOnce(graph('入口'));
    render(<StoryVisuals draft={draft} />);
    fireEvent.click(screen.getByRole('button', { name: '剧情分支图' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('剧情分析未完成');
    expect(screen.getByText('错误：缺少跳转目标')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '重新分析' }));
    await screen.findByLabelText('查看范围');
    expect(vi.mocked(api).mock.calls.every(([path, method]) => path === '/analyze' && method === 'POST')).toBe(true);
  });
  it('ignores a late old-source response and exposes network failures', async () => {
    let finish!: (value: unknown) => void;
    vi.mocked(api).mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
    const { rerender } = render(<StoryVisuals draft={draft} />);
    fireEvent.click(screen.getByRole('button', { name: '剧情分支图' }));
    vi.mocked(api).mockResolvedValueOnce(graph('新入口'));
    rerender(<StoryVisuals draft={{ ...draft, source: 'new' }} />);
    await screen.findByLabelText('查看范围');
    finish(graph('旧入口'));
    await waitFor(() => expect(screen.queryByText('旧入口')).not.toBeInTheDocument());
    vi.mocked(api).mockRejectedValueOnce(new Error('连接失败'));
    fireEvent.click(screen.getByRole('button', { name: '重新分析' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('连接失败');
    expect(screen.queryByLabelText('查看范围')).not.toBeInTheDocument();
  });
});
