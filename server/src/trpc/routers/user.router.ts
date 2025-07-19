import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { userService } from '../../services/user.service';
import { createUserSchema, updateUserSchema } from '../../shared';

export const userRouter = router({
  list: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(10),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      return userService.findAll(input.limit, input.offset);
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const user = await userService.findById(input.id);
      if (!user) {
        throw new Error('User not found');
      }
      return user;
    }),

  create: publicProcedure
    .input(createUserSchema)
    .mutation(async ({ input }) => {
      return userService.create(input);
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        data: updateUserSchema,
      })
    )
    .mutation(async ({ input }) => {
      const user = await userService.update(input.id, input.data);
      if (!user) {
        throw new Error('User not found');
      }
      return user;
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const deleted = await userService.delete(input.id);
      if (!deleted) {
        throw new Error('User not found');
      }
      return { success: true };
    }),
});