import { prisma } from '../lib/prisma';
import { joniCommBlockService } from '../services/joni/comm-blocks/joni-comm-block.service';
import { joniTransmissionTemplateService } from '../services/joni/comm-blocks/joni-transmission-template.service';

async function seedCommBlocks() {
  console.log('🌱 Seeding Comm Blocks and Transmissions...');

  // Create Comm Blocks
  const commBlocks = [
    {
      code: 'callsign',
      name: 'Aircraft Callsign',
      category: 'identification',
      description: 'Standard aircraft callsign format',
      icaoReference: 'ICAO Doc 9432 Section 2.1',
      icaoRules: {
        format: 'airline_name + flight_number',
        example: 'United Four Five One',
        rules: ['Use phonetic alphabet for letters', 'Say each digit individually']
      },
      template: '{{callsign}}',
      rules: { required: true, pattern: '^[A-Z]{3}\\d{1,4}[A-Z]?$' },
      examples: ['United 451', 'American 1234', 'Delta 89'],
      commonErrors: ['Using "company" instead of airline name', 'Grouping digits'],
      difficultyLevel: 1,
      orderIndex: 1
    },
    {
      code: 'altitude',
      name: 'Altitude/Flight Level',
      category: 'instruction',
      description: 'Altitude or flight level expression',
      icaoReference: 'ICAO Doc 9432 Section 3.2',
      icaoRules: {
        belowTransition: 'Say altitude in thousands and hundreds',
        aboveTransition: 'Use "Flight Level" + three digits',
        rules: ['Below 10,000: say each digit', 'Above FL100: use flight level']
      },
      template: '{{altitude}}',
      rules: { required: true },
      examples: ['Flight Level Three Five Zero', 'One Zero Thousand', 'Four Thousand Five Hundred'],
      commonErrors: ['Saying "feet" unnecessarily', 'Wrong transition altitude'],
      difficultyLevel: 2,
      orderIndex: 2
    },
    {
      code: 'heading',
      name: 'Heading/Course',
      category: 'instruction',
      description: 'Magnetic heading or course',
      icaoReference: 'ICAO Doc 9432 Section 3.3',
      icaoRules: {
        format: 'Three digits, each spoken individually',
        rules: ['Always use three digits', 'Say "heading" before numbers']
      },
      template: 'heading {{heading}}',
      rules: { required: true, pattern: '^\\d{3}$' },
      examples: ['heading Two Seven Zero', 'heading Zero Nine Zero', 'heading Three Six Zero'],
      commonErrors: ['Omitting leading zeros', 'Saying "degrees"'],
      difficultyLevel: 1,
      orderIndex: 3
    },
    {
      code: 'speed',
      name: 'Speed',
      category: 'instruction',
      description: 'Indicated or ground speed',
      icaoReference: 'ICAO Doc 9432 Section 3.4',
      icaoRules: {
        format: 'Speed + number + "knots"',
        rules: ['Specify type if not indicated', 'Use "Mach" for high altitude']
      },
      template: '{{speed}} knots',
      rules: { required: false },
      examples: ['Two Five Zero knots', 'Mach decimal eight four'],
      commonErrors: ['Forgetting "knots"', 'Wrong Mach format'],
      difficultyLevel: 2,
      orderIndex: 4
    },
    {
      code: 'runway',
      name: 'Runway',
      category: 'information',
      description: 'Runway designation',
      icaoReference: 'ICAO Doc 9432 Section 2.4',
      icaoRules: {
        format: 'Runway + number + [L/C/R]',
        rules: ['Say each digit individually', 'Include L/R/C when applicable']
      },
      template: 'runway {{runway}}',
      rules: { required: true },
      examples: ['runway Two Seven Left', 'runway Zero Nine', 'runway Three Four Right'],
      commonErrors: ['Grouping runway numbers', 'Omitting L/R/C designation'],
      difficultyLevel: 1,
      orderIndex: 5
    },
    {
      code: 'frequency',
      name: 'Frequency',
      category: 'instruction',
      description: 'Radio frequency',
      icaoReference: 'ICAO Doc 9432 Section 2.5',
      icaoRules: {
        format: 'XXX.XXX MHz',
        rules: ['Say "decimal" for the point', 'Omit trailing zeros after decimal']
      },
      template: '{{frequency}}',
      rules: { required: true },
      examples: ['One Two One decimal Five', 'One One Eight decimal Three'],
      commonErrors: ['Saying "point" instead of "decimal"', 'Including unnecessary zeros'],
      difficultyLevel: 2,
      orderIndex: 6
    },
    {
      code: 'request',
      name: 'Request Phrase',
      category: 'identification',
      description: 'Standard request phraseology',
      icaoReference: 'ICAO Doc 9432 Section 4.1',
      icaoRules: {
        format: 'request + [specific action]',
        rules: ['Be specific and concise', 'State intention clearly']
      },
      template: 'request {{request}}',
      rules: { required: false },
      examples: ['request climb', 'request vectors', 'request descent'],
      commonErrors: ['Being too verbose', 'Unclear requests'],
      difficultyLevel: 1,
      orderIndex: 7
    },
    {
      code: 'acknowledge',
      name: 'Acknowledgement',
      category: 'readback',
      description: 'Standard acknowledgement phrases',
      icaoReference: 'ICAO Doc 9432 Section 5.1',
      icaoRules: {
        format: 'Various standard phrases',
        rules: ['Roger for receipt', 'Wilco for will comply', 'Unable if cannot comply']
      },
      template: '{{acknowledgement}}',
      rules: { required: false },
      examples: ['Roger', 'Wilco', 'Unable'],
      commonErrors: ['Using "Roger" when readback required', 'Non-standard phrases'],
      difficultyLevel: 1,
      orderIndex: 8
    }
  ];

  // Create comm blocks
  const createdBlocks: any[] = [];
  for (const block of commBlocks) {
    try {
      const created = await joniCommBlockService.createCommBlock(block);
      createdBlocks.push(created);
      console.log(`✅ Created comm block: ${block.name}`);
    } catch (error: any) {
      if (error.code === 'P2002') {
        const existing = await joniCommBlockService.getCommBlockByCode(block.code);
        if (existing) createdBlocks.push(existing);
        console.log(`⏭️  Comm block already exists: ${block.name}`);
      } else {
        console.error(`❌ Error creating comm block ${block.name}:`, error);
      }
    }
  }

  // Create Transmission Templates
  const transmissions = [
    {
      code: 'initial_contact_tower',
      name: 'Initial Contact with Tower',
      description: 'Standard initial contact when switching to tower frequency',
      transmissionType: 'pilot_to_atc' as const,
      context: 'tower' as const,
      difficultyLevel: 2,
      estimatedSeconds: 8,
      blocks: [
        { blockId: createdBlocks[0].id, order: 1 }, // callsign
        { blockId: createdBlocks[4].id, order: 2 }, // runway
        { blockId: createdBlocks[1].id, order: 3 }, // altitude
      ],
      metadata: { situation: 'approach' }
    },
    {
      code: 'altitude_change_request',
      name: 'Request for Altitude Change',
      description: 'Requesting climb or descent to a new altitude',
      transmissionType: 'pilot_to_atc' as const,
      context: 'enroute' as const,
      difficultyLevel: 2,
      estimatedSeconds: 10,
      blocks: [
        { blockId: createdBlocks[0].id, order: 1 }, // callsign
        { blockId: createdBlocks[6].id, order: 2, parameters: { request: 'climb' } }, // request
        { blockId: createdBlocks[1].id, order: 3 }, // altitude
      ],
      metadata: { phase: 'cruise' }
    },
    {
      code: 'heading_altitude_instruction',
      name: 'Heading and Altitude Instruction',
      description: 'ATC instruction for heading and altitude change',
      transmissionType: 'atc_to_pilot' as const,
      context: 'departure' as const,
      difficultyLevel: 3,
      estimatedSeconds: 12,
      blocks: [
        { blockId: createdBlocks[0].id, order: 1 }, // callsign
        { blockId: createdBlocks[2].id, order: 2 }, // heading
        { blockId: createdBlocks[1].id, order: 3 }, // altitude
        { blockId: createdBlocks[3].id, order: 4, isOptional: true }, // speed
      ],
      metadata: { phase: 'departure' }
    },
    {
      code: 'landing_clearance',
      name: 'Landing Clearance',
      description: 'Tower clearance for landing',
      transmissionType: 'atc_to_pilot' as const,
      context: 'tower' as const,
      difficultyLevel: 2,
      estimatedSeconds: 8,
      blocks: [
        { blockId: createdBlocks[0].id, order: 1 }, // callsign
        { blockId: createdBlocks[4].id, order: 2 }, // runway
        { blockId: createdBlocks[7].id, order: 3, parameters: { acknowledgement: 'cleared to land' } }, // acknowledge
      ],
      metadata: { phase: 'landing' }
    },
    {
      code: 'frequency_change',
      name: 'Frequency Change Instruction',
      description: 'Instruction to contact another controller',
      transmissionType: 'atc_to_pilot' as const,
      context: 'departure' as const,
      difficultyLevel: 1,
      estimatedSeconds: 6,
      blocks: [
        { blockId: createdBlocks[0].id, order: 1 }, // callsign
        { blockId: createdBlocks[5].id, order: 2 }, // frequency
      ],
      metadata: { handoff: true }
    },
    {
      code: 'taxi_clearance',
      name: 'Taxi Clearance',
      description: 'Ground clearance for taxi',
      transmissionType: 'atc_to_pilot' as const,
      context: 'ground' as const,
      difficultyLevel: 2,
      estimatedSeconds: 10,
      blocks: [
        { blockId: createdBlocks[0].id, order: 1 }, // callsign
        { blockId: createdBlocks[4].id, order: 2 }, // runway
        { blockId: createdBlocks[7].id, order: 3, parameters: { acknowledgement: 'taxi via' } }, // acknowledge
      ],
      metadata: { phase: 'ground' }
    }
  ];

  // Create transmissions
  for (const transmission of transmissions) {
    try {
      await joniTransmissionTemplateService.createTransmissionTemplate(transmission);
      console.log(`✅ Created transmission: ${transmission.name}`);
    } catch (error: any) {
      if (error.code === 'P2002') {
        console.log(`⏭️  Transmission already exists: ${transmission.name}`);
      } else {
        console.error(`❌ Error creating transmission ${transmission.name}:`, error);
      }
    }
  }

  console.log('✨ Seeding complete!');
}

// Run the seed function
seedCommBlocks()
  .catch((error) => {
    console.error('Seed script failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });