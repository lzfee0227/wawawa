import { createApp } from './app.js';
import { connectMongo } from './mongo.js';

const connection = await connectMongo(process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/wawawa');
const app = createApp(connection.repository, { logger: true });
app.addHook('onClose', () => connection.close());
for (const signal of ['SIGINT', 'SIGTERM'] as const) process.once(signal, () => { void app.close(); });
try {
  await app.listen({ host: process.env.HOST ?? '127.0.0.1', port: Number(process.env.PORT ?? 3001) });
} catch (error) {
  app.log.error(error);
  await app.close();
  process.exitCode = 1;
}
