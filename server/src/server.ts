import fastify from 'fastify';
import cors from '@fastify/cors';
import { fastifyTRPCPlugin, type FastifyTRPCPluginOptions } from '@trpc/server/adapters/fastify';
import { createContext } from './trpc/context';
import { appRouter } from './trpc/routers/app.router';

export type { AppRouter } from './trpc/routers/app.router';

export async function createServer() {
  const server = fastify({
    logger: {
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    },
    maxParamLength: 5000,
  });

  // Register CORS
  await server.register(cors, {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  });

  // Register tRPC
  await server.register(fastifyTRPCPlugin, {
    prefix: '/trpc',
    trpcOptions: {
      router: appRouter,
      createContext,
      onError({ path, error }) {
        console.error(`tRPC error on ${path}:`, error);
      },
    } satisfies FastifyTRPCPluginOptions<typeof appRouter>['trpcOptions'],
  });

  // Health check endpoint
  server.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  return server;
}