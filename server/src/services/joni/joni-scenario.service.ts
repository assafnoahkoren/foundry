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
    steps: JoniScenarioStep[];
    _count: { responses: number };
  }) | null> {
    const scenario = await prisma.joniScenario.findUnique({
      where: { id },
      include: {
        subject: true,
        group: {
          select: { id: true, name: true }
        },
        steps: {
          orderBy: { stepOrder: 'asc' }
        },
        _count: {
          select: { responses: true }
        }
      }
    });
    
    if (!scenario) return null;
    
    // Extract enforceComponentOrder from expectedComponents JSON for each step
    const stepsWithEnforceOrder = scenario.steps.map(step => {
      
      let enforceComponentOrder: boolean | undefined;
      let expectedComponents: any = step.expectedComponents as any;
      
      // Check if expectedComponents is wrapped in an object with items and _enforceOrder
      if (expectedComponents && typeof expectedComponents === 'object' && !Array.isArray(expectedComponents)) {
        if ('items' in expectedComponents && '_enforceOrder' in expectedComponents) {
          enforceComponentOrder = expectedComponents._enforceOrder as boolean;
          expectedComponents = expectedComponents.items || [];
        } else if ('_enforceOrder' in expectedComponents) {
          // Legacy format where _enforceOrder might be directly in the object
          enforceComponentOrder = expectedComponents._enforceOrder as boolean;
          // Remove _enforceOrder and keep the rest
          const { _enforceOrder, ...rest } = expectedComponents;
          expectedComponents = rest;
        }
      }
      
      const result = {
        ...step,
        expectedComponents,
        enforceComponentOrder
      };
      
      return result as any;
    });
    
    return {
      ...scenario,
      steps: stepsWithEnforceOrder
    };
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
    enforceComponentOrder?: boolean;
    correctResponseExample?: string;
    nextStepCondition?: string;
  }): Promise<JoniScenarioStep> {
    // Store enforceComponentOrder inside expectedComponents JSON
    let expectedComponentsWithOrder: any = data.expectedComponents || [];
    if (data.enforceComponentOrder !== undefined) {
      // Wrap in an object to store both array and enforceOrder
      expectedComponentsWithOrder = {
        items: Array.isArray(data.expectedComponents) ? data.expectedComponents : [],
        _enforceOrder: data.enforceComponentOrder
      };
    }
    
    return prisma.joniScenarioStep.create({
      data: {
        scenarioId: data.scenarioId,
        stepOrder: data.stepOrder,
        eventType: data.eventType,
        actorRole: data.actorRole || null,
        eventDescription: data.eventDescription,
        eventMessage: data.eventMessage || '',
        expectedComponents: expectedComponentsWithOrder,
        correctResponseExample: data.correctResponseExample || '',
        nextStepCondition: data.nextStepCondition || null
      }
    });
  }

  async getScenarioSteps(scenarioId: string): Promise<JoniScenarioStep[]> {
    const steps = await prisma.joniScenarioStep.findMany({
      where: { scenarioId },
      orderBy: { stepOrder: 'asc' }
    });
    
    // Extract enforceComponentOrder from expectedComponents JSON
    return steps.map(step => {
      let enforceComponentOrder: boolean | undefined;
      let expectedComponents: any = step.expectedComponents as any;
      
      // Check if expectedComponents is wrapped in an object with items and _enforceOrder
      if (expectedComponents && typeof expectedComponents === 'object' && !Array.isArray(expectedComponents)) {
        if ('items' in expectedComponents && '_enforceOrder' in expectedComponents) {
          enforceComponentOrder = expectedComponents._enforceOrder as boolean;
          expectedComponents = expectedComponents.items || [];
        } else if ('_enforceOrder' in expectedComponents) {
          // Legacy format where _enforceOrder might be directly in the object
          enforceComponentOrder = expectedComponents._enforceOrder as boolean;
          // Remove _enforceOrder and keep the rest
          const { _enforceOrder, ...rest } = expectedComponents;
          expectedComponents = rest;
        }
      }
      
      return {
        ...step,
        expectedComponents,
        enforceComponentOrder
      } as any;
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
      enforceComponentOrder?: boolean;
      correctResponseExample?: string;
      nextStepCondition?: string | null;
    }
  ): Promise<JoniScenarioStep> {
    const updateData: any = { ...data };
    
    // If expectedComponents is provided, handle enforceComponentOrder
    if (data.expectedComponents !== undefined || data.enforceComponentOrder !== undefined) {
      const existingStep = await prisma.joniScenarioStep.findUnique({
        where: { id },
        select: { expectedComponents: true }
      });
      
      const currentComponents = data.expectedComponents !== undefined 
        ? data.expectedComponents 
        : (existingStep?.expectedComponents && typeof existingStep.expectedComponents === 'object' && 'items' in existingStep.expectedComponents
            ? existingStep.expectedComponents.items
            : existingStep?.expectedComponents || []);
      
      if (data.enforceComponentOrder !== undefined) {
        // Wrap in an object to store both array and enforceOrder
        updateData.expectedComponents = {
          items: Array.isArray(currentComponents) ? currentComponents : [],
          _enforceOrder: data.enforceComponentOrder
        };
      } else {
        updateData.expectedComponents = currentComponents;
      }
    }
    
    // Remove enforceComponentOrder from updateData as it's stored inside expectedComponents
    delete updateData.enforceComponentOrder;
    
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
      enforceComponentOrder?: boolean;
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
        data.steps.map(step => {
          // Store enforceComponentOrder inside expectedComponents JSON
          let expectedComponentsWithOrder: any = step.expectedComponents || [];
          if (step.enforceComponentOrder !== undefined) {
            // Wrap in an object to store both array and enforceOrder
            expectedComponentsWithOrder = {
              items: Array.isArray(step.expectedComponents) ? step.expectedComponents : [],
              _enforceOrder: step.enforceComponentOrder
            };
          }
          
          return tx.joniScenarioStep.create({
            data: {
              scenarioId: scenario.id,
              stepOrder: step.stepOrder,
              eventType: step.eventType,
              actorRole: step.actorRole || null,
              eventDescription: step.eventDescription,
              eventMessage: step.eventMessage || '',
              expectedComponents: expectedComponentsWithOrder,
              correctResponseExample: step.correctResponseExample || '',
              nextStepCondition: step.nextStepCondition || null
            }
          });
        })
      );
      
      // Extract enforceComponentOrder from expectedComponents JSON for each step
      const stepsWithEnforceOrder = steps.map(step => {
        let enforceComponentOrder: boolean | undefined;
        let expectedComponents: any = step.expectedComponents;
        
        // Check if expectedComponents is wrapped in an object with items and _enforceOrder
        if (expectedComponents && typeof expectedComponents === 'object' && !Array.isArray(expectedComponents)) {
          if ('items' in expectedComponents && '_enforceOrder' in expectedComponents) {
            enforceComponentOrder = expectedComponents._enforceOrder;
            expectedComponents = expectedComponents.items || [];
          } else if ('_enforceOrder' in expectedComponents) {
            // Legacy format where _enforceOrder might be directly in the object
            enforceComponentOrder = expectedComponents._enforceOrder;
            // Remove _enforceOrder and keep the rest
            const { _enforceOrder, ...rest } = expectedComponents;
            expectedComponents = rest;
          }
        }
        
        return {
          ...step,
          expectedComponents,
          enforceComponentOrder
        } as any;
      });

      return {
        ...scenario,
        steps: stepsWithEnforceOrder
      };
    });
  }

  async updateScenarioWithSteps(
    scenarioId: string,
    data: {
      scenario: {
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
      };
      steps: Array<{
        id?: string; // For existing steps
        stepOrder: number;
        eventType: string;
        actorRole?: string;
        eventDescription: string;
        eventMessage?: string;
        expectedComponents?: any;
        enforceComponentOrder?: boolean;
        correctResponseExample?: string;
        nextStepCondition?: string;
      }>;
    }
  ): Promise<JoniScenario & { steps: JoniScenarioStep[] }> {
    return prisma.$transaction(async (tx) => {
      // Update the scenario
      const scenario = await tx.joniScenario.update({
        where: { id: scenarioId },
        data: data.scenario,
        include: {
          subject: true,
          group: {
            select: { id: true, name: true }
          }
        }
      });

      // Get existing steps
      const existingSteps = await tx.joniScenarioStep.findMany({
        where: { scenarioId },
        select: { id: true }
      });
      const existingStepIds = existingSteps.map(s => s.id);

      // Determine which steps to keep, update, create, or delete
      const stepsToKeep = data.steps.filter(s => s.id && existingStepIds.includes(s.id));
      const stepsToCreate = data.steps.filter(s => !s.id);
      const stepIdsToKeep = stepsToKeep.map(s => s.id!);
      const stepIdsToDelete = existingStepIds.filter(id => !stepIdsToKeep.includes(id));

      // Delete removed steps
      if (stepIdsToDelete.length > 0) {
        await tx.joniScenarioStep.deleteMany({
          where: {
            id: { in: stepIdsToDelete }
          }
        });
      }

      // Update existing steps
      for (const step of stepsToKeep) {
        // Store enforceComponentOrder inside expectedComponents JSON
        let expectedComponentsWithOrder: any = step.expectedComponents || [];
        if (step.enforceComponentOrder !== undefined) {
          // Wrap in an object to store both array and enforceOrder
          expectedComponentsWithOrder = {
            items: Array.isArray(step.expectedComponents) ? step.expectedComponents : [],
            _enforceOrder: step.enforceComponentOrder
          };
        }
        
        await tx.joniScenarioStep.update({
          where: { id: step.id },
          data: {
            stepOrder: step.stepOrder,
            eventType: step.eventType,
            actorRole: step.actorRole || null,
            eventDescription: step.eventDescription,
            eventMessage: step.eventMessage || '',
            expectedComponents: expectedComponentsWithOrder,
            correctResponseExample: step.correctResponseExample || '',
            nextStepCondition: step.nextStepCondition || null
          }
        });
      }

      // Create new steps
      for (const step of stepsToCreate) {
        // Store enforceComponentOrder inside expectedComponents JSON
        let expectedComponentsWithOrder: any = step.expectedComponents || [];
        if (step.enforceComponentOrder !== undefined) {
          // Wrap in an object to store both array and enforceOrder
          expectedComponentsWithOrder = {
            items: Array.isArray(step.expectedComponents) ? step.expectedComponents : [],
            _enforceOrder: step.enforceComponentOrder
          };
        }
        
        await tx.joniScenarioStep.create({
          data: {
            scenarioId,
            stepOrder: step.stepOrder,
            eventType: step.eventType,
            actorRole: step.actorRole || null,
            eventDescription: step.eventDescription,
            eventMessage: step.eventMessage || '',
            expectedComponents: expectedComponentsWithOrder,
            correctResponseExample: step.correctResponseExample || '',
            nextStepCondition: step.nextStepCondition || null
          }
        });
      }

      // Get all steps in correct order
      const steps = await tx.joniScenarioStep.findMany({
        where: { scenarioId },
        orderBy: { stepOrder: 'asc' }
      });
      
      // Extract enforceComponentOrder from expectedComponents JSON for each step
      const stepsWithEnforceOrder = steps.map(step => {
        let enforceComponentOrder: boolean | undefined;
        let expectedComponents: any = step.expectedComponents;
        
        // Check if expectedComponents is wrapped in an object with items and _enforceOrder
        if (expectedComponents && typeof expectedComponents === 'object' && !Array.isArray(expectedComponents)) {
          if ('items' in expectedComponents && '_enforceOrder' in expectedComponents) {
            enforceComponentOrder = expectedComponents._enforceOrder;
            expectedComponents = expectedComponents.items || [];
          } else if ('_enforceOrder' in expectedComponents) {
            // Legacy format where _enforceOrder might be directly in the object
            enforceComponentOrder = expectedComponents._enforceOrder;
            // Remove _enforceOrder and keep the rest
            const { _enforceOrder, ...rest } = expectedComponents;
            expectedComponents = rest;
          }
        }
        
        return {
          ...step,
          expectedComponents,
          enforceComponentOrder
        } as any;
      });

      return {
        ...scenario,
        steps: stepsWithEnforceOrder
      };
    });
  }

  async getScenarioStep(stepId: string): Promise<JoniScenarioStep | null> {
    const step = await prisma.joniScenarioStep.findUnique({
      where: { id: stepId }
    });
    
    if (!step) return null;
    
    // Extract enforceComponentOrder from expectedComponents JSON
    let enforceComponentOrder: boolean | undefined;
    let expectedComponents: any = step.expectedComponents;
    
    // Check if expectedComponents is wrapped in an object with items and _enforceOrder
    if (expectedComponents && typeof expectedComponents === 'object' && !Array.isArray(expectedComponents)) {
      if ('items' in expectedComponents && '_enforceOrder' in expectedComponents) {
        enforceComponentOrder = expectedComponents._enforceOrder;
        expectedComponents = expectedComponents.items || [];
      } else if ('_enforceOrder' in expectedComponents) {
        // Legacy format where _enforceOrder might be directly in the object
        enforceComponentOrder = expectedComponents._enforceOrder;
        // Remove _enforceOrder and keep the rest
        const { _enforceOrder, ...rest } = expectedComponents;
        expectedComponents = rest;
      }
    }
    
    return {
      ...step,
      expectedComponents,
      enforceComponentOrder
    } as any;
  }

  async saveStepResponse(data: {
    practiceId: string;
    stepId: string;
    userResponse: string;
    responseAnalysis: any;
    correctness: number;
  }) {
    return prisma.joniScenarioStepResponse.upsert({
      where: {
        practiceId_stepId: {
          practiceId: data.practiceId,
          stepId: data.stepId
        }
      },
      update: {
        userResponse: data.userResponse,
        responseAnalysis: data.responseAnalysis,
        correctness: data.correctness,
        attempts: {
          increment: 1
        }
      },
      create: {
        practiceId: data.practiceId,
        stepId: data.stepId,
        userResponse: data.userResponse,
        responseAnalysis: data.responseAnalysis,
        correctness: data.correctness
      }
    });
  }
}

export const joniScenarioService = new JoniScenarioService();