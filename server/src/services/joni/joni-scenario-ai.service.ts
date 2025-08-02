import { openAiService } from '../ai/openai.service';

export interface GeneratedScenarioData {
  name: string;
  shortDescription: string;
  scenarioType: 'standard' | 'emergency' | 'crm' | 'technical' | 'weather' | 'medical' | 'security';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedMinutes: number;
  initialContext: string;
  flightInformation: {
    aircraft: {
      type: string;
      registration?: string;
      weightCategory: 'LIGHT' | 'MEDIUM' | 'HEAVY' | 'SUPER';
    };
    callsign: string;
    route?: {
      departure?: string;
      destination?: string;
      alternate?: string;
      flightRules?: 'IFR' | 'VFR' | 'Y' | 'Z';
      cruiseAltitude?: string;
    };
    currentPosition?: {
      phase: 'ground' | 'taxi' | 'takeoff' | 'climb' | 'cruise' | 'descent' | 'approach' | 'landing' | 'go_around';
      location?: string;
      altitude?: string;
      heading?: number;
      speed?: string;
    };
    weather?: {
      conditions?: string;
      wind?: string;
      visibility?: string;
      qnh?: string;
    };
    fuel?: {
      fob?: string;
      endurance?: string;
    };
    passengers?: {
      pob?: number;
      specialRequirements?: string;
    };
  };
  steps: Array<{
    eventType: 'atc' | 'crew' | 'cockpit' | 'emergency' | 'technical' | 'weather' | 'company' | 'passenger';
    actorRole?: 'clearance_delivery' | 'ground' | 'tower' | 'departure' | 'center' | 'approach' | 'ramp' | 
                 'flight_attendant' | 'purser' | 'copilot' | 'relief_pilot' | 'maintenance' | 'dispatch' | 'doctor_onboard';
    eventDescription: string;
    eventMessage?: string;
    expectedComponents: Array<{
      component: string;
      required: boolean;
    }>;
    correctResponseExample?: string;
    nextStepCondition?: string;
  }>;
}

export interface JoniScenarioData {
  flightInformation: Record<string, unknown>;
  expectedAnswer: Record<string, unknown>;
  currentStatus: string;
}

export class JoniScenarioAiService {
  async generateScenarioFromText(
    description: string,
    subjectContext?: string
  ): Promise<GeneratedScenarioData> {
    try {
      const prompt = `You are an AI assistant specialized in creating aviation radiotelephony training scenarios.

Given a description, generate a complete training scenario with multiple steps following this EXACT JSON structure:

{
  "name": "Brief scenario title (max 100 characters)",
  "shortDescription": "One-line summary (max 150 characters)",
  "scenarioType": "One of: standard, emergency, crm, technical, weather, medical, security",
  "difficulty": "One of: beginner, intermediate, advanced",
  "estimatedMinutes": 15,
  "initialContext": "Background information the pilot should know before starting",
  "flightInformation": {
    "aircraft": {
      "type": "e.g., B737-800, A320, C172",
      "registration": "e.g., G-ABCD (optional)",
      "weightCategory": "One of: LIGHT, MEDIUM, HEAVY, SUPER"
    },
    "callsign": "e.g., BAW123, N12345",
    "route": {
      "departure": "ICAO code, e.g., EGLL",
      "destination": "ICAO code, e.g., LFPG",
      "alternate": "ICAO code (optional)",
      "flightRules": "One of: IFR, VFR, Y, Z (optional)",
      "cruiseAltitude": "e.g., FL350, 5500ft (optional)"
    },
    "currentPosition": {
      "phase": "One of: ground, taxi, takeoff, climb, cruise, descent, approach, landing, go_around",
      "location": "e.g., Hold short runway 27L (optional)",
      "altitude": "e.g., 2500ft, FL100 (optional)",
      "heading": 270,
      "speed": "e.g., 250kts (optional)"
    },
    "weather": {
      "conditions": "e.g., IMC, few clouds at 2500ft",
      "wind": "e.g., 270/15",
      "visibility": "e.g., 10km, 3000m",
      "qnh": "e.g., 1013"
    },
    "fuel": {
      "fob": "e.g., 5400kg (optional)",
      "endurance": "e.g., 3:45 (optional)"
    },
    "passengers": {
      "pob": 150,
      "specialRequirements": "e.g., medical emergency onboard (optional)"
    }
  },
  "steps": [
    {
      "eventType": "One of: atc, crew, cockpit, emergency, technical, weather, company, passenger",
      "actorRole": "For atc: clearance_delivery, ground, tower, departure, center, approach, ramp; For crew: flight_attendant, purser; For cockpit: copilot, relief_pilot; For technical: maintenance; For company: dispatch; For passenger: doctor_onboard",
      "eventDescription": "What happens in this step",
      "eventMessage": "The actual radio call or message (optional)",
      "expectedComponents": [
        {
          "component": "e.g., callsign, altitude, heading, acknowledgment",
          "required": true
        }
      ],
      "correctResponseExample": "Example of correct pilot response (optional)",
      "nextStepCondition": "Condition for next step (optional)"
    }
  ]
}

${subjectContext ? `Subject Context: ${subjectContext}\n` : ''}
Scenario Description: ${description}

Important Guidelines:
1. Generate 3-7 realistic scenario steps that build a coherent training exercise
2. Include appropriate ATC communications, following standard phraseology
3. For emergency scenarios, include progressive complications
4. Ensure difficulty matches the complexity of steps
5. Use realistic callsigns, locations, and aviation terminology
6. Include a mix of routine and challenging communications
7. Expected components should reflect standard radiotelephony requirements
8. Make the scenario engaging and educational

Return ONLY the JSON object, no additional text or formatting.`;

      const response = await openAiService.askLLM(prompt);
      
      // Clean the response to ensure it's valid JSON
      const cleanedResponse = response.trim();
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }

      const parsedData = JSON.parse(jsonMatch[0]) as GeneratedScenarioData;

      // Validate the structure
      this.validateGeneratedScenario(parsedData);

      return parsedData;
    } catch (error) {
      console.error('Error generating scenario from text:', error);
      
      if (error instanceof Error) {
        throw new Error(`Failed to generate scenario: ${error.message}`);
      }
      
      throw new Error('Failed to generate scenario from text');
    }
  }

  private validateGeneratedScenario(data: any): asserts data is GeneratedScenarioData {
    if (!data.name || typeof data.name !== 'string') {
      throw new Error('Invalid or missing scenario name');
    }
    if (!data.shortDescription || typeof data.shortDescription !== 'string') {
      throw new Error('Invalid or missing short description');
    }
    if (!['standard', 'emergency', 'crm', 'technical', 'weather', 'medical', 'security'].includes(data.scenarioType)) {
      throw new Error('Invalid scenario type');
    }
    if (!['beginner', 'intermediate', 'advanced'].includes(data.difficulty)) {
      throw new Error('Invalid difficulty level');
    }
    if (!data.estimatedMinutes || typeof data.estimatedMinutes !== 'number') {
      throw new Error('Invalid or missing estimated minutes');
    }
    if (!data.flightInformation || typeof data.flightInformation !== 'object') {
      throw new Error('Invalid or missing flight information');
    }
    if (!data.flightInformation.aircraft || !data.flightInformation.callsign) {
      throw new Error('Invalid aircraft or callsign information');
    }
    if (!Array.isArray(data.steps) || data.steps.length === 0) {
      throw new Error('Invalid or empty steps array');
    }
    
    // Validate each step
    const validEventTypes = ['atc', 'crew', 'cockpit', 'emergency', 'technical', 'weather', 'company', 'passenger'];
    for (const step of data.steps) {
      if (!validEventTypes.includes(step.eventType)) {
        throw new Error(`Invalid event type: ${step.eventType}`);
      }
      if (!step.eventDescription) {
        throw new Error('Missing event description in step');
      }
      if (!Array.isArray(step.expectedComponents)) {
        step.expectedComponents = [];
      }
    }
  }

  async generateShortDescription(
    flightInformation: string,
    currentStatus: string
  ): Promise<string> {
    try {
      const prompt = `You are an AI assistant helping to create concise descriptions for aviation training scenarios.

Given the following flight information and current status, generate a short, clear description (1-2 sentences) that summarizes the key aspects of this scenario.

Flight Information:
${flightInformation}

Current Status:
${currentStatus}

Generate a short description that:
- Captures the essence of the scenario
- Is clear and concise (maximum 150 characters)
- Uses professional aviation terminology
- Focuses on the most critical information
- Is suitable for quick identification in a list view

Return only the description text, no quotes or additional formatting.`;

      const response = await openAiService.askLLM(prompt);
      
      // Trim and ensure it's not too long
      const description = response.trim().substring(0, 150);
      
      if (!description) {
        throw new Error('Generated description is empty');
      }
      
      return description;
    } catch (error) {
      console.error('Error generating short description:', error);
      
      if (error instanceof Error) {
        throw new Error(`Failed to generate description: ${error.message}`);
      }
      
      throw new Error('Failed to generate short description');
    }
  }
}

// Export a singleton instance
export const joniScenarioAiService = new JoniScenarioAiService();