import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { trpc } from '@/utils/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Search, Clock, Layers } from 'lucide-react';
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function TransmissionManagement() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedContext, setSelectedContext] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [deleteTransmissionId, setDeleteTransmissionId] = useState<string | null>(null);

  // Fetch transmissions
  const { data: transmissions, isLoading, refetch } = trpc.joniComm.transmissions.list.useQuery({
    transmissionType: selectedType === 'all' ? undefined : selectedType as 'pilot_to_atc' | 'atc_to_pilot',
    context: selectedContext === 'all' ? undefined : selectedContext as 'ground' | 'tower' | 'departure' | 'approach' | 'enroute' | 'emergency',
    difficultyLevel: selectedDifficulty === 'all' ? undefined : parseInt(selectedDifficulty),
    orderBy: 'name',
    orderDirection: 'asc'
  });

  // Fetch contexts
  const { data: contexts } = trpc.joniComm.transmissions.getContexts.useQuery();

  // Search functionality
  const { data: searchResults } = trpc.joniComm.transmissions.search.useQuery(
    { searchTerm },
    { enabled: searchTerm.length > 2 }
  );

  // Delete mutation
  const deleteMutation = trpc.joniComm.transmissions.delete.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Transmission template deleted successfully'
      });
      refetch();
      setDeleteTransmissionId(null);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const displayTransmissions = searchTerm.length > 2 ? searchResults : transmissions;

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
    return type === 'pilot_to_atc' ? 'bg-blue-500' : 'bg-purple-500';
  };

  const getContextColor = (context: string) => {
    const colors: Record<string, string> = {
      ground: 'bg-gray-500',
      tower: 'bg-blue-500',
      departure: 'bg-green-500',
      approach: 'bg-yellow-500',
      enroute: 'bg-cyan-500',
      emergency: 'bg-red-500'
    };
    return colors[context] || 'bg-gray-500';
  };

  const formatTransmissionType = (type: string) => {
    return type === 'pilot_to_atc' ? 'Pilot → ATC' : 'ATC → Pilot';
  };

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Transmission Templates</CardTitle>
              <CardDescription>
                Manage radio transmission templates that combine multiple communication blocks
              </CardDescription>
            </div>
            <Button onClick={() => navigate('/joni/transmissions/new')}>
              <Plus className="w-4 h-4 mr-2" />
              New Transmission
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
                  placeholder="Search transmissions..."
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
                <SelectItem value="pilot_to_atc">Pilot → ATC</SelectItem>
                <SelectItem value="atc_to_pilot">ATC → Pilot</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedContext} onValueChange={setSelectedContext}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Contexts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Contexts</SelectItem>
                {contexts?.map((ctx) => (
                  <SelectItem key={ctx} value={ctx}>
                    {ctx.charAt(0).toUpperCase() + ctx.slice(1)}
                  </SelectItem>
                ))}
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

      {/* Transmissions Table */}
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
                  <TableHead>Context</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      <Layers className="w-4 h-4" />
                      Blocks
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Duration
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayTransmissions?.map((transmission) => {
                  const blocks = transmission.blocks as Array<{
                    blockId: string;
                    order: number;
                    parameters: Record<string, unknown>;
                    isOptional: boolean;
                  }>;
                  return (
                    <TableRow key={transmission.id}>
                      <TableCell className="font-mono">{transmission.code}</TableCell>
                      <TableCell className="font-medium">{transmission.name}</TableCell>
                      <TableCell>
                        <Badge className={getTypeColor(transmission.transmissionType)}>
                          {formatTransmissionType(transmission.transmissionType)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getContextColor(transmission.context)}>
                          {transmission.context}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getDifficultyColor(transmission.difficultyLevel)}>
                          Level {transmission.difficultyLevel}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge variant="outline">
                                {blocks?.length || 0} blocks
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Contains {blocks?.length || 0} communication blocks</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {transmission.estimatedSeconds}s
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/joni/transmissions/${transmission.id}`)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteTransmissionId(transmission.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {displayTransmissions?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      No transmission templates found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTransmissionId} onOpenChange={() => setDeleteTransmissionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transmission Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this transmission template? This action cannot be undone.
              Any scripts or practice sessions using this template will be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTransmissionId && deleteMutation.mutate({ id: deleteTransmissionId })}
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