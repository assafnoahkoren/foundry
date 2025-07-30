import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { prisma } from '../../lib/prisma';
import bcrypt from 'bcryptjs';

export const adminRouter = router({
  getUsers: protectedProcedure
    .query(async () => {
      return prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    }),

  getUser: protectedProcedure
    .input(z.object({
      userId: z.string(),
    }))
    .query(async ({ input }) => {
      const user = await prisma.user.findUnique({
        where: {
          id: input.userId,
        },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      return user;
    }),

  createUser: protectedProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(6),
      name: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: input.email },
      });

      if (existingUser) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'User with this email already exists',
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(input.password, 10);

      // Create user
      const user = await prisma.user.create({
        data: {
          email: input.email,
          password: hashedPassword,
          name: input.name,
        },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return user;
    }),

  updateUser: protectedProcedure
    .input(z.object({
      userId: z.string(),
      data: z.object({
        email: z.string().email().optional(),
        name: z.string().min(1).optional(),
      }),
    }))
    .mutation(async ({ input }) => {
      // Check if email is being changed and if it's already taken
      if (input.data.email) {
        const existingUser = await prisma.user.findFirst({
          where: {
            email: input.data.email,
            NOT: { id: input.userId },
          },
        });

        if (existingUser) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'User with this email already exists',
          });
        }
      }

      try {
        const user = await prisma.user.update({
          where: {
            id: input.userId,
          },
          data: input.data,
          select: {
            id: true,
            email: true,
            name: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        return user;
      } catch {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }
    }),

  resetPassword: protectedProcedure
    .input(z.object({
      userId: z.string(),
      newPassword: z.string().min(6),
    }))
    .mutation(async ({ input, ctx }) => {
      // Prevent self-reset (admin should use profile settings)
      if (input.userId === ctx.user.userId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Please use your profile settings to change your own password',
        });
      }

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: input.userId },
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(input.newPassword, 10);

      // Update the password
      await prisma.user.update({
        where: { id: input.userId },
        data: { password: hashedPassword },
      });

      return { success: true };
    }),

  deleteUser: protectedProcedure
    .input(z.object({
      userId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Prevent self-deletion
      if (input.userId === ctx.user.userId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'You cannot delete your own account',
        });
      }

      try {
        await prisma.user.delete({
          where: {
            id: input.userId,
          },
        });

        return { success: true };
      } catch {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete user',
        });
      }
    }),
});