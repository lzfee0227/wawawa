import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GameService } from '../src/service.js';
import { MemoryRepository } from './memory.js';
import { sampleCharacters, sampleSource } from '../src/sample.js';
import type { Session } from '../src/types.js';

describe('story service R01/R03/R07/R08', () => {
  let repo: MemoryRepository; let service: GameService;
  beforeEach(() => { repo = new MemoryRepository(); service = new GameService(repo); });
  async function setup() {
    const draft = await service.createDraft({ title: '雨夜来信', source: sampleSource, characters: sampleCharacters });
    const version = await service.publish(draft.id, draft.revision);
    const session = await service.start(draft.id);
    return { draft, version, session };
  }
  function request(s: Session, id = 'request1') { return { turnId: s.turn.id, revision: s.revision, requestId: id, input: '第一个' }; }
  it('keeps drafts editable and published versions immutable', async () => {
    const { draft, version, session } = await setup();
    const updated = await service.updateDraft(draft.id, { ...draft, source: '新版结局\n-> END' }, 0);
    await service.publish(draft.id, updated.revision);
    expect((await service.versions(draft.id)).map(v => v.number)).toEqual([2,1]);
    expect((await service.start(draft.id)).turn.lines[0].text).toBe('新版结局');
    expect((await service.start(draft.id, version.id)).turn.choices).toHaveLength(2);
    expect((await service.resume(session.id)).versionId).toBe(version.id);
    expect((await service.listDrafts())[0].source).toContain('新版');
    expect((await service.getDraft(draft.id)).revision).toBe(1);
    await expect(service.updateDraft(draft.id, draft, 0)).rejects.toMatchObject({ status: 409 });
    await expect(service.publish(draft.id, 0)).rejects.toMatchObject({ status: 409 });
  });
  it('repeats a response without repeating mutations and rejects changed retry payload', async () => {
    const { session } = await setup();
    const input = request(session);
    const next = await service.choose(session.id, input);
    expect(next.variables.lin_affection).toBe(1);
    expect(await service.choose(session.id, input)).toEqual(next);
    expect(await new GameService(repo).resume(session.id)).toEqual(next);
    await expect(service.choose(session.id, { ...input, input: '第二个' })).rejects.toMatchObject({ code: 'REQUEST_REUSED' });
    await expect(service.choose(session.id, { ...input, requestId: 'other' })).rejects.toMatchObject({ status: 409 });
  });
  it('handles simultaneous duplicate and distinct choices without double-advancing', async () => {
    const { session } = await setup();
    const results = await Promise.all([service.choose(session.id, request(session)), service.choose(session.id, request(session))]);
    expect(results[0]).toEqual(results[1]);
    const next = results[0];
    const raced = await Promise.allSettled([service.choose(next.id, request(next, 'a')), service.choose(next.id, request(next, 'b'))]);
    expect(raced.filter(r => r.status === 'fulfilled')).toHaveLength(1);
    expect((await service.resume(next.id)).revision).toBe(2);
  });
  it('rejects invalid inputs and missing resources without altering state', async () => {
    const { session, draft } = await setup();
    await expect(service.choose(session.id, { ...request(session), input: '随便' })).rejects.toMatchObject({ status: 400 });
    expect(await service.resume(session.id)).toEqual(session);
    for (const f of [() => service.getDraft('missing'), () => service.resume('missing'), () => service.versions('missing'), () => service.start('missing')]) await expect(f()).rejects.toMatchObject({ status: 404 });
    const other = await service.createDraft({ title: 'other', source: '结束\n-> END', characters: [] });
    await expect(service.start(other.id)).rejects.toMatchObject({ status: 404 });
    const v = await service.publish(other.id, 0);
    await expect(service.start(draft.id, v.id)).rejects.toMatchObject({ code: 'VERSION_MISMATCH' });
    const ended = await service.start(other.id);
    await expect(service.choose(ended.id, request(ended))).rejects.toMatchObject({ code: 'STORY_ENDED' });
  });
  it('blocks invalid publishes and detects races while saving or publishing', async () => {
    const bad = await service.createDraft({ title: 'bad', source: '-> missing', characters: [] });
    expect(service.compile(bad.source).ok).toBe(false);
    await expect(service.publish(bad.id, 0)).rejects.toMatchObject({ code: 'COMPILE_ERROR' });
    const { draft } = await setup();
    vi.spyOn(repo, 'reserveVersion').mockResolvedValueOnce(null);
    await expect(service.publish(draft.id, 0)).rejects.toMatchObject({ status: 409 });
    vi.spyOn(repo, 'updateDraft').mockResolvedValueOnce(false);
    await expect(service.updateDraft(draft.id, draft, 0)).rejects.toMatchObject({ status: 409 });
  });
});
