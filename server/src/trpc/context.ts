import { inferAsyncReturnType } from '@trpc/server';
import { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify';

export function createContext({ req, res }: CreateFastifyContextOptions) {
  // Here you can access the request headers, add user info, etc.
  return {
    req,
    res,
    // You can add things like:
    // user: getUserFromHeader(req.headers.authorization),
  };
}

export type Context = inferAsyncReturnType<typeof createContext>;