import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { trpc } from '@/utils/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Edit2, Trash2, GripVertical, Loader2 } from 'lucide-react';
import { ScenarioForm } from '../components/ScenarioForm';
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
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableScenarioItemProps {
  scenario: {
    id: string;
    name: string;
    shortDescription: string | null;
    flightInformation: string;
    expectedAnswer: string;
    currentStatus: string;
    orderInGroup: number;
  };
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

function SortableScenarioItem({ scenario, onEdit, onDelete }: SortableScenarioItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: scenario.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`${isDragging ? 'cursor-grabbing' : ''}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div
            {...attributes}
            {...listeners}
            className="mt-1 cursor-grab hover:text-muted-foreground"
          >
            <GripVertical className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-lg mb-1">{scenario.name}</div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <span>Scenario #{scenario.orderInGroup + 1}</span>
              {scenario.shortDescription && (
                <>
                  <span>•</span>
                  <span className="italic">{scenario.shortDescription}</span>
                </>
              )}
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <div className="truncate">
                <span className="font-medium">Flight Info:</span>{' '}
                <span dangerouslySetInnerHTML={{ __html: scenario.flightInformation.substring(0, 100) + '...' }} />
              </div>
              <div className="truncate">
                <span className="font-medium">Expected:</span>{' '}
                <span dangerouslySetInnerHTML={{ __html: scenario.expectedAnswer.substring(0, 100) + '...' }} />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(scenario.id)}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(scenario.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function JoniScenarioGroupEdit() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const utils = trpc.useUtils();
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingScenarioId, setEditingScenarioId] = useState<string | null>(null);
  const [deletingScenarioId, setDeletingScenarioId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Queries
  const { data: group, isLoading: groupLoading } = trpc.joniScenarioGroup.getGroupById.useQuery(
    groupId!,
    { enabled: !!groupId }
  );

  // Mutations
  const deleteScenario = trpc.joniScenario.deleteScenario.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Scenario deleted successfully',
      });
      utils.joniScenarioGroup.getGroupById.invalidate(groupId);
      setDeletingScenarioId(null);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const reorderScenarios = trpc.joniScenarioGroup.reorderScenariosInGroup.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Scenarios reordered successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      // Revalidate to restore original order
      utils.joniScenarioGroup.getGroupById.invalidate(groupId);
    },
  });

  const handleDeleteScenario = () => {
    if (deletingScenarioId) {
      deleteScenario.mutate(deletingScenarioId);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id && group?.scenarios) {
      const oldIndex = group.scenarios.findIndex((s) => s.id === active.id);
      const newIndex = group.scenarios.findIndex((s) => s.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(group.scenarios, oldIndex, newIndex);
        
        // Optimistically update the UI
        const updatedScenarios = newOrder.map((scenario, index) => ({
          ...scenario,
          orderInGroup: index,
        }));

        utils.joniScenarioGroup.getGroupById.setData(groupId!, (old) => {
          if (!old) return old;
          return {
            ...old,
            scenarios: updatedScenarios,
          };
        });

        // Send the reorder request
        reorderScenarios.mutate({
          groupId: groupId!,
          scenarioOrders: updatedScenarios.map((s) => ({
            scenarioId: s.id,
            orderInGroup: s.orderInGroup,
          })),
        });
      }
    }
  };

  if (!groupId) {
    return <div>Invalid group ID</div>;
  }

  if (groupLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-destructive">
          <CardContent className="py-8">
            <p className="text-center text-destructive">Group not found</p>
            <div className="flex justify-center mt-4">
              <Button variant="outline" onClick={() => navigate('/joni/groups')}>
                Back to Groups
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/joni/groups')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Groups
        </Button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{group.name}</h1>
            <p className="text-muted-foreground mt-1">
              Subject: {group.subject.name}
            </p>
            {group.description && (
              <p className="text-sm text-muted-foreground mt-2">{group.description}</p>
            )}
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Scenario
          </Button>
        </div>
      </div>

      {/* Scenarios List */}
      {group.scenarios.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <p className="text-muted-foreground mb-4">
              No scenarios in this group yet. Add your first scenario to get started.
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Scenario
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground mb-2">
            Drag and drop scenarios to reorder them
          </div>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={group.scenarios.map(s => s.id)}
              strategy={verticalListSortingStrategy}
            >
              {group.scenarios.map((scenario) => (
                <SortableScenarioItem
                  key={scenario.id}
                  scenario={scenario}
                  onEdit={setEditingScenarioId}
                  onDelete={setDeletingScenarioId}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      )}

      {/* Create Scenario Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-[calc(100vw-4rem)] w-[calc(100vw-4rem)] h-[80vh] overflow-hidden flex flex-col" aria-describedby="create-scenario-description">
          <VisuallyHidden>
            <DialogTitle>Create New Scenario</DialogTitle>
          </VisuallyHidden>
          <div id="create-scenario-description" className="sr-only">
            Form to create a new scenario in the current group
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            <ScenarioForm
            subjectId={group.subject.id}
            groupId={group.id}
            orderInGroup={group.scenarios.length}
            onSuccess={() => {
              setShowCreateDialog(false);
              utils.joniScenarioGroup.getGroupById.invalidate(groupId);
            }}
              onCancel={() => setShowCreateDialog(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Scenario Dialog */}
      <Dialog open={!!editingScenarioId} onOpenChange={(open) => !open && setEditingScenarioId(null)}>
        <DialogContent className="max-w-[calc(100vw-4rem)] w-[calc(100vw-4rem)] h-[80vh] overflow-hidden flex flex-col" aria-describedby="edit-scenario-description">
          <VisuallyHidden>
            <DialogTitle>Edit Scenario</DialogTitle>
          </VisuallyHidden>
          <div id="edit-scenario-description" className="sr-only">
            Form to edit an existing scenario
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            {editingScenarioId && (
            <ScenarioForm
              scenarioId={editingScenarioId}
              onSuccess={() => {
                setEditingScenarioId(null);
                utils.joniScenarioGroup.getGroupById.invalidate(groupId);
              }}
              onCancel={() => setEditingScenarioId(null)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingScenarioId} onOpenChange={(open) => !open && setDeletingScenarioId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the scenario. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteScenario}
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