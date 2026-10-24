import { useEffect, useRef, useState } from 'react';
import { api, ApiError, type Character, type Compilation, type Draft, type Session, type Turn, type Version } from './api';
import { McpConsole } from './McpConsole';
import { sampleCharacters, sampleSource } from './sample';

const sessionKey = (storyId: string) => `wawawa.session.${storyId}`;
type Entry = { turn: Turn; answer?: string };

export default function App() {
  const [stories, setStories] = useState<Draft[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [dirty, setDirty] = useState(false);
  const [versions, setVersions] = useState<Version[]>([]);
  const [compilation, setCompilation] = useState<Compilation | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [tab, setTab] = useState<'write' | 'play' | 'mcp'>('write');
  const [loading, setLoading] = useState(true);
  const requestLock = useRef(false);
  const selected = useRef<string | null>(null);
  const currentTurnRef = useRef<HTMLDivElement>(null);
  const retry = useRef<{ key: string; id: string } | null>(null);

  const reportError = (cause: unknown) => {
    const message = cause instanceof Error ? cause.message : '发生未知错误，请重试。';
    setError(cause instanceof ApiError && cause.status === 409 ? `${message}。存档冲突请恢复当前回合；草稿冲突请先复制未保存内容，再刷新页面重新编辑。` : message);
    if (cause instanceof ApiError && cause.diagnostics) setCompilation({ ok: false, diagnostics: cause.diagnostics });
  };

  async function run(action: () => Promise<void>) {
    if (requestLock.current) return;
    requestLock.current = true; setBusy(true); setError(''); setNotice('');
    try { await action(); } catch (cause) { reportError(cause); }
    finally { requestLock.current = false; setBusy(false); }
  }

  async function loadStory(story: Draft) {
    selected.current = story.id;
    localStorage.setItem('wawawa.selectedStory', story.id);
    setDraft(story); setDirty(false); setCompilation(null); setSession(null); setEntries([]); setInput('');
    setVersions([]); retry.current = null;
    const result = await api<Version[]>(`/stories/${story.id}/versions`);
    if (selected.current !== story.id) return;
    setVersions(result);
    const saved = localStorage.getItem(sessionKey(story.id));
    if (saved) {
      try {
        const restored = await api<Session>(`/sessions/${saved}`);
        if (selected.current !== story.id) return;
        setSession(restored); setEntries([{ turn: restored.turn }]);
        setNotice('已恢复上次进度。当前回合可以重新阅读；此前对话日志不在本页保留。');
      } catch (cause) {
        if (cause instanceof ApiError && cause.status === 404) localStorage.removeItem(sessionKey(story.id));
        else throw cause;
      }
    }
  }

  useEffect(() => {
    let active = true;
    api<Draft[]>('/stories').then(async result => {
      if (!active) return;
      setStories(result);
      const lastSelected = localStorage.getItem('wawawa.selectedStory');
      const initial = result.find(story => story.id === lastSelected) ?? result[0];
      if (initial) await loadStory(initial);
    }).catch(cause => { if (active) reportError(cause); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirty) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  function edit(patch: Partial<Draft>) {
    setDraft(previous => previous ? { ...previous, ...patch } : previous);
    setDirty(true); setCompilation(null); setNotice('');
  }

  function editCharacter(index: number, patch: Partial<Character>) {
    if (draft) edit({ characters: draft.characters.map((character, position) => position === index ? { ...character, ...patch } : character) });
  }

  async function save(): Promise<Draft> {
    if (!draft) throw new Error('请先创建故事。');
    const saved = await api<Draft>(`/stories/${draft.id}`, 'PUT', {
      title: draft.title, source: draft.source, characters: draft.characters, revision: draft.revision
    });
    setDraft(saved); setDirty(false);
    setStories(previous => previous.map(item => item.id === saved.id ? saved : item));
    return saved;
  }

  function createStory() {
    if (dirty && !window.confirm('当前草稿尚未保存，确定离开吗？')) return;
    void run(async () => {
      const created = await api<Draft>('/stories', 'POST', {
        title: stories.length ? `雨夜来信 · ${stories.length + 1}` : '雨夜来信',
        source: sampleSource, characters: sampleCharacters
      });
      setStories(previous => [...previous, created]); await loadStory(created); setTab('write');
      setNotice('示例已创建。试着改变选择，观察好感度和历史事件如何影响结局。');
    });
  }

  function chooseStory(story: Draft) {
    if (story.id === draft?.id) return;
    if (dirty && !window.confirm('当前草稿尚未保存，确定离开吗？')) return;
    void run(async () => { await loadStory(await api<Draft>(`/stories/${story.id}`)); });
  }

  function remember(next: Session) {
    setSession(next); localStorage.setItem(sessionKey(next.storyId), next.id);
  }

  function start() {
    if (!draft) return;
    void run(async () => {
      const next = await api<Session>('/sessions', 'POST', { storyId: draft.id });
      remember(next); setEntries([{ turn: next.turn }]); setInput(''); retry.current = null;
      setNotice(`已开始已发布版本 v${next.versionNumber}，草稿修改不会影响本次游玩。`);
    });
  }

  function choose(payload: { choiceId: string } | { input: string }, answer: string) {
    if (!session) return;
    const key = JSON.stringify([session.id, session.turn.id, payload]);
    if (retry.current?.key !== key) retry.current = { key, id: crypto.randomUUID() };
    const requestId = retry.current.id;
    void run(async () => {
      const next = await api<Session>(`/sessions/${session.id}/choices`, 'POST', {
        turnId: session.turn.id, revision: session.revision, requestId, ...payload
      });
      remember(next); setInput(''); retry.current = null;
      setEntries(previous => [...previous.map((entry, index) => index === previous.length - 1 ? { ...entry, answer } : entry), { turn: next.turn }]);
      setTimeout(() => currentTurnRef.current?.focus(), 0);
    });
  }

  return <div className="studio">
    <aside className="sidebar">
      <a className="brand" href="#main"><span className="brand-mark" aria-hidden="true">≋</span><span>声间<small>STORY STUDIO</small></span></a>
      <div className="sidebar-heading"><span>故事书架</span><span>{stories.length.toString().padStart(2, '0')}</span></div>
      <nav aria-label="故事列表">{stories.map(story => <button key={story.id} className={`story-item ${draft?.id === story.id ? 'selected' : ''}`} aria-current={draft?.id === story.id ? 'page' : undefined} disabled={busy || loading} onClick={() => chooseStory(story)}><span className="story-icon" aria-hidden="true">▤</span><span>{story.title}<small>草稿 · r{story.revision}</small></span></button>)}</nav>
      <button className="new-story" onClick={createStory} disabled={busy || loading}>＋ 新建示例故事</button>
      <div className="sidebar-note"><span className="tiny-label">LOCAL PROTOTYPE</span><p>每个选择，<br />都留下回声。</p><small>本地创作与调试工具<br />未接入真实语音和设备</small></div>
    </aside>

    <main id="main">
      <header className="topbar"><div><div className="eyebrow">互动音频故事 / 创作实验室</div><h1>{draft?.title ?? '让故事，从一个选择开始。'}</h1></div><span className="prototype-badge"><i />引擎验证版</span></header>
      <div className="feedback" aria-live="polite">{notice && <p className="notice">{notice}</p>}</div>
      {error && <div className="error-banner" role="alert"><strong>操作未完成</strong><span>{error}</span><button onClick={() => setError('')} aria-label="关闭错误提示">×</button></div>}
      {loading ? <div className="empty"><span className="loading-dot" /><h2>正在打开故事书架</h2><p>正在连接本地剧情服务。</p></div> : !draft ? <div className="empty welcome"><div className="wave" aria-hidden="true">▂ ▅ ▃ ▇ ▄ ▆ ▂</div><span className="eyebrow">WRITE · CHOOSE · REMEMBER</span><h2>用声音构建世界，<br />用选择改变故事。</h2><p>从「雨夜来信」开始，验证角色、好感度与长线分支。<br />先让故事跑通，再让角色开口。</p><button className="primary" onClick={createStory} disabled={busy}>创建第一个故事</button>{error && <p>请确认后端与 MongoDB 已启动，然后刷新页面。</p>}</div> : <>
        <div className="workspace-nav"><div className="tabs" role="tablist" aria-label="工作模式"><button role="tab" aria-selected={tab === 'write'} onClick={() => setTab('write')}>01 剧本工作室</button><button role="tab" aria-selected={tab === 'play'} onClick={() => setTab('play')}>02 对话模拟器</button><button role="tab" aria-selected={tab === 'mcp'} onClick={() => setTab('mcp')}>03 MCP 测试</button></div><span className={`save-state ${dirty ? 'unsaved' : ''}`}>{busy ? '处理中…' : dirty ? '● 有未保存修改' : `已保存 · r${draft.revision}`}</span></div>
        {tab === 'mcp' ? <McpConsole /> : tab === 'write' ? <section className="author-layout" aria-label="剧本工作室">
          <div className="editor-panel panel"><div className="panel-heading"><div><span className="tiny-label">SCRIPT</span><h2>编写故事</h2></div><span className="chip">Ink</span></div>
            <label className="field-label" htmlFor="story-title">剧本名称</label><input id="story-title" value={draft.title} maxLength={120} disabled={busy} onChange={event => edit({ title: event.target.value })} />
            <div className="source-label"><label className="field-label" htmlFor="story-source">Ink 剧本</label><span>{draft.source.split('\n').length} 行</span></div>
            <textarea id="story-source" className="source-editor" value={draft.source} spellCheck={false} disabled={busy} onChange={event => edit({ source: event.target.value })} />
            <div className="editor-actions"><button disabled={busy} onClick={() => void run(async () => { setCompilation(await api<Compilation>('/compile', 'POST', { source: draft.source })); })}>编译检查</button><button disabled={busy} onClick={() => void run(async () => { await save(); setNotice('草稿已保存。'); })}>保存草稿</button><button className="primary" disabled={busy || !draft.title.trim()} onClick={() => void run(async () => { const saved = await save(); const version = await api<Version>(`/stories/${saved.id}/publish`, 'POST', { revision: saved.revision }); setVersions(previous => [version, ...previous]); setNotice(`版本 v${version.number} 已发布。可以前往对话模拟器开始验证。`); setCompilation({ ok: true, diagnostics: [] }); })}>保存并发布 <span aria-hidden="true">↗</span></button></div>
            <div aria-live="polite">{compilation && <div className={`compilation ${compilation.ok ? 'success' : 'failure'}`}><strong>{compilation.ok ? '编译通过' : '编译失败，尚未发布'}</strong>{compilation.diagnostics.map((diagnostic, index) => <p key={index}>{diagnostic.severity === 'error' ? '错误' : '警告'}：{diagnostic.message}</p>)}</div>}</div>
          </div>
          <aside className="inspector"><section className="panel"><div className="panel-heading"><div><span className="tiny-label">CAST</span><h2>角色与声音</h2></div><span className="chip">{draft.characters.length}</span></div><p className="muted">音色 ID 仅作为配置保存。本版本不生成或播放配音。</p>
            {draft.characters.map((character, index) => <fieldset className="character-card" key={index}><legend>角色 {index + 1}</legend><label>角色标识<input aria-label={`角色 ${index + 1} 标识`} value={character.id} disabled={busy} onChange={event => editCharacter(index, { id: event.target.value })} /></label><label>显示名称<input aria-label={`角色 ${index + 1} 名称`} value={character.name} disabled={busy} onChange={event => editCharacter(index, { name: event.target.value })} /></label><label>音色 ID<input aria-label={`角色 ${index + 1} 音色`} value={character.voiceId} disabled={busy} onChange={event => editCharacter(index, { voiceId: event.target.value })} /></label><button className="text-button" disabled={busy} onClick={() => edit({ characters: draft.characters.filter((_, position) => position !== index) })}>移除角色 {index + 1}</button></fieldset>)}
            <button className="add-character" disabled={busy || draft.characters.length >= 20} onClick={() => edit({ characters: [...draft.characters, { id: `character_${crypto.randomUUID().slice(0, 8)}`, name: '新角色', voiceId: '' }] })}>＋ 添加角色</button>
          </section><section className="panel version-panel"><span className="tiny-label">RELEASES</span><h2>发布记录</h2><p className="muted">发布版本固定保存。编辑草稿不会改变已有存档。</p>{versions.length ? <ol className="version-list">{versions.map(version => <li key={version.id}><strong>v{version.number}</strong><span>{new Date(version.createdAt).toLocaleString('zh-CN')}</span></li>)}</ol> : <p className="muted">还没有发布版本。</p>}</section></aside>
        </section> : <section className="simulator-layout" aria-label="对话模拟器"><div className="panel conversation-panel"><div className="panel-heading"><div><span className="tiny-label">PLAYTEST</span><h2>听觉故事的文字预演</h2></div>{session && <span className="chip">固定版本 v{session.versionNumber}</span>}</div><p className="simulation-note">模拟模式 · 以下展示台词和语音识别后的文字，不会启动麦克风或播放音频。</p>
          {!session ? <div className="empty simulator-empty"><div className="wave" aria-hidden="true">▂ ▅ ▃ ▇ ▄</div><h3>从第一次相遇开始</h3><p>{versions.length ? '使用最新已发布版本，选择不同回答，观察故事的变化。' : '先在剧本工作室保存并发布，然后开始模拟。'}</p><button className="primary" disabled={busy || !versions.length} onClick={start}>开始模拟</button></div> : <>
            <div className="transcript" aria-label="对话日志">{entries.map((entry, index) => <div key={entry.turn.id} className="turn" ref={index === entries.length - 1 ? currentTurnRef : undefined} tabIndex={-1} aria-label={`第 ${index + 1} 段剧情`}><div className="turn-divider">场景片段 {String(index + 1).padStart(2, '0')}</div>{entry.turn.lines.map((line, lineIndex) => { const character = session.characters.find(item => item.id === line.speaker); return <article className={`dialogue ${line.speaker === 'narrator' || !line.speaker ? 'narration' : ''}`} key={lineIndex}><div className="speaker"><span className="avatar" aria-hidden="true">{(character?.name ?? line.speaker ?? '旁白').slice(0, 1)}</span><strong>{character?.name ?? line.speaker ?? '旁白'}</strong>{line.emotion && <small>{line.emotion}</small>}</div><p>{line.text}</p>{(line.music || line.audio) && <div className="audio-cue">{line.music && `♫ 音乐提示：${line.music}`}{line.audio && ` · 配音：${line.audio}`}</div>}</article>; })}{entry.answer && <div className="player-answer"><small>你的选择</small>{entry.answer}</div>}</div>)}</div>
            {session.turn.ended ? <div className="ending"><span className="tiny-label">END OF STORY</span><h3>这一次，故事停在这里。</h3><p>重新开始，看看另一种选择留下什么回声。</p><button onClick={start} disabled={busy}>重新开始</button></div> : <div className="choice-area"><div className="choice-heading"><strong>你会怎么选择？</strong><span>只接受当前选项</span></div><div className="choices">{session.turn.choices.map((choice, index) => <button key={choice.id} disabled={busy} onClick={() => choose({ choiceId: choice.id }, choice.text)}><span>{index + 1}</span>{choice.text}<i aria-hidden="true">↗</i></button>)}</div><form onSubmit={event => { event.preventDefault(); if (input.trim()) choose({ input: input.trim() }, input.trim()); }}><label className="field-label" htmlFor="choice-input">语音识别后的文字</label><div className="input-row"><input id="choice-input" value={input} disabled={busy} placeholder="例如：第一个，或完整选项文字" maxLength={300} onChange={event => setInput(event.target.value)} /><button className="primary" disabled={busy || !input.trim()} type="submit">提交选择</button></div></form></div>}
          </>}</div><aside className="inspector"><section className="panel"><span className="tiny-label">SESSION</span><h2>本次游玩</h2>{session ? <><dl className="session-stats"><div><dt>故事版本</dt><dd>v{session.versionNumber}</dd></div><div><dt>存档修订</dt><dd>{session.revision}</dd></div><div><dt>当前状态</dt><dd>{session.turn.ended ? '已结束' : '等待选择'}</dd></div></dl><p className="muted">每次选择自动保存。刷新页面可恢复当前回合。</p><div className="stack-actions"><button disabled={busy} onClick={() => void run(async () => { const restored = await api<Session>(`/sessions/${session.id}`); remember(restored); setEntries([{ turn: restored.turn }]); setNotice('已从服务端恢复当前回合，剧情未推进。'); })}>恢复当前回合</button><button disabled={busy} onClick={start}>新开一局</button></div><details className="debug"><summary>调试状态</summary><p className="muted">仅创作者可见，用于检查历史选择和好感度。</p><pre>{JSON.stringify(session.variables, null, 2)}</pre><small>存档 ID</small><code>{session.id}</code></details></> : <p className="muted">开始模拟后，可在这里检查好感度、历史事件和存档状态。</p>}</section><section className="panel guide"><span className="tiny-label">TRY TWO PATHS</span><h2>验证故事会记住你</h2><p>① 答应保密 → 借伞 → 请求留下</p><p>② 拒绝保密 → 等雨停 → 请求留下</p><p className="muted">比较结局；再检查“提起保密的约定”是否只在第一条路径出现。</p></section></aside></section>}
      </>}
      <footer>声间 · 让选择被记住 <span>Ink 驱动 / 本地创作原型</span></footer>
    </main>
  </div>;
}
