import { useUserAccess } from "@/hooks/useUserAccess";
import { FeatureCard } from "@/components/FeatureCard";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import joniLogo from "@/apps/joni/assets/logo.png";
import aceLogo from "@/apps/ace/assets/ace-fav-dark.png";

export default function Hub() {
  const { 
    featuresConfig, 
    isLoading, 
    error, 
    hasFeatureAccess
  } = useUserAccess();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load features. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Get all features from config to show even those without access
  const allFeatures = featuresConfig?.features || {};

  // Feature configuration with logos and navigation
  const featureConfig = {
    ace: {
      title: 'Ace',
      logo: aceLogo,
      navigateTo: '/ace'
    },
    joni: {
      title: 'Joni',
      logo: joniLogo,
      navigateTo: '/joni'
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Feature Hub</h1>
        <p className="text-muted-foreground mt-2">
          Access and manage your available features
        </p>
      </div>

      {/* Feature Cards Flex */}
      <div className="flex flex-wrap gap-6 justify-evenly sm:justify-start">
        {Object.entries(allFeatures).map(([featureId]) => {
          const hasAccess = hasFeatureAccess(featureId);
          const config = featureConfig[featureId as keyof typeof featureConfig];

          if (!config) return null;

          return (
            <FeatureCard
              key={featureId}
              title={config.title}
              hasAccess={hasAccess}
              logo={config.logo}
              navigateTo={config.navigateTo}
            />
          );
        })}
      </div>
    </div>
  );
}