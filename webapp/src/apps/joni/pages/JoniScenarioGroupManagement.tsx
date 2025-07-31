import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { trpc } from '@/utils/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit2, Trash2, Copy, ChevronRight, Loader2 } from 'lucide-react';
import { formatRelative } from 'date-fns';
import { GroupForm } from '../components/GroupForm';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function JoniScenarioGroupManagement() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const utils = trpc.useUtils();
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');

  // Queries
  const { data: subjects, isLoading: subjectsLoading } = trpc.joniScenario.getAllSubjects.useQuery();
  const { data: allGroups, isLoading: groupsLoading } = trpc.joniScenarioGroup.getAllGroups.useQuery();

  // Filter groups by selected subject
  const filteredGroups = selectedSubjectId
    ? allGroups?.filter(group => group.subject.id === selectedSubjectId)
    : allGroups;

  // Mutations
  const deleteGroup = trpc.joniScenarioGroup.deleteGroup.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Group deleted successfully',
      });
      utils.joniScenarioGroup.getAllGroups.invalidate();
      setDeletingGroupId(null);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const duplicateGroup = trpc.joniScenarioGroup.duplicateGroup.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Group duplicated successfully',
      });
      utils.joniScenarioGroup.getAllGroups.invalidate();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleDeleteGroup = () => {
    if (deletingGroupId) {
      deleteGroup.mutate(deletingGroupId);
    }
  };

  const handleDuplicateGroup = (groupId: string, groupName: string) => {
    duplicateGroup.mutate({
      groupId,
      newName: `${groupName} (Copy)`,
    });
  };

  if (subjectsLoading || groupsLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold">Scenario Groups</h1>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Group
          </Button>
        </div>
        
        {/* Subject Filter */}
        <div className="flex items-center gap-4 mb-4">
          <label htmlFor="subject-filter" className="text-sm font-medium">
            Filter by Subject:
          </label>
          <select
            id="subject-filter"
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
          >
            <option value="">All Subjects</option>
            {subjects?.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Groups Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredGroups?.map((group) => (
          <Card key={group.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{group.name}</CardTitle>
                  <CardDescription className="text-xs mt-1">
                    {group.subject.name}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditingGroupId(group.id)}
                    title="Edit group"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDuplicateGroup(group.id, group.name)}
                    title="Duplicate group"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeletingGroupId(group.id)}
                    title="Delete group"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {group.description && (
                <p className="text-sm text-muted-foreground mb-3">{group.description}</p>
              )}
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">{group._count.scenarios}</span> scenario{group._count.scenarios !== 1 ? 's' : ''}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/joni/groups/${group.id}`)}
                >
                  Manage
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                Updated {formatRelative(new Date(group.updatedAt), new Date())}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredGroups?.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <p className="text-muted-foreground mb-4">
              {selectedSubjectId
                ? 'No groups found for the selected subject'
                : 'No groups found. Create your first group to get started.'}
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Group
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Group Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl" aria-describedby="create-group-description">
          <VisuallyHidden>
            <DialogTitle>Create New Group</DialogTitle>
          </VisuallyHidden>
          <div id="create-group-description" className="sr-only">
            Form to create a new scenario group
          </div>
          <GroupForm
            onSuccess={() => setShowCreateDialog(false)}
            onCancel={() => setShowCreateDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Group Dialog */}
      <Dialog open={!!editingGroupId} onOpenChange={(open) => !open && setEditingGroupId(null)}>
        <DialogContent className="max-w-2xl" aria-describedby="edit-group-description">
          <VisuallyHidden>
            <DialogTitle>Edit Group</DialogTitle>
          </VisuallyHidden>
          <div id="edit-group-description" className="sr-only">
            Form to edit an existing scenario group
          </div>
          {editingGroupId && (
            <GroupForm
              groupId={editingGroupId}
              onSuccess={() => setEditingGroupId(null)}
              onCancel={() => setEditingGroupId(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingGroupId} onOpenChange={(open) => !open && setDeletingGroupId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the group and all its scenarios. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteGroup}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}