import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useUserAccess } from '@/hooks/useUserAccess';
import { trpc } from '@/utils/trpc';
import { Edit, FileText, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function JoniScenarioManagement() {
  const navigate = useNavigate();
  const { hasSubFeatureAccess } = useUserAccess();
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | undefined>();

  // Check access
  const hasAccess = hasSubFeatureAccess('backoffice', 'backoffice-scenario');

  // Fetch subjects
  const { data: subjects, isLoading: subjectsLoading } = trpc.joniScenario.getAllSubjects.useQuery(
    undefined,
    { enabled: hasAccess }
  );

  // Fetch scenarios for selected subject
  const { data: scenarios, isLoading: scenariosLoading } = trpc.joniScenario.getAllScenarios.useQuery(
    { subjectId: selectedSubjectId },
    { enabled: hasAccess && !!selectedSubjectId }
  );

  // Redirect if no access
  useEffect(() => {
    if (!hasAccess && !subjectsLoading) {
      navigate('/joni');
    }
  }, [hasAccess, subjectsLoading, navigate]);

  if (!hasAccess) {
    return null;
  }

  return (
    <div className="container mx-auto pt-0 py-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Scenario Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage aviation training scenarios and subjects
          </p>
        </div>
        <div className="space-x-2">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Subject
          </Button>
          <Button variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            New Scenario
          </Button>
        </div>
      </div>

      {/* Subject Selection and Scenarios */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Scenarios</CardTitle>
              <CardDescription>
                View and manage training scenarios by subject
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <select
                className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={selectedSubjectId || ''}
                onChange={(e) => setSelectedSubjectId(e.target.value || undefined)}
              >
                <option value="">Select a subject...</option>
                {subjects?.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!selectedSubjectId ? (
            <div className="text-center py-8 text-muted-foreground">
              Select a subject to view its scenarios
            </div>
          ) : scenariosLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : scenarios && scenarios.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Flight Information</TableHead>
                    <TableHead>Responses</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scenarios.map((scenario) => (
                    <TableRow key={scenario.id}>
                      <TableCell className="font-medium">
                        <div className="max-w-xs">
                          <p className="truncate">{scenario.currentStatus}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          <FileText className="mr-1 h-3 w-3" />
                          View Details
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {scenario._count.responses} responses
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No scenarios found for this subject</p>
                <Button className="mt-4" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Scenario
                </Button>
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}