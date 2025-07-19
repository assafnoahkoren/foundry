import { createServer } from './server';
import { config } from './shared';

const start = async () => {
  try {
    const server = await createServer();
    const port = config.server.port;
    const host = process.env.HOST || '0.0.0.0';

    await server.listen({ port, host });
    console.log(`🚀 Server running at http://${host}:${port}`);
    console.log(`📡 tRPC endpoint: http://${host}:${port}/trpc`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();