import { createMcpHandler } from '@modelcontextprotocol/server';
import { toNodeHandler } from '@modelcontextprotocol/node';
import type { FastifyInstance } from 'fastify';
import { createStoryMcpServer } from './mcp.js';
import type { GameService } from './service.js';

export function attachStoryMcp(app: FastifyInstance, service: GameService) {
  const handle = toNodeHandler(createMcpHandler(() => createStoryMcpServer(service)), {
    onerror: error => { app.log.error(error); },
  });
  app.route({
    method: ['GET', 'POST', 'DELETE'],
    url: '/mcp',
    handler: async (request, reply) => {
      reply.hijack();
      await handle(request.raw, reply.raw, request.method === 'POST' ? request.body : undefined);
    },
  });
}
