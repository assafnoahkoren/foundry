import fastify from 'fastify';
import { initTRPCPlugin } from './trpc/init';
import { initBullBoard } from './features/jobs/bull-board';

export type { AppRouter } from './trpc/routers/app.router';

export async function createServer() {
  const server = fastify({
    logger: {
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    },
    maxParamLength: 5000,
  });


  // Initialize tRPC
  await initTRPCPlugin(server);

  // Initialize Bull Board (controlled by environment variables)
  await initBullBoard(server);


  // Health check endpoint
  server.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  return server;
}