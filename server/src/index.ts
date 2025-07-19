import { createServer } from './server.js';

const start = async () => {
  try {
    const server = await createServer();
    const port = Number(process.env.PORT) || 3001;
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