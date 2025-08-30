import { z } from 'zod';
import { router, protectedProcedure } from '../../trpc';
import { joniCommBlockProgressService } from '../../../services/joni/comm-blocks';
import { TRPCError } from '@trpc/server';

// Schema definitions
const updateProgressSchema = z.object({
  blockId: z.string(),
  isCorrect: z.boolean(),
  scoreAdjustment: z.number().optional()
});

const bulkUpdateProgressSchema = z.object({
  updates: z.array(updateProgressSchema)
});

export const joniCommProgressRouter = router({
  // ===== USER PROGRESS TRACKING =====
  
  getUserProgress: protectedProcedure
    .input(z.object({
      blockId: z.string().optional()
    }).optional())
    .query(async ({ ctx, input }) => {
      return joniCommBlockProgressService.getUserProgress(
        ctx.user.userId,
        input?.blockId
      );
    }),

  updateProgress: protectedProcedure
    .input(updateProgressSchema)
    .mutation(async ({ ctx, input }) => {
      return joniCommBlockProgressService.updateProgress(
        ctx.user.userId,
        input.blockId,
        {
          isCorrect: input.isCorrect,
          scoreAdjustment: input.scoreAdjustment
        }
      );
    }),

  bulkUpdateProgress: protectedProcedure
    .input(bulkUpdateProgressSchema)
    .mutation(async ({ ctx, input }) => {
      await joniCommBlockProgressService.bulkUpdateProgress(
        ctx.user.userId,
        input.updates
      );
      return { success: true };
    }),

  // ===== ANALYTICS =====

  getProficiencyOverview: protectedProcedure
    .query(async ({ ctx }) => {
      return joniCommBlockProgressService.getUserProficiencyOverview(ctx.user.userId);
    }),

  getRecentProgress: protectedProcedure
    .input(z.object({
      days: z.number().int().min(1).max(365).default(7)
    }).optional())
    .query(async ({ ctx, input }) => {
      return joniCommBlockProgressService.getRecentProgress(
        ctx.user.userId,
        input?.days || 7
      );
    }),

  getWeakestBlocks: protectedProcedure
    .input(z.object({
      limit: z.number().int().min(1).max(20).default(5)
    }).optional())
    .query(async ({ ctx, input }) => {
      return joniCommBlockProgressService.getWeakestBlocks(
        ctx.user.userId,
        input?.limit || 5
      );
    }),

  getStrongestBlocks: protectedProcedure
    .input(z.object({
      limit: z.number().int().min(1).max(20).default(5)
    }).optional())
    .query(async ({ ctx, input }) => {
      return joniCommBlockProgressService.getStrongestBlocks(
        ctx.user.userId,
        input?.limit || 5
      );
    }),

  // ===== RECOMMENDATIONS =====

  getRecommendedBlocks: protectedProcedure
    .input(z.object({
      limit: z.number().int().min(1).max(20).default(10)
    }).optional())
    .query(async ({ ctx, input }) => {
      return joniCommBlockProgressService.getRecommendedBlocks(
        ctx.user.userId,
        input?.limit || 10
      );
    }),

  // ===== RESET =====

  resetProgress: protectedProcedure
    .input(z.object({
      confirmReset: z.literal(true)
    }))
    .mutation(async ({ ctx, input }) => {
      if (!input.confirmReset) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Reset confirmation required'
        });
      }
      
      const result = await joniCommBlockProgressService.resetUserProgress(ctx.user.userId);
      return {
        success: true,
        deletedCount: result.count
      };
    })
});