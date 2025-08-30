import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { trpc } from '@/utils/trpc';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

export function ScenarioPractice() {
  const { scenarioId } = useParams<{ scenarioId: string }>();
  const navigate = useNavigate();
  
  // Fetch the scenario details
  const { data: scenario, isLoading } = trpc.joniComm.scripts.getById.useQuery(
    { id: scenarioId! },
    { enabled: !!scenarioId }
  );
  
  const handleBack = () => {
    navigate('/joni/scenarios');
  };
  
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-4">
        <Card>
          <CardContent className="p-8">
            <div className="text-center">Loading scenario...</div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!scenario) {
    return (
      <div className="max-w-7xl mx-auto p-4">
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">Scenario not found</p>
              <Button onClick={handleBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Scenarios
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <CardTitle>{scenario.name}</CardTitle>
                <CardDescription>{scenario.code}</CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>
      
      {/* Scenario Info */}
      {scenario.description && (
        <Card>
          <CardHeader>
            <CardTitle>Scenario Details</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{scenario.description}</p>
          </CardContent>
        </Card>
      )}
      
      {/* Practice Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Practice Session</CardTitle>
          <CardDescription>
            This is where the practice session will be implemented
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              Ready to practice this scenario?
            </p>
            <Button 
              size="lg" 
              onClick={() => navigate(`/joni/scenarios/session/${scenarioId}`)}
            >
              Start Practice Session
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}