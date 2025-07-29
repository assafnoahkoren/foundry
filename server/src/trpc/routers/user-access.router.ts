import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { UserAccessService } from '../../services/user-access.service';
import { featuresConfig, FeatureId } from '../../services/features.config';

// Schema for user feature access response
const SubFeatureAccessSchema = z.object({
  subFeatureId: z.string(),
  subFeatureName: z.string(),
  subFeatureDescription: z.string(),
  metadata: z.record(z.any()),
  grantedAt: z.date(),
  grantedBy: z.string().optional(),
  grantCause: z.enum(['manual', 'subscription']),
  expiresAt: z.date().optional(),
});

const UserFeatureAccessSchema = z.object({
  featureId: z.string(),
  featureName: z.string(),
  featureDescription: z.string(),
  subFeatures: z.array(SubFeatureAccessSchema),
});

export const userAccessRouter = router({
  /**
   * Get all features and sub-features the current user has access to
   * This is the main endpoint for the UI to determine what features to show
   */
  getMyFeatures: protectedProcedure
    .output(z.array(UserFeatureAccessSchema))
    .query(async ({ ctx }) => {
      const userAccessService = new UserAccessService(ctx.prisma);
      return await userAccessService.getUserFeatures(ctx.user.userId);
    }),

  /**
   * Get features configuration (structure only, not user-specific)
   * Useful for admin interfaces or feature documentation
   */
  getFeaturesConfig: protectedProcedure
    .output(z.any()) // Using z.any() for flexibility with the config structure
    .query(() => {
      // Return features config without sensitive information
      const safeConfig: any = {
        features: {}
      };

      for (const [featureId, feature] of Object.entries(featuresConfig.features)) {
        safeConfig.features[featureId] = {
          id: feature.id,
          name: feature.name,
          description: feature.description,
          subFeatures: {}
        };

        for (const [subFeatureId, subFeature] of Object.entries(feature.subFeatures)) {
          safeConfig.features[featureId].subFeatures[subFeatureId] = {
            id: subFeature.id,
            name: subFeature.name,
            description: subFeature.description,
            // Include metadata structure but not validation rules
            metadata: subFeature.metadata ? 
              Object.entries(subFeature.metadata).reduce((acc, [key, def]: [string, any]) => {
                acc[key] = {
                  type: def.type,
                  default: def.default,
                  description: def.description
                };
                return acc;
              }, {} as any) : undefined
          };
        }
      }

      return safeConfig;
    }),

  /**
   * Check if current user has access to a specific feature or sub-feature
   * This could be useful for conditional rendering or API access control
   */
  checkAccess: protectedProcedure
    .input(z.object({
      featureId: z.string(),
      subFeatureId: z.string().optional(),
    }))
    .output(z.boolean())
    .query(async ({ ctx, input }) => {
      const userAccessService = new UserAccessService(ctx.prisma);
      return await userAccessService.validateUserAccess(
        ctx.user.userId,
        input.featureId as FeatureId,
        input.subFeatureId as any
      );
    }),
});