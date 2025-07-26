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

  // Add CORS headers to EVERY response manually
  server.addHook('onRequest', async (request, reply) => {
    const origin = request.headers.origin || '*';
    reply.header('Access-Control-Allow-Origin', origin);
    reply.header('Access-Control-Allow-Credentials', 'true');
    reply.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD');
    reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    reply.header('Access-Control-Expose-Headers', 'set-cookie');
    reply.header('Access-Control-Max-Age', '86400');
  });

  // Handle OPTIONS requests
  server.options('*', async (request, reply) => {
    const origin = request.headers.origin || '*';
    reply
      .header('Access-Control-Allow-Origin', origin)
      .header('Access-Control-Allow-Credentials', 'true')
      .header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD')
      .header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin')
      .status(204)
      .send();
  });

  // Initialize tRPC
  await initTRPCPlugin(server);

  // Initialize Bull Board (controlled by environment variables)
  await initBullBoard(server);


  // Health check endpoint
  server.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  return server;
}