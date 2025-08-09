import { prisma } from '../../../lib/prisma';
import type { JoniCommBlock, Prisma } from '@prisma/client';

export class JoniCommBlockService {
  // ===== COMM BLOCKS CRUD =====
  
  async createCommBlock(data: {
    code: string;
    name: string;
    category: string;
    description?: string;
    icaoReference?: string;
    rules: any;
    examples: any;
    commonErrors?: any;
    difficultyLevel?: number;
    orderIndex?: number;
  }): Promise<JoniCommBlock> {
    return prisma.joniCommBlock.create({
      data: {
        ...data,
        rules: data.rules || {},
        examples: data.examples || [],
        commonErrors: data.commonErrors || []
      }
    });
  }

  async getAllCommBlocks(params?: {
    category?: string;
    difficultyLevel?: number;
    orderBy?: 'code' | 'name' | 'category' | 'difficultyLevel' | 'orderIndex';
    orderDirection?: 'asc' | 'desc';
  }): Promise<JoniCommBlock[]> {
    const where: Prisma.JoniCommBlockWhereInput = {};
    
    if (params?.category) {
      where.category = params.category;
    }
    
    if (params?.difficultyLevel !== undefined) {
      where.difficultyLevel = params.difficultyLevel;
    }

    const orderBy = params?.orderBy || 'orderIndex';
    const orderDirection = params?.orderDirection || 'asc';

    return prisma.joniCommBlock.findMany({
      where,
      orderBy: { [orderBy]: orderDirection }
    });
  }

  async getCommBlockById(id: string): Promise<JoniCommBlock | null> {
    return prisma.joniCommBlock.findUnique({
      where: { id }
    });
  }

  async getCommBlockByCode(code: string): Promise<JoniCommBlock | null> {
    return prisma.joniCommBlock.findUnique({
      where: { code }
    });
  }

  async updateCommBlock(
    id: string,
    data: {
      code?: string;
      name?: string;
      category?: string;
      description?: string;
      icaoReference?: string;
      rules?: any;
      examples?: any;
      commonErrors?: any;
      difficultyLevel?: number;
      orderIndex?: number;
    }
  ): Promise<JoniCommBlock> {
    return prisma.joniCommBlock.update({
      where: { id },
      data
    });
  }

  async deleteCommBlock(id: string): Promise<JoniCommBlock> {
    return prisma.joniCommBlock.delete({
      where: { id }
    });
  }

  // ===== BULK OPERATIONS =====

  async createManyCommBlocks(
    blocks: Array<{
      code: string;
      name: string;
      category: string;
      description?: string;
      icaoReference?: string;
      rules: any;
      examples: any;
      commonErrors?: any;
      difficultyLevel?: number;
      orderIndex?: number;
    }>
  ): Promise<Prisma.BatchPayload> {
    return prisma.joniCommBlock.createMany({
      data: blocks,
      skipDuplicates: true
    });
  }

  async getCommBlocksByCategory(category: string): Promise<JoniCommBlock[]> {
    return prisma.joniCommBlock.findMany({
      where: { category },
      orderBy: { orderIndex: 'asc' }
    });
  }

  async getCategories(): Promise<string[]> {
    const blocks = await prisma.joniCommBlock.findMany({
      select: { category: true },
      distinct: ['category']
    });
    return blocks.map(b => b.category);
  }

  // ===== SEARCH AND FILTER =====

  async searchCommBlocks(searchTerm: string): Promise<JoniCommBlock[]> {
    return prisma.joniCommBlock.findMany({
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

  async getCommBlocksWithProgress(userId: string): Promise<Array<JoniCommBlock & {
    progress?: {
      proficiencyScore: number;
      practiceCount: number;
      correctCount: number;
      lastPracticed: Date | null;
    }
  }>> {
    const blocks = await prisma.joniCommBlock.findMany({
      include: {
        userProgress: {
          where: { userId },
          take: 1
        }
      },
      orderBy: { orderIndex: 'asc' }
    });

    return blocks.map(block => ({
      ...block,
      progress: block.userProgress[0] ? {
        proficiencyScore: block.userProgress[0].proficiencyScore,
        practiceCount: block.userProgress[0].practiceCount,
        correctCount: block.userProgress[0].correctCount,
        lastPracticed: block.userProgress[0].lastPracticed
      } : undefined
    }));
  }

  // ===== STATISTICS =====

  async getCommBlockStatistics(): Promise<{
    totalBlocks: number;
    byCategory: Record<string, number>;
    byDifficulty: Record<number, number>;
  }> {
    const blocks = await prisma.joniCommBlock.findMany({
      select: {
        category: true,
        difficultyLevel: true
      }
    });

    const byCategory: Record<string, number> = {};
    const byDifficulty: Record<number, number> = {};

    blocks.forEach(block => {
      byCategory[block.category] = (byCategory[block.category] || 0) + 1;
      byDifficulty[block.difficultyLevel] = (byDifficulty[block.difficultyLevel] || 0) + 1;
    });

    return {
      totalBlocks: blocks.length,
      byCategory,
      byDifficulty
    };
  }
}

// Export singleton instance
export const joniCommBlockService = new JoniCommBlockService();