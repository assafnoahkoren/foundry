import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { trpc } from '@/utils/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import '../styles/quill-custom.css';

interface ScenarioFormProps {
  scenarioId?: string;
  subjectId?: string;
  groupId?: string;
  orderInGroup?: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ScenarioForm({ scenarioId, subjectId: defaultSubjectId, groupId: defaultGroupId, orderInGroup: defaultOrderInGroup, onSuccess, onCancel }: ScenarioFormProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEditMode = !!scenarioId;

  // Form state
  const [name, setName] = useState<string>('');
  const [shortDescription, setShortDescription] = useState<string>('');
  const [subjectId, setSubjectId] = useState<string>(defaultSubjectId || '');
  const [groupId, setGroupId] = useState<string>(defaultGroupId || '');
  const [orderInGroup, setOrderInGroup] = useState<number>(defaultOrderInGroup ?? 0);
  const [flightInformation, setFlightInformation] = useState<string>('');
  const [expectedAnswer, setExpectedAnswer] = useState<string>('');
  const [currentStatus, setCurrentStatus] = useState<string>('');

  // Quill modules configuration
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      ['blockquote', 'code-block'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      ['link', 'image'],
      ['clean']
    ],
  };

  // Queries
  const { data: subjects } = trpc.joniScenario.getAllSubjects.useQuery();
  const { data: groups } = trpc.joniScenarioGroup.getGroupsBySubject.useQuery(
    { subjectId },
    { enabled: !!subjectId }
  );
  const { data: scenario, isLoading: scenarioLoading } = trpc.joniScenario.getScenarioById.useQuery(
    scenarioId!,
    { enabled: isEditMode }
  );

  // Get tRPC utils for cache invalidation
  const utils = trpc.useUtils();

  // Mutations
  const createScenario = trpc.joniScenario.createScenario.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Scenario created successfully',
      });
      // Invalidate scenarios list to refresh the data
      utils.joniScenario.getAllScenarios.invalidate();
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateScenario = trpc.joniScenario.updateScenario.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Scenario updated successfully',
      });
      // Invalidate both the specific scenario and the list
      utils.joniScenario.getScenarioById.invalidate(scenarioId);
      utils.joniScenario.getAllScenarios.invalidate();
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const generateDescription = trpc.joniScenario.generateShortDescription.useMutation({
    onSuccess: (data) => {
      setShortDescription(data.description);
      toast({
        title: 'Success',
        description: 'Description generated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Load scenario data in edit mode
  useEffect(() => {
    if (scenario && isEditMode) {
      setName(scenario.name);
      setShortDescription(scenario.shortDescription || '');
      setSubjectId(scenario.subjectId);
      setGroupId(scenario.groupId);
      setOrderInGroup(scenario.orderInGroup);
      setFlightInformation(scenario.flightInformation);
      setExpectedAnswer(scenario.expectedAnswer);
      setCurrentStatus(scenario.currentStatus);
    }
  }, [scenario, isEditMode]);

  const handleGenerateDescription = () => {
    if (!flightInformation || !currentStatus) {
      toast({
        title: 'Error',
        description: 'Please provide flight information and current status first',
        variant: 'destructive',
      });
      return;
    }

    // Strip HTML tags for AI processing
    const stripHtml = (html: string) => {
      const tmp = document.createElement('div');
      tmp.innerHTML = html;
      return tmp.textContent || tmp.innerText || '';
    };

    generateDescription.mutate({
      flightInformation: stripHtml(flightInformation),
      currentStatus: stripHtml(currentStatus),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a scenario name',
        variant: 'destructive',
      });
      return;
    }

    if (!subjectId) {
      toast({
        title: 'Error',
        description: 'Please select a subject',
        variant: 'destructive',
      });
      return;
    }

    if (!groupId) {
      toast({
        title: 'Error',
        description: 'Please select a group',
        variant: 'destructive',
      });
      return;
    }

    const data = {
      name,
      shortDescription: shortDescription || undefined,
      subjectId,
      groupId,
      orderInGroup,
      flightInformation,
      expectedAnswer,
      currentStatus,
    };

    if (isEditMode) {
      updateScenario.mutate({ id: scenarioId, data });
    } else {
      createScenario.mutate(data);
    }
  };

  if (isEditMode && scenarioLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditMode ? 'Edit Scenario' : 'Create New Scenario'}</CardTitle>
        <CardDescription>
          {isEditMode 
            ? 'Update the scenario details below' 
            : 'Fill in the details to create a new training scenario'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Scenario Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Scenario Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter a descriptive name for this scenario"
              required
            />
          </div>

          {/* Short Description */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="shortDescription">Short Description</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerateDescription}
                disabled={generateDescription.isPending || !flightInformation || !currentStatus}
              >
                {generateDescription.isPending ? (
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-3 w-3" />
                )}
                Generate with AI
              </Button>
            </div>
            <Textarea
              id="shortDescription"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="A brief description of the scenario (max 150 characters)"
              maxLength={150}
              rows={2}
            />
            <p className="text-xs text-muted-foreground">
              {shortDescription.length}/150 characters
            </p>
          </div>

          {/* Subject Selection */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <select
              id="subject"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={subjectId}
              onChange={(e) => {
                setSubjectId(e.target.value);
                // Reset group selection when subject changes
                setGroupId('');
              }}
              required
              disabled={isEditMode || !!defaultSubjectId}
            >
              <option value="">Select a subject...</option>
              {subjects?.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>

          {/* Group Selection */}
          {subjectId && (
            <div className="space-y-2">
              <Label htmlFor="group">Group *</Label>
              <select
                id="group"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                required
                disabled={isEditMode || !!defaultGroupId}
              >
                <option value="">Select a group...</option>
                {groups?.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Flight Information */}
          <div className="space-y-2">
            <Label>Flight Information *</Label>
            <div className="border rounded-md">
              <ReactQuill
                theme="snow"
                value={flightInformation}
                onChange={setFlightInformation}
                modules={quillModules}
                className="[&_.ql-container]:min-h-[200px] [&_.ql-container]:max-h-[400px] [&_.ql-editor]:overflow-y-auto"
              />
            </div>
          </div>

          {/* Expected Answer */}
          <div className="space-y-2">
            <Label>Expected Answer *</Label>
            <div className="border rounded-md">
              <ReactQuill
                theme="snow"
                value={expectedAnswer}
                onChange={setExpectedAnswer}
                modules={quillModules}
                className="[&_.ql-container]:min-h-[200px] [&_.ql-container]:max-h-[400px] [&_.ql-editor]:overflow-y-auto"
              />
            </div>
          </div>

          {/* Current Status */}
          <div className="space-y-2">
            <Label>Current Status *</Label>
            <div className="border rounded-md">
              <ReactQuill
                theme="snow"
                value={currentStatus}
                onChange={setCurrentStatus}
                modules={quillModules}
                className="[&_.ql-container]:min-h-[150px] [&_.ql-container]:max-h-[300px] [&_.ql-editor]:overflow-y-auto"
                placeholder="Describe the current status of the scenario..."
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onCancel?.();
                navigate('/joni/scenarios');
              }}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createScenario.isPending || updateScenario.isPending}
            >
              {createScenario.isPending || updateScenario.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditMode ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                isEditMode ? 'Update Scenario' : 'Create Scenario'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}