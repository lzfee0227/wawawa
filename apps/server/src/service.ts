import { createHash, randomUUID } from 'node:crypto';
import { GameError } from './errors.js';
import { compile, renderTurn, resolveChoice } from './engine.js';
import { analyzeStoryGraph } from './story-graph.js';
import { publicPlaytestEntry, readPlaytestEntries } from './playtest.js';
import type { Repository } from './repository.js';
import type { ChoiceInput, Draft, DraftInput, DraftRecord, LinxCaller, Session, SessionRecord, Version, VersionRecord } from './types.js';

function publicDraft({ publicationCounter: _, ...draft }: DraftRecord): Draft { return draft; }
function publicVersion({ compiled: _, characters: __, relations: ___, graph: ____, source: _____, sourceRevision: ______, ...version }: VersionRecord): Version { return version; }
function publicSession({ inkState: _, receipts: __, linx: ___, ...session }: SessionRecord): Session { return session; }
function required<T>(value: T | null, message: string): T {
  if (!value) throw new GameError(404, 'NOT_FOUND', message);
  return value;
}
function conflict(): never { throw new GameError(409, 'STALE_REVISION', '内容已更新，请刷新后重试。'); }
function validateRelations(input: DraftInput) {
  const ids = new Set(input.characters.map(character => character.id));
  for (const relation of input.relations ?? []) {
    if (!ids.has(relation.from) || !ids.has(relation.to)) throw new GameError(400, 'INVALID_RELATION', '人物关系必须引用当前草稿中的角色。');
  }
}

export class GameService {
  constructor(private repo: Repository) {}
  async listDrafts() { return (await this.repo.listDrafts()).map(publicDraft); }
  async getDraft(id: string) { return publicDraft(required(await this.repo.getDraft(id), '找不到故事')); }
  async createDraft(input: DraftInput) {
    validateRelations(input);
    const record: DraftRecord = { ...input, relations: input.relations ?? [], id: randomUUID(), revision: 0, publicationCounter: 0, updatedAt: new Date().toISOString() };
    await this.repo.insertDraft(record);
    return publicDraft(record);
  }
  async updateDraft(id: string, input: DraftInput, revision: number) {
    validateRelations(input);
    const current = required(await this.repo.getDraft(id), '找不到故事');
    if (current.revision !== revision) conflict();
    const next = { ...current, ...input, relations: input.relations ?? [], revision: revision + 1, updatedAt: new Date().toISOString() };
    if (!await this.repo.updateDraft(next, revision)) conflict();
    return publicDraft(next);
  }
  compile(source: string) {
    const { compiled: _, ...result } = compile(source);
    return result;
  }
  analyze(source: string) {
    const result = compile(source);
    return { ...result, ...(result.ok ? { graph: analyzeStoryGraph(source) } : {}) };
  }
  async graph(storyId: string, versionId?: string) {
    required(await this.repo.getDraft(storyId), '找不到故事');
    if (versionId) {
      const version = required(await this.repo.getVersion(versionId), '找不到已发布版本');
      if (version.storyId !== storyId) throw new GameError(400, 'VERSION_MISMATCH', '版本不属于该故事');
      return version.graph;
    }
    return analyzeStoryGraph((await this.repo.getDraft(storyId))!.source);
  }
  async publish(id: string, revision: number) {
    const draft = required(await this.repo.getDraft(id), '找不到故事');
    if (draft.revision !== revision) conflict();
    const result = compile(draft.source);
    if (!result.ok || !result.compiled) throw new GameError(422, 'COMPILE_ERROR', '请修复编译错误后发布。', result.diagnostics);
    // Check the entry scene before publishing, including non-terminating loops.
    renderTurn(result.compiled);
    const entries = readPlaytestEntries(draft.source);
    for (const entry of entries) renderTurn(result.compiled, undefined, undefined, entry.path);
    const number = await this.repo.reserveVersion(id, revision);
    if (number === null) conflict();
    const version: VersionRecord = { id: randomUUID(), storyId: id, number, compiled: result.compiled, source: draft.source, sourceRevision: draft.revision, characters: draft.characters, relations: draft.relations ?? [], graph: analyzeStoryGraph(draft.source), createdAt: new Date().toISOString(), playtestEntries: entries.map(publicPlaytestEntry) };
    await this.repo.insertVersion(version);
    return publicVersion(version);
  }
  async versions(id: string) {
    required(await this.repo.getDraft(id), '找不到故事');
    return (await this.repo.listVersions(id)).map(publicVersion);
  }
  async start(storyId: string, versionId?: string, linx?: LinxCaller) {
    required(await this.repo.getDraft(storyId), '找不到故事');
    const version = required(versionId ? await this.repo.getVersion(versionId) : (await this.repo.listVersions(storyId))[0] ?? null, '请先发布故事');
    if (version.storyId !== storyId) throw new GameError(400, 'VERSION_MISMATCH', '版本不属于该故事');
    const rendered = renderTurn(version.compiled);
    const record: SessionRecord = { id: randomUUID(), storyId, versionId: version.id, versionNumber: version.number, revision: 0, characters: version.characters, ...rendered, receipts: [], ...(linx ? { linx } : {}), updatedAt: new Date().toISOString() };
    await this.repo.insertSession(record);
    return publicSession(record);
  }
  async resume(id: string) { return publicSession(required(await this.repo.getSession(id), '找不到存档')); }
  async startPlaytest(storyId: string, versionId: string, entryId: string) {
    required(await this.repo.getDraft(storyId), '找不到故事');
    const version = required(await this.repo.getVersion(versionId), '找不到已发布版本');
    if (version.storyId !== storyId) throw new GameError(400, 'VERSION_MISMATCH', '版本不属于该故事');
    const entry = readPlaytestEntries(version.source).find(candidate => candidate.id === entryId);
    if (!entry) throw new GameError(400, 'INVALID_PLAYTEST_ENTRY', '该版本没有此试跑入口，请重新选择章节和前情预设。');
    const rendered = renderTurn(version.compiled, undefined, undefined, entry.path);
    const record: SessionRecord = { id: randomUUID(), storyId, versionId: version.id, versionNumber: version.number, revision: 0, characters: version.characters, playtest: publicPlaytestEntry(entry), ...rendered, receipts: [], updatedAt: new Date().toISOString() };
    await this.repo.insertSession(record);
    return publicSession(record);
  }
  async choose(id: string, input: ChoiceInput, linx?: LinxCaller) {
    const current = required(await this.repo.getSession(id), '找不到存档');
    const fingerprint = createHash('sha256').update(JSON.stringify([input.turnId, input.revision, input.choiceId ?? null, input.input ?? null])).digest('hex');
    const retry = this.receipt(current, input.requestId, fingerprint);
    if (retry) return retry;
    if (current.revision !== input.revision || current.turn.id !== input.turnId) conflict();
    if (current.turn.ended) throw new GameError(400, 'STORY_ENDED', '故事已结束，请开始新的游玩。');
    const choice = resolveChoice(current.turn.choices, input);
    const version = required(await this.repo.getVersion(current.versionId), '找不到存档对应的故事版本');
    const rendered = renderTurn(version.compiled, current.inkState, choice.index);
    const next: SessionRecord = { ...current, ...rendered, revision: current.revision + 1, updatedAt: new Date().toISOString() };
    if (linx) next.linx = linx;
    const result = publicSession(next);
    next.receipts = [...current.receipts, { requestId: input.requestId, fingerprint, result }].slice(-8);
    if (!await this.repo.updateSession(next, current.revision)) {
      const latest = required(await this.repo.getSession(id), '找不到存档');
      const duplicate = this.receipt(latest, input.requestId, fingerprint);
      if (duplicate) return duplicate;
      conflict();
    }
    return result;
  }
  private receipt(session: SessionRecord, requestId: string, fingerprint: string) {
    const receipt = session.receipts.find(r => r.requestId === requestId);
    if (!receipt) return undefined;
    if (receipt.fingerprint !== fingerprint) throw new GameError(409, 'REQUEST_REUSED', 'requestId 已用于不同请求。');
    return receipt.result;
  }
}
