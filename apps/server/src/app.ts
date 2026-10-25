import Fastify from 'fastify';
import { z, ZodError } from 'zod';
import { GameError } from './errors.js';
import { attachStoryMcp } from './mcp-http.js';
import { GameService } from './service.js';
import type { Repository } from './repository.js';
import { choiceSchema, compileSchema, draftSchema, revisionSchema, sessionSchema, playtestSessionSchema } from './validation.js';
import { attachAudio } from './audio-http.js';
import type { AudioConfig } from './audio.js';

export function createApp(repository: Repository, options: { logger?: boolean; audio?: AudioConfig; audioFetch?: typeof fetch } = {}) {
  const app = Fastify({ logger: options.logger ?? false, bodyLimit: 512_000 });
  const service = new GameService(repository);
  const params = z.object({ id: z.string().min(1).max(100) });
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ZodError) return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ') } });
    if (error instanceof GameError) return reply.code(error.status).send({ error: { code: error.code, message: error.message, ...(error.diagnostics ? { diagnostics: error.diagnostics } : {}) } });
    if (typeof error === 'object' && error !== null && 'statusCode' in error && typeof error.statusCode === 'number' && error.statusCode >= 400 && error.statusCode < 500) return reply.code(error.statusCode).send({ error: { code: 'BAD_REQUEST', message: '请求格式不正确或内容过长。' } });
    request.log.error(error);
    return reply.code(500).send({ error: { code: 'INTERNAL_ERROR', message: '服务暂时不可用，请重试。' } });
  });
  app.get('/api/health', async () => ({ status: 'ok' }));
  app.get('/api/stories', () => service.listDrafts());
  app.post('/api/stories', async (request, reply) => reply.code(201).send(await service.createDraft(draftSchema.parse(request.body))));
  app.get('/api/stories/:id', request => service.getDraft(params.parse(request.params).id));
  app.put('/api/stories/:id', request => {
    const body = z.object({ revision: z.number().int().nonnegative() }).passthrough().parse(request.body);
    const { revision, ...input } = body;
    return service.updateDraft(params.parse(request.params).id, draftSchema.parse(input), revision);
  });
  app.post('/api/compile', request => service.compile(compileSchema.parse(request.body).source));
  app.post('/api/stories/:id/publish', async (request, reply) => reply.code(201).send(await service.publish(params.parse(request.params).id, revisionSchema.parse(request.body).revision)));
  app.get('/api/stories/:id/versions', request => service.versions(params.parse(request.params).id));
  app.post('/api/sessions', async (request, reply) => {
    const input = sessionSchema.parse(request.body);
    return reply.code(201).send(await service.start(input.storyId, input.versionId));
  });
  app.get('/api/sessions/:id', request => service.resume(params.parse(request.params).id));
  app.post('/api/playtest-sessions', async (request, reply) => {
    const input = playtestSessionSchema.parse(request.body);
    return reply.code(201).send(await service.startPlaytest(input.storyId, input.versionId, input.entryId));
  });
  app.post('/api/sessions/:id/choices', request => service.choose(params.parse(request.params).id, choiceSchema.parse(request.body)));
  attachStoryMcp(app, service);
  attachAudio(app, options.audio ?? {}, options.audioFetch);
  return app;
}
