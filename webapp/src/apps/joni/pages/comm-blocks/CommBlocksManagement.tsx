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
import { Plus, Edit, Trash2, Search } from 'lucide-react';
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

export function CommBlocksManagement() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [deleteBlockId, setDeleteBlockId] = useState<string | null>(null);

  // Fetch comm blocks
  const { data: blocks, isLoading, refetch } = trpc.joniComm.blocks.list.useQuery({
    category: selectedCategory === 'all' ? undefined : selectedCategory,
    difficultyLevel: selectedDifficulty === 'all' ? undefined : parseInt(selectedDifficulty),
    orderBy: 'orderIndex',
    orderDirection: 'asc'
  });

  // Fetch categories
  const { data: categories } = trpc.joniComm.blocks.getCategories.useQuery();

  // Search functionality
  const { data: searchResults } = trpc.joniComm.blocks.search.useQuery(
    { searchTerm },
    { enabled: searchTerm.length > 2 }
  );

  // Delete mutation
  const deleteMutation = trpc.joniComm.blocks.delete.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Communication block deleted successfully'
      });
      refetch();
      setDeleteBlockId(null);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const displayBlocks = searchTerm.length > 2 ? searchResults : blocks;

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

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      identification: 'bg-purple-500',
      position: 'bg-blue-500',
      clearance: 'bg-green-500',
      instruction: 'bg-yellow-500',
      readback: 'bg-orange-500',
      information: 'bg-cyan-500',
      emergency: 'bg-red-500'
    };
    return colors[category] || 'bg-gray-500';
  };

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Communication Blocks Management</CardTitle>
              <CardDescription>
                Manage ICAO-compliant communication blocks for aviation training
              </CardDescription>
            </div>
            <Button onClick={() => navigate('/joni/comm-blocks/new')}>
              <Plus className="w-4 h-4 mr-2" />
              New Block
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
                  placeholder="Search blocks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories?.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
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

      {/* Blocks Table */}
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
                  <TableHead>Category</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead>ICAO Reference</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayBlocks?.map((block) => (
                  <TableRow key={block.id}>
                    <TableCell className="font-mono">{block.code}</TableCell>
                    <TableCell className="font-medium">{block.name}</TableCell>
                    <TableCell>
                      <Badge className={getCategoryColor(block.category)}>
                        {block.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getDifficultyColor(block.difficultyLevel)}>
                        Level {block.difficultyLevel}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {block.icaoReference || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/joni/comm-blocks/${block.id}`)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteBlockId(block.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {displayBlocks?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No communication blocks found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteBlockId} onOpenChange={() => setDeleteBlockId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Communication Block</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this communication block? This action cannot be undone.
              Any transmissions or user progress related to this block will be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteBlockId && deleteMutation.mutate({ id: deleteBlockId })}
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