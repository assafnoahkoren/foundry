import { PrismaClient, User, UserAccess, GrantCause } from '@prisma/client';
import { UserAccessService } from './user-access.service';
import { featuresConfig, FeatureId, SubFeatureId } from './features.config';
import { TRPCError } from '@trpc/server';

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

export class UserAccessAdminService {
  private userAccessService: UserAccessService;

  constructor(private prisma: PrismaClient) {
    this.userAccessService = new UserAccessService(prisma);
  }

  /**
   * Grant access to a single user for a single sub-feature
   */
  async grantAccess<T extends FeatureId>(input: GrantAccessInput<T>): Promise<UserAccess> {
    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: input.userId }
    });

    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: `User with ID ${input.userId} not found`,
      });
    }

    return await this.userAccessService.grantAccess(
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
    const users = await this.prisma.user.findMany({
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
        const access = await this.userAccessService.grantAccess(
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
   * Revoke access from a user for specific sub-features
   */
  async revokeAccess<T extends FeatureId>(
    userId: string,
    featureId: T,
    subFeatureIds?: SubFeatureId<T>[]
  ): Promise<void> {
    if (subFeatureIds && subFeatureIds.length > 0) {
      // Revoke specific sub-features
      for (const subFeatureId of subFeatureIds) {
        await this.userAccessService.revokeAccess(userId, featureId, subFeatureId);
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
        await this.userAccessService.revokeAccess(userId, featureId, subFeatureId);
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

    const accesses = await this.prisma.userAccess.findMany({
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
    const sourceAccess = await this.prisma.userAccess.findMany({
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
      const newAccess = await this.userAccessService.grantAccess(
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
    return await this.prisma.userAccess.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' }
    });
  }
}