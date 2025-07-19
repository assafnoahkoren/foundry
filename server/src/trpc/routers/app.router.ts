import { router } from '../trpc';
import { userRouter } from './user.router';

export const appRouter = router({
  users: userRouter,
  // Add more routers here as your API grows
  // posts: postRouter,
  // comments: commentRouter,
});

// Export type for use in client
export type AppRouter = typeof appRouter;