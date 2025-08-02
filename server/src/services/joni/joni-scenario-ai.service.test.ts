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
      ).rejects.toThrow('Failed to generate scenario: No valid JSON found in response');
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
      ).rejects.toThrow('Failed to generate scenario: Invalid or missing scenario name');
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
      ).rejects.toThrow('Failed to generate scenario: Invalid scenario type');
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
      ).rejects.toThrow('Failed to generate scenario: Invalid or empty steps array');
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