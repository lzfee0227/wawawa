import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import dagre from '@dagrejs/dagre';
import { Background, Controls, MiniMap, ReactFlow, MarkerType, Position, type Node, type Edge, type ReactFlowInstance } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './story-visuals.css';
import { api, type Draft, type StoryGraph, type Diagnostic } from './api';

type Card = { id: string; title: string; kind: string; subtitle?: string; details: string[] };
type Link = { id: string; from: string; to: string; label: string; detail?: string };
const colors: Record<string, string> = { 人物: '#427767', 场景: '#427767', 选项: '#ad7d29', 结局: '#ad626b' };

function GraphCanvas({ cards, links, label }: { cards: Card[]; links: Link[]; label: string }) {
  const [selected, setSelected] = useState<string>('');
  const [query, setQuery] = useState('');
  const canvasRef = useRef<HTMLDivElement>(null);
  const [flow, setFlow] = useState<ReactFlowInstance | null>(null);
  const layout = useMemo(() => {
    const g = new dagre.graphlib.Graph({ multigraph: true });
    g.setGraph({ rankdir: 'LR', nodesep: 32, ranksep: 115, marginx: 30, marginy: 30 });
    g.setDefaultEdgeLabel(() => ({}));
    cards.forEach(card => g.setNode(card.id, { width: 232, height: 100 }));
    links.forEach(link => g.setEdge(link.from, link.to, {}, link.id));
    dagre.layout(g);
    const nodes: Node[] = cards.map(card => {
      const point = g.node(card.id);
      return { id: card.id, width: 232, height: 100, position: { x: point.x - 116, y: point.y - 50 }, sourcePosition: Position.Right, targetPosition: Position.Left,
        ariaLabel: `${card.kind}：${card.title}`, style: { width: 232, height: 100, borderColor: colors[card.kind] },
        data: { label: <div className="map-card"><small style={{ color: colors[card.kind] }}>{card.kind}</small><strong>{card.title}</strong><span>{card.subtitle || '点击查看详情'}</span></div> } };
    });
    const edges: Edge[] = links.map(link => ({ id: link.id, source: link.from, target: link.to, label: link.label,
      type: 'default', markerEnd: { type: MarkerType.ArrowClosed, color: '#78978c' }, style: { stroke: '#78978c', strokeWidth: 1.6 },
      labelStyle: { fill: '#39564b', fontSize: 12 }, labelBgStyle: { fill: '#f6f8f4' }, labelBgPadding: [6, 4],
      ariaLabel: `${cards.find(c => c.id === link.from)?.title} → ${cards.find(c => c.id === link.to)?.title} ${link.label}` }));
    return { nodes, edges };
  }, [cards, links]);
  useEffect(() => {
    if (!flow || !canvasRef.current) return;
    let frame = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => { void flow.fitView({ padding: .15 }); });
    });
    observer.observe(canvasRef.current);
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, [flow]);
  const card = cards.find(item => item.id === selected);
  const matches = query.trim() ? cards.filter(item => `${item.title} ${item.subtitle ?? ''}`.toLowerCase().includes(query.trim().toLowerCase())) : [];
  const focus = (id: string) => { setSelected(id); void flow?.fitView({ nodes: [{ id }], padding: .8, maxZoom: 1.2, duration: 300 }); };
  return <>
    <div className="map-tools"><label>查找节点<input aria-label={`查找${label}节点`} value={query} onChange={event => setQuery(event.target.value)} placeholder="输入名称或场景标识" /></label><button onClick={() => void flow?.fitView({ padding: .15, duration: 300 })}>适配画布</button><span>拖动画布平移 · 滚轮缩放 · 点击节点查看</span></div>
    {query.trim() && <div className="map-results" aria-live="polite">{matches.length ? matches.map(item => <button key={item.id} onClick={() => focus(item.id)}>{item.title}</button>) : <p>没有匹配的节点</p>}</div>}
    <div className="map-workspace">
      <div ref={canvasRef} className="flow-canvas" role="region" aria-label={`${label}画布`} onKeyDownCapture={event => { if (event.key === 'Enter' || event.key === ' ') { const id = (event.target as HTMLElement).closest('.react-flow__node')?.getAttribute('data-id'); if (id) setSelected(id); } }}>
        {cards.length ? <ReactFlow nodes={layout.nodes.map(node => ({ ...node, selected: node.id === selected }))} edges={layout.edges}
          onInit={setFlow} onNodeClick={(_, node) => setSelected(node.id)}
          nodesDraggable={false} nodesConnectable={false} edgesReconnectable={false} deleteKeyCode={null}
          fitView fitViewOptions={{ padding: .15 }} minZoom={.02} maxZoom={2} onlyRenderVisibleElements
          ariaLabelConfig={{ 'controls.zoomIn.ariaLabel': '放大', 'controls.zoomOut.ariaLabel': '缩小', 'controls.fitView.ariaLabel': '适配画布', 'minimap.ariaLabel': '图形缩略图', 'node.a11yDescription.default': '按 Enter 或空格查看详情。', 'edge.a11yDescription.default': '只读剧情连线。' }}>
          <Background color="#d8e1d9" gap={22} /><Controls showInteractive={false} /><MiniMap pannable zoomable nodeColor={node => String(node.style?.borderColor ?? '#427767')} />
        </ReactFlow> : <div className="map-empty">暂无可显示的节点</div>}
      </div>
      <aside className="map-detail" aria-label="节点详情"><span className="tiny-label">DETAILS</span><h3>{card?.title ?? '从图中选择一个节点'}</h3>{card ? <><span className="chip">{card.kind}</span>{card.details.map((text, i) => <p key={i}>{text}</p>)}<h4>相连走向</h4>{links.filter(link => link.from === card.id || link.to === card.id).map(link => <p key={link.id}>{cards.find(c => c.id === link.from)?.title} → {cards.find(c => c.id === link.to)?.title}<br /><small>{link.label}{link.detail ? ` · ${link.detail}` : ''}</small></p>)}</> : <p className="muted">人物设定、关系说明与剧情位置会显示在这里。也可以用搜索或下方列表定位。</p>}</aside>
    </div>
    <details className="map-text"><summary>节点与连线文本列表（{cards.length} 个节点 / {links.length} 条连线）</summary><ul>{cards.map(item => <li key={item.id}><button onClick={() => focus(item.id)}>{item.kind} · {item.title}</button></li>)}</ul><ul>{links.map(link => <li key={link.id}>{cards.find(c => c.id === link.from)?.title} → {cards.find(c => c.id === link.to)?.title}：{link.label}{link.detail ? ` · ${link.detail}` : ''}</li>)}</ul></details>
  </>;
}

function PlotGraph({ source }: { source: string }) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ source: string; graph?: StoryGraph; error?: string; diagnostics?: Diagnostic[] } | null>(null);
  const [scope, setScope] = useState('');
  useEffect(() => {
    let active = true;
    setResult(null); setScope('');
    api<{ ok: boolean; graph?: StoryGraph; diagnostics: Diagnostic[] }>('/analyze', 'POST', { source }).then(value => {
      if (!active) return;
      setResult({ source, graph: value.ok ? value.graph : undefined, error: value.ok && value.graph ? undefined : '剧情分析未完成，请修复剧本后重试。', diagnostics: value.diagnostics });
    }).catch(error => { if (active) setResult({ source, error: error instanceof Error ? error.message : '分析失败，请重试。' }); });
    return () => { active = false; };
  }, [source, attempt]);
  const graph = result?.source === source ? result.graph : undefined;
  const visible = useMemo(() => {
    if (!graph) return null;
    const ids = new Set([scope]);
    if (scope) for (let step = 0; step < 2; step++) {
      const before = new Set(ids);
      graph.edges.forEach(edge => { if (before.has(edge.from) || before.has(edge.to)) { ids.add(edge.from); ids.add(edge.to); } });
    }
    const nodes = graph.nodes.filter(node => !scope || ids.has(node.id));
    const nodeIds = new Set(nodes.map(node => node.id));
    return { cards: nodes.map(node => ({ id: node.id, title: node.title, kind: node.kind === 'scene' ? '场景' : node.kind === 'choice' ? '选项' : '结局', subtitle: node.line ? `源码第 ${node.line} 行` : undefined, details: [node.path ? `场景标识：${node.path}` : node.title, ...(node.line ? [`源码第 ${node.line} 行`] : [])] })), links: graph.edges.filter(edge => nodeIds.has(edge.from) && nodeIds.has(edge.to)).map(edge => ({ ...edge, label: edge.condition ? `条件：${edge.condition}` : edge.kind === 'choice' ? '选择' : '跳转' })) };
  }, [graph, scope]);
  return <>
    <div className="map-intro"><div><h2>剧情分支走向</h2><p>当前草稿的场景、选项与跳转。条件和动态跳转以实际游玩为准。</p></div><button disabled={!result || result.source !== source} onClick={() => setAttempt(value => value + 1)}>重新分析</button></div>
    {(!result || result.source !== source) ? <p role="status">正在分析当前草稿…</p> : result.error ? <p role="alert">{result.error}</p> : null}
    {result?.source === source && result.diagnostics?.map((d, i) => <p className="map-diagnostic" key={i}>{d.severity === 'error' ? '错误' : '提示'}：{d.message}</p>)}
    {graph && visible && <><div className="map-scope"><label>查看范围<select value={scope} onChange={event => setScope(event.target.value)}><option value="">全部剧情 · {graph.nodes.length} 个节点</option>{graph.nodes.filter(node => node.kind === 'scene').map(node => <option key={node.id} value={node.id}>{node.title} · 相邻两步</option>)}</select></label><span>场景 <b>{graph.nodes.filter(node => node.kind === 'scene').length}</b> · 选项 <b>{graph.nodes.filter(node => node.kind === 'choice').length}</b> · 连线 <b>{graph.edges.length}</b></span><span className="map-legend">● 场景　<span>● 选项</span>　<em>● 结局</em></span></div><GraphCanvas key={`${attempt}:${scope}`} cards={visible.cards} links={visible.links} label="剧情" /></>}
  </>;
}

export function StoryVisuals({ draft, children }: { draft: Draft; children?: ReactNode }) {
  const [mode, setMode] = useState<'cast' | 'plot'>('cast');
  const { cards, links } = useMemo(() => ({
    cards: draft.characters.map(character => ({ id: character.id, title: character.name, kind: '人物', subtitle: character.traits?.join(' · '), details: [character.bio || '尚未填写人物简介', ...(character.goals?.map(goal => `目标：${goal}`) ?? []), ...(character.secrets?.map(secret => `秘密：${secret}`) ?? [])] })),
    links: (draft.relations ?? []).map(relation => ({ id: relation.id, from: relation.from, to: relation.to, label: relation.label || relation.type, detail: [relation.type, relation.description, relation.variableKey ? `关联变量：${relation.variableKey}` : '', relation.strength !== undefined ? `设定强度：${relation.strength}` : ''].filter(Boolean).join(' · ') })).filter(link => draft.characters.some(c => c.id === link.from) && draft.characters.some(c => c.id === link.to))
  }), [draft.characters, draft.relations]);
  return <section className="story-visuals panel" aria-label="人物与剧情图"><header className="map-header"><div><span className="tiny-label">STORY ATLAS</span><h2>让故事的联系，一目了然。</h2></div><span className="chip">只读画布</span></header><div className="map-switch"><button aria-pressed={mode === 'cast'} onClick={() => setMode('cast')}>人物关系图</button><button aria-pressed={mode === 'plot'} onClick={() => setMode('plot')}>剧情分支图</button></div>
    {mode === 'cast' ? <><div className="map-intro"><div><h2>人物与关系</h2><p>{cards.length} 个角色 · {links.length} 条关系。点击人物查看简介、目标和秘密。</p></div></div><GraphCanvas cards={cards} links={links} label="人物" />{children && <details className="map-edit"><summary>编辑人物与关系资料</summary>{children}</details>}</> : <PlotGraph source={draft.source} />}
  </section>;
}
