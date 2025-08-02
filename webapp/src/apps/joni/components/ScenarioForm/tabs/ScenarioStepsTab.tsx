import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Copy, GripVertical, X } from 'lucide-react';
import { useState } from 'react';
import type { ScenarioStep, EventType, ActorRole, ExpectedComponent } from '../../../types/scenario-practice.types';

interface ScenarioStepsTabProps {
  steps: ScenarioStep[];
  setSteps: (steps: ScenarioStep[]) => void;
}

const EVENT_TYPES: { value: EventType; label: string }[] = [
  { value: 'atc', label: 'ATC Communication' },
  { value: 'crew', label: 'Crew Interaction' },
  { value: 'cockpit', label: 'Cockpit Crew' },
  { value: 'emergency', label: 'Emergency Situation' },
  { value: 'technical', label: 'Technical Issue' },
  { value: 'weather', label: 'Weather-Related' },
  { value: 'company', label: 'Company Communication' },
  { value: 'passenger', label: 'Passenger Issue' },
];

const ACTOR_ROLES_BY_TYPE: Record<EventType, Array<{ value: ActorRole; label: string }>> = {
  atc: [
    { value: 'clearance_delivery', label: 'Clearance Delivery' },
    { value: 'ground', label: 'Ground Control' },
    { value: 'tower', label: 'Tower' },
    { value: 'departure', label: 'Departure' },
    { value: 'center', label: 'Center/Control' },
    { value: 'approach', label: 'Approach' },
    { value: 'ramp', label: 'Ramp Control' },
  ],
  crew: [
    { value: 'flight_attendant', label: 'Flight Attendant' },
    { value: 'purser', label: 'Purser' },
  ],
  cockpit: [
    { value: 'copilot', label: 'Co-pilot' },
    { value: 'relief_pilot', label: 'Relief Pilot' },
  ],
  emergency: [],
  technical: [
    { value: 'maintenance', label: 'Maintenance' },
  ],
  weather: [],
  company: [
    { value: 'dispatch', label: 'Dispatch' },
  ],
  passenger: [
    { value: 'doctor_onboard', label: 'Doctor Onboard' },
  ],
};

const COMMON_COMPONENTS = [
  'callsign',
  'altitude',
  'heading',
  'speed',
  'position',
  'intentions',
  'acknowledgment',
  'readback',
  'clearance',
  'frequency',
  'squawk',
  'runway',
  'taxiway',
  'gate',
  'souls on board',
  'fuel remaining',
  'nature of emergency',
];

export function ScenarioStepsTab({ steps, setSteps }: ScenarioStepsTabProps) {
  const [selectedStepIndex, setSelectedStepIndex] = useState<number>(0);
  const [componentInput, setComponentInput] = useState('');

  const selectedStep = steps[selectedStepIndex];

  const addStep = () => {
    const newStep: ScenarioStep = {
      id: `step-${Date.now()}`,
      stepOrder: steps.length + 1,
      eventType: 'atc',
      eventDescription: '',
      eventMessage: '',
      expectedComponents: [],
      correctResponseExample: '',
    };
    setSteps([...steps, newStep]);
    setSelectedStepIndex(steps.length);
  };

  const updateStep = (index: number, updates: Partial<ScenarioStep>) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], ...updates };
    setSteps(newSteps);
  };

  const deleteStep = (index: number) => {
    const newSteps = steps.filter((_, i) => i !== index);
    // Update step orders
    newSteps.forEach((step, i) => {
      step.stepOrder = i + 1;
    });
    setSteps(newSteps);
    if (selectedStepIndex >= newSteps.length) {
      setSelectedStepIndex(Math.max(0, newSteps.length - 1));
    }
  };

  const duplicateStep = (index: number) => {
    const stepToDuplicate = steps[index];
    const newStep: ScenarioStep = {
      ...stepToDuplicate,
      id: `step-${Date.now()}`,
      stepOrder: index + 2,
    };
    const newSteps = [
      ...steps.slice(0, index + 1),
      newStep,
      ...steps.slice(index + 1),
    ];
    // Update step orders
    newSteps.forEach((step, i) => {
      step.stepOrder = i + 1;
    });
    setSteps(newSteps);
    setSelectedStepIndex(index + 1);
  };

  const addComponent = () => {
    if (!componentInput.trim() || !selectedStep) return;
    
    const newComponent: ExpectedComponent = {
      component: componentInput.trim(),
      required: true,
    };
    
    updateStep(selectedStepIndex, {
      expectedComponents: [...selectedStep.expectedComponents, newComponent],
    });
    setComponentInput('');
  };

  const removeComponent = (componentIndex: number) => {
    if (!selectedStep) return;
    updateStep(selectedStepIndex, {
      expectedComponents: selectedStep.expectedComponents.filter((_, i) => i !== componentIndex),
    });
  };

  const toggleComponentRequired = (componentIndex: number) => {
    if (!selectedStep) return;
    const newComponents = [...selectedStep.expectedComponents];
    newComponents[componentIndex].required = !newComponents[componentIndex].required;
    updateStep(selectedStepIndex, { expectedComponents: newComponents });
  };

  return (
    <div className="grid grid-cols-3 gap-6">
      {/* Step List (Left Sidebar) */}
      <div className="space-y-2">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold">Steps</h3>
          <Button size="sm" onClick={addStep}>
            <Plus className="h-4 w-4 mr-1" />
            Add Step
          </Button>
        </div>
        
        {steps.length === 0 ? (
          <p className="text-sm text-muted-foreground">No steps yet. Click "Add Step" to begin.</p>
        ) : (
          <div className="space-y-2">
            {steps.map((step, index) => (
              <Card
                key={step.id}
                className={`cursor-pointer transition-colors ${
                  selectedStepIndex === index ? 'border-primary' : ''
                }`}
                onClick={() => setSelectedStepIndex(index)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm">Step {step.stepOrder}</span>
                        <Badge variant="secondary" className="text-xs">
                          {EVENT_TYPES.find(t => t.value === step.eventType)?.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {step.eventDescription || 'No description'}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateStep(index);
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteStep(index);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Step Editor (Main Area) */}
      <div className="col-span-2">
        {selectedStep ? (
          <Card>
            <CardHeader>
              <CardTitle>Step {selectedStep.stepOrder} Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Event Type & Actor */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Event Type</Label>
                  <Select
                    value={selectedStep.eventType}
                    onValueChange={(value: EventType) => updateStep(selectedStepIndex, { eventType: value, actorRole: undefined })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EVENT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Actor Role</Label>
                  <Select
                    value={selectedStep.actorRole || 'none'}
                    onValueChange={(value) => updateStep(selectedStepIndex, { actorRole: value === 'none' ? undefined : value as ActorRole })}
                    disabled={ACTOR_ROLES_BY_TYPE[selectedStep.eventType].length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select actor (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {ACTOR_ROLES_BY_TYPE[selectedStep.eventType].map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Event Description */}
              <div className="space-y-2">
                <Label>Event Description</Label>
                <Input
                  value={selectedStep.eventDescription}
                  onChange={(e) => updateStep(selectedStepIndex, { eventDescription: e.target.value })}
                  placeholder="What's happening in this step?"
                />
              </div>

              {/* Event Message */}
              <div className="space-y-2">
                <Label>Event Message / Dialogue</Label>
                <Textarea
                  value={selectedStep.eventMessage}
                  onChange={(e) => updateStep(selectedStepIndex, { eventMessage: e.target.value })}
                  placeholder="The actual message or dialogue that will be presented to the pilot"
                  rows={4}
                />
              </div>

              {/* Expected Components */}
              <div className="space-y-2">
                <Label>Expected Response Components</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={componentInput}
                    onChange={(e) => setComponentInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addComponent())}
                    placeholder="Add a required component"
                  />
                  <Button onClick={addComponent} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-2">
                  {selectedStep.expectedComponents.map((comp, index) => (
                    <Badge
                      key={index}
                      variant={comp.required ? 'default' : 'secondary'}
                      className="cursor-pointer"
                      onClick={() => toggleComponentRequired(index)}
                    >
                      {comp.component}
                      <button
                        className="ml-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeComponent(index);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>

                <div className="text-xs text-muted-foreground">
                  Common: {COMMON_COMPONENTS.join(', ')}
                </div>
              </div>

              {/* Correct Response Example */}
              <div className="space-y-2">
                <Label>Correct Response Example</Label>
                <Textarea
                  value={selectedStep.correctResponseExample}
                  onChange={(e) => updateStep(selectedStepIndex, { correctResponseExample: e.target.value })}
                  placeholder="Example of a correct response with proper phraseology"
                  rows={3}
                />
              </div>

              {/* Branching Logic (Advanced) */}
              <div className="space-y-2">
                <Label>Next Step Condition (Optional)</Label>
                <Input
                  value={selectedStep.nextStepCondition || ''}
                  onChange={(e) => updateStep(selectedStepIndex, { nextStepCondition: e.target.value })}
                  placeholder="Condition for branching (leave empty for sequential flow)"
                />
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            {steps.length === 0 ? 'Add a step to begin building your scenario' : 'Select a step to edit'}
          </div>
        )}
      </div>
    </div>
  );
}