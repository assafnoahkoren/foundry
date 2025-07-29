import { aceFeature } from './ace.config';
import { joniFeature } from './joni.config';
import { FeaturesConfig, FeatureId, SubFeatureId } from '../types';

// Combined features configuration
export const featuresConfig: FeaturesConfig = {
  features: {
    'ace': aceFeature,
    'joni': joniFeature
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

// Re-export types
export * from '../types';
export { aceFeature } from './ace.config';
export { joniFeature } from './joni.config';
export type { AceSubFeatureId } from './ace.config';
export type { JoniSubFeatureId } from './joni.config';