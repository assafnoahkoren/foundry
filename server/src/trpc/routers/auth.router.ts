import { router, publicProcedure, protectedProcedure } from '../trpc';
import { authService } from '../../services/auth.service';
import { registerSchema, loginSchema } from '../../shared/schemas/auth.schema';

// Register
const registerProcedure = publicProcedure
  .input(registerSchema)
  .mutation(async ({ input }) => {
    return authService.register(input);
  });

// Login
const loginProcedure = publicProcedure
  .input(loginSchema)
  .mutation(async ({ input }) => {
    return authService.login(input);
  });

// Get current user
const meProcedure = protectedProcedure
  .query(async ({ ctx }) => {
    return authService.getMe(ctx.user.userId);
  });

// Compose the router
export const authRouter = router({
  register: registerProcedure,
  login: loginProcedure,
  me: meProcedure,
});