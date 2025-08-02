import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { trpc } from '@/utils/trpc';
import { Clock, Loader2, Plane, PlayCircle, Target, Trophy } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function JoniScenarioPractice() {
  const navigate = useNavigate();
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedGroup, setSelectedGroup] = useState<string>('');

  // Queries
  const { data: subjects, isLoading: subjectsLoading } = trpc.joniScenario.getAllSubjects.useQuery();
  
  const { data: groups } = trpc.joniScenarioGroup.getGroupsBySubject.useQuery(
    { subjectId: selectedSubject },
    { enabled: !!selectedSubject }
  );

  const { data: scenarios, isLoading: scenariosLoading } = trpc.joniScenario.getAllScenarios.useQuery({});

  // Filter scenarios by subject and group if selected
  const filteredScenarios = scenarios?.filter(scenario => {
    const matchesSubject = !selectedSubject || selectedSubject === 'all' || scenario.subjectId === selectedSubject;
    const matchesGroup = !selectedGroup || selectedGroup === 'all' || scenario.groupId === selectedGroup;
    return matchesSubject && matchesGroup;
  }) || [];

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

  const handleStartPractice = (scenarioId: string) => {
    navigate(`/joni/practice/${scenarioId}`);
  };

  if (subjectsLoading) {
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Scenario Practice</h1>
        <p className="text-muted-foreground">
          Practice your aviation communication skills with realistic scenarios
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <Select value={selectedSubject} onValueChange={setSelectedSubject}>
          <SelectTrigger className="w-full sm:w-[250px]">
            <SelectValue placeholder="All subjects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All subjects</SelectItem>
            {subjects?.map((subject) => (
              <SelectItem key={subject.id} value={subject.id}>
                {subject.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedSubject && groups && groups.length > 0 && (
          <Select value={selectedGroup} onValueChange={setSelectedGroup}>
            <SelectTrigger className="w-full sm:w-[250px]">
              <SelectValue placeholder="All groups" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All groups</SelectItem>
              {groups.map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Scenarios Grid */}
      {scenariosLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : filteredScenarios.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              No scenarios available for the selected filters
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredScenarios.map((scenario) => (
            <Card key={scenario.id} className="hover:shadow-lg transition-shadow duration-200">
              <div className="flex items-center p-6">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <CardTitle className="text-lg">{scenario.name}</CardTitle>
                        {scenario._count.responses > 0 && (
                          <Badge variant="outline" className="shrink-0">
                            <Trophy className="h-3 w-3 mr-1" />
                            {scenario._count.responses}
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="mb-3">
                        {scenario.shortDescription || 'No description available'}
                      </CardDescription>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className={getDifficultyColor(scenario.difficulty)}>
                          {scenario.difficulty}
                        </Badge>
                        <Badge variant="outline" className="gap-1">
                          <Clock className="h-3 w-3" />
                          {scenario.estimatedMinutes} min
                        </Badge>
                        {scenario.subject && (
                          <Badge variant="secondary" className="gap-1">
                            <Plane className="h-3 w-3" />
                            {scenario.subject.name}
                          </Badge>
                        )}
                        {scenario.group && (
                          <Badge variant="secondary">
                            {scenario.group.name}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <Button 
                  size="icon"
                  className="rounded-full h-12 w-12 ml-6 shrink-0"
                  onClick={() => handleStartPractice(scenario.id)}
                  title="Start Practice"
                >
                  <PlayCircle  className="!h-6 !w-6"/>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}