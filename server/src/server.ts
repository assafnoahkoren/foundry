import fastify from 'fastify';
import cors from '@fastify/cors';
import { initTRPCPlugin } from './trpc/init';
import { initBullBoard } from './features/jobs/bull-board';
import { config } from './shared/config/config';

export type { AppRouter } from './trpc/routers/app.router';

export async function createServer() {
  const server = fastify({
    logger: {
      level: config.isProduction() ? 'info' : 'debug',
    },
    maxParamLength: 5000,
  });

  // Simple CORS - allow any origin
  await server.register(cors, {
    origin: true
  });

  // Initialize tRPC
  await initTRPCPlugin(server);

  // Initialize Bull Board (controlled by environment variables)
  await initBullBoard(server);


  // Health check endpoint
  server.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  return server;
}