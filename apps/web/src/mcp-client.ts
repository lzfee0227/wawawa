const protocol = '2026-07-28';
const meta = {
  'io.modelcontextprotocol/protocolVersion': protocol,
  'io.modelcontextprotocol/clientInfo': { name: 'wawawa-studio', version: '0.1.0' },
  'io.modelcontextprotocol/clientCapabilities': {},
};

export type McpTool = { name: string; title?: string; description?: string };
export type PublishedStory = { id: string; title: string; latestVersionNumber: number };
export type PlayLine = { text: string; tags: string[]; speaker?: string; speakerName?: string; emotion?: string; audio?: string; music?: string };
export type PlayChoice = { id: string; index: number; text: string };
export type PlaySnapshot = {
  sessionId: string;
  storyId: string;
  versionId: string;
  versionNumber: number;
  revision: number;
  updatedAt: string;
  turnId: string;
  ended: boolean;
  lines: PlayLine[];
  choices: PlayChoice[];
  characters: Array<{ id: string; name: string; voiceId: string }>;
  variables: Record<string, unknown>;
};
export type ChoiceRequest = { sessionId: string; turnId: string; revision: number; requestId: string } & ({ choiceId: string } | { input: string });

export class McpClientError extends Error {
  constructor(message: string, readonly kind: 'protocol' | 'tool') {
    super(message);
    this.name = 'McpClientError';
  }
}

type Rpc = { id?: number | string; result?: unknown; error?: { code?: number; message?: string } };

function protocolError(message: string): never {
  throw new McpClientError(message, 'protocol');
}

function asRecord(value: unknown, message: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null) protocolError(message);
  return value as Record<string, unknown>;
}

async function readRpc(response: Response, id: number): Promise<Rpc> {
  const body = await response.text();
  if (!body.trim()) protocolError(`MCP 返回了空响应（HTTP ${response.status}）。`);
  const type = response.headers.get('content-type') ?? '';
  const message = type.includes('text/event-stream') ? rpcFromSse(body, id) : parseRpc(body);
  if (message.id !== undefined && message.id !== id) protocolError('MCP 响应与本次调用不匹配。');
  if (message.error) protocolError(`${message.error.code ?? 'ERROR'}: ${message.error.message ?? '协议请求失败。'}`);
  if (!response.ok) protocolError(`MCP 请求失败（HTTP ${response.status}）。`);
  return message;
}

function parseRpc(body: string): Rpc {
  try { return JSON.parse(body) as Rpc; }
  catch { protocolError('MCP 返回了无法识别的响应。'); }
}

function rpcFromSse(body: string, id: number): Rpc {
  for (const event of body.split('\n\n')) {
    const data = event.split('\n').filter(line => line.startsWith('data:')).map(line => line.slice(5).trimStart()).join('\n');
    if (!data) continue;
    const message = parseRpc(data);
    if (message.id === id) return message;
  }
  protocolError('MCP 事件流里没有本次调用的结果。');
}

function textContent(result: unknown): { text: string; isError: boolean } {
  const record = asRecord(result, '工具结果缺少正文。');
  const content = record.content;
  const block = Array.isArray(content) ? content.find(item => asRecord(item, '工具结果缺少正文。').type === 'text') : undefined;
  const text = block ? asRecord(block, '工具结果缺少正文。').text : undefined;
  if (typeof text !== 'string') protocolError('工具结果缺少文本。');
  return { text, isError: record.isError === true };
}

function jsonText(text: string): unknown {
  try { return JSON.parse(text) as unknown; }
  catch { protocolError('工具返回的正文不是 JSON。'); }
}

function snapshot(value: unknown): PlaySnapshot {
  const record = asRecord(value, '游玩快照不完整。');
  if (typeof record.sessionId !== 'string' || typeof record.turnId !== 'string' || typeof record.revision !== 'number' || !Array.isArray(record.lines) || !Array.isArray(record.choices)) {
    protocolError('游玩快照不完整。');
  }
  return value as PlaySnapshot;
}

export class StudioMcpClient {
  private nextId = 1;

  constructor(private readonly fetchImpl: typeof fetch = fetch, private readonly endpoint = '/mcp') {}

  listTools(): Promise<McpTool[]> {
    return this.rpc('tools/list', {}).then(result => {
      const tools = asRecord(result, '工具列表不可用。').tools;
      if (!Array.isArray(tools) || tools.some(tool => typeof asRecord(tool, '工具列表不可用。').name !== 'string')) protocolError('工具列表不可用。');
      return tools as McpTool[];
    });
  }

  playTurnPrompt(): Promise<string> {
    return this.rpc('prompts/get', { name: 'play_turn' }, 'play_turn').then(result => {
      const messages = asRecord(result, '找不到 play_turn 提示。').messages;
      const content = Array.isArray(messages) ? asRecord(messages[0], '找不到 play_turn 提示。').content : undefined;
      const text = asRecord(content, '找不到 play_turn 提示。').text;
      if (typeof text !== 'string' || !text.trim()) protocolError('找不到 play_turn 提示。');
      return text;
    });
  }

  async listStories(): Promise<PublishedStory[]> {
    const value = jsonText(await this.tool('list_stories', {}));
    const stories = asRecord(value, '故事列表不可用。').stories;
    if (!Array.isArray(stories)) protocolError('故事列表不可用。');
    return stories as PublishedStory[];
  }

  async startSession(storyId: string): Promise<PlaySnapshot> {
    return snapshot(jsonText(await this.tool('start_session', { storyId })));
  }

  async getSession(sessionId: string): Promise<PlaySnapshot> {
    return snapshot(jsonText(await this.tool('get_session', { sessionId })));
  }

  async choose(request: ChoiceRequest): Promise<PlaySnapshot> {
    const selection = 'choiceId' in request ? { choiceId: request.choiceId } : { input: request.input };
    return snapshot(jsonText(await this.tool('choose_option', {
      sessionId: request.sessionId, turnId: request.turnId, revision: request.revision, requestId: request.requestId, ...selection,
    })));
  }

  private async tool(name: string, args: Record<string, unknown>): Promise<string> {
    const { text, isError } = textContent(await this.rpc('tools/call', { name, arguments: args }, name));
    if (isError) throw new McpClientError(text, 'tool');
    return text;
  }

  private async rpc(method: string, params: Record<string, unknown>, name?: string): Promise<unknown> {
    const id = this.nextId++;
    const headers: Record<string, string> = {
      accept: 'application/json, text/event-stream',
      'content-type': 'application/json',
      'mcp-protocol-version': protocol,
      'mcp-method': method,
      ...(name ? { 'mcp-name': name } : {}),
    };
    let response: Response;
    try {
      response = await this.fetchImpl.call(globalThis, this.endpoint, {
        method: 'POST', headers,
        body: JSON.stringify({ jsonrpc: '2.0', id, method, params: { ...params, _meta: meta } }),
      });
    } catch {
      protocolError('无法连接本机 MCP 服务。');
    }
    return (await readRpc(response, id)).result;
  }
}
