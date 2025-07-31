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
      const mockResponse = {
        flightInformation: {
          flightNumber: 'BA007',
          departure: 'London Heathrow',
          arrival: 'Moscow Domodedovo',
          departureTime: '14:30',
          arrivalTime: '21:45',
          targetName: 'Viktor Volkov',
          missionCode: 'SNOWFALL'
        },
        expectedAnswer: {
          primaryObjective: 'Intercept target at airport',
          secondaryObjective: 'Retrieve briefcase',
          extractionPoint: 'Terminal 2 parking lot',
          backupPlan: 'Use diplomatic immunity if compromised'
        },
        currentStatus: 'Active - High Priority'
      };

      vi.mocked(openAiService.askLLMStructured).mockResolvedValue(mockResponse);

      const result = await joniScenarioAiService.generateScenarioFromText(
        'Agent must intercept Viktor Volkov on flight BA007 from London to Moscow, departing at 14:30. Mission code SNOWFALL. Retrieve briefcase and extract via Terminal 2.',
        'International espionage operations'
      );

      expect(result).toEqual({
        flightInformation: {
          flightNumber: 'BA007',
          departure: 'London Heathrow',
          arrival: 'Moscow Domodedovo',
          departureTime: '14:30',
          arrivalTime: '21:45',
          targetName: 'Viktor Volkov',
          missionCode: 'SNOWFALL'
        },
        expectedAnswer: {
          primaryObjective: 'Intercept target at airport',
          secondaryObjective: 'Retrieve briefcase',
          extractionPoint: 'Terminal 2 parking lot',
          backupPlan: 'Use diplomatic immunity if compromised'
        },
        currentStatus: 'Active - High Priority'
      });

      expect(openAiService.askLLMStructured).toHaveBeenCalledTimes(1);
      expect(openAiService.askLLMStructured).toHaveBeenCalledWith(expect.stringContaining('Johnny English agents'));
      expect(openAiService.askLLMStructured).toHaveBeenCalledWith(expect.stringContaining('International espionage operations'));
    });

    it('should throw error if OpenAI returns invalid structure', async () => {
      vi.mocked(openAiService.askLLMStructured).mockRejectedValue(
        new Error('Invalid JSON response from OpenAI')
      );

      await expect(
        joniScenarioAiService.generateScenarioFromText('Test scenario')
      ).rejects.toThrow('Failed to generate scenario: Invalid JSON response from OpenAI');
    });

    it('should throw error if flightInformation is missing', async () => {
      const mockResponse = {
        expectedAnswer: { action: 'Test' },
        currentStatus: 'Active'
      };

      vi.mocked(openAiService.askLLMStructured).mockResolvedValue(mockResponse);

      await expect(
        joniScenarioAiService.generateScenarioFromText('Test scenario')
      ).rejects.toThrow('Failed to generate scenario: Invalid flightInformation in AI response');
    });

    it('should throw error if expectedAnswer is missing', async () => {
      const mockResponse = {
        flightInformation: { test: 'data' },
        currentStatus: 'Active'
      };

      vi.mocked(openAiService.askLLMStructured).mockResolvedValue(mockResponse);

      await expect(
        joniScenarioAiService.generateScenarioFromText('Test scenario')
      ).rejects.toThrow('Failed to generate scenario: Invalid expectedAnswer in AI response');
    });

    it('should throw error if currentStatus is missing', async () => {
      const mockResponse = {
        flightInformation: { test: 'data' },
        expectedAnswer: { action: 'Test' }
      };

      vi.mocked(openAiService.askLLMStructured).mockResolvedValue(mockResponse);

      await expect(
        joniScenarioAiService.generateScenarioFromText('Test scenario')
      ).rejects.toThrow('Failed to generate scenario: Invalid currentStatus in AI response');
    });
  });

  describe('enrichScenarioData', () => {
    it('should enrich existing scenario data', async () => {
      const existingData = {
        flightInformation: {
          flightNumber: 'BA007'
        },
        currentStatus: 'Active'
      };

      const mockResponse = {
        flightInformation: {
          flightNumber: 'BA007',
          departure: 'London Heathrow',
          arrival: 'Moscow Domodedovo',
          aircraftType: 'Boeing 777'
        },
        expectedAnswer: {
          primaryObjective: 'Surveillance',
          equipment: 'Standard spy kit'
        },
        currentStatus: 'Active - Under Review'
      };

      vi.mocked(openAiService.askLLMStructured).mockResolvedValue(mockResponse);

      const result = await joniScenarioAiService.enrichScenarioData(
        existingData,
        'Add departure and arrival details. Aircraft is Boeing 777. Mission requires standard spy kit for surveillance.'
      );

      expect(result.flightInformation).toHaveProperty('aircraftType', 'Boeing 777');
      expect(result.expectedAnswer).toHaveProperty('equipment', 'Standard spy kit');
      expect(result.currentStatus).toBe('Active - Under Review');
    });

    it('should handle enrichment errors gracefully', async () => {
      vi.mocked(openAiService.askLLMStructured).mockRejectedValue(new Error('API Error'));

      await expect(
        joniScenarioAiService.enrichScenarioData({}, 'Additional context')
      ).rejects.toThrow('Failed to enrich scenario: API Error');
    });
  });
});