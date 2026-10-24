import { serveStdio } from '@modelcontextprotocol/server/stdio';
import { connectMongo } from './mongo.js';
import { createStoryMcpServer } from './mcp.js';
import { GameService } from './service.js';

try {
  const connection = await connectMongo(process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/wawawa');
  const mcp = serveStdio(() => createStoryMcpServer(new GameService(connection.repository)));
  console.error('wawawa MCP play server listening on stdio');
  const shutdown = () => { void mcp.close().finally(() => connection.close()); };
  for (const signal of ['SIGINT', 'SIGTERM'] as const) process.once(signal, shutdown);
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
