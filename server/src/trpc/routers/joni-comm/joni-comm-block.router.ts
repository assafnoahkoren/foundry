import { z } from 'zod';
import { router, protectedProcedure } from '../../trpc';
import { joniCommBlockService } from '../../../services/joni/comm-blocks';
import { TRPCError } from '@trpc/server';
import { requireFeatureAccess } from '../../../middleware/feature-access.middleware';

// Schema definitions
const createCommBlockSchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
  category: z.string().min(1).max(50),
  description: z.string().optional(),
  icaoReference: z.string().optional(),
  rules: z.any().default({}),
  examples: z.array(z.any()).default([]),
  commonErrors: z.array(z.any()).optional().default([]),
  difficultyLevel: z.number().int().min(1).max(5).default(1),
  orderIndex: z.number().int().default(1)
});

const updateCommBlockSchema = z.object({
  id: z.string(),
  data: z.object({
    code: z.string().min(1).max(50).optional(),
    name: z.string().min(1).max(100).optional(),
    category: z.string().min(1).max(50).optional(),
    description: z.string().optional(),
    icaoReference: z.string().optional(),
    rules: z.any().optional(),
    examples: z.array(z.any()).optional(),
    commonErrors: z.array(z.any()).optional(),
    difficultyLevel: z.number().int().min(1).max(5).optional(),
    orderIndex: z.number().int().optional()
  })
});

const listCommBlocksSchema = z.object({
  category: z.string().optional(),
  difficultyLevel: z.number().int().min(1).max(5).optional(),
  orderBy: z.enum(['code', 'name', 'category', 'difficultyLevel', 'orderIndex']).optional(),
  orderDirection: z.enum(['asc', 'desc']).optional()
});

// Middleware to check joni-comm-blocks access
const requireCommBlockAccess = protectedProcedure.use(requireFeatureAccess('joni', 'joni-comm-blocks'));

export const joniCommBlockRouter = router({
  // ===== PUBLIC PROCEDURES (for practice) =====
  
  list: protectedProcedure
    .input(listCommBlocksSchema)
    .query(async ({ input }) => {
      return joniCommBlockService.getAllCommBlocks(input);
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const block = await joniCommBlockService.getCommBlockById(input.id);
      if (!block) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Communication block not found'
        });
      }
      return block;
    }),

  getByCode: protectedProcedure
    .input(z.object({ code: z.string() }))
    .query(async ({ input }) => {
      const block = await joniCommBlockService.getCommBlockByCode(input.code);
      if (!block) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Communication block not found'
        });
      }
      return block;
    }),

  getCategories: protectedProcedure
    .query(async () => {
      return joniCommBlockService.getCategories();
    }),

  search: protectedProcedure
    .input(z.object({ searchTerm: z.string() }))
    .query(async ({ input }) => {
      return joniCommBlockService.searchCommBlocks(input.searchTerm);
    }),

  getWithProgress: protectedProcedure
    .query(async ({ ctx }) => {
      return joniCommBlockService.getCommBlocksWithProgress(ctx.user.userId);
    }),

  getStatistics: protectedProcedure
    .query(async () => {
      return joniCommBlockService.getCommBlockStatistics();
    }),

  // ===== ADMIN PROCEDURES (require joni-comm-blocks access) =====

  create: requireCommBlockAccess
    .input(createCommBlockSchema)
    .mutation(async ({ input }) => {
      try {
        return await joniCommBlockService.createCommBlock({
          ...input,
          rules: input.rules || {},
          examples: input.examples || [],
          commonErrors: input.commonErrors || []
        });
      } catch (error: any) {
        if (error.code === 'P2002') {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'A communication block with this code already exists'
          });
        }
        throw error;
      }
    }),

  update: requireCommBlockAccess
    .input(updateCommBlockSchema)
    .mutation(async ({ input }) => {
      try {
        return await joniCommBlockService.updateCommBlock(input.id, input.data);
      } catch (error: any) {
        if (error.code === 'P2002') {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'A communication block with this code already exists'
          });
        }
        if (error.code === 'P2025') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Communication block not found'
          });
        }
        throw error;
      }
    }),

  delete: requireCommBlockAccess
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      try {
        return await joniCommBlockService.deleteCommBlock(input.id);
      } catch (error: any) {
        if (error.code === 'P2025') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Communication block not found'
          });
        }
        if (error.code === 'P2003') {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Cannot delete communication block as it is being used in transmissions or user progress records'
          });
        }
        throw error;
      }
    }),

  createMany: requireCommBlockAccess
    .input(z.object({
      blocks: z.array(createCommBlockSchema)
    }))
    .mutation(async ({ input }) => {
      const blocksWithDefaults = input.blocks.map(block => ({
        ...block,
        rules: block.rules || {},
        examples: block.examples || [],
        commonErrors: block.commonErrors || []
      }));
      return joniCommBlockService.createManyCommBlocks(blocksWithDefaults);
    })
});