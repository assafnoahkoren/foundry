import { Feature } from '../types';

// Type-safe sub-feature IDs for backoffice
export type BackofficeSubFeatureId = 'backoffice-users' | 'backoffice-user-access' | 'backoffice-scenario';

export const backofficeFeature: Feature<'backoffice'> = {
  id: 'backoffice',
  name: 'Backoffice',
  description: 'System administration and management features',
  subFeatures: {
    'backoffice-users': {
      id: 'backoffice-users',
      name: 'User Management',
      description: 'Manage system users and their profiles'
      // No metadata - simple boolean access control
    },
    'backoffice-user-access': {
      id: 'backoffice-user-access',
      name: 'User Access Control',
      description: 'Manage user permissions and feature access'
      // No metadata - simple boolean access control
    },
    'backoffice-scenario': {
      id: 'backoffice-scenario',
      name: 'Scenario Management',
      description: 'Manage aviation training scenarios and subjects'
      // No metadata - simple boolean access control
    }
  }
};