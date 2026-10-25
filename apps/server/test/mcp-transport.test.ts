import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
import { afterEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { GameService } from '../src/service.js';
import { sampleCharacters, sampleSource } from '../src/sample.js';
import { MemoryRepository } from './memory.js';

type ToolResult = { isError?: boolean; content?: Array<{ type: string; text?: string }> };
function toolText(result: ToolResult) {
  return result.content?.find(item => item.type === 'text')?.text ?? '';
}

describe('MCP transports M08', () => {
  const closers: Array<() => Promise<void>> = [];
  afterEach(async () => { await Promise.all(closers.splice(0).map(close => close())); });

  it('serves the play tools and prompt on the API process', async () => {
    const app = createApp(new MemoryRepository());
    closers.push(() => app.close());
    await app.listen({ host: '127.0.0.1', port: 0 });
    const address = app.server.address();
    if (address === null || typeof address === 'string') throw new Error('expected a TCP port');
    const client = new Client({ name: 'wawawa-http', version: '0.1.0' }, { versionNegotiation: { mode: 'auto' } });
    closers.push(() => client.close());
    await client.connect(new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${address.port}/mcp`)));
    expect((await client.listTools()).tools.map(tool => tool.name).sort()).toEqual(['choose_option', 'get_session', 'list_stories', 'start_session']);
    expect((await client.listPrompts()).prompts.map(prompt => prompt.name)).toContain('play_turn');
    const listed = await client.callTool({ name: 'list_stories', arguments: {} });
    expect(listed.isError).toBeFalsy();
    expect(listed.content).toEqual([{ type: 'text', text: JSON.stringify({ stories: [] }) }]);
    const legacy = await fetch(`http://127.0.0.1:${address.port}/mcp/message`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' },
      body: '{}',
    });
    expect(legacy.status).toBe(404);
  });

  it('stores Linx caller headers on the local session and keeps them out of the snapshot', async () => {
    const repo = new MemoryRepository();
    const stories = new GameService(repo);
    const draft = await stories.createDraft({ title: '雨夜来信', source: sampleSource, characters: sampleCharacters });
    await stories.publish(draft.id, draft.revision);
    const app = createApp(repo);
    closers.push(() => app.close());
    await app.listen({ host: '127.0.0.1', port: 0 });
    const address = app.server.address();
    if (address === null || typeof address === 'string') throw new Error('expected a TCP port');
    const headers = { 'x-linx-device-id': 'device-1', 'x-linx-agent-id': 'agent-1', 'x-linx-session-id': 'linx-1' };
    const client = new Client({ name: 'wawawa-linx', version: '0.1.0' }, { versionNegotiation: { mode: 'auto' } });
    closers.push(() => client.close());
    await client.connect(new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${address.port}/mcp`), { requestInit: { headers } }));
    const started = await client.callTool({ name: 'start_session', arguments: { storyId: draft.id } }) as ToolResult;
    const snapshot = JSON.parse(toolText(started)) as { sessionId: string; turnId: string; revision: number; choices: Array<{ id: string }> };
    expect(toolText(started)).not.toContain('device-1');
    expect((await repo.getSession(snapshot.sessionId))?.linx).toEqual({ deviceId: 'device-1', agentId: 'agent-1', sessionId: 'linx-1' });
    const beforeRead = await repo.getSession(snapshot.sessionId);
    await client.callTool({ name: 'get_session', arguments: { sessionId: snapshot.sessionId } });
    expect(await repo.getSession(snapshot.sessionId)).toEqual(beforeRead);

    const rejected = await app.inject({
      method: 'POST', url: '/mcp',
      headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream', 'x-linx-device-id': 'device-1' },
      payload: { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'partial', version: '0' } } },
    });
    expect(rejected.statusCode).toBe(400);
    expect(rejected.json().error.code).toBe('VALIDATION_ERROR');
    expect(repo.sessions.size).toBe(1);

    const choosing = new Client({ name: 'wawawa-linx-next', version: '0.1.0' }, { versionNegotiation: { mode: 'auto' } });
    closers.push(() => choosing.close());
    await choosing.connect(new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${address.port}/mcp`), {
      requestInit: { headers: { 'x-linx-device-id': 'device-2', 'x-linx-agent-id': 'agent-2', 'x-linx-session-id': 'linx-2' } },
    }));
    const chosen = await choosing.callTool({
      name: 'choose_option',
      arguments: { sessionId: snapshot.sessionId, turnId: snapshot.turnId, revision: snapshot.revision, requestId: 'keep', choiceId: snapshot.choices[0].id },
    }) as ToolResult;
    expect(toolText(chosen)).not.toContain('device-2');
    expect((await repo.getSession(snapshot.sessionId))?.linx).toEqual({ deviceId: 'device-2', agentId: 'agent-2', sessionId: 'linx-2' });
    const retrying = new Client({ name: 'wawawa-linx-retry', version: '0.1.0' }, { versionNegotiation: { mode: 'auto' } });
    closers.push(() => retrying.close());
    await retrying.connect(new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${address.port}/mcp`), {
      requestInit: { headers: { 'x-linx-device-id': 'device-3', 'x-linx-agent-id': 'agent-3', 'x-linx-session-id': 'linx-3' } },
    }));
    const retried = await retrying.callTool({
      name: 'choose_option',
      arguments: { sessionId: snapshot.sessionId, turnId: snapshot.turnId, revision: snapshot.revision, requestId: 'keep', choiceId: snapshot.choices[0].id },
    }) as ToolResult;
    expect(toolText(retried)).toBe(toolText(chosen));
    expect((await repo.getSession(snapshot.sessionId))?.linx?.deviceId).toBe('device-2');

    const plain = new Client({ name: 'wawawa-plain', version: '0.1.0' }, { versionNegotiation: { mode: 'auto' } });
    closers.push(() => plain.close());
    await plain.connect(new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${address.port}/mcp`)));
    const plainStarted = await plain.callTool({ name: 'start_session', arguments: { storyId: draft.id } }) as ToolResult;
    const plainSnapshot = JSON.parse(toolText(plainStarted)) as { sessionId: string };
    expect(await repo.getSession(plainSnapshot.sessionId)).not.toHaveProperty('linx');
  });

  it('keeps stdio stdout free when startup fails', async () => {
    const child = spawn(process.execPath, ['--import', 'tsx', 'src/mcp-stdio.ts'], {
      cwd: fileURLToPath(new URL('..', import.meta.url)),
      env: { ...process.env, MONGODB_URI: 'mongodb://127.0.0.1:1/wawawa' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', chunk => { stdout += String(chunk); });
    child.stderr.on('data', chunk => { stderr += String(chunk); });
    try {
      const [code] = await once(child, 'exit') as [number | null];
      expect(code).not.toBe(0);
      expect(stdout).toBe('');
      expect(stderr).not.toBe('');
    } finally {
      if (child.exitCode === null) child.kill();
    }
  }, 15_000);
});
