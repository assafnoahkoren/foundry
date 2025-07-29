import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the prisma module
vi.mock('../lib/prisma', () => ({
  prisma: {
    userAccess: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

// Import after mocking
import { userAccessService } from './user-access.service';
import { prisma } from '../lib/prisma';

describe('UserAccessService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateUserAccess', () => {
    it('should return true when user has access to a sub-feature', async () => {
      (prisma.userAccess.findFirst as any).mockResolvedValue({
        id: '1',
        userId: 'user1',
        featureId: 'ace',
        subFeatureId: 'ace-analytics',
        metadata: {},
        grantedAt: new Date(),
        expiresAt: null,
        updatedAt: new Date(),
        grantedBy: null,
        grantCause: 'manual',
      });

      const result = await userAccessService.validateUserAccess('user1', 'ace', 'ace-analytics');
      expect(result).toBe(true);
    });

    it('should return false when user has no access', async () => {
      (prisma.userAccess.findFirst as any).mockResolvedValue(null);

      const result = await userAccessService.validateUserAccess('user1', 'ace', 'ace-analytics');
      expect(result).toBe(false);
    });

    it('should return true when checking feature access and user has any sub-feature', async () => {
      (prisma.userAccess.findFirst as any).mockResolvedValue({
        id: '1',
        userId: 'user1',
        featureId: 'ace',
        subFeatureId: 'ace-api-access',
        metadata: {},
        grantedAt: new Date(),
        expiresAt: null,
        updatedAt: new Date(),
        grantedBy: null,
        grantCause: 'manual',
      });

      const result = await userAccessService.validateUserAccess('user1', 'ace');
      expect(result).toBe(true);
    });

    it('should throw error for non-existent feature', async () => {
      await expect(
        userAccessService.validateUserAccess('user1', 'non-existent-feature' as any)
      ).rejects.toThrow("Feature 'non-existent-feature' does not exist");
    });
  });

  describe('getUserFeatures', () => {
    it('should return user features with proper structure', async () => {
      (prisma.userAccess.findMany as any).mockResolvedValue([
        {
          id: '1',
          userId: 'user1',
          featureId: 'ace',
          subFeatureId: 'ace-analytics',
          metadata: { maxReports: 20 },
          grantedAt: new Date('2024-01-01'),
          expiresAt: null,
          updatedAt: new Date(),
          grantedBy: 'admin1',
          grantCause: 'manual',
        },
        {
          id: '2',
          userId: 'user1',
          featureId: 'joni',
          subFeatureId: 'joni-gadgets',
          metadata: { gadgetLevel: 'advanced' },
          grantedAt: new Date('2024-01-15'),
          expiresAt: null,
          updatedAt: new Date(),
          grantedBy: 'admin1',
          grantCause: 'subscription',
        },
      ]);

      const result = await userAccessService.getUserFeatures('user1');

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        featureId: 'ace',
        featureName: 'Ace Feature Suite',
        subFeatures: [
          {
            subFeatureId: 'ace-analytics',
            subFeatureName: 'Advanced Analytics',
            metadata: expect.objectContaining({
              maxReports: 20,
              dataRetentionDays: 30, // Should include default
            }),
          },
        ],
      });
      expect(result[1]).toMatchObject({
        featureId: 'joni',
        featureName: 'Johnny English Feature Suite',
        subFeatures: [
          {
            subFeatureId: 'joni-gadgets',
            subFeatureName: 'Spy Gadgets',
            metadata: expect.objectContaining({
              gadgetLevel: 'advanced',
              maxActiveGadgets: 3, // Should include default
            }),
          },
        ],
      });
    });
  });
});