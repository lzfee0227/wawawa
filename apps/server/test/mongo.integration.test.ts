import { randomUUID } from 'node:crypto';
import { MongoClient } from 'mongodb';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { MongoRepository } from '../src/mongo.js';
import { GameService } from '../src/service.js';
import { sampleCharacters, sampleSource } from '../src/sample.js';
import { playtestEntry, playtestSource } from './playtest-fixture.js';

describe('real MongoDB persistence and atomic writes R07/R08', () => {
  const client = new MongoClient(process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017', { serverSelectionTimeoutMS: 5000 });
  const db = client.db(`wawawa_test_${randomUUID().replaceAll('-', '')}`);
  let service: GameService;
  beforeAll(async () => {
    await client.connect();
    const repo = new MongoRepository(db);
    await repo.initialize();
    service = new GameService(repo);
  });
  afterAll(async () => { if (client) { await db.dropDatabase().catch(() => {}); await client.close(); } });
  it('CP04 persists independent chapter presets and restores the pinned state and receipts', async () => {
    const draft = await service.createDraft({ title: 'Chapter persistence', source: playtestSource, characters: [] });
    const version = await service.publish(draft.id, 0);
    const ordinary = await service.start(draft.id);
    const preview = await service.startPlaytest(draft.id, version.id, 'second');
    const request = { turnId: preview.turn.id, revision: 0, requestId: 'chapter-first', input: '提起秘密' };
    const next = await service.choose(preview.id, request);
    const restored = new GameService(new MongoRepository(db));
    expect(await restored.resume(preview.id)).toEqual(next);
    expect(await restored.choose(preview.id, request)).toEqual(next);
    expect(next.playtest).toEqual(playtestEntry);
    expect(next.variables).toEqual({ trust: 3, secret: true });
    expect(await restored.resume(ordinary.id)).toEqual(ordinary);
    expect((await restored.versions(draft.id))[0].playtestEntries).toEqual([playtestEntry]);
  });
  it('restores exact current turn across service recreation and rejects concurrent updates', async () => {
    const d = await service.createDraft({ title: 'Mongo integration', source: sampleSource, characters: sampleCharacters });
    await service.publish(d.id, 0);
    const s = await service.start(d.id);
    const request = { turnId: s.turn.id, revision: 0, requestId: 'first', input: '第一个' };
    const duplicates = await Promise.all([service.choose(s.id, request), service.choose(s.id, request)]);
    expect(duplicates[0]).toEqual(duplicates[1]);
    const restored = new GameService(new MongoRepository(db));
    expect(await restored.resume(s.id)).toEqual(duplicates[0]);
    expect(await restored.choose(s.id, request)).toEqual(duplicates[0]);
    const next = duplicates[0];
    const results = await Promise.allSettled(['a', 'b'].map(requestId => restored.choose(s.id, { turnId: next.turn.id, revision: 1, requestId, input: '第二个' })));
    expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(1);
    expect((await restored.resume(s.id)).revision).toBe(2);
    expect((await restored.resume(s.id)).variables.lin_affection).toBe(1);
  });
  it('keeps old versions after editing and uniquely numbers concurrent publications', async () => {
    const d = await service.createDraft({ title: 'Version test', source: sampleSource, characters: sampleCharacters });
    const versions = await Promise.all([service.publish(d.id, 0), service.publish(d.id, 0)]);
    expect(new Set(versions.map(v => v.number)).size).toBe(2);
    const old = await service.start(d.id, versions[0].id);
    await service.updateDraft(d.id, { title: 'Changed', source: '结束\n-> END', characters: [] }, 0);
    await service.publish(d.id, 1);
    expect((await service.start(d.id)).turn.ended).toBe(true);
    expect((await service.resume(old.id)).turn.choices).toHaveLength(2);
    expect((await service.getDraft(d.id)).title).toBe('Changed');
    expect((await service.listDrafts()).length).toBeGreaterThan(0);
    expect((await service.versions(d.id)).map(v => v.number)).toEqual([3,2,1]);
    await expect(service.publish(d.id, 0)).rejects.toMatchObject({ status: 409 });
  });
});
