import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';
import { MemoryRepository } from './memory.js';
import { sampleCharacters, sampleSource } from '../src/sample.js';

describe('HTTP boundary R01–R09', () => {
  let repo: MemoryRepository;
  let app: ReturnType<typeof createApp>;
  beforeEach(() => { repo = new MemoryRepository(); app = createApp(repo); });
  afterEach(() => app.close());
  const draft = { title: '雨夜来信', source: sampleSource, characters: sampleCharacters };
  it('authors, compiles, publishes, simulates and resumes with contract JSON', async () => {
    expect((await app.inject('/api/health')).json()).toEqual({ status: 'ok' });
    expect((await app.inject('/api/stories')).json()).toEqual([]);
    const created = await app.inject({ method: 'POST', url: '/api/stories', payload: draft });
    expect(created.statusCode).toBe(201);
    const d = created.json();
    expect(d).not.toHaveProperty('publicationCounter');
    expect((await app.inject(`/api/stories/${d.id}`)).json()).toEqual(d);
    const saved = await app.inject({ method: 'PUT', url: `/api/stories/${d.id}`, payload: { ...draft, revision: 0, title: '新版标题' } });
    expect(saved.json().revision).toBe(1);
    expect((await app.inject({ method: 'POST', url: '/api/compile', payload: { source: sampleSource } })).json().ok).toBe(true);
    const published = await app.inject({ method: 'POST', url: `/api/stories/${d.id}/publish`, payload: { revision: 1 } });
    expect(published.statusCode).toBe(201);
    expect(published.json()).not.toHaveProperty('compiled');
    expect((await app.inject(`/api/stories/${d.id}/versions`)).json()).toHaveLength(1);
    const started = await app.inject({ method: 'POST', url: '/api/sessions', payload: { storyId: d.id } });
    expect(started.statusCode).toBe(201);
    const s = started.json();
    expect(s).not.toHaveProperty('inkState');
    const selected = await app.inject({ method: 'POST', url: `/api/sessions/${s.id}/choices`, payload: { revision: 0, turnId: s.turn.id, requestId: 'first', choiceId: s.turn.choices[0].id } });
    expect(selected.statusCode).toBe(200);
    expect(selected.json().variables.kept_secret).toBe(true);
    expect((await app.inject(`/api/sessions/${s.id}`)).json()).toEqual(selected.json());
  });
  it('validates required fields, unique characters and exclusive choice input', async () => {
    const invalid = await app.inject({ method: 'POST', url: '/api/stories', payload: { ...draft, characters: [sampleCharacters[0], sampleCharacters[0]] } });
    expect(invalid.statusCode).toBe(400);
    expect(invalid.json().error.code).toBe('VALIDATION_ERROR');
    expect((await app.inject({ method: 'POST', url: '/api/compile', payload: { source: 'a'.repeat(100001) } })).statusCode).toBe(400);
    expect((await app.inject({ method: 'POST', url: '/api/sessions/x/choices', payload: { revision: 0, turnId: 'x', requestId: 'x', choiceId: 'x', input: '1' } })).statusCode).toBe(400);
    expect((await app.inject('/api/stories/missing')).statusCode).toBe(404);
  });
  it('returns diagnostics for bad scripts and safe errors for malformed JSON or internal failures', async () => {
    const compile = await app.inject({ method: 'POST', url: '/api/compile', payload: { source: '-> missing' } });
    expect(compile.statusCode).toBe(200);
    expect(compile.json()).toMatchObject({ ok: false, diagnostics: expect.any(Array) });
    const created = (await app.inject({ method: 'POST', url: '/api/stories', payload: { ...draft, source: '-> missing' } })).json();
    const publish = await app.inject({ method: 'POST', url: `/api/stories/${created.id}/publish`, payload: { revision: 0 } });
    expect(publish.statusCode).toBe(422);
    expect(publish.json().error.diagnostics.length).toBeGreaterThan(0);
    const badJson = await app.inject({ method: 'POST', url: '/api/stories', headers: { 'content-type': 'application/json' }, payload: '{bad' });
    expect(badJson.statusCode).toBe(400);
    vi.spyOn(repo, 'listDrafts').mockRejectedValueOnce(new Error('private database secret'));
    const failed = await app.inject('/api/stories');
    expect(failed.statusCode).toBe(500);
    expect(failed.body).not.toContain('private database');
  });
});
