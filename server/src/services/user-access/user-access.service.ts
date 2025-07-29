import { User, UserAccess, Prisma, GrantCause } from '@prisma/client';
import { 
  featuresConfig, 
  MetadataType, 
  FeatureId, 
  SubFeatureId, 
  AnySubFeatureId
} from './features';
import { TRPCError } from '@trpc/server';
import { prisma } from '../../lib/prisma';

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

export interface GrantAccessInput<T extends FeatureId = FeatureId> {
  userId: string;
  featureId: T;
  subFeatureId: SubFeatureId<T>;
  metadata?: Record<string, any>;
  grantCause?: GrantCause;
  expiresAt?: Date;
  grantedBy: string; // Admin user ID
}

export interface BulkGrantAccessInput<T extends FeatureId = FeatureId> {
  userIds: string[];
  featureId: T;
  subFeatureIds: SubFeatureId<T>[];
  metadata?: Record<string, any>;
  grantCause?: GrantCause;
  expiresAt?: Date;
  grantedBy: string;
}

export class UserAccessService {

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
    const access = await prisma.userAccess.findFirst({
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
    const userAccessRecords = await prisma.userAccess.findMany({
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
    return await prisma.userAccess.upsert({
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
    await prisma.userAccess.delete({
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

  /**
   * Grant access to a single user for a single sub-feature (with user validation)
   * This is a convenience method that validates the user exists first
   */
  async grantAccessWithValidation<T extends FeatureId>(input: GrantAccessInput<T>): Promise<UserAccess> {
    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: input.userId }
    });

    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: `User with ID ${input.userId} not found`,
      });
    }

    return await this.grantAccess(
      input.userId,
      input.featureId,
      input.subFeatureId,
      input.metadata,
      input.grantedBy,
      input.grantCause || GrantCause.manual,
      input.expiresAt
    );
  }

  /**
   * Grant access to multiple users for multiple sub-features at once
   */
  async bulkGrantAccess<T extends FeatureId>(input: BulkGrantAccessInput<T>): Promise<UserAccess[]> {
    const results: UserAccess[] = [];

    // Verify all users exist
    const users = await prisma.user.findMany({
      where: { id: { in: input.userIds } }
    });

    if (users.length !== input.userIds.length) {
      const foundIds = users.map(u => u.id);
      const missingIds = input.userIds.filter(id => !foundIds.includes(id));
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: `Users not found: ${missingIds.join(', ')}`,
      });
    }

    // Grant access for each user-subfeature combination
    for (const userId of input.userIds) {
      for (const subFeatureId of input.subFeatureIds) {
        const access = await this.grantAccess(
          userId,
          input.featureId,
          subFeatureId,
          input.metadata,
          input.grantedBy,
          input.grantCause || GrantCause.manual,
          input.expiresAt
        );
        results.push(access);
      }
    }

    return results;
  }

  /**
   * Revoke access from a user for specific sub-features or all sub-features of a feature
   */
  async revokeAccessBulk<T extends FeatureId>(
    userId: string,
    featureId: T,
    subFeatureIds?: SubFeatureId<T>[]
  ): Promise<void> {
    if (subFeatureIds && subFeatureIds.length > 0) {
      // Revoke specific sub-features
      for (const subFeatureId of subFeatureIds) {
        await this.revokeAccess(userId, featureId, subFeatureId);
      }
    } else {
      // Revoke all sub-features of the feature
      const feature = featuresConfig.features[featureId];
      if (!feature) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Feature '${featureId}' does not exist`,
        });
      }

      const allSubFeatureIds = Object.keys(feature.subFeatures) as SubFeatureId<T>[];
      for (const subFeatureId of allSubFeatureIds) {
        await this.revokeAccess(userId, featureId, subFeatureId);
      }
    }
  }

  /**
   * Get all users who have access to a specific feature or sub-feature
   */
  async getUsersWithAccess<T extends FeatureId>(
    featureId: T,
    subFeatureId?: SubFeatureId<T>
  ): Promise<(User & { access: UserAccess[] })[]> {
    const where: any = { featureId };
    if (subFeatureId) {
      where.subFeatureId = subFeatureId;
    }

    const accesses = await prisma.userAccess.findMany({
      where: {
        ...where,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      include: {
        user: true
      }
    });

    // Group by user
    const usersMap = new Map<string, User & { access: UserAccess[] }>();

    for (const access of accesses) {
      if (!usersMap.has(access.userId)) {
        usersMap.set(access.userId, {
          ...access.user,
          access: []
        });
      }
      usersMap.get(access.userId)!.access.push(access);
    }

    return Array.from(usersMap.values());
  }

  /**
   * Clone access from one user to another
   */
  async cloneUserAccess(
    sourceUserId: string,
    targetUserId: string,
    grantedBy: string
  ): Promise<UserAccess[]> {
    // Get all active access for source user
    const sourceAccess = await prisma.userAccess.findMany({
      where: {
        userId: sourceUserId,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      }
    });

    const results: UserAccess[] = [];

    // Grant same access to target user
    for (const access of sourceAccess) {
      const newAccess = await this.grantAccess(
        targetUserId,
        access.featureId as FeatureId,
        access.subFeatureId as any,
        access.metadata as Record<string, any>,
        grantedBy,
        access.grantCause,
        access.expiresAt || undefined
      );
      results.push(newAccess);
    }

    return results;
  }

  /**
   * Get access audit log for a user
   */
  async getUserAccessHistory(userId: string): Promise<UserAccess[]> {
    return await prisma.userAccess.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' }
    });
  }
}

// Export singleton instance
export const userAccessService = new UserAccessService();