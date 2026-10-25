import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { AUDIO_LIMITS, AudioService, type AudioConfig } from './audio.js';

export function attachAudio(app: FastifyInstance, config: AudioConfig, request?: typeof fetch) {
  const service = new AudioService(config, request);
  // Encapsulation keeps binary parsers and the larger recording limit off story routes.
  app.register(async scope => {
    scope.addContentTypeParser(/^audio\//, { parseAs: 'buffer', bodyLimit: AUDIO_LIMITS.MAX_AUDIO }, (_request, body, done) => done(null, body));
    scope.get('/api/audio/capabilities', () => service.capabilities());
    scope.post('/api/audio/speech', async (request, reply) => {
      const input = z.object({ text: z.string().min(1).max(AUDIO_LIMITS.MAX_TEXT), voice: z.string().trim().max(200).optional() }).strict().parse(request.body);
      const result = await service.speech(input.text, input.voice);
      return reply.header('cache-control', 'no-store').type('audio/mpeg').send(result);
    });
    scope.post('/api/audio/transcriptions', { bodyLimit: AUDIO_LIMITS.MAX_AUDIO }, async (request, reply) => {
      const body = z.instanceof(Buffer).parse(request.body);
      return reply.header('cache-control', 'no-store').send({ text: await service.transcribe(body, request.headers['content-type'] ?? '') });
    });
  });
}
