import { afterEach, describe, expect, it, vi } from 'vitest';
import { StudioMcpClient, type PlaySnapshot } from './mcp-client';

const snapshot: PlaySnapshot = {
  sessionId: 'session-1', storyId: 'story-1', versionId: 'version-1', versionNumber: 1, revision: 0, updatedAt: '2026-10-24T00:00:00Z',
  turnId: 'turn-1', ended: false, lines: [{ text: '雨敲打着末班车站。', tags: [], speaker: 'narrator', speakerName: '旁白' }],
  choices: [{ id: 'c1', index: 0, text: '答应保密' }], characters: [], variables: {},
};

function jsonResponse(body: unknown, status = 200, contentType = 'application/json') {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': contentType } });
}

function client(fetchImpl: typeof fetch) {
  return new StudioMcpClient(fetchImpl);
}

function sent(fetchImpl: { mock: { calls: unknown } }, index = 0) {
  const call = (fetchImpl.mock.calls as Array<[string, RequestInit]>)[index];
  const init = call[1];
  return { url: call[0], headers: init.headers as Record<string, string>, body: JSON.parse(String(init.body)) as { method: string; params: { name?: string; arguments?: Record<string, unknown> } } };
}

describe('studio MCP client C06', () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it('sends the 2026-07-28 envelope and reads a JSON tool list', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ jsonrpc: '2.0', id: 1, result: { tools: [
      { name: 'list_stories', title: '列出已发布故事' },
      { name: 'start_session' }, { name: 'get_session' }, { name: 'choose_option' },
    ] } }));
    const tools = await client(fetchImpl).listTools();
    expect(tools.map(tool => tool.name)).toEqual(['list_stories', 'start_session', 'get_session', 'choose_option']);
    const { url, headers, body } = sent(fetchImpl);
    expect(url).toBe('/mcp');
    expect(headers.accept).toBe('application/json, text/event-stream');
    expect(headers['mcp-protocol-version']).toBe('2026-07-28');
    expect(headers['mcp-method']).toBe('tools/list');
    expect(body).toEqual({
      jsonrpc: '2.0', id: 1, method: 'tools/list',
      params: { _meta: {
        'io.modelcontextprotocol/protocolVersion': '2026-07-28',
        'io.modelcontextprotocol/clientInfo': { name: 'wawawa-studio', version: '0.1.0' },
        'io.modelcontextprotocol/clientCapabilities': {},
      } },
    });
  });

  it('reads the matching JSON-RPC message from an event stream', async () => {
    const payload = { jsonrpc: '2.0', id: 1, result: { tools: [{ name: 'list_stories' }] } };
    const fetchImpl = vi.fn(async () => new Response(`event: message\ndata: {"jsonrpc":"2.0","id":99,"result":{}}\n\ndata: ${JSON.stringify(payload)}\n\n`, {
      status: 200, headers: { 'content-type': 'text/event-stream' },
    }));
    await expect(client(fetchImpl).listTools()).resolves.toEqual([{ name: 'list_stories' }]);
  });

  it('keeps protocol failures distinct from tool failures', async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ jsonrpc: '2.0', id: 1, error: { code: -32602, message: 'Invalid params' } }))
      .mockResolvedValueOnce(jsonResponse({ jsonrpc: '2.0', id: 1, result: { isError: true, content: [{ type: 'text', text: 'NOT_FOUND: 找不到故事' }] } }));
    await expect(client(fetchImpl).listTools()).rejects.toMatchObject({ message: '-32602: Invalid params', kind: 'protocol' });
    await expect(client(fetchImpl).startSession('missing')).rejects.toMatchObject({ name: 'McpClientError', message: 'NOT_FOUND: 找不到故事', kind: 'tool' });
  });

  it('parses play snapshots and rejects non-JSON tool text', async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ jsonrpc: '2.0', id: 1, result: { content: [{ type: 'text', text: JSON.stringify({ stories: [{ id: 'story-1', title: '雨夜来信', latestVersionNumber: 2 }] }) }] } }))
      .mockResolvedValueOnce(jsonResponse({ jsonrpc: '2.0', id: 2, result: { content: [{ type: 'text', text: JSON.stringify(snapshot) }] } }))
      .mockResolvedValueOnce(jsonResponse({ jsonrpc: '2.0', id: 1, result: { content: [{ type: 'text', text: '不是 JSON' }] } }));
    const api = client(fetchImpl);
    await expect(api.listStories()).resolves.toEqual([{ id: 'story-1', title: '雨夜来信', latestVersionNumber: 2 }]);
    await expect(api.getSession('session-1')).resolves.toMatchObject({ turnId: 'turn-1', revision: 0 });
    const broken = new StudioMcpClient(fetchImpl);
    await expect(broken.listStories()).rejects.toMatchObject({ kind: 'protocol', message: '工具返回的正文不是 JSON。' });
  });

  it('submits exactly one selection field with the caller request id', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ jsonrpc: '2.0', id: 1, result: { content: [{ type: 'text', text: JSON.stringify({ ...snapshot, revision: 1, turnId: 'turn-2' }) }] } }));
    const next = await client(fetchImpl).choose({ sessionId: 'session-1', turnId: 'turn-1', revision: 0, requestId: 'request-1', input: '第一个' });
    expect(next.turnId).toBe('turn-2');
    const posted = sent(fetchImpl);
    expect(posted.body.method).toBe('tools/call');
    expect(posted.body.params.name).toBe('choose_option');
    expect(posted.body.params.arguments).toEqual({ sessionId: 'session-1', turnId: 'turn-1', revision: 0, requestId: 'request-1', input: '第一个' });
    expect(posted.headers).toMatchObject({ 'mcp-method': 'tools/call', 'mcp-name': 'choose_option' });
  });

  it('reads the play_turn prompt and reports a dead endpoint', async () => {
    const prompt = '照读工具返回的台词。\n禁止编造选项。\n禁止声称已播放声音。';
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ jsonrpc: '2.0', id: 1, result: { messages: [{ role: 'user', content: { type: 'text', text: prompt } }] } }))
      .mockRejectedValueOnce(new Error('offline'));
    await expect(client(fetchImpl).playTurnPrompt()).resolves.toBe(prompt);
    const headers = sent(fetchImpl).headers;
    expect(headers['mcp-name']).toBe('play_turn');
    await expect(client(fetchImpl).listTools()).rejects.toMatchObject({ kind: 'protocol', message: '无法连接本机 MCP 服务。' });
  });

  it('rejects a body that is not JSON and a snapshot that omits the turn', async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(new Response('nope', { status: 502, headers: { 'content-type': 'text/plain' } }))
      .mockResolvedValueOnce(jsonResponse({ jsonrpc: '2.0', id: 1, result: { content: [{ type: 'text', text: '{"ended":true}' }] } }))
      .mockResolvedValueOnce(jsonResponse({ jsonrpc: '2.0', id: 1, result: { content: [{ type: 'text', text: JSON.stringify({ ...snapshot, revision: 1 }) }] } }));
    await expect(client(fetchImpl).listTools()).rejects.toMatchObject({ message: 'MCP 返回了无法识别的响应。' });
    await expect(client(fetchImpl).startSession('story-1')).rejects.toMatchObject({ message: '游玩快照不完整。' });
    const chosen = await client(fetchImpl).choose({ sessionId: 'session-1', turnId: 'turn-1', revision: 0, requestId: 'request-2', choiceId: 'c1' });
    expect(chosen.revision).toBe(1);
    expect(sent(fetchImpl, 2).body.params.arguments).toEqual({ sessionId: 'session-1', turnId: 'turn-1', revision: 0, requestId: 'request-2', choiceId: 'c1' });
  });

  it('rejects an event stream that omits this call', async () => {
    const fetchImpl = vi.fn(async () => new Response('data: {"jsonrpc":"2.0","id":9,"result":{}}\n\n', { status: 200, headers: { 'content-type': 'text/event-stream' } }));
    await expect(client(fetchImpl).listTools()).rejects.toMatchObject({ message: 'MCP 事件流里没有本次调用的结果。' });
  });
});
