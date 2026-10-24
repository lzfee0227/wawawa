import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
import { createMcpHandler } from '@modelcontextprotocol/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GameError } from '../src/errors.js';
import { createStoryMcpServer } from '../src/mcp.js';
import { GameService } from '../src/service.js';
import { sampleCharacters, sampleSource } from '../src/sample.js';
import { MemoryRepository } from './memory.js';

type ToolResult = { isError?: boolean; content?: Array<{ type: string; text?: string }> };

describe('MCP play tools M01–M07', () => {
  const open: Array<{ close: () => Promise<void> }> = [];
  afterEach(async () => { await Promise.all(open.splice(0).map(item => item.close())); });

  async function clientFor(service: GameService) {
    const handler = createMcpHandler(() => createStoryMcpServer(service));
    const transport = new StreamableHTTPClientTransport(new URL('http://127.0.0.1/mcp'), {
      fetch: (url, init) => handler.fetch(new Request(url, init)),
    });
    const client = new Client({ name: 'wawawa-test', version: '0.1.0' }, { versionNegotiation: { mode: 'auto' } });
    await client.connect(transport);
    open.push(client, handler);
    return client;
  }
  async function call(client: Client, name: string, args: Record<string, unknown> = {}) {
    const result = await client.callTool({ name, arguments: args }) as ToolResult;
    const text = result.content?.find(item => item.type === 'text')?.text ?? '';
    return { result, text, json: result.isError ? undefined : JSON.parse(text) as Record<string, unknown> };
  }

  it('lists only published stories and plays both sample branches without leaking engine state', async () => {
    const service = new GameService(new MemoryRepository());
    const draft = await service.createDraft({ title: '雨夜来信', source: sampleSource, characters: sampleCharacters });
    await service.createDraft({ title: '未发布', source: '还没写完\n-> END', characters: [] });
    const version = await service.publish(draft.id, draft.revision);
    const client = await clientFor(service);
    const listed = await call(client, 'list_stories');
    expect(listed.json).toEqual({ stories: [{ id: draft.id, title: '雨夜来信', latestVersionNumber: 1 }] });

    const started = await call(client, 'start_session', { storyId: draft.id, versionId: version.id });
    const snapshot = started.json as { sessionId: string; turnId: string; revision: number; lines: Array<{ speaker?: string; speakerName?: string }>; choices: Array<{ id: string; text: string }> };
    expect(snapshot.lines.map(line => [line.speaker, line.speakerName])).toEqual([['narrator', '旁白'], ['lin', '林']]);
    expect(snapshot.choices.map(choice => choice.text)).toEqual(['替她保守秘密', '拒绝承诺']);
    expect(started.text).not.toContain('inkState');
    expect(started.text).not.toContain('receipts');
    const reread = await call(client, 'get_session', { sessionId: snapshot.sessionId });
    expect(reread.json).toEqual(started.json);

    const kept = await call(client, 'choose_option', { sessionId: snapshot.sessionId, turnId: snapshot.turnId, revision: snapshot.revision, requestId: 'keep', choiceId: snapshot.choices[0].id });
    expect(kept.json?.variables).toMatchObject({ kept_secret: true, lin_affection: 1 });
    const keptAgain = await call(client, 'choose_option', { sessionId: snapshot.sessionId, turnId: snapshot.turnId, revision: snapshot.revision, requestId: 'keep', choiceId: snapshot.choices[0].id });
    expect(keptAgain.json).toEqual(kept.json);
    const reused = await call(client, 'choose_option', { sessionId: snapshot.sessionId, turnId: snapshot.turnId, revision: snapshot.revision, requestId: 'keep', input: '拒绝承诺' });
    expect(reused.result.isError).toBe(true);
    expect(reused.text).toMatch(/^REQUEST_REUSED:/);
    const stale = await call(client, 'choose_option', { sessionId: snapshot.sessionId, turnId: snapshot.turnId, revision: snapshot.revision, requestId: 'other', input: '第二个' });
    expect(stale.text).toMatch(/^STALE_REVISION:/);
    expect(await call(client, 'get_session', { sessionId: snapshot.sessionId })).toMatchObject({ json: kept.json });

    const tea = kept.json as { turnId: string; revision: number; choices: Array<{ text: string }> };
    const warmed = await call(client, 'choose_option', { sessionId: snapshot.sessionId, turnId: tea.turnId, revision: tea.revision, requestId: 'tea', input: '第一个' });
    const door = warmed.json as { turnId: string; revision: number; choices: Array<{ text: string }>; variables: { lin_affection: number } };
    expect(door.choices.map(choice => choice.text)).toContain('提起那晚的约定');
    expect(door.variables.lin_affection).toBe(2);
    const ending = await call(client, 'choose_option', { sessionId: snapshot.sessionId, turnId: door.turnId, revision: door.revision, requestId: 'leave', input: '提起那晚的约定' });
    expect(ending.json).toMatchObject({ ended: true });
    expect(ending.text).toContain('我愿意和你同行');

    const second = await call(client, 'start_session', { storyId: draft.id });
    let current = second.json as { sessionId: string; turnId: string; revision: number; choices: Array<{ text: string }> };
    const nonsense = await call(client, 'choose_option', { sessionId: current.sessionId, turnId: current.turnId, revision: current.revision, requestId: 'nonsense', input: '随便说说' });
    expect(nonsense.text).toMatch(/^INVALID_CHOICE:/);
    expect(await call(client, 'get_session', { sessionId: current.sessionId })).toMatchObject({ json: second.json });
    current = (await call(client, 'choose_option', { sessionId: current.sessionId, turnId: current.turnId, revision: current.revision, requestId: 'refuse', input: '拒绝承诺' })).json as typeof current;
    current = (await call(client, 'choose_option', { sessionId: current.sessionId, turnId: current.turnId, revision: current.revision, requestId: 'wait', input: '沉默等待' })).json as typeof current;
    expect(current.choices.map(choice => choice.text)).not.toContain('提起那晚的约定');
    const cold = await call(client, 'choose_option', { sessionId: current.sessionId, turnId: current.turnId, revision: current.revision, requestId: 'stay', input: '请求她留下' });
    expect(cold.text).toContain('我们还不够了解彼此');

    const invalid = await call(client, 'choose_option', { sessionId: snapshot.sessionId, turnId: 'gone', revision: 0, requestId: 'bad', input: '随便说说' });
    expect(invalid.result.isError).toBe(true);
    expect(invalid.text).toMatch(/^INVALID_CHOICE:|^STALE_REVISION:/);
    const both = await call(client, 'choose_option', { sessionId: snapshot.sessionId, turnId: door.turnId, revision: door.revision, requestId: 'both', choiceId: 'x', input: '第一个' });
    expect(both.result.isError).toBe(true);
    expect((await call(client, 'get_session', { sessionId: snapshot.sessionId })).json).toEqual(ending.json);

    const updated = await service.updateDraft(draft.id, { title: draft.title, source: '新的结局\n-> END', characters: sampleCharacters }, draft.revision);
    await service.publish(draft.id, updated.revision);
    expect(await call(client, 'list_stories')).toMatchObject({ json: { stories: [{ latestVersionNumber: 2 }] } });
    expect((await call(client, 'get_session', { sessionId: snapshot.sessionId })).json).toMatchObject({ versionNumber: 1 });
    const prompt = await client.getPrompt({ name: 'play_turn' });
    const promptText = prompt.messages.map(message => message.content.type === 'text' ? message.content.text : '').join('\n');
    expect(promptText).toContain('照读');
    expect(promptText).toContain('禁止编造选项');
    expect(promptText).toContain('禁止声称已播放声音');
  });

  it('reports service failures and unknown speaker ids without advancing', async () => {
    const service = new GameService(new MemoryRepository());
    const draft = await service.createDraft({ title: '幽灵', source: '有人在叫你。 # speaker:ghost\n-> END', characters: [] });
    await service.publish(draft.id, 0);
    const client = await clientFor(service);
    const started = await call(client, 'start_session', { storyId: draft.id });
    expect(started.json?.lines).toEqual([{ text: '有人在叫你。', tags: ['speaker:ghost'], speaker: 'ghost' }]);
    expect(JSON.stringify(started.json)).not.toContain('speakerName');
    vi.spyOn(service, 'listDrafts').mockRejectedValueOnce(new GameError(404, 'NOT_FOUND', '找不到故事'));
    expect((await call(client, 'list_stories')).text).toMatch(/^NOT_FOUND:/);
    const missing = await call(client, 'start_session', { storyId: 'missing' });
    expect(missing.text).toMatch(/^NOT_FOUND:/);
    vi.spyOn(service, 'resume').mockRejectedValueOnce(new GameError(422, 'RUNTIME_ERROR', '剧情运行失败', [{ severity: 'error', message: '循环' }]));
    const failed = await call(client, 'get_session', { sessionId: String(started.json?.sessionId) });
    expect(failed.text).toBe('RUNTIME_ERROR: 剧情运行失败\n循环');
    vi.spyOn(service, 'resume').mockRejectedValueOnce(new Error('secret-stack'));
    const internal = await call(client, 'get_session', { sessionId: String(started.json?.sessionId) });
    expect(internal.text).toBe('INTERNAL_ERROR: 服务暂时不可用，请重试。');
    expect(internal.text).not.toContain('secret-stack');
    const ended = started.json as { sessionId: string; turnId: string; revision: number };
    expect((await call(client, 'choose_option', { sessionId: ended.sessionId, turnId: ended.turnId, revision: ended.revision, requestId: 'end', input: '继续' })).text).toMatch(/^STORY_ENDED:/);
  });
});
