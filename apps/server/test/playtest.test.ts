import { describe, expect, it } from 'vitest';
import { compile, renderTurn } from '../src/engine.js';
import { readPlaytestEntries } from '../src/playtest.js';
import { GameService } from '../src/service.js';
import { createApp } from '../src/app.js';
import { MemoryRepository } from './memory.js';
import { playtestEntry, playtestSource } from './playtest-fixture.js';

describe('chapter playtests CP01–CP04', () => {
  it('parses strict author declarations and rejects malformed, duplicate and excessive entries', () => {
    expect(readPlaytestEntries(playtestSource)).toEqual([{ ...playtestEntry, path: 'preview_second' }]);
    expect(readPlaytestEntries('开场\n-> END')).toEqual([]);
    for (const declaration of [
      '{bad}', '{}', JSON.stringify({ ...playtestEntry, path: 'a.b' }),
      JSON.stringify({ ...playtestEntry, path: 'valid', variables: { secret: true } }),
      JSON.stringify({ ...playtestEntry, path: 'valid', id: '0bad' }),
      JSON.stringify({ ...playtestEntry, path: 'valid', chapter: ' ' }),
      JSON.stringify({ ...playtestEntry, path: 'valid', description: 'x'.repeat(301) }),
    ]) {
      expect(compile(`// @playtest ${declaration}\n结束\n-> END`)).toMatchObject({ ok: false, diagnostics: [{ severity: 'error', message: expect.stringContaining('第 1 行试跑入口无效') }] });
    }
    expect(compile(`${playtestSource}\n${playtestSource.split('\n')[0]}`).ok).toBe(false);
    const tooMany = Array.from({ length: 41 }, (_, index) => `// @playtest ${JSON.stringify({ ...playtestEntry, id: `entry${index}`, path: 'preview_second' })}`).join('\n');
    expect(compile(`${tooMany}\n${playtestSource.split('\n').slice(1).join('\n')}`).ok).toBe(false);
  });

  it('initializes through Ink without altering the ordinary opening', () => {
    const compiled = compile(playtestSource).compiled!;
    expect(renderTurn(compiled).variables).toEqual({ trust: 0, secret: false });
    const preview = renderTurn(compiled, undefined, undefined, 'preview_second');
    expect(preview.variables).toEqual({ trust: 2, secret: true });
    expect(preview.turn.lines.map(line => line.text)).toEqual(['第二章']);
    expect(preview.turn.choices.map(choice => choice.text)).toEqual(['提起秘密', '告别']);
  });

  it('freezes entry metadata, isolates sessions and preserves receipts across new publications', async () => {
    const repo = new MemoryRepository(); const service = new GameService(repo);
    const draft = await service.createDraft({ title: '试跑', source: playtestSource, characters: [] });
    const version = await service.publish(draft.id, 0);
    expect(version.playtestEntries).toEqual([playtestEntry]);
    const ordinary = await service.start(draft.id);
    const preview = await service.startPlaytest(draft.id, version.id, 'second');
    expect(preview.playtest).toEqual(playtestEntry);
    expect(preview.id).not.toBe(ordinary.id);
    expect(preview).not.toHaveProperty('inkState');
    const changed = await service.updateDraft(draft.id, { title: '试跑', source: playtestSource.replace('第二章', '新第二章').replace('~ trust = 2', '~ trust = 9'), characters: [] }, 0);
    const latest = await service.publish(draft.id, changed.revision);
    expect(latest.playtestEntries?.[0].chapter).toBe('新第二章');
    expect((await service.startPlaytest(draft.id, version.id, 'second')).variables.trust).toBe(2);
    expect((await service.startPlaytest(draft.id, latest.id, 'second')).variables.trust).toBe(9);
    const input = { turnId: preview.turn.id, revision: 0, requestId: 'first', input: '提起秘密' };
    const next = await service.choose(preview.id, input);
    expect(next.variables.trust).toBe(3);
    expect(next.playtest).toEqual(playtestEntry);
    expect(await service.choose(preview.id, input)).toEqual(next);
    expect(await new GameService(repo).resume(next.id)).toEqual(next);
    await expect(service.choose(preview.id, { ...input, requestId: 'stale' })).rejects.toMatchObject({ status: 409 });
    expect(await service.resume(ordinary.id)).toEqual(ordinary);
    await expect(service.startPlaytest(draft.id, version.id, 'second.path')).rejects.toMatchObject({ code: 'INVALID_PLAYTEST_ENTRY' });
    const other = await service.createDraft({ title: '其他', source: '结束\n-> END', characters: [] });
    await expect(service.startPlaytest(other.id, version.id, 'second')).rejects.toMatchObject({ code: 'VERSION_MISMATCH' });
    await expect(service.startPlaytest('missing', version.id, 'second')).rejects.toMatchObject({ status: 404 });
    await expect(service.startPlaytest(draft.id, 'missing', 'second')).rejects.toMatchObject({ status: 404 });
    const old = await service.publish(other.id, 0);
    expect((await service.start(other.id, old.id)).playtest).toBeUndefined();
    await expect(service.startPlaytest(other.id, old.id, 'second')).rejects.toMatchObject({ code: 'INVALID_PLAYTEST_ENTRY' });
  });

  it('rejects invalid and non-terminating entry paths before reserving a publication', async () => {
    const service = new GameService(new MemoryRepository());
    for (const source of [playtestSource.replace('"path":"preview_second"', '"path":"missing"'), playtestSource.replace('~ secret = true\n~ trust = 2\n-> second', '-> preview_second')]) {
      const draft = await service.createDraft({ title: '无效入口', source, characters: [] });
      await expect(service.publish(draft.id, 0)).rejects.toMatchObject({ status: 422 });
      expect(await service.versions(draft.id)).toEqual([]);
    }
  });

  it('requires an explicit version and rejects path or variable writes at the HTTP boundary', async () => {
    const app = createApp(new MemoryRepository());
    try {
      const draft = (await app.inject({ method: 'POST', url: '/api/stories', payload: { title: '试跑', source: playtestSource, characters: [] } })).json();
      const version = (await app.inject({ method: 'POST', url: `/api/stories/${draft.id}/publish`, payload: { revision: 0 } })).json();
      const payload = { storyId: draft.id, versionId: version.id, entryId: 'second' };
      const response = await app.inject({ method: 'POST', url: '/api/playtest-sessions', payload });
      expect(response.statusCode).toBe(201);
      expect(response.json().playtest).toEqual(playtestEntry);
      for (const invalid of [{ storyId: draft.id, entryId: 'second' }, { ...payload, path: 'finish' }, { ...payload, variables: { trust: 100 } }, { ...payload, entryId: 'bad.path' }]) {
        expect((await app.inject({ method: 'POST', url: '/api/playtest-sessions', payload: invalid })).statusCode).toBe(400);
      }
      expect((await app.inject({ method: 'POST', url: '/api/sessions', payload })).statusCode).toBe(400);
    } finally { await app.close(); }
  });
});
