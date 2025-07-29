import aceLogo from "@/apps/ace/assets/ace-fav-dark.png";
import joniLogo from "@/apps/joni/assets/logo.png";
import { FeatureCard } from "@/components/FeatureCard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useUserAccess } from "@/hooks/useUserAccess";
import { Loader2, Settings2 } from "lucide-react";

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
      logo: <img src={aceLogo} alt="Ace logo" className="w-full h-full object-contain p-1" />,
      navigateTo: '/ace',
      hideIfNoAccess: false
    },
    joni: {
      title: 'Joni',
      logo: <img src={joniLogo} alt="Joni logo" className="w-full h-full object-contain" />,
      navigateTo: '/joni',
      hideIfNoAccess: false
    },
    backoffice: {
      title: 'Backoffice',
      logo: <Settings2 className="w-full h-full text-foreground" />,
      navigateTo: '/backoffice',
      hideIfNoAccess: true
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

          // Skip rendering if hideIfNoAccess is true and user has no access
          if (config.hideIfNoAccess && !hasAccess) return null;

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