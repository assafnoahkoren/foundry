import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { trpc } from '@/utils/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2,
  Plane,
  Radio,
  User,
  Bot,
  Info,
  MapPin,
  Cloud,
  Fuel
} from 'lucide-react';
import type { FlightInformation } from '../types/scenario-practice.types';

interface StepResponse {
  stepId: string;
  response: string;
  feedback?: string;
  score?: number;
}

export function JoniPracticeSession() {
  const { scenarioId } = useParams<{ scenarioId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [userResponse, setUserResponse] = useState('');
  const [stepResponses, setStepResponses] = useState<StepResponse[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);

  // Queries
  const { data: scenario, isLoading: scenarioLoading } = trpc.joniScenario.getScenarioById.useQuery(
    scenarioId!,
    { enabled: !!scenarioId }
  );

  const currentStep = scenario?.steps[currentStepIndex];
  const progress = scenario ? ((currentStepIndex + 1) / scenario.steps.length) * 100 : 0;
  
  // Parse flight information from JSON
  const flightInfo = scenario?.flightInformationJson as FlightInformation | null;

  const getActorIcon = (eventType: string, actorRole?: string | null) => {
    if (eventType === 'atc' || actorRole?.includes('tower') || actorRole?.includes('ground')) {
      return <Radio className="h-4 w-4" />;
    }
    if (eventType === 'crew' || eventType === 'cockpit') {
      return <User className="h-4 w-4" />;
    }
    return <Bot className="h-4 w-4" />;
  };

  const getActorName = (eventType: string, actorRole?: string | null) => {
    if (actorRole) {
      return actorRole.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
    }
    return eventType.charAt(0).toUpperCase() + eventType.slice(1);
  };

  const handleSubmitResponse = () => {
    if (!currentStep || !userResponse.trim()) return;

    // Save the response
    const response: StepResponse = {
      stepId: currentStep.id,
      response: userResponse,
      // In a real implementation, this would be evaluated by an API
      feedback: 'Response recorded',
      score: 80 // Placeholder score
    };

    setStepResponses([...stepResponses, response]);
    setUserResponse('');

    // Move to next step or complete
    if (currentStepIndex < scenario!.steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      setIsCompleted(true);
    }
  };

  const handleComplete = () => {
    // In a real implementation, this would save the practice session
    toast({
      title: 'Practice Completed!',
      description: 'Your responses have been recorded.',
    });
    navigate('/joni/practice');
  };

  if (!scenarioId) {
    return <div>Invalid scenario ID</div>;
  }

  if (scenarioLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!scenario) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-destructive">
          <CardContent className="py-8">
            <p className="text-center text-destructive">Scenario not found</p>
            <div className="flex justify-center mt-4">
              <Button variant="outline" onClick={() => navigate('/joni/practice')}>
                Back to Practice
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/joni/practice')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Practice
        </Button>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">{scenario.name}</h1>
          <p className="text-muted-foreground">{scenario.shortDescription}</p>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="gap-1">
              <Plane className="h-3 w-3" />
              {scenario.subject.name}
            </Badge>
            <Progress value={progress} className="flex-1 h-2" />
            <span className="text-sm text-muted-foreground">
              Step {currentStepIndex + 1} of {scenario.steps.length}
            </span>
          </div>
        </div>
      </div>

      {/* Flight Information Panel */}
      {flightInfo && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Info className="h-5 w-5" />
              Flight Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {/* Aircraft & Callsign */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Plane className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Aircraft:</span>
                  <span>{flightInfo.aircraft.type}</span>
                  {flightInfo.aircraft.registration && (
                    <Badge variant="outline" className="ml-2">{flightInfo.aircraft.registration}</Badge>
                  )}
                </div>
                <div>
                  <span className="font-medium">Callsign:</span> {flightInfo.callsign}
                </div>
              </div>

              {/* Route */}
              {flightInfo.route && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Route:</span>
                  </div>
                  <div className="pl-6">
                    {flightInfo.route.departure} → {flightInfo.route.destination}
                    {flightInfo.route.alternate && (
                      <span className="text-muted-foreground"> (Alt: {flightInfo.route.alternate})</span>
                    )}
                  </div>
                </div>
              )}

              {/* Current Position */}
              {flightInfo.currentPosition && (
                <div className="space-y-2">
                  <div className="font-medium">Current Position:</div>
                  <div className="pl-6 space-y-1">
                    <div>Phase: <Badge variant="secondary">{flightInfo.currentPosition.phase}</Badge></div>
                    {flightInfo.currentPosition.location && (
                      <div>Location: {flightInfo.currentPosition.location}</div>
                    )}
                    {flightInfo.currentPosition.altitude && (
                      <div>Altitude: {flightInfo.currentPosition.altitude}</div>
                    )}
                    {flightInfo.currentPosition.heading && (
                      <div>Heading: {flightInfo.currentPosition.heading}°</div>
                    )}
                  </div>
                </div>
              )}

              {/* Weather */}
              {flightInfo.weather && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Cloud className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Weather:</span>
                  </div>
                  <div className="pl-6 space-y-1">
                    <div>Conditions: {flightInfo.weather.conditions}</div>
                    {flightInfo.weather.wind && (
                      <div>Wind: {flightInfo.weather.wind}</div>
                    )}
                    {flightInfo.weather.visibility && (
                      <div>Visibility: {flightInfo.weather.visibility}</div>
                    )}
                    {flightInfo.weather.qnh && (
                      <div>QNH: {flightInfo.weather.qnh}</div>
                    )}
                  </div>
                </div>
              )}

              {/* Additional Info */}
              <div className="space-y-2">
                {flightInfo.atis && (
                  <div>
                    <span className="font-medium">ATIS:</span> {flightInfo.atis}
                  </div>
                )}
                {flightInfo.fuel && (
                  <div className="flex items-center gap-2">
                    <Fuel className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Fuel:</span> {flightInfo.fuel.remaining}
                    {flightInfo.fuel.endurance && (
                      <span className="text-muted-foreground"> (Endurance: {flightInfo.fuel.endurance})</span>
                    )}
                  </div>
                )}
                {flightInfo.soulsOnBoard && (
                  <div>
                    <span className="font-medium">Souls on Board:</span> {flightInfo.soulsOnBoard}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Initial Context */}
      {currentStepIndex === 0 && scenario.initialContext && (
        <Card className="mb-6 border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="text-lg">Scenario Context</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{scenario.initialContext}</p>
          </CardContent>
        </Card>
      )}

      {!isCompleted ? (
        <>
          {/* Current Step */}
          {currentStep && (
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center gap-2">
                  {getActorIcon(currentStep.eventType, currentStep.actorRole)}
                  <CardTitle className="text-lg">
                    {getActorName(currentStep.eventType, currentStep.actorRole)}
                  </CardTitle>
                </div>
                <CardDescription>{currentStep.eventDescription}</CardDescription>
              </CardHeader>
              <CardContent>
                {currentStep.eventMessage && (
                  <div className="bg-muted rounded-lg p-4 mb-4">
                    <p className="font-medium italic">"{currentStep.eventMessage}"</p>
                  </div>
                )}

                {/* Response Input */}
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Your Response:</label>
                    <Textarea
                      value={userResponse}
                      onChange={(e) => setUserResponse(e.target.value)}
                      placeholder="Enter your response using proper aviation phraseology..."
                      className="min-h-[100px]"
                    />
                  </div>
                  
                  <div className="flex justify-between">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentStepIndex(Math.max(0, currentStepIndex - 1))}
                      disabled={currentStepIndex === 0}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Previous
                    </Button>
                    <Button
                      onClick={handleSubmitResponse}
                      disabled={!userResponse.trim()}
                    >
                      {currentStepIndex === scenario.steps.length - 1 ? (
                        <>
                          Complete
                          <CheckCircle2 className="h-4 w-4 ml-2" />
                        </>
                      ) : (
                        <>
                          Next Step
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        /* Completion Summary */
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Practice Completed!
            </CardTitle>
            <CardDescription>
              You've completed all {scenario.steps.length} steps of this scenario.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Summary of responses */}
              <div className="space-y-2">
                <p className="font-medium">Your Responses:</p>
                {stepResponses.map((response, index) => (
                  <div key={response.stepId} className="p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium">Step {index + 1}:</p>
                    <p className="text-sm">{response.response}</p>
                  </div>
                ))}
              </div>
              
              <Button onClick={handleComplete} className="w-full">
                Back to Practice
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}