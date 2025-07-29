import { TRPCError } from '@trpc/server';
import { userAccessService } from '../services/user-access.service';
import { FeatureId, SubFeatureId } from '../services/features.config';

/**
 * Middleware to check if user has access to a specific feature
 * This can be used in tRPC procedures or other parts of the application
 * 
 * Example usage in a tRPC procedure:
 * 
 * .use(requireFeatureAccess('ace', 'ace-analytics'))
 * .query(async ({ ctx }) => {
 *   // User has access to ace-analytics
 * })
 */
export function requireFeatureAccess<T extends FeatureId>(featureId: T, subFeatureId?: SubFeatureId<T>) {
  return async ({ ctx, next }: any) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in to access this feature',
      });
    }

    const hasAccess = await userAccessService.validateUserAccess(
      ctx.user.userId,
      featureId,
      subFeatureId
    );

    if (!hasAccess) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `You do not have access to ${subFeatureId || featureId}`,
      });
    }

    return next({
      ctx: {
        ...ctx,
        // Optionally add feature metadata to context
        featureAccess: {
          featureId,
          subFeatureId,
        },
      },
    });
  };
}

/**
 * Helper function to check user access in services or other non-tRPC contexts
 */
export async function checkUserFeatureAccess<T extends FeatureId>(
  userId: string,
  featureId: T,
  subFeatureId?: SubFeatureId<T>
): Promise<boolean> {
  return await userAccessService.validateUserAccess(userId, featureId, subFeatureId);
}