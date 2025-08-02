import { prisma } from '../../lib/prisma';
import type { JoniScenarioSubject, JoniScenario, JoniScenarioStep } from '@prisma/client';

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
    name: string;
    shortDescription?: string;
    subjectId: string;
    groupId: string;
    scenarioType?: string;
    difficulty?: string;
    estimatedMinutes?: number;
    initialContext?: string;
    flightInformationJson?: any;
    flightInformation: string;
    expectedAnswer: string;
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
    group: { id: string; name: string } | null;
    _count: { responses: number };
  })[]> {
    return prisma.joniScenario.findMany({
      where: subjectId ? { subjectId } : undefined,
      include: {
        subject: true,
        group: {
          select: { id: true, name: true }
        },
        _count: {
          select: { responses: true }
        }
      },
      orderBy: [
        { groupId: 'asc' },
        { difficulty: 'asc' },
        { createdAt: 'desc' }
      ]
    });
  }

  async getScenarioById(id: string): Promise<(JoniScenario & {
    subject: JoniScenarioSubject;
    group: { id: string; name: string } | null;
    _count: { responses: number };
  }) | null> {
    return prisma.joniScenario.findUnique({
      where: { id },
      include: {
        subject: true,
        group: {
          select: { id: true, name: true }
        },
        _count: {
          select: { responses: true }
        }
      }
    });
  }

  async updateScenario(
    id: string,
    data: {
      name?: string;
      shortDescription?: string;
      subjectId?: string;
      groupId?: string;
      scenarioType?: string;
      difficulty?: string;
      estimatedMinutes?: number;
      initialContext?: string;
      flightInformationJson?: any;
      flightInformation?: string;
      expectedAnswer?: string;
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

  async deleteScenario(id: string): Promise<void> {
    await prisma.joniScenario.delete({
      where: { id }
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

  // ===== SCENARIO STEPS =====

  async createScenarioStep(data: {
    scenarioId: string;
    stepOrder: number;
    eventType: string;
    actorRole?: string;
    eventDescription: string;
    eventMessage?: string;
    expectedComponents?: any;
    correctResponseExample?: string;
    nextStepCondition?: string;
  }): Promise<JoniScenarioStep> {
    return prisma.joniScenarioStep.create({
      data: {
        scenarioId: data.scenarioId,
        stepOrder: data.stepOrder,
        eventType: data.eventType,
        actorRole: data.actorRole || null,
        eventDescription: data.eventDescription,
        eventMessage: data.eventMessage || '',
        expectedComponents: data.expectedComponents || [],
        correctResponseExample: data.correctResponseExample || '',
        nextStepCondition: data.nextStepCondition || null
      }
    });
  }

  async getScenarioSteps(scenarioId: string): Promise<JoniScenarioStep[]> {
    return prisma.joniScenarioStep.findMany({
      where: { scenarioId },
      orderBy: { stepOrder: 'asc' }
    });
  }

  async updateScenarioStep(
    id: string,
    data: {
      stepOrder?: number;
      eventType?: string;
      actorRole?: string | null;
      eventDescription?: string;
      eventMessage?: string;
      expectedComponents?: any;
      correctResponseExample?: string;
      nextStepCondition?: string | null;
    }
  ): Promise<JoniScenarioStep> {
    const updateData: any = { ...data };
    // expectedComponents is already in the correct format
    return prisma.joniScenarioStep.update({
      where: { id },
      data: updateData
    });
  }

  async deleteScenarioStep(id: string): Promise<void> {
    await prisma.joniScenarioStep.delete({
      where: { id }
    });
  }

  async bulkUpdateStepOrder(
    scenarioId: string,
    steps: Array<{ id: string; stepOrder: number }>
  ): Promise<void> {
    // Use a transaction to update all steps at once
    await prisma.$transaction(
      steps.map(step =>
        prisma.joniScenarioStep.update({
          where: { id: step.id },
          data: { stepOrder: step.stepOrder }
        })
      )
    );
  }

  async createScenarioWithSteps(data: {
    scenario: {
      name: string;
      shortDescription?: string;
      subjectId: string;
      groupId: string;
      scenarioType?: string;
      difficulty?: string;
      estimatedMinutes?: number;
      initialContext?: string;
      flightInformationJson?: any;
      flightInformation: string;
      expectedAnswer: string;
      currentStatus: string;
    };
    steps: Array<{
      stepOrder: number;
      eventType: string;
      actorRole?: string;
      eventDescription: string;
      eventMessage?: string;
      expectedComponents?: any;
      correctResponseExample?: string;
      nextStepCondition?: string;
    }>;
  }): Promise<JoniScenario & { subject: JoniScenarioSubject; steps: JoniScenarioStep[] }> {
    // Create scenario and steps in a transaction
    return prisma.$transaction(async (tx) => {
      const scenario = await tx.joniScenario.create({
        data: data.scenario,
        include: {
          subject: true
        }
      });

      const steps = await Promise.all(
        data.steps.map(step =>
          tx.joniScenarioStep.create({
            data: {
              scenarioId: scenario.id,
              stepOrder: step.stepOrder,
              eventType: step.eventType,
              actorRole: step.actorRole || null,
              eventDescription: step.eventDescription,
              eventMessage: step.eventMessage || '',
              expectedComponents: step.expectedComponents || [],
              correctResponseExample: step.correctResponseExample || '',
              nextStepCondition: step.nextStepCondition || null
            }
          })
        )
      );

      return {
        ...scenario,
        steps
      };
    });
  }
}

export const joniScenarioService = new JoniScenarioService();