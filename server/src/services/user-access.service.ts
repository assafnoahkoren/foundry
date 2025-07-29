import { PrismaClient, UserAccess, Prisma, GrantCause } from '@prisma/client';
import { 
  featuresConfig, 
  MetadataType, 
  FeatureId, 
  SubFeatureId, 
  AnySubFeatureId
} from './features.config';
import { TRPCError } from '@trpc/server';

export interface UserFeatureAccess<T extends FeatureId = FeatureId> {
  featureId: T;
  featureName: string;
  featureDescription: string;
  subFeatures: {
    subFeatureId: SubFeatureId<T>;
    subFeatureName: string;
    subFeatureDescription: string;
    metadata: Record<string, MetadataType>;
    grantedAt: Date;
    grantedBy?: string;
    grantCause: GrantCause;
    expiresAt?: Date;
  }[];
}

export class UserAccessService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Validates if a user has access to a specific sub-feature or feature
   * If user has access to any sub-feature of a feature, they have access to the feature
   * 
   * @param userId - The user's ID
   * @param featureId - The feature ID to check
   * @param subFeatureId - Optional sub-feature ID to check
   * @returns boolean indicating if user has access
   */
  async validateUserAccess<T extends FeatureId>(
    userId: string,
    featureId: T,
    subFeatureId?: SubFeatureId<T>
  ): Promise<boolean> {
    // Validate that the feature exists in configuration
    const feature = featuresConfig.features[featureId];
    if (!feature) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Feature '${featureId}' does not exist`,
      });
    }

    // If checking sub-feature, validate it exists
    if (subFeatureId && !feature.subFeatures[subFeatureId]) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Sub-feature '${subFeatureId}' does not exist in feature '${featureId}'`,
      });
    }

    // Build query conditions
    const where: Prisma.UserAccessWhereInput = {
      userId,
      featureId,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } }
      ]
    };

    // If checking specific sub-feature
    if (subFeatureId) {
      where.subFeatureId = subFeatureId;
    }

    // Check if user has access
    const access = await this.prisma.userAccess.findFirst({
      where
    });

    return !!access;
  }

  /**
   * Get all features and sub-features a user has access to
   * Groups the access by feature for easier UI consumption
   * 
   * @param userId - The user's ID
   * @returns Array of features with their accessible sub-features
   */
  async getUserFeatures(userId: string): Promise<UserFeatureAccess[]> {
    // Get all active user access records
    const userAccessRecords = await this.prisma.userAccess.findMany({
      where: {
        userId,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      orderBy: [
        { featureId: 'asc' },
        { subFeatureId: 'asc' }
      ]
    });

    // Group by feature and enhance with configuration data
    const featuresMap = new Map<FeatureId, UserFeatureAccess>();

    for (const access of userAccessRecords) {
      const featureConfig = featuresConfig.features[access.featureId as FeatureId];
      if (!featureConfig) continue; // Skip if feature no longer exists in config

      const subFeatureConfig = (featureConfig.subFeatures as any)[access.subFeatureId];
      if (!subFeatureConfig) continue; // Skip if sub-feature no longer exists

      // Get or create feature entry
      if (!featuresMap.has(access.featureId as FeatureId)) {
        featuresMap.set(access.featureId as FeatureId, {
          featureId: featureConfig.id as FeatureId,
          featureName: featureConfig.name,
          featureDescription: featureConfig.description,
          subFeatures: []
        });
      }

      const featureAccess = featuresMap.get(access.featureId as FeatureId)!;

      // Parse metadata and merge with defaults
      const metadata = this.mergeMetadataWithDefaults(
        access.metadata as Record<string, any>,
        subFeatureConfig.metadata || {}
      );

      // Add sub-feature
      featureAccess.subFeatures.push({
        subFeatureId: subFeatureConfig.id as AnySubFeatureId,
        subFeatureName: subFeatureConfig.name,
        subFeatureDescription: subFeatureConfig.description,
        metadata,
        grantedAt: access.grantedAt,
        grantedBy: access.grantedBy || undefined,
        grantCause: access.grantCause,
        expiresAt: access.expiresAt || undefined
      });
    }

    return Array.from(featuresMap.values());
  }

  /**
   * Grant access to a user for a specific sub-feature
   * 
   * @param userId - The user's ID
   * @param featureId - The feature ID
   * @param subFeatureId - The sub-feature ID
   * @param metadata - Optional metadata overrides
   * @param grantedBy - ID of the admin granting access
   * @param grantCause - Reason for granting access (manual or subscription)
   * @param expiresAt - Optional expiration date
   */
  async grantAccess<T extends FeatureId>(
    userId: string,
    featureId: T,
    subFeatureId: SubFeatureId<T>,
    metadata?: Record<string, any>,
    grantedBy?: string,
    grantCause: GrantCause = GrantCause.manual,
    expiresAt?: Date
  ): Promise<UserAccess> {
    // Validate feature and sub-feature exist
    const feature = featuresConfig.features[featureId];
    if (!feature) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Feature '${featureId}' does not exist`,
      });
    }

    const subFeature = feature.subFeatures[subFeatureId];
    if (!subFeature) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Sub-feature '${subFeatureId}' does not exist in feature '${featureId}'`,
      });
    }

    // Validate metadata if provided
    if (metadata && subFeature.metadata) {
      for (const [key] of Object.entries(metadata)) {
        const metadataDef = subFeature.metadata[key];
        if (!metadataDef) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Invalid metadata key '${key}' for sub-feature '${subFeatureId}'`,
          });
        }
        // Additional validation could be added here
      }
    }

    // Create or update access
    return await this.prisma.userAccess.upsert({
      where: {
        userId_featureId_subFeatureId: {
          userId,
          featureId,
          subFeatureId
        }
      },
      create: {
        userId,
        featureId,
        subFeatureId,
        metadata: metadata || {},
        grantedBy,
        grantCause,
        expiresAt
      },
      update: {
        metadata: metadata || {},
        grantedBy,
        grantCause,
        expiresAt,
        updatedAt: new Date()
      }
    });
  }

  /**
   * Revoke access from a user for a specific sub-feature
   * 
   * @param userId - The user's ID
   * @param featureId - The feature ID
   * @param subFeatureId - The sub-feature ID
   */
  async revokeAccess<T extends FeatureId>(
    userId: string,
    featureId: T,
    subFeatureId: SubFeatureId<T>
  ): Promise<void> {
    await this.prisma.userAccess.delete({
      where: {
        userId_featureId_subFeatureId: {
          userId,
          featureId,
          subFeatureId
        }
      }
    }).catch(() => {
      // Ignore if doesn't exist
    });
  }

  /**
   * Merge user-specific metadata with default values from configuration
   */
  private mergeMetadataWithDefaults(
    userMetadata: Record<string, any>,
    metadataDefinitions: Record<string, any>
  ): Record<string, MetadataType> {
    const result: Record<string, MetadataType> = {};

    // Start with defaults from configuration
    for (const [key, definition] of Object.entries(metadataDefinitions)) {
      result[key] = definition.default;
    }

    // Override with user-specific values
    for (const [key, value] of Object.entries(userMetadata)) {
      if (key in metadataDefinitions) {
        result[key] = value;
      }
    }

    return result;
  }
}