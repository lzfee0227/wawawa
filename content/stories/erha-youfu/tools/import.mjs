import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { isDeepStrictEqual } from 'node:util';
import { resolve } from 'node:path';
import { MongoClient } from 'mongodb';
import { draftSchema } from '../../../../apps/server/src/validation.ts';
import { GameService } from '../../../../apps/server/src/service.ts';
import { MongoRepository } from '../../../../apps/server/src/mongo.ts';
import { compile, renderTurn } from '../../../../apps/server/src/engine.ts';
import { readPlaytestEntries } from '../../../../apps/server/src/playtest.ts';
import { analyzeStoryGraph } from '../../../../apps/server/src/story-graph.ts';

// No default DB target: --check is offline; writes require --write and an explicit URI.
const root = new URL('../', import.meta.url);
const source = await readFile(new URL('story.ink', root), 'utf8');
const metadata = JSON.parse(await readFile(new URL('authoring.json', root), 'utf8'));
const input = draftSchema.parse({ title: '二哈有福', source, ...metadata });
const ids = new Set(input.characters.map(c => c.id));
for (const [, speaker] of source.matchAll(/#\s*speaker:([\w-]+)/g)) assert(ids.has(speaker), `Unknown speaker: ${speaker}`);
assert.equal(new Set(input.relations.map(r => r.id)).size, input.relations.length);
const variables = new Set([...source.matchAll(/^VAR\s+(\w+)/gm)].map(match => match[1]));
for (const relation of input.relations) {
  assert(ids.has(relation.from) && ids.has(relation.to), 'Unknown relation endpoint');
  if (relation.variableKey) assert(variables.has(relation.variableKey), `Unknown variable: ${relation.variableKey}`);
}
const result = compile(source);
assert(result.ok && result.compiled, JSON.stringify(result.diagnostics));
renderTurn(result.compiled);
const entries = readPlaytestEntries(source);
for (const entry of entries) renderTurn(result.compiled, undefined, undefined, entry.path);
const graph = analyzeStoryGraph(source);
const summary = { sourceCharacters: source.length, characters: input.characters.length, relations: input.relations.length, playtestEntries: entries.length, graphNodes: graph.nodes.length, graphEdges: graph.edges.length, diagnostics: result.diagnostics };
if (!process.argv.includes('--write')) {
  console.log(JSON.stringify({ mode: 'check', ...summary }, null, 2));
} else {
  assert(process.env.MONGODB_URI, 'Set MONGODB_URI explicitly');
  const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  try {
    await client.connect();
    const db = client.db();
    const repository = new MongoRepository(db);
    const service = new GameService(repository);
    const matches = (await service.listDrafts()).filter(draft => draft.title === input.title);
    assert(matches.length <= 1, 'Multiple stories match; resolve target before importing');
    const previous = matches[0];
    const previousVersions = previous ? await repository.listVersions(previous.id) : [];
    const previousSessions = previous ? await db.collection('sessions').find({ storyId: previous.id }, { projection: { _id: 0 } }).toArray() : [];
    if (previous) {
      input.characters = input.characters.map(character => ({ ...character, voiceId: previous.characters.find(c => c.id === character.id)?.voiceId ?? character.voiceId }));
    }
    const backupDirectory = resolve('.local/import-backups');
    await mkdir(backupDirectory, { recursive: true });
    const backupPath = resolve(backupDirectory, `erha-youfu-${Date.now()}.json`);
    await writeFile(backupPath, JSON.stringify({ draft: previous ?? null, versionIds: previousVersions.map(v => v.id), sessionIds: previousSessions.map(s => s.id) }, null, 2), { mode: 0o600, flag: 'wx' });
    const unchanged = previous && previous.source === source && isDeepStrictEqual(previous.characters, input.characters) && isDeepStrictEqual(previous.relations, input.relations);
    const saved = unchanged ? previous : previous ? await service.updateDraft(previous.id, input, previous.revision) : await service.createDraft(input);
    const readback = await service.getDraft(saved.id);
    assert.equal(readback.source, source);
    assert.deepEqual(readback.characters, input.characters);
    assert.deepEqual(readback.relations, input.relations);
    let published;
    if (process.argv.includes('--publish')) {
      const latest = previousVersions[0];
      const latestMatches = latest && latest.sourceRevision === saved.revision && latest.source === source && isDeepStrictEqual(latest.characters, input.characters) && isDeepStrictEqual(latest.relations, input.relations) && isDeepStrictEqual(latest.graph, graph);
      published = latestMatches ? latest : await service.publish(saved.id, saved.revision);
      const version = await repository.getVersion(published.id);
      assert.deepEqual(version.characters, input.characters);
      assert.deepEqual(version.relations, input.relations);
      assert.deepEqual(version.graph, graph);
      assert.equal(version.source, source);
      assert.equal(version.playtestEntries.length, entries.length);
    }
    for (const version of previousVersions) assert.deepEqual(await repository.getVersion(version.id), version);
    for (const session of previousSessions) assert.deepEqual(await repository.getSession(session.id), session);
    const report = { ...summary, storyId: saved.id, revision: saved.revision, changed: !unchanged, versionNumber: published?.number, versionId: published?.id, preservedVersions: previousVersions.length, preservedSessions: previousSessions.length, backupPath };
    await writeFile(resolve(backupDirectory, 'erha-youfu-latest-result.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
  } finally { await client.close(); }
}
