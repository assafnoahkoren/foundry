import { prisma } from '../../../lib/prisma';
import type { JoniCommBlockProgress, Prisma } from '@prisma/client';

export class JoniCommBlockProgressService {
  // ===== PROGRESS TRACKING =====
  
  async getUserProgress(
    userId: string,
    blockId?: string
  ): Promise<JoniCommBlockProgress[]> {
    const where: Prisma.JoniCommBlockProgressWhereInput = { userId };
    
    if (blockId) {
      where.blockId = blockId;
    }

    return prisma.joniCommBlockProgress.findMany({
      where,
      include: {
        block: true
      },
      orderBy: { updatedAt: 'desc' }
    });
  }

  async getOrCreateProgress(
    userId: string,
    blockId: string
  ): Promise<JoniCommBlockProgress> {
    const existing = await prisma.joniCommBlockProgress.findUnique({
      where: {
        userId_blockId: {
          userId,
          blockId
        }
      }
    });

    if (existing) {
      return existing;
    }

    return prisma.joniCommBlockProgress.create({
      data: {
        userId,
        blockId,
        proficiencyScore: 0,
        practiceCount: 0,
        correctCount: 0
      }
    });
  }

  async updateProgress(
    userId: string,
    blockId: string,
    data: {
      isCorrect: boolean;
      scoreAdjustment?: number;
    }
  ): Promise<JoniCommBlockProgress> {
    const progress = await this.getOrCreateProgress(userId, blockId);

    // Calculate new proficiency score
    const practiceCount = progress.practiceCount + 1;
    const correctCount = progress.correctCount + (data.isCorrect ? 1 : 0);
    const baseAccuracy = (correctCount / practiceCount) * 100;
    
    // Apply score adjustment if provided, otherwise use base accuracy
    const proficiencyScore = data.scoreAdjustment !== undefined 
      ? Math.min(100, Math.max(0, progress.proficiencyScore + data.scoreAdjustment))
      : baseAccuracy;

    return prisma.joniCommBlockProgress.update({
      where: {
        userId_blockId: {
          userId,
          blockId
        }
      },
      data: {
        proficiencyScore,
        practiceCount,
        correctCount,
        lastPracticed: new Date()
      }
    });
  }

  async bulkUpdateProgress(
    userId: string,
    updates: Array<{
      blockId: string;
      isCorrect: boolean;
      scoreAdjustment?: number;
    }>
  ): Promise<void> {
    for (const update of updates) {
      await this.updateProgress(userId, update.blockId, {
        isCorrect: update.isCorrect,
        scoreAdjustment: update.scoreAdjustment
      });
    }
  }

  // ===== ANALYTICS =====

  async getUserProficiencyOverview(userId: string): Promise<{
    totalBlocks: number;
    practicedBlocks: number;
    masteredBlocks: number;
    averageProficiency: number;
    byCategory: Record<string, {
      totalBlocks: number;
      averageProficiency: number;
      masteredBlocks: number;
    }>;
  }> {
    const allBlocks = await prisma.joniCommBlock.findMany({
      include: {
        userProgress: {
          where: { userId }
        }
      }
    });

    const practicedBlocks = allBlocks.filter(b => b.userProgress.length > 0);
    const masteredBlocks = practicedBlocks.filter(b => 
      b.userProgress[0]?.proficiencyScore >= 80
    );

    const totalProficiency = practicedBlocks.reduce((sum, b) => 
      sum + (b.userProgress[0]?.proficiencyScore || 0), 0
    );

    const byCategory: Record<string, any> = {};

    allBlocks.forEach(block => {
      if (!byCategory[block.category]) {
        byCategory[block.category] = {
          totalBlocks: 0,
          totalProficiency: 0,
          practicedBlocks: 0,
          masteredBlocks: 0
        };
      }

      byCategory[block.category].totalBlocks++;
      
      if (block.userProgress.length > 0) {
        const progress = block.userProgress[0];
        byCategory[block.category].practicedBlocks++;
        byCategory[block.category].totalProficiency += progress.proficiencyScore;
        
        if (progress.proficiencyScore >= 80) {
          byCategory[block.category].masteredBlocks++;
        }
      }
    });

    // Calculate averages
    Object.keys(byCategory).forEach(category => {
      const cat = byCategory[category];
      byCategory[category] = {
        totalBlocks: cat.totalBlocks,
        averageProficiency: cat.practicedBlocks > 0 
          ? cat.totalProficiency / cat.practicedBlocks 
          : 0,
        masteredBlocks: cat.masteredBlocks
      };
    });

    return {
      totalBlocks: allBlocks.length,
      practicedBlocks: practicedBlocks.length,
      masteredBlocks: masteredBlocks.length,
      averageProficiency: practicedBlocks.length > 0 
        ? totalProficiency / practicedBlocks.length 
        : 0,
      byCategory
    };
  }

  async getRecentProgress(
    userId: string,
    days: number = 7
  ): Promise<JoniCommBlockProgress[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    return prisma.joniCommBlockProgress.findMany({
      where: {
        userId,
        lastPracticed: {
          gte: since
        }
      },
      include: {
        block: true
      },
      orderBy: { lastPracticed: 'desc' }
    });
  }

  async getWeakestBlocks(
    userId: string,
    limit: number = 5
  ): Promise<Array<JoniCommBlockProgress & { block: any }>> {
    return prisma.joniCommBlockProgress.findMany({
      where: {
        userId,
        practiceCount: { gt: 0 }
      },
      include: {
        block: true
      },
      orderBy: { proficiencyScore: 'asc' },
      take: limit
    });
  }

  async getStrongestBlocks(
    userId: string,
    limit: number = 5
  ): Promise<Array<JoniCommBlockProgress & { block: any }>> {
    return prisma.joniCommBlockProgress.findMany({
      where: {
        userId,
        practiceCount: { gt: 0 }
      },
      include: {
        block: true
      },
      orderBy: { proficiencyScore: 'desc' },
      take: limit
    });
  }

  // ===== PRACTICE RECOMMENDATIONS =====

  async getRecommendedBlocks(
    userId: string,
    limit: number = 10
  ): Promise<Array<{
    block: any;
    reason: string;
    priority: number;
  }>> {
    const allProgress = await prisma.joniCommBlockProgress.findMany({
      where: { userId },
      include: { block: true }
    });

    const allBlocks = await prisma.joniCommBlock.findMany();
    const progressMap = new Map(allProgress.map(p => [p.blockId, p]));

    const recommendations: Array<{
      block: any;
      reason: string;
      priority: number;
    }> = [];

    for (const block of allBlocks) {
      const progress = progressMap.get(block.id);

      if (!progress) {
        // Never practiced
        recommendations.push({
          block,
          reason: 'New block - never practiced',
          priority: 10
        });
      } else if (progress.proficiencyScore < 50) {
        // Weak performance
        recommendations.push({
          block,
          reason: 'Needs improvement - low proficiency',
          priority: 9
        });
      } else if (progress.lastPracticed) {
        const daysSinceLastPractice = Math.floor(
          (Date.now() - progress.lastPracticed.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        if (daysSinceLastPractice > 14) {
          // Haven't practiced in a while
          recommendations.push({
            block,
            reason: `Review needed - ${daysSinceLastPractice} days since last practice`,
            priority: 7
          });
        }
      }
    }

    // Sort by priority and return top N
    return recommendations
      .sort((a, b) => b.priority - a.priority)
      .slice(0, limit);
  }

  // ===== RESET AND CLEANUP =====

  async resetUserProgress(userId: string): Promise<Prisma.BatchPayload> {
    return prisma.joniCommBlockProgress.deleteMany({
      where: { userId }
    });
  }

  async resetBlockProgress(blockId: string): Promise<Prisma.BatchPayload> {
    return prisma.joniCommBlockProgress.deleteMany({
      where: { blockId }
    });
  }
}

// Export singleton instance
export const joniCommBlockProgressService = new JoniCommBlockProgressService();