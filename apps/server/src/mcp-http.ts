import type { IncomingHttpHeaders } from 'node:http';
import { createMcpHandler } from '@modelcontextprotocol/server';
import { toNodeHandler } from '@modelcontextprotocol/node';
import type { FastifyInstance } from 'fastify';
import { linxCallerFromHeaders } from './linx.js';
import { createStoryMcpServer } from './mcp.js';
import type { GameService } from './service.js';

function headersOf(headers: Headers): IncomingHttpHeaders {
  return {
    'x-linx-device-id': headers.get('x-linx-device-id') ?? undefined,
    'x-linx-agent-id': headers.get('x-linx-agent-id') ?? undefined,
    'x-linx-session-id': headers.get('x-linx-session-id') ?? undefined,
  };
}

export function attachStoryMcp(app: FastifyInstance, service: GameService) {
  const handle = toNodeHandler(createMcpHandler(ctx => {
    const linx = ctx.requestInfo ? linxCallerFromHeaders(headersOf(ctx.requestInfo.headers)) : undefined;
    return createStoryMcpServer(service, linx);
  }), {
    onerror: error => { app.log.error(error); },
  });
  app.route({
    method: ['GET', 'POST', 'DELETE'],
    url: '/mcp',
    handler: async (request, reply) => {
      linxCallerFromHeaders(request.headers);
      reply.hijack();
      await handle(request.raw, reply.raw, request.method === 'POST' ? request.body : undefined);
    },
  });
}
