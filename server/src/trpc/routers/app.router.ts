import { router } from '../trpc';
import { userRouter } from './user.router';
import { authRouter } from './auth.router';

export const appRouter = router({
  auth: authRouter,
  users: userRouter,
  // Add more routers here as your API grows
  // posts: postRouter,
  // comments: commentRouter,
});

// Export type for use in client
export type AppRouter = typeof appRouter;