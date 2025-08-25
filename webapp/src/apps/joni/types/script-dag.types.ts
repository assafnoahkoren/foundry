import { z } from 'zod';

// ============= Node Content Types =============

// Reference to existing transmission template
const TransmissionRefSchema = z.object({
  type: z.literal('transmission_ref'),
  transmissionId: z.string(),
  actorRole: z.enum(['pilot', 'tower', 'ground', 'approach', 'departure', 'center']),
  variables: z.record(z.string()).optional()
});

// Reference to existing comm block
const CommBlockRefSchema = z.object({
  type: z.literal('comm_block_ref'),
  blockId: z.string(),
  expectedResponse: z.string()
});

// Inline event (weather, technical, medical, etc.)
const EventContentSchema = z.object({
  type: z.literal('event'),
  category: z.enum(['weather', 'technical', 'medical', 'operational', 'security']),
  severity: z.enum(['info', 'caution', 'warning', 'emergency']),
  title: z.string(),
  details: z.string(),
  requiredAction: z.string().optional()
});

// Crew interaction
const CrewMessageSchema = z.object({
  type: z.literal('crew_message'),
  speaker: z.enum(['captain', 'first_officer', 'flight_attendant', 'ground_crew']),
  message: z.string(),
  urgency: z.enum(['routine', 'important', 'urgent', 'emergency'])
});

// System alert
const SystemAlertSchema = z.object({
  type: z.literal('system_alert'),
  system: z.string(),
  alertType: z.enum(['advisory', 'caution', 'warning']),
  message: z.string(),
  checklist: z.string().optional()
});

// Decision point
const DecisionPointSchema = z.object({
  type: z.literal('decision_point'),
  question: z.string(),
  context: z.string().optional(),
  options: z.array(z.object({
    label: z.string(),
    value: z.string()
  }))
});

// User response node - waits for user transmission
const UserResponseSchema = z.object({
  type: z.literal('user_response'),
  transmissionId: z.string().optional(), // Reference to expected transmission template
  timeoutSeconds: z.number().optional()
});

// Union of all content types
const NodeContentSchema = z.discriminatedUnion('type', [
  TransmissionRefSchema,
  CommBlockRefSchema,
  EventContentSchema,
  CrewMessageSchema,
  SystemAlertSchema,
  DecisionPointSchema,
  UserResponseSchema
]);

// ============= Expected Response Types =============

const ExpectedResponseSchema = z.object({
  type: z.enum(['transmission', 'action', 'decision', 'acknowledgment']),
  acceptableResponses: z.array(z.union([
    z.string(),
    z.object({ transmissionId: z.string() }),
    z.object({ keywords: z.array(z.string()) }),
    z.object({ pattern: z.string() })
  ])),
  scoringCriteria: z.object({
    accuracy: z.number().min(0).max(1).optional(),
    timeliness: z.number().min(0).max(1).optional(),
    phraseology: z.number().min(0).max(1).optional()
  }).optional()
});

// ============= Script Node =============

const ScriptNodeSchema = z.object({
  id: z.string(),
  type: z.enum(['transmission', 'event', 'crew_interaction', 'system_alert', 'decision_point', 'user_response']),
  name: z.string(),
  description: z.string().optional(),
  
  position: z.object({
    x: z.number(),
    y: z.number()
  }).optional(),
  
  content: NodeContentSchema,
  expectedResponse: ExpectedResponseSchema.optional(),
  
  timeLimit: z.number().optional(),
  minimumDelay: z.number().optional(),
  
  tags: z.array(z.string()).optional(),
  hints: z.array(z.string()).optional(),
  feedback: z.object({
    correct: z.string(),
    incorrect: z.string(),
    timeout: z.string()
  }).optional()
});

// ============= Edge Conditions =============

const DefaultConditionSchema = z.object({
  type: z.literal('default'),
  priority: z.number().default(0)
});

const ScoreConditionSchema = z.object({
  type: z.literal('score'),
  minScore: z.number().min(0).max(100),
  priority: z.number().default(1)
});

const KeywordConditionSchema = z.object({
  type: z.literal('keyword'),
  keywords: z.array(z.string()),
  matchType: z.enum(['any', 'all']).default('any'),
  priority: z.number().default(1)
});

const ExactMatchConditionSchema = z.object({
  type: z.literal('exact_match'),
  value: z.string(),
  caseSensitive: z.boolean().default(false),
  priority: z.number().default(2)
});

const TimeoutConditionSchema = z.object({
  type: z.literal('timeout'),
  afterSeconds: z.number(),
  priority: z.number().default(0)
});

const DecisionConditionSchema = z.object({
  type: z.literal('decision'),
  choice: z.string(),
  priority: z.number().default(1)
});

// Validation result conditions for user responses
const ValidationPassSchema = z.object({
  type: z.literal('validation_pass'),
  priority: z.number().default(1)
});

const ValidationFailSchema = z.object({
  type: z.literal('validation_fail'),
  priority: z.number().default(1)
});

const RetrySchema = z.object({
  type: z.literal('retry'),
  priority: z.number().default(1)
});

const EdgeConditionSchema = z.discriminatedUnion('type', [
  DefaultConditionSchema,
  ScoreConditionSchema,
  KeywordConditionSchema,
  ExactMatchConditionSchema,
  TimeoutConditionSchema,
  DecisionConditionSchema,
  ValidationPassSchema,
  ValidationFailSchema,
  RetrySchema
]);

// ============= Script Edge =============

const ScriptEdgeSchema = z.object({
  id: z.string().optional(),
  from: z.string(),
  to: z.string(),
  condition: EdgeConditionSchema,
  label: z.string().optional(),
  feedback: z.string().optional(),
  
  style: z.object({
    animated: z.boolean().optional(),
    stroke: z.string().optional(),
    strokeWidth: z.number().optional()
  }).optional()
});

// ============= Complete DAG Structure =============

export const ScriptDAGSchema = z.object({
  nodes: z.array(ScriptNodeSchema),
  edges: z.array(ScriptEdgeSchema),
  
  metadata: z.object({
    version: z.string().default('1.0.0'),
    totalPaths: z.number().optional(),
    optimalPath: z.array(z.string()).optional(),
    expectedDuration: z.number().optional(),
    createdBy: z.string().optional(),
    lastModified: z.string().optional()
  }).optional(),
  
  layout: z.object({
    type: z.enum(['manual', 'auto']).default('manual'),
    direction: z.enum(['TB', 'LR']).default('TB'),
    spacing: z.object({
      nodeWidth: z.number().default(200),
      nodeHeight: z.number().default(100),
      horizontalGap: z.number().default(150),
      verticalGap: z.number().default(100)
    }).optional()
  }).optional()
});

// ============= Type Exports =============

export type ScriptNode = z.infer<typeof ScriptNodeSchema>;
export type ScriptEdge = z.infer<typeof ScriptEdgeSchema>;
export type ScriptDAG = z.infer<typeof ScriptDAGSchema>;
export type NodeContent = z.infer<typeof NodeContentSchema>;
export type EdgeCondition = z.infer<typeof EdgeConditionSchema>;
export type ExpectedResponse = z.infer<typeof ExpectedResponseSchema>;

// ============= Validation Functions =============

export const validateScriptDAG = (data: unknown): ScriptDAG => {
  return ScriptDAGSchema.parse(data);
};

export const validateScriptNode = (data: unknown): ScriptNode => {
  return ScriptNodeSchema.parse(data);
};

export const validateScriptEdge = (data: unknown): ScriptEdge => {
  return ScriptEdgeSchema.parse(data);
};