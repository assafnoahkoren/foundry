import { prisma } from '../../lib/prisma';
import type { JoniScenarioSubject, JoniScenario, Prisma } from '@prisma/client';

export class JoniScenarioService {
  // ===== SCENARIO SUBJECTS =====
  
  async createSubject(data: {
    name: string;
    description?: string;
  }): Promise<JoniScenarioSubject> {
    return prisma.joniScenarioSubject.create({
      data
    });
  }

  async getAllSubjects(): Promise<JoniScenarioSubject[]> {
    return prisma.joniScenarioSubject.findMany({
      orderBy: { name: 'asc' }
    });
  }

  async getSubjectById(id: string): Promise<JoniScenarioSubject | null> {
    return prisma.joniScenarioSubject.findUnique({
      where: { id }
    });
  }

  async updateSubject(
    id: string,
    data: {
      name?: string;
      description?: string;
    }
  ): Promise<JoniScenarioSubject> {
    return prisma.joniScenarioSubject.update({
      where: { id },
      data
    });
  }

  async deleteSubject(id: string): Promise<JoniScenarioSubject> {
    return prisma.joniScenarioSubject.delete({
      where: { id }
    });
  }

  async getScenarioCountBySubject(subjectId: string): Promise<number> {
    return prisma.joniScenario.count({
      where: { subjectId }
    });
  }

  // ===== SCENARIOS =====

  async createScenario(data: {
    subjectId: string;
    flightInformation: Prisma.InputJsonValue;
    expectedAnswer: Prisma.InputJsonValue;
    currentStatus: string;
  }): Promise<JoniScenario & { subject: JoniScenarioSubject }> {
    return prisma.joniScenario.create({
      data,
      include: {
        subject: true
      }
    });
  }

  async getAllScenarios(subjectId?: string): Promise<(JoniScenario & {
    subject: JoniScenarioSubject;
    _count: { responses: number };
  })[]> {
    return prisma.joniScenario.findMany({
      where: subjectId ? { subjectId } : undefined,
      include: {
        subject: true,
        _count: {
          select: { responses: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getScenarioById(id: string): Promise<(JoniScenario & {
    subject: JoniScenarioSubject;
    _count: { responses: number };
  }) | null> {
    return prisma.joniScenario.findUnique({
      where: { id },
      include: {
        subject: true,
        _count: {
          select: { responses: true }
        }
      }
    });
  }

  async updateScenario(
    id: string,
    data: {
      subjectId?: string;
      flightInformation?: Prisma.InputJsonValue;
      expectedAnswer?: Prisma.InputJsonValue;
      currentStatus?: string;
    }
  ): Promise<JoniScenario & { subject: JoniScenarioSubject }> {
    return prisma.joniScenario.update({
      where: { id },
      data,
      include: {
        subject: true
      }
    });
  }

  // ===== SCENARIO STATS =====

  async getScenarioStats(scenarioId: string) {
    const stats = await prisma.joniScenarioResponse.aggregate({
      where: { scenarioId },
      _count: true,
      _avg: {
        correctness: true
      },
      _max: {
        correctness: true
      },
      _min: {
        correctness: true
      }
    });

    return {
      totalResponses: stats._count,
      averageCorrectness: stats._avg.correctness || 0,
      maxCorrectness: stats._max.correctness || 0,
      minCorrectness: stats._min.correctness || 0
    };
  }
}

export const joniScenarioService = new JoniScenarioService();