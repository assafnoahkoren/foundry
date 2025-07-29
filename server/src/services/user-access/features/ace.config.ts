import { Feature } from '../types';

export type AceSubFeatureId = 'ace-analytics' | 'ace-api-access';

export const aceFeature: Feature<'ace'> = {
  id: 'ace',
  name: 'Ace Feature Suite',
  description: 'Advanced capabilities and enhanced features',
  subFeatures: {
    'ace-analytics': {
      id: 'ace-analytics',
      name: 'Advanced Analytics',
      description: 'Deep analytics and reporting capabilities',
      metadata: {
        maxReports: {
          type: 'number',
          default: 10,
          description: 'Maximum number of reports user can generate',
          validation: {
            min: 1,
            max: 1000
          }
        },
        dataRetentionDays: {
          type: 'number',
          default: 30,
          description: 'How many days of data the user can access',
          validation: {
            min: 7,
            max: 365
          }
        },
        exportFormats: {
          type: 'array',
          default: ['pdf', 'csv'],
          description: 'Available export formats for reports',
          validation: {
            enum: ['pdf', 'csv', 'excel', 'json']
          }
        }
      }
    },
    'ace-api-access': {
      id: 'ace-api-access',
      name: 'API Access',
      description: 'Access to advanced API endpoints',
      metadata: {
        rateLimit: {
          type: 'number',
          default: 1000,
          description: 'API calls per hour',
          validation: {
            min: 10,
            max: 100000
          }
        },
        allowedEndpoints: {
          type: 'array',
          default: ['basic'],
          description: 'List of allowed API endpoint groups'
        },
        apiKey: {
          type: 'string',
          default: '',
          description: 'Custom API key prefix',
          validation: {
            pattern: '^[a-zA-Z0-9_-]*$'
          }
        }
      }
    }
  }
};