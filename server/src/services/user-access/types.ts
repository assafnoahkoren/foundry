// Type definitions for feature IDs
export type FeatureId = 'ace' | 'joni' | 'backoffice';

// Type definitions for sub-feature IDs (conditional based on feature)
export type SubFeatureId<T extends FeatureId> = 
  T extends 'ace' ? 'ace-analytics' | 'ace-api-access' :
  T extends 'joni' ? 'joni-management' | 'joni-scenario-practice' | 'joni-comm-blocks' :
  T extends 'backoffice' ? 'backoffice-users' | 'backoffice-user-access' | 'backoffice-scenario' :
  never;

// Union type for all possible sub-feature IDs
export type AnySubFeatureId = SubFeatureId<'ace'> | SubFeatureId<'joni'> | SubFeatureId<'backoffice'>;

// Type to validate feature-subfeature combinations
export type ValidFeatureSubFeaturePair = 
  | { featureId: 'ace'; subFeatureId: SubFeatureId<'ace'> }
  | { featureId: 'joni'; subFeatureId: SubFeatureId<'joni'> }
  | { featureId: 'backoffice'; subFeatureId: SubFeatureId<'backoffice'> };

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