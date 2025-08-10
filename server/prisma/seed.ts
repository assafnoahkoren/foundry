import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/auth/password';

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

async function seedAdminUser() {
  console.log('🌱 Seeding admin user...');
  
  const hashedPassword = await hashPassword('123');
  
  // Create or update the admin user
  const user = await prisma.user.upsert({
    where: { email: 'a@a.com' },
    update: {
      password: hashedPassword,
      name: 'Admin User'
    },
    create: {
      email: 'a@a.com',
      password: hashedPassword,
      name: 'Admin User'
    }
  });
  
  console.log(`  ✅ User created: ${user.email}`);
  
  // Give the user all features
  console.log('  🔐 Granting user access to all features...');
  
  // Define all features and their sub-features
  const features = [
    {
      featureId: 'ace',
      subFeatures: ['ace-analytics', 'ace-api-access']
    },
    {
      featureId: 'joni',
      subFeatures: ['joni-management', 'joni-scenario-practice', 'joni-comm-blocks']
    },
    {
      featureId: 'backoffice',
      subFeatures: ['backoffice-users', 'backoffice-user-access', 'backoffice-scenario']
    }
  ];
  
  // Grant access to all features and sub-features
  for (const feature of features) {
    for (const subFeatureId of feature.subFeatures) {
      await prisma.userAccess.upsert({
        where: {
          userId_featureId_subFeatureId: {
            userId: user.id,
            featureId: feature.featureId,
            subFeatureId
          }
        },
        update: {},
        create: {
          userId: user.id,
          featureId: feature.featureId,
          subFeatureId,
          grantCause: 'manual'
        }
      });
      console.log(`    ✅ Granted ${feature.featureId}/${subFeatureId}`);
    }
  }
  
  console.log('  ✅ All features and sub-features granted');
}

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Seed admin user with all access
  await seedAdminUser();
  
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