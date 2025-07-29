import { Feature } from '../types';

export type JoniSubFeatureId = 'joni-management';

export const joniFeature: Feature<'joni'> = {
  id: 'joni',
  name: 'Johnny English Feature Suite',
  description: 'Management and administrative features',
  subFeatures: {
    'joni-management': {
      id: 'joni-management',
      name: 'Management Access',
      description: 'Access to management screens and administrative functions'
      // No metadata - this is a simple boolean access control
    }
  }
};