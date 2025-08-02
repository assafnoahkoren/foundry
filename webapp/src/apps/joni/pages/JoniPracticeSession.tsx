import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAudioRecording } from '@/hooks/useAudioRecording';
import { trpc } from '@/utils/trpc';
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  CheckCircle2,
  Cloud,
  Fuel,
  Info,
  Loader2,
  MapPin,
  Mic,
  Plane,
  Radio,
  Square,
  User
} from 'lucide-react';
import { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ScenarioResponseAnalysis } from '../components/ScenarioResponseAnalysis';
import type { FlightInformation, ResponseEvaluationResult } from '../types/scenario-practice.types';

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
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<ResponseEvaluationResult | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const audioChunksRef = useRef<Blob[]>([]);
  const lastProcessedChunkRef = useRef<number>(0);

  // Queries
  const { data: scenario, isLoading: scenarioLoading } = trpc.joniScenario.getScenarioById.useQuery(
    scenarioId!,
    { enabled: !!scenarioId }
  );
  
  // Mutations
  const transcribeAudioMutation = trpc.speech.transcribeAudio.useMutation({
    onSuccess: (result) => {
      // Override the text in the textarea with the transcription
      setUserResponse(result.text);
      setIsTranscribing(false);
    },
    onError: (error) => {
      console.error('Transcription error:', error);
      setIsTranscribing(false);
    },
  });

  const evaluateResponseMutation = trpc.joniScenario.evaluateResponse.useMutation({
    onSuccess: (result) => {
      setCurrentAnalysis(result);
      setIsAnalysisOpen(true);
      setIsEvaluating(false);
    },
    onError: (error) => {
      console.error('Evaluation error:', error);
      toast({
        title: 'Evaluation Error',
        description: 'Failed to evaluate your response. Please try again.',
        variant: 'destructive',
      });
      setIsEvaluating(false);
    },
  });
  
  // Audio recording hook with streaming transcription
  const {
    isRecording,
    formattedTime,
    error: recordingError,
    startRecording,
    stopRecording,
  } = useAudioRecording({
    timeSlice: 1000, // Get chunks every second for accumulation
    onDataAvailable: async (blob) => {
      if (blob.size === 0) return;
      
      // Store all chunks
      audioChunksRef.current.push(blob);
      
      // Process chunks every 2 seconds worth of audio
      const currentChunkCount = audioChunksRef.current.length;
      const chunksToProcess = currentChunkCount - lastProcessedChunkRef.current;
      
      // Only process if we have at least 2 seconds of new audio and not currently transcribing
      if (chunksToProcess >= 2 && !isTranscribing) {
        console.log(`Processing ${chunksToProcess} chunks into a complete audio segment`);
        
        // Get all chunks from the beginning to create a complete audio file
        const allChunks = audioChunksRef.current.slice(0, currentChunkCount);
        const mimeType = blob.type || 'audio/webm';
        
        // Create a complete audio file from all chunks so far
        const completeAudioBlob = new Blob(allChunks, { type: mimeType });
        
        setIsTranscribing(true);
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;
          const base64Audio = base64data.split(',')[1];
          
          console.log('Sending complete audio segment, size:', completeAudioBlob.size);
          
          // Build context prompt from scenario information
          const contextPrompt = buildTranscriptionPrompt();
          
          transcribeAudioMutation.mutate({
            audioData: base64Audio,
            language: 'en',
            prompt: contextPrompt,
          });
          
          // Update the last processed chunk index
          lastProcessedChunkRef.current = currentChunkCount;
        };
        reader.readAsDataURL(completeAudioBlob);
      }
    },
  });

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

  // Build context-aware prompt for better transcription
  const buildTranscriptionPrompt = () => {
    const parts = ['Aviation radio communication.'];
    
    // Add scenario context
    if (scenario) {
      parts.push(`Scenario: ${scenario.name}.`);
      
      // Add current step context
      if (currentStep) {
        // Add who is speaking
        const speaker = getActorName(currentStep.eventType, currentStep.actorRole);
        parts.push(`Speaker is ${speaker}.`);
        
        // Add what they said (for context)
        if (currentStep.eventMessage) {
          parts.push(`Previous message: "${currentStep.eventMessage}"`);
        }
      }
    }
    
    // Add flight information context
    if (flightInfo) {
      if (flightInfo.callsign) {
        parts.push(`Aircraft callsign: ${flightInfo.callsign}.`);
      }
      if (flightInfo.aircraft?.type) {
        parts.push(`Aircraft type: ${flightInfo.aircraft.type}.`);
      }
      if (flightInfo.route) {
        parts.push(`Route: ${flightInfo.route.departure} to ${flightInfo.route.destination}.`);
      }
    }
    
    // Add common aviation terms to help with recognition
    parts.push('Use aviation phraseology and terminology.');
    
    return parts.join(' ');
  };

  const handleStartRecording = async () => {
    audioChunksRef.current = [];
    lastProcessedChunkRef.current = 0;
    await startRecording();
  };

  const handleStopRecording = async () => {
    const finalBlob = await stopRecording();
    
    // Process any remaining chunks that haven't been transcribed
    if (finalBlob && finalBlob.size > 0 && audioChunksRef.current.length > lastProcessedChunkRef.current) {
      console.log('Processing remaining audio chunks');
      
      // Create a complete audio file from ALL chunks
      const mimeType = finalBlob.type || 'audio/webm';
      const completeAudioBlob = new Blob(audioChunksRef.current, { type: mimeType });
      
      // Only transcribe if we have unprocessed audio
      if (lastProcessedChunkRef.current === 0 || audioChunksRef.current.length > lastProcessedChunkRef.current) {
        setIsTranscribing(true);
        
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;
          const base64Audio = base64data.split(',')[1];
          
          console.log('Sending final complete audio, size:', completeAudioBlob.size);
          
          // Build context prompt from scenario information
          const contextPrompt = buildTranscriptionPrompt();
          
          transcribeAudioMutation.mutate({
            audioData: base64Audio,
            language: 'en',
            prompt: contextPrompt,
          });
        };
        reader.readAsDataURL(completeAudioBlob);
      }
    }
    
    // No need to do anything else - text is already in userResponse
  };

  const handleSubmitResponse = async () => {
    if (!currentStep || !userResponse.trim()) return;

    // Evaluate the response
    setIsEvaluating(true);
    evaluateResponseMutation.mutate({
      userResponse: userResponse,
      stepId: currentStep.id,
      // TODO: Add practiceId when implementing practice sessions
    });
  };

  const handleContinueAfterAnalysis = () => {
    if (!currentStep) return;

    // Save the response
    const response: StepResponse = {
      stepId: currentStep.id,
      response: userResponse,
      feedback: currentAnalysis?.feedback || 'Response recorded',
      score: currentAnalysis?.score || 0
    };

    setStepResponses([...stepResponses, response]);
    setUserResponse('');
    setIsAnalysisOpen(false);
    setCurrentAnalysis(null);

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
    <div className="flex flex-col h-screen">
      {/* Main content area with scroll */}
      <div className="flex-1 pb-[220px] sm:pb-[200px]">
        <div className="container mx-auto p-4 sm:p-6 max-w-4xl">
          {/* Header */}
          <div className="mb-4 sm:mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/joni/practice')}
          className="mb-3 sm:mb-4 -ml-2 sm:ml-0"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Back to Practice</span>
          <span className="sm:hidden">Back</span>
        </Button>
        
        <div className="space-y-2">
          <h1 className="text-xl sm:text-2xl font-bold">{scenario.name}</h1>
          <p className="text-sm sm:text-base text-muted-foreground">{scenario.shortDescription}</p>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <Badge variant="outline" className="gap-1 w-fit">
              <Plane className="h-3 w-3" />
              {scenario.subject.name}
            </Badge>
            <div className="flex items-center gap-2 flex-1">
              <Progress value={progress} className="flex-1 h-2" />
              <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                {currentStepIndex + 1}/{scenario.steps.length}
              </span>
            </div>
          </div>
        </div>
      </div>

          {/* Flight Information Panel */}
          {flightInfo && (
        <Card className="mb-3 sm:mb-4">
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-sm sm:text-base flex items-center gap-2">
              <Info className="h-3 sm:h-4 w-3 sm:w-4" />
              Flight Information
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 text-[11px] sm:text-xs">
              {/* Aircraft & Callsign */}
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <Plane className="h-3 w-3 text-muted-foreground" />
                  <span className="font-medium">{flightInfo.aircraft.type}</span>
                </div>
                <div className="text-muted-foreground">
                  {flightInfo.callsign}
                  {flightInfo.aircraft.registration && (
                    <span className="ml-1">({flightInfo.aircraft.registration})</span>
                  )}
                </div>
              </div>

              {/* Route */}
              {flightInfo.route && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium">Route</span>
                  </div>
                  <div className="text-muted-foreground">
                    {flightInfo.route.departure} → {flightInfo.route.destination}
                    {flightInfo.route.alternate && (
                      <span className="block">Alt: {flightInfo.route.alternate}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Current Position */}
              {flightInfo.currentPosition && (
                <div className="space-y-1">
                  <div className="font-medium">Position</div>
                  <div className="text-muted-foreground">
                    <Badge variant="secondary" className="text-[10px] sm:text-[11px] px-1.5 py-0">{flightInfo.currentPosition.phase}</Badge>
                    {flightInfo.currentPosition.location && (
                      <div className="mt-1">{flightInfo.currentPosition.location}</div>
                    )}
                    {flightInfo.currentPosition.altitude && (
                      <span>{flightInfo.currentPosition.altitude}</span>
                    )}
                    {flightInfo.currentPosition.heading && (
                      <span className="ml-2">HDG {flightInfo.currentPosition.heading}°</span>
                    )}
                  </div>
                </div>
              )}

              {/* Weather */}
              {flightInfo.weather && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    <Cloud className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium">Weather</span>
                  </div>
                  <div className="text-muted-foreground">
                    <div>{flightInfo.weather.conditions}</div>
                    {flightInfo.weather.wind && (
                      <span>Wind {flightInfo.weather.wind}</span>
                    )}
                    {flightInfo.weather.visibility && (
                      <span className="ml-2">Vis {flightInfo.weather.visibility}</span>
                    )}
                    {flightInfo.weather.qnh && (
                      <div>QNH {flightInfo.weather.qnh}</div>
                    )}
                  </div>
                </div>
              )}

              {/* Additional Info */}
              <div className="space-y-1 col-span-2 sm:col-span-1">
                {flightInfo.atis && (
                  <div>
                    <span className="font-medium">ATIS</span>
                    <span className="text-muted-foreground ml-1">{flightInfo.atis}</span>
                  </div>
                )}
                {flightInfo.fuel && (
                  <div className="flex items-center gap-1">
                    <Fuel className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {flightInfo.fuel.remaining}
                      {flightInfo.fuel.endurance && (
                        <span> ({flightInfo.fuel.endurance})</span>
                      )}
                    </span>
                  </div>
                )}
                {flightInfo.soulsOnBoard && (
                  <div className="text-muted-foreground">
                    {flightInfo.soulsOnBoard} SOB
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

          {/* Initial Context */}
          {currentStepIndex === 0 && scenario.initialContext && (
        <Card className="mb-4 sm:mb-6 border-blue-200 bg-blue-50/50">
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="text-base sm:text-lg">Scenario Context</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs sm:text-sm">{scenario.initialContext}</p>
          </CardContent>
        </Card>
      )}

          {!isCompleted ? (
        <>
          {/* Current Step */}
          {currentStep && (
            <Card className="mb-4 sm:mb-6">
              <CardHeader className="pb-2 sm:pb-3">
                {(currentStep.eventType === 'situation' || currentStep.eventType === 'self_initiation') ? (
                  // Situation/Self-initiation step - pilot needs to initiate
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center gap-2 px-2 sm:px-3 py-1 bg-blue-500/10 rounded-full">
                      <Plane className="h-3 sm:h-4 w-3 sm:w-4 text-blue-600" />
                      <span className="text-xs sm:text-sm font-semibold text-blue-900 dark:text-blue-100">
                        {currentStep.eventType === 'self_initiation' ? 'SELF INITIATION' : 'PILOT ACTION REQUIRED'}
                      </span>
                    </div>
                  </div>
                ) : (
                  // Communication step - someone is transmitting
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <div className="flex items-center gap-2 px-2 sm:px-3 py-1 bg-orange-500/10 rounded-full">
                      <Radio className="h-3 sm:h-4 w-3 sm:w-4 text-orange-600" />
                      <span className="text-xs sm:text-sm font-semibold text-orange-900 dark:text-orange-100">
                        {currentStep.eventType.toUpperCase()}
                      </span>
                    </div>
                    {currentStep.actorRole && (
                      <div className="flex items-center gap-2 px-2 sm:px-3 py-1 bg-primary/10 rounded-full">
                        {getActorIcon(currentStep.eventType, currentStep.actorRole)}
                        <span className="text-xs sm:text-sm font-semibold">
                          {getActorName(currentStep.eventType, currentStep.actorRole)}
                        </span>
                      </div>
                    )}
                    <span className="text-xs sm:text-sm text-muted-foreground">is transmitting:</span>
                  </div>
                )}
                <CardDescription className="text-xs sm:text-sm">{currentStep.eventDescription}</CardDescription>
              </CardHeader>
              <CardContent>
                {currentStep.eventMessage && (
                  <div className="relative bg-muted rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
                    <div className="absolute -top-2 -left-2 bg-primary text-primary-foreground rounded-full w-6 sm:w-8 h-6 sm:h-8 flex items-center justify-center">
                      <Radio className="h-3 sm:h-4 w-3 sm:w-4" />
                    </div>
                    <p className="font-medium italic text-sm sm:text-lg">"{currentStep.eventMessage}"</p>
                  </div>
                )}

                {/* Show who you are responding as */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-2 px-2 sm:px-3 py-1 bg-blue-500/10 rounded-full">
                    <User className="h-3 sm:h-4 w-3 sm:w-4 text-blue-600" />
                    <span className="text-xs sm:text-sm font-semibold text-blue-900 dark:text-blue-100">You</span>
                  </div>
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    {(currentStep.eventType === 'situation' || currentStep.eventType === 'self_initiation') ? 'initiate as' : 'respond as'}
                  </span>
                  <div className="flex items-center gap-2 px-2 sm:px-3 py-1 bg-green-500/10 rounded-full">
                    <Plane className="h-3 sm:h-4 w-3 sm:w-4 text-green-600" />
                    <span className="text-xs sm:text-sm font-semibold text-green-900 dark:text-green-100">
                      {flightInfo?.callsign || 'Pilot'}
                    </span>
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
      </div>

      {/* Fixed bottom toolbar - only show when not completed and have current step */}
      {!isCompleted && currentStep && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg">
          <div className="container mx-auto max-w-4xl p-3 sm:p-4">
            {/* Show who you are responding as */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-500/10 rounded-full">
                <User className="h-3 w-3 text-blue-600" />
                <span className="text-[11px] sm:text-xs font-semibold text-blue-900 dark:text-blue-100">You</span>
              </div>
              <span className="text-[11px] sm:text-xs text-muted-foreground">
                {(currentStep.eventType === 'situation' || currentStep.eventType === 'self_initiation') ? 'initiate as' : 'respond as'}
              </span>
              <div className="flex items-center gap-1 px-2 py-0.5 bg-green-500/10 rounded-full">
                <Plane className="h-3 w-3 text-green-600" />
                <span className="text-[11px] sm:text-xs font-semibold text-green-900 dark:text-green-100">
                  {flightInfo?.callsign || 'Pilot'}
                </span>
              </div>
            </div>
            
            <div className="flex gap-3">
              {/* Textarea */}
              <div className="flex-1">
                <Textarea
                  value={userResponse}
                  onChange={(e) => setUserResponse(e.target.value)}
                  placeholder={(currentStep.eventType === 'situation' || currentStep.eventType === 'self_initiation')
                    ? "Initiate your radio call..."
                    : "Enter your response..."}
                  className="min-h-[60px] sm:min-h-[80px] text-sm sm:text-base resize-none"
                  disabled={isRecording}
                />
                {recordingError && (
                  <div className="text-xs text-destructive mt-1">{recordingError}</div>
                )}
              </div>

              {/* Voice button */}
              <div className="flex items-end">
                {!isRecording ? (
                  <Button
                    size="icon"
                    className="rounded-full w-[50px] sm:w-[60px] h-[50px] sm:h-[60px] bg-black hover:bg-gray-800 text-white"
                    onClick={handleStartRecording}
                    title="Start voice recording"
                  >
                    <Mic className="!h-5 sm:!h-6 !w-5 sm:!w-6" />
                  </Button>
                ) : (
                  <Button
                    size="icon"
                    className="rounded-full w-[50px] sm:w-[60px] h-[50px] sm:h-[60px] bg-red-600 hover:bg-red-700 text-white flex flex-col items-center justify-center relative"
                    onClick={handleStopRecording}
                    title="Stop recording"
                  >
                    <Square className="h-3 sm:h-4 w-3 sm:w-4 relative bottom-1" />
                    <span className="text-[10px] sm:text-xs font-medium absolute bottom-1">{formattedTime}</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Navigation buttons */}
            <div className="flex gap-2 mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentStepIndex(Math.max(0, currentStepIndex - 1))}
                disabled={currentStepIndex === 0}
                className="flex-1"
              >
                <ArrowLeft className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Previous</span>
                <span className="sm:hidden">Prev</span>
              </Button>
              
              <Button
                size="sm"
                onClick={handleSubmitResponse}
                disabled={!userResponse.trim() || isRecording || isTranscribing || isEvaluating}
                className="flex-1"
              >
                {isEvaluating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 sm:mr-2 animate-spin" />
                    <span className="hidden sm:inline">Evaluating...</span>
                    <span className="sm:hidden">...</span>
                  </>
                ) : currentStepIndex === scenario.steps.length - 1 ? (
                  <>
                    <span className="hidden sm:inline">Complete</span>
                    <span className="sm:hidden">Done</span>
                    <CheckCircle2 className="h-4 w-4 ml-1 sm:ml-2" />
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">Next Step</span>
                    <span className="sm:hidden">Next</span>
                    <ArrowRight className="h-4 w-4 ml-1 sm:ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Response Analysis Drawer */}
      <Drawer open={isAnalysisOpen} onOpenChange={setIsAnalysisOpen}>
        <DrawerContent className="max-h-[90vh] sm:max-h-[85vh]">
          <DrawerHeader className="px-4">
            <DrawerTitle className="text-base sm:text-lg">Response Analysis</DrawerTitle>
            <DrawerDescription className="text-xs sm:text-sm">
              Review your response and feedback before continuing
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-4 overflow-y-auto max-h-[calc(90vh-180px)] sm:max-h-[calc(85vh-200px)]">
            {currentAnalysis && currentStep && (
              <ScenarioResponseAnalysis
                analysis={currentAnalysis}
                userResponse={userResponse}
                correctExample={currentStep.correctResponseExample}
              />
            )}
          </div>
          <DrawerFooter className="gap-2 sm:gap-3 px-4">
            <Button onClick={handleContinueAfterAnalysis} className="w-full sm:w-auto">
              {currentStepIndex === (scenario?.steps.length ?? 0) - 1 ? 'Complete' : 'Continue to Next Step'}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" className="w-full sm:w-auto">Review Again</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}