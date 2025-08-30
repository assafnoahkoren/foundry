import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Play } from 'lucide-react';

interface ScenarioCardProps {
  scenario: {
    id: string;
    name: string;
    code: string;
    description?: string | null;
  };
  onStart: (scenarioId: string) => void;
}

export function ScenarioCard({ scenario, onStart }: ScenarioCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg">{scenario.name}</CardTitle>
            <CardDescription className="text-sm mt-1">
              {scenario.code}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {scenario.description && (
          <p className="text-sm text-muted-foreground">
            {scenario.description}
          </p>
        )}
        
        <Button 
          onClick={() => onStart(scenario.id)}
          className="w-full"
        >
          <Play className="w-4 h-4 mr-2" />
          Start Practice
        </Button>
      </CardContent>
    </Card>
  );
}