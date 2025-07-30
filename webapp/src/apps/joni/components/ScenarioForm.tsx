import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { trpc } from '@/utils/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { KeyValueInput } from '@/components/KeyValueInput';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface ScenarioFormProps {
  scenarioId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ScenarioForm({ scenarioId, onSuccess, onCancel }: ScenarioFormProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEditMode = !!scenarioId;

  // Form state
  const [subjectId, setSubjectId] = useState<string>('');
  const [flightInformation, setFlightInformation] = useState<Record<string, unknown>>({});
  const [expectedAnswer, setExpectedAnswer] = useState<Record<string, unknown>>({});
  const [currentStatus, setCurrentStatus] = useState<string>('');

  // Queries
  const { data: subjects } = trpc.joniScenario.getAllSubjects.useQuery();
  const { data: scenario, isLoading: scenarioLoading } = trpc.joniScenario.getScenarioById.useQuery(
    scenarioId!,
    { enabled: isEditMode }
  );

  // Get tRPC utils for cache invalidation
  const utils = trpc.useUtils();

  // Mutations
  const createScenario = trpc.joniScenario.createScenario.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Scenario created successfully',
      });
      // Invalidate scenarios list to refresh the data
      utils.joniScenario.getAllScenarios.invalidate();
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

  const updateScenario = trpc.joniScenario.updateScenario.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Scenario updated successfully',
      });
      // Invalidate both the specific scenario and the list
      utils.joniScenario.getScenarioById.invalidate(scenarioId);
      utils.joniScenario.getAllScenarios.invalidate();
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

  // Load scenario data in edit mode
  useEffect(() => {
    if (scenario && isEditMode) {
      setSubjectId(scenario.subjectId);
      setFlightInformation(scenario.flightInformation as Record<string, unknown>);
      setExpectedAnswer(scenario.expectedAnswer as Record<string, unknown>);
      setCurrentStatus(scenario.currentStatus);
    }
  }, [scenario, isEditMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subjectId) {
      toast({
        title: 'Error',
        description: 'Please select a subject',
        variant: 'destructive',
      });
      return;
    }

    const data = {
      subjectId,
      flightInformation,
      expectedAnswer,
      currentStatus,
    };

    if (isEditMode) {
      updateScenario.mutate({ id: scenarioId, data });
    } else {
      createScenario.mutate(data);
    }
  };

  if (isEditMode && scenarioLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditMode ? 'Edit Scenario' : 'Create New Scenario'}</CardTitle>
        <CardDescription>
          {isEditMode 
            ? 'Update the scenario details below' 
            : 'Fill in the details to create a new training scenario'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Subject Selection */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <select
              id="subject"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              required
            >
              <option value="">Select a subject...</option>
              {subjects?.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>

          {/* Flight Information */}
          <KeyValueInput
            label="Flight Information"
            value={flightInformation}
            onChange={setFlightInformation}
            placeholder={{ key: 'Property', value: 'Value' }}
          />

          {/* Expected Answer */}
          <KeyValueInput
            label="Expected Answer"
            value={expectedAnswer}
            onChange={setExpectedAnswer}
            placeholder={{ key: 'Property', value: 'Value' }}
          />

          {/* Current Status */}
          <div className="space-y-2">
            <Label htmlFor="currentStatus">Current Status *</Label>
            <Textarea
              id="currentStatus"
              placeholder="Describe the current status of the scenario..."
              value={currentStatus}
              onChange={(e) => setCurrentStatus(e.target.value)}
              required
              rows={4}
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onCancel?.();
                navigate('/joni/scenarios');
              }}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createScenario.isPending || updateScenario.isPending}
            >
              {createScenario.isPending || updateScenario.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditMode ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                isEditMode ? 'Update Scenario' : 'Create Scenario'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}