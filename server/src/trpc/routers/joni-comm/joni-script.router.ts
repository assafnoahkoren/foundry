import { z } from 'zod';
import { router, protectedProcedure } from '../../trpc';
import { joniScriptService } from '../../../services/joni/comm-blocks';
import { TRPCError } from '@trpc/server';
import { requireFeatureAccess } from '../../../middleware/feature-access.middleware';

// Schema definitions
const createScriptSchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  scriptType: z.enum(['training', 'evaluation', 'scenario', 'adaptive']),
  difficultyLevel: z.number().int().min(1).max(5).default(3),
  estimatedMinutes: z.number().int().min(1).max(120).default(5),
  dagStructure: z.any().optional(), // Will be validated on service layer
  startNodeId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  flightContext: z.record(z.any()),
  learningObjectives: z.array(z.string()).optional(),
  prerequisites: z.array(z.object({
    type: z.enum(['script', 'commBlock']),
    id: z.string(),
    name: z.string().optional(),
    minScore: z.number().optional()
  })).optional()
});

const updateScriptSchema = z.object({
  id: z.string(),
  data: z.object({
    code: z.string().min(1).max(50).optional(),
    name: z.string().min(1).max(200).optional(),
    description: z.string().optional(),
    scriptType: z.enum(['training', 'evaluation', 'scenario', 'adaptive']).optional(),
    difficultyLevel: z.number().int().min(1).max(5).optional(),
    estimatedMinutes: z.number().int().min(1).max(120).optional(),
    dagStructure: z.any().optional(),
    startNodeId: z.string().optional(),
    tags: z.array(z.string()).optional(),
    flightContext: z.record(z.any()).optional(),
    learningObjectives: z.array(z.string()).optional(),
    prerequisites: z.array(z.object({
      type: z.enum(['script', 'commBlock']),
      id: z.string(),
      name: z.string().optional(),
      minScore: z.number().optional()
    })).optional()
  })
});

const listScriptsSchema = z.object({
  scriptType: z.enum(['training', 'evaluation', 'scenario', 'adaptive']).optional(),
  difficultyLevel: z.number().int().min(1).max(5).optional(),
  orderBy: z.enum(['code', 'name', 'difficultyLevel']).optional(),
  orderDirection: z.enum(['asc', 'desc']).optional()
});

// Middleware to check joni-comm-blocks access
const requireCommBlockAccess = protectedProcedure.use(requireFeatureAccess('joni', 'joni-comm-blocks'));

export const joniScriptRouter = router({
  // ===== PUBLIC PROCEDURES (for practice) =====
  
  list: protectedProcedure
    .input(listScriptsSchema)
    .query(async ({ input }) => {
      return joniScriptService.getAllScripts(input);
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const script = await joniScriptService.getScriptById(input.id);
      if (!script) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Script not found'
        });
      }
      return script;
    }),

  getByCode: protectedProcedure
    .input(z.object({ code: z.string() }))
    .query(async ({ input }) => {
      const script = await joniScriptService.getScriptByCode(input.code);
      if (!script) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Script not found'
        });
      }
      return script;
    }),

  search: protectedProcedure
    .input(z.object({ searchTerm: z.string() }))
    .query(async ({ input }) => {
      return joniScriptService.searchScripts(input.searchTerm);
    }),

  getWithPracticeStatus: protectedProcedure
    .query(async ({ ctx }) => {
      return joniScriptService.getScriptsWithPracticeStatus(ctx.user.userId);
    }),

  getStatistics: protectedProcedure
    .query(async () => {
      return joniScriptService.getScriptStatistics();
    }),

  validatePrerequisites: protectedProcedure
    .input(z.object({ scriptId: z.string() }))
    .query(async ({ ctx, input }) => {
      return joniScriptService.validatePrerequisites(ctx.user.userId, input.scriptId);
    }),


  // ===== ADMIN PROCEDURES (require joni-comm-blocks access) =====

  create: requireCommBlockAccess
    .input(createScriptSchema)
    .mutation(async ({ input }) => {
      try {
        return await joniScriptService.createScript(input);
      } catch (error: any) {
        if (error.code === 'P2002') {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'A script with this code already exists'
          });
        }
        throw error;
      }
    }),

  update: requireCommBlockAccess
    .input(updateScriptSchema)
    .mutation(async ({ input }) => {
      try {
        return await joniScriptService.updateScript(input.id, input.data);
      } catch (error: any) {
        if (error.code === 'P2002') {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'A script with this code already exists'
          });
        }
        if (error.code === 'P2025') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Script not found'
          });
        }
        throw error;
      }
    }),

  delete: requireCommBlockAccess
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      try {
        return await joniScriptService.deleteScript(input.id);
      } catch (error: any) {
        if (error.code === 'P2025') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Script not found'
          });
        }
        if (error.code === 'P2003') {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Cannot delete script as it is being used in practice records'
          });
        }
        throw error;
      }
    }),

  createMany: requireCommBlockAccess
    .input(z.object({
      scripts: z.array(createScriptSchema)
    }))
    .mutation(async ({ input }) => {
      return joniScriptService.createManyScripts(input.scripts);
    })
});