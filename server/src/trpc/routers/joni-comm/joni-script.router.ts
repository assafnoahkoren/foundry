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
  scriptType: z.enum(['training', 'evaluation', 'scenario']),
  phase: z.enum(['ground', 'departure', 'enroute', 'approach', 'emergency']),
  difficultyLevel: z.number().int().min(1).max(5).default(3),
  estimatedMinutes: z.number().int().min(1).max(120).default(5),
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
    scriptType: z.enum(['training', 'evaluation', 'scenario']).optional(),
    phase: z.enum(['ground', 'departure', 'enroute', 'approach', 'emergency']).optional(),
    difficultyLevel: z.number().int().min(1).max(5).optional(),
    estimatedMinutes: z.number().int().min(1).max(120).optional(),
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
  scriptType: z.enum(['training', 'evaluation', 'scenario']).optional(),
  phase: z.enum(['ground', 'departure', 'enroute', 'approach', 'emergency']).optional(),
  difficultyLevel: z.number().int().min(1).max(5).optional(),
  orderBy: z.enum(['code', 'name', 'phase', 'difficultyLevel']).optional(),
  orderDirection: z.enum(['asc', 'desc']).optional()
});

const scriptTransmissionSchema = z.object({
  transmissionId: z.string(),
  orderInScript: z.number().int(),
  actorRole: z.enum(['pilot', 'tower', 'ground', 'approach', 'departure', 'center']),
  expectedDelay: z.number().int().optional(),
  triggerCondition: z.string().optional()
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

  getVariablesFromTransmissions: protectedProcedure
    .input(z.object({ transmissionIds: z.array(z.string()) }))
    .query(async ({ input }) => {
      return joniScriptService.getVariablesFromTransmissions(input.transmissionIds);
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
    }),

  // ===== SCRIPT TRANSMISSIONS MANAGEMENT =====

  addTransmission: requireCommBlockAccess
    .input(z.object({
      scriptId: z.string(),
      transmission: scriptTransmissionSchema
    }))
    .mutation(async ({ input }) => {
      try {
        return await joniScriptService.addTransmissionToScript({
          scriptId: input.scriptId,
          ...input.transmission
        });
      } catch (error: any) {
        if (error.code === 'P2002') {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'A transmission already exists at this order position'
          });
        }
        if (error.code === 'P2003') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Script or transmission template not found'
          });
        }
        throw error;
      }
    }),

  updateTransmission: requireCommBlockAccess
    .input(z.object({
      scriptId: z.string(),
      orderInScript: z.number().int(),
      data: z.object({
        transmissionId: z.string().optional(),
        orderInScript: z.number().int().optional(),
        actorRole: z.enum(['pilot', 'tower', 'ground', 'approach', 'departure', 'center']).optional(),
        expectedDelay: z.number().int().optional(),
        triggerCondition: z.string().optional()
      })
    }))
    .mutation(async ({ input }) => {
      try {
        return await joniScriptService.updateScriptTransmission(
          input.scriptId,
          input.orderInScript,
          input.data
        );
      } catch (error: any) {
        if (error.code === 'P2025') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Script transmission not found'
          });
        }
        throw error;
      }
    }),

  removeTransmission: requireCommBlockAccess
    .input(z.object({
      scriptId: z.string(),
      orderInScript: z.number().int()
    }))
    .mutation(async ({ input }) => {
      try {
        return await joniScriptService.removeTransmissionFromScript(
          input.scriptId,
          input.orderInScript
        );
      } catch (error: any) {
        if (error.code === 'P2025') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Script transmission not found'
          });
        }
        throw error;
      }
    }),

  reorderTransmissions: requireCommBlockAccess
    .input(z.object({
      scriptId: z.string(),
      newOrder: z.array(z.object({
        transmissionId: z.string(),
        orderInScript: z.number().int()
      }))
    }))
    .mutation(async ({ input }) => {
      await joniScriptService.reorderScriptTransmissions(input.scriptId, input.newOrder);
      return { success: true };
    })
});