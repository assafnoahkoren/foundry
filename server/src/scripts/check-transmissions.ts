import { prisma } from '../lib/prisma';

async function checkTransmissions() {
  console.log('🔍 Checking transmissions in database...\n');

  // Check comm blocks
  const commBlocks = await prisma.joniCommBlock.findMany();
  console.log(`📦 Comm Blocks: ${commBlocks.length} found`);
  commBlocks.forEach(block => {
    console.log(`  - ${block.name} (${block.code})`);
  });

  console.log('\n');

  // Check transmissions
  const transmissions = await prisma.joniTransmissionTemplate.findMany();
  console.log(`📡 Transmissions: ${transmissions.length} found`);
  transmissions.forEach(transmission => {
    console.log(`  - ${transmission.name} (${transmission.code})`);
    console.log(`    Type: ${transmission.transmissionType}, Context: ${transmission.context}`);
  });

  if (transmissions.length === 0) {
    console.log('\n⚠️  No transmissions found in database!');
    console.log('Run the seed script to populate data: npx ts-node src/scripts/seed-comm-blocks.ts');
  }
}

checkTransmissions()
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });