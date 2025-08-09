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
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { Save, ArrowLeft, Plus, Trash2, AlertCircle, MoveUp, MoveDown, Radio, Clock, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface TransmissionBlock {
  blockId: string;
  order: number;
  parameters: Record<string, unknown>;
  isOptional: boolean;
}

interface TransmissionFormData {
  code: string;
  name: string;
  description: string;
  transmissionType: 'pilot_to_atc' | 'atc_to_pilot';
  context: 'ground' | 'tower' | 'departure' | 'approach' | 'enroute' | 'emergency';
  difficultyLevel: number;
  estimatedSeconds: number;
  blocks: TransmissionBlock[];
  metadata: Record<string, unknown>;
}

export function TransmissionForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [formData, setFormData] = useState<TransmissionFormData>({
    code: '',
    name: '',
    description: '',
    transmissionType: 'pilot_to_atc',
    context: 'ground',
    difficultyLevel: 2,
    estimatedSeconds: 10,
    blocks: [],
    metadata: {}
  });

  const [metadataJson, setMetadataJson] = useState('{}');
  const [selectedBlockToAdd, setSelectedBlockToAdd] = useState<string>('');

  // Fetch available comm blocks
  const { data: availableBlocks } = trpc.joniComm.blocks.list.useQuery({
    orderBy: 'category',
    orderDirection: 'asc'
  });

  // Fetch existing transmission data if in edit mode
  const { data: existingTransmission } = trpc.joniComm.transmissions.getById.useQuery(
    { id: id! },
    { enabled: isEditMode }
  );

  useEffect(() => {
    if (existingTransmission) {
      setFormData({
        code: existingTransmission.code,
        name: existingTransmission.name,
        description: existingTransmission.description || '',
        transmissionType: existingTransmission.transmissionType as 'pilot_to_atc' | 'atc_to_pilot',
        context: existingTransmission.context as 'ground' | 'tower' | 'departure' | 'approach' | 'enroute' | 'emergency',
        difficultyLevel: existingTransmission.difficultyLevel,
        estimatedSeconds: existingTransmission.estimatedSeconds,
        blocks: Array.isArray(existingTransmission.blocks) ? existingTransmission.blocks as TransmissionBlock[] : [],
        metadata: (existingTransmission.metadata || {}) as Record<string, unknown>
      });
      setMetadataJson(JSON.stringify(existingTransmission.metadata || {}, null, 2));
    }
  }, [existingTransmission]);

  // Create mutation
  const createMutation = trpc.joniComm.transmissions.create.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Transmission template created successfully'
      });
      navigate('/joni/transmissions');
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
  const updateMutation = trpc.joniComm.transmissions.update.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Transmission template updated successfully'
      });
      navigate('/joni/transmissions');
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
    try {
      const metadata = JSON.parse(metadataJson);
      
      if (formData.blocks.length === 0) {
        toast({
          title: 'Error',
          description: 'Please add at least one communication block',
          variant: 'destructive'
        });
        return;
      }

      if (isEditMode) {
        updateMutation.mutate({
          id: id!,
          data: {
            ...formData,
            metadata
          }
        });
      } else {
        createMutation.mutate({
          ...formData,
          metadata
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Invalid JSON in metadata field',
        variant: 'destructive'
      });
    }
  };

  const addBlock = () => {
    if (!selectedBlockToAdd) return;

    const newBlock: TransmissionBlock = {
      blockId: selectedBlockToAdd,
      order: formData.blocks.length + 1,
      parameters: {},
      isOptional: false
    };

    setFormData({
      ...formData,
      blocks: [...formData.blocks, newBlock]
    });
    setSelectedBlockToAdd('');
  };

  const removeBlock = (index: number) => {
    const newBlocks = formData.blocks.filter((_, i) => i !== index);
    // Reorder remaining blocks
    newBlocks.forEach((block, i) => {
      block.order = i + 1;
    });
    setFormData({
      ...formData,
      blocks: newBlocks
    });
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const newBlocks = [...formData.blocks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newBlocks.length) return;

    // Swap blocks
    [newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]];
    
    // Update order numbers
    newBlocks.forEach((block, i) => {
      block.order = i + 1;
    });

    setFormData({
      ...formData,
      blocks: newBlocks
    });
  };

  const toggleBlockOptional = (index: number) => {
    const newBlocks = [...formData.blocks];
    newBlocks[index].isOptional = !newBlocks[index].isOptional;
    setFormData({
      ...formData,
      blocks: newBlocks
    });
  };

  const getBlockName = (blockId: string) => {
    const block = availableBlocks?.find(b => b.id === blockId);
    return block?.name || 'Unknown Block';
  };

  const getBlockCategory = (blockId: string) => {
    const block = availableBlocks?.find(b => b.id === blockId);
    return block?.category || 'unknown';
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>
                {isEditMode ? 'Edit Transmission Template' : 'Create Transmission Template'}
              </CardTitle>
              <CardDescription>
                Define a radio transmission by combining communication blocks in sequence
              </CardDescription>
            </div>
            <Button variant="outline" onClick={() => navigate('/joni/transmissions')}>
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
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="blocks">Communication Blocks</TabsTrigger>
              <TabsTrigger value="metadata">Metadata</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Code *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g., initial_contact_ground"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Initial Contact with Ground"
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
                  placeholder="Describe the purpose and usage of this transmission template"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Transmission Type *</Label>
                  <Select
                    value={formData.transmissionType}
                    onValueChange={(value) => setFormData({ ...formData, transmissionType: value as 'pilot_to_atc' | 'atc_to_pilot' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pilot_to_atc">Pilot → ATC</SelectItem>
                      <SelectItem value="atc_to_pilot">ATC → Pilot</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="context">Context *</Label>
                  <Select
                    value={formData.context}
                    onValueChange={(value) => setFormData({ ...formData, context: value as 'ground' | 'tower' | 'departure' | 'approach' | 'enroute' | 'emergency' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ground">Ground</SelectItem>
                      <SelectItem value="tower">Tower</SelectItem>
                      <SelectItem value="departure">Departure</SelectItem>
                      <SelectItem value="approach">Approach</SelectItem>
                      <SelectItem value="enroute">Enroute</SelectItem>
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
                      Estimated Duration (seconds) *
                    </div>
                  </Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.estimatedSeconds}
                    onChange={(e) => setFormData({ ...formData, estimatedSeconds: parseInt(e.target.value) || 10 })}
                    min="1"
                    max="300"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="blocks" className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Add communication blocks in the order they should appear in the transmission.
                  Mark blocks as optional if they may be omitted in certain situations.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="flex gap-2">
                  <Select value={selectedBlockToAdd} onValueChange={setSelectedBlockToAdd}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select a communication block to add" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableBlocks?.map((block) => (
                        <SelectItem key={block.id} value={block.id}>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {block.category}
                            </Badge>
                            {block.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={addBlock} disabled={!selectedBlockToAdd}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Block
                  </Button>
                </div>

                <div className="space-y-2">
                  {formData.blocks.length === 0 ? (
                    <Card>
                      <CardContent className="text-center py-8 text-muted-foreground">
                        <Radio className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No blocks added yet</p>
                        <p className="text-sm mt-2">Add communication blocks to build your transmission template</p>
                      </CardContent>
                    </Card>
                  ) : (
                    formData.blocks.map((block, index) => (
                      <Card key={index}>
                        <CardContent className="flex items-center gap-4 p-4">
                          <div className="flex flex-col gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => moveBlock(index, 'up')}
                              disabled={index === 0}
                            >
                              <MoveUp className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => moveBlock(index, 'down')}
                              disabled={index === formData.blocks.length - 1}
                            >
                              <MoveDown className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">{block.order}</Badge>
                              <Badge variant="outline">{getBlockCategory(block.blockId)}</Badge>
                              <span className="font-medium">{getBlockName(block.blockId)}</span>
                              {block.isOptional && (
                                <Badge variant="outline" className="ml-auto">Optional</Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2">
                              <Label htmlFor={`optional-${index}`} className="text-sm">
                                Optional
                              </Label>
                              <Switch
                                id={`optional-${index}`}
                                checked={block.isOptional}
                                onCheckedChange={() => toggleBlockOptional(index)}
                              />
                            </div>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => navigate(`/joni/comm-blocks/${block.blockId}`)}
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>View/Edit communication block</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeBlock(index)}
                                  >
                                    <Trash2 className="w-4 h-4 text-destructive" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Remove from transmission</p>
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

            <TabsContent value="metadata" className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Add optional metadata in JSON format. This can include examples, notes, or additional context.
                </AlertDescription>
              </Alert>
              <div className="space-y-2">
                <Label htmlFor="metadata">Metadata (JSON)</Label>
                <Textarea
                  id="metadata"
                  value={metadataJson}
                  onChange={(e) => setMetadataJson(e.target.value)}
                  placeholder='{"example": "Ground, United Three Two One at gate Alpha Five"}'
                  rows={10}
                  className="font-mono text-sm"
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-4 mt-6">
            <Button variant="outline" onClick={() => navigate('/joni/transmissions')}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              <Save className="w-4 h-4 mr-2" />
              {isEditMode ? 'Update' : 'Create'} Transmission
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}