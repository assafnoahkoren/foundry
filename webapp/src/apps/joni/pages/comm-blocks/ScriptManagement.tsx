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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from '@/hooks/use-toast';
import { trpc } from '@/utils/trpc';
import { Clock, Edit, Eye, GitBranch, PlayCircle, Plus, Search, Target, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScriptDAGEditor } from '../../components/ScriptDAGEditor/ScriptDAGEditor';
import type { ScriptDAG } from '../../types/script-dag.types';

export function ScriptManagement() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [deleteScriptId, setDeleteScriptId] = useState<string | null>(null);
  const [previewScript, setPreviewScript] = useState<{ id: string; name: string; dag: ScriptDAG } | null>(null);

  // Fetch scripts
  const { data: scripts, isLoading, refetch } = trpc.joniComm.scripts.list.useQuery({
    scriptType: selectedType === 'all' ? undefined : selectedType as 'training' | 'evaluation' | 'scenario' | 'adaptive',
    difficultyLevel: selectedDifficulty === 'all' ? undefined : parseInt(selectedDifficulty),
    orderBy: 'name',
    orderDirection: 'asc'
  });

  // Search functionality
  const { data: searchResults } = trpc.joniComm.scripts.search.useQuery(
    { searchTerm },
    { enabled: searchTerm.length > 2 }
  );

  // Delete mutation
  const deleteMutation = trpc.joniComm.scripts.delete.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Script deleted successfully'
      });
      refetch();
      setDeleteScriptId(null);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const displayScripts = searchTerm.length > 2 ? searchResults : scripts;

  const getDifficultyColor = (level: number) => {
    switch (level) {
      case 1: return 'bg-green-500';
      case 2: return 'bg-blue-500';
      case 3: return 'bg-yellow-500';
      case 4: return 'bg-orange-500';
      case 5: return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      training: 'bg-blue-500',
      evaluation: 'bg-purple-500',
      scenario: 'bg-green-500',
      adaptive: 'bg-orange-500'
    };
    return colors[type] || 'bg-gray-500';
  };

  const getNodeCount = (dag: unknown) => {
    if (!dag || typeof dag !== 'object') return 0;
    return (dag as { nodes?: unknown[] }).nodes?.length || 0;
  };

  const getPathCount = (dag: unknown) => {
    if (!dag || typeof dag !== 'object') return 0;
    return (dag as { metadata?: { totalPaths?: number } }).metadata?.totalPaths || 0;
  };

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Training Scripts</CardTitle>
              <CardDescription>
                Manage dynamic training scenarios with branching paths and decision points
              </CardDescription>
            </div>
            <Button onClick={() => navigate('/joni/scripts/new')}>
              <Plus className="w-4 h-4 mr-2" />
              New Script
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search scripts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="training">Training</SelectItem>
                <SelectItem value="evaluation">Evaluation</SelectItem>
                <SelectItem value="scenario">Scenario</SelectItem>
                <SelectItem value="adaptive">Adaptive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Difficulties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Difficulties</SelectItem>
                <SelectItem value="1">Level 1 - Beginner</SelectItem>
                <SelectItem value="2">Level 2 - Easy</SelectItem>
                <SelectItem value="3">Level 3 - Intermediate</SelectItem>
                <SelectItem value="4">Level 4 - Advanced</SelectItem>
                <SelectItem value="5">Level 5 - Expert</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Scripts Table */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      <GitBranch className="w-4 h-4" />
                      Structure
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Duration
                    </div>
                  </TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayScripts?.map((script) => {
                  const nodeCount = getNodeCount(script.dagStructure);
                  const pathCount = getPathCount(script.dagStructure);
                  const tags = script.tags || [];
                  const learningObjectives = (script.learningObjectives as string[]) || [];
                  
                  return (
                    <TableRow key={script.id}>
                      <TableCell className="font-mono">{script.code}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{script.name}</p>
                          {script.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {script.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getTypeColor(script.scriptType)}>
                          {script.scriptType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getDifficultyColor(script.difficultyLevel)}>
                          Level {script.difficultyLevel}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {nodeCount} nodes
                          </Badge>
                          {pathCount > 0 && (
                            <Badge variant="outline">
                              {pathCount} paths
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {script.estimatedMinutes} min
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {tags.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {learningObjectives.length > 0 && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                  >
                                    <Target className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="space-y-1">
                                    <p className="font-semibold">Learning Objectives:</p>
                                    {learningObjectives.map((obj, idx) => (
                                      <p key={idx} className="text-sm">• {obj}</p>
                                    ))}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          {script.dagStructure && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setPreviewScript({
                                id: script.id,
                                name: script.name,
                                dag: script.dagStructure as ScriptDAG
                              })}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/joni/practice/script/${script.id}`)}
                          >
                            <PlayCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/joni/scripts/${script.id}`)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteScriptId(script.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {displayScripts?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      No scripts found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={!!previewScript} onOpenChange={() => setPreviewScript(null)}>
        <DialogContent className="max-w-6xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>{previewScript?.name}</DialogTitle>
            <DialogDescription>
              Preview of the script's DAG structure
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 mt-4">
            {previewScript && (
              <ScriptDAGEditor
                dag={previewScript.dag}
                readOnly={true}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteScriptId} onOpenChange={() => setDeleteScriptId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Script</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this script? This action cannot be undone.
              Any practice sessions using this script will be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteScriptId && deleteMutation.mutate({ id: deleteScriptId })}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}