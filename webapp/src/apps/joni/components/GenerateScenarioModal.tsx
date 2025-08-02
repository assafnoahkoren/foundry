import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { trpc } from '@/utils/trpc';

interface GenerateScenarioModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjectId: string;
  groupId?: string;
  onSuccess?: () => void;
}

export function GenerateScenarioModal({
  open,
  onOpenChange,
  subjectId,
  groupId,
  onSuccess
}: GenerateScenarioModalProps) {
  const [description, setDescription] = useState('');
  const { toast } = useToast();
  const utils = trpc.useUtils();

  const generateMutation = trpc.joniScenario.generateScenarioFromText.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Scenario generated successfully with AI!'
      });
      
      // Invalidate queries to refresh the list
      utils.joniScenario.getAllScenarios.invalidate();
      if (groupId) {
        utils.joniScenarioGroup.getGroupById.invalidate(groupId);
      }
      
      // Reset and close
      setDescription('');
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate scenario',
        variant: 'destructive'
      });
    }
  });

  const handleGenerate = () => {
    if (!description.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please provide a scenario description',
        variant: 'destructive'
      });
      return;
    }

    generateMutation.mutate({
      description: description.trim(),
      subjectId,
      groupId
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-2xl" 
        aria-describedby="generate-scenario-description"
      >
        <VisuallyHidden>
          <DialogTitle>Generate Scenario with AI</DialogTitle>
        </VisuallyHidden>
        <div id="generate-scenario-description" className="sr-only">
          Use AI to generate a complete training scenario from a description
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Scenario Generator
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Describe the scenario you want to create, and AI will generate a complete training exercise with multiple steps.
            </p>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Tips for best results:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li>Include aircraft type, location, and phase of flight</li>
                <li>Specify if it's an emergency, weather, or routine scenario</li>
                <li>Mention any specific challenges or training objectives</li>
                <li>Describe the initial situation and desired outcome</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="scenario-description">Scenario Description</Label>
            <Textarea
              id="scenario-description"
              placeholder="Example: A Boeing 737 on approach to London Heathrow experiences a bird strike and needs to execute a go-around. Include communication with ATC, crew coordination, and passenger announcements."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              className="resize-none"
              disabled={generateMutation.isPending}
            />
            <p className="text-xs text-muted-foreground">
              {description.length}/10000 characters
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={generateMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={generateMutation.isPending || !description.trim()}
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Scenario
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}