import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { joniScenarioService } from '../../services/joni/joni-scenario.service';
import { TRPCError } from '@trpc/server';

// Middleware to check backoffice-scenario access
const requireBackofficeScenario = protectedProcedure.use(async ({ ctx, next }) => {
  const hasAccess = await ctx.userAccess.validateUserAccess(
    ctx.user.userId,
    'backoffice',
    'backoffice-scenario'
  );

  if (!hasAccess) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You do not have access to scenario management'
    });
  }

  return next({ ctx });
});

// Schema definitions
const createSubjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional()
});

const updateSubjectSchema = z.object({
  id: z.string(),
  data: z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().optional()
  })
});

const createScenarioSchema = z.object({
  subjectId: z.string(),
  groupId: z.string(),
  orderInGroup: z.number().int().min(0),
  flightInformation: z.string().min(1),
  expectedAnswer: z.string().min(1),
  currentStatus: z.string().min(1)
});

const updateScenarioSchema = z.object({
  id: z.string(),
  data: z.object({
    subjectId: z.string().optional(),
    groupId: z.string().optional(),
    orderInGroup: z.number().int().min(0).optional(),
    flightInformation: z.string().min(1).optional(),
    expectedAnswer: z.string().min(1).optional(),
    currentStatus: z.string().min(1).optional()
  })
});

export const joniScenarioRouter = router({
  // ===== SUBJECTS =====
  
  createSubject: requireBackofficeScenario
    .input(createSubjectSchema)
    .mutation(async ({ input }) => {
      try {
        return await joniScenarioService.createSubject(input);
      } catch (error: any) {
        if (error.code === 'P2002') {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'A subject with this name already exists'
          });
        }
        throw error;
      }
    }),

  getAllSubjects: requireBackofficeScenario
    .query(async () => {
      return joniScenarioService.getAllSubjects();
    }),

  getSubjectById: requireBackofficeScenario
    .input(z.string())
    .query(async ({ input }) => {
      const subject = await joniScenarioService.getSubjectById(input);
      if (!subject) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Subject not found'
        });
      }
      return subject;
    }),

  updateSubject: requireBackofficeScenario
    .input(updateSubjectSchema)
    .mutation(async ({ input }) => {
      try {
        return await joniScenarioService.updateSubject(input.id, input.data);
      } catch (error: any) {
        if (error.code === 'P2002') {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'A subject with this name already exists'
          });
        }
        if (error.code === 'P2025') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Subject not found'
          });
        }
        throw error;
      }
    }),

  deleteSubject: requireBackofficeScenario
    .input(z.string())
    .mutation(async ({ input }) => {
      try {
        // Check if subject has any scenarios
        const scenarioCount = await joniScenarioService.getScenarioCountBySubject(input);
        if (scenarioCount > 0) {
          throw new TRPCError({
            code: 'PRECONDITION_FAILED',
            message: `Cannot delete subject with ${scenarioCount} existing scenario${scenarioCount > 1 ? 's' : ''}`
          });
        }
        return await joniScenarioService.deleteSubject(input);
      } catch (error: any) {
        if (error.code === 'PRECONDITION_FAILED') {
          throw error;
        }
        if (error.code === 'P2025') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Subject not found'
          });
        }
        throw error;
      }
    }),

  // ===== SCENARIOS =====

  createScenario: requireBackofficeScenario
    .input(createScenarioSchema)
    .mutation(async ({ input }) => {
      try {
        return await joniScenarioService.createScenario({
          subjectId: input.subjectId,
          groupId: input.groupId,
          orderInGroup: input.orderInGroup,
          flightInformation: input.flightInformation,
          expectedAnswer: input.expectedAnswer,
          currentStatus: input.currentStatus
        });
      } catch (error: any) {
        if (error.code === 'P2003') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Subject not found'
          });
        }
        throw error;
      }
    }),

  getAllScenarios: requireBackofficeScenario
    .input(z.object({
      subjectId: z.string().optional()
    }).optional())
    .query(async ({ input }) => {
      return joniScenarioService.getAllScenarios(input?.subjectId);
    }),

  getScenarioById: requireBackofficeScenario
    .input(z.string())
    .query(async ({ input }) => {
      const scenario = await joniScenarioService.getScenarioById(input);
      if (!scenario) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Scenario not found'
        });
      }
      return scenario;
    }),

  updateScenario: requireBackofficeScenario
    .input(updateScenarioSchema)
    .mutation(async ({ input }) => {
      try {
        return await joniScenarioService.updateScenario(input.id, input.data);
      } catch (error: any) {
        if (error.code === 'P2003') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Subject not found'
          });
        }
        if (error.code === 'P2025') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Scenario not found'
          });
        }
        throw error;
      }
    }),

  // ===== STATS =====

  getScenarioStats: requireBackofficeScenario
    .input(z.string())
    .query(async ({ input }) => {
      return joniScenarioService.getScenarioStats(input);
    })
});