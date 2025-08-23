import { prisma } from '../../../lib/prisma';
import type { JoniScript, Prisma } from '@prisma/client';

export class JoniScriptService {
  // ===== SCRIPTS CRUD =====
  
  async createScript(data: {
    code: string;
    name: string;
    description?: string;
    scriptType: string;
    difficultyLevel?: number;
    estimatedMinutes?: number;
    flightContext: any;
    learningObjectives?: any;
    prerequisites?: any;
  }): Promise<JoniScript> {
    return prisma.joniScript.create({
      data: {
        ...data,
        flightContext: data.flightContext || {},
        learningObjectives: data.learningObjectives || [],
        prerequisites: data.prerequisites || []
      }
    });
  }

  async getAllScripts(params?: {
    scriptType?: string;
    difficultyLevel?: number;
    orderBy?: 'code' | 'name' | 'difficultyLevel';
    orderDirection?: 'asc' | 'desc';
  }): Promise<JoniScript[]> {
    const where: Prisma.JoniScriptWhereInput = {};
    
    if (params?.scriptType) {
      where.scriptType = params.scriptType;
    }
    
    if (params?.difficultyLevel !== undefined) {
      where.difficultyLevel = params.difficultyLevel;
    }

    const orderBy = params?.orderBy || 'name';
    const orderDirection = params?.orderDirection || 'asc';

    return prisma.joniScript.findMany({
      where,
      orderBy: { [orderBy]: orderDirection }
    });
  }

  async getScriptById(id: string): Promise<JoniScript | null> {
    return prisma.joniScript.findUnique({
      where: { id }
    });
  }

  async getScriptByCode(code: string): Promise<JoniScript | null> {
    return prisma.joniScript.findUnique({
      where: { code }
    });
  }

  async updateScript(
    id: string,
    data: {
      code?: string;
      name?: string;
      description?: string;
      scriptType?: string;
      difficultyLevel?: number;
      estimatedMinutes?: number;
      flightContext?: any;
      learningObjectives?: any;
      prerequisites?: any;
    }
  ): Promise<JoniScript> {
    return prisma.joniScript.update({
      where: { id },
      data
    });
  }

  async deleteScript(id: string): Promise<JoniScript> {
    return prisma.joniScript.delete({
      where: { id }
    });
  }

  // ===== BULK OPERATIONS =====

  async createManyScripts(
    scripts: Array<{
      code: string;
      name: string;
      description?: string;
      scriptType: string;
      difficultyLevel?: number;
      estimatedMinutes?: number;
      flightContext: any;
      learningObjectives?: any;
      prerequisites?: any;
    }>
  ): Promise<Prisma.BatchPayload> {
    return prisma.joniScript.createMany({
      data: scripts,
      skipDuplicates: true
    });
  }

  // ===== FILTERING AND SEARCH =====

  async getScriptsByType(scriptType: string): Promise<JoniScript[]> {
    return prisma.joniScript.findMany({
      where: { scriptType },
      orderBy: { name: 'asc' }
    });
  }


  async searchScripts(searchTerm: string): Promise<JoniScript[]> {
    return prisma.joniScript.findMany({
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

  async getScriptsWithPracticeStatus(userId: string): Promise<Array<JoniScript & {
    practiceCount: number;
    completedCount: number;
    lastPracticed?: Date;
    averageScore?: number;
  }>> {
    const scripts = await prisma.joniScript.findMany({
      include: {
        practices: {
          where: { userId }
        }
      }
    });

    return scripts.map(script => {
      const practiceCount = script.practices.length;
      const completedPractices = script.practices.filter(p => p.status === 'completed');
      const completedCount = completedPractices.length;
      const lastPracticed = script.practices[0]?.startedAt;
      const averageScore = completedCount > 0
        ? completedPractices.reduce((sum, p) => sum + (p.overallScore || 0), 0) / completedCount
        : undefined;

      return {
        ...script,
        practiceCount,
        completedCount,
        lastPracticed,
        averageScore
      };
    });
  }

  // ===== STATISTICS =====

  async getScriptStatistics(): Promise<{
    totalScripts: number;
    byType: Record<string, number>;
    byDifficulty: Record<number, number>;
  }> {
    const scripts = await prisma.joniScript.findMany({
      select: {
        scriptType: true,
        difficultyLevel: true
      }
    });

    const byType: Record<string, number> = {};
    const byDifficulty: Record<number, number> = {};

    scripts.forEach(script => {
      byType[script.scriptType] = (byType[script.scriptType] || 0) + 1;
      byDifficulty[script.difficultyLevel] = (byDifficulty[script.difficultyLevel] || 0) + 1;
    });

    return {
      totalScripts: scripts.length,
      byType,
      byDifficulty
    };
  }

  // ===== TEMPLATE VARIABLES =====

  async getVariablesFromTransmissions(transmissionIds: string[]): Promise<{
    variables: string[];
    variablesByTransmission: Record<string, { transmissionName: string; blocks: Array<{ blockName: string; variables: string[] }> }>;
  }> {
    // Get all transmissions with their blocks
    const transmissions = await prisma.joniTransmissionTemplate.findMany({
      where: {
        id: { in: transmissionIds }
      }
    });

    const allVariables = new Set<string>();
    const variablesByTransmission: Record<string, { transmissionName: string; blocks: Array<{ blockName: string; variables: string[] }> }> = {};

    for (const transmission of transmissions) {
      const blockData = transmission.blocks as any[];
      if (!blockData || !Array.isArray(blockData)) continue;

      variablesByTransmission[transmission.id] = {
        transmissionName: transmission.name,
        blocks: []
      };

      // Get all block IDs from this transmission
      const blockIds = blockData.map((b: any) => b.blockId).filter(Boolean);
      
      // Get all blocks with their templates
      const blocks = await prisma.joniCommBlock.findMany({
        where: {
          id: { in: blockIds }
        }
      });

      // Extract variables from each block's template
      for (const block of blocks) {
        if (block.template) {
          const regex = /\{\{(\w+)\}\}/g;
          const variables: string[] = [];
          let match;
          
          while ((match = regex.exec(block.template)) !== null) {
            if (!variables.includes(match[1])) {
              variables.push(match[1]);
              allVariables.add(match[1]);
            }
          }

          if (variables.length > 0) {
            variablesByTransmission[transmission.id].blocks.push({
              blockName: block.name,
              variables
            });
          }
        }
      }
    }

    return {
      variables: Array.from(allVariables),
      variablesByTransmission
    };
  }

  // ===== VALIDATION =====

  async validatePrerequisites(userId: string, scriptId: string): Promise<{
    hasAccess: boolean;
    missingPrerequisites: string[];
  }> {
    const script = await this.getScriptById(scriptId);
    if (!script) {
      return { hasAccess: false, missingPrerequisites: ['Script not found'] };
    }

    const prerequisites = (script.prerequisites as any) || [];
    const missingPrerequisites: string[] = [];

    for (const prereq of prerequisites) {
      if (prereq.type === 'script') {
        const completed = await prisma.joniScriptPractice.findFirst({
          where: {
            userId,
            scriptId: prereq.id,
            status: 'completed'
          }
        });
        if (!completed) {
          missingPrerequisites.push(prereq.name || prereq.id);
        }
      } else if (prereq.type === 'commBlock') {
        const progress = await prisma.joniCommBlockProgress.findFirst({
          where: {
            userId,
            blockId: prereq.id,
            proficiencyScore: { gte: prereq.minScore || 70 }
          }
        });
        if (!progress) {
          missingPrerequisites.push(prereq.name || prereq.id);
        }
      }
    }

    return {
      hasAccess: missingPrerequisites.length === 0,
      missingPrerequisites
    };
  }
}

// Export singleton instance
export const joniScriptService = new JoniScriptService();