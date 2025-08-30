import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { trpc } from '@/utils/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { Save, ArrowLeft, Plus, Trash2, AlertCircle, MoveUp, MoveDown, Mic, Clock, Target, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { editorContentToString } from '../../utils/editorContentUtils';
import type { EditorJSONContent } from '../../components/CommBlockEditor';

interface ScriptTransmission {
  transmissionId: string;
  orderInScript: number;
  actorRole: 'pilot' | 'tower' | 'ground' | 'approach' | 'departure' | 'center';
  expectedDelay?: number;
  triggerCondition?: string;
}

interface ScriptFormData {
  code: string;
  name: string;
  description: string;
  scriptType: 'training' | 'evaluation' | 'scenario';
  phase: 'ground' | 'departure' | 'enroute' | 'approach' | 'emergency';
  difficultyLevel: number;
  estimatedMinutes: number;
  flightContext: Record<string, unknown>;
  learningObjectives: string[];
  prerequisites: Array<{
    type: 'script' | 'commBlock';
    id: string;
    name?: string;
    minScore?: number;
  }>;
  variables?: Record<string, string>; // Store variable values for the script
}

export function ScriptForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  const utils = trpc.useUtils();

  const [formData, setFormData] = useState<ScriptFormData>({
    code: '',
    name: '',
    description: '',
    scriptType: 'training',
    phase: 'ground',
    difficultyLevel: 3,
    estimatedMinutes: 5,
    flightContext: {},
    learningObjectives: [],
    prerequisites: []
  });

  const [transmissions, setTransmissions] = useState<ScriptTransmission[]>([]);
  const [flightContextJson, setFlightContextJson] = useState('{}');
  const [selectedTransmissionToAdd, setSelectedTransmissionToAdd] = useState<string>('');
  const [selectedActorRole, setSelectedActorRole] = useState<ScriptTransmission['actorRole']>('pilot');
  const [expectedDelay, setExpectedDelay] = useState<number>(0);
  const [newObjective, setNewObjective] = useState('');
  const [scriptVariables, setScriptVariables] = useState<Record<string, string>>({});
  const [variablesByTransmission, setVariablesByTransmission] = useState<Record<string, { transmissionName: string; blocks: Array<{ blockName: string; variables: string[] }> }>>({});

  // Fetch available transmission templates
  const { data: availableTransmissions } = trpc.joniComm.transmissions.list.useQuery({
    orderBy: 'context',
    orderDirection: 'asc'
  });

  // Fetch all comm blocks to get their templates
  const { data: allCommBlocks } = trpc.joniComm.blocks.list.useQuery({});

  // Fetch variables from selected transmissions
  const transmissionIds = transmissions.map(t => t.transmissionId);
  const { data: variablesData } = trpc.joniComm.scripts.getVariablesFromTransmissions.useQuery(
    { transmissionIds },
    { enabled: transmissionIds.length > 0 }
  );

  useEffect(() => {
    if (variablesData) {
      setVariablesByTransmission(variablesData.variablesByTransmission);
      // Initialize variables if not already set
      setScriptVariables(prev => {
        const newVariables: Record<string, string> = {};
        variablesData.variables.forEach(variable => {
          if (!prev[variable]) {
            newVariables[variable] = '';
          }
        });
        if (Object.keys(newVariables).length > 0) {
          return { ...prev, ...newVariables };
        }
        return prev;
      });
    }
  }, [variablesData]);

  // Fetch existing script data if in edit mode
  const { data: existingScript } = trpc.joniComm.scripts.getById.useQuery(
    { id: id! },
    { enabled: isEditMode }
  );

  useEffect(() => {
    if (existingScript) {
      setFormData({
        code: existingScript.code,
        name: existingScript.name,
        description: existingScript.description || '',
        scriptType: existingScript.scriptType as 'training' | 'evaluation' | 'scenario',
        phase: existingScript.phase as 'ground' | 'departure' | 'enroute' | 'approach' | 'emergency',
        difficultyLevel: existingScript.difficultyLevel,
        estimatedMinutes: existingScript.estimatedMinutes,
        flightContext: (existingScript.flightContext || {}) as Record<string, unknown>,
        learningObjectives: Array.isArray(existingScript.learningObjectives) 
          ? existingScript.learningObjectives as string[] 
          : [],
        prerequisites: Array.isArray(existingScript.prerequisites) 
          ? existingScript.prerequisites as Array<{
              type: 'script' | 'commBlock';
              id: string;
              name?: string;
              minScore?: number;
            }>
          : []
      });
      setFlightContextJson(JSON.stringify(existingScript.flightContext || {}, null, 2));
      
      // Load existing variables from flight context
      const existingFlightContext = existingScript.flightContext as Record<string, unknown>;
      if (existingFlightContext?.variables && typeof existingFlightContext.variables === 'object') {
        setScriptVariables(existingFlightContext.variables as Record<string, string>);
      }
      
      // Set transmissions if they exist
      if (existingScript.transmissions) {
        interface TransmissionData {
          transmissionId?: string;
          transmission?: { id: string };
          orderInScript: number;
          actorRole: ScriptTransmission['actorRole'];
          expectedDelay?: number;
          triggerCondition?: string;
        }
        const scriptTransmissions = (existingScript as { transmissions: TransmissionData[] }).transmissions.map((t) => ({
          transmissionId: t.transmissionId || t.transmission?.id,
          orderInScript: t.orderInScript,
          actorRole: t.actorRole,
          expectedDelay: t.expectedDelay || undefined,
          triggerCondition: t.triggerCondition || undefined
        }));
        setTransmissions(scriptTransmissions);
      }
    }
  }, [existingScript]);

  // Create mutation
  const createMutation = trpc.joniComm.scripts.create.useMutation({
    onSuccess: async (script) => {
      // Add transmissions to the script
      if (transmissions.length > 0) {
        for (const transmission of transmissions) {
          await addTransmissionMutation.mutateAsync({
            scriptId: script.id,
            transmission: {
              ...transmission,
              expectedDelay: transmission.expectedDelay || undefined,
              triggerCondition: transmission.triggerCondition || undefined
            }
          });
        }
      }
      
      toast({
        title: 'Success',
        description: 'Script created successfully'
      });
      navigate('/joni/scripts');
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Update mutation
  const updateMutation = trpc.joniComm.scripts.update.useMutation({
    onSuccess: async () => {
      // Update transmissions after updating the script
      if (isEditMode) {
        try {
          // Use the new replaceTransmissions endpoint for atomic update
          await replaceTransmissionsMutation.mutateAsync({
            scriptId: id!,
            transmissions: transmissions.map(t => ({
              ...t,
              expectedDelay: t.expectedDelay || undefined,
              triggerCondition: t.triggerCondition || undefined
            }))
          });
        } catch (error) {
          console.error('Error updating transmissions:', error);
          toast({
            title: 'Error updating transmissions',
            description: 'Some transmissions may not have been updated correctly',
            variant: 'destructive'
          });
        }
      }
      
      // Invalidate queries to refresh the data
      await utils.joniComm.scripts.getById.invalidate({ id: id! });
      await utils.joniComm.scripts.list.invalidate();
      
      toast({
        title: 'Success',
        description: 'Script updated successfully'
      });
      // Don't navigate away - stay on the same page
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Add transmission mutation
  const addTransmissionMutation = trpc.joniComm.scripts.addTransmission.useMutation();
  
  // Replace all transmissions mutation (for updates)
  const replaceTransmissionsMutation = trpc.joniComm.scripts.replaceTransmissions.useMutation();

  const handleSubmit = () => {
    try {
      const flightContext = JSON.parse(flightContextJson);
      
      if (transmissions.length === 0) {
        toast({
          title: 'Error',
          description: 'Please add at least one transmission to the script',
          variant: 'destructive'
        });
        return;
      }

      // Add variables to flight context if any exist
      const finalFlightContext = {
        ...flightContext,
        ...(Object.keys(scriptVariables).length > 0 && { variables: scriptVariables })
      };

      if (isEditMode) {
        updateMutation.mutate({
          id: id!,
          data: {
            ...formData,
            flightContext: finalFlightContext
          }
        });
      } else {
        createMutation.mutate({
          ...formData,
          flightContext: finalFlightContext
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Invalid JSON in flight context field',
        variant: 'destructive'
      });
    }
  };

  const addTransmission = () => {
    if (!selectedTransmissionToAdd) return;

    // Calculate the next order number (max existing order + 1)
    const maxOrder = transmissions.length > 0 
      ? Math.max(...transmissions.map(t => t.orderInScript))
      : 0;

    const newTransmission: ScriptTransmission = {
      transmissionId: selectedTransmissionToAdd,
      orderInScript: maxOrder + 1,
      actorRole: selectedActorRole,
      expectedDelay: expectedDelay || undefined,
      triggerCondition: undefined
    };

    setTransmissions([...transmissions, newTransmission]);
    setSelectedTransmissionToAdd('');
    setExpectedDelay(0);
  };

  const removeTransmission = (index: number) => {
    const newTransmissions = transmissions.filter((_, i) => i !== index);
    // Reorder remaining transmissions
    newTransmissions.forEach((trans, i) => {
      trans.orderInScript = i + 1;
    });
    setTransmissions(newTransmissions);
  };

  const moveTransmission = (index: number, direction: 'up' | 'down') => {
    const newTransmissions = [...transmissions];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newTransmissions.length) return;

    // Swap transmissions
    [newTransmissions[index], newTransmissions[targetIndex]] = 
    [newTransmissions[targetIndex], newTransmissions[index]];
    
    // Update order numbers
    newTransmissions.forEach((trans, i) => {
      trans.orderInScript = i + 1;
    });

    setTransmissions(newTransmissions);
  };

  const getTransmissionName = (transmissionId: string) => {
    const transmission = availableTransmissions?.find(t => t.id === transmissionId);
    return transmission?.name || 'Unknown Transmission';
  };

  const getTransmissionType = (transmissionId: string) => {
    const transmission = availableTransmissions?.find(t => t.id === transmissionId);
    return transmission?.transmissionType || 'unknown';
  };

  const addObjective = () => {
    if (newObjective.trim()) {
      setFormData({
        ...formData,
        learningObjectives: [...formData.learningObjectives, newObjective.trim()]
      });
      setNewObjective('');
    }
  };

  const removeObjective = (index: number) => {
    setFormData({
      ...formData,
      learningObjectives: formData.learningObjectives.filter((_, i) => i !== index)
    });
  };

  const getActorIcon = (role: string) => {
    return role === 'pilot' ? '✈️' : '🎧';
  };

  // Get transmission template using editor content
  const getTransmissionTemplate = (transmissionId: string): string | null => {
    const transmission = availableTransmissions?.find(t => t.id === transmissionId);
    if (!transmission) return null;

    // Check if transmission has editor content in metadata
    const metadata = transmission.metadata as Record<string, unknown>;
    const editorContent = metadata?.editorContent as EditorJSONContent | undefined;
    
    if (editorContent) {
      // Use the new editor content to generate the template string
      return editorContentToString(editorContent);
    }
    
    // Fallback: If no editor content, try to build from blocks
    if (!allCommBlocks) return null;
    
    interface TransmissionBlock {
      blockId: string;
      order: number;
      parameters?: Record<string, unknown>;
      isOptional?: boolean;
    }
    
    const blocks = transmission.blocks as TransmissionBlock[];
    if (!blocks || !Array.isArray(blocks)) return null;

    // Sort blocks by order and get their codes
    const sortedBlocks = [...blocks].sort((a, b) => a.order - b.order);
    const blockCodes: string[] = [];

    for (const block of sortedBlocks) {
      const commBlock = allCommBlocks.find(cb => cb.id === block.blockId);
      if (commBlock?.code) {
        blockCodes.push(`{${commBlock.code}}`);
      }
    }

    return blockCodes.length > 0 ? blockCodes.join(' ') : null;
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>
                {isEditMode ? 'Edit Training Script' : 'Create Training Script'}
              </CardTitle>
              <CardDescription>
                Define a complete training scenario with multiple transmission exchanges
              </CardDescription>
            </div>
            <Button variant="outline" onClick={() => navigate('/joni/scripts')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to List
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Form */}
      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="basic" className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="transmissions">Transmissions</TabsTrigger>
              <TabsTrigger value="variables" disabled={!variablesData?.variables.length}>
                Variables {variablesData?.variables.length ? `(${variablesData.variables.length})` : ''}
              </TabsTrigger>
              <TabsTrigger value="objectives">Learning Objectives</TabsTrigger>
              <TabsTrigger value="context">Flight Context</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Code *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g., vfr_pattern_work"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., VFR Pattern Work"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the training scenario and its purpose"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Script Type *</Label>
                  <Select
                    value={formData.scriptType}
                    onValueChange={(value) => setFormData({ ...formData, scriptType: value as 'training' | 'evaluation' | 'scenario' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="training">Training</SelectItem>
                      <SelectItem value="evaluation">Evaluation</SelectItem>
                      <SelectItem value="scenario">Scenario</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phase">Flight Phase *</Label>
                  <Select
                    value={formData.phase}
                    onValueChange={(value) => setFormData({ ...formData, phase: value as 'ground' | 'departure' | 'enroute' | 'approach' | 'emergency' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ground">Ground</SelectItem>
                      <SelectItem value="departure">Departure</SelectItem>
                      <SelectItem value="enroute">Enroute</SelectItem>
                      <SelectItem value="approach">Approach</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty Level *</Label>
                  <Select
                    value={formData.difficultyLevel.toString()}
                    onValueChange={(value) => setFormData({ ...formData, difficultyLevel: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Level 1 - Beginner</SelectItem>
                      <SelectItem value="2">Level 2 - Easy</SelectItem>
                      <SelectItem value="3">Level 3 - Intermediate</SelectItem>
                      <SelectItem value="4">Level 4 - Advanced</SelectItem>
                      <SelectItem value="5">Level 5 - Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Estimated Duration (minutes) *
                    </div>
                  </Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.estimatedMinutes}
                    onChange={(e) => setFormData({ ...formData, estimatedMinutes: parseInt(e.target.value) || 5 })}
                    min="1"
                    max="120"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="transmissions" className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Add transmissions in the order they occur during the scenario.
                  Specify who speaks (pilot/ATC) and any delays between transmissions.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="grid grid-cols-[1fr,200px,150px,100px] gap-2">
                  <Select value={selectedTransmissionToAdd} onValueChange={setSelectedTransmissionToAdd}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a transmission template" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTransmissions?.map((trans) => (
                        <SelectItem key={trans.id} value={trans.id}>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {trans.context}
                            </Badge>
                            {trans.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedActorRole} onValueChange={(value) => setSelectedActorRole(value as ScriptTransmission['actorRole'])}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pilot">Pilot</SelectItem>
                      <SelectItem value="tower">Tower</SelectItem>
                      <SelectItem value="ground">Ground</SelectItem>
                      <SelectItem value="approach">Approach</SelectItem>
                      <SelectItem value="departure">Departure</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    placeholder="Delay (s)"
                    value={expectedDelay}
                    onChange={(e) => setExpectedDelay(parseInt(e.target.value) || 0)}
                    min="0"
                  />
                  <Button onClick={addTransmission} disabled={!selectedTransmissionToAdd}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  {transmissions.length === 0 ? (
                    <Card>
                      <CardContent className="text-center py-8 text-muted-foreground">
                        <Mic className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No transmissions added yet</p>
                        <p className="text-sm mt-2">Add transmissions to build your training script</p>
                      </CardContent>
                    </Card>
                  ) : (
                    transmissions.map((trans, index) => (
                      <Card key={index}>
                        <CardContent className="flex items-center gap-4 p-4">
                          <div className="flex flex-col gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => moveTransmission(index, 'up')}
                              disabled={index === 0}
                            >
                              <MoveUp className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => moveTransmission(index, 'down')}
                              disabled={index === transmissions.length - 1}
                            >
                              <MoveDown className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">{trans.orderInScript}</Badge>
                              <span className="text-xl">{getActorIcon(trans.actorRole)}</span>
                              <Badge variant="outline">{trans.actorRole}</Badge>
                              <span className="font-medium">{getTransmissionName(trans.transmissionId)}</span>
                              {trans.expectedDelay && trans.expectedDelay > 0 && (
                                <Badge variant="outline" className="ml-auto">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {trans.expectedDelay}s delay
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              Type: {getTransmissionType(trans.transmissionId)}
                            </div>
                            {(() => {
                              const template = getTransmissionTemplate(trans.transmissionId);
                              return template ? (
                                <div className="mt-2 p-2 bg-muted rounded text-sm">
                                  <span className="text-muted-foreground">Template: </span>
                                  <code className="font-mono">{template}</code>
                                </div>
                              ) : null;
                            })()}
                          </div>
                          <div className="flex items-center gap-1">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => navigate(`/joni/transmissions/${trans.transmissionId}`)}
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>View/Edit transmission template</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeTransmission(index)}
                                  >
                                    <Trash2 className="w-4 h-4 text-destructive" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Remove from script</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="variables" className="space-y-4">
              {variablesData?.variables.length ? (
                <>
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Fill in values for the template variables used in the communication blocks.
                      These values will be used when rendering the script.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-6">
                    {/* Show variables grouped by transmission */}
                    {Object.entries(variablesByTransmission).map(([transmissionId, transmissionData]) => {
                      const transmission = availableTransmissions?.find(t => t.id === transmissionId);
                      if (!transmissionData.blocks.length) return null;

                      return (
                        <div key={transmissionId} className="space-y-3">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{transmissionData.transmissionName}</h4>
                            <Badge variant="outline" className="text-xs">
                              {transmission?.context}
                            </Badge>
                          </div>
                          
                          {transmissionData.blocks.map((block, blockIndex) => (
                            <div key={blockIndex} className="ml-4 space-y-2">
                              <p className="text-sm text-muted-foreground">{block.blockName}</p>
                              <div className="ml-4 grid grid-cols-2 gap-4">
                                {block.variables.map(variable => (
                                  <div key={variable} className="space-y-2">
                                    <Label htmlFor={`var-${variable}`}>
                                      {`{{${variable}}}`}
                                    </Label>
                                    <Input
                                      id={`var-${variable}`}
                                      value={scriptVariables[variable] || ''}
                                      onChange={(e) => setScriptVariables(prev => ({
                                        ...prev,
                                        [variable]: e.target.value
                                      }))}
                                      placeholder={`Enter value for ${variable}`}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                          
                          {Object.keys(variablesByTransmission).indexOf(transmissionId) < 
                           Object.keys(variablesByTransmission).length - 1 && (
                            <Separator className="my-4" />
                          )}
                        </div>
                      );
                    })}

                    {/* Show all unique variables in a summary section */}
                    <div className="mt-6 p-4 bg-secondary rounded">
                      <h4 className="font-medium mb-3">All Variables Summary</h4>
                      <div className="grid grid-cols-3 gap-3">
                        {variablesData.variables.map(variable => (
                          <div key={variable} className="flex items-center gap-2">
                            <Badge variant={scriptVariables[variable] ? 'default' : 'outline'}>
                              {variable}
                            </Badge>
                            {scriptVariables[variable] && (
                              <span className="text-sm text-muted-foreground">
                                = {scriptVariables[variable]}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No variables found in the selected transmissions.</p>
                  <p className="text-sm mt-2">Variables are defined in communication block templates using {`{{variableName}}`} format.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="objectives" className="space-y-4">
              <Alert>
                <Target className="h-4 w-4" />
                <AlertDescription>
                  Define what skills and knowledge trainees should gain from this script.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newObjective}
                    onChange={(e) => setNewObjective(e.target.value)}
                    placeholder="Enter a learning objective"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addObjective())}
                  />
                  <Button onClick={addObjective} type="button">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Objective
                  </Button>
                </div>
                <div className="space-y-2">
                  {formData.learningObjectives.map((objective, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-secondary rounded">
                      <Target className="w-4 h-4 text-muted-foreground" />
                      <span className="flex-1">{objective}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeObjective(index)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                  {formData.learningObjectives.length === 0 && (
                    <p className="text-muted-foreground text-center py-4">
                      No learning objectives added yet
                    </p>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="context" className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Define the flight context in JSON format. Include aircraft type, route, weather conditions, etc.
                </AlertDescription>
              </Alert>
              <div className="space-y-2">
                <Label htmlFor="context">Flight Context (JSON)</Label>
                <Textarea
                  id="context"
                  value={flightContextJson}
                  onChange={(e) => setFlightContextJson(e.target.value)}
                  placeholder='{"aircraft": "Cessna 172", "airport": "KJFK", "weather": "VFR", "traffic": "Moderate"}'
                  rows={10}
                  className="font-mono text-sm"
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-4 mt-6">
            <Button variant="outline" onClick={() => navigate('/joni/scripts')}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              <Save className="w-4 h-4 mr-2" />
              {isEditMode ? 'Update' : 'Create'} Script
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}