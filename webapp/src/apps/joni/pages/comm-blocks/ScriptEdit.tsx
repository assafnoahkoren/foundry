import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { trpc } from '@/utils/trpc';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ScriptDAGEditor } from '../../components/ScriptDAGEditor/ScriptDAGEditor';
import { validateScriptDAG, type ScriptDAG, type ScriptNode } from '../../types/script-dag.types';

function createEmptyDAG(): ScriptDAG {
  return {
    nodes: [
      {
        id: 'start',
        type: 'transmission',
        name: 'Initial Contact',
        position: { x: 250, y: 50 },
        content: {
          type: 'transmission_ref',
          transmissionId: '',
          actorRole: 'ground',
        }
      }
    ],
    edges: [],
    metadata: {
      version: '1.0.0'
    }
  };
}

export function ScriptEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  // Check if we're creating a new script (either id is 'new' or undefined/not provided)
  const isNew = !id || id === 'new';

  const [formData, setFormData] = useState(() => {
    const shouldCreateEmpty = !id || id === 'new';
    const initialData = {
      code: '',
      name: '',
      description: '',
      scriptType: 'training' as 'training' | 'evaluation' | 'scenario' | 'adaptive',
      difficultyLevel: 3,
      estimatedMinutes: 5,
      tags: [] as string[],
      dagStructure: (shouldCreateEmpty ? createEmptyDAG() : null) as ScriptDAG | null,
      startNodeId: shouldCreateEmpty ? 'start' : ''
    };
    return initialData;
  });

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Fetch available transmissions
  const { data: transmissions } = trpc.joniComm.transmissions.list.useQuery({});

  // Fetch existing script if editing
  const queryResult = isNew 
    ? { data: null, isLoading: false }
    : trpc.joniComm.scripts.getById.useQuery(
        { id: id! },
        { enabled: !!id }
      );
  
  const { data: script, isLoading } = queryResult;

  // Update form when script loads
  useEffect(() => {
    if (script) {
      setFormData({
        code: script.code,
        name: script.name,
        description: script.description || '',
        scriptType: script.scriptType as 'training' | 'evaluation' | 'scenario' | 'adaptive',
        difficultyLevel: script.difficultyLevel,
        estimatedMinutes: script.estimatedMinutes,
        tags: script.tags || [],
        dagStructure: script.dagStructure ? validateScriptDAG(script.dagStructure) : createEmptyDAG(),
        startNodeId: script.startNodeId || 'start'
      });
    }
  }, [script]);

  const utils = trpc.useUtils();

  // Create mutation
  const createMutation = trpc.joniComm.scripts.create.useMutation({
    onSuccess: () => {
      // Invalidate and refetch scripts data
      utils.joniComm.scripts.invalidate();
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
    onSuccess: () => {
      // Invalidate and refetch scripts data
      utils.joniComm.scripts.invalidate();
      toast({
        title: 'Success',
        description: 'Script updated successfully'
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

  const handleSubmit = () => {
    if (!formData.dagStructure) {
      toast({
        title: 'Error',
        description: 'Please create a DAG structure',
        variant: 'destructive'
      });
      return;
    }

    const data = {
      ...formData,
      flightContext: {},
      learningObjectives: []
    };

    if (isNew) {
      createMutation.mutate(data);
    } else {
      updateMutation.mutate({
        id: id!,
        data
      });
    }
  };


  const handleDAGChange = (newDAG: ScriptDAG) => {
    const updatedFormData = {
      ...formData,
      dagStructure: newDAG,
      startNodeId: newDAG.nodes[0]?.id || 'start'
    };
    
    console.log('Script data changed:', updatedFormData);
    
    setFormData(updatedFormData);
  };

  const handleNodeSelect = (nodeId: string | null) => {
    setSelectedNodeId(nodeId);
  };

  const handleNodeUpdate = (nodeId: string, updates: Partial<ScriptNode>) => {
    if (!formData.dagStructure) return;
    
    const updatedNodes = formData.dagStructure.nodes.map(node => 
      node.id === nodeId ? { ...node, ...updates } : node
    );
    
    handleDAGChange({
      ...formData.dagStructure,
      nodes: updatedNodes
    });
  };

  const handleNodeDelete = (nodeId: string) => {
    if (!formData.dagStructure) return;
    
    // Remove the node and any edges connected to it
    const updatedNodes = formData.dagStructure.nodes.filter(node => node.id !== nodeId);
    const updatedEdges = formData.dagStructure.edges.filter(edge => 
      edge.from !== nodeId && edge.to !== nodeId
    );
    
    handleDAGChange({
      ...formData.dagStructure,
      nodes: updatedNodes,
      edges: updatedEdges
    });
    
    // Clear selection
    setSelectedNodeId(null);
  };

  const selectedNode = formData.dagStructure?.nodes.find(n => n.id === selectedNodeId);
  
  // Fetch selected transmission with blocks for rendering
  const selectedTransmissionId = (() => {
    if (selectedNode?.type === 'transmission' && selectedNode?.content?.type === 'transmission_ref') {
      return selectedNode.content.transmissionId;
    }
    if (selectedNode?.type === 'user_response' && selectedNode?.content?.transmissionId) {
      return selectedNode.content.transmissionId;
    }
    return null;
  })();
  
  const { data: transmissionWithBlocks } = trpc.joniComm.transmissions.getWithBlocks.useQuery(
    { id: selectedTransmissionId! },
    { enabled: !!selectedTransmissionId }
  );

  // Extract variable names from transmission blocks
  const extractVariables = () => {
    if (!transmissionWithBlocks) return [];
    
    const variableSet = new Set<string>();
    transmissionWithBlocks.populatedBlocks?.forEach((block: { template?: string }) => {
      if (block.template) {
        const matches = block.template.match(/\{\{(\w+)\}\}/g);
        if (matches) {
          matches.forEach(match => {
            const varName = match.replace(/\{\{|\}\}/g, '');
            variableSet.add(varName);
          });
        }
      }
    });
    
    return Array.from(variableSet);
  };

  // Render transmission with variables (or show template)
  const renderTransmission = () => {
    if (!transmissionWithBlocks) return '';
    
    let rendered = '';
    const variables = selectedNode?.content?.variables || {};
    
    transmissionWithBlocks.blocks?.forEach((blockRef: { blockId: string }, index: number) => {
      const block = transmissionWithBlocks.populatedBlocks?.find(
        (b: { id: string; template?: string; name: string }) => b.id === blockRef.blockId
      );
      if (block && block.template) {
        let blockText = block.template;
        // Replace variables if provided, otherwise show placeholders
        for (const [key, value] of Object.entries(variables)) {
          blockText = blockText.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value as string);
        }
        if (index > 0) rendered += ', ';
        rendered += blockText;
      }
    });
    
    return rendered || 'No blocks configured';
  };

  if (!isNew && isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-4">
        <Card>
          <CardContent className="p-8">
            <div className="text-center">Loading...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full p-4 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/joni/scripts')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <CardTitle>{isNew ? 'Create Script' : 'Edit Script'}</CardTitle>
                <CardDescription>
                  Design dynamic training scenarios with branching paths
                </CardDescription>
              </div>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isLoading || updateMutation.isLoading}
            >
              <Save className="w-4 h-4 mr-2" />
              {isNew ? 'Create' : 'Save'}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Main Content - Side by Side */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="space-y-4">
          {/* Script Settings - Always Visible */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Script Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="IFR Departure with Weather"
                />
              </div>
            </CardContent>
          </Card>
          
          {/* Node Information - Only when node is selected */}
          {selectedNode && (
            <Card className="h-fit">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Node: {selectedNode.name}</CardTitle>
                    <CardDescription>
                      Type: {selectedNode.type.replace('_', ' ')}
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleNodeDelete(selectedNode.id)}
                    title="Delete Node"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
              // Node editing form
              <>
                <div className="space-y-2">
                  <Label htmlFor="node-name">Node Name</Label>
                  <Input
                    id="node-name"
                    value={selectedNode.name}
                    onChange={(e) => handleNodeUpdate(selectedNode.id, { name: e.target.value })}
                    placeholder="Enter node name"
                  />
                </div>

                {selectedNode.type === 'transmission' && selectedNode.content?.type === 'transmission_ref' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="transmission-id">Transmission Template</Label>
                      <Select
                        value={selectedNode.content.transmissionId || ''}
                        onValueChange={(value) => handleNodeUpdate(selectedNode.id, { 
                          content: { ...selectedNode.content, transmissionId: value }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a transmission" />
                        </SelectTrigger>
                        <SelectContent>
                          {transmissions?.map((transmission) => (
                            <SelectItem key={transmission.id} value={transmission.id}>
                              <div className="flex flex-col py-1">
                                <span>{transmission.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {transmission.code} • {transmission.transmissionType} • {transmission.context}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Render transmission preview */}
                    {transmissionWithBlocks && (
                      <div className="space-y-2">
                        <Label>Transmission Preview</Label>
                        <div className="p-3 bg-muted rounded-md">
                          <p className="text-sm font-mono whitespace-pre-wrap">
                            {renderTransmission()}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {transmissionWithBlocks.populatedBlocks?.map((block: { id: string; name: string }) => (
                              <Badge key={block.id} variant="secondary" className="text-xs">
                                {block.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="actor-role">Actor Role</Label>
                      <Select
                        value={selectedNode.content.actorRole || 'ground'}
                        onValueChange={(value) => handleNodeUpdate(selectedNode.id, {
                          content: { ...selectedNode.content, actorRole: value }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ground">Ground</SelectItem>
                          <SelectItem value="tower">Tower</SelectItem>
                          <SelectItem value="departure">Departure</SelectItem>
                          <SelectItem value="approach">Approach</SelectItem>
                          <SelectItem value="center">Center</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                {selectedNode.type === 'event' && (
                  <div className="space-y-2">
                    <Label htmlFor="event-desc">Event Description</Label>
                    <Textarea
                      id="event-desc"
                      value={selectedNode.content?.description || ''}
                      onChange={(e) => handleNodeUpdate(selectedNode.id, {
                        content: { ...selectedNode.content, description: e.target.value }
                      })}
                      placeholder="Describe the event..."
                      rows={3}
                    />
                  </div>
                )}

                {selectedNode.type === 'decision_point' && (
                  <div className="space-y-2">
                    <Label htmlFor="decision-desc">Decision Description</Label>
                    <Textarea
                      id="decision-desc"
                      value={selectedNode.content?.prompt || ''}
                      onChange={(e) => handleNodeUpdate(selectedNode.id, {
                        content: { ...selectedNode.content, prompt: e.target.value }
                      })}
                      placeholder="What decision should the pilot make?"
                      rows={3}
                    />
                  </div>
                )}

                {selectedNode.type === 'user_response' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="user-transmission">Expected Transmission</Label>
                      <Select
                        value={selectedNode.content?.transmissionId || ''}
                        onValueChange={(value) => handleNodeUpdate(selectedNode.id, {
                          content: { ...selectedNode.content, transmissionId: value }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select expected user transmission" />
                        </SelectTrigger>
                        <SelectContent>
                          {transmissions?.map((transmission) => (
                            <SelectItem key={transmission.id} value={transmission.id}>
                              <div className="flex flex-col py-1">
                                <span>{transmission.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {transmission.code} • {transmission.transmissionType}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Comm Block Variables */}
                    {transmissionWithBlocks && selectedNode.content?.transmissionId && extractVariables().length > 0 && (
                      <div className="space-y-2">
                        <Label>Comm Block Variables</Label>
                        <div className="space-y-2">
                          {extractVariables().map((varName) => (
                            <div key={varName} className="flex flex-col space-y-1">
                              <Label htmlFor={`var-${varName}`} className="text-xs">
                                {varName}
                              </Label>
                              <Input
                                id={`var-${varName}`}
                                value={selectedNode.content?.variables?.[varName] || ''}
                                onChange={(e) => {
                                  const currentVars = selectedNode.content?.variables || {};
                                  handleNodeUpdate(selectedNode.id, {
                                    content: {
                                      ...selectedNode.content,
                                      variables: {
                                        ...currentVars,
                                        [varName]: e.target.value
                                      }
                                    }
                                  });
                                }}
                                placeholder={`Enter value for {{${varName}}}`}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Render expected transmission preview */}
                    {transmissionWithBlocks && selectedNode.content?.transmissionId && (
                      <div className="space-y-2">
                        <Label>Expected Transmission Preview</Label>
                        <div className="p-3 bg-muted rounded-md">
                          <p className="text-sm font-mono whitespace-pre-wrap">
                            {renderTransmission()}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {transmissionWithBlocks.populatedBlocks?.map((block: { id: string; name: string }) => (
                              <Badge key={block.id} variant="secondary" className="text-xs">
                                {block.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
              </CardContent>
            </Card>
          )}
        </div>

        {/* DAG Editor */}
        <Card className="h-full min-h-[700px] xl:col-span-3">
        <CardHeader>
          <CardTitle>Scenario Flow</CardTitle>
          <CardDescription>
            Design the flow of your scenario with nodes and edges. Drag to pan, scroll to zoom.
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[calc(100%-5rem)]">
          <div className="h-full min-h-[600px] border rounded-lg">
            {formData.dagStructure && (
              <ScriptDAGEditor
                dag={formData.dagStructure}
                onChange={handleDAGChange}
                onNodeSelect={handleNodeSelect}
                selectedNodeId={selectedNodeId}
                readOnly={false}
              />
            )}
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}