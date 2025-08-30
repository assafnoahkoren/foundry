import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { trpc } from '@/utils/trpc';
import { Search } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScenarioCard } from '../../components/ScenarioCard';

export function ScenariosList() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Fetch all scripts (scenarios)
  const { data: scenarios, isLoading } = trpc.joniComm.scripts.list.useQuery({});
  
  // Filter scenarios based on search
  const filteredScenarios = scenarios?.filter(scenario => {
    const query = searchQuery.toLowerCase();
    return scenario.name.toLowerCase().includes(query) || 
           scenario.code.toLowerCase().includes(query);
  }) || [];
  
  const handleStartScenario = (scenarioId: string) => {
    // Navigate to practice page (to be implemented later)
    navigate(`/joni/scenarios/practice/${scenarioId}`);
  };
  
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-4">
        <Card>
          <CardContent className="p-8">
            <div className="text-center">Loading scenarios...</div>
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
          <CardTitle>Training Scenarios</CardTitle>
          <CardDescription>
            Select a scenario to practice your radio communication skills
          </CardDescription>
        </CardHeader>
      </Card>
      
      {/* Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder="Search by name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Scenarios Grid */}
      {filteredScenarios.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            {searchQuery ? 'No scenarios found matching your search.' : 'No scenarios available.'}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredScenarios.map((scenario) => (
            <ScenarioCard
              key={scenario.id}
              scenario={scenario}
              onStart={handleStartScenario}
            />
          ))}
        </div>
      )}
    </div>
  );
}