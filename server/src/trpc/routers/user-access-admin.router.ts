import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { userAccessService, GrantAccessInput, BulkGrantAccessInput } from '../../services/user-access.service';
import { FeatureId } from '../../services/features.config';

/**
 * Admin router for user access management
 * This demonstrates how to use the consolidated userAccessService for admin operations
 */
export const userAccessAdminRouter = router({
  /**
   * Grant access to a user with validation
   */
  grantAccess: protectedProcedure
    .input(z.object({
      userId: z.string(),
      featureId: z.string(),
      subFeatureId: z.string(),
      metadata: z.record(z.any()).optional(),
      grantCause: z.enum(['manual', 'subscription']).optional(),
      expiresAt: z.date().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // In a real app, you'd check if ctx.user has admin permissions
      
      const grantInput: GrantAccessInput = {
        userId: input.userId,
        featureId: input.featureId as FeatureId,
        subFeatureId: input.subFeatureId as any,
        metadata: input.metadata,
        grantCause: input.grantCause,
        expiresAt: input.expiresAt,
        grantedBy: ctx.user.userId, // Current user is the grantor
      };

      return await userAccessService.grantAccessWithValidation(grantInput);
    }),

  /**
   * Bulk grant access to multiple users
   */
  bulkGrantAccess: protectedProcedure
    .input(z.object({
      userIds: z.array(z.string()),
      featureId: z.string(),
      subFeatureIds: z.array(z.string()),
      metadata: z.record(z.any()).optional(),
      grantCause: z.enum(['manual', 'subscription']).optional(),
      expiresAt: z.date().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const bulkInput: BulkGrantAccessInput = {
        userIds: input.userIds,
        featureId: input.featureId as FeatureId,
        subFeatureIds: input.subFeatureIds as any[],
        metadata: input.metadata,
        grantCause: input.grantCause,
        expiresAt: input.expiresAt,
        grantedBy: ctx.user.userId,
      };

      return await userAccessService.bulkGrantAccess(bulkInput);
    }),

  /**
   * Revoke access from a user
   */
  revokeAccess: protectedProcedure
    .input(z.object({
      userId: z.string(),
      featureId: z.string(),
      subFeatureIds: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      await userAccessService.revokeAccessBulk(
        input.userId,
        input.featureId as FeatureId,
        input.subFeatureIds as any[] | undefined
      );
      return { success: true };
    }),

  /**
   * Get all users with access to a feature
   */
  getUsersWithAccess: protectedProcedure
    .input(z.object({
      featureId: z.string(),
      subFeatureId: z.string().optional(),
    }))
    .query(async ({ input }) => {
      return await userAccessService.getUsersWithAccess(
        input.featureId as FeatureId,
        input.subFeatureId as any
      );
    }),

  /**
   * Clone access from one user to another
   */
  cloneUserAccess: protectedProcedure
    .input(z.object({
      sourceUserId: z.string(),
      targetUserId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await userAccessService.cloneUserAccess(
        input.sourceUserId,
        input.targetUserId,
        ctx.user.userId
      );
    }),

  /**
   * Get user access history
   */
  getUserAccessHistory: protectedProcedure
    .input(z.object({
      userId: z.string(),
    }))
    .query(async ({ input }) => {
      return await userAccessService.getUserAccessHistory(input.userId);
    }),
});