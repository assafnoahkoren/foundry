import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { userService } from '../../services/user.service';
import { createUserSchema, updateUserSchema } from '../../shared';

// List users
const listUsersInput = z.object({
  limit: z.number().min(1).max(100).default(10),
  offset: z.number().min(0).default(0),
});

const listUsersProcedure = publicProcedure
  .input(listUsersInput)
  .query(async ({ input }) => {
    return userService.findAll(input.limit, input.offset);
  });

// Get user by ID
const getUserByIdInput = z.object({ 
  id: z.string().uuid() 
});

const getUserByIdProcedure = publicProcedure
  .input(getUserByIdInput)
  .query(async ({ input }) => {
    const user = await userService.findById(input.id);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  });

// Create user
const createUserProcedure = publicProcedure
  .input(createUserSchema)
  .mutation(async ({ input }) => {
    return userService.create(input);
  });

// Update user
const updateUserInput = z.object({
  id: z.string().uuid(),
  data: updateUserSchema,
});

const updateUserProcedure = publicProcedure
  .input(updateUserInput)
  .mutation(async ({ input }) => {
    const user = await userService.update(input.id, input.data);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  });

// Delete user
const deleteUserInput = z.object({ 
  id: z.string().uuid() 
});

const deleteUserProcedure = publicProcedure
  .input(deleteUserInput)
  .mutation(async ({ input }) => {
    const deleted = await userService.delete(input.id);
    if (!deleted) {
      throw new Error('User not found');
    }
    return { success: true };
  });

// Compose the router
export const userRouter = router({
  list: listUsersProcedure,
  getById: getUserByIdProcedure,
  create: createUserProcedure,
  update: updateUserProcedure,
  delete: deleteUserProcedure,
});