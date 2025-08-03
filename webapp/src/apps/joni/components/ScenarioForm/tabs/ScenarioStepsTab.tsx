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
import { expectedComponentsData, getComponentsByCategory } from '@/apps/joni/data/expected-components';

interface ScenarioStepsTabProps {
  steps: ScenarioStep[];
  setSteps: (steps: ScenarioStep[]) => void;
}

const EVENT_TYPES: { value: EventType; label: string }[] = [
  { value: 'atc', label: 'ATC Communication' },
  { value: 'crew', label: 'Crew Interaction' },
  { value: 'cockpit', label: 'Cockpit Crew' },
  { value: 'situation', label: 'Pilot Action Required' },
  { value: 'self_initiation', label: 'Self Initiation' },
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
  situation: [], // No specific actor for situations
  self_initiation: [], // No specific actor for self-initiated communications
};

// Group components by category for better organization
const componentCategories = [
  'Basic',
  'Clearance', 
  'Acknowledgment',
  'Position Report',
  'Standard Phraseology',
  'Emergency',
  'Numbers'
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
      enforceComponentOrder: false,
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

  const addComponent = (componentName?: string) => {
    const component = componentName || componentInput.trim();
    if (component && selectedStep) {
      // Check if component already exists
      const exists = selectedStep.expectedComponents.some(c => c.component === component);
      if (!exists) {
        const componentData = expectedComponentsData.find(c => c.component === component);
        const newComponent: ExpectedComponent = {
          component: component,
          required: componentData?.required !== false, // Default to true unless explicitly false
          values: [] // Initialize with empty array for multiple values
        };
        updateStep(selectedStepIndex, {
          expectedComponents: [...selectedStep.expectedComponents, newComponent]
        });
      }
      setComponentInput('');
    }
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
                  placeholder={(selectedStep.eventType === 'situation' || selectedStep.eventType === 'self_initiation')
                    ? "Describe the situation requiring pilot action (e.g., 'Aircraft ready for pushback')"
                    : "What's happening in this step?"}
                />
                {(selectedStep.eventType === 'situation' || selectedStep.eventType === 'self_initiation') && (
                  <p className="text-xs text-muted-foreground">
                    For {selectedStep.eventType === 'self_initiation' ? 'self-initiation' : 'situation'} steps, the pilot must initiate communication. No message will be presented.
                  </p>
                )}
              </div>

              {/* Event Message */}
              {selectedStep.eventType !== 'situation' && selectedStep.eventType !== 'self_initiation' ? (
                <div className="space-y-2">
                  <Label>Event Message / Dialogue</Label>
                  <Textarea
                    value={selectedStep.eventMessage}
                    onChange={(e) => updateStep(selectedStepIndex, { eventMessage: e.target.value })}
                    placeholder="The actual message or dialogue that will be presented to the pilot"
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    This is the message that {selectedStep.actorRole || selectedStep.eventType} will transmit to the pilot.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Event Message / Dialogue</Label>
                  <div className="p-3 border border-dashed rounded-md bg-muted/50">
                    <p className="text-sm text-muted-foreground">
                      No message needed - the pilot initiates communication in {selectedStep.eventType === 'self_initiation' ? 'self-initiation' : 'situation'} steps.
                    </p>
                  </div>
                </div>
              )}

              {/* Expected Components */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Expected Response Components (ICAO Standards)</Label>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="enforce-order" className="text-sm font-normal cursor-pointer">
                      Enforce component order
                    </Label>
                    <button
                      id="enforce-order"
                      type="button"
                      role="switch"
                      aria-checked={selectedStep.enforceComponentOrder || false}
                      onClick={() => updateStep(selectedStepIndex, { enforceComponentOrder: !selectedStep.enforceComponentOrder })}
                      className={`
                        relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                        ${selectedStep.enforceComponentOrder ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}
                      `}
                    >
                      <span className="sr-only">Enforce component order</span>
                      <span
                        className={`
                          inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                          ${selectedStep.enforceComponentOrder ? 'translate-x-6' : 'translate-x-1'}
                        `}
                      />
                    </button>
                  </div>
                </div>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={componentInput}
                    onChange={(e) => setComponentInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addComponent();
                      }
                    }}
                    placeholder="Type component name (e.g., callsign, altitude)"
                  />
                  <Button onClick={() => addComponent()} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Quick add common components */}
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Quick add ICAO components:</p>
                  <div className="flex flex-wrap gap-1">
                    {['callsign', 'altitude', 'heading', 'roger', 'wilco', 'affirm', 'negative', 'readback_altitude', 'readback_heading', 'mayday', 'pan_pan'].map(comp => {
                      const isSelected = selectedStep.expectedComponents.some(c => c.component === comp);
                      return (
                        <Button
                          key={comp}
                          variant={isSelected ? "secondary" : "outline"}
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => !isSelected && addComponent(comp)}
                          disabled={isSelected}
                        >
                          {comp}
                        </Button>
                      );
                    })}
                  </div>
                  <details className="text-xs">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">View all ICAO components...</summary>
                    <div className="mt-2 space-y-2 pl-2">
                      {componentCategories.map(category => (
                        <div key={category}>
                          <p className="font-semibold text-muted-foreground mb-1">{category}:</p>
                          <div className="flex flex-wrap gap-1">
                            {getComponentsByCategory(category).map(comp => {
                              const isSelected = selectedStep.expectedComponents.some(c => c.component === comp.component);
                              return (
                                <Button
                                  key={comp.component}
                                  variant={isSelected ? "secondary" : "outline"} 
                                  size="sm"
                                  className="h-6 text-xs px-2"
                                  onClick={() => !isSelected && addComponent(comp.component)}
                                  disabled={isSelected}
                                  title={`${comp.description}${comp.icaoRule ? ` (Rule ${comp.icaoRule})` : ''}`}
                                >
                                  {comp.component}
                                  {comp.icaoRule && <span className="ml-1 opacity-50">({comp.icaoRule})</span>}
                                </Button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
                
                <div className="space-y-2">
                  {selectedStep.expectedComponents.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground mb-2">
                        Added components (click badge to toggle required/optional):
                      </p>
                      {selectedStep.expectedComponents.map((comp, index) => {
                        const componentData = expectedComponentsData.find(c => c.component === comp.component);
                        return (
                          <div key={index} className="flex items-center gap-2">
                            <Badge
                              variant={comp.required ? 'default' : 'secondary'}
                              className="cursor-pointer min-w-fit"
                              onClick={() => toggleComponentRequired(index)}
                              title="Click to toggle required/optional"
                            >
                              <span className="font-mono text-xs">{comp.component}</span>
                              {componentData?.icaoRule && (
                                <span className="ml-1 text-xs opacity-70">({componentData.icaoRule})</span>
                              )}
                            </Badge>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                {/* Input for adding new values */}
                                <Input
                                  placeholder={`Add value (e.g., ${
                                    comp.component === 'callsign' ? 'BAW123' :
                                    comp.component === 'altitude' ? '5000' :
                                    comp.component === 'flight_level' ? 'FL350' :
                                    comp.component === 'heading' ? '090' :
                                    comp.component === 'squawk_code' ? '1234' :
                                    'specific value'
                                  })`}
                                  className="h-8 text-sm w-48"
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      const value = e.currentTarget.value.trim();
                                      if (value) {
                                        const newComponents = [...selectedStep.expectedComponents];
                                        if (!newComponents[index].values) {
                                          newComponents[index].values = [];
                                        }
                                        if (!newComponents[index].values.includes(value)) {
                                          newComponents[index].values.push(value);
                                        }
                                        updateStep(selectedStepIndex, { expectedComponents: newComponents });
                                        e.currentTarget.value = '';
                                      }
                                    }
                                  }}
                                />
                                {/* Display existing values - support both old value and new values array */}
                                {(comp.values || (comp.value ? [comp.value] : [])).map((val, valIndex) => (
                                  <Badge
                                    key={valIndex}
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {val}
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-4 w-4 ml-1 p-0"
                                      onClick={() => {
                                        const newComponents = [...selectedStep.expectedComponents];
                                        newComponents[index].values = newComponents[index].values?.filter((_, i) => i !== valIndex) || [];
                                        updateStep(selectedStepIndex, { expectedComponents: newComponents });
                                      }}
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </Badge>
                                ))}
                              </div>
                              {comp.values && comp.values.length > 0 && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Any of these values will be accepted (OR relationship)
                                </p>
                              )}
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => removeComponent(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  <p className="text-xs text-muted-foreground">
                    Components marked as <span className="font-semibold">required</span> must be included in the pilot's response. 
                    For components with multiple values, any one of the values will be accepted.
                    {selectedStep.enforceComponentOrder && (
                      <span className="block mt-1 text-yellow-600 dark:text-yellow-400">
                        ⚠️ Component order enforcement is ON - components must appear in the order listed above.
                      </span>
                    )}
                  </p>
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