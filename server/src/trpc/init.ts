import { fastifyTRPCPlugin, type FastifyTRPCPluginOptions } from '@trpc/server/adapters/fastify';
import type { FastifyInstance } from 'fastify';
import { createContext } from './context';
import { appRouter } from './routers/app.router';

/**
 * Initialize tRPC on the Fastify server
 */
export async function initTRPCPlugin(server: FastifyInstance): Promise<void> {
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
  
  console.log('🚀 tRPC initialized at /trpc');
}