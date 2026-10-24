import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
import { afterEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { MemoryRepository } from './memory.js';

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
