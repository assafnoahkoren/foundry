import { openAiService } from '../ai/openai.service';

export interface JoniScenarioData {
  flightInformation: Record<string, unknown>;
  expectedAnswer: Record<string, unknown>;
  currentStatus: string;
}

export class JoniScenarioAiService {
  async generateScenarioFromText(
    description: string,
    subjectContext?: string
  ): Promise<JoniScenarioData> {
    try {
      const prompt = `You are an AI assistant helping to create training scenarios for Johnny English agents.
      
Given the following scenario description, generate a structured JSON response with the following format:
{
  "flightInformation": {
    // Key-value pairs containing relevant flight or mission information
    // This should include details like:
    // - Flight numbers, departure/arrival times, locations
    // - Mission codes, agent names, targets
    // - Equipment details, coordinates, status updates
    // - Any other relevant operational details mentioned in the description
  },
  "expectedAnswer": {
    // Key-value pairs containing the expected response or solution
    // This should include:
    // - Actions to be taken
    // - Information to be gathered
    // - Procedures to follow
    // - Expected outcomes or results
  },
  "currentStatus": "A brief status description (e.g., 'Active', 'Under Investigation', 'Pending Review', 'Classified')"
}

${subjectContext ? `Subject Context: ${subjectContext}\n` : ''}
Scenario Description: ${description}

Important:
- Extract all relevant details from the description
- Use clear, descriptive keys in the JSON objects
- Ensure the currentStatus is concise but meaningful
- If the description mentions specific dates, times, locations, or codes, include them
- For spy/agent scenarios, use appropriate terminology (e.g., "target", "asset", "extraction", "surveillance")
- Return a valid JSON object with the exact structure shown above`;

      const parsedData = await openAiService.askLLMStructured<JoniScenarioData>(prompt);

      // Validate the structure
      if (!parsedData.flightInformation || typeof parsedData.flightInformation !== 'object') {
        throw new Error('Invalid flightInformation in AI response');
      }
      if (!parsedData.expectedAnswer || typeof parsedData.expectedAnswer !== 'object') {
        throw new Error('Invalid expectedAnswer in AI response');
      }
      if (!parsedData.currentStatus || typeof parsedData.currentStatus !== 'string') {
        throw new Error('Invalid currentStatus in AI response');
      }

      return parsedData;
    } catch (error) {
      console.error('Error generating scenario from text:', error);
      
      if (error instanceof Error) {
        throw new Error(`Failed to generate scenario: ${error.message}`);
      }
      
      throw new Error('Failed to generate scenario from text');
    }
  }

  async enrichScenarioData(
    existingData: Partial<JoniScenarioData>,
    additionalContext: string
  ): Promise<JoniScenarioData> {
    try {
      const prompt = `You are an AI assistant helping to enrich training scenarios for Johnny English agents.

Given the existing scenario data and additional context, enhance and complete the scenario data.

Existing Data:
${JSON.stringify(existingData, null, 2)}

Additional Context: ${additionalContext}

Generate an enhanced JSON response with the same structure:
{
  "flightInformation": { ... },
  "expectedAnswer": { ... },
  "currentStatus": "..."
}

Important:
- Preserve all existing data and add new relevant information
- Fill in any missing details based on the additional context
- Ensure consistency between all parts of the scenario
- Keep the format and structure intact
- Return a valid JSON object`;

      const parsedData = await openAiService.askLLMStructured<JoniScenarioData>(prompt);

      // Validate the structure
      if (!parsedData.flightInformation || typeof parsedData.flightInformation !== 'object') {
        throw new Error('Invalid flightInformation in AI response');
      }
      if (!parsedData.expectedAnswer || typeof parsedData.expectedAnswer !== 'object') {
        throw new Error('Invalid expectedAnswer in AI response');
      }
      if (!parsedData.currentStatus || typeof parsedData.currentStatus !== 'string') {
        throw new Error('Invalid currentStatus in AI response');
      }

      return parsedData;
    } catch (error) {
      console.error('Error enriching scenario data:', error);
      
      if (error instanceof Error) {
        throw new Error(`Failed to enrich scenario: ${error.message}`);
      }
      
      throw new Error('Failed to enrich scenario data');
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