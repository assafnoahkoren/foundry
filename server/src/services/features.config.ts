// Type definitions for feature IDs
export type FeatureId = 'ace' | 'johnny-english';

// Type definitions for sub-feature IDs (conditional based on feature)
export type SubFeatureId<T extends FeatureId> = 
  T extends 'ace' ? 'ace-analytics' | 'ace-api-access' :
  T extends 'johnny-english' ? 'johnny-english-gadgets' | 'johnny-english-missions' :
  never;

// Union type for all possible sub-feature IDs
export type AnySubFeatureId = SubFeatureId<'ace'> | SubFeatureId<'johnny-english'>;

// Type to validate feature-subfeature combinations
export type ValidFeatureSubFeaturePair = 
  | { featureId: 'ace'; subFeatureId: SubFeatureId<'ace'> }
  | { featureId: 'johnny-english'; subFeatureId: SubFeatureId<'johnny-english'> };

// Type definitions for feature metadata
export type MetadataType = string | number | boolean | string[] | Record<string, any>;

export interface MetadataDefinition<T extends MetadataType = MetadataType> {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  default: T;
  description: string;
  validation?: {
    min?: number;
    max?: number;
    enum?: T[];
    pattern?: string;
  };
}

export interface SubFeature<TSubId extends AnySubFeatureId = AnySubFeatureId> {
  id: TSubId;
  name: string;
  description: string;
  metadata?: Record<string, MetadataDefinition>;
}

export interface Feature<TId extends FeatureId = FeatureId> {
  id: TId;
  name: string;
  description: string;
  subFeatures: Record<SubFeatureId<TId>, SubFeature<SubFeatureId<TId>>>;
}

export interface FeaturesConfig {
  features: {
    [K in FeatureId]: Feature<K>;
  };
}

// Actual features configuration
export const featuresConfig: FeaturesConfig = {
  features: {
    'ace': {
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
    },
    'johnny-english': {
      id: 'johnny-english',
      name: 'Johnny English Feature Suite',
      description: 'Specialized spy tools and features',
      subFeatures: {
        'johnny-english-gadgets': {
          id: 'johnny-english-gadgets',
          name: 'Spy Gadgets',
          description: 'Access to special spy gadgets',
          metadata: {
            gadgetLevel: {
              type: 'string',
              default: 'basic',
              description: 'Level of gadgets available',
              validation: {
                enum: ['basic', 'advanced', 'expert', 'master-spy']
              }
            },
            maxActiveGadgets: {
              type: 'number',
              default: 3,
              description: 'Maximum number of active gadgets',
              validation: {
                min: 1,
                max: 10
              }
            },
            specialGadgets: {
              type: 'array',
              default: [],
              description: 'List of special gadgets available'
            }
          }
        },
        'johnny-english-missions': {
          id: 'johnny-english-missions',
          name: 'Secret Missions',
          description: 'Access to secret mission planning',
          metadata: {
            clearanceLevel: {
              type: 'string',
              default: 'confidential',
              description: 'Security clearance level',
              validation: {
                enum: ['confidential', 'secret', 'top-secret', 'eyes-only']
              }
            },
            simultaneousMissions: {
              type: 'number',
              default: 1,
              description: 'Number of missions that can be active at once',
              validation: {
                min: 1,
                max: 5
              }
            },
            missionTypes: {
              type: 'array',
              default: ['reconnaissance'],
              description: 'Types of missions allowed',
              validation: {
                enum: ['reconnaissance', 'infiltration', 'extraction', 'sabotage', 'diplomatic']
              }
            },
            equipmentBudget: {
              type: 'number',
              default: 10000,
              description: 'Budget for mission equipment in credits',
              validation: {
                min: 1000,
                max: 1000000
              }
            }
          }
        }
      }
    }
  }
};

// Helper function to get all feature IDs
export function getAllFeatureIds(): FeatureId[] {
  return Object.keys(featuresConfig.features) as FeatureId[];
}

// Helper function to get all sub-feature IDs for a feature
export function getSubFeatureIds<T extends FeatureId>(featureId: T): SubFeatureId<T>[] {
  const feature = featuresConfig.features[featureId];
  return feature ? Object.keys(feature.subFeatures) as SubFeatureId<T>[] : [];
}

// Helper function to validate feature-subfeature combination
export function isValidFeatureSubFeaturePair(
  featureId: string,
  subFeatureId: string
): featureId is FeatureId {
  const feature = featuresConfig.features[featureId as FeatureId];
  if (!feature) return false;
  return subFeatureId in feature.subFeatures;
}

// Helper function to validate metadata value
export function validateMetadata<T extends FeatureId>(
  featureId: T,
  subFeatureId: SubFeatureId<T>,
  metadataKey: string,
  value: any
): boolean {
  const feature = featuresConfig.features[featureId];
  if (!feature) return false;
  
  const subFeature = feature.subFeatures[subFeatureId];
  if (!subFeature || !subFeature.metadata) return false;
  
  const metadataDef = subFeature.metadata[metadataKey];
  if (!metadataDef) return false;
  
  // Type checking
  const actualType = Array.isArray(value) ? 'array' : typeof value;
  if (actualType !== metadataDef.type) return false;
  
  // Validation rules
  if (metadataDef.validation) {
    const { min, max, enum: enumValues, pattern } = metadataDef.validation;
    
    if (typeof value === 'number') {
      if (min !== undefined && value < min) return false;
      if (max !== undefined && value > max) return false;
    }
    
    if (enumValues && !enumValues.includes(value)) return false;
    
    if (pattern && typeof value === 'string') {
      const regex = new RegExp(pattern);
      if (!regex.test(value)) return false;
    }
  }
  
  return true;
}