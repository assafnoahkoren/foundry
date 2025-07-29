import { trpc } from "@/utils/trpc";

export function useUserAccess() {
  const { data: userFeatures, isLoading, error } = trpc.userAccess.getMyFeatures.useQuery();

  // Get features configuration to show all features even if user doesn't have access
  const { data: featuresConfig } = trpc.userAccess.getFeaturesConfig.useQuery();

  // Helper function to check if user has access to a specific feature
  const hasFeatureAccess = (featureId: string): boolean => {
    if (!userFeatures) return false;
    return userFeatures.some(feature => feature.featureId === featureId);
  };

  // Helper function to check if user has access to a specific sub-feature
  const hasSubFeatureAccess = (featureId: string, subFeatureId: string): boolean => {
    if (!userFeatures) return false;
    const feature = userFeatures.find(f => f.featureId === featureId);
    if (!feature) return false;
    return feature.subFeatures.some(sf => sf.subFeatureId === subFeatureId);
  };

  // Get sub-features for a specific feature that the user has access to
  const getUserSubFeatures = (featureId: string) => {
    const feature = userFeatures?.find(f => f.featureId === featureId);
    return feature?.subFeatures || [];
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