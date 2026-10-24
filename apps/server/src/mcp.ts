import { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import { GameError } from './errors.js';
import type { GameService } from './service.js';
import type { Character, Line, Session } from './types.js';

const id = z.string().min(1).max(100);
const playTurn = [
  '照读工具返回的台词，并保留说话人。不要增删情节，不要替用户做选择，不要修改变量。',
  '只呈现本次返回的选项。禁止编造选项。',
  '用户选定后，用上一次快照里的 sessionId、turnId、revision，以及你为这一次选择新生成的 requestId，调用 choose_option。choiceId 与用户原话只能提供一个。',
  '同一次选择的重试必须复用同一个 requestId。新的选择必须使用新的 requestId。',
  '如果工具返回错误，把错误告诉用户，不要假装故事已经前进。含糊或对不上的说法要原样作为 input 提交。',
  'voiceId、audio、music 只是演出元数据。禁止声称已播放声音。',
].join('\n');

const storyId = z.object({ storyId: id, versionId: id.optional() }).strict();
const sessionId = z.object({ sessionId: id }).strict();
const choiceBase = { sessionId: id, turnId: id, revision: z.number().int().nonnegative(), requestId: id };
const choice = z.union([
  z.object({ ...choiceBase, choiceId: id }).strict(),
  z.object({ ...choiceBase, input: z.string().trim().min(1).max(300) }).strict(),
]);

function ok(value: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(value) }] };
}
function fail(error: unknown) {
  if (error instanceof GameError) {
    const details = (error.diagnostics ?? []).map(item => item.message);
    return { content: [{ type: 'text' as const, text: [`${error.code}: ${error.message}`, ...details].join('\n') }], isError: true as const };
  }
  console.error(error);
  return { content: [{ type: 'text' as const, text: 'INTERNAL_ERROR: 服务暂时不可用，请重试。' }], isError: true as const };
}
function lineView(line: Line, characters: Character[]) {
  const speakerName = line.speaker ? characters.find(character => character.id === line.speaker)?.name : undefined;
  return speakerName ? { ...line, speakerName } : line;
}
export function playSnapshot(session: Session) {
  return {
    sessionId: session.id, storyId: session.storyId, versionId: session.versionId, versionNumber: session.versionNumber,
    revision: session.revision, updatedAt: session.updatedAt, turnId: session.turn.id, ended: session.turn.ended,
    lines: session.turn.lines.map(line => lineView(line, session.characters)), choices: session.turn.choices,
    characters: session.characters, variables: session.variables,
  };
}

export function createStoryMcpServer(service: GameService) {
  const server = new McpServer({ name: 'wawawa', version: '0.1.0' });
  server.registerTool('list_stories', {
    title: '列出已发布故事',
    description: '只返回至少发布过一次的故事，含 id、title 和 latestVersionNumber。未发布草稿不会出现。',
    inputSchema: z.object({}).strict(),
    annotations: { readOnlyHint: true },
  }, async () => {
    try {
      const stories = [];
      for (const draft of await service.listDrafts()) {
        const versions = await service.versions(draft.id);
        if (versions[0]) stories.push({ id: draft.id, title: draft.title, latestVersionNumber: versions[0].number });
      }
      return ok({ stories });
    } catch (error) { return fail(error); }
  });
  server.registerTool('start_session', {
    title: '开始游玩',
    description: '为已发布故事创建存档。省略 versionId 时使用最新版本。返回台词、选项、sessionId、turnId 和 revision。',
    inputSchema: storyId,
  }, async ({ storyId: id, versionId }) => {
    try { return ok(playSnapshot(await service.start(id, versionId))); }
    catch (error) { return fail(error); }
  });
  server.registerTool('get_session', {
    title: '读取当前回合',
    description: '读取存档的当前台词和选项，不会推进剧情。',
    inputSchema: sessionId,
    annotations: { readOnlyHint: true },
  }, async ({ sessionId: id }) => {
    try { return ok(playSnapshot(await service.resume(id))); }
    catch (error) { return fail(error); }
  });
  server.registerTool('choose_option', {
    title: '提交选项',
    description: '提交当前回合的一个选项。带回 sessionId、turnId、revision，以及本次选择的 requestId。choiceId 和 input 只能提供一个。重试必须复用 requestId。',
    inputSchema: choice,
  }, async args => {
    try {
      const selection = 'choiceId' in args ? { choiceId: args.choiceId } : { input: args.input };
      return ok(playSnapshot(await service.choose(args.sessionId, { turnId: args.turnId, revision: args.revision, requestId: args.requestId, ...selection })));
    } catch (error) { return fail(error); }
  });
  server.registerPrompt('play_turn', {
    title: '游玩当前回合',
    description: '要求照读台词，禁止编造选项，并禁止声称已播放声音。',
  }, () => ({ messages: [{ role: 'user', content: { type: 'text', text: playTurn } }] }));
  return server;
}
