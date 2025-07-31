import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { trpc } from '@/utils/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/useDebounce';
import { Loader2, Check, X, Trash2, Plus } from 'lucide-react';

export function ScenarioSubjectsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const utils = trpc.useUtils();
  
  const [editingField, setEditingField] = useState<{ id: string; field: 'name' | 'description' } | null>(null);
  const [editValues, setEditValues] = useState<Record<string, { name: string; description: string }>>({});
  const [deleteSubjectId, setDeleteSubjectId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectDescription, setNewSubjectDescription] = useState('');

  // Fetch subjects with scenario count
  const { data: subjects, isLoading } = trpc.joniScenario.getAllSubjects.useQuery();

  // Get scenarios to count them per subject
  const { data: scenarios } = trpc.joniScenario.getAllScenarios.useQuery();

  // Calculate scenario count per subject
  const scenarioCountBySubject = scenarios?.reduce((acc, scenario) => {
    acc[scenario.subjectId] = (acc[scenario.subjectId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  // Initialize edit values when subjects load
  useEffect(() => {
    if (subjects) {
      const values: Record<string, { name: string; description: string }> = {};
      subjects.forEach(subject => {
        values[subject.id] = {
          name: subject.name,
          description: subject.description || ''
        };
      });
      setEditValues(values);
    }
  }, [subjects]);

  // Get current edit value being typed
  const currentEditValue = editingField 
    ? editValues[editingField.id]?.[editingField.field] || ''
    : '';

  // Debounce the current edit value
  const debouncedEditValue = useDebounce(currentEditValue, 800);

  // Auto-save when debounced value changes
  useEffect(() => {
    if (editingField && debouncedEditValue && debouncedEditValue.trim()) {
      const subject = subjects?.find(s => s.id === editingField.id);
      if (!subject) return;

      const currentFieldValue = editingField.field === 'name' ? subject.name : (subject.description || '');
      
      // Only update if value actually changed
      if (debouncedEditValue.trim() !== currentFieldValue) {
        updateSubject.mutate({
          id: editingField.id,
          data: { [editingField.field]: debouncedEditValue.trim() }
        });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedEditValue, editingField?.id, editingField?.field]);

  // Update subject mutation
  const updateSubject = trpc.joniScenario.updateSubject.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Subject updated successfully',
      });
      utils.joniScenario.getAllSubjects.invalidate();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      // Revert to original value on error
      if (editingField) {
        const subject = subjects?.find(s => s.id === editingField.id);
        if (subject) {
          setEditValues(prev => ({
            ...prev,
            [editingField.id]: {
              ...prev[editingField.id],
              [editingField.field]: editingField.field === 'name' ? subject.name : (subject.description || '')
            }
          }));
        }
      }
    },
  });

  // Create subject mutation
  const createSubject = trpc.joniScenario.createSubject.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Subject created successfully',
      });
      utils.joniScenario.getAllSubjects.invalidate();
      setIsCreating(false);
      setNewSubjectName('');
      setNewSubjectDescription('');
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete subject mutation (to be implemented in router)
  const deleteSubject = trpc.joniScenario.deleteSubject.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Subject deleted successfully',
      });
      utils.joniScenario.getAllSubjects.invalidate();
      utils.joniScenario.getAllScenarios.invalidate();
      setDeleteSubjectId(null);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleStartEdit = (subjectId: string, field: 'name' | 'description') => {
    setEditingField({ id: subjectId, field });
  };

  const handleEditChange = (subjectId: string, field: 'name' | 'description', value: string) => {
    setEditValues(prev => ({
      ...prev,
      [subjectId]: {
        ...prev[subjectId],
        [field]: value
      }
    }));
  };

  const handleStopEdit = () => {
    setEditingField(null);
  };

  const handleDelete = (id: string) => {
    const count = scenarioCountBySubject[id] || 0;
    if (count > 0) {
      toast({
        title: 'Cannot delete subject',
        description: `This subject has ${count} scenario${count > 1 ? 's' : ''}. Please delete all scenarios first.`,
        variant: 'destructive',
      });
      return;
    }
    setDeleteSubjectId(id);
  };

  const handleCreateSubject = () => {
    if (!newSubjectName.trim()) return;
    
    createSubject.mutate({
      name: newSubjectName.trim(),
      description: newSubjectDescription.trim() || undefined
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto pt-0 py-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Scenario Subjects</h1>
          <p className="text-muted-foreground mt-2">
            Manage subjects for aviation training scenarios
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/joni/scenarios')}>
          Back to Scenarios
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Subjects</CardTitle>
              <CardDescription>
                Edit subject names or delete unused subjects
              </CardDescription>
            </div>
            {!isCreating && (
              <Button onClick={() => setIsCreating(true)} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Subject
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Scenarios</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isCreating && (
                <TableRow>
                  <TableCell>
                    <Input
                      value={newSubjectName}
                      onChange={(e) => setNewSubjectName(e.target.value)}
                      placeholder="Subject name"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCreateSubject();
                        if (e.key === 'Escape') {
                          setIsCreating(false);
                          setNewSubjectName('');
                          setNewSubjectDescription('');
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={newSubjectDescription}
                      onChange={(e) => setNewSubjectDescription(e.target.value)}
                      placeholder="Description (optional)"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCreateSubject();
                        if (e.key === 'Escape') {
                          setIsCreating(false);
                          setNewSubjectName('');
                          setNewSubjectDescription('');
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>-</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleCreateSubject}
                        disabled={createSubject.isPending || !newSubjectName.trim()}
                      >
                        {createSubject.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setIsCreating(false);
                          setNewSubjectName('');
                          setNewSubjectDescription('');
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {subjects?.map((subject) => (
                <TableRow key={subject.id}>
                  <TableCell>
                    {editingField?.id === subject.id && editingField?.field === 'name' ? (
                      <Input
                        value={editValues[subject.id]?.name || ''}
                        onChange={(e) => handleEditChange(subject.id, 'name', e.target.value)}
                        onBlur={handleStopEdit}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            handleStopEdit();
                            // Reset to original value
                            setEditValues(prev => ({
                              ...prev,
                              [subject.id]: {
                                ...prev[subject.id],
                                name: subject.name
                              }
                            }));
                          }
                        }}
                        autoFocus
                        className="h-auto py-1"
                      />
                    ) : (
                      <div 
                        className="font-medium cursor-pointer hover:bg-muted/50 rounded px-2 py-1 -mx-2 -my-1"
                        onClick={() => handleStartEdit(subject.id, 'name')}
                      >
                        {subject.name}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingField?.id === subject.id && editingField?.field === 'description' ? (
                      <Input
                        value={editValues[subject.id]?.description || ''}
                        onChange={(e) => handleEditChange(subject.id, 'description', e.target.value)}
                        onBlur={handleStopEdit}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            handleStopEdit();
                            // Reset to original value
                            setEditValues(prev => ({
                              ...prev,
                              [subject.id]: {
                                ...prev[subject.id],
                                description: subject.description || ''
                              }
                            }));
                          }
                        }}
                        placeholder="Add description..."
                        autoFocus
                        className="h-auto py-1"
                      />
                    ) : (
                      <div 
                        className="text-muted-foreground cursor-pointer hover:bg-muted/50 rounded px-2 py-1 -mx-2 -my-1"
                        onClick={() => handleStartEdit(subject.id, 'description')}
                      >
                        {subject.description || <span className="italic">Add description...</span>}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {scenarioCountBySubject[subject.id] || 0} scenarios
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(subject.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {subjects?.length === 0 && !isCreating && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No subjects found</p>
              <Button 
                className="mt-4" 
                variant="outline"
                onClick={() => setIsCreating(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create First Subject
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteSubjectId} onOpenChange={() => setDeleteSubjectId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the subject. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteSubjectId && deleteSubject.mutate(deleteSubjectId)}
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