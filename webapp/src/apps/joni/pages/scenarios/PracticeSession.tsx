import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { trpc } from '@/utils/trpc';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { ScriptNode, ScriptDAG } from '../../types/script-dag.types';
import { ChatHistory, type ChatMessage } from '../../components/practice/ChatHistory';
import { SituationCard } from '../../components/practice/SituationCard';
import { TransmissionCard } from '../../components/practice/TransmissionCard';
import { UserResponseCard } from '../../components/practice/UserResponseCard';
import { EventCard } from '../../components/practice/EventCard';
import { NodeNavigation } from '../../components/practice/NodeNavigation';
import { TransmissionValidation } from '../../components/practice/TransmissionValidation';
import { TransmissionValidationSkeleton } from '../../components/practice/TransmissionValidationSkeleton';

export function PracticeSession() {
  const { scriptId } = useParams<{ scriptId: string }>();
  const navigate = useNavigate();
  
  // State
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [visitedNodes, setVisitedNodes] = useState<Set<string>>(new Set());
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [nodeHistoryMap, setNodeHistoryMap] = useState<Map<string, ChatMessage[]>>(new Map());
  const [userInput, setUserInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [showContinue, setShowContinue] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    score: number;
    isCorrect: boolean;
    feedback: string;
    blockAnalysis: Array<{
      blockCode: string;
      blockName: string;
      expected: string;
      userInput: string;
      isCorrect: boolean;
      feedback: string;
      icaoCompliance: boolean;
    }>;
    overallIcaoCompliance: boolean;
    suggestions: string[];
  } | null>(null);
  const [showValidation, setShowValidation] = useState(false);
  
  // Fetch script data
  const { data: script, isLoading } = trpc.joniComm.scripts.getById.useQuery(
    { id: scriptId! },
    { enabled: !!scriptId }
  );
  
  // Parse DAG structure
  const dag = script?.dagStructure as ScriptDAG | undefined;
  const currentNode = dag?.nodes.find(n => n.id === currentNodeId);
  
  // Calculate progress
  const progress = dag ? (visitedNodes.size / dag.nodes.length) * 100 : 0;
  
  // Get actor role label
  const getActorLabel = (role?: string): string => {
    switch (role) {
      case 'tower': return 'Tower';
      case 'ground': return 'Ground Control';
      case 'departure': return 'Departure';
      case 'approach': return 'Approach';
      case 'center': return 'Center';
      default: return 'ATC';
    }
  };
  
  // Fetch transmission data for current node
  const transmissionId = currentNode?.content?.type === 'transmission_ref' 
    ? currentNode.content.transmissionId 
    : currentNode?.type === 'user_response' && currentNode?.content?.transmissionId
    ? currentNode.content.transmissionId
    : null;
    
  const { data: transmissionData } = trpc.joniComm.transmissions.getWithBlocks.useQuery(
    { id: transmissionId || '' },
    { enabled: !!transmissionId }
  );
  
  // Validation mutation
  const validateTransmissionMutation = trpc.joniComm.transmissions.validateUserTransmission.useMutation({
    onSuccess: (result) => {
      setValidationResult(result);
      setShowValidation(true);
      setIsProcessing(false);
      setIsEvaluating(false);
      // Don't auto-advance - wait for user to click continue
    },
    onError: (error) => {
      toast({
        title: 'Validation Error',
        description: error.message || 'Failed to validate transmission',
        variant: 'destructive'
      });
      setIsProcessing(false);
      setIsEvaluating(false);
      setShowValidation(false);
      // Don't auto-advance on error either
    }
  });
  
  // Helper to render transmission content with variables
  const renderTransmissionWithVariables = (
    transmissionData: { 
      blocks?: Array<{ blockId: string }>;
      populatedBlocks?: Array<{ id: string; template?: string }>;
    } | null, 
    nodeVariables?: Record<string, string>
  ) => {
    if (!transmissionData) return '';
    
    const variables = { 
      ...dag?.globalVariables, 
      ...nodeVariables 
    };
    
    let content = '';
    transmissionData.blocks?.forEach((blockRef: { blockId: string }, index: number) => {
      const block = transmissionData.populatedBlocks?.find(
        (b: { id: string; template?: string }) => b.id === blockRef.blockId
      );
      if (block?.template) {
        let blockText = block.template;
        // Replace variables
        for (const [key, value] of Object.entries(variables)) {
          blockText = blockText.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value as string);
        }
        if (index > 0) content += ', ';
        content += blockText;
      }
    });
    
    return content || '';
  };

  // Render transmission content for current node
  const renderTransmissionContent = () => {
    if (!transmissionData) return '[Loading transmission...]';
    return renderTransmissionWithVariables(transmissionData, currentNode?.content?.variables) || '[Transmission content]';
  };
  
  
  // Move to next node based on condition
  const moveToNextNode = (conditionType: string) => {
    if (!dag || !currentNodeId) return;
    
    // Find edges from current node
    const edges = dag.edges.filter(e => e.from === currentNodeId);
    
    // Find the edge with matching condition (or default)
    const edge = edges.find(e => e.condition.type === conditionType) || 
                 edges.find(e => e.condition.type === 'default');
    
    if (edge) {
      setCurrentNodeId(edge.to);
      setShowContinue(false); // Clear continue button when moving to next node
    } else {
      // No more nodes - scenario complete
      toast({
        title: 'Scenario Complete!',
        description: 'You have completed the training scenario.'
      });
    }
  };
  
  // Handle Continue button for situations
  const handleContinue = () => {
    if (currentNode) {
      setVisitedNodes(prev => new Set([...prev, currentNode.id]));
      moveToNextNode('default');
    }
  };
  
  // Handle user transmission
  const handleTransmit = async () => {
    if (!userInput.trim() || !currentNode) return;
    
    setIsProcessing(true);
    setShowValidation(false);
    
    // Add user message to chat
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'pilot',
      speaker: 'You',
      content: userInput,
      timestamp: new Date()
    };
    
    const newHistory = [...chatHistory, userMessage];
    setChatHistory(newHistory);
    setVisitedNodes(prev => new Set([...prev, currentNode.id]));
    
    // Save history snapshot for this node
    setNodeHistoryMap(prev => new Map(prev).set(currentNode.id, newHistory));
    
    const savedInput = userInput;
    setUserInput('');
    
    // If we have a transmission ID, validate with LLM
    if (transmissionId && transmissionData) {
      const variables = {
        ...dag?.globalVariables,
        ...currentNode.content?.variables
      };
      
      setIsEvaluating(true);
      setShowValidation(true);
      
      validateTransmissionMutation.mutate({
        userInput: savedInput,
        transmissionId,
        variables
      });
    } else {
      // No transmission to validate against, show simple feedback
      setIsProcessing(false);
      setShowValidation(true);
      setValidationResult({
        score: 100,
        isCorrect: true,
        feedback: 'Response recorded.',
        blockAnalysis: [],
        overallIcaoCompliance: true,
        suggestions: []
      });
    }
  };
  
  // Handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !showValidation) {
      e.preventDefault();
      handleTransmit();
    }
  };
  
  // Process transmission node
  const processTransmissionNode = (node: ScriptNode) => {
    if (node.content?.type === 'transmission_ref' && transmissionData) {
      const actorRole = node.content.actorRole;
      
      const message: ChatMessage = {
        id: node.id,
        type: 'atc',
        speaker: getActorLabel(actorRole),
        content: renderTransmissionContent(),
        timestamp: new Date()
      };
      
      const newHistory = [...chatHistory, message];
      setChatHistory(newHistory);
      setVisitedNodes(prev => new Set([...prev, node.id]));
      
      // Save history snapshot for this node
      setNodeHistoryMap(prev => new Map(prev).set(node.id, newHistory));
      
      // Show continue button instead of auto-advancing
      setShowContinue(true);
    }
  };
  
  // Handle navigation to previous node
  const handleNodeNavigation = (nodeId: string) => {
    if (visitedNodes.has(nodeId) || nodeId === currentNodeId) {
      setCurrentNodeId(nodeId);
      // Clear any processing state
      setIsProcessing(false);
      setIsEvaluating(false);
      setUserInput('');
      setShowValidation(false);
      setValidationResult(null);
      setShowContinue(false);
      
      // Restore chat history to the state at this node
      const nodeHistory = nodeHistoryMap.get(nodeId);
      if (nodeHistory) {
        setChatHistory(nodeHistory);
      } else {
        // If no history exists for this node, find the previous node's history
        const nodeIndex = dag?.nodes.findIndex(n => n.id === nodeId) || 0;
        if (nodeIndex > 0 && dag) {
          // Find the closest previous node with history
          for (let i = nodeIndex - 1; i >= 0; i--) {
            const prevNodeId = dag.nodes[i].id;
            const prevHistory = nodeHistoryMap.get(prevNodeId);
            if (prevHistory) {
              setChatHistory(prevHistory);
              break;
            }
          }
          // If no previous history found, clear the chat
          if (!nodeHistoryMap.has(dag.nodes[Math.max(0, nodeIndex - 1)].id)) {
            setChatHistory([]);
          }
        } else {
          // Clear history if we're at the first node
          setChatHistory([]);
        }
      }
    }
  };

  // Handle validation continue
  const handleValidationContinue = () => {
    setShowValidation(false);
    setValidationResult(null);
    if (validationResult?.isCorrect) {
      moveToNextNode('validation_pass');
    } else {
      moveToNextNode('validation_fail');
    }
  };

  // Handle validation retry
  const handleValidationRetry = () => {
    setShowValidation(false);
    setValidationResult(null);
    // Stay on the same node for retry
  };

  // Handle generic continue for non-user-response nodes
  const handleGenericContinue = () => {
    setShowContinue(false);
    moveToNextNode('default');
  };

  // Initialize with start node
  useEffect(() => {
    if (dag && !currentNodeId) {
      // Find the first node (usually 'node-start' or similar)
      const startNode = dag.nodes.find(n => n.id === 'node-start') || dag.nodes[0];
      if (startNode) {
        setCurrentNodeId(startNode.id);
      }
    }
  }, [dag, currentNodeId]);
  
  // Process nodes and show continue button for non-user-response nodes
  useEffect(() => {
    if (currentNode) {
      if (currentNode.type === 'transmission' && transmissionData) {
        processTransmissionNode(currentNode);
      } else if (currentNode.type !== 'user_response') {
        // For all other node types (situation, event, etc.), show continue button
        setShowContinue(true);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentNode, transmissionData]);
  
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-8">
            <div className="text-center">Loading scenario...</div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!script || !dag) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">Scenario not found</p>
              <Button onClick={() => navigate('/joni/scenarios')}>
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
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header with progress */}
      <div className="bg-white border-b p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/joni/scenarios')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Exit
              </Button>
              <div>
                <h1 className="text-lg font-semibold">{script.name}</h1>
                <p className="text-sm text-muted-foreground">{script.description}</p>
              </div>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">
            Progress: {Math.round(progress)}%
          </p>
          {dag && (
            <NodeNavigation
              nodes={dag.nodes}
              currentNodeId={currentNodeId}
              visitedNodes={visitedNodes}
              onNodeClick={handleNodeNavigation}
            />
          )}
        </div>
      </div>
      
      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex">
          {/* Chat history sidebar */}
          <ChatHistory messages={chatHistory} />
          
          {/* Main practice area */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1 overflow-auto p-8">
              <div className="max-w-3xl mx-auto space-y-6">
                {/* Render current node */}
                {currentNode && (
                  <>
                    {/* Situation node */}
                    {currentNode.type === 'situation' && (
                      <SituationCard
                        title={currentNode.content?.title}
                        name={currentNode.name}
                        description={currentNode.content?.description}
                        onContinue={handleContinue}
                      />
                    )}
                    
                    {/* Transmission node */}
                    {currentNode.type === 'transmission' && (
                      <TransmissionCard
                        speaker={getActorLabel(currentNode.content?.actorRole)}
                        content={renderTransmissionContent()}
                        actorRole={currentNode.content?.actorRole}
                      />
                    )}
                    
                    {/* User response node */}
                    {currentNode.type === 'user_response' && (
                      <>
                        <UserResponseCard
                          value={userInput}
                          onChange={setUserInput}
                          onTransmit={handleTransmit}
                          onKeyPress={handleKeyPress}
                          isProcessing={isProcessing}
                          expectedResponse={transmissionData ? renderTransmissionWithVariables(transmissionData, currentNode.content?.variables) : undefined}
                          transmissionData={transmissionData}
                          variables={{
                            ...dag?.globalVariables,
                            ...currentNode.content?.variables
                          }}
                          hasValidationResult={showValidation}
                        />
                        
                        {/* Show skeleton while evaluating, or validation result when ready */}
                        {showValidation && (
                          isEvaluating ? (
                            <TransmissionValidationSkeleton />
                          ) : validationResult ? (
                            <TransmissionValidation
                              score={validationResult.score}
                              isCorrect={validationResult.isCorrect}
                              feedback={validationResult.feedback}
                              blockAnalysis={validationResult.blockAnalysis}
                              overallIcaoCompliance={validationResult.overallIcaoCompliance}
                              suggestions={validationResult.suggestions}
                              onContinue={handleValidationContinue}
                              onRetry={handleValidationRetry}
                            />
                          ) : null
                        )}
                      </>
                    )}
                    
                    {/* Event node */}
                    {currentNode.type === 'event' && (
                      <EventCard
                        title={currentNode.content?.title}
                        details={currentNode.content?.details}
                        description={currentNode.content?.description}
                        onAcknowledge={handleContinue}
                      />
                    )}
                    
                    {/* Continue button for non-user-response nodes */}
                    {currentNode.type !== 'user_response' && showContinue && (
                      <div className="mt-4">
                        <Button onClick={handleGenericContinue} className="w-full">
                          Continue
                          <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}