import type { inferAsyncReturnType } from '@trpc/server';
import type { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify';
import { verifyToken, extractTokenFromHeader } from '../lib/auth/token';
import { TokenPayload } from '../shared/schemas/auth.schema';

export async function createContext({ req, res }: CreateFastifyContextOptions) {
  // Try to extract and verify the token
  let user: TokenPayload | null = null;
  
  const token = extractTokenFromHeader(req.headers.authorization);
  if (token) {
    try {
      user = verifyToken(token);
    } catch {
      // Invalid token, but we don't throw here
      // Let the protectedProcedure handle the authentication requirement
    }
  }

  return {
    req,
    res,
    user,
  };
}

export type Context = inferAsyncReturnType<typeof createContext>;