import { openAiService } from '../ai/openai.service';

// Local type definition to match the ExpectedComponent from frontend
interface ExpectedComponent {
  component: string;
  value?: string; // DEPRECATED: Use values array instead
  values?: string[]; // Array of acceptable values with OR relationship
  required: boolean;
  description?: string;
}

export interface ResponseEvaluationItem {
  type: 'correct' | 'wrong' | 'warning';
  title: string;
  description: string;
}

export interface ResponseEvaluationResult {
  score: number; // 0-10
  items: ResponseEvaluationItem[];
  feedback: string;
  missingComponents: string[];
  incorrectComponents: string[];
  extraComponents: string[];
}

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
      "eventType": "One of: atc, crew, cockpit, situation, self_initiation, emergency, technical, weather, company, passenger",
      "actorRole": "For atc: clearance_delivery, ground, tower, departure, center, approach, ramp; For crew: flight_attendant, purser; For cockpit: copilot, relief_pilot; For technical: maintenance; For company: dispatch; For passenger: doctor_onboard; For situation/self_initiation: leave null",
      "eventDescription": "What happens in this step (for situation/self_initiation: describe what the pilot needs to do)",
      "eventMessage": "The actual radio call or message (REQUIRED for atc, crew, cockpit, emergency, technical, weather, company, passenger. MUST be empty for situation/self_initiation)",
      "expectedComponents": [
        {
          "component": "Component name (see ICAO components list below)",
          "values": ["array", "of", "acceptable", "values"], // Include variations when appropriate
          "required": true or false
        },
        // Example with multiple values (when variations are common):
        {
          "component": "altitude",
          "values": ["6000", "SIX THOUSAND"],
          "required": true
        },
        // Example with single value (when only one format is standard):
        {
          "component": "squawk_code",
          "values": ["1234"],
          "required": true
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
2. CRITICAL STEP STRUCTURE:
   - Each step represents ONE complete exchange (incoming message + pilot response)
   - For communication steps: eventMessage = what the actor says TO the pilot, correctResponseExample = what the pilot should respond
   - For self_initiation steps: eventMessage = empty, correctResponseExample = what the pilot initiates
   - DO NOT create separate steps for actor message and pilot response - they belong in ONE step
3. ANALYZE THE SCENARIO DESCRIPTION CAREFULLY:
   - If the scenario shows the pilot speaking first (e.g., "Pilot: 'Tel Aviv Clearance...'"), the FIRST step MUST be a self_initiation step
   - Look for phrases like "First contact" or pilot-initiated requests in the description
4. Include "situation" or "self_initiation" type steps where the pilot must initiate communication:
   - First contact for clearance requests (VERY COMMON - pilot always initiates)
   - Ready for pushback/start/taxi
   - Request for takeoff
   - Position reports
   - Request for descent/approach
   - Any pilot-initiated requests
5. For "situation" or "self_initiation" steps:
   - Set eventType to "self_initiation" (preferred) or "situation"
   - Set actorRole to null
   - Leave eventMessage empty (CRITICAL: no message for pilot-initiated steps)
   - eventDescription should explain what the pilot needs to do
   - correctResponseExample should show the pilot's radio call
6. For ALL OTHER event types (atc, crew, cockpit, emergency, etc.):
   - eventMessage is REQUIRED - must contain the actual transmission/dialogue
   - Example for ATC: "EL AL 321 Heavy, cleared to London Heathrow via PURLA 1A departure..."
   - Example for crew: "Captain, we have a medical emergency in row 23"
   - The eventMessage is what the actor says TO the pilot
   - correctResponseExample is ALWAYS what the pilot responds
7. EXAMPLE OF CORRECT STEP STRUCTURE:
   Step 1 (self_initiation): 
     - eventMessage: "" 
     - correctResponseExample: "Tel Aviv Clearance, EL AL 321 Heavy, stand B4, request IFR clearance to London Heathrow"
   Step 2 (atc): 
     - eventMessage: "EL AL 321 Heavy, cleared to London Heathrow via PURLA 1A..."
     - correctResponseExample: "Cleared to London Heathrow via PURLA 1A, climb 6000 feet..."
8. Follow ICAO standard phraseology EXACTLY - use capitals for emphasized words
9. For each step, choose 2-5 relevant expectedComponents from the list above
10. IMPORTANT FEATURE - Multiple Acceptable Values: The system supports multiple correct variations for each component. When appropriate, include multiple VALUES in the array to accept different valid variations that pilots might realistically use:
   - For numeric values where pilots commonly use different formats, include variations:
     * Altitude: could include ["5000", "FIVE THOUSAND"] if both are commonly used
     * Flight level: could include ["FL350", "FL THREE FIVE ZERO"] for flexibility
     * Heading: could include ["090", "ZERO NINE ZERO"] if appropriate
     * Frequency: could include ["121.5", "ONE TWO ONE DECIMAL FIVE"]
   - For callsigns with known variations (e.g., airline callsigns like BAW/SPEEDBIRD)
   - For values that have standard variations in different regions or contexts
   - Use your judgment: only include variations that are realistically used and acceptable
   - For simple acknowledgments (roger, wilco) or when only one format is standard, use a single value
   - Leave values array empty for generic components without specific values
11. Mark components as required:true if they are mandatory per ICAO rules
12. Include standard words like ROGER, WILCO, AFFIRM, NEGATIVE appropriately
13. Use phonetic alphabet for letters (ALFA, BRAVO, etc.)
14. Pronounce numbers individually (TWO THREE ZERO, not two-thirty)
15. For emergency scenarios, include progressive complications
16. Ensure correctResponseExample follows exact ICAO format and includes all expected values
17. Mix communication steps (someone speaks to pilot) with situation steps (pilot initiates)
18. REMEMBER: IFR clearance requests are ALWAYS pilot-initiated (self_initiation)
19. CRITICAL: Every non-self_initiation/situation step MUST have an eventMessage with the actual dialogue
20. DO NOT create separate steps for what the pilot says - the pilot's response is ALWAYS in correctResponseExample

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
    const validEventTypes = ['atc', 'crew', 'cockpit', 'situation', 'self_initiation', 'emergency', 'technical', 'weather', 'company', 'passenger'];
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

  async evaluateResponse(
    userResponse: string,
    correctResponseExample: string,
    expectedComponents: ExpectedComponent[],
    eventType: string,
    eventMessage: string,
    enforceComponentOrder: boolean = false
  ): Promise<ResponseEvaluationResult> {
    try {
      const prompt = `You are an expert aviation communications instructor evaluating a pilot's radio response according to ICAO standards.

CONTEXT:
Event Type: ${eventType}
Message Received: "${eventMessage}"
Correct Response Example: "${correctResponseExample}"

Expected Components:
${expectedComponents.map((comp) => {
  let valueStr = '';
  if (comp.values && comp.values.length > 0) {
    valueStr = ` (acceptable values: ${comp.values.map(v => `"${v}"`).join(' OR ')})`;
  } else if (comp.value) {
    valueStr = ` (value: "${comp.value}")`;
  }
  return `- ${comp.component}${valueStr}${comp.required ? ' [REQUIRED]' : ' [OPTIONAL]'}`;
}).join('\n')}

${enforceComponentOrder ? 'ORDER ENFORCEMENT: Components must appear in the EXACT order listed above.' : ''}

USER'S RESPONSE TO EVALUATE:
"${userResponse}"

Evaluate the user's response and return ONLY a JSON object with this EXACT structure:
{
  "score": [0-10 numeric score],
  "items": [
    {
      "type": "correct" | "wrong" | "warning",
      "title": "Brief title",
      "description": "Detailed explanation"
    }
  ],
  "feedback": "Overall feedback summary",
  "missingComponents": ["list", "of", "missing", "required", "components"],
  "incorrectComponents": ["list", "of", "components", "with", "wrong", "values"],
  "extraComponents": ["list", "of", "unnecessary", "components", "added"]
}

SCORING CRITERIA:
- 10: Perfect response with all required components, correct values, and proper ICAO phraseology
- 8-9: Minor phraseology issues but all critical information correct
- 6-7: Most required components present but some errors or omissions
- 4-5: Several missing components or significant errors
- 2-3: Major errors, missing most required components
- 0-1: Completely incorrect or unintelligible response

EVALUATION FOCUS:
1. Required components MUST be present and correct
2. Component values must match exactly when specified
   - When multiple values are acceptable (shown with OR), ANY ONE of them is correct
   - Example: altitude (acceptable values: "5000" OR "FIVE THOUSAND") - either is correct
3. Component order (when ORDER ENFORCEMENT is active)
   - ALL components must appear in the EXACT order they are listed
   - Example: if the list shows "altitude, heading, callsign", they must appear in that order
   - Order is based on the order of components in the pilot's response, not the exact word position
   - This applies to ALL components in the list when order enforcement is enabled
4. ICAO phraseology standards (phonetic alphabet, number pronunciation)
5. Callsign position (usually at the end for pilot responses)
6. Readback accuracy for clearances, altitudes, headings, frequencies
7. No extra or confusing information

EVALUATION ITEM TYPES:
- "correct": Things done correctly (e.g., "Correct callsign placement", "Proper readback of altitude")
- "wrong": Critical errors that must be fixed (e.g., "Missing required callsign", "Incorrect altitude readback")
- "warning": Minor issues or suggestions (e.g., "Non-standard phraseology used", "Could be more concise")

IMPORTANT: Include BOTH positive feedback (correct items) AND negative feedback (wrong/warning items).
For a perfect response, still list what was done correctly.
Aim for 3-8 items total, mixing correct/wrong/warning as appropriate.

COMMON THINGS TO EVALUATE:
CORRECT:
- Callsign included and positioned correctly
- All required components present
- Proper ICAO phraseology used
- Accurate readback of critical information
- Clear and concise communication

WRONG:
- Missing required components
- Incorrect values for critical information
- Components in wrong order when order is enforced
- Major phraseology errors
- Safety-critical mistakes

WARNING:
- Minor phraseology variations
- Slightly non-standard but acceptable phrasing
- Extra information that doesn't harm clarity
- Opportunities for improvement

Return ONLY valid JSON without any markdown formatting or explanatory text.`;

      const response = await openAiService.askLLM(prompt);
      
      // Clean and parse the response
      let cleanedResponse = response.trim();
      
      // Try to extract JSON from the response
      const codeBlockMatch = cleanedResponse.match(/```json?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        cleanedResponse = codeBlockMatch[1].trim();
      }
      
      // Remove any trailing commas before closing braces/brackets
      cleanedResponse = cleanedResponse.replace(/,(\s*[}\]])/g, '$1');
      
      // Try to find the first complete JSON object
      const startIndex = cleanedResponse.indexOf('{');
      const endIndex = cleanedResponse.lastIndexOf('}');
      if (startIndex >= 0 && endIndex > startIndex) {
        cleanedResponse = cleanedResponse.substring(startIndex, endIndex + 1);
      }
      
      let evaluationResult: ResponseEvaluationResult;
      try {
        const parsed = JSON.parse(cleanedResponse);
        
        // Validate and ensure correct structure
        evaluationResult = {
          score: typeof parsed.score === 'number' ? Math.min(10, Math.max(0, parsed.score)) : 0,
          items: Array.isArray(parsed.items) ? parsed.items : [],
          feedback: parsed.feedback || 'No feedback provided',
          missingComponents: Array.isArray(parsed.missingComponents) ? parsed.missingComponents : [],
          incorrectComponents: Array.isArray(parsed.incorrectComponents) ? parsed.incorrectComponents : [],
          extraComponents: Array.isArray(parsed.extraComponents) ? parsed.extraComponents : []
        };
        
        // Validate items structure and type
        evaluationResult.items = evaluationResult.items.filter(item => 
          item && 
          typeof item.title === 'string' && 
          typeof item.description === 'string' &&
          ['correct', 'wrong', 'warning'].includes(item.type)
        );
        
      } catch (parseError) {
        console.error('Failed to parse evaluation response:', parseError);
        console.error('Attempted to parse:', cleanedResponse);
        
        // Return a default evaluation on parse error
        return {
          score: 0,
          items: [{
            type: 'wrong',
            title: 'Evaluation Error',
            description: 'Failed to properly evaluate the response. Please try again.'
          }],
          feedback: 'Unable to evaluate response due to technical error',
          missingComponents: [],
          incorrectComponents: [],
          extraComponents: []
        };
      }
      
      return evaluationResult;
      
    } catch (error) {
      console.error('Error evaluating response:', error);
      
      throw new Error(`Failed to evaluate response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Export a singleton instance
export const joniScenarioAiService = new JoniScenarioAiService();