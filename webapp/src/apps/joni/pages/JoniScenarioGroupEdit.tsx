import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { trpc } from '@/utils/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Edit2, Trash2, Loader2, Sparkles, Clock, BarChart3, Plane } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScenarioForm } from '../components/ScenarioForm';
import { GenerateScenarioModal } from '../components/GenerateScenarioModal';

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

interface ScenarioItemProps {
  scenario: {
    id: string;
    name: string;
    shortDescription: string | null;
    difficulty: string;
    estimatedMinutes: number;
    flightInformation: string;
    expectedAnswer: string | null;
    currentStatus: string | null;
  };
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

function ScenarioItem({ scenario, onEdit, onDelete }: ScenarioItemProps) {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'intermediate':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'advanced':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      default:
        return '';
    }
  };

  // Parse flight information to extract key details
  const extractFlightInfo = (info: string) => {
    const callsignMatch = info.match(/Callsign:\s*([^\n]+)/);
    const aircraftMatch = info.match(/Aircraft:\s*([^\n]+)/);
    const routeMatch = info.match(/Route:\s*([^\n]+)/);
    
    return {
      callsign: callsignMatch?.[1]?.trim() || 'Unknown',
      aircraft: aircraftMatch?.[1]?.trim() || 'Unknown',
      route: routeMatch?.[1]?.trim() || 'N/A'
    };
  };

  const flightInfo = extractFlightInfo(scenario.flightInformation);

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{scenario.name}</h3>
              {scenario.shortDescription && (
                <p className="text-sm text-muted-foreground mt-1">{scenario.shortDescription}</p>
              )}
            </div>
            <div className="flex items-center gap-2 ml-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(scenario.id)}
                className="h-8 w-8"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(scenario.id)}
                className="h-8 w-8 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={getDifficultyColor(scenario.difficulty)}>
              {scenario.difficulty}
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Clock className="h-3 w-3" />
              {scenario.estimatedMinutes} min
            </Badge>
            {flightInfo.callsign !== 'Unknown' && (
              <Badge variant="outline" className="gap-1">
                <Plane className="h-3 w-3" />
                {flightInfo.callsign}
              </Badge>
            )}
          </div>

          {/* Flight Information */}
          {flightInfo.route !== 'N/A' && (
            <div className="bg-muted/50 rounded-lg p-3 text-sm">
              <div>
                <span className="font-medium text-muted-foreground">Route:</span>{' '}
                <span>{flightInfo.route}</span>
              </div>
            </div>
          )}
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
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [editingScenarioId, setEditingScenarioId] = useState<string | null>(null);
  const [deletingScenarioId, setDeletingScenarioId] = useState<string | null>(null);

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

  const handleDeleteScenario = () => {
    if (deletingScenarioId) {
      deleteScenario.mutate(deletingScenarioId);
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
          <div className="flex gap-2">
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Scenario
            </Button>
            <Button onClick={() => setShowGenerateDialog(true)} variant="outline">
              <Sparkles className="mr-2 h-4 w-4" />
              Generate with AI
            </Button>
          </div>
        </div>
      </div>

      {/* Scenarios List */}
      {group.scenarios.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <p className="text-muted-foreground mb-4">
              No scenarios in this group yet. Add your first scenario to get started.
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Scenario
              </Button>
              <Button onClick={() => setShowGenerateDialog(true)} variant="outline">
                <Sparkles className="mr-2 h-4 w-4" />
                Generate with AI
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              {group.scenarios.length} scenario{group.scenarios.length !== 1 ? 's' : ''} in this group
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BarChart3 className="h-4 w-4" />
              <span>Sorted by difficulty</span>
            </div>
          </div>
          {group.scenarios.map((scenario) => (
            <ScenarioItem
              key={scenario.id}
              scenario={scenario}
              onEdit={setEditingScenarioId}
              onDelete={setDeletingScenarioId}
            />
          ))}
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
              onUpdateSuccess={() => {
                // Only invalidate the query, don't close the modal
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

      {/* Generate with AI Dialog */}
      <GenerateScenarioModal
        open={showGenerateDialog}
        onOpenChange={setShowGenerateDialog}
        subjectId={group.subject.id}
        groupId={group.id}
        onSuccess={() => {
          utils.joniScenarioGroup.getGroupById.invalidate(groupId);
        }}
      />
    </div>
  );
}