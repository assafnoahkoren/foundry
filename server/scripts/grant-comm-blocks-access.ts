import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function grantCommBlocksAccess() {
  try {
    // Find all users
    const users = await prisma.user.findMany();
    
    if (users.length === 0) {
      console.log('No users found in the database');
      return;
    }

    console.log(`Found ${users.length} user(s)`);

    for (const user of users) {
      console.log(`\nProcessing user: ${user.email}`);

      // Check if user already has the access
      const existingAccess = await prisma.userAccess.findUnique({
        where: {
          userId_featureId_subFeatureId: {
            userId: user.id,
            featureId: 'joni',
            subFeatureId: 'joni-comm-blocks'
          }
        }
      });

      if (existingAccess) {
        console.log(`  ✓ User already has joni-comm-blocks access`);
      } else {
        // Grant the joni-comm-blocks access
        const access = await prisma.userAccess.create({
          data: {
            userId: user.id,
            featureId: 'joni',
            subFeatureId: 'joni-comm-blocks',
            metadata: {},
            grantCause: 'manual'
          }
        });
        console.log(`  ✅ Granted joni-comm-blocks access`);
      }

      // Also check/grant joni-management for full access
      const managementAccess = await prisma.userAccess.findUnique({
        where: {
          userId_featureId_subFeatureId: {
            userId: user.id,
            featureId: 'joni',
            subFeatureId: 'joni-management'
          }
        }
      });

      if (!managementAccess) {
        await prisma.userAccess.create({
          data: {
            userId: user.id,
            featureId: 'joni',
            subFeatureId: 'joni-management',
            metadata: {},
            grantCause: 'manual'
          }
        });
        console.log(`  ✅ Also granted joni-management access`);
      }
    }

    // List all user access for verification
    console.log('\n📋 Current user access summary:');
    for (const user of users) {
      const accesses = await prisma.userAccess.findMany({
        where: { userId: user.id },
        select: { featureId: true, subFeatureId: true }
      });
      
      console.log(`\n${user.email}:`);
      accesses.forEach(access => {
        console.log(`  - ${access.featureId}/${access.subFeatureId}`);
      });
    }

    console.log('\n✅ Script completed successfully!');
    console.log('🔄 Please refresh your browser to see the Comm Blocks link in the sidebar');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
grantCommBlocksAccess();