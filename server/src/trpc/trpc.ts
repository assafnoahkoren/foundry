import { initTRPC } from '@trpc/server';
import type { Context } from './context';
import { ZodError } from 'zod';

const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError
            ? error.cause.flatten()
            : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;

// Authentication middleware
const isAuthenticated = middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new Error('Unauthorized: You must be logged in to perform this action');
  }
  
  return next({
    ctx: {
      ...ctx,
      user: ctx.user, // Make TypeScript know that user is defined
    },
  });
});

// Protected procedure that requires authentication
export const protectedProcedure = publicProcedure.use(isAuthenticated);