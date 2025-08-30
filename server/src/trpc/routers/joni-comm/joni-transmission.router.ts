import { z } from 'zod';
import { router, protectedProcedure } from '../../trpc';
import { joniTransmissionTemplateService } from '../../../services/joni/comm-blocks';
import { joniCommBlockService } from '../../../services/joni/comm-blocks';
import { joniScenarioAiService } from '../../../services/joni/joni-scenario-ai.service';
import { TRPCError } from '@trpc/server';
import { requireFeatureAccess } from '../../../middleware/feature-access.middleware';

// Schema definitions
const transmissionBlockSchema = z.object({
  blockId: z.string(),
  order: z.number().int(),
  parameters: z.record(z.any()).optional(),
  isOptional: z.boolean().default(false)
});

const createTransmissionTemplateSchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  transmissionType: z.enum(['pilot_to_atc', 'atc_to_pilot']),
  context: z.enum(['ground', 'tower', 'departure', 'approach', 'enroute', 'emergency']),
  difficultyLevel: z.number().int().min(1).max(5).default(2),
  estimatedSeconds: z.number().int().min(1).max(300).default(10),
  blocks: z.array(transmissionBlockSchema),
  metadata: z.record(z.any()).optional()
});

const updateTransmissionTemplateSchema = z.object({
  id: z.string(),
  data: z.object({
    code: z.string().min(1).max(50).optional(),
    name: z.string().min(1).max(200).optional(),
    description: z.string().optional(),
    transmissionType: z.enum(['pilot_to_atc', 'atc_to_pilot']).optional(),
    context: z.enum(['ground', 'tower', 'departure', 'approach', 'enroute', 'emergency']).optional(),
    difficultyLevel: z.number().int().min(1).max(5).optional(),
    estimatedSeconds: z.number().int().min(1).max(300).optional(),
    blocks: z.array(transmissionBlockSchema).optional(),
    metadata: z.record(z.any()).optional()
  })
});

const listTransmissionTemplatesSchema = z.object({
  transmissionType: z.enum(['pilot_to_atc', 'atc_to_pilot']).optional(),
  context: z.enum(['ground', 'tower', 'departure', 'approach', 'enroute', 'emergency']).optional(),
  difficultyLevel: z.number().int().min(1).max(5).optional(),
  orderBy: z.enum(['code', 'name', 'context', 'difficultyLevel']).optional(),
  orderDirection: z.enum(['asc', 'desc']).optional()
});

// Middleware to check joni-comm-blocks access
const requireCommBlockAccess = protectedProcedure.use(requireFeatureAccess('joni', 'joni-comm-blocks'));

export const joniTransmissionRouter = router({
  // ===== PUBLIC PROCEDURES (for practice) =====
  
  list: protectedProcedure
    .input(listTransmissionTemplatesSchema)
    .query(async ({ input }) => {
      return joniTransmissionTemplateService.getAllTransmissionTemplates(input);
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const template = await joniTransmissionTemplateService.getTransmissionTemplateById(input.id);
      if (!template) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Transmission template not found'
        });
      }
      return template;
    }),

  getByCode: protectedProcedure
    .input(z.object({ code: z.string() }))
    .query(async ({ input }) => {
      const template = await joniTransmissionTemplateService.getTransmissionTemplateByCode(input.code);
      if (!template) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Transmission template not found'
        });
      }
      return template;
    }),

  getTypes: protectedProcedure
    .query(async () => {
      return joniTransmissionTemplateService.getTransmissionTypes();
    }),

  getContexts: protectedProcedure
    .query(async () => {
      return joniTransmissionTemplateService.getContexts();
    }),

  search: protectedProcedure
    .input(z.object({ searchTerm: z.string() }))
    .query(async ({ input }) => {
      return joniTransmissionTemplateService.searchTransmissionTemplates(input.searchTerm);
    }),

  getWithPracticeCount: protectedProcedure
    .query(async ({ ctx }) => {
      return joniTransmissionTemplateService.getTransmissionTemplatesWithPracticeCount(ctx.user.userId);
    }),

  getStatistics: protectedProcedure
    .query(async () => {
      return joniTransmissionTemplateService.getTransmissionTemplateStatistics();
    }),

  validateBlocks: protectedProcedure
    .input(z.object({ blocks: z.array(transmissionBlockSchema) }))
    .query(async ({ input }) => {
      return joniTransmissionTemplateService.validateTransmissionBlocks(input.blocks);
    }),

  // Validate user transmission against template with AI
  validateTransmission: protectedProcedure
    .input(z.object({
      userInput: z.string(),
      transmissionId: z.string(),
      variables: z.record(z.string())
    }))
    .mutation(async ({ input }) => {
      // Get the transmission template
      const transmission = await joniTransmissionTemplateService.getTransmissionTemplateById(input.transmissionId);
      if (!transmission) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Transmission template not found'
        });
      }

      // Get all comm blocks used in this transmission
      const blockIds = (transmission.blocks as any[]).map(b => b.blockId);
      const commBlocks = await Promise.all(
        blockIds.map(id => joniCommBlockService.getCommBlockById(id))
      );
      
      const validBlocks = commBlocks.filter(b => b !== null);
      if (validBlocks.length !== blockIds.length) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Some comm blocks could not be found'
        });
      }

      // Validate the transmission with AI
      const result = await joniScenarioAiService.validateTransmission(
        input.userInput,
        {
          name: transmission.name,
          blocks: transmission.blocks as any[]
        },
        validBlocks as any[],
        input.variables
      );

      return result;
    }),

  // Get transmission with populated blocks for playground
  getWithBlocks: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const transmission = await joniTransmissionTemplateService.getTransmissionTemplateById(input.id);
      if (!transmission) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Transmission template not found'
        });
      }

      // Get all comm blocks used in this transmission
      const blockIds = (transmission.blocks as any[]).map(b => b.blockId);
      const commBlocks = await Promise.all(
        blockIds.map(id => joniCommBlockService.getCommBlockById(id))
      );
      
      return {
        ...transmission,
        populatedBlocks: commBlocks.filter(b => b !== null)
      };
    }),

  // ===== ADMIN PROCEDURES (require joni-comm-blocks access) =====

  create: requireCommBlockAccess
    .input(createTransmissionTemplateSchema)
    .mutation(async ({ input }) => {
      // Validate blocks first
      const validation = await joniTransmissionTemplateService.validateTransmissionBlocks(input.blocks);
      if (!validation.isValid) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Invalid blocks: ${validation.errors.join(', ')}`
        });
      }

      try {
        return await joniTransmissionTemplateService.createTransmissionTemplate(input);
      } catch (error: any) {
        if (error.code === 'P2002') {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'A transmission template with this code already exists'
          });
        }
        throw error;
      }
    }),

  update: requireCommBlockAccess
    .input(updateTransmissionTemplateSchema)
    .mutation(async ({ input }) => {
      // If blocks are being updated, validate them
      if (input.data.blocks) {
        const validation = await joniTransmissionTemplateService.validateTransmissionBlocks(input.data.blocks);
        if (!validation.isValid) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Invalid blocks: ${validation.errors.join(', ')}`
          });
        }
      }

      try {
        return await joniTransmissionTemplateService.updateTransmissionTemplate(input.id, input.data);
      } catch (error: any) {
        if (error.code === 'P2002') {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'A transmission template with this code already exists'
          });
        }
        if (error.code === 'P2025') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Transmission template not found'
          });
        }
        throw error;
      }
    }),

  delete: requireCommBlockAccess
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      try {
        return await joniTransmissionTemplateService.deleteTransmissionTemplate(input.id);
      } catch (error: any) {
        if (error.code === 'P2025') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Transmission template not found'
          });
        }
        if (error.code === 'P2003') {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Cannot delete transmission template as it is being used in scripts or practice records'
          });
        }
        throw error;
      }
    }),

  createMany: requireCommBlockAccess
    .input(z.object({
      templates: z.array(createTransmissionTemplateSchema)
    }))
    .mutation(async ({ input }) => {
      // Validate all blocks first
      for (const template of input.templates) {
        const validation = await joniTransmissionTemplateService.validateTransmissionBlocks(template.blocks);
        if (!validation.isValid) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Invalid blocks in template ${template.code}: ${validation.errors.join(', ')}`
          });
        }
      }
      
      return joniTransmissionTemplateService.createManyTransmissionTemplates(input.templates);
    })
});