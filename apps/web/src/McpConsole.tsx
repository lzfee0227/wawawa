import { useEffect, useRef, useState } from 'react';
import { StudioMcpClient, type McpTool, type PlaySnapshot, type PublishedStory } from './mcp-client';

type CallLog = { name: string; args: unknown; body: string };

function message(cause: unknown) {
  return cause instanceof Error ? cause.message : '发生未知错误，请重试。';
}

export function McpConsole() {
  const client = useRef(new StudioMcpClient());
  const generation = useRef(0);
  const [tools, setTools] = useState<McpTool[]>([]);
  const [prompt, setPrompt] = useState('');
  const [stories, setStories] = useState<PublishedStory[]>([]);
  const [snapshot, setSnapshot] = useState<PlaySnapshot | null>(null);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [lastCall, setLastCall] = useState<CallLog | null>(null);

  async function run<T>(name: string, args: unknown, action: () => Promise<T>, apply?: (value: T) => void) {
    const ticket = ++generation.current;
    setBusy(true);
    setError('');
    try {
      const value = await action();
      if (generation.current !== ticket) return;
      apply?.(value);
      setLastCall({ name, args, body: JSON.stringify(value, null, 2) });
    } catch (cause) {
      if (generation.current !== ticket) return;
      const text = message(cause);
      setError(text);
      setLastCall({ name, args, body: text });
    } finally {
      if (generation.current === ticket) setBusy(false);
    }
  }

  useEffect(() => {
    void run('list_stories', {}, async () => {
      const nextTools = await client.current.listTools();
      const nextPrompt = await client.current.playTurnPrompt();
      const nextStories = await client.current.listStories();
      return { tools: nextTools, prompt: nextPrompt, stories: nextStories };
    }, value => {
      setTools(value.tools);
      setPrompt(value.prompt);
      setStories(value.stories);
    });
    return () => { generation.current += 1; };
  }, []);

  function refreshStories() {
    void run('list_stories', {}, () => client.current.listStories(), setStories);
  }

  function start(story: PublishedStory) {
    void run('start_session', { storyId: story.id }, () => client.current.startSession(story.id), next => {
      setSnapshot(next);
      setInput('');
    });
  }

  function readSession() {
    if (!snapshot) return;
    void run('get_session', { sessionId: snapshot.sessionId }, () => client.current.getSession(snapshot.sessionId), setSnapshot);
  }

  function choose(selection: { choiceId: string } | { input: string }) {
    if (!snapshot) return;
    const request = { sessionId: snapshot.sessionId, turnId: snapshot.turnId, revision: snapshot.revision, requestId: crypto.randomUUID(), ...selection };
    void run('choose_option', request, () => client.current.choose(request), next => {
      setSnapshot(next);
      setInput('');
    });
  }

  return <section className="mcp-layout" aria-label="MCP 测试台">
    <div className="panel conversation-panel">
      <div className="panel-heading"><div><span className="tiny-label">MCP</span><h2>协议测试台</h2></div>{snapshot && <span className="chip">v{snapshot.versionNumber} · 修订 {snapshot.revision}</span>}</div>
      <p className="simulation-note">协议测试 · 由人点击本机 /mcp，不是语言模型在游玩。音色、音频和音乐只是演出元数据，这里不会播放。</p>
      {error && <div className="error-banner" role="alert"><strong>工具没有推进故事</strong><span>{error}</span><button onClick={() => setError('')} aria-label="关闭错误提示">×</button></div>}
      {tools.length ? <div className="tool-row" role="list" aria-label="MCP 工具">{tools.map(tool => <span className="chip" role="listitem" key={tool.name} title={tool.description}>{tool.title ?? tool.name}<small>{tool.name}</small></span>)}</div> : <p className="muted">{busy ? '正在读取工具…' : '没有读到工具。'}</p>}
      {prompt && <pre className="prompt-text" aria-label="play_turn 提示">{prompt}</pre>}
      {!snapshot ? <div className="empty simulator-empty"><h3>从已发布故事开始</h3><p>{stories.length ? '选择右侧的故事。台词和选项只显示工具返回的内容。' : '还没有已发布故事。先在剧本工作室保存并发布。'}</p></div> : <>
        <p className="muted">回合 {snapshot.turnId}</p>
        <div className="transcript" aria-label="MCP 返回的回合">{snapshot.lines.map((line, index) => {
          const speaker = line.speakerName ?? line.speaker ?? '旁白';
          return <article className={`dialogue ${line.speaker === 'narrator' || !line.speaker ? 'narration' : ''}`} key={`${snapshot.turnId}-${index}`}><div className="speaker"><span className="avatar" aria-hidden="true">{speaker.slice(0, 1)}</span><strong>{speaker}</strong>{line.emotion && <small>{line.emotion}</small>}</div><p>{line.text}</p>{(line.audio || line.music) && <div className="audio-cue">演出元数据{line.music ? ` · 音乐 ${line.music}` : ''}{line.audio ? ` · 音频 ${line.audio}` : ''}</div>}</article>;
        })}</div>
        {snapshot.ended ? <div className="ending"><span className="tiny-label">END OF STORY</span><h3>这一次，故事停在这里。</h3><p>可以再开始一个已发布版本。这个会话没有写入模拟器的恢复记录。</p></div> : <div className="choice-area"><div className="choice-heading"><strong>提交给 choose_option</strong><span>新的选择使用新的 requestId</span></div><div className="choices">{snapshot.choices.map(choice => <button key={choice.id} disabled={busy} onClick={() => choose({ choiceId: choice.id })}><span>{choice.index + 1}</span>{choice.text}</button>)}</div>
          <form onSubmit={event => { event.preventDefault(); if (input.trim()) choose({ input: input.trim() }); }}><label className="field-label" htmlFor="mcp-choice-input">发给工具的原话</label><div className="input-row"><input id="mcp-choice-input" value={input} disabled={busy} maxLength={300} placeholder="例如：第一个，或完整选项文字" onChange={event => setInput(event.target.value)} /><button className="primary" type="submit" disabled={busy || !input.trim()}>提交原话</button></div></form></div>}
      </>}
    </div>
    <aside className="inspector">
      <section className="panel"><span className="tiny-label">PUBLISHED</span><h2>已发布故事</h2><p className="muted">只包含至少发布过一次的故事。开始会话使用最新版本。</p>
        <button onClick={refreshStories} disabled={busy}>刷新已发布故事</button>
        {stories.length ? <div className="story-picks">{stories.map(story => <button key={story.id} disabled={busy} onClick={() => start(story)}>开始「{story.title}」<small>v{story.latestVersionNumber}</small></button>)}</div> : <p className="muted">列表为空。</p>}
      </section>
      <section className="panel"><span className="tiny-label">CALL</span><h2>最近一次调用</h2>{snapshot && <div className="stack-actions"><button disabled={busy} onClick={readSession}>读取当前回合</button></div>}
        {snapshot && <ul className="cast-meta">{snapshot.characters.map(character => <li key={character.id}>{character.name} · 音色元数据 {character.voiceId || '未设置'}</li>)}</ul>}
        {lastCall ? <div className="debug"><p className="muted">{lastCall.name}</p><pre>{JSON.stringify(lastCall.args, null, 2)}</pre><pre>{lastCall.body}</pre></div> : <p className="muted">连接后，这里显示工具名、参数和返回正文。</p>}
      </section>
    </aside>
  </section>;
}
