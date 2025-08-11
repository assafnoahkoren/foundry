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
import { toast } from '@/hooks/use-toast';
import { Save, ArrowLeft, AlertCircle, Clock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CommBlockEditor, type EditorJSONContent } from '../../components/CommBlockEditor';

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
  editorContent?: EditorJSONContent; // Store the full editor content as JSON
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
    metadata: {},
    editorContent: undefined
  });

  const [metadataJson, setMetadataJson] = useState('{}');

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
      const metadata = (existingTransmission.metadata || {}) as Record<string, unknown>;
      setFormData({
        code: existingTransmission.code,
        name: existingTransmission.name,
        description: existingTransmission.description || '',
        transmissionType: existingTransmission.transmissionType as 'pilot_to_atc' | 'atc_to_pilot',
        context: existingTransmission.context as 'ground' | 'tower' | 'departure' | 'approach' | 'enroute' | 'emergency',
        difficultyLevel: existingTransmission.difficultyLevel,
        estimatedSeconds: existingTransmission.estimatedSeconds,
        blocks: Array.isArray(existingTransmission.blocks) ? existingTransmission.blocks as TransmissionBlock[] : [],
        metadata: metadata,
        editorContent: metadata.editorContent as EditorJSONContent | undefined
      });
      // Remove editorContent from display metadata
      const displayMetadata = { ...metadata };
      delete displayMetadata.editorContent;
      setMetadataJson(JSON.stringify(displayMetadata, null, 2));
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

  // Get the utils for invalidation
  const utils = trpc.useUtils();

  // Update mutation
  const updateMutation = trpc.joniComm.transmissions.update.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Transmission template updated successfully'
      });
      // Invalidate the query to refetch the updated data
      utils.joniComm.transmissions.getById.invalidate({ id: id! });
      utils.joniComm.transmissions.list.invalidate();
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

      // Include editor content in metadata for storage
      const fullMetadata = {
        ...metadata,
        editorContent: formData.editorContent
      };

      if (isEditMode) {
        updateMutation.mutate({
          id: id!,
          data: {
            ...formData,
            metadata: fullMetadata
          }
        });
      } else {
        createMutation.mutate({
          ...formData,
          metadata: fullMetadata
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

  // Handle blocks update from editor
  const handleBlocksChange = (newBlocks: TransmissionBlock[], editorContent?: EditorJSONContent) => {
    setFormData({
      ...formData,
      blocks: newBlocks,
      editorContent: editorContent
    });
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
                  Build your transmission by typing text and dragging communication blocks into the editor.
                  You can reorder blocks by dragging them within the editor.
                </AlertDescription>
              </Alert>

              {availableBlocks && (
                <CommBlockEditor
                  value={formData.blocks}
                  onChange={handleBlocksChange}
                  initialContent={formData.editorContent}
                  availableBlocks={availableBlocks.map(b => ({
                    id: b.id,
                    name: b.name,
                    category: b.category,
                    code: b.code
                  }))}
                />
              )}
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