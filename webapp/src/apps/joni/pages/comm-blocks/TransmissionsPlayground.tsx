import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Send, RefreshCw, Mic, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { trpc } from '@/utils/trpc';
import { useVoiceInput } from '@/hooks/useVoiceInput';

interface Variable {
  key: string;
  value: string;
  description?: string;
}

interface BlockAnalysis {
  blockCode: string;
  blockName: string;
  expected: string;
  userInput: string;
  isCorrect: boolean;
  feedback: string;
  icaoCompliance: boolean;
}

interface ValidationResult {
  score: number;
  isCorrect: boolean;
  feedback: string;
  blockAnalysis: BlockAnalysis[];
  overallIcaoCompliance: boolean;
  suggestions: string[];
}

export function TransmissionsPlayground() {
  const { toast } = useToast();
  const [selectedTransmissionId, setSelectedTransmissionId] = useState('');
  const [variables, setVariables] = useState<Variable[]>([]);
  const [userInput, setUserInput] = useState('');
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [renderedTransmission, setRenderedTransmission] = useState('');
  const [activeTab, setActiveTab] = useState('practice');
  const [streamingText, setStreamingText] = useState('');

  // Voice input hook with streaming transcription
  const {
    isListening,
    isTranscribing,
    recordingTime,
    interimTranscript,
    toggleListening,
  } = useVoiceInput({
    onTranscription: (text, isFinal) => {
      if (isFinal) {
        // Final transcription - set the complete text
        setUserInput(text);
        setStreamingText('');
      } else {
        // Interim transcription - show streaming text
        setStreamingText(text);
      }
    },
    contextPrompt: renderedTransmission ? 
      `Aviation radio transmission. Expected format: ${renderedTransmission}` : 
      'Aviation radio transmission',
    language: 'en',
    autoStop: true,
    silenceTimeout: 2000,
    streaming: true,
    streamingInterval: 2000, // Transcribe every 2 seconds
  });

  // Fetch transmissions list
  const { data: transmissions } = trpc.joniComm.transmissions.list.useQuery({});
  
  // Fetch selected transmission with blocks
  const { data: transmissionWithBlocks } = trpc.joniComm.transmissions.getWithBlocks.useQuery(
    { id: selectedTransmissionId },
    { enabled: !!selectedTransmissionId }
  );

  // Validation mutation
  const validateMutation = trpc.joniComm.transmissions.validateTransmission.useMutation({
    onSuccess: (result) => {
      setValidationResult(result);
      setActiveTab('results'); // Automatically switch to results tab
      toast({
        title: result.isCorrect ? 'Great job!' : 'Keep practicing',
        description: `Score: ${result.score}/100`,
        variant: result.isCorrect ? 'default' : 'destructive',
      });
    },
    onError: (error) => {
      toast({
        title: 'Validation failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Extract variables from blocks when transmission changes
  useEffect(() => {
    if (!transmissionWithBlocks) return;

    const extractedVars: Variable[] = [];
    const seenKeys = new Set<string>();

    transmissionWithBlocks.populatedBlocks?.forEach((block) => {
      if (block.template) {
        const regex = /\{\{(\w+)\}\}/g;
        let match;
        while ((match = regex.exec(block.template)) !== null) {
          if (!seenKeys.has(match[1])) {
            seenKeys.add(match[1]);
            extractedVars.push({
              key: match[1],
              value: '',
              description: `Variable from ${block.name}`,
            });
          }
        }
      }
    });

    // Set default values for common variables
    const defaultValues: Record<string, string> = {
      callsign: 'United 451',
      altitude: 'Flight Level 350',
      heading: '270',
      speed: '250 knots',
      runway: '27L',
      frequency: '121.5',
    };

    setVariables(
      extractedVars.map((v) => ({
        ...v,
        value: defaultValues[v.key] || '',
      }))
    );
  }, [transmissionWithBlocks]);

  // Render transmission with variables
  useEffect(() => {
    if (!transmissionWithBlocks) return;

    let rendered = '';
    const variableMap = variables.reduce((acc, v) => {
      acc[v.key] = v.value;
      return acc;
    }, {} as Record<string, string>);

    transmissionWithBlocks.blocks.forEach((blockRef, index) => {
      const block = transmissionWithBlocks.populatedBlocks?.find(
        (b) => b.id === blockRef.blockId
      );
      if (block && block.template) {
        let blockText = block.template;
        for (const [key, value] of Object.entries(variableMap)) {
          blockText = blockText.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
        }
        if (index > 0) rendered += ', ';
        rendered += blockText;
      }
    });

    setRenderedTransmission(rendered);
  }, [transmissionWithBlocks, variables]);

  const handleValidate = async () => {
    if (!selectedTransmissionId || !userInput.trim()) {
      toast({
        title: 'Missing input',
        description: 'Please select a transmission and enter your response.',
        variant: 'destructive',
      });
      return;
    }

    setIsValidating(true);
    const variableMap = variables.reduce((acc, v) => {
      acc[v.key] = v.value;
      return acc;
    }, {} as Record<string, string>);

    try {
      await validateMutation.mutateAsync({
        userInput,
        transmissionId: selectedTransmissionId,
        variables: variableMap,
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleReset = () => {
    setUserInput('');
    setValidationResult(null);
    setActiveTab('practice'); // Switch back to practice tab
  };

  const handleVariableChange = (key: string, value: string) => {
    setVariables((prev) =>
      prev.map((v) => (v.key === key ? { ...v, value } : v))
    );
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Transmissions Playground</h1>
        <p className="text-muted-foreground mt-2">
          Practice ICAO-compliant radio transmissions with real-time AI validation
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Transmission Selection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="transmission-select">Choose Transmission</Label>
                <Select
                  value={selectedTransmissionId}
                  onValueChange={setSelectedTransmissionId}
                >
                  <SelectTrigger id="transmission-select">
                    <SelectValue placeholder="Select a transmission..." />
                  </SelectTrigger>
                  <SelectContent>
                    {transmissions?.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        <div className="flex items-center gap-2">
                          <span>{t.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {t.context}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {transmissionWithBlocks && (
                <div className="space-y-2">
                  <Label>Transmission Type</Label>
                  <Badge>{transmissionWithBlocks.transmissionType}</Badge>
                  <div className="text-sm text-muted-foreground">
                    Difficulty: Level {transmissionWithBlocks.difficultyLevel}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Variables</CardTitle>
              <CardDescription>
                Customize the transmission parameters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-3">
                  {variables.map((variable) => (
                    <div key={variable.key}>
                      <Label htmlFor={variable.key} className="text-sm">
                        {variable.key}
                      </Label>
                      <Input
                        id={variable.key}
                        value={variable.value}
                        onChange={(e) =>
                          handleVariableChange(variable.key, e.target.value)
                        }
                        placeholder={`Enter ${variable.key}...`}
                        className="mt-1"
                      />
                      {variable.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {variable.description}
                        </p>
                      )}
                    </div>
                  ))}
                  {variables.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Select a transmission to see variables
                    </p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Main Practice Area */}
        <div className="lg:col-span-2 space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="practice">Practice</TabsTrigger>
              <TabsTrigger value="results" disabled={!validationResult}>
                Results
              </TabsTrigger>
            </TabsList>

            <TabsContent value="practice" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Expected Transmission</CardTitle>
                  <CardDescription>
                    This is the correctly formatted transmission
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-muted rounded-lg font-mono text-sm">
                    {renderedTransmission || 
                     'Select a transmission and fill in variables to see the expected format'}
                  </div>
                  {transmissionWithBlocks?.populatedBlocks && (
                    <div className="mt-4 space-y-2">
                      <Label className="text-sm">Comm Blocks:</Label>
                      <div className="flex flex-wrap gap-2">
                        {transmissionWithBlocks.populatedBlocks.map((block) => (
                          <Badge key={block.id} variant="secondary">
                            {block.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Your Transmission</CardTitle>
                  <CardDescription>
                    Enter your transmission following ICAO phraseology
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isListening && (
                    <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950">
                      <Mic className="h-4 w-4 animate-pulse" />
                      <AlertDescription>
                        Listening... Speak clearly and the recording will stop automatically after 2 seconds of silence.
                        {streamingText && (
                          <div className="mt-2 p-2 bg-white dark:bg-gray-900 rounded text-sm font-mono">
                            <span className="text-muted-foreground">Live transcription: </span>
                            <span className="text-blue-600 dark:text-blue-400">{streamingText}</span>
                          </div>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}
                  <div className="relative">
                    <Textarea
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      placeholder="Enter your transmission here..."
                      className="min-h-[150px] font-mono"
                    />
                    {isListening && interimTranscript && (
                      <div className="absolute bottom-2 left-2 right-2 p-2 bg-blue-50 dark:bg-blue-950 rounded-md pointer-events-none">
                        <span className="text-xs text-blue-600 dark:text-blue-400 animate-pulse">
                          Transcribing: {interimTranscript}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleValidate}
                      disabled={isValidating || !selectedTransmissionId}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {isValidating ? 'Validating...' : 'Validate'}
                    </Button>
                    <Button variant="outline" onClick={handleReset}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Reset
                    </Button>
                    <Button 
                      variant={isListening ? "destructive" : "outline"}
                      onClick={toggleListening}
                      disabled={isTranscribing}
                    >
                      <Mic className={`h-4 w-4 mr-2 ${isListening ? 'animate-pulse' : ''}`} />
                      {isListening ? `Recording ${recordingTime}` : 
                       isTranscribing ? 'Transcribing...' : 'Voice Input'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="results" className="space-y-4">
              {validationResult && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle>Validation Results</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {validationResult.isCorrect ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600" />
                          )}
                          <span className="font-semibold">
                            Score: {validationResult.score}/100
                          </span>
                        </div>
                        <Badge
                          variant={
                            validationResult.overallIcaoCompliance
                              ? 'default'
                              : 'destructive'
                          }
                        >
                          {validationResult.overallIcaoCompliance
                            ? 'ICAO Compliant'
                            : 'Non-Compliant'}
                        </Badge>
                      </div>
                      <Progress value={validationResult.score} />
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          {validationResult.feedback}
                        </AlertDescription>
                      </Alert>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Block-by-Block Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {validationResult.blockAnalysis?.map(
                          (block: BlockAnalysis, index: number) => (
                            <div
                              key={index}
                              className="p-3 border rounded-lg space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {block.isCorrect ? (
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-red-600" />
                                  )}
                                  <span className="font-medium">
                                    {block.blockName}
                                  </span>
                                </div>
                                <Badge
                                  variant={
                                    block.icaoCompliance
                                      ? 'outline'
                                      : 'destructive'
                                  }
                                  className="text-xs"
                                >
                                  {block.icaoCompliance ? 'ICAO' : 'Non-ICAO'}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                <div>
                                  <Label className="text-xs">Expected:</Label>
                                  <div className="p-2 bg-muted rounded text-xs font-mono">
                                    {block.expected}
                                  </div>
                                </div>
                                <div>
                                  <Label className="text-xs">Your Input:</Label>
                                  <div className="p-2 bg-muted rounded text-xs font-mono">
                                    {block.userInput}
                                  </div>
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {block.feedback}
                              </p>
                            </div>
                          )
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {validationResult.suggestions?.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Suggestions for Improvement</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {validationResult.suggestions.map(
                            (suggestion: string, index: number) => (
                              <li
                                key={index}
                                className="flex items-start gap-2 text-sm"
                              >
                                <span className="text-muted-foreground">•</span>
                                <span>{suggestion}</span>
                              </li>
                            )
                          )}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}