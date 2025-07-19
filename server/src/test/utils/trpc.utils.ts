import { appRouter } from '../../trpc/routers/app.router';
import { createContext } from '../../trpc/context';
import type { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify';

export const createTestContext = async (options?: Partial<CreateFastifyContextOptions>) => {
  return createContext({
    req: {
      headers: {},
      ...options?.req,
    },
    res: {
      ...options?.res,
    },
  } as CreateFastifyContextOptions);
};

export const createAuthenticatedContext = async (token: string) => {
  return createContext({
    req: {
      headers: {
        authorization: `Bearer ${token}`,
      },
    },
    res: {},
  } as CreateFastifyContextOptions);
};

export const createCaller = async (context?: Awaited<ReturnType<typeof createContext>>) => {
  const ctx = context || await createTestContext();
  return appRouter.createCaller(ctx);
};