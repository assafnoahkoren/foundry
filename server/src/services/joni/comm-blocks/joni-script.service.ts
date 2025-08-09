import { prisma } from '../../../lib/prisma';
import type { JoniScript, JoniScriptTransmission, Prisma } from '@prisma/client';

export class JoniScriptService {
  // ===== SCRIPTS CRUD =====
  
  async createScript(data: {
    code: string;
    name: string;
    description?: string;
    scriptType: string;
    phase: string;
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
    phase?: string;
    difficultyLevel?: number;
    orderBy?: 'code' | 'name' | 'phase' | 'difficultyLevel';
    orderDirection?: 'asc' | 'desc';
  }): Promise<JoniScript[]> {
    const where: Prisma.JoniScriptWhereInput = {};
    
    if (params?.scriptType) {
      where.scriptType = params.scriptType;
    }
    
    if (params?.phase) {
      where.phase = params.phase;
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
      where: { id },
      include: {
        transmissions: {
          include: {
            transmission: true
          },
          orderBy: { orderInScript: 'asc' }
        }
      }
    });
  }

  async getScriptByCode(code: string): Promise<JoniScript | null> {
    return prisma.joniScript.findUnique({
      where: { code },
      include: {
        transmissions: {
          include: {
            transmission: true
          },
          orderBy: { orderInScript: 'asc' }
        }
      }
    });
  }

  async updateScript(
    id: string,
    data: {
      code?: string;
      name?: string;
      description?: string;
      scriptType?: string;
      phase?: string;
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
    // Delete all related transmissions first
    await prisma.joniScriptTransmission.deleteMany({
      where: { scriptId: id }
    });
    
    return prisma.joniScript.delete({
      where: { id }
    });
  }

  // ===== SCRIPT TRANSMISSIONS =====

  async addTransmissionToScript(data: {
    scriptId: string;
    transmissionId: string;
    orderInScript: number;
    actorRole: string;
    expectedDelay?: number;
    triggerCondition?: string;
  }): Promise<JoniScriptTransmission> {
    return prisma.joniScriptTransmission.create({
      data
    });
  }

  async updateScriptTransmission(
    scriptId: string,
    orderInScript: number,
    data: {
      transmissionId?: string;
      orderInScript?: number;
      actorRole?: string;
      expectedDelay?: number;
      triggerCondition?: string;
    }
  ): Promise<JoniScriptTransmission> {
    return prisma.joniScriptTransmission.update({
      where: {
        scriptId_orderInScript: {
          scriptId,
          orderInScript
        }
      },
      data
    });
  }

  async removeTransmissionFromScript(
    scriptId: string,
    orderInScript: number
  ): Promise<JoniScriptTransmission> {
    return prisma.joniScriptTransmission.delete({
      where: {
        scriptId_orderInScript: {
          scriptId,
          orderInScript
        }
      }
    });
  }

  async reorderScriptTransmissions(
    scriptId: string,
    newOrder: Array<{ transmissionId: string; orderInScript: number }>
  ): Promise<void> {
    // Delete all existing transmissions
    await prisma.joniScriptTransmission.deleteMany({
      where: { scriptId }
    });

    // Re-create with new order
    await prisma.joniScriptTransmission.createMany({
      data: newOrder.map(item => ({
        scriptId,
        transmissionId: item.transmissionId,
        orderInScript: item.orderInScript,
        actorRole: 'pilot' // Default, should be updated
      }))
    });
  }

  // ===== BULK OPERATIONS =====

  async createManyScripts(
    scripts: Array<{
      code: string;
      name: string;
      description?: string;
      scriptType: string;
      phase: string;
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

  async getScriptsByPhase(phase: string): Promise<JoniScript[]> {
    return prisma.joniScript.findMany({
      where: { phase },
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
      include: {
        transmissions: {
          include: {
            transmission: true
          },
          orderBy: { orderInScript: 'asc' }
        }
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
    byPhase: Record<string, number>;
    byDifficulty: Record<number, number>;
    averageTransmissionsPerScript: number;
  }> {
    const scripts = await prisma.joniScript.findMany({
      select: {
        scriptType: true,
        phase: true,
        difficultyLevel: true,
        _count: {
          select: { transmissions: true }
        }
      }
    });

    const byType: Record<string, number> = {};
    const byPhase: Record<string, number> = {};
    const byDifficulty: Record<number, number> = {};
    let totalTransmissions = 0;

    scripts.forEach(script => {
      byType[script.scriptType] = (byType[script.scriptType] || 0) + 1;
      byPhase[script.phase] = (byPhase[script.phase] || 0) + 1;
      byDifficulty[script.difficultyLevel] = (byDifficulty[script.difficultyLevel] || 0) + 1;
      totalTransmissions += script._count.transmissions;
    });

    return {
      totalScripts: scripts.length,
      byType,
      byPhase,
      byDifficulty,
      averageTransmissionsPerScript: scripts.length > 0 ? totalTransmissions / scripts.length : 0
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