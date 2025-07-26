import { createServer } from './server';
import { config } from './shared';
import { bootstrapWebServer, shutdown } from './bootstrap';

const start = async () => {
  try {
    // Initialize web server systems
    await bootstrapWebServer();
    
    // Create and start server
    const server = await createServer();
    const port = config.server.port;
    const host = config.server.host;

    await server.listen({ port, host });
    console.log(`🚀 Server running at: http://${host}:${port}`);
    console.log(`📡 tRPC endpoint: http://${host}:${port}/trpc`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await shutdown();
  process.exit(0);
});

start();