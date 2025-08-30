import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { joniScenarioGroupService } from '../../services/joni/joni-scenario-group.service';

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
      message: 'You do not have access to manage scenarios'
    });
  }

  return next();
});

// Input validation schemas
const createGroupSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  subjectId: z.string(),
});

const updateGroupSchema = z.object({
  id: z.string(),
  data: z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().optional(),
    subjectId: z.string().optional(),
  })
});

const moveScenarioToGroupSchema = z.object({
  scenarioId: z.string(),
  groupId: z.string(),
});


export const joniScenarioGroupRouter = router({
  // ===== CREATE =====
  createGroup: requireBackofficeScenario
    .input(createGroupSchema)
    .mutation(async ({ input }) => {
      try {
        return await joniScenarioGroupService.createGroup(input);
      } catch (error: any) {
        if (error.code === 'P2003') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Subject not found'
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create group'
        });
      }
    }),

  // ===== READ =====
  getAllGroups: requireBackofficeScenario
    .query(async () => {
      return await joniScenarioGroupService.getAllGroups();
    }),

  getGroupsBySubject: requireBackofficeScenario
    .input(z.object({ subjectId: z.string() }))
    .query(async ({ input }) => {
      return await joniScenarioGroupService.getGroupsBySubject(input.subjectId);
    }),

  getGroupById: requireBackofficeScenario
    .input(z.string())
    .query(async ({ input }) => {
      const group = await joniScenarioGroupService.getGroupById(input);
      if (!group) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Group not found'
        });
      }
      return group;
    }),

  // ===== UPDATE =====
  updateGroup: requireBackofficeScenario
    .input(updateGroupSchema)
    .mutation(async ({ input }) => {
      try {
        return await joniScenarioGroupService.updateGroup(input.id, input.data);
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
            message: 'Group not found'
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update group'
        });
      }
    }),

  // ===== DELETE =====
  deleteGroup: requireBackofficeScenario
    .input(z.string())
    .mutation(async ({ input }) => {
      try {
        await joniScenarioGroupService.deleteGroup(input);
        return { success: true };
      } catch (error: any) {
        if (error.code === 'P2025') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Group not found'
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete group'
        });
      }
    }),

  // ===== SCENARIO MANAGEMENT =====
  moveScenarioToGroup: requireBackofficeScenario
    .input(moveScenarioToGroupSchema)
    .mutation(async ({ input }) => {
      try {
        return await joniScenarioGroupService.moveScenarioToGroup(
          input.scenarioId,
          input.groupId
        );
      } catch (error: any) {
        if (error.code === 'P2025') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Scenario or group not found'
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to move scenario to group'
        });
      }
    }),


  // ===== UTILITIES =====
  duplicateGroup: requireBackofficeScenario
    .input(z.object({
      groupId: z.string(),
      newName: z.string().min(1).max(100),
    }))
    .mutation(async ({ input }) => {
      try {
        return await joniScenarioGroupService.duplicateGroup(
          input.groupId,
          input.newName
        );
      } catch (error: any) {
        if (error.message === 'Group not found') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Group not found'
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to duplicate group'
        });
      }
    }),
});