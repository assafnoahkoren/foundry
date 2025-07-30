import { trpc } from "@/utils/trpc";

const DEBUG_PREFIX = '[useUserAccess]';

export function useUserAccess() {
  const { data: userFeatures, isLoading, error } = trpc.userAccess.getMyFeatures.useQuery();

  // Get features configuration to show all features even if user doesn't have access
  const { data: featuresConfig } = trpc.userAccess.getFeaturesConfig.useQuery();

  // Debug log the hook state
  console.log(`${DEBUG_PREFIX} Hook state:`, {
    isLoading,
    error,
    userFeaturesCount: userFeatures?.length || 0,
    featuresConfigLoaded: !!featuresConfig
  });

  // Helper function to check if user has access to a specific feature
  const hasFeatureAccess = (featureId: string): boolean => {
    console.log(`${DEBUG_PREFIX} Checking feature access for:`, featureId);
    console.log(`${DEBUG_PREFIX} User features:`, userFeatures);
    
    if (!userFeatures) {
      console.log(`${DEBUG_PREFIX} No user features loaded yet`);
      return false;
    }
    
    const hasAccess = userFeatures.some(feature => feature.featureId === featureId);
    console.log(`${DEBUG_PREFIX} Feature ${featureId} access:`, hasAccess);
    return hasAccess;
  };

  // Helper function to check if user has access to a specific sub-feature
  const hasSubFeatureAccess = (featureId: string, subFeatureId: string): boolean => {
    console.log(`${DEBUG_PREFIX} Checking sub-feature access for:`, { featureId, subFeatureId });
    console.log(`${DEBUG_PREFIX} User features:`, userFeatures);
    
    if (!userFeatures) {
      console.log(`${DEBUG_PREFIX} No user features loaded yet`);
      return false;
    }
    
    const feature = userFeatures.find(f => f.featureId === featureId);
    console.log(`${DEBUG_PREFIX} Found feature:`, feature);
    
    if (!feature) {
      console.log(`${DEBUG_PREFIX} Feature ${featureId} not found in user features`);
      return false;
    }
    
    const hasAccess = feature.subFeatures.some(sf => sf.subFeatureId === subFeatureId);
    console.log(`${DEBUG_PREFIX} Sub-feature ${subFeatureId} access:`, hasAccess);
    console.log(`${DEBUG_PREFIX} Available sub-features:`, feature.subFeatures);
    return hasAccess;
  };

  // Get sub-features for a specific feature that the user has access to
  const getUserSubFeatures = (featureId: string) => {
    console.log(`${DEBUG_PREFIX} Getting user sub-features for:`, featureId);
    const feature = userFeatures?.find(f => f.featureId === featureId);
    const subFeatures = feature?.subFeatures || [];
    console.log(`${DEBUG_PREFIX} Found sub-features:`, subFeatures);
    return subFeatures;
  };

  return {
    userFeatures,
    featuresConfig,
    isLoading,
    error,
    hasFeatureAccess,
    hasSubFeatureAccess,
    getUserSubFeatures,
  };
}