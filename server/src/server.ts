import fastify from 'fastify';
import cors from '@fastify/cors';
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

  // CORS configuration that properly handles preflight
  await server.register(cors, {
    origin: (origin, cb) => {
      // Allow all origins
      cb(null, true);
    },
    credentials: false, // We're using JWT, not cookies
  });

  // Initialize tRPC
  await initTRPCPlugin(server);

  // Initialize Bull Board (controlled by environment variables)
  await initBullBoard(server);


  // Health check endpoint
  server.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  return server;
}