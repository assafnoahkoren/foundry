import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { trpc } from '@/utils/trpc';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { OverviewTab } from './tabs/OverviewTab';
import { FlightInformationTab } from './tabs/FlightInformationTab';
import { ScenarioStepsTab } from './tabs/ScenarioStepsTab';
import { PreviewTab } from './tabs/PreviewTab';
import type { 
  ScenarioFormData, 
  FlightInformation
} from '../../types/scenario-form.types';

interface ScenarioFormProps {
  scenarioId?: string;
  subjectId?: string;
  groupId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ScenarioForm({ 
  scenarioId, 
  subjectId: defaultSubjectId, 
  groupId: defaultGroupId, 
  onSuccess, 
  onCancel 
}: ScenarioFormProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEditMode = !!scenarioId;
  const [activeTab, setActiveTab] = useState('overview');

  // Form state
  const [formData, setFormData] = useState<ScenarioFormData>({
    name: '',
    shortDescription: '',
    subjectId: defaultSubjectId || '',
    groupId: defaultGroupId || '',
    scenarioType: 'standard',
    difficulty: 'intermediate',
    estimatedMinutes: 15,
    initialContext: '',
    flightInformation: {
      aircraft: {
        type: '',
        weightCategory: 'MEDIUM'
      },
      callsign: '',
      route: {
        departure: '',
        destination: ''
      }
    },
    steps: []
  });

  // Legacy fields for backward compatibility
  const [legacyFields, setLegacyFields] = useState({
    flightInformation: '',
    expectedAnswer: '',
    currentStatus: ''
  });

  // Queries
  const { data: subjects } = trpc.joniScenario.getAllSubjects.useQuery();
  const { data: groups } = trpc.joniScenarioGroup.getGroupsBySubject.useQuery(
    { subjectId: formData.subjectId },
    { enabled: !!formData.subjectId }
  );

  // Mutations
  const createMutation = trpc.joniScenario.createScenarioWithSteps.useMutation({
    onSuccess: () => {
      toast({ title: 'Success', description: 'Scenario created successfully' });
      onSuccess?.();
    },
    onError: (error) => {
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to create scenario',
        variant: 'destructive' 
      });
    }
  });

  const updateMutation = trpc.joniScenario.updateScenario.useMutation({
    onSuccess: () => {
      toast({ title: 'Success', description: 'Scenario updated successfully' });
      onSuccess?.();
    },
    onError: (error) => {
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to update scenario',
        variant: 'destructive' 
      });
    }
  });

  // Load scenario data if editing
  const { data: scenario } = trpc.joniScenario.getScenarioById.useQuery(
    scenarioId!,
    { enabled: isEditMode }
  );

  useEffect(() => {
    if (scenario) {
      // Parse flight information
      let flightInfo: FlightInformation = formData.flightInformation;
      if (scenario.flightInformationJson) {
        flightInfo = scenario.flightInformationJson as FlightInformation;
      }

      setFormData({
        name: scenario.name,
        shortDescription: scenario.shortDescription || '',
        subjectId: scenario.subjectId,
        groupId: scenario.groupId || '',
        scenarioType: scenario.scenarioType || 'standard',
        difficulty: scenario.difficulty || 'intermediate',
        estimatedMinutes: scenario.estimatedMinutes || 15,
        initialContext: scenario.initialContext || '',
        flightInformation: flightInfo,
        steps: [] // TODO: Load steps when implemented
      });

      // Set legacy fields
      setLegacyFields({
        flightInformation: scenario.flightInformation,
        expectedAnswer: scenario.expectedAnswer || '',
        currentStatus: scenario.currentStatus || ''
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario]);

  const handleSubmit = () => {
    // Validate required fields
    if (!formData.name || !formData.subjectId) {
      toast({ 
        title: 'Validation Error', 
        description: 'Please fill in all required fields',
        variant: 'destructive' 
      });
      return;
    }

    if (isEditMode) {
      // For edit mode, just update the scenario basic info
      const updateData = {
        id: scenarioId!,
        data: {
          name: formData.name,
          shortDescription: formData.shortDescription,
          subjectId: formData.subjectId,
          groupId: formData.groupId,
          scenarioType: formData.scenarioType,
          difficulty: formData.difficulty,
          estimatedMinutes: formData.estimatedMinutes,
          initialContext: formData.initialContext,
          flightInformationJson: formData.flightInformation,
          // Include legacy fields for backward compatibility
          flightInformation: JSON.stringify(formData.flightInformation),
          expectedAnswer: formData.steps.length > 0 
            ? formData.steps[0].correctResponseExample 
            : legacyFields.expectedAnswer,
          currentStatus: legacyFields.currentStatus
        }
      };
      updateMutation.mutate(updateData);
    } else {
      // For create mode, use createScenarioWithSteps
      const createData = {
        scenario: {
          name: formData.name,
          shortDescription: formData.shortDescription,
          subjectId: formData.subjectId,
          groupId: formData.groupId,
          scenarioType: formData.scenarioType,
          difficulty: formData.difficulty,
          estimatedMinutes: formData.estimatedMinutes,
          initialContext: formData.initialContext,
          flightInformationJson: formData.flightInformation,
        },
        steps: formData.steps.map((step, index) => ({
          stepOrder: index + 1,
          eventType: step.eventType,
          actorRole: step.actorRole,
          eventDescription: step.eventDescription,
          eventMessage: step.eventMessage,
          expectedComponents: step.expectedComponents,
          correctResponseExample: step.correctResponseExample,
          nextStepCondition: step.nextStepCondition
        }))
      };
      createMutation.mutate(createData);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Card className="border-0 shadow-none">
      <CardContent className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="flight">Flight Information</TabsTrigger>
            <TabsTrigger value="steps">Scenario Steps</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <OverviewTab 
              formData={formData}
              setFormData={setFormData}
              subjects={subjects || []}
              groups={groups || []}
            />
          </TabsContent>

          <TabsContent value="flight" className="mt-6">
            <FlightInformationTab 
              flightInformation={formData.flightInformation}
              setFlightInformation={(fi) => setFormData({ ...formData, flightInformation: fi })}
            />
          </TabsContent>

          <TabsContent value="steps" className="mt-6">
            <ScenarioStepsTab 
              steps={formData.steps}
              setSteps={(steps) => setFormData({ ...formData, steps })}
            />
          </TabsContent>

          <TabsContent value="preview" className="mt-6">
            <PreviewTab formData={formData} />
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-4 mt-8">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel || (() => navigate(-1))}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : isEditMode ? 'Update Scenario' : 'Create Scenario'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}