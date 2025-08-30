import type { 
  FlightInformation, 
  ScenarioStep, 
  ScenarioType, 
  Difficulty 
} from './scenario-practice.types';

export interface ScenarioFormData {
  name: string;
  shortDescription: string;
  subjectId: string;
  groupId: string;
  scenarioType: ScenarioType;
  difficulty: Difficulty;
  estimatedMinutes: number;
  initialContext: string;
  flightInformation: FlightInformation;
  steps: ScenarioStep[];
}

export type { FlightInformation, ScenarioStep } from './scenario-practice.types';