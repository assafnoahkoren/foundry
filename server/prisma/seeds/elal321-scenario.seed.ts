import { PrismaClient } from '@prisma/client';

export async function seedELAL321Scenario(prisma: PrismaClient) {
  console.log('🛫 Seeding EL AL 321 Heavy scenario...');

  try {
    // Check if comm blocks already exist
    const existingBlocks = await prisma.joniCommBlock.findMany({
      where: {
        code: {
          in: ['CALLSIGN', 'HEAVY', 'STAND', 'DESTINATION', 'ATIS_INFO']
        }
      }
    });

    // Create only the essential comm blocks if they don't exist
    const blocksToCreate = [
      {
        code: 'FACILITY_NAME',
        name: 'Facility Name',
        template: '{{facilityName}}',
        category: 'location',
        rules: { required: true },
        examples: ['Tel Aviv Clearance Delivery', 'Ben Gurion Ground', 'Ben Gurion Tower']
      },
      {
        code: 'CALLSIGN',
        name: 'Aircraft Callsign',
        template: '{{callsign}}',
        category: 'identification',
        rules: { required: true, pattern: '^[A-Z]{3}\\s?\\d{1,4}[A-Z]?$' },
        examples: ['EL AL 321', 'UAL 456', 'BAW 789']
      },
      {
        code: 'HEAVY',
        name: 'Heavy Aircraft Suffix',
        template: 'Heavy',
        category: 'identification',
        rules: { static: true },
        examples: ['Heavy']
      },
      {
        code: 'STAND',
        name: 'Stand/Gate',
        template: 'stand {{stand}}',
        category: 'location',
        rules: { required: true },
        examples: ['stand B4', 'stand A12', 'stand C7']
      },
      {
        code: 'GATE',
        name: 'Gate',
        template: 'gate {{gate}}',
        category: 'location',
        rules: { required: true },
        examples: ['gate B22', 'gate A15', 'gate C9']
      },
      {
        code: 'DESTINATION',
        name: 'Destination Airport',
        template: '{{destination}}',
        category: 'flightplan',
        rules: { required: true },
        examples: ['London Heathrow', 'Paris Charles de Gaulle', 'Frankfurt']
      },
      {
        code: 'DEPARTURE_NAME',
        name: 'Departure Name',
        template: '{{departure}}',
        category: 'flightplan',
        rules: { required: true },
        examples: ['PURLA 1A', 'ROTAX 2B', 'DELTA 3C']
      },
      {
        code: 'ATIS_INFO',
        name: 'ATIS Information',
        template: 'Information {{atisLetter}}',
        category: 'weather',
        rules: { required: true, pattern: '^[A-Z]$' },
        examples: ['Information Alpha', 'Information Bravo', 'Information Charlie']
      },
      {
        code: 'ALTITUDE',
        name: 'Altitude',
        template: '{{altitude}} feet',
        category: 'clearance',
        rules: { required: true, min: 1000, max: 50000 },
        examples: ['6000 feet', '10000 feet', '35000 feet']
      },
      {
        code: 'FLIGHT_LEVEL',
        name: 'Flight Level',
        template: 'FL{{flightLevel}}',
        category: 'clearance',
        rules: { required: true, min: 10, max: 600 },
        examples: ['FL350', 'FL280', 'FL410']
      },
      {
        code: 'SQUAWK',
        name: 'Squawk Code',
        template: '{{squawkCode}}',
        category: 'clearance',
        rules: { required: true, pattern: '^[0-7]{4}$' },
        examples: ['7312', '1200', '2000']
      },
      {
        code: 'FREQUENCY',
        name: 'Frequency',
        template: '{{frequency}}',
        category: 'communication',
        rules: { required: true, pattern: '^\\d{3}\\.\\d{1,3}$' },
        examples: ['132.3', '121.5', '118.1']
      },
      {
        code: 'TAXI_ROUTE',
        name: 'Taxi Route',
        template: '{{taxiRoute}}',
        category: 'ground',
        rules: { required: true },
        examples: ['B, D, Kilo', 'Alpha, Lima, Mike', 'Charlie, Echo']
      },
      {
        code: 'RUNWAY',
        name: 'Runway',
        template: 'runway {{runway}}',
        category: 'runway',
        rules: { required: true, pattern: '^\\d{2}[LCR]?$' },
        examples: ['runway 26', 'runway 09L', 'runway 27R']
      },
      {
        code: 'WIND',
        name: 'Wind',
        template: 'wind {{windDirection}} at {{windSpeed}}',
        category: 'weather',
        rules: { required: true },
        examples: ['wind 260 at 8', 'wind 270 at 12', 'wind 090 at 15']
      },
      {
        code: 'DIRECTION',
        name: 'Direction',
        template: '{{direction}}',
        category: 'instruction',
        rules: { required: true },
        examples: ['west', 'east', 'north', 'south']
      },
      {
        code: 'HEADING',
        name: 'Heading',
        template: 'heading {{heading}}',
        category: 'instruction',
        rules: { required: true, min: 1, max: 360 },
        examples: ['heading 090', 'heading 270', 'heading 180']
      },
      {
        code: 'TURN_DIRECTION',
        name: 'Turn Direction',
        template: '{{turnDirection}}',
        category: 'instruction',
        rules: { required: true, enum: ['left', 'right'] },
        examples: ['left', 'right']
      },
      {
        code: 'APPROACH_TYPE',
        name: 'Approach Type',
        template: '{{approachType}}',
        category: 'approach',
        rules: { required: true },
        examples: ['ILS', 'VOR', 'RNAV', 'Visual']
      },
      {
        code: 'EXIT_TAXIWAY',
        name: 'Exit Taxiway',
        template: '{{exitTaxiway}}',
        category: 'ground',
        rules: { required: true },
        examples: ['Alpha 7', 'Bravo 3', 'Charlie 5']
      }
    ];

    // Filter out blocks that already exist
    const existingCodes = existingBlocks.map(b => b.code);
    const newBlocks = blocksToCreate.filter(b => !existingCodes.includes(b.code));

    // Create new comm blocks using upsert to handle existing blocks
    const commBlocks = await Promise.all(
      blocksToCreate.map(block =>
        prisma.joniCommBlock.upsert({
          where: { code: block.code },
          update: block,
          create: block
        })
      )
    );

    console.log(`✅ Upserted ${commBlocks.length} comm blocks`);

    // Get all comm blocks (existing + new) for reference
    const allBlocks = await prisma.joniCommBlock.findMany({
      where: {
        code: {
          in: blocksToCreate.map(b => b.code)
        }
      }
    });

    const getBlockId = (code: string) => allBlocks.find(b => b.code === code)?.id!;

    // Check if transmissions already exist
    const existingTransmissions = await prisma.joniTransmissionTemplate.findMany({
      where: {
        code: {
          in: ['CLR_PILOT_INITIAL', 'CLR_ATC_RESPONSE', 'CLR_PILOT_READBACK']
        }
      }
    });

    if (existingTransmissions.length > 0) {
      console.log(`⚠️ Some transmissions already exist, skipping transmission creation`);
    } else {
      // Create sample transmissions for clearance phase only (to keep it manageable)
      const transmissions = await Promise.all([
        // Clearance Delivery - Pilot Initial Contact
        prisma.joniTransmissionTemplate.create({
          data: {
            code: 'CLR_PILOT_INITIAL',
            name: 'Clearance - Pilot Initial Contact',
            transmissionType: 'initial_contact',
            context: 'clearance',
            blocks: [
              { blockId: getBlockId('FACILITY_NAME'), order: 0 },
              { blockId: getBlockId('CALLSIGN'), order: 1 },
              { blockId: getBlockId('HEAVY'), order: 2 },
              { blockId: getBlockId('STAND'), order: 3 },
              { blockId: getBlockId('DESTINATION'), order: 4 },
              { blockId: getBlockId('ATIS_INFO'), order: 5 }
            ],
            metadata: {
              template: "{{facilityName}}, {{callsign}} Heavy, at {{stand}}, request IFR clearance to {{destination}}, with {{atisLetter}}"
            }
          }
        }),
        
        // Clearance Delivery - ATC Response
        prisma.joniTransmissionTemplate.create({
          data: {
            code: 'CLR_ATC_RESPONSE',
            name: 'Clearance - ATC Response',
            transmissionType: 'clearance',
            context: 'clearance',
            blocks: [
              { blockId: getBlockId('CALLSIGN'), order: 0 },
              { blockId: getBlockId('HEAVY'), order: 1 },
              { blockId: getBlockId('DESTINATION'), order: 2 },
              { blockId: getBlockId('DEPARTURE_NAME'), order: 3 },
              { blockId: getBlockId('ALTITUDE'), order: 4 },
              { blockId: getBlockId('SQUAWK'), order: 5 },
              { blockId: getBlockId('FREQUENCY'), order: 6 }
            ],
            metadata: {
              template: "{{callsign}} Heavy, cleared to {{destination}} via {{departure}} departure, flight planned route. Climb and maintain {{altitude}} feet. Squawk {{squawkCode}}. Departure frequency {{frequency}}"
            }
          }
        }),
        
        // Clearance Delivery - Pilot Readback
        prisma.joniTransmissionTemplate.create({
          data: {
            code: 'CLR_PILOT_READBACK',
            name: 'Clearance - Pilot Readback',
            transmissionType: 'readback',
            context: 'clearance',
            blocks: [
              { blockId: getBlockId('DESTINATION'), order: 0 },
              { blockId: getBlockId('DEPARTURE_NAME'), order: 1 },
              { blockId: getBlockId('ALTITUDE'), order: 2 },
              { blockId: getBlockId('SQUAWK'), order: 3 },
              { blockId: getBlockId('FREQUENCY'), order: 4 },
              { blockId: getBlockId('CALLSIGN'), order: 5 },
              { blockId: getBlockId('HEAVY'), order: 6 }
            ],
            metadata: {
              template: "Cleared to {{destination}} via {{departure}}, climb {{altitude}} feet, squawk {{squawkCode}}, departure on {{frequency}}, {{callsign}} Heavy"
            }
          }
        })
      ]);

      console.log(`✅ Created ${transmissions.length} transmissions for clearance phase`);
    }

    // Get the created transmissions for script creation
    const transmissionsByCode = await prisma.joniTransmissionTemplate.findMany({
      where: {
        code: {
          in: ['CLR_PILOT_INITIAL', 'CLR_ATC_RESPONSE', 'CLR_PILOT_READBACK']
        }
      }
    });

    const getTransmissionId = (code: string) => transmissionsByCode.find(t => t.code === code)?.id!;

    // Check if script already exists
    const existingScript = await prisma.joniScript.findUnique({
      where: { code: 'ELAL321_LLBG_EGLL_DEMO' }
    });

    if (existingScript) {
      console.log(`⚠️ Script already exists: ${existingScript.name}`);
      return existingScript;
    }

    // Create a simplified demo script with just the clearance phase
    const script = await prisma.joniScript.create({
      data: {
        code: 'ELAL321_LLBG_EGLL_DEMO',
        name: 'EL AL 321 Heavy - Clearance Demo',
        description: 'Clearance delivery phase for EL AL 321 Heavy from Tel Aviv to London',
        scriptType: 'scenario',
        difficultyLevel: 2,
        estimatedMinutes: 5,
        tags: ['IFR', 'heavy', 'clearance', 'demo'],
        flightContext: {
          aircraft: 'Boeing 787-9',
          departure: 'LLBG',
          arrival: 'EGLL',
          flightRules: 'IFR',
          weightClass: 'heavy'
        },
        dagStructure: {
          nodes: [
            // Start node - Scenario briefing
            {
              id: 'node-start',
              type: 'situation',
              name: 'Scenario Briefing',
              position: { x: 250, y: 50 },
              content: {
                type: 'situation',
                title: 'EL AL 321 Heavy - Clearance Briefing',
                description: `You are the pilot of EL AL 321 Heavy, a Boeing 787-9 at Stand B4.

Task: Request IFR clearance to London Heathrow.
ATIS: Information Alpha

Remember to include your callsign with "Heavy" suffix in all transmissions.`
              }
            },
            
            // Contact clearance delivery
            {
              id: 'node-clr-intro',
              type: 'situation',
              name: 'Contact Clearance',
              position: { x: 250, y: 150 },
              content: {
                type: 'situation',
                title: 'Contact Clearance Delivery',
                description: 'Contact Tel Aviv Clearance Delivery on frequency 121.9 to request your IFR clearance.'
              }
            },
            
            // User requests clearance
            {
              id: 'node-clr-pilot',
              type: 'user_response',
              name: 'Request IFR Clearance',
              position: { x: 250, y: 250 },
              content: {
                type: 'user_response',
                transmissionId: getTransmissionId('CLR_PILOT_INITIAL'),
                variables: {}
              }
            },
            
            // ATC provides clearance
            {
              id: 'node-clr-atc-response',
              type: 'transmission',
              name: 'ATC Clearance',
              position: { x: 250, y: 350 },
              content: {
                type: 'transmission_ref',
                transmissionId: getTransmissionId('CLR_ATC_RESPONSE'),
                actorRole: 'ground',
                variables: {}
              }
            },
            
            // User readback
            {
              id: 'node-clr-pilot-readback',
              type: 'user_response',
              name: 'Readback Clearance',
              position: { x: 250, y: 450 },
              content: {
                type: 'user_response',
                transmissionId: getTransmissionId('CLR_PILOT_READBACK'),
                variables: {}
              }
            },
            
            // Completion
            {
              id: 'node-complete',
              type: 'situation',
              name: 'Clearance Complete',
              position: { x: 250, y: 550 },
              content: {
                type: 'situation',
                title: 'Clearance Received',
                description: 'Excellent! You have successfully received and read back your IFR clearance. You are now cleared to London Heathrow via PURLA 1A departure.'
              }
            }
          ],
          edges: [
            { from: 'node-start', to: 'node-clr-intro', condition: { type: 'default' } },
            { from: 'node-clr-intro', to: 'node-clr-pilot', condition: { type: 'default' } },
            { from: 'node-clr-pilot', to: 'node-clr-atc-response', condition: { type: 'validation_pass' } },
            { from: 'node-clr-pilot', to: 'node-clr-pilot', condition: { type: 'retry' }, label: 'Try again' },
            { from: 'node-clr-atc-response', to: 'node-clr-pilot-readback', condition: { type: 'default' } },
            { from: 'node-clr-pilot-readback', to: 'node-complete', condition: { type: 'validation_pass' } },
            { from: 'node-clr-pilot-readback', to: 'node-clr-pilot-readback', condition: { type: 'retry' }, label: 'Try again' }
          ],
          globalVariables: {
            facilityName: 'Tel Aviv Clearance Delivery',
            callsign: 'EL AL 321',
            stand: 'stand B4',
            destination: 'London Heathrow',
            atisLetter: 'Alpha',
            departure: 'PURLA 1A',
            altitude: '6000',
            squawkCode: '7312',
            frequency: '132.3'
          }
        }
      }
    });

    console.log(`✅ Created demo script: ${script.name}`);
    return script;

  } catch (error) {
    console.error('❌ Error seeding EL AL 321 scenario:', error);
    throw error;
  }
}

export default seedELAL321Scenario;