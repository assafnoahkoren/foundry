import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateCommBlockTemplates() {
  try {
    // Update comm blocks with templates
    const updates = [
      {
        code: 'callsign',
        template: '{{callsign}}'
      },
      {
        code: 'altitude',
        template: '{{altitude_value}} {{altitude_unit}}'
      },
      {
        code: 'heading',
        template: '{{heading_degrees}}'
      },
      {
        code: 'speed',
        template: '{{speed_value}} knots'
      },
      {
        code: 'position_report',
        template: 'Position {{waypoint}} at time {{time}}, {{altitude}}'
      },
      {
        code: 'takeoff_clearance',
        template: 'Runway {{runway}}, cleared for takeoff'
      },
      {
        code: 'landing_clearance',
        template: 'Runway {{runway}}, cleared to land'
      },
      {
        code: 'taxi_clearance',
        template: 'Taxi to {{destination}} via {{taxiways}}'
      },
      {
        code: 'altitude_instruction',
        template: '{{climb_or_descend}} to {{altitude}}'
      },
      {
        code: 'heading_instruction',
        template: 'Turn {{direction}} heading {{heading}}'
      },
      {
        code: 'speed_instruction',
        template: '{{reduce_or_increase}} speed to {{speed}} knots'
      },
      {
        code: 'frequency_change',
        template: 'Contact {{facility}} {{frequency}}'
      },
      {
        code: 'squawk',
        template: 'Squawk {{code}}'
      },
      {
        code: 'hold_short',
        template: 'Hold short of {{location}}'
      },
      {
        code: 'go_around',
        template: '{{callsign}}, go around'
      }
    ];

    for (const update of updates) {
      const result = await prisma.joniCommBlock.update({
        where: { code: update.code },
        data: { template: update.template }
      });
      console.log(`✅ Updated template for ${update.code}`);
    }

    console.log('\n✅ All templates updated successfully!');
  } catch (error) {
    console.error('❌ Error updating templates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateCommBlockTemplates();