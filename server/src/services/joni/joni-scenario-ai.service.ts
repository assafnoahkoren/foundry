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
      value?: string;
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
    // Try up to 2 times in case of JSON parsing errors
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
      const prompt = `You are an AI assistant specialized in creating aviation radiotelephony training scenarios that strictly follow ICAO standards.

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
          "component": "Component name (see ICAO components list below)",
          "value": "The specific expected value for this component (optional)",
          "required": true or false
        }
      ],
      "correctResponseExample": "Example of correct pilot response following ICAO standards",
      "nextStepCondition": "Condition for next step (optional)"
    }
  ]
}

ICAO EXPECTED COMPONENTS for Radio Communications:
The expectedComponents array should include relevant items from this list based on the communication type:

BASIC COMPONENTS:
- "callsign" (required in most communications)
- "aircraft_type" (required on initial contact)
- "weight_category" (required if HEAVY or SUPER)
- "stand_number" (for ground operations)
- "atis_information" (required on initial contact)

CLEARANCE COMPONENTS:
- "departure_request" (IFR/VFR clearance)
- "destination" (required for clearances)
- "flight_level" or "altitude" (requested cruising level)
- "departure_runway" (if assigned)
- "sid" (Standard Instrument Departure)
- "squawk_code" (transponder code)

INSTRUCTION ACKNOWLEDGMENTS:
- "readback_altitude" (must read back any altitude/FL change)
- "readback_heading" (must read back heading changes)
- "readback_frequency" (must read back frequency changes)
- "readback_runway" (must read back runway assignments)
- "readback_clearance" (must read back route clearances)
- "roger" (acknowledgment without readback)
- "wilco" (will comply)

POSITION/STATUS REPORTS:
- "current_position" (waypoint or location)
- "current_level" (altitude or flight level)
- "time_over_position" (in non-radar airspace)
- "next_waypoint" (next position)
- "estimate_next" (ETA at next waypoint)

STANDARD PHRASEOLOGY:
- "affirm" (for yes)
- "negative" (for no)
- "unable" (cannot comply)
- "standby" (wait)
- "correction" (to correct an error)
- "say_again" (request repeat)

EMERGENCY COMPONENTS:
- "mayday" (3 times for distress)
- "pan_pan" (3 times for urgency)
- "nature_of_emergency" (what's wrong)
- "intentions" (what pilot plans to do)
- "souls_on_board" (number of people)
- "fuel_remaining" (in time)

NUMBERS AND VALUES:
- "heading_three_digits" (e.g., "ZERO NINE ZERO")
- "altitude_feet" (below FL180)
- "flight_level" (FL180 and above)
- "speed_knots" (airspeed)
- "qnh_setting" (altimeter setting)
- "frequency_decimal" (using DECIMAL)

${subjectContext ? `Subject Context: ${subjectContext}\n` : ''}
Scenario Description: ${description}

Important Guidelines:
1. Generate 3-7 realistic scenario steps that build a coherent training exercise
2. Follow ICAO standard phraseology EXACTLY - use capitals for emphasized words
3. For each step, choose 2-5 relevant expectedComponents from the list above
4. Include specific VALUES for components when they should match exactly:
   - For callsign: include the exact callsign (e.g., "BAW123")
   - For altitude/flight_level: include the exact level (e.g., "FL350" or "5000")
   - For heading: include the exact heading (e.g., "090")
   - For frequency: include the exact frequency (e.g., "121.5")
   - For squawk: include the exact code (e.g., "1234")
   - Leave value empty for generic acknowledgments (roger, wilco, affirm)
5. Mark components as required:true if they are mandatory per ICAO rules
6. Include standard words like ROGER, WILCO, AFFIRM, NEGATIVE appropriately
7. Use phonetic alphabet for letters (ALFA, BRAVO, etc.)
8. Pronounce numbers individually (TWO THREE ZERO, not two-thirty)
9. For emergency scenarios, include progressive complications
10. Ensure correctResponseExample follows exact ICAO format and includes all expected values

CRITICAL: Return ONLY valid JSON without any markdown formatting, code blocks, or additional text.
The response must start with { and end with } and be valid, parseable JSON.`;

      const response = await openAiService.askLLM(prompt);
      
      // Clean the response to ensure it's valid JSON
      let cleanedResponse = response.trim();
      
      // Try to extract JSON from the response
      // First, try to find JSON between code blocks
      const codeBlockMatch = cleanedResponse.match(/```json?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        cleanedResponse = codeBlockMatch[1].trim();
      }
      
      // Remove any trailing commas before closing braces/brackets (common JSON error)
      cleanedResponse = cleanedResponse.replace(/,(\s*[}\]])/g, '$1');
      
      // Remove any non-printable characters (excluding newlines and tabs)
      // eslint-disable-next-line no-control-regex
      cleanedResponse = cleanedResponse.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F-\x9F]/g, '');
      
      // Try to find the first complete JSON object
      let jsonStr = cleanedResponse;
      const startIndex = cleanedResponse.indexOf('{');
      if (startIndex >= 0) {
        // Find the matching closing brace
        let braceCount = 0;
        let endIndex = -1;
        for (let i = startIndex; i < cleanedResponse.length; i++) {
          if (cleanedResponse[i] === '{') braceCount++;
          else if (cleanedResponse[i] === '}') braceCount--;
          
          if (braceCount === 0) {
            endIndex = i;
            break;
          }
        }
        
        if (endIndex > startIndex) {
          jsonStr = cleanedResponse.substring(startIndex, endIndex + 1);
        }
      }
      
      let parsedData: GeneratedScenarioData;
      try {
        parsedData = JSON.parse(jsonStr) as GeneratedScenarioData;
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Attempted to parse:', jsonStr.substring(0, 500) + '...');
        throw new Error(`Invalid JSON in AI response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      }

      // Validate the structure
      this.validateGeneratedScenario(parsedData);

      return parsedData;
      } catch (error) {
        console.error(`Attempt ${attempt} failed:`, error);
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        // If this isn't the last attempt and it's a JSON parsing error, try again
        if (attempt < 2 && error instanceof Error && error.message.includes('JSON')) {
          console.log('Retrying due to JSON parsing error...');
          continue;
        }
        
        // Otherwise, throw immediately
        throw error;
      }
    }
    
    // If we get here, all attempts failed
    throw new Error(`Failed to generate scenario after 2 attempts: ${lastError?.message || 'Unknown error'}`);
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