import { prisma } from '../../../lib/prisma';
import type { JoniTransmissionTemplate, Prisma } from '@prisma/client';

export class JoniTransmissionTemplateService {
  // ===== TRANSMISSION TEMPLATES CRUD =====
  
  async createTransmissionTemplate(data: {
    code: string;
    name: string;
    description?: string;
    transmissionType: string;
    context: string;
    difficultyLevel?: number;
    estimatedSeconds?: number;
    blocks: any;
    metadata?: any;
  }): Promise<JoniTransmissionTemplate> {
    return prisma.joniTransmissionTemplate.create({
      data: {
        ...data,
        blocks: data.blocks || [],
        metadata: data.metadata || {}
      }
    });
  }

  async getAllTransmissionTemplates(params?: {
    transmissionType?: string;
    context?: string;
    difficultyLevel?: number;
    orderBy?: 'code' | 'name' | 'context' | 'difficultyLevel';
    orderDirection?: 'asc' | 'desc';
  }): Promise<JoniTransmissionTemplate[]> {
    const where: Prisma.JoniTransmissionTemplateWhereInput = {};
    
    if (params?.transmissionType) {
      where.transmissionType = params.transmissionType;
    }
    
    if (params?.context) {
      where.context = params.context;
    }
    
    if (params?.difficultyLevel !== undefined) {
      where.difficultyLevel = params.difficultyLevel;
    }

    const orderBy = params?.orderBy || 'name';
    const orderDirection = params?.orderDirection || 'asc';

    return prisma.joniTransmissionTemplate.findMany({
      where,
      orderBy: { [orderBy]: orderDirection }
    });
  }

  async getTransmissionTemplateById(id: string): Promise<JoniTransmissionTemplate | null> {
    return prisma.joniTransmissionTemplate.findUnique({
      where: { id }
    });
  }

  async getTransmissionTemplateByCode(code: string): Promise<JoniTransmissionTemplate | null> {
    return prisma.joniTransmissionTemplate.findUnique({
      where: { code }
    });
  }

  async updateTransmissionTemplate(
    id: string,
    data: {
      code?: string;
      name?: string;
      description?: string;
      transmissionType?: string;
      context?: string;
      difficultyLevel?: number;
      estimatedSeconds?: number;
      blocks?: any;
      metadata?: any;
    }
  ): Promise<JoniTransmissionTemplate> {
    return prisma.joniTransmissionTemplate.update({
      where: { id },
      data
    });
  }

  async deleteTransmissionTemplate(id: string): Promise<JoniTransmissionTemplate> {
    return prisma.joniTransmissionTemplate.delete({
      where: { id }
    });
  }

  // ===== BULK OPERATIONS =====

  async createManyTransmissionTemplates(
    templates: Array<{
      code: string;
      name: string;
      description?: string;
      transmissionType: string;
      context: string;
      difficultyLevel?: number;
      estimatedSeconds?: number;
      blocks: any;
      metadata?: any;
    }>
  ): Promise<Prisma.BatchPayload> {
    return prisma.joniTransmissionTemplate.createMany({
      data: templates,
      skipDuplicates: true
    });
  }

  // ===== FILTERING AND GROUPING =====

  async getTransmissionTemplatesByType(transmissionType: string): Promise<JoniTransmissionTemplate[]> {
    return prisma.joniTransmissionTemplate.findMany({
      where: { transmissionType },
      orderBy: { name: 'asc' }
    });
  }

  async getTransmissionTemplatesByContext(context: string): Promise<JoniTransmissionTemplate[]> {
    return prisma.joniTransmissionTemplate.findMany({
      where: { context },
      orderBy: { name: 'asc' }
    });
  }

  async getTransmissionTypes(): Promise<string[]> {
    const templates = await prisma.joniTransmissionTemplate.findMany({
      select: { transmissionType: true },
      distinct: ['transmissionType']
    });
    return templates.map(t => t.transmissionType);
  }

  async getContexts(): Promise<string[]> {
    const templates = await prisma.joniTransmissionTemplate.findMany({
      select: { context: true },
      distinct: ['context']
    });
    return templates.map(t => t.context);
  }

  // ===== SEARCH =====

  async searchTransmissionTemplates(searchTerm: string): Promise<JoniTransmissionTemplate[]> {
    return prisma.joniTransmissionTemplate.findMany({
      where: {
        OR: [
          { code: { contains: searchTerm, mode: 'insensitive' } },
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } }
        ]
      },
      orderBy: { name: 'asc' }
    });
  }

  // ===== PRACTICE TRACKING =====

  async getTransmissionTemplatesWithPracticeCount(userId: string): Promise<Array<JoniTransmissionTemplate & {
    practiceCount: number;
    lastPracticed?: Date;
    averageScore?: number;
  }>> {
    const templates = await prisma.joniTransmissionTemplate.findMany({
      include: {
        practices: {
          where: { userId },
          orderBy: { completedAt: 'desc' }
        }
      }
    });

    return templates.map(template => {
      const practiceCount = template.practices.length;
      const lastPracticed = template.practices[0]?.completedAt;
      const averageScore = practiceCount > 0
        ? template.practices.reduce((sum, p) => sum + p.overallScore, 0) / practiceCount
        : undefined;

      return {
        ...template,
        practiceCount,
        lastPracticed,
        averageScore
      };
    });
  }

  // ===== STATISTICS =====

  async getTransmissionTemplateStatistics(): Promise<{
    totalTemplates: number;
    byType: Record<string, number>;
    byContext: Record<string, number>;
    byDifficulty: Record<number, number>;
  }> {
    const templates = await prisma.joniTransmissionTemplate.findMany({
      select: {
        transmissionType: true,
        context: true,
        difficultyLevel: true
      }
    });

    const byType: Record<string, number> = {};
    const byContext: Record<string, number> = {};
    const byDifficulty: Record<number, number> = {};

    templates.forEach(template => {
      byType[template.transmissionType] = (byType[template.transmissionType] || 0) + 1;
      byContext[template.context] = (byContext[template.context] || 0) + 1;
      byDifficulty[template.difficultyLevel] = (byDifficulty[template.difficultyLevel] || 0) + 1;
    });

    return {
      totalTemplates: templates.length,
      byType,
      byContext,
      byDifficulty
    };
  }

  // ===== VALIDATION =====

  async validateTransmissionBlocks(blocks: any[]): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    for (const block of blocks) {
      if (!block.blockId) {
        errors.push('Block must have a blockId');
      }
      if (typeof block.order !== 'number') {
        errors.push('Block must have an order number');
      }
      // Check if block exists
      if (block.blockId) {
        const exists = await prisma.joniCommBlock.findUnique({
          where: { id: block.blockId }
        });
        if (!exists) {
          errors.push(`Block with id ${block.blockId} does not exist`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  async getTransmissionWithBlocks(id: string) {
    const transmission = await prisma.joniTransmissionTemplate.findUnique({
      where: { id }
    });
    
    if (!transmission) return null;
    
    // Parse the blocks JSON field
    const blocks = transmission.blocks as Array<{
      blockId: string;
      order: number;
      parameters?: Record<string, any>;
      isOptional?: boolean;
    }>;
    
    return {
      ...transmission,
      blocks: blocks || []
    };
  }
}

// Export singleton instance
export const joniTransmissionTemplateService = new JoniTransmissionTemplateService();