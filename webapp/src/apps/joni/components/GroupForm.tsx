import { useState, useEffect } from 'react';
import { trpc } from '@/utils/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface GroupFormProps {
  groupId?: string;
  subjectId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function GroupForm({ groupId, subjectId: defaultSubjectId, onSuccess, onCancel }: GroupFormProps) {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const isEditMode = !!groupId;

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [subjectId, setSubjectId] = useState(defaultSubjectId || '');

  // Queries
  const { data: subjects } = trpc.joniScenario.getAllSubjects.useQuery();
  const { data: group, isLoading: groupLoading } = trpc.joniScenarioGroup.getGroupById.useQuery(
    groupId!,
    { enabled: isEditMode }
  );

  // Mutations
  const createGroup = trpc.joniScenarioGroup.createGroup.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Group created successfully',
      });
      utils.joniScenarioGroup.getAllGroups.invalidate();
      utils.joniScenarioGroup.getGroupsBySubject.invalidate();
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

  const updateGroup = trpc.joniScenarioGroup.updateGroup.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Group updated successfully',
      });
      utils.joniScenarioGroup.getGroupById.invalidate(groupId);
      utils.joniScenarioGroup.getAllGroups.invalidate();
      utils.joniScenarioGroup.getGroupsBySubject.invalidate();
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

  // Load group data in edit mode
  useEffect(() => {
    if (group && isEditMode) {
      setName(group.name);
      setDescription(group.description || '');
      setSubjectId(group.subject.id);
    }
  }, [group, isEditMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a group name',
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

    const data = {
      name: name.trim(),
      description: description.trim() || undefined,
      subjectId,
    };

    if (isEditMode) {
      updateGroup.mutate({ id: groupId, data });
    } else {
      createGroup.mutate(data);
    }
  };

  if (isEditMode && groupLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card className="w-full max-w-2xl border-0 shadow-none">
      <CardHeader>
        <CardTitle>{isEditMode ? 'Edit Group' : 'Create New Group'}</CardTitle>
        <CardDescription>
          {isEditMode 
            ? 'Update the group details below' 
            : 'Create a new group to organize your scenarios'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Group Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter group name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description for this group"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <select
              id="subject"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              required
              disabled={isEditMode}
            >
              <option value="">Select a subject...</option>
              {subjects?.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createGroup.isPending || updateGroup.isPending}
            >
              {createGroup.isPending || updateGroup.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditMode ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                isEditMode ? 'Update Group' : 'Create Group'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}