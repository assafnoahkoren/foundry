import { router } from '../trpc';
import { userRouter } from './user.router';
import { authRouter } from './auth.router';
import { userAccessRouter } from './user-access.router';
import { joniScenarioRouter } from './joni-scenario.router';

export const appRouter = router({
  auth: authRouter,
  users: userRouter,
  userAccess: userAccessRouter,
  joniScenario: joniScenarioRouter,
  // Add more routers here as your API grows
  // posts: postRouter,
  // comments: commentRouter,
});

// Export type for use in client
export type AppRouter = typeof appRouter;