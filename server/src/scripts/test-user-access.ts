import { PrismaClient } from '@prisma/client';
import { UserAccessService } from '../services/user-access.service';
import { UserAccessAdminService } from '../services/user-access-admin.service';

const prisma = new PrismaClient();

async function testUserAccess() {
  try {
    console.log('🔍 Testing User Access Management System...\n');

    // Create test users if they don't exist
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@test.com' },
      update: {},
      create: {
        email: 'admin@test.com',
        name: 'Admin User',
        password: 'test123', // In real app, this would be hashed
      },
    });

    const testUser = await prisma.user.upsert({
      where: { email: 'test@test.com' },
      update: {},
      create: {
        email: 'test@test.com',
        name: 'Test User',
        password: 'test123', // In real app, this would be hashed
      },
    });

    console.log('✅ Test users created/found');
    console.log(`   Admin: ${adminUser.email}`);
    console.log(`   User: ${testUser.email}\n`);

    // Initialize services
    const userAccessService = new UserAccessService(prisma);
    const adminService = new UserAccessAdminService(prisma);

    // Grant some access
    console.log('🎯 Granting access to test user...');

    await adminService.grantAccess({
      userId: testUser.id,
      featureId: 'ace',
      subFeatureId: 'ace-analytics',
      metadata: {
        maxReports: 50,
        dataRetentionDays: 90,
        exportFormats: ['pdf', 'csv', 'excel'],
      },
      grantedBy: adminUser.id,
      grantCause: 'manual' as const,
    });

    await adminService.grantAccess({
      userId: testUser.id,
      featureId: 'johnny-english',
      subFeatureId: 'johnny-english-gadgets',
      metadata: {
        gadgetLevel: 'advanced',
        maxActiveGadgets: 5,
      },
      grantedBy: adminUser.id,
      grantCause: 'subscription' as const,
    });

    console.log('✅ Access granted!\n');

    // Test validation
    console.log('🔐 Testing access validation...');
    
    const hasAceAnalytics = await userAccessService.validateUserAccess(
      testUser.id,
      'ace',
      'ace-analytics'
    );
    console.log(`   Has access to ace-analytics: ${hasAceAnalytics}`);

    const hasAceApi = await userAccessService.validateUserAccess(
      testUser.id,
      'ace',
      'ace-api-access'
    );
    console.log(`   Has access to ace-api-access: ${hasAceApi}`);

    const hasJohnnyGadgets = await userAccessService.validateUserAccess(
      testUser.id,
      'johnny-english',
      'johnny-english-gadgets'
    );
    console.log(`   Has access to johnny-english-gadgets: ${hasJohnnyGadgets}\n`);

    // Get user features
    console.log('📋 Getting all user features...');
    const userFeatures = await userAccessService.getUserFeatures(testUser.id);
    
    for (const feature of userFeatures) {
      console.log(`\n📦 Feature: ${feature.featureName}`);
      console.log(`   ID: ${feature.featureId}`);
      console.log(`   Description: ${feature.featureDescription}`);
      
      for (const subFeature of feature.subFeatures) {
        console.log(`\n   🔧 Sub-feature: ${subFeature.subFeatureName}`);
        console.log(`      ID: ${subFeature.subFeatureId}`);
        console.log(`      Granted: ${subFeature.grantedAt.toLocaleDateString()}`);
        console.log(`      Grant Cause: ${subFeature.grantCause}`);
        console.log(`      Metadata:`);
        
        for (const [key, value] of Object.entries(subFeature.metadata)) {
          console.log(`         - ${key}: ${JSON.stringify(value)}`);
        }
      }
    }

    console.log('\n✨ Test completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testUserAccess();