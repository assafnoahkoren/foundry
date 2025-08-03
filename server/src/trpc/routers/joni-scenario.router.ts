import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { joniScenarioService } from '../../services/joni/joni-scenario.service';
import { joniScenarioAiService } from '../../services/joni/joni-scenario-ai.service';
import { TRPCError } from '@trpc/server';

// Middleware to check backoffice-scenario access
const requireBackofficeScenario = protectedProcedure.use(async ({ ctx, next }) => {
  const hasAccess = await ctx.userAccess.validateUserAccess(
    ctx.user.userId,
    'backoffice',
    'backoffice-scenario'
  );

  if (!hasAccess) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You do not have access to scenario management'
    });
  }

  return next({ ctx });
});

// Schema definitions
const createSubjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional()
});

const updateSubjectSchema = z.object({
  id: z.string(),
  data: z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().optional()
  })
});

const createScenarioSchema = z.object({
  name: z.string().min(1).max(200),
  shortDescription: z.string().max(150).optional(),
  subjectId: z.string(),
  groupId: z.string(),
  scenarioType: z.enum(['standard', 'emergency', 'crm', 'technical', 'weather', 'medical', 'security']).default('standard'),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).default('intermediate'),
  estimatedMinutes: z.number().int().min(1).max(120).default(15),
  initialContext: z.string().optional(),
  flightInformationJson: z.object({
    aircraft: z.object({
      type: z.string(),
      registration: z.string().optional(),
      weightCategory: z.enum(['LIGHT', 'MEDIUM', 'HEAVY', 'SUPER']).default('MEDIUM')
    }),
    callsign: z.string(),
    route: z.object({
      departure: z.string().optional(),
      destination: z.string().optional(),
      alternate: z.string().optional(),
      flightRules: z.enum(['IFR', 'VFR', 'Y', 'Z']).optional(),
      cruiseAltitude: z.string().optional()
    }).optional(),
    currentPosition: z.object({
      phase: z.enum(['ground', 'taxi', 'takeoff', 'climb', 'cruise', 'descent', 'approach', 'landing', 'go_around']),
      location: z.string().optional(),
      altitude: z.string().optional(),
      heading: z.number().int().min(0).max(360).optional(),
      speed: z.string().optional()
    }).optional(),
    weather: z.object({
      conditions: z.string().optional(),
      wind: z.string().optional(),
      visibility: z.string().optional(),
      qnh: z.string().optional()
    }).optional(),
    fuel: z.object({
      fob: z.string().optional(),
      endurance: z.string().optional()
    }).optional(),
    passengers: z.object({
      pob: z.number().int().optional(),
      specialRequirements: z.string().optional()
    }).optional()
  }),
  // Legacy fields - kept for backward compatibility but will be auto-generated
  flightInformation: z.string().optional(),
  expectedAnswer: z.string().optional(),
  currentStatus: z.string().optional()
});

const updateScenarioSchema = z.object({
  id: z.string(),
  data: z.object({
    name: z.string().min(1).max(200).optional(),
    shortDescription: z.string().max(150).optional(),
    subjectId: z.string().optional(),
    groupId: z.string().optional(),
    scenarioType: z.enum(['standard', 'emergency', 'crm', 'technical', 'weather', 'medical', 'security']).optional(),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    estimatedMinutes: z.number().int().min(1).max(120).optional(),
    initialContext: z.string().optional(),
    flightInformationJson: z.object({
      aircraft: z.object({
        type: z.string(),
        registration: z.string().optional(),
        weightCategory: z.enum(['LIGHT', 'MEDIUM', 'HEAVY', 'SUPER']).default('MEDIUM')
      }),
      callsign: z.string(),
      route: z.object({
        departure: z.string().optional(),
        destination: z.string().optional(),
        alternate: z.string().optional(),
        flightRules: z.enum(['IFR', 'VFR', 'Y', 'Z']).optional(),
        cruiseAltitude: z.string().optional()
      }).optional(),
      currentPosition: z.object({
        phase: z.enum(['ground', 'taxi', 'takeoff', 'climb', 'cruise', 'descent', 'approach', 'landing', 'go_around']),
        location: z.string().optional(),
        altitude: z.string().optional(),
        heading: z.number().int().min(0).max(360).optional(),
        speed: z.string().optional()
      }).optional(),
      weather: z.object({
        conditions: z.string().optional(),
        wind: z.string().optional(),
        visibility: z.string().optional(),
        qnh: z.string().optional()
      }).optional(),
      fuel: z.object({
        fob: z.string().optional(),
        endurance: z.string().optional()
      }).optional(),
      passengers: z.object({
        pob: z.number().int().optional(),
        specialRequirements: z.string().optional()
      }).optional()
    }).optional(),
    // Legacy fields
    flightInformation: z.string().optional(),
    expectedAnswer: z.string().optional(),
    currentStatus: z.string().optional()
  })
});

// Scenario Step schemas
const createScenarioStepSchema = z.object({
  scenarioId: z.string(),
  stepOrder: z.number().int().min(1),
  eventType: z.enum(['atc', 'crew', 'cockpit', 'emergency', 'technical', 'weather', 'company', 'passenger']),
  actorRole: z.enum([
    'clearance_delivery', 'ground', 'tower', 'departure', 'center', 'approach', 'ramp',
    'flight_attendant', 'purser', 'copilot', 'relief_pilot', 'maintenance', 'dispatch', 'doctor_onboard'
  ]).optional(),
  eventDescription: z.string().min(1),
  eventMessage: z.string().optional(),
  expectedComponents: z.array(z.object({
    component: z.string(),
    value: z.string().optional(), // DEPRECATED: Use values instead
    values: z.array(z.string()).optional(), // Array of acceptable values with OR relationship
    required: z.boolean().default(true)
  })).default([]),
  correctResponseExample: z.string().optional(),
  nextStepCondition: z.string().optional()
});

const updateScenarioStepSchema = z.object({
  id: z.string(),
  data: z.object({
    stepOrder: z.number().int().min(1).optional(),
    eventType: z.enum(['atc', 'crew', 'cockpit', 'emergency', 'technical', 'weather', 'company', 'passenger']).optional(),
    actorRole: z.enum([
      'clearance_delivery', 'ground', 'tower', 'departure', 'center', 'approach', 'ramp',
      'flight_attendant', 'purser', 'copilot', 'relief_pilot', 'maintenance', 'dispatch', 'doctor_onboard'
    ]).optional().nullable(),
    eventDescription: z.string().min(1).optional(),
    eventMessage: z.string().optional(),
    expectedComponents: z.array(z.object({
      component: z.string(),
      value: z.string().optional(), // DEPRECATED: Use values instead
      values: z.array(z.string()).optional(), // Array of acceptable values with OR relationship
      required: z.boolean().default(true)
    })).optional(),
    correctResponseExample: z.string().optional(),
    nextStepCondition: z.string().optional().nullable()
  })
});

const bulkUpdateStepOrderSchema = z.object({
  scenarioId: z.string(),
  steps: z.array(z.object({
    id: z.string(),
    stepOrder: z.number().int().min(1)
  }))
});

export const joniScenarioRouter = router({
  // ===== SUBJECTS =====
  
  createSubject: requireBackofficeScenario
    .input(createSubjectSchema)
    .mutation(async ({ input }) => {
      try {
        return await joniScenarioService.createSubject(input);
      } catch (error: any) {
        if (error.code === 'P2002') {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'A subject with this name already exists'
          });
        }
        throw error;
      }
    }),

  getAllSubjects: requireBackofficeScenario
    .query(async () => {
      return joniScenarioService.getAllSubjects();
    }),

  getSubjectById: requireBackofficeScenario
    .input(z.string())
    .query(async ({ input }) => {
      const subject = await joniScenarioService.getSubjectById(input);
      if (!subject) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Subject not found'
        });
      }
      return subject;
    }),

  updateSubject: requireBackofficeScenario
    .input(updateSubjectSchema)
    .mutation(async ({ input }) => {
      try {
        return await joniScenarioService.updateSubject(input.id, input.data);
      } catch (error: any) {
        if (error.code === 'P2002') {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'A subject with this name already exists'
          });
        }
        if (error.code === 'P2025') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Subject not found'
          });
        }
        throw error;
      }
    }),

  deleteSubject: requireBackofficeScenario
    .input(z.string())
    .mutation(async ({ input }) => {
      try {
        // Check if subject has any scenarios
        const scenarioCount = await joniScenarioService.getScenarioCountBySubject(input);
        if (scenarioCount > 0) {
          throw new TRPCError({
            code: 'PRECONDITION_FAILED',
            message: `Cannot delete subject with ${scenarioCount} existing scenario${scenarioCount > 1 ? 's' : ''}`
          });
        }
        return await joniScenarioService.deleteSubject(input);
      } catch (error: any) {
        if (error.code === 'PRECONDITION_FAILED') {
          throw error;
        }
        if (error.code === 'P2025') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Subject not found'
          });
        }
        throw error;
      }
    }),

  // ===== SCENARIOS =====

  createScenario: requireBackofficeScenario
    .input(createScenarioSchema)
    .mutation(async ({ input }) => {
      try {
        // Generate legacy fields from structured data if not provided
        const flightInfo = input.flightInformationJson;
        const legacyFlightInfo = input.flightInformation || 
          `Aircraft: ${flightInfo.aircraft.type} (${flightInfo.aircraft.weightCategory})
Callsign: ${flightInfo.callsign}
${flightInfo.route ? `Route: ${flightInfo.route.departure || 'N/A'} to ${flightInfo.route.destination || 'N/A'}` : ''}
${flightInfo.currentPosition ? `Current Position: ${flightInfo.currentPosition.phase.replace('_', ' ')} phase${flightInfo.currentPosition.location ? ` at ${flightInfo.currentPosition.location}` : ''}` : ''}
${flightInfo.weather ? `Weather: ${flightInfo.weather.conditions || 'Not specified'}` : ''}`;

        const legacyCurrentStatus = input.currentStatus || input.initialContext || 
          `${input.scenarioType === 'emergency' ? 'Emergency scenario' : 'Training scenario'} - ${input.difficulty} level`;
        
        const legacyExpectedAnswer = input.expectedAnswer || 
          'Pilot should respond appropriately according to the scenario steps';

        return await joniScenarioService.createScenario({
          name: input.name,
          shortDescription: input.shortDescription,
          subjectId: input.subjectId,
          groupId: input.groupId,
          scenarioType: input.scenarioType,
          difficulty: input.difficulty,
          estimatedMinutes: input.estimatedMinutes,
          initialContext: input.initialContext,
          flightInformationJson: input.flightInformationJson,
          // Legacy fields for backward compatibility
          flightInformation: legacyFlightInfo,
          expectedAnswer: legacyExpectedAnswer,
          currentStatus: legacyCurrentStatus
        });
      } catch (error: any) {
        if (error.code === 'P2003') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Subject not found'
          });
        }
        throw error;
      }
    }),

  getAllScenarios: requireBackofficeScenario
    .input(z.object({
      subjectId: z.string().optional()
    }).optional())
    .query(async ({ input }) => {
      return joniScenarioService.getAllScenarios(input?.subjectId);
    }),

  getScenarioById: requireBackofficeScenario
    .input(z.string())
    .query(async ({ input }) => {
      const scenario = await joniScenarioService.getScenarioById(input);
      if (!scenario) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Scenario not found'
        });
      }
      return scenario;
    }),

  updateScenario: requireBackofficeScenario
    .input(updateScenarioSchema)
    .mutation(async ({ input }) => {
      try {
        return await joniScenarioService.updateScenario(input.id, input.data);
      } catch (error: any) {
        if (error.code === 'P2003') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Subject not found'
          });
        }
        if (error.code === 'P2025') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Scenario not found'
          });
        }
        throw error;
      }
    }),

  updateScenarioWithSteps: requireBackofficeScenario
    .input(z.object({
      scenarioId: z.string(),
      scenario: z.object({
        name: z.string().min(1).max(200).optional(),
        shortDescription: z.string().max(150).optional(),
        subjectId: z.string().optional(),
        groupId: z.string().optional(),
        scenarioType: z.enum(['standard', 'emergency', 'crm', 'technical', 'weather', 'medical', 'security']).optional(),
        difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
        estimatedMinutes: z.number().int().min(1).max(120).optional(),
        initialContext: z.string().optional(),
        flightInformationJson: z.object({
          aircraft: z.object({
            type: z.string(),
            registration: z.string().optional(),
            weightCategory: z.enum(['LIGHT', 'MEDIUM', 'HEAVY', 'SUPER']).default('MEDIUM')
          }),
          callsign: z.string(),
          route: z.object({
            departure: z.string().optional(),
            destination: z.string().optional(),
            alternate: z.string().optional(),
            flightRules: z.enum(['IFR', 'VFR', 'Y', 'Z']).optional(),
            cruiseAltitude: z.string().optional()
          }).optional(),
          currentPosition: z.object({
            phase: z.enum(['ground', 'taxi', 'takeoff', 'climb', 'cruise', 'descent', 'approach', 'landing', 'go_around']),
            location: z.string().optional(),
            altitude: z.string().optional(),
            heading: z.number().int().min(0).max(360).optional(),
            speed: z.string().optional()
          }).optional(),
          weather: z.object({
            conditions: z.string().optional(),
            wind: z.string().optional(),
            visibility: z.string().optional(),
            qnh: z.string().optional()
          }).optional(),
          fuel: z.object({
            fob: z.string().optional(),
            endurance: z.string().optional()
          }).optional(),
          passengers: z.object({
            pob: z.number().int().optional(),
            specialRequirements: z.string().optional()
          }).optional()
        }).optional(),
        flightInformation: z.string().optional(),
        expectedAnswer: z.string().optional(),
        currentStatus: z.string().optional()
      }),
      steps: z.array(z.object({
        id: z.string().optional(),
        stepOrder: z.number().int().min(1),
        eventType: z.enum(['atc', 'crew', 'cockpit', 'situation', 'self_initiation', 'emergency', 'technical', 'weather', 'company', 'passenger']),
        actorRole: z.enum([
          'clearance_delivery', 'ground', 'tower', 'departure', 'center', 'approach', 'ramp',
          'flight_attendant', 'purser', 'copilot', 'relief_pilot', 'maintenance', 'dispatch', 'doctor_onboard'
        ]).optional(),
        eventDescription: z.string().min(1),
        eventMessage: z.string().optional(),
        expectedComponents: z.array(z.object({
          component: z.string(),
          value: z.string().optional(), // DEPRECATED: Use values instead
          values: z.array(z.string()).optional(), // Array of acceptable values with OR relationship
          required: z.boolean().default(true)
        })).default([]),
        correctResponseExample: z.string().optional(),
        nextStepCondition: z.string().optional()
      }))
    }))
    .mutation(async ({ input }) => {
      try {
        // Generate legacy fields if flightInformationJson is provided
        const flightInfo = input.scenario.flightInformationJson;
        const legacyFlightInfo = flightInfo && !input.scenario.flightInformation
          ? `Aircraft: ${flightInfo.aircraft.type} (${flightInfo.aircraft.weightCategory})
Callsign: ${flightInfo.callsign}
${flightInfo.route ? `Route: ${flightInfo.route.departure || 'N/A'} to ${flightInfo.route.destination || 'N/A'}` : ''}
${flightInfo.currentPosition ? `Current Position: ${flightInfo.currentPosition.phase.replace('_', ' ')} phase${flightInfo.currentPosition.location ? ` at ${flightInfo.currentPosition.location}` : ''}` : ''}
${flightInfo.weather ? `Weather: ${flightInfo.weather.conditions || 'Not specified'}` : ''}`
          : undefined;

        return await joniScenarioService.updateScenarioWithSteps(input.scenarioId, {
          scenario: {
            ...input.scenario,
            ...(legacyFlightInfo ? { flightInformation: legacyFlightInfo } : {})
          },
          steps: input.steps
        });
      } catch (error: any) {
        if (error.code === 'P2025') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Scenario not found'
          });
        }
        throw error;
      }
    }),

  deleteScenario: requireBackofficeScenario
    .input(z.string())
    .mutation(async ({ input }) => {
      try {
        await joniScenarioService.deleteScenario(input);
        return { success: true };
      } catch (error: any) {
        if (error.code === 'P2025') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Scenario not found'
          });
        }
        throw error;
      }
    }),

  // ===== STATS =====

  getScenarioStats: requireBackofficeScenario
    .input(z.string())
    .query(async ({ input }) => {
      return joniScenarioService.getScenarioStats(input);
    }),

  // ===== AI FEATURES =====

  generateShortDescription: requireBackofficeScenario
    .input(z.object({
      flightInformation: z.string(),
      currentStatus: z.string()
    }))
    .mutation(async ({ input }) => {
      try {
        const description = await joniScenarioAiService.generateShortDescription(
          input.flightInformation,
          input.currentStatus
        );
        return { description };
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to generate description'
        });
      }
    }),

  generateScenarioFromText: requireBackofficeScenario
    .input(z.object({
      description: z.string().min(10).max(10000),
      subjectId: z.string(),
      groupId: z.string().optional()
    }))
    .mutation(async ({ input }) => {
      try {
        // Get subject context
        const subject = await joniScenarioService.getSubjectById(input.subjectId);
        const subjectContext = subject ? `${subject.name}: ${subject.description || ''}` : undefined;
        
        // Generate scenario data with AI
        const generatedData = await joniScenarioAiService.generateScenarioFromText(
          input.description,
          subjectContext
        );

        // Create the scenario with steps
        const result = await joniScenarioService.createScenarioWithSteps({
          scenario: {
            name: generatedData.name,
            shortDescription: generatedData.shortDescription,
            subjectId: input.subjectId,
            groupId: input.groupId || '',
            scenarioType: generatedData.scenarioType,
            difficulty: generatedData.difficulty,
            estimatedMinutes: generatedData.estimatedMinutes,
            initialContext: generatedData.initialContext,
            flightInformationJson: generatedData.flightInformation,
            // Generate legacy fields
            flightInformation: JSON.stringify(generatedData.flightInformation),
            expectedAnswer: generatedData.steps.map(s => s.correctResponseExample || s.eventDescription).join('\n'),
            currentStatus: `${generatedData.scenarioType} scenario - ${generatedData.difficulty} level`
          },
          steps: generatedData.steps.map((step, index) => ({
            stepOrder: index + 1,
            eventType: step.eventType,
            actorRole: step.actorRole,
            eventDescription: step.eventDescription,
            eventMessage: step.eventMessage || '',
            expectedComponents: step.expectedComponents,
            correctResponseExample: step.correctResponseExample || '',
            nextStepCondition: step.nextStepCondition
          }))
        });

        return result;
      } catch (error: any) {
        console.error('Error generating scenario from text:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to generate scenario from text'
        });
      }
    }),

  // ===== SCENARIO STEPS =====

  createScenarioStep: requireBackofficeScenario
    .input(createScenarioStepSchema)
    .mutation(async ({ input }) => {
      try {
        return await joniScenarioService.createScenarioStep(input);
      } catch (error: any) {
        if (error.code === 'P2003') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Scenario not found'
          });
        }
        throw error;
      }
    }),

  getScenarioSteps: requireBackofficeScenario
    .input(z.string())
    .query(async ({ input }) => {
      return joniScenarioService.getScenarioSteps(input);
    }),

  updateScenarioStep: requireBackofficeScenario
    .input(updateScenarioStepSchema)
    .mutation(async ({ input }) => {
      try {
        return await joniScenarioService.updateScenarioStep(input.id, input.data);
      } catch (error: any) {
        if (error.code === 'P2025') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Step not found'
          });
        }
        throw error;
      }
    }),

  deleteScenarioStep: requireBackofficeScenario
    .input(z.string())
    .mutation(async ({ input }) => {
      try {
        await joniScenarioService.deleteScenarioStep(input);
        return { success: true };
      } catch (error: any) {
        if (error.code === 'P2025') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Step not found'
          });
        }
        throw error;
      }
    }),

  bulkUpdateStepOrder: requireBackofficeScenario
    .input(bulkUpdateStepOrderSchema)
    .mutation(async ({ input }) => {
      try {
        return await joniScenarioService.bulkUpdateStepOrder(input.scenarioId, input.steps);
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to update step order'
        });
      }
    }),

  // Create all steps for a scenario at once
  createScenarioWithSteps: requireBackofficeScenario
    .input(z.object({
      scenario: createScenarioSchema,
      steps: z.array(z.object({
        stepOrder: z.number().int().min(1),
        eventType: z.enum(['atc', 'crew', 'cockpit', 'situation', 'self_initiation', 'emergency', 'technical', 'weather', 'company', 'passenger']),
        actorRole: z.enum([
          'clearance_delivery', 'ground', 'tower', 'departure', 'center', 'approach', 'ramp',
          'flight_attendant', 'purser', 'copilot', 'relief_pilot', 'maintenance', 'dispatch', 'doctor_onboard'
        ]).optional(),
        eventDescription: z.string().min(1),
        eventMessage: z.string().optional(),
        expectedComponents: z.array(z.object({
          component: z.string(),
          value: z.string().optional(), // DEPRECATED: Use values instead
          values: z.array(z.string()).optional(), // Array of acceptable values with OR relationship
          required: z.boolean().default(true)
        })).default([]),
        correctResponseExample: z.string().optional(),
        nextStepCondition: z.string().optional()
      }))
    }))
    .mutation(async ({ input }) => {
      try {
        // Generate legacy fields
        const flightInfo = input.scenario.flightInformationJson;
        const legacyFlightInfo = input.scenario.flightInformation || 
          `Aircraft: ${flightInfo.aircraft.type} (${flightInfo.aircraft.weightCategory})
Callsign: ${flightInfo.callsign}
${flightInfo.route ? `Route: ${flightInfo.route.departure || 'N/A'} to ${flightInfo.route.destination || 'N/A'}` : ''}
${flightInfo.currentPosition ? `Current Position: ${flightInfo.currentPosition.phase.replace('_', ' ')} phase${flightInfo.currentPosition.location ? ` at ${flightInfo.currentPosition.location}` : ''}` : ''}
${flightInfo.weather ? `Weather: ${flightInfo.weather.conditions || 'Not specified'}` : ''}`;

        const legacyCurrentStatus = input.scenario.currentStatus || input.scenario.initialContext || 
          `${input.scenario.scenarioType === 'emergency' ? 'Emergency scenario' : 'Training scenario'} - ${input.scenario.difficulty} level`;
        
        const legacyExpectedAnswer = input.scenario.expectedAnswer || 
          'Pilot should respond appropriately according to the scenario steps';

        // Create scenario with steps
        return await joniScenarioService.createScenarioWithSteps({
          scenario: {
            ...input.scenario,
            flightInformation: legacyFlightInfo,
            expectedAnswer: legacyExpectedAnswer,
            currentStatus: legacyCurrentStatus
          },
          steps: input.steps
        });
      } catch (error: any) {
        if (error.code === 'P2003') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Subject not found'
          });
        }
        throw error;
      }
    }),

  // ===== RESPONSE EVALUATION =====

  evaluateResponse: protectedProcedure
    .input(z.object({
      userResponse: z.string(),
      stepId: z.string(),
      practiceId: z.string().optional()
    }))
    .mutation(async ({ input, ctx: _ctx }) => {
      try {
        // Get the step details
        const step = await joniScenarioService.getScenarioStep(input.stepId);
        if (!step) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Step not found'
          });
        }

        // Evaluate the response using AI
        const evaluation = await joniScenarioAiService.evaluateResponse(
          input.userResponse,
          step.correctResponseExample,
          step.expectedComponents as any,
          step.eventType,
          step.eventMessage
        );

        // If practiceId is provided, save the response to the practice session
        if (input.practiceId) {
          await joniScenarioService.saveStepResponse({
            practiceId: input.practiceId,
            stepId: input.stepId,
            userResponse: input.userResponse,
            responseAnalysis: evaluation,
            correctness: evaluation.score
          });
        }

        return evaluation;
      } catch (error: any) {
        console.error('Error evaluating response:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to evaluate response'
        });
      }
    })
});