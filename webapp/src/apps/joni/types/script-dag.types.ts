// ============= Node Content Types =============

// Reference to existing transmission template
interface TransmissionRef {
  type: 'transmission_ref';
  transmissionId: string;
  actorRole: 'pilot' | 'tower' | 'ground' | 'approach' | 'departure' | 'center';
  variables?: Record<string, string>;
}

// Reference to existing comm block
interface CommBlockRef {
  type: 'comm_block_ref';
  blockId: string;
  expectedResponse: string;
}

// Inline event (weather, technical, medical, etc.)
interface EventContent {
  type: 'event';
  category: 'weather' | 'technical' | 'medical' | 'operational' | 'security';
  severity: 'info' | 'caution' | 'warning' | 'emergency';
  title: string;
  details: string;
  requiredAction?: string;
}

// Crew interaction
interface CrewMessage {
  type: 'crew_message';
  speaker: 'captain' | 'first_officer' | 'flight_attendant' | 'ground_crew';
  message: string;
  urgency: 'routine' | 'important' | 'urgent' | 'emergency';
}

// System alert
interface SystemAlert {
  type: 'system_alert';
  system: string;
  alertType: 'advisory' | 'caution' | 'warning';
  message: string;
  checklist?: string;
}

// Decision point
interface DecisionPoint {
  type: 'decision_point';
  question: string;
  context?: string;
  options: Array<{
    label: string;
    value: string;
  }>;
}

// User response node - waits for user transmission
interface UserResponse {
  type: 'user_response';
  transmissionId?: string; // Reference to expected transmission template
  variables?: Record<string, string>; // Variable values for comm blocks
  timeoutSeconds?: number;
}

// Situation node - describes a general situation
interface Situation {
  type: 'situation';
  description: string;
  title?: string;
}

// Union of all content types
export type NodeContent = 
  | TransmissionRef
  | CommBlockRef
  | EventContent
  | CrewMessage
  | SystemAlert
  | DecisionPoint
  | UserResponse
  | Situation;

// ============= Expected Response Types =============

export interface ExpectedResponse {
  type: 'transmission' | 'action' | 'decision' | 'acknowledgment';
  acceptableResponses: Array<
    | string
    | { transmissionId: string }
    | { keywords: string[] }
    | { pattern: string }
  >;
  scoringCriteria?: {
    accuracy?: number;
    timeliness?: number;
    phraseology?: number;
  };
}

// ============= Script Node =============

export interface ScriptNode {
  id: string;
  type: 'transmission' | 'event' | 'crew_interaction' | 'system_alert' | 'decision_point' | 'user_response' | 'situation';
  name: string;
  description?: string;
  
  position?: {
    x: number;
    y: number;
  };
  
  content?: NodeContent;
  expectedResponse?: ExpectedResponse;
  
  timeLimit?: number;
  minimumDelay?: number;
  
  tags?: string[];
  hints?: string[];
  feedback?: {
    correct: string;
    incorrect: string;
    timeout: string;
  };
}

// ============= Edge Conditions =============

interface DefaultCondition {
  type: 'default';
  priority?: number;
}

interface ScoreCondition {
  type: 'score';
  minScore: number;
  priority?: number;
}

interface KeywordCondition {
  type: 'keyword';
  keywords: string[];
  matchType?: 'any' | 'all';
  priority?: number;
}

interface ExactMatchCondition {
  type: 'exact_match';
  value: string;
  caseSensitive?: boolean;
  priority?: number;
}

interface TimeoutCondition {
  type: 'timeout';
  afterSeconds: number;
  priority?: number;
}

interface DecisionCondition {
  type: 'decision';
  choice: string;
  priority?: number;
}

// Validation result conditions for user responses
interface ValidationPass {
  type: 'validation_pass';
  priority?: number;
}

interface ValidationFail {
  type: 'validation_fail';
  priority?: number;
}

interface Retry {
  type: 'retry';
  priority?: number;
}

export type EdgeCondition = 
  | DefaultCondition
  | ScoreCondition
  | KeywordCondition
  | ExactMatchCondition
  | TimeoutCondition
  | DecisionCondition
  | ValidationPass
  | ValidationFail
  | Retry;

// ============= Script Edge =============

export interface ScriptEdge {
  id?: string;
  from: string;
  to: string;
  condition: EdgeCondition;
  label?: string;
  feedback?: string;
  
  style?: {
    animated?: boolean;
    stroke?: string;
    strokeWidth?: number;
  };
}

// ============= Complete DAG Structure =============

export interface ScriptDAG {
  nodes: ScriptNode[];
  edges: ScriptEdge[];
  
  globalVariables?: Record<string, string>; // Global variables for the entire script
  
  metadata?: {
    version?: string;
    totalPaths?: number;
    optimalPath?: string[];
    expectedDuration?: number;
    createdBy?: string;
    lastModified?: string;
  };
  
  layout?: {
    type?: 'manual' | 'auto';
    direction?: 'TB' | 'LR';
    spacing?: {
      nodeWidth?: number;
      nodeHeight?: number;
      horizontalGap?: number;
      verticalGap?: number;
    };
  };
}