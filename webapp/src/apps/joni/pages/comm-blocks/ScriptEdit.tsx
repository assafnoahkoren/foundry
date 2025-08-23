import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { trpc } from '@/utils/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import { ScriptDAGEditor } from '../../components/ScriptDAGEditor/ScriptDAGEditor';
import { validateScriptDAG, type ScriptDAG } from '../../types/script-dag.types';

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
          transmissionId: 'temp-1',
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
  
  console.log('ScriptEdit - id:', id);
  console.log('ScriptEdit - isNew:', isNew);

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
    console.log('ScriptEdit - initialData:', initialData);
    return initialData;
  });

  const [tagInput, setTagInput] = useState('');

  // Fetch existing script if editing
  const queryResult = isNew 
    ? { data: null, isLoading: false }
    : trpc.joniComm.scripts.getById.useQuery(
        { id: id! },
        { enabled: !!id }
      );
  
  const { data: script, isLoading } = queryResult;
  
  console.log('ScriptEdit - isLoading:', isLoading);
  console.log('ScriptEdit - script:', script);
  console.log('ScriptEdit - formData.dagStructure:', formData.dagStructure);

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

  // Create mutation
  const createMutation = trpc.joniComm.scripts.create.useMutation({
    onSuccess: () => {
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

  const handleAddTag = () => {
    if (tagInput && !formData.tags.includes(tagInput)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const handleDAGChange = (newDAG: ScriptDAG) => {
    setFormData(prev => ({
      ...prev,
      dagStructure: newDAG,
      startNodeId: newDAG.nodes[0]?.id || 'start'
    }));
  };

  console.log('ScriptEdit - Checking loading condition:', { isNew, isLoading, condition: !isNew && isLoading });
  
  if (!isNew && isLoading) {
    console.log('ScriptEdit - Returning Loading screen');
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
  
  console.log('ScriptEdit - Rendering main form');

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
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

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                placeholder="SCRIPT-001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="IFR Departure with Weather"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the scenario..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.scriptType}
                onValueChange={(value) => setFormData(prev => ({ ...prev, scriptType: value as 'training' | 'evaluation' | 'scenario' | 'adaptive' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="training">Training</SelectItem>
                  <SelectItem value="evaluation">Evaluation</SelectItem>
                  <SelectItem value="scenario">Scenario</SelectItem>
                  <SelectItem value="adaptive">Adaptive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty</Label>
              <Select
                value={formData.difficultyLevel.toString()}
                onValueChange={(value) => setFormData(prev => ({ ...prev, difficultyLevel: parseInt(value) }))}
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
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                value={formData.estimatedMinutes}
                onChange={(e) => setFormData(prev => ({ ...prev, estimatedMinutes: parseInt(e.target.value) || 5 }))}
                min={1}
                max={120}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add a tag..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              />
              <Button onClick={handleAddTag} type="button">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.tags.map(tag => (
                <div key={tag} className="px-2 py-1 bg-secondary rounded-md flex items-center gap-1">
                  <span className="text-sm">{tag}</span>
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="text-destructive hover:text-destructive/80"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* DAG Editor */}
      <Card>
        <CardHeader>
          <CardTitle>Scenario Flow</CardTitle>
          <CardDescription>
            Design the flow of your scenario with nodes and edges. Drag to pan, scroll to zoom.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[600px] border rounded-lg">
            {formData.dagStructure && (
              <ScriptDAGEditor
                dag={formData.dagStructure}
                onChange={handleDAGChange}
                readOnly={false}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}