import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { requireFeatureAccess } from '../../middleware/feature-access.middleware';

/**
 * Example router showing how to use feature access middleware
 * This demonstrates protecting endpoints with specific feature requirements
 */
export const exampleProtectedRouter = router({
  /**
   * Example: Endpoint that requires ace-analytics access
   */
  generateAnalyticsReport: publicProcedure
    .use(requireFeatureAccess('ace', 'ace-analytics'))
    .input(z.object({
      startDate: z.string(),
      endDate: z.string(),
      format: z.enum(['pdf', 'csv', 'excel', 'json']),
    }))
    .mutation(async ({ ctx, input }) => {
      // At this point, we know the user has access to ace-analytics
      // The feature metadata is available in ctx.featureAccess if needed
      
      // TODO: Implement actual analytics report generation
      return {
        success: true,
        message: `Analytics report requested from ${input.startDate} to ${input.endDate} in ${input.format} format`,
        // In a real implementation, you might return a job ID or the actual report
      };
    }),

  /**
   * Example: Endpoint that requires johnny-english-gadgets access
   */
  activateGadget: publicProcedure
    .use(requireFeatureAccess('johnny-english', 'johnny-english-gadgets'))
    .input(z.object({
      gadgetId: z.string(),
      duration: z.number().min(1).max(3600), // seconds
    }))
    .mutation(async ({ ctx, input }) => {
      // User has access to spy gadgets
      
      // TODO: Implement gadget activation logic
      // You could check the user's gadget level from their metadata
      return {
        success: true,
        gadgetId: input.gadgetId,
        activatedUntil: new Date(Date.now() + input.duration * 1000),
        message: `Gadget ${input.gadgetId} activated for ${input.duration} seconds`,
      };
    }),

  /**
   * Example: Endpoint that only requires general 'ace' feature access
   * (user must have at least one sub-feature of 'ace')
   */
  getAceStatus: publicProcedure
    .use(requireFeatureAccess('ace'))
    .query(async ({ ctx }) => {
      // User has access to at least one ace sub-feature
      
      return {
        hasAccess: true,
        feature: 'ace',
        message: 'You have access to Ace features',
      };
    }),
});