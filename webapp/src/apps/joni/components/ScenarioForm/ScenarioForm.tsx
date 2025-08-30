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
import type { ScenarioStep } from '../../types/scenario-practice.types';

interface ScenarioFormProps {
  scenarioId?: string;
  subjectId?: string;
  groupId?: string;
  onSuccess?: () => void;
  onUpdateSuccess?: () => void; // Separate callback for update success
  onCancel?: () => void;
}

export function ScenarioForm({ 
  scenarioId, 
  subjectId: defaultSubjectId, 
  groupId: defaultGroupId, 
  onSuccess, 
  onUpdateSuccess,
  onCancel 
}: ScenarioFormProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const utils = trpc.useUtils();
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
      // Invalidate the scenarios list
      utils.joniScenario.getAllScenarios.invalidate();
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

  const updateMutation = trpc.joniScenario.updateScenarioWithSteps.useMutation({
    onSuccess: () => {
      toast({ title: 'Success', description: 'Scenario updated successfully' });
      // Invalidate both the specific scenario and the list
      if (scenarioId) {
        utils.joniScenario.getScenarioById.invalidate(scenarioId);
      }
      utils.joniScenario.getAllScenarios.invalidate();
      // Also invalidate the steps query if it exists
      if (scenarioId) {
        utils.joniScenario.getScenarioSteps.invalidate(scenarioId);
      }
      // Use the update-specific callback if provided, otherwise use the general onSuccess
      if (onUpdateSuccess) {
        onUpdateSuccess();
      } else {
        onSuccess?.();
      }
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

      // Convert steps from database format to form format
      const formSteps: ScenarioStep[] = scenario.steps?.map(step => {
        // The backend now returns enforceComponentOrder as a separate field
        const enforceComponentOrder = step.enforceComponentOrder || false;
        
        // expectedComponents should be a regular array
        const expectedComponents = Array.isArray(step.expectedComponents) 
          ? step.expectedComponents as Array<{ component: string; value?: string; values?: string[]; required: boolean }>
          : [];
        
        return {
          id: step.id,
          eventType: step.eventType as ScenarioStep['eventType'],
          actorRole: step.actorRole || undefined,
          eventDescription: step.eventDescription,
          eventMessage: step.eventMessage || '',
          expectedComponents,
          enforceComponentOrder,
          correctResponseExample: step.correctResponseExample || '',
          nextStepCondition: step.nextStepCondition || ''
        };
      }) || [];

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
        steps: formSteps
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
      // For edit mode, update scenario with steps
      const updateData = {
        scenarioId: scenarioId!,
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
          // Include legacy fields for backward compatibility
          flightInformation: JSON.stringify(formData.flightInformation),
          expectedAnswer: formData.steps.length > 0 
            ? formData.steps[0].correctResponseExample 
            : legacyFields.expectedAnswer,
          currentStatus: legacyFields.currentStatus
        },
        steps: formData.steps.map((step, index) => ({
          id: step.id,
          stepOrder: index + 1,
          eventType: step.eventType,
          actorRole: step.actorRole,
          eventDescription: step.eventDescription,
          eventMessage: step.eventMessage,
          expectedComponents: step.expectedComponents,
          enforceComponentOrder: step.enforceComponentOrder,
          correctResponseExample: step.correctResponseExample,
          nextStepCondition: step.nextStepCondition
        }))
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
          enforceComponentOrder: step.enforceComponentOrder,
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