import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ICAO-compliant communication blocks based on Doc 9432 and standard phraseology
const commBlocks = [
  // ===== IDENTIFICATION BLOCKS =====
  {
    code: 'callsign',
    name: 'Aircraft Callsign',
    category: 'identification',
    description: 'Standard format for aircraft callsign communication',
    icaoReference: 'ICAO Doc 9432, Section 2.1',
    difficultyLevel: 1,
    orderIndex: 1,
    rules: {
      format: '[AIRLINE] [NUMBER]',
      examples: ['United 123', 'Delta 456', 'November 789 Alpha'],
      phoneticRequired: true
    },
    examples: [
      'United Three Two One',
      'Delta Four Five Six',
      'November Seven Eight Nine Alpha'
    ],
    commonErrors: [
      'Using numbers instead of phonetic pronunciation',
      'Incorrect airline callsign format',
      'Missing or incorrect phonetic alphabet'
    ]
  },
  {
    code: 'aircraft_type',
    name: 'Aircraft Type',
    category: 'identification',
    description: 'ICAO aircraft type designator',
    icaoReference: 'ICAO Doc 8643',
    difficultyLevel: 2,
    orderIndex: 2,
    rules: {
      format: '[TYPE_CODE] or [MANUFACTURER] [MODEL]',
      useICAOCodes: true
    },
    examples: [
      'Boeing Seven Three Seven',
      'Airbus Three Two Zero',
      'Cessna One Seven Two'
    ],
    commonErrors: [
      'Using incorrect ICAO type codes',
      'Mixing manufacturer and model incorrectly'
    ]
  },

  // ===== POSITION BLOCKS =====
  {
    code: 'altitude',
    name: 'Altitude',
    category: 'position',
    description: 'Standard altitude reporting format',
    icaoReference: 'ICAO Annex 2, Chapter 3',
    difficultyLevel: 1,
    orderIndex: 10,
    rules: {
      format: 'FLIGHT_LEVEL [NUMBER] or [NUMBER] FEET',
      transitionAltitude: 18000,
      phoneticNumbers: true
    },
    examples: [
      'Flight Level Three Five Zero',
      'One Zero Thousand',
      'Four Thousand Five Hundred'
    ],
    commonErrors: [
      'Confusing flight levels with altitude in feet',
      'Incorrect transition altitude usage',
      'Not using "thousand" for round thousands'
    ]
  },
  {
    code: 'heading',
    name: 'Heading',
    category: 'position',
    description: 'Magnetic heading in degrees',
    icaoReference: 'ICAO Doc 9432, Section 3.2',
    difficultyLevel: 1,
    orderIndex: 11,
    rules: {
      format: '[THREE_DIGITS] DEGREES',
      alwaysThreeDigits: true,
      magnetic: true
    },
    examples: [
      'Zero Nine Zero',
      'Two Seven Zero',
      'Three Six Zero'
    ],
    commonErrors: [
      'Not using three digits (saying "ninety" instead of "zero nine zero")',
      'Adding "degrees" when not required',
      'Confusing true vs magnetic heading'
    ]
  },
  {
    code: 'speed',
    name: 'Speed',
    category: 'position',
    description: 'Indicated airspeed or ground speed',
    icaoReference: 'ICAO Doc 9432, Section 3.3',
    difficultyLevel: 2,
    orderIndex: 12,
    rules: {
      format: '[NUMBER] KNOTS',
      indicatedOrGround: 'specify',
      mach: 'MACH [DECIMAL]'
    },
    examples: [
      'Two Five Zero Knots',
      'Mach Decimal Eight Five',
      'One Eight Zero Knots Indicated'
    ],
    commonErrors: [
      'Not specifying knots',
      'Incorrect Mach number format',
      'Confusion between indicated and ground speed'
    ]
  },
  {
    code: 'position_report',
    name: 'Position Report',
    category: 'position',
    description: 'Current position using waypoint or coordinates',
    icaoReference: 'ICAO Annex 2, Appendix 2',
    difficultyLevel: 3,
    orderIndex: 13,
    rules: {
      format: 'POSITION [WAYPOINT/FIX] or [LATITUDE] [LONGITUDE]',
      includeTime: true,
      includeLevel: true
    },
    examples: [
      'Position ALPHA at time Two Three Four Five, Flight Level Three Five Zero',
      'Overhead BRAVO, maintaining One Zero Thousand',
      'Five miles south of CHARLIE VOR'
    ],
    commonErrors: [
      'Missing time in position report',
      'Incorrect waypoint pronunciation',
      'Missing altitude/flight level'
    ]
  },

  // ===== CLEARANCE BLOCKS =====
  {
    code: 'takeoff_clearance',
    name: 'Takeoff Clearance',
    category: 'clearance',
    description: 'Standard takeoff clearance phraseology',
    icaoReference: 'ICAO Doc 4444, Section 12.3.1',
    difficultyLevel: 2,
    orderIndex: 20,
    rules: {
      format: 'RUNWAY [NUMBER] CLEARED FOR TAKEOFF',
      windRequired: 'optional',
      neverSayTakeoffExceptWhenClearing: true
    },
    examples: [
      'Runway Two Seven, cleared for takeoff',
      'Runway Zero Nine Left, cleared for takeoff, wind zero seven zero at one five',
      'Runway Three Six, cleared for immediate takeoff'
    ],
    commonErrors: [
      'Using "takeoff" in non-clearance situations',
      'Incorrect runway designation',
      'Missing wind information when required'
    ]
  },
  {
    code: 'landing_clearance',
    name: 'Landing Clearance',
    category: 'clearance',
    description: 'Standard landing clearance phraseology',
    icaoReference: 'ICAO Doc 4444, Section 12.3.4',
    difficultyLevel: 2,
    orderIndex: 21,
    rules: {
      format: 'RUNWAY [NUMBER] CLEARED TO LAND',
      windRequired: 'recommended',
      cautionWakeeTurbulence: 'when applicable'
    },
    examples: [
      'Runway Two Seven, cleared to land',
      'Runway Zero Nine Left, cleared to land, wind zero seven zero at one five',
      'Runway Three Six, cleared to land, caution wake turbulence'
    ],
    commonErrors: [
      'Saying "cleared for landing" instead of "cleared to land"',
      'Missing wake turbulence caution',
      'Incorrect runway designation'
    ]
  },
  {
    code: 'taxi_clearance',
    name: 'Taxi Clearance',
    category: 'clearance',
    description: 'Ground taxi instructions',
    icaoReference: 'ICAO Doc 4444, Section 12.3.1',
    difficultyLevel: 3,
    orderIndex: 22,
    rules: {
      format: 'TAXI TO [LOCATION] VIA [TAXIWAYS]',
      holdShortRequired: 'at all runway crossings',
      readbackRequired: true
    },
    examples: [
      'Taxi to runway Two Seven via Alpha, Bravo, hold short runway Three Six',
      'Taxi to gate Five via November, cross runway Two Seven',
      'Taxi to parking via Hotel, Lima'
    ],
    commonErrors: [
      'Not including hold short instructions',
      'Incorrect taxiway phonetics',
      'Missing runway crossing clearances'
    ]
  },

  // ===== INSTRUCTIONS BLOCKS =====
  {
    code: 'altitude_instruction',
    name: 'Altitude Instruction',
    category: 'instruction',
    description: 'Climb or descend instructions',
    icaoReference: 'ICAO Doc 4444, Section 12.4.1',
    difficultyLevel: 2,
    orderIndex: 30,
    rules: {
      format: 'CLIMB/DESCEND TO [ALTITUDE/FL]',
      rateOptional: true,
      expediteAvailable: true
    },
    examples: [
      'Climb to Flight Level Three Five Zero',
      'Descend to One Zero Thousand',
      'Climb to Four Thousand, expedite'
    ],
    commonErrors: [
      'Confusing "climb" and "ascend"',
      'Missing "to" in instruction',
      'Incorrect altitude format'
    ]
  },
  {
    code: 'heading_instruction',
    name: 'Heading Instruction',
    category: 'instruction',
    description: 'Turn to heading instructions',
    icaoReference: 'ICAO Doc 4444, Section 12.4.2',
    difficultyLevel: 2,
    orderIndex: 31,
    rules: {
      format: 'TURN LEFT/RIGHT HEADING [THREE_DIGITS]',
      flyOptional: 'FLY HEADING [THREE_DIGITS]',
      vectorsAvailable: true
    },
    examples: [
      'Turn left heading Zero Nine Zero',
      'Turn right heading Two Seven Zero',
      'Fly heading Three Six Zero, vectors for ILS'
    ],
    commonErrors: [
      'Not specifying left or right turn',
      'Using two digits instead of three',
      'Forgetting vectors purpose'
    ]
  },
  {
    code: 'speed_instruction',
    name: 'Speed Instruction',
    category: 'instruction',
    description: 'Speed adjustment instructions',
    icaoReference: 'ICAO Doc 4444, Section 12.4.3',
    difficultyLevel: 2,
    orderIndex: 32,
    rules: {
      format: 'REDUCE/INCREASE SPEED TO [NUMBER] KNOTS',
      maintainOption: 'MAINTAIN [NUMBER] KNOTS',
      noSpeedRestriction: 'NO SPEED RESTRICTION'
    },
    examples: [
      'Reduce speed to Two Five Zero knots',
      'Maintain One Eight Zero knots or greater',
      'Resume normal speed'
    ],
    commonErrors: [
      'Not specifying knots',
      'Ambiguous speed instructions',
      'Missing "or greater/or less" qualifiers'
    ]
  },

  // ===== READBACK BLOCKS =====
  {
    code: 'readback_format',
    name: 'Readback Format',
    category: 'readback',
    description: 'Proper readback structure',
    icaoReference: 'ICAO Doc 9432, Section 2.6',
    difficultyLevel: 2,
    orderIndex: 40,
    rules: {
      format: '[INSTRUCTION] [CALLSIGN]',
      mandatoryItems: ['altitude', 'heading', 'speed', 'clearances', 'frequencies'],
      endWithCallsign: true
    },
    examples: [
      'Descending to One Zero Thousand, United Three Two One',
      'Cleared to land runway Two Seven, Delta Four Five Six',
      'Contact ground one two one decimal nine, November Seven Eight Nine'
    ],
    commonErrors: [
      'Not ending with callsign',
      'Missing mandatory readback items',
      'Adding unnecessary information'
    ]
  },
  {
    code: 'roger',
    name: 'Roger/Acknowledge',
    category: 'readback',
    description: 'Acknowledgment without readback',
    icaoReference: 'ICAO Doc 9432, Section 2.6.2',
    difficultyLevel: 1,
    orderIndex: 41,
    rules: {
      format: 'ROGER or WILCO',
      rogerMeansReceived: true,
      wilcoMeansWillComply: true,
      neverUseForClearances: true
    },
    examples: [
      'Roger',
      'Wilco',
      'Roger, United Three Two One'
    ],
    commonErrors: [
      'Using "Roger" for clearances requiring readback',
      'Saying "Roger wilco" (redundant)',
      'Using "Copy" instead of "Roger"'
    ]
  },

  // ===== INFORMATION BLOCKS =====
  {
    code: 'weather_info',
    name: 'Weather Information',
    category: 'information',
    description: 'Weather reporting format',
    icaoReference: 'ICAO Annex 3',
    difficultyLevel: 3,
    orderIndex: 50,
    rules: {
      format: 'WIND [DIRECTION] AT [SPEED], VISIBILITY [DISTANCE], [CONDITIONS]',
      useMetar: 'for detailed reports',
      qnhRequired: true
    },
    examples: [
      'Wind Two Seven Zero at One Five, visibility One Zero kilometers, QNH One Zero One Three',
      'Wind calm, visibility five miles, few clouds at Three Thousand',
      'Wind Three Six Zero at Two Zero gusting Three Zero'
    ],
    commonErrors: [
      'Incorrect wind direction format',
      'Missing QNH/altimeter setting',
      'Mixing metric and imperial units'
    ]
  },
  {
    code: 'traffic_info',
    name: 'Traffic Information',
    category: 'information',
    description: 'Traffic advisory format',
    icaoReference: 'ICAO Doc 4444, Section 12.4.5',
    difficultyLevel: 3,
    orderIndex: 51,
    rules: {
      format: 'TRAFFIC [POSITION] [DISTANCE] [DIRECTION] [ALTITUDE] [TYPE]',
      clockPosition: 'use oclock reference',
      movingDirection: 'specify if known'
    },
    examples: [
      'Traffic twelve oclock, five miles, opposite direction, same altitude, Boeing Seven Three Seven',
      'Traffic three oclock, two miles, northbound, one thousand feet below',
      'Traffic nine oclock, eight miles, crossing left to right, Flight Level Three Five Zero'
    ],
    commonErrors: [
      'Incorrect clock position',
      'Missing altitude reference',
      'Vague distance estimates'
    ]
  },
  {
    code: 'runway_info',
    name: 'Runway Information',
    category: 'information',
    description: 'Runway condition and status',
    icaoReference: 'ICAO Doc 4444, Section 7.5',
    difficultyLevel: 2,
    orderIndex: 52,
    rules: {
      format: 'RUNWAY [NUMBER] [CONDITION]',
      conditionCodes: 'use standard codes',
      brakeAction: 'report when applicable'
    },
    examples: [
      'Runway Two Seven wet',
      'Runway Zero Nine Left, braking action medium',
      'Runway Three Six closed for maintenance'
    ],
    commonErrors: [
      'Non-standard condition descriptions',
      'Missing runway designation',
      'Incorrect braking action terms'
    ]
  },

  // ===== EMERGENCY BLOCKS =====
  {
    code: 'mayday',
    name: 'Mayday Call',
    category: 'emergency',
    description: 'Distress call format',
    icaoReference: 'ICAO Annex 10, Vol II, Chapter 5',
    difficultyLevel: 3,
    orderIndex: 60,
    rules: {
      format: 'MAYDAY MAYDAY MAYDAY [CALLSIGN] [POSITION] [NATURE] [INTENTIONS] [ASSISTANCE]',
      repeatThreeTimes: true,
      priority: 'absolute'
    },
    examples: [
      'Mayday, Mayday, Mayday, United Three Two One, position fifty miles south of Alpha, engine failure, descending through Flight Level Two Zero Zero, request vectors to nearest airport',
      'Mayday, Mayday, Mayday, November Seven Eight Nine, ten miles north of field, engine fire, forced landing'
    ],
    commonErrors: [
      'Not repeating Mayday three times',
      'Missing critical information',
      'Using for non-distress situations'
    ]
  },
  {
    code: 'pan_pan',
    name: 'Pan Pan Call',
    category: 'emergency',
    description: 'Urgency call format',
    icaoReference: 'ICAO Annex 10, Vol II, Chapter 5',
    difficultyLevel: 3,
    orderIndex: 61,
    rules: {
      format: 'PAN PAN, PAN PAN, PAN PAN [CALLSIGN] [POSITION] [NATURE] [INTENTIONS] [ASSISTANCE]',
      repeatThreeTimes: true,
      priority: 'urgent'
    },
    examples: [
      'Pan Pan, Pan Pan, Pan Pan, Delta Four Five Six, position overhead Bravo, passenger medical emergency, request priority landing',
      'Pan Pan, Pan Pan, Pan Pan, United Three Two One, low fuel situation, request direct routing'
    ],
    commonErrors: [
      'Confusing with Mayday',
      'Not repeating three times',
      'Using for routine requests'
    ]
  },

  // ===== FREQUENCY BLOCKS =====
  {
    code: 'frequency_change',
    name: 'Frequency Change',
    category: 'instruction',
    description: 'Contact/monitor frequency instructions',
    icaoReference: 'ICAO Doc 9432, Section 2.5',
    difficultyLevel: 1,
    orderIndex: 70,
    rules: {
      format: 'CONTACT [FACILITY] [FREQUENCY]',
      monitorOption: 'MONITOR [FACILITY] [FREQUENCY]',
      decimalFormat: '[THREE DIGITS] DECIMAL [DIGITS]'
    },
    examples: [
      'Contact tower one one eight decimal three',
      'Contact ground one two one decimal nine',
      'Monitor approach one two four decimal seven five'
    ],
    commonErrors: [
      'Saying "point" instead of "decimal"',
      'Incorrect frequency format',
      'Missing facility name'
    ]
  },

  // ===== MISCELLANEOUS BLOCKS =====
  {
    code: 'squawk',
    name: 'Transponder Code',
    category: 'instruction',
    description: 'Transponder squawk code assignment',
    icaoReference: 'ICAO Doc 4444, Section 8.5.2',
    difficultyLevel: 1,
    orderIndex: 80,
    rules: {
      format: 'SQUAWK [FOUR DIGITS]',
      identOption: 'SQUAWK IDENT',
      emergencyCodes: { vfr: '1200', hijack: '7500', radioFailure: '7600', emergency: '7700' }
    },
    examples: [
      'Squawk Four Five Two One',
      'Squawk Seven Seven Zero Zero',
      'Squawk ident'
    ],
    commonErrors: [
      'Not using all four digits',
      'Confusing squawk codes',
      'Saying "Transponder" instead of "Squawk"'
    ]
  },
  {
    code: 'hold_short',
    name: 'Hold Short',
    category: 'instruction',
    description: 'Hold short of runway/taxiway',
    icaoReference: 'ICAO Doc 4444, Section 12.3.1',
    difficultyLevel: 2,
    orderIndex: 81,
    rules: {
      format: 'HOLD SHORT OF [RUNWAY/TAXIWAY]',
      readbackMandatory: true,
      neverCrossWithout: 'explicit clearance'
    },
    examples: [
      'Hold short of runway Two Seven',
      'Hold short of taxiway Alpha',
      'Hold position'
    ],
    commonErrors: [
      'Not reading back hold short instructions',
      'Confusing with "hold position"',
      'Missing runway/taxiway designation'
    ]
  },
  {
    code: 'go_around',
    name: 'Go Around',
    category: 'instruction',
    description: 'Missed approach/go around instruction',
    icaoReference: 'ICAO Doc 4444, Section 12.3.4',
    difficultyLevel: 2,
    orderIndex: 82,
    rules: {
      format: '[CALLSIGN] GO AROUND',
      immediateAction: true,
      followWithInstructions: true
    },
    examples: [
      'United Three Two One, go around',
      'Delta Four Five Six, go around, turn left heading Zero Nine Zero, climb to Three Thousand',
      'November Seven Eight Nine, go around, I say again, go around'
    ],
    commonErrors: [
      'Delayed execution',
      'Missing follow-up instructions',
      'Confusion with "missed approach"'
    ]
  }
];

// Transmission templates that combine multiple blocks
const transmissionTemplates = [
  {
    code: 'initial_contact_ground',
    name: 'Initial Contact with Ground',
    description: 'First contact with ground control for taxi',
    transmissionType: 'pilot_to_atc',
    context: 'ground',
    difficultyLevel: 2,
    estimatedSeconds: 8,
    blocks: [
      { blockCode: 'callsign', order: 1, parameters: {}, isOptional: false },
      { blockCode: 'position_report', order: 2, parameters: { simplified: true }, isOptional: false },
      { blockCode: 'aircraft_type', order: 3, parameters: {}, isOptional: true }
    ],
    metadata: {
      example: 'Ground, United Three Two One at gate Alpha Five, Boeing Seven Three Seven, ready to taxi'
    }
  },
  {
    code: 'taxi_clearance_delivery',
    name: 'Taxi Clearance Delivery',
    description: 'Ground control issuing taxi clearance',
    transmissionType: 'atc_to_pilot',
    context: 'ground',
    difficultyLevel: 3,
    estimatedSeconds: 10,
    blocks: [
      { blockCode: 'callsign', order: 1, parameters: {}, isOptional: false },
      { blockCode: 'taxi_clearance', order: 2, parameters: {}, isOptional: false },
      { blockCode: 'hold_short', order: 3, parameters: {}, isOptional: true }
    ],
    metadata: {
      example: 'United Three Two One, taxi to runway Two Seven via Alpha, Bravo, hold short runway Three Six'
    }
  },
  {
    code: 'takeoff_clearance_full',
    name: 'Takeoff Clearance with Wind',
    description: 'Tower issuing takeoff clearance with wind information',
    transmissionType: 'atc_to_pilot',
    context: 'tower',
    difficultyLevel: 2,
    estimatedSeconds: 8,
    blocks: [
      { blockCode: 'callsign', order: 1, parameters: {}, isOptional: false },
      { blockCode: 'weather_info', order: 2, parameters: { windOnly: true }, isOptional: true },
      { blockCode: 'takeoff_clearance', order: 3, parameters: {}, isOptional: false }
    ],
    metadata: {
      example: 'United Three Two One, wind Two Seven Zero at One Five, runway Two Seven cleared for takeoff'
    }
  },
  {
    code: 'approach_initial_contact',
    name: 'Initial Contact with Approach',
    description: 'First contact with approach control',
    transmissionType: 'pilot_to_atc',
    context: 'approach',
    difficultyLevel: 3,
    estimatedSeconds: 10,
    blocks: [
      { blockCode: 'callsign', order: 1, parameters: {}, isOptional: false },
      { blockCode: 'position_report', order: 2, parameters: {}, isOptional: false },
      { blockCode: 'altitude', order: 3, parameters: {}, isOptional: false },
      { blockCode: 'speed', order: 4, parameters: {}, isOptional: true }
    ],
    metadata: {
      example: 'Approach, Delta Four Five Six, twenty miles north, descending through Flight Level One Five Zero for One Zero Thousand'
    }
  },
  {
    code: 'landing_clearance_full',
    name: 'Landing Clearance with Wind and Caution',
    description: 'Tower issuing landing clearance with full information',
    transmissionType: 'atc_to_pilot',
    context: 'tower',
    difficultyLevel: 3,
    estimatedSeconds: 10,
    blocks: [
      { blockCode: 'callsign', order: 1, parameters: {}, isOptional: false },
      { blockCode: 'weather_info', order: 2, parameters: { windOnly: true }, isOptional: true },
      { blockCode: 'landing_clearance', order: 3, parameters: {}, isOptional: false }
    ],
    metadata: {
      example: 'Delta Four Five Six, wind Two Seven Zero at One Five, runway Two Seven cleared to land, caution wake turbulence'
    }
  },
  {
    code: 'altitude_change_request',
    name: 'Request for Altitude Change',
    description: 'Pilot requesting different altitude',
    transmissionType: 'pilot_to_atc',
    context: 'enroute',
    difficultyLevel: 2,
    estimatedSeconds: 8,
    blocks: [
      { blockCode: 'callsign', order: 1, parameters: {}, isOptional: false },
      { blockCode: 'altitude', order: 2, parameters: { request: true }, isOptional: false }
    ],
    metadata: {
      example: 'Center, United Three Two One, request Flight Level Three Seven Zero'
    }
  },
  {
    code: 'vectors_for_approach',
    name: 'Vectors for Approach',
    description: 'ATC providing vectors for approach',
    transmissionType: 'atc_to_pilot',
    context: 'approach',
    difficultyLevel: 3,
    estimatedSeconds: 10,
    blocks: [
      { blockCode: 'callsign', order: 1, parameters: {}, isOptional: false },
      { blockCode: 'heading_instruction', order: 2, parameters: {}, isOptional: false },
      { blockCode: 'altitude_instruction', order: 3, parameters: {}, isOptional: true },
      { blockCode: 'speed_instruction', order: 4, parameters: {}, isOptional: true }
    ],
    metadata: {
      example: 'United Three Two One, turn left heading Zero Nine Zero, descend to Three Thousand, reduce speed to One Eight Zero knots'
    }
  }
];

async function seedCommBlocks() {
  console.log('🌱 Seeding ICAO-compliant communication blocks...');

  try {
    // Create comm blocks with proper block IDs
    const createdBlocks: Record<string, string> = {};
    
    for (const block of commBlocks) {
      const created = await prisma.joniCommBlock.upsert({
        where: { code: block.code },
        update: block,
        create: block
      });
      createdBlocks[block.code] = created.id;
      console.log(`✅ Created/Updated comm block: ${block.code}`);
    }

    console.log('\n🌱 Seeding transmission templates...');

    // Create transmission templates with proper block references
    for (const template of transmissionTemplates) {
      // Map block codes to IDs
      const blocksWithIds = template.blocks.map(block => ({
        blockId: createdBlocks[block.blockCode],
        order: block.order,
        parameters: block.parameters,
        isOptional: block.isOptional
      }));

      await prisma.joniTransmissionTemplate.upsert({
        where: { code: template.code },
        update: {
          ...template,
          blocks: blocksWithIds
        },
        create: {
          ...template,
          blocks: blocksWithIds
        }
      });
      console.log(`✅ Created/Updated transmission template: ${template.code}`);
    }

    console.log('\n🌱 Creating sample scripts...');

    // Create a sample training script
    const trainingScript = await prisma.joniScript.upsert({
      where: { code: 'vfr_pattern_work' },
      update: {
        name: 'VFR Pattern Work',
        description: 'Standard VFR pattern work at a controlled airport',
        scriptType: 'training',
        phase: 'ground',
        difficultyLevel: 2,
        estimatedMinutes: 15,
        flightContext: {
          aircraft: 'Cessna 172',
          airport: 'KJFK',
          weather: 'VFR conditions',
          traffic: 'Moderate'
        },
        learningObjectives: [
          'Proper initial contact procedures',
          'Taxi clearance readback',
          'Pattern entry and communications',
          'Touch and go procedures'
        ]
      },
      create: {
        code: 'vfr_pattern_work',
        name: 'VFR Pattern Work',
        description: 'Standard VFR pattern work at a controlled airport',
        scriptType: 'training',
        phase: 'ground',
        difficultyLevel: 2,
        estimatedMinutes: 15,
        flightContext: {
          aircraft: 'Cessna 172',
          airport: 'KJFK',
          weather: 'VFR conditions',
          traffic: 'Moderate'
        },
        learningObjectives: [
          'Proper initial contact procedures',
          'Taxi clearance readback',
          'Pattern entry and communications',
          'Touch and go procedures'
        ]
      }
    });

    console.log(`✅ Created/Updated training script: ${trainingScript.code}`);

    // Get transmission template IDs
    const groundContact = await prisma.joniTransmissionTemplate.findUnique({
      where: { code: 'initial_contact_ground' }
    });
    const taxiClearance = await prisma.joniTransmissionTemplate.findUnique({
      where: { code: 'taxi_clearance_delivery' }
    });
    const takeoffClearance = await prisma.joniTransmissionTemplate.findUnique({
      where: { code: 'takeoff_clearance_full' }
    });

    // Add transmissions to the script
    if (groundContact && taxiClearance && takeoffClearance) {
      // Clear existing transmissions
      await prisma.joniScriptTransmission.deleteMany({
        where: { scriptId: trainingScript.id }
      });

      // Add new transmissions
      await prisma.joniScriptTransmission.create({
        data: {
          scriptId: trainingScript.id,
          transmissionId: groundContact.id,
          orderInScript: 1,
          actorRole: 'pilot',
          expectedDelay: 0
        }
      });

      await prisma.joniScriptTransmission.create({
        data: {
          scriptId: trainingScript.id,
          transmissionId: taxiClearance.id,
          orderInScript: 2,
          actorRole: 'ground',
          expectedDelay: 5
        }
      });

      await prisma.joniScriptTransmission.create({
        data: {
          scriptId: trainingScript.id,
          transmissionId: takeoffClearance.id,
          orderInScript: 3,
          actorRole: 'tower',
          expectedDelay: 60
        }
      });

      console.log('✅ Added transmissions to training script');
    }

    console.log('\n✅ ICAO communication blocks seeding completed successfully!');
    console.log(`📊 Created ${commBlocks.length} comm blocks`);
    console.log(`📊 Created ${transmissionTemplates.length} transmission templates`);
    console.log(`📊 Created 1 training script with transmissions`);

  } catch (error) {
    console.error('❌ Error seeding comm blocks:', error);
    throw error;
  }
}

// Run the seed function
seedCommBlocks()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });