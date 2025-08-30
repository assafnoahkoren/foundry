import { describe, it, expect, vi, beforeEach } from 'vitest';
import { joniScenarioAiService } from './joni-scenario-ai.service';
import { openAiService } from '../ai/openai.service';

// Mock the OpenAI service
vi.mock('../ai/openai.service', () => ({
  openAiService: {
    askLLM: vi.fn(),
    askLLMStructured: vi.fn()
  }
}));

describe('JoniScenarioAiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateScenarioFromText', () => {
    it('should generate scenario data from text description', async () => {
      const mockResponse = JSON.stringify({
        name: "Emergency Landing at EGLL",
        shortDescription: "Bird strike on approach requiring immediate action",
        scenarioType: "emergency",
        difficulty: "advanced",
        estimatedMinutes: 20,
        initialContext: "Aircraft on final approach experiences bird strike",
        flightInformation: {
          aircraft: {
            type: "B737-800",
            registration: "G-ABCD",
            weightCategory: "MEDIUM"
          },
          callsign: "BAW123",
          route: {
            departure: "LFPG",
            destination: "EGLL",
            flightRules: "IFR",
            cruiseAltitude: "FL350"
          },
          currentPosition: {
            phase: "approach",
            location: "8 miles final runway 27L",
            altitude: "2500ft",
            heading: 270,
            speed: "180kts"
          },
          weather: {
            conditions: "Few clouds at 2500ft",
            wind: "270/15",
            visibility: "10km",
            qnh: "1013"
          }
        },
        steps: [
          {
            eventType: "emergency",
            eventDescription: "Bird strike on approach",
            eventMessage: "MAYDAY MAYDAY MAYDAY, BAW123 bird strike, engine failure, going around",
            expectedComponents: [
              { component: "mayday", required: true },
              { component: "callsign", value: "BAW123", required: true },
              { component: "nature_of_emergency", value: "engine failure", required: true }
            ],
            correctResponseExample: "BAW123, roger MAYDAY, turn left heading 180, climb flight level 70",
            nextStepCondition: "After go-around initiated"
          }
        ]
      });

      vi.mocked(openAiService.askLLM).mockResolvedValue(mockResponse);

      const result = await joniScenarioAiService.generateScenarioFromText(
        'Create an emergency scenario with a bird strike on approach to Heathrow',
        'Aviation radiotelephony training'
      );

      expect(result).toHaveProperty('name', 'Emergency Landing at EGLL');
      expect(result).toHaveProperty('scenarioType', 'emergency');
      expect(result).toHaveProperty('difficulty', 'advanced');
      expect(result.flightInformation).toHaveProperty('callsign', 'BAW123');
      expect(result.steps).toHaveLength(1);
      expect(result.steps[0]).toHaveProperty('eventType', 'emergency');

      expect(openAiService.askLLM).toHaveBeenCalledTimes(1);
      expect(openAiService.askLLM).toHaveBeenCalledWith(expect.stringContaining('aviation radiotelephony training'));
    });

    it('should throw error if OpenAI returns invalid JSON', async () => {
      vi.mocked(openAiService.askLLM).mockResolvedValue('Invalid JSON response');

      await expect(
        joniScenarioAiService.generateScenarioFromText('Test scenario')
      ).rejects.toThrow('Invalid JSON in AI response');
    });

    it('should throw error if name is missing', async () => {
      const mockResponse = JSON.stringify({
        shortDescription: "Test",
        scenarioType: "standard",
        difficulty: "beginner",
        estimatedMinutes: 15,
        flightInformation: { aircraft: { type: "B737" }, callsign: "TEST" },
        steps: []
      });

      vi.mocked(openAiService.askLLM).mockResolvedValue(mockResponse);

      await expect(
        joniScenarioAiService.generateScenarioFromText('Test scenario')
      ).rejects.toThrow('Invalid or missing scenario name');
    });

    it('should throw error if invalid scenario type', async () => {
      const mockResponse = JSON.stringify({
        name: "Test",
        shortDescription: "Test",
        scenarioType: "invalid",
        difficulty: "beginner",
        estimatedMinutes: 15,
        flightInformation: { aircraft: { type: "B737" }, callsign: "TEST" },
        steps: []
      });

      vi.mocked(openAiService.askLLM).mockResolvedValue(mockResponse);

      await expect(
        joniScenarioAiService.generateScenarioFromText('Test scenario')
      ).rejects.toThrow('Invalid scenario type');
    });

    it('should throw error if steps array is empty', async () => {
      const mockResponse = JSON.stringify({
        name: "Test",
        shortDescription: "Test",
        scenarioType: "standard",
        difficulty: "beginner",
        estimatedMinutes: 15,
        flightInformation: { aircraft: { type: "B737" }, callsign: "TEST" },
        steps: []
      });

      vi.mocked(openAiService.askLLM).mockResolvedValue(mockResponse);

      await expect(
        joniScenarioAiService.generateScenarioFromText('Test scenario')
      ).rejects.toThrow('Invalid or empty steps array');
    });
  });

  describe('evaluateResponse', () => {
    it('should evaluate response with correct components', async () => {
      const mockResponse = JSON.stringify({
        score: 10,
        items: [
          { type: 'correct', title: 'Callsign included', description: 'Callsign BAW123 correctly included' },
          { type: 'correct', title: 'Altitude readback', description: 'Altitude correctly read back' }
        ],
        feedback: 'Perfect response with all required components',
        missingComponents: [],
        incorrectComponents: [],
        extraComponents: []
      });

      vi.mocked(openAiService.askLLM).mockResolvedValue(mockResponse);

      const result = await joniScenarioAiService.evaluateResponse(
        'BAW123, climbing flight level 100',
        'BAW123, climb flight level 100',
        [
          { component: 'callsign', values: ['BAW123'], required: true },
          { component: 'flight_level', values: ['100', 'ONE ZERO ZERO'], required: true }
        ],
        'atc',
        'BAW123, climb flight level 100',
        false
      );

      expect(result.score).toBe(10);
      expect(result.items).toHaveLength(2);
      expect(result.missingComponents).toHaveLength(0);
    });

    it('should evaluate response with enforced component order', async () => {
      const mockResponse = JSON.stringify({
        score: 7,
        items: [
          { type: 'wrong', title: 'Incorrect order', description: 'Components are in wrong order' },
          { type: 'correct', title: 'All components present', description: 'All required components included' }
        ],
        feedback: 'Components present but in wrong order',
        missingComponents: [],
        incorrectComponents: ['Component order'],
        extraComponents: []
      });

      vi.mocked(openAiService.askLLM).mockResolvedValue(mockResponse);

      const result = await joniScenarioAiService.evaluateResponse(
        'Climbing flight level 100, BAW123',
        'BAW123, climb flight level 100',
        [
          { component: 'callsign', values: ['BAW123'], required: true },
          { component: 'flight_level', values: ['100'], required: true }
        ],
        'atc',
        'BAW123, climb flight level 100',
        true // enforceComponentOrder
      );

      expect(result.score).toBe(7);
      expect(result.incorrectComponents).toContain('Component order');
      expect(openAiService.askLLM).toHaveBeenCalledWith(
        expect.stringContaining('ORDER ENFORCEMENT: Components must appear in the EXACT order listed above.')
      );
    });

    it('should handle multiple acceptable values with OR relationship', async () => {
      const mockResponse = JSON.stringify({
        score: 10,
        items: [
          { type: 'correct', title: 'Altitude correct', description: 'Altitude value accepted' }
        ],
        feedback: 'Correct response',
        missingComponents: [],
        incorrectComponents: [],
        extraComponents: []
      });

      vi.mocked(openAiService.askLLM).mockResolvedValue(mockResponse);

      const result = await joniScenarioAiService.evaluateResponse(
        'BAW123, climbing FIVE THOUSAND feet',
        'BAW123, climbing 5000 feet',
        [
          { component: 'callsign', values: ['BAW123'], required: true },
          { component: 'altitude', values: ['5000', 'FIVE THOUSAND'], required: true }
        ],
        'atc',
        'BAW123, climb 5000 feet',
        false
      );

      expect(result.score).toBe(10);
      expect(openAiService.askLLM).toHaveBeenCalledWith(
        expect.stringContaining('(acceptable values: "5000" OR "FIVE THOUSAND")')
      );
    });

    it('should handle evaluation errors gracefully', async () => {
      vi.mocked(openAiService.askLLM).mockResolvedValue('Invalid JSON');

      const result = await joniScenarioAiService.evaluateResponse(
        'Test response',
        'Correct response',
        [],
        'atc',
        'Test message',
        false
      );

      expect(result.score).toBe(0);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].type).toBe('wrong');
      expect(result.items[0].title).toBe('Evaluation Error');
    });
  });

  describe('generateShortDescription', () => {
    it('should generate short description from flight info', async () => {
      const mockResponse = 'B737 approaching EGLL with bird strike emergency';

      vi.mocked(openAiService.askLLM).mockResolvedValue(mockResponse);

      const result = await joniScenarioAiService.generateShortDescription(
        'Aircraft: B737-800, Route: LFPG to EGLL',
        'Emergency - bird strike on approach'
      );

      expect(result).toBe('B737 approaching EGLL with bird strike emergency');
      expect(openAiService.askLLM).toHaveBeenCalledWith(
        expect.stringContaining('aviation training scenarios')
      );
    });

    it('should truncate long descriptions', async () => {
      const longDescription = 'A'.repeat(200);
      vi.mocked(openAiService.askLLM).mockResolvedValue(longDescription);

      const result = await joniScenarioAiService.generateShortDescription(
        'Flight info',
        'Status'
      );

      expect(result).toHaveLength(150);
    });

    it('should handle API errors gracefully', async () => {
      vi.mocked(openAiService.askLLM).mockRejectedValue(new Error('API Error'));

      await expect(
        joniScenarioAiService.generateShortDescription('Flight info', 'Status')
      ).rejects.toThrow('Failed to generate description: API Error');
    });
  });
});