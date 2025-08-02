// Types for Joni Scenario Practice feature

export interface FlightInformation {
  aircraft: {
    type: string; // e.g., "Boeing 787-9"
    registration?: string;
    weightCategory?: "LIGHT" | "MEDIUM" | "HEAVY" | "SUPER";
  };
  callsign: string; // e.g., "EL AL 321 Heavy"
  route?: {
    departure: string;
    destination: string;
    alternate?: string;
  };
  currentPosition?: {
    phase: "preflight" | "taxi" | "takeoff" | "climb" | "cruise" | "descent" | "approach" | "landing" | "taxi_in";
    location?: string; // e.g., "Stand B4", "FL350", "120nm west of Shannon"
    altitude?: string;
    heading?: number;
  };
  weather?: {
    conditions: string; // e.g., "CAVOK", "IMC"
    wind?: string; // e.g., "270/08"
    visibility?: string;
    qnh?: number;
  };
  atis?: string; // e.g., "Information Alpha"
  fuel?: {
    remaining: string; // e.g., "4 hours"
    endurance?: string;
  };
  soulsOnBoard?: number;
}

export type EventType = 
  | "atc"           // ATC communication
  | "crew"          // Cabin crew interaction
  | "cockpit"       // Co-pilot or other cockpit crew
  | "emergency"     // Emergency situation
  | "technical"     // Technical issue
  | "weather"       // Weather-related event
  | "company"       // Company/dispatch communication
  | "passenger";    // Passenger-related issue

export type ActorRole = 
  // ATC roles
  | "clearance_delivery"
  | "ground"
  | "tower"
  | "departure"
  | "center"
  | "approach"
  | "ramp"
  // Crew roles
  | "flight_attendant"
  | "purser"
  | "copilot"
  | "relief_pilot"
  // Others
  | "dispatch"
  | "maintenance"
  | "doctor_onboard";

export interface ExpectedComponent {
  component: string; // e.g., "callsign", "altitude", "heading"
  value?: string; // e.g., "BAW123", "FL350", "090"
  required: boolean;
  description?: string;
}

export interface ScenarioStep {
  id: string;
  stepOrder: number;
  eventType: EventType;
  actorRole?: ActorRole;
  eventDescription: string;
  eventMessage: string;
  expectedComponents: ExpectedComponent[];
  correctResponseExample: string;
  nextStepCondition?: string; // For branching logic
}

export type ScenarioType = 
  | "standard"      // Normal operations
  | "emergency"     // Emergency procedures
  | "crm"          // Crew Resource Management
  | "technical"    // Technical failures
  | "weather"      // Weather-related scenarios
  | "medical"      // Medical emergencies
  | "security";    // Security-related scenarios

export type Difficulty = "beginner" | "intermediate" | "advanced";

export interface ScenarioPracticeSession {
  id: string;
  scenarioId: string;
  status: "in_progress" | "completed" | "abandoned";
  currentStepOrder: number;
  startedAt: Date;
  completedAt?: Date;
  totalScore?: number;
}

export interface StepResponse {
  stepId: string;
  userResponse: string;
  responseAnalysis: {
    missingComponents: string[];
    incorrectComponents: string[];
    extraComponents: string[];
    phraseologyErrors: string[];
    correctnessScore: number; // 0-10
    feedback: string;
  };
  correctness: number;
  attempts: number;
}

export type GroupType = 
  | "module"           // Learning modules (e.g., "Basic Communications")
  | "difficulty"       // Grouped by difficulty level
  | "training_program" // Specific training programs (PPL, ATPL)
  | "category";        // General categories

export interface ScenarioGroup {
  id: string;
  name: string;
  description?: string;
  groupType: GroupType;
  orderInSubject: number;
}