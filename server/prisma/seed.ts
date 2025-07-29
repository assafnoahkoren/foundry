import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Scenario subjects for Joni feature
const scenarioSubjects = [
  {
    name: 'Start-up & Taxi',
    description: 'Procedures for engine start-up and initial taxi from parking position'
  },
  {
    name: 'Taxi Instructions',
    description: 'Following ground control taxi instructions to reach the runway'
  },
  {
    name: 'Take-off Clearance',
    description: 'Receiving and acknowledging take-off clearance from tower'
  },
  {
    name: 'Climb Instructions',
    description: 'Following departure and climb instructions from ATC'
  },
  {
    name: 'En-route Communications',
    description: 'Communications during cruise phase including handoffs and altitude changes'
  },
  {
    name: 'Approach Clearance',
    description: 'Receiving and following approach clearance and vectors'
  },
  {
    name: 'Landing Clearance',
    description: 'Final approach and landing clearance procedures'
  },
  {
    name: 'Emergency Procedures',
    description: 'Communications during emergency situations and priority handling'
  }
];

async function seedScenarioSubjects() {
  console.log('🌱 Seeding scenario subjects...');

  for (const subject of scenarioSubjects) {
    const created = await prisma.joniScenarioSubject.upsert({
      where: { name: subject.name },
      update: {
        description: subject.description
      },
      create: subject
    });
    
    console.log(`  ✅ Subject: ${created.name}`);
  }
}

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Seed scenario subjects
  await seedScenarioSubjects();

  console.log('\n✨ Seeding completed!');
}

main()
  .catch((error) => {
    console.error('Error during seeding:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });