import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/auth/password';
import type { ScriptDAG } from '../src/services/joni/comm-blocks/types/script-dag.types';

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

async function seedScripts() {
  console.log('🌱 Seeding training scripts...');

  // IFR Departure Clearance Script
  const ifrDepartureDAG: ScriptDAG = {
    nodes: [
      {
        id: 'start',
        type: 'transmission',
        name: 'ATC Initial Contact',
        position: { x: 250, y: 50 },
        content: {
          type: 'transmission_ref',
          transmissionId: '',
          actorRole: 'ground'
        }
      },
      {
        id: 'pilot_ready',
        type: 'user_response',
        name: 'Pilot Ready to Copy',
        position: { x: 250, y: 150 },
        content: {
          type: 'user_response',
          expectedElements: ['ready to copy', 'N9842F'],
          validationCriteria: 'acknowledge_ready',
          maxRetries: 3
        }
      },
      {
        id: 'clearance_delivery',
        type: 'transmission',
        name: 'ATC Delivers Clearance',
        position: { x: 250, y: 250 },
        content: {
          type: 'transmission_ref',
          transmissionId: '',
          actorRole: 'ground'
        }
      },
      {
        id: 'pilot_readback',
        type: 'user_response',
        name: 'Pilot Clearance Readback',
        position: { x: 250, y: 350 },
        content: {
          type: 'user_response',
          expectedElements: [
            'cleared to KBDL',
            'radar vectors BEENO',
            'V167 MKDIR',
            'maintain 3000',
            'expect 6000',
            '120.6',
            'squawk 4721',
            'N9842F'
          ],
          validationCriteria: 'full_clearance_readback',
          maxRetries: 3
        }
      },
      {
        id: 'atc_confirm',
        type: 'transmission',
        name: 'ATC Confirmation',
        position: { x: 250, y: 450 },
        content: {
          type: 'transmission_ref',
          transmissionId: '',
          actorRole: 'ground'
        }
      },
      {
        id: 'complete',
        type: 'event',
        name: 'Scenario Complete',
        position: { x: 250, y: 550 },
        content: {
          type: 'event',
          category: 'operational',
          severity: 'info',
          title: 'Training Complete',
          details: 'IFR clearance successfully received and acknowledged'
        }
      }
    ],
    edges: [
      {
        from: 'start',
        to: 'pilot_ready',
        condition: { type: 'default', priority: 0 }
      },
      {
        from: 'pilot_ready',
        to: 'clearance_delivery',
        condition: { type: 'validation_pass', priority: 1 }
      },
      {
        from: 'clearance_delivery',
        to: 'pilot_readback',
        condition: { type: 'default', priority: 0 }
      },
      {
        from: 'pilot_readback',
        to: 'atc_confirm',
        condition: { type: 'validation_pass', priority: 1 }
      },
      {
        from: 'atc_confirm',
        to: 'complete',
        condition: { type: 'default', priority: 0 }
      }
    ],
    metadata: {
      version: '1.0.0'
    }
  };

  // Taxi and Takeoff Script (simplified)
  const taxiTakeoffDAG: ScriptDAG = {
    nodes: [
      {
        id: 'start',
        type: 'transmission',
        name: 'Ground Control Initial',
        position: { x: 250, y: 50 },
        content: {
          type: 'transmission_ref',
          transmissionId: '',
          actorRole: 'ground'
        }
      },
      {
        id: 'request_taxi',
        type: 'user_response',
        name: 'Request Taxi',
        position: { x: 250, y: 150 },
        content: {
          type: 'user_response',
          expectedElements: ['request taxi', 'runway', 'N9842F'],
          validationCriteria: 'taxi_request',
          maxRetries: 3
        }
      },
      {
        id: 'taxi_clearance',
        type: 'transmission',
        name: 'Taxi Instructions',
        position: { x: 250, y: 250 },
        content: {
          type: 'transmission_ref',
          transmissionId: '',
          actorRole: 'ground'
        }
      },
      {
        id: 'complete',
        type: 'event',
        name: 'Ready for Takeoff',
        position: { x: 250, y: 350 },
        content: {
          type: 'event',
          category: 'operational',
          severity: 'info',
          title: 'Training Complete',
          details: 'Aircraft ready for takeoff'
        }
      }
    ],
    edges: [
      {
        from: 'start',
        to: 'request_taxi',
        condition: { type: 'default', priority: 0 }
      },
      {
        from: 'request_taxi',
        to: 'taxi_clearance',
        condition: { type: 'validation_pass', priority: 1 }
      },
      {
        from: 'taxi_clearance',
        to: 'complete',
        condition: { type: 'default', priority: 0 }
      }
    ],
    metadata: {
      version: '1.0.0'
    }
  };

  const scripts = [
    {
      code: 'SCRIPT-IFR-001',
      name: 'IFR Departure Clearance',
      description: 'Practice receiving and reading back IFR departure clearance from ATC',
      scriptType: 'training',
      difficultyLevel: 2,
      estimatedMinutes: 10,
      tags: ['IFR', 'clearance', 'departure', 'readback'],
      dagStructure: ifrDepartureDAG,
      startNodeId: 'start'
    },
    {
      code: 'SCRIPT-TAXI-001',
      name: 'Taxi and Takeoff',
      description: 'Complete taxi instructions and takeoff clearance procedures',
      scriptType: 'training',
      difficultyLevel: 1,
      estimatedMinutes: 8,
      tags: ['taxi', 'takeoff', 'ground', 'tower'],
      dagStructure: taxiTakeoffDAG,
      startNodeId: 'start'
    }
  ];

  for (const script of scripts) {
    const created = await prisma.joniScript.upsert({
      where: { code: script.code },
      update: {
        ...script,
        dagStructure: script.dagStructure as any,
        flightContext: {
          aircraft: 'Cessna 172',
          callsign: 'N9842F',
          airport: 'KBOS',
          conditions: 'VFR'
        },
        learningObjectives: [
          'Proper radio phraseology',
          'Clearance readback accuracy',
          'Communication efficiency'
        ]
      },
      create: {
        ...script,
        dagStructure: script.dagStructure as any,
        flightContext: {
          aircraft: 'Cessna 172',
          callsign: 'N9842F',
          airport: 'KBOS',
          conditions: 'VFR'
        },
        learningObjectives: [
          'Proper radio phraseology',
          'Clearance readback accuracy',
          'Communication efficiency'
        ]
      }
    });
    console.log(`  ✅ Script: ${created.name}`);
  }
}

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Seed admin user with all access
  await seedAdminUser();
  
  // Seed scenario subjects
  await seedScenarioSubjects();
  
  // Seed training scripts
  await seedScripts();

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