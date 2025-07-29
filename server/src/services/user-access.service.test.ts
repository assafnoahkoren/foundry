import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { UserAccessService } from './user-access.service';

// Mock PrismaClient
const mockPrismaClient = {
  userAccess: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    upsert: vi.fn(),
    delete: vi.fn(),
  },
} as unknown as PrismaClient;

describe('UserAccessService', () => {
  let service: UserAccessService;

  beforeEach(() => {
    service = new UserAccessService(mockPrismaClient);
    vi.clearAllMocks();
  });

  describe('validateUserAccess', () => {
    it('should return true when user has access to a sub-feature', async () => {
      (mockPrismaClient.userAccess.findFirst as any).mockResolvedValue({
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

      const result = await service.validateUserAccess('user1', 'ace', 'ace-analytics');
      expect(result).toBe(true);
    });

    it('should return false when user has no access', async () => {
      (mockPrismaClient.userAccess.findFirst as any).mockResolvedValue(null);

      const result = await service.validateUserAccess('user1', 'ace', 'ace-analytics');
      expect(result).toBe(false);
    });

    it('should return true when checking feature access and user has any sub-feature', async () => {
      (mockPrismaClient.userAccess.findFirst as any).mockResolvedValue({
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

      const result = await service.validateUserAccess('user1', 'ace');
      expect(result).toBe(true);
    });

    it('should throw error for non-existent feature', async () => {
      await expect(
        service.validateUserAccess('user1', 'non-existent-feature' as any)
      ).rejects.toThrow("Feature 'non-existent-feature' does not exist");
    });
  });

  describe('getUserFeatures', () => {
    it('should return user features with proper structure', async () => {
      (mockPrismaClient.userAccess.findMany as any).mockResolvedValue([
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
          featureId: 'johnny-english',
          subFeatureId: 'johnny-english-gadgets',
          metadata: { gadgetLevel: 'advanced' },
          grantedAt: new Date('2024-01-15'),
          expiresAt: null,
          updatedAt: new Date(),
          grantedBy: 'admin1',
          grantCause: 'subscription',
        },
      ]);

      const result = await service.getUserFeatures('user1');

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
        featureId: 'johnny-english',
        featureName: 'Johnny English Feature Suite',
        subFeatures: [
          {
            subFeatureId: 'johnny-english-gadgets',
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