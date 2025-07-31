import { useState, useEffect, useMemo } from 'react';
import { trpc } from '@/utils/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shield, Search } from 'lucide-react';
import Fuse from 'fuse.js';

interface UserAccessFormProps {
  userId: string;
  userName: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

type FeatureAccess = {
  [feature: string]: {
    [subFeature: string]: boolean;
  };
};

type SearchableItem = {
  featureId: string;
  featureName: string;
  featureDescription?: string;
  subFeatureId: string;
  subFeatureName: string;
  subFeatureDescription?: string;
  requiresMetadata?: boolean;
};

function highlightText(text: string, searchQuery: string, fuseResult?: Fuse.FuseResult<SearchableItem>) {
  if (!searchQuery || !fuseResult) return text;

  const matches = fuseResult.matches?.find(m => m.value === text);
  if (!matches || !matches.indices) return text;

  let highlighted = '';
  let lastIndex = 0;

  matches.indices.forEach(([start, end]) => {
    highlighted += text.slice(lastIndex, start);
    highlighted += `<mark class="bg-yellow-200 text-black">${text.slice(start, end + 1)}</mark>`;
    lastIndex = end + 1;
  });

  highlighted += text.slice(lastIndex);
  return highlighted;
}

export function UserAccessForm({ userId, userName, onSuccess, onCancel }: UserAccessFormProps) {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const [featureAccess, setFeatureAccess] = useState<FeatureAccess>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<string>('');

  // Get features configuration
  const { data: featuresConfig } = trpc.userAccess.getFeaturesConfig.useQuery();

  // Get user's current access
  const { data: userAccess, isLoading: accessLoading } = trpc.admin.getUserAccess.useQuery(
    { userId },
    { enabled: !!userId }
  );

  // Update user access mutation
  const updateUserAccess = trpc.admin.updateUserAccess.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'User access updated successfully',
      });
      // Invalidate user access data to refresh the UI
      utils.admin.getUserAccess.invalidate({ userId });
      utils.admin.getUsers.invalidate();
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Initialize feature access state from user's current access
  useEffect(() => {
    if (featuresConfig?.features && userAccess) {
      const initialAccess: FeatureAccess = {};
      const featureIds = Object.keys(featuresConfig.features);
      
      // Initialize all features as false
      Object.entries(featuresConfig.features).forEach(([featureId, feature]) => {
        initialAccess[featureId] = {};
        const featureObj = feature as { subFeatures: Record<string, unknown> };
        Object.keys(featureObj.subFeatures).forEach(subFeatureId => {
          initialAccess[featureId][subFeatureId] = false;
        });
      });

      // Set user's current access to true
      userAccess.forEach(access => {
        if (initialAccess[access.feature]) {
          initialAccess[access.feature][access.subFeature] = true;
        }
      });

      setFeatureAccess(initialAccess);
      setLoading(false);
      
      // Set the first feature as active tab
      if (featureIds.length > 0 && !activeTab) {
        setActiveTab(featureIds[0]);
      }
    }
  }, [featuresConfig, userAccess, activeTab]);

  // Prepare searchable items
  const searchableItems = useMemo(() => {
    if (!featuresConfig?.features) return [];
    
    const items: SearchableItem[] = [];
    Object.entries(featuresConfig.features).forEach(([featureId, feature]) => {
      const featureObj = feature as { 
        name: string; 
        description?: string; 
        subFeatures: Record<string, {
          name: string;
          description?: string;
          requiresMetadata?: boolean;
        }>
      };
      
      Object.entries(featureObj.subFeatures).forEach(([subFeatureId, subFeature]) => {
        items.push({
          featureId,
          featureName: featureObj.name,
          featureDescription: featureObj.description,
          subFeatureId,
          subFeatureName: subFeature.name,
          subFeatureDescription: subFeature.description,
          requiresMetadata: subFeature.requiresMetadata,
        });
      });
    });
    
    return items;
  }, [featuresConfig]);

  // Setup Fuse.js for fuzzy search
  const fuse = useMemo(() => {
    return new Fuse(searchableItems, {
      keys: [
        { name: 'featureId', weight: 0.3 },
        { name: 'featureName', weight: 0.3 },
        { name: 'featureDescription', weight: 0.2 },
        { name: 'subFeatureId', weight: 0.3 },
        { name: 'subFeatureName', weight: 0.3 },
        { name: 'subFeatureDescription', weight: 0.2 },
      ],
      threshold: 0.3,
      includeMatches: true,
      includeScore: true,
    });
  }, [searchableItems]);

  // Get search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    return fuse.search(searchQuery);
  }, [fuse, searchQuery]);

  const handleToggleAccess = (featureId: string, subFeatureId: string) => {
    setFeatureAccess(prev => ({
      ...prev,
      [featureId]: {
        ...prev[featureId],
        [subFeatureId]: !prev[featureId][subFeatureId]
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Convert featureAccess state to update format
    const updates: Array<{
      feature: string;
      subFeature: string;
      hasAccess: boolean;
    }> = [];

    Object.entries(featureAccess).forEach(([featureId, subFeatures]) => {
      Object.entries(subFeatures).forEach(([subFeatureId, hasAccess]) => {
        updates.push({
          feature: featureId,
          subFeature: subFeatureId,
          hasAccess
        });
      });
    });

    updateUserAccess.mutate({ userId, updates });
  };

  if (loading || accessLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const renderSubFeature = (
    featureId: string, 
    subFeatureId: string, 
    subFeature: { name: string; description?: string; requiresMetadata?: boolean },
    searchResult?: Fuse.FuseResult<SearchableItem>
  ) => {
    const nameHtml = searchResult 
      ? highlightText(subFeature.name, searchQuery, searchResult)
      : subFeature.name;
    
    const descriptionHtml = subFeature.description && searchResult 
      ? highlightText(subFeature.description, searchQuery, searchResult)
      : subFeature.description;

    return (
      <div key={`${featureId}-${subFeatureId}`} className="flex items-center justify-between space-x-4 p-2 rounded-md hover:bg-accent/50 transition-colors">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <Label 
              htmlFor={`${featureId}-${subFeatureId}`} 
              className="font-normal"
              dangerouslySetInnerHTML={{ __html: nameHtml }}
            />
            {subFeature.requiresMetadata && (
              <Badge variant="outline" className="text-xs">
                Requires Config
              </Badge>
            )}
          </div>
          {descriptionHtml && (
            <p 
              className="text-xs text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: descriptionHtml }}
            />
          )}
        </div>
        <Switch
          id={`${featureId}-${subFeatureId}`}
          checked={featureAccess[featureId]?.[subFeatureId] || false}
          onCheckedChange={() => handleToggleAccess(featureId, subFeatureId)}
        />
      </div>
    );
  };

  return (
    <Card className="w-full max-w-4xl border-0 shadow-none">
      <CardHeader>
        <CardTitle>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Manage User Access
          </div>
        </CardTitle>
        <CardDescription>
          Configure feature access for <span className="font-semibold">{userName}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Search by feature name, ID, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Display search results or tabs */}
          {searchResults ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
              </p>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {searchResults.map((result) => {
                  const item = result.item;
                  return renderSubFeature(
                    item.featureId,
                    item.subFeatureId,
                    {
                      name: item.subFeatureName,
                      description: item.subFeatureDescription,
                      requiresMetadata: item.requiresMetadata,
                    },
                    result
                  );
                })}
              </div>
            </div>
          ) : (
            featuresConfig?.features && (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${Object.keys(featuresConfig.features).length}, 1fr)` }}>
                  {Object.entries(featuresConfig.features).map(([featureId, feature]) => {
                    const featureObj = feature as { name: string };
                    return (
                      <TabsTrigger key={featureId} value={featureId}>
                        {featureObj.name}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
                
                {Object.entries(featuresConfig.features).map(([featureId, feature]) => {
                  const featureObj = feature as { 
                    name: string; 
                    description?: string; 
                    subFeatures: Record<string, {
                      name: string;
                      description?: string;
                      requiresMetadata?: boolean;
                    }>
                  };
                  
                  return (
                    <TabsContent key={featureId} value={featureId} className="space-y-4 mt-6">
                      {featureObj.description && (
                        <p className="text-sm text-muted-foreground">{featureObj.description}</p>
                      )}
                      
                      <div className="space-y-2">
                        {Object.entries(featureObj.subFeatures).map(([subFeatureId, subFeature]) => 
                          renderSubFeature(featureId, subFeatureId, subFeature)
                        )}
                      </div>
                    </TabsContent>
                  );
                })}
              </Tabs>
            )
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={updateUserAccess.isPending}
            >
              {updateUserAccess.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Access'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}