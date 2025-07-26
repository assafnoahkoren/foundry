/**
 * Feature Authorization Examples
 * 
 * This file shows various ways to use the feature authorization system
 */

import { featureService } from '../services/subscription/feature.service';
import { requireFeature } from '../trpc/middleware/requireFeature';
import { router, protectedProcedure } from '../trpc/trpc';
import { z } from 'zod';

// ============================================
// 1. Basic Feature Check in Service
// ============================================
export async function exportUserData(userId: string) {
  // Check if user has access to data export feature
  const hasAccess = await featureService.hasAccess(userId, 'data-export');
  
  if (!hasAccess) {
    throw new Error('Data export requires a Pro subscription');
  }
  
  // User has access, proceed with export
  console.log('Exporting data for user:', userId);
  // ... export logic
}

// ============================================
// 2. Protect API Endpoints with Features
// ============================================
export const apiRouter = router({
  // Single feature requirement
  generateReport: protectedProcedure
    .use(requireFeature('advanced-analytics'))
    .input(z.object({
      startDate: z.string(),
      endDate: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      // User verified to have 'advanced-analytics' feature
      return {
        report: 'Advanced analytics report',
        userId: ctx.userId,
        period: `${input.startDate} to ${input.endDate}`
      };
    }),
  
  // Multiple features required
  exportAnalytics: protectedProcedure
    .use(requireFeature('advanced-analytics'))
    .use(requireFeature('data-export'))
    .mutation(async ({ ctx }) => {
      // User must have BOTH features
      return { exported: true };
    }),
});

// ============================================
// 3. Feature-Based Rate Limiting
// ============================================
const API_LIMITS = {
  'api-access': {
    free: 100,      // 100 requests per hour
    pro: 1000,      // 1000 requests per hour
    enterprise: -1, // Unlimited
  }
};

export async function checkApiRateLimit(userId: string): Promise<boolean> {
  const features = await featureService.getUserFeatures(userId);
  
  // Determine tier based on features
  let tier = 'free';
  if (features.some(f => f.name === 'enterprise-api')) {
    tier = 'enterprise';
  } else if (features.some(f => f.name === 'pro-api')) {
    tier = 'pro';
  }
  
  const limit = API_LIMITS['api-access'][tier];
  if (limit === -1) return true; // Unlimited
  
  // Check current usage (implement your rate limiting logic)
  const currentUsage = await getHourlyUsage(userId);
  return currentUsage < limit;
}

// ============================================
// 4. Conditional Feature Access
// ============================================
export async function getAvailableExportFormats(userId: string) {
  const formats = ['CSV']; // Basic format for everyone
  
  // Check additional format access
  if (await featureService.hasAccess(userId, 'export-json')) {
    formats.push('JSON');
  }
  
  if (await featureService.hasAccess(userId, 'export-excel')) {
    formats.push('XLSX');
  }
  
  if (await featureService.hasAccess(userId, 'export-pdf')) {
    formats.push('PDF');
  }
  
  return formats;
}

// ============================================
// 5. Feature Flags for Progressive Rollout
// ============================================
export async function enableNewDashboard(userId: string): Promise<boolean> {
  // Check if user has access to beta feature
  const hasBetaAccess = await featureService.hasAccess(userId, 'beta-dashboard');
  
  if (hasBetaAccess) {
    // Check variant from feature metadata
    const access = await prisma.featureAccess.findFirst({
      where: {
        userId,
        feature: { name: 'beta-dashboard' }
      }
    });
    
    const variant = access?.metadata?.variant as string;
    return variant === 'enabled';
  }
  
  return false;
}

// ============================================
// 6. Admin Override Example
// ============================================
export async function grantTemporaryAccess(
  adminId: string,
  targetUserId: string,
  featureName: string,
  days: number,
  reason: string
) {
  // Verify admin has permission to grant access
  const isAdmin = await featureService.hasAccess(adminId, 'admin-grant-features');
  
  if (!isAdmin) {
    throw new Error('Insufficient permissions');
  }
  
  // Find the feature
  const feature = await prisma.feature.findUnique({
    where: { name: featureName }
  });
  
  if (!feature) {
    throw new Error('Feature not found');
  }
  
  // Grant temporary access
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + days);
  
  await featureService.grantAccess(
    targetUserId,
    feature.id,
    expiryDate,
    'GRANT'
  );
  
  // Log the action
  console.log(`Admin ${adminId} granted ${featureName} to ${targetUserId} for ${days} days. Reason: ${reason}`);
}

// ============================================
// 7. Usage Tracking Example
// ============================================
export async function trackFeatureUsage(
  userId: string,
  featureName: string,
  action: string
) {
  // Create usage record
  await prisma.featureUsage.create({
    data: {
      userId,
      feature: {
        connect: { name: featureName }
      },
      action,
      metadata: {
        timestamp: new Date().toISOString(),
        userAgent: 'example-app',
      }
    }
  });
}

// ============================================
// 8. React Hook Example (Pseudo-code)
// ============================================
/*
// In your React app
function useFeature(featureName: string) {
  const { data: features } = trpc.feature.getUserFeatures.useQuery();
  
  const hasFeature = features?.some(f => f.name === featureName) ?? false;
  const isLoading = !features;
  
  return { hasFeature, isLoading };
}

// Usage in component
function PremiumSection() {
  const { hasFeature, isLoading } = useFeature('premium-content');
  
  if (isLoading) return <Spinner />;
  
  if (!hasFeature) {
    return <UpgradePrompt feature="premium-content" />;
  }
  
  return <PremiumContent />;
}
*/

// Helper function for the example
async function getHourlyUsage(userId: string): Promise<number> {
  // Implement your rate limiting logic here
  return 50; // Mock value
}

// Add prisma import for examples that use it directly
import { prisma } from '../lib/prisma';