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
import { Save, ArrowLeft, Plus, Trash2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CommBlockFormData {
  code: string;
  name: string;
  category: string;
  description: string;
  icaoReference: string;
  difficultyLevel: number;
  orderIndex: number;
  rules: Record<string, unknown>;
  examples: string[];
  commonErrors: string[];
}

const categories = [
  'identification',
  'position',
  'clearance',
  'instruction',
  'readback',
  'information',
  'emergency'
];

export function CommBlockForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [formData, setFormData] = useState<CommBlockFormData>({
    code: '',
    name: '',
    category: 'identification',
    description: '',
    icaoReference: '',
    difficultyLevel: 1,
    orderIndex: 1,
    rules: {},
    examples: [],
    commonErrors: []
  });

  const [rulesJson, setRulesJson] = useState('{}');
  const [newExample, setNewExample] = useState('');
  const [newError, setNewError] = useState('');

  // Fetch existing block data if in edit mode
  const { data: existingBlock } = trpc.joniComm.blocks.getById.useQuery(
    { id: id! },
    { enabled: isEditMode }
  );

  useEffect(() => {
    if (existingBlock) {
      setFormData({
        code: existingBlock.code,
        name: existingBlock.name,
        category: existingBlock.category,
        description: existingBlock.description || '',
        icaoReference: existingBlock.icaoReference || '',
        difficultyLevel: existingBlock.difficultyLevel,
        orderIndex: existingBlock.orderIndex,
        rules: existingBlock.rules,
        examples: Array.isArray(existingBlock.examples) ? existingBlock.examples : [],
        commonErrors: Array.isArray(existingBlock.commonErrors) ? existingBlock.commonErrors : []
      });
      setRulesJson(JSON.stringify(existingBlock.rules, null, 2));
    }
  }, [existingBlock]);

  // Create mutation
  const createMutation = trpc.joniComm.blocks.create.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Communication block created successfully'
      });
      navigate('/joni/comm-blocks');
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
  const updateMutation = trpc.joniComm.blocks.update.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Communication block updated successfully'
      });
      navigate('/joni/comm-blocks');
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
      const rules = JSON.parse(rulesJson);
      
      if (isEditMode) {
        updateMutation.mutate({
          id: id!,
          data: {
            ...formData,
            rules
          }
        });
      } else {
        createMutation.mutate({
          ...formData,
          rules
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Invalid JSON in rules field',
        variant: 'destructive'
      });
    }
  };

  const addExample = () => {
    if (newExample.trim()) {
      setFormData({
        ...formData,
        examples: [...formData.examples, newExample.trim()]
      });
      setNewExample('');
    }
  };

  const removeExample = (index: number) => {
    setFormData({
      ...formData,
      examples: formData.examples.filter((_, i) => i !== index)
    });
  };

  const addError = () => {
    if (newError.trim()) {
      setFormData({
        ...formData,
        commonErrors: [...formData.commonErrors, newError.trim()]
      });
      setNewError('');
    }
  };

  const removeError = (index: number) => {
    setFormData({
      ...formData,
      commonErrors: formData.commonErrors.filter((_, i) => i !== index)
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
                {isEditMode ? 'Edit Communication Block' : 'Create Communication Block'}
              </CardTitle>
              <CardDescription>
                Define ICAO-compliant communication blocks for aviation training
              </CardDescription>
            </div>
            <Button variant="outline" onClick={() => navigate('/joni/comm-blocks')}>
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
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="rules">Rules & Validation</TabsTrigger>
              <TabsTrigger value="examples">Examples</TabsTrigger>
              <TabsTrigger value="errors">Common Errors</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Code *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g., callsign, altitude"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Aircraft Callsign"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the purpose and usage of this communication block"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="icaoReference">ICAO Reference</Label>
                  <Input
                    id="icaoReference"
                    value={formData.icaoReference}
                    onChange={(e) => setFormData({ ...formData, icaoReference: e.target.value })}
                    placeholder="e.g., ICAO Doc 9432, Section 2.1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="orderIndex">Order Index</Label>
                  <Input
                    id="orderIndex"
                    type="number"
                    value={formData.orderIndex}
                    onChange={(e) => setFormData({ ...formData, orderIndex: parseInt(e.target.value) || 1 })}
                    min="1"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="rules" className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Define validation rules in JSON format. These rules will be used to validate user responses.
                </AlertDescription>
              </Alert>
              <div className="space-y-2">
                <Label htmlFor="rules">Validation Rules (JSON)</Label>
                <Textarea
                  id="rules"
                  value={rulesJson}
                  onChange={(e) => setRulesJson(e.target.value)}
                  placeholder='{"format": "pattern", "required": true}'
                  rows={10}
                  className="font-mono text-sm"
                />
              </div>
            </TabsContent>

            <TabsContent value="examples" className="space-y-4">
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newExample}
                    onChange={(e) => setNewExample(e.target.value)}
                    placeholder="Enter a correct example"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addExample())}
                  />
                  <Button onClick={addExample} type="button">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Example
                  </Button>
                </div>
                <div className="space-y-2">
                  {formData.examples.map((example, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-secondary rounded">
                      <span className="flex-1">{example}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeExample(index)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                  {formData.examples.length === 0 && (
                    <p className="text-muted-foreground text-center py-4">
                      No examples added yet
                    </p>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="errors" className="space-y-4">
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newError}
                    onChange={(e) => setNewError(e.target.value)}
                    placeholder="Enter a common error"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addError())}
                  />
                  <Button onClick={addError} type="button">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Error
                  </Button>
                </div>
                <div className="space-y-2">
                  {formData.commonErrors.map((error, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-secondary rounded">
                      <span className="flex-1">{error}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeError(index)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                  {formData.commonErrors.length === 0 && (
                    <p className="text-muted-foreground text-center py-4">
                      No common errors added yet
                    </p>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-4 mt-6">
            <Button variant="outline" onClick={() => navigate('/joni/comm-blocks')}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              <Save className="w-4 h-4 mr-2" />
              {isEditMode ? 'Update' : 'Create'} Block
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}