import { prisma } from '../../lib/prisma';
import type { JoniScenarioGroup, JoniScenario } from '@prisma/client';

export class JoniScenarioGroupService {
  // ===== CREATE =====
  async createGroup(data: {
    name: string;
    description?: string;
    subjectId: string;
  }): Promise<JoniScenarioGroup> {
    return prisma.joniScenarioGroup.create({
      data,
    });
  }

  // ===== READ =====
  async getAllGroups(): Promise<(JoniScenarioGroup & {
    subject: { id: string; name: string };
    _count: { scenarios: number };
  })[]> {
    return prisma.joniScenarioGroup.findMany({
      include: {
        subject: {
          select: { id: true, name: true }
        },
        _count: {
          select: { scenarios: true }
        }
      },
      orderBy: [
        { subjectId: 'asc' },
        { name: 'asc' }
      ]
    });
  }

  async getGroupsBySubject(subjectId: string): Promise<(JoniScenarioGroup & {
    _count: { scenarios: number };
  })[]> {
    return prisma.joniScenarioGroup.findMany({
      where: { subjectId },
      include: {
        _count: {
          select: { scenarios: true }
        }
      },
      orderBy: { name: 'asc' }
    });
  }

  async getGroupById(id: string): Promise<(JoniScenarioGroup & {
    subject: { id: string; name: string };
    scenarios: {
      id: string;
      name: string;
      shortDescription: string | null;
      flightInformation: string;
      expectedAnswer: string;
      currentStatus: string;
      orderInGroup: number;
    }[];
  }) | null> {
    return prisma.joniScenarioGroup.findUnique({
      where: { id },
      include: {
        subject: {
          select: { id: true, name: true }
        },
        scenarios: {
          select: {
            id: true,
            name: true,
            shortDescription: true,
            flightInformation: true,
            expectedAnswer: true,
            currentStatus: true,
            orderInGroup: true,
          },
          orderBy: [
            { orderInGroup: 'asc' },
            { createdAt: 'asc' }
          ]
        }
      }
    });
  }

  // ===== UPDATE =====
  async updateGroup(
    id: string,
    data: {
      name?: string;
      description?: string;
      subjectId?: string;
    }
  ): Promise<JoniScenarioGroup> {
    return prisma.joniScenarioGroup.update({
      where: { id },
      data,
    });
  }

  // ===== DELETE =====
  async deleteGroup(id: string): Promise<void> {
    await prisma.joniScenarioGroup.delete({
      where: { id }
    });
  }

  // ===== SCENARIO MANAGEMENT =====
  async moveScenarioToGroup(
    scenarioId: string,
    groupId: string,
    orderInGroup?: number
  ): Promise<JoniScenario> {
    // If no order specified, put it at the end
    if (orderInGroup === undefined) {
      const maxOrder = await prisma.joniScenario.aggregate({
        where: { groupId },
        _max: { orderInGroup: true }
      });
      orderInGroup = (maxOrder._max.orderInGroup ?? -1) + 1;
    }

    return prisma.joniScenario.update({
      where: { id: scenarioId },
      data: {
        groupId,
        orderInGroup
      }
    });
  }

  async reorderScenariosInGroup(
    groupId: string,
    scenarioOrders: { scenarioId: string; orderInGroup: number }[]
  ): Promise<void> {
    // Use transaction to update all orders atomically
    await prisma.$transaction(
      scenarioOrders.map(({ scenarioId, orderInGroup }) =>
        prisma.joniScenario.update({
          where: { id: scenarioId },
          data: { orderInGroup }
        })
      )
    );
  }

  // ===== UTILITIES =====
  async duplicateGroup(
    groupId: string,
    newName: string
  ): Promise<JoniScenarioGroup> {
    const originalGroup = await this.getGroupById(groupId);
    
    if (!originalGroup) {
      throw new Error('Group not found');
    }

    // Create new group
    const newGroup = await this.createGroup({
      name: newName,
      description: originalGroup.description || undefined,
      subjectId: originalGroup.subjectId,
    });

    // Copy scenarios to new group
    if (originalGroup.scenarios.length > 0) {
      await prisma.$transaction(
        originalGroup.scenarios.map((scenario, index) =>
          prisma.joniScenario.create({
            data: {
              name: scenario.name + ' (Copy)',
              shortDescription: scenario.shortDescription,
              subjectId: originalGroup.subjectId,
              groupId: newGroup.id,
              orderInGroup: index,
              flightInformation: scenario.flightInformation,
              expectedAnswer: scenario.expectedAnswer,
              currentStatus: scenario.currentStatus,
            }
          })
        )
      );
    }

    return newGroup;
  }
}

// Export singleton instance
export const joniScenarioGroupService = new JoniScenarioGroupService();