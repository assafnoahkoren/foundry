import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️ Deleting existing transmissions...');
  
  // Delete existing transmissions
  const deleted = await prisma.joniTransmissionTemplate.deleteMany({
    where: {
      code: {
        in: ['CLR_PILOT_INITIAL', 'CLR_ATC_RESPONSE', 'CLR_PILOT_READBACK']
      }
    }
  });
  
  console.log(`✅ Deleted ${deleted.count} transmissions`);
}

main()
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });