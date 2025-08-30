import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { Loader2, Mic, MicOff, Send, User, Variable } from 'lucide-react';

interface UserResponseCardProps {
  value: string;
  onChange: (value: string) => void;
  onTransmit: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  isProcessing: boolean;
  expectedResponse?: string;
  transmissionData?: {
    blocks?: Array<{ blockId: string }>;
    populatedBlocks?: Array<{ id: string; template?: string }>;
  } | null;
  variables?: Record<string, string>;
  hasValidationResult?: boolean;
}

export function UserResponseCard({ 
  value, 
  onChange, 
  onTransmit, 
  onKeyPress, 
  isProcessing,
  expectedResponse,
  transmissionData,
  variables = {},
  hasValidationResult = false
}: UserResponseCardProps) {
  const {
    isListening,
    isTranscribing,
    transcript,
    recordingTime,
    toggleListening,
    clearTranscript,
  } = useVoiceInput({
    onTranscription: (text) => {
      // Update the input with both interim and final results
      onChange(text);
    },
    contextPrompt: 'Aviation radio communication, pilot transmission, ATC phraseology',
    streaming: true,  // Enable streaming for live transcription
    streamingInterval: 1500,  // Transcribe every 1.5 seconds for faster updates
  });

  // No need for useEffect since onTranscription callback handles updates

  const handleMicToggle = () => {
    if (isListening) {
      toggleListening();
    } else {
      clearTranscript();
      onChange('');
      toggleListening();
    }
  };

  // Render template with variable chips
  const renderTemplateWithChips = () => {
    if (!transmissionData?.populatedBlocks) return null;
    
    return (
      <div className="flex flex-wrap items-center gap-2">
        {transmissionData.populatedBlocks.map((block, index) => {
          if (!block.template) return null;
          
          // Split template by variable placeholders
          const parts = block.template.split(/(\{\{[^}]+\}\})/);
          
          return (
            <div key={block.id} className="flex items-center gap-1">
              {parts.map((part, partIndex) => {
                // Check if this is a variable placeholder
                const varMatch = part.match(/\{\{([^}]+)\}\}/);
                if (varMatch) {
                  const varName = varMatch[1];
                  const varValue = variables[varName];
                  
                  return (
                    <TooltipProvider key={`${block.id}-${partIndex}`}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge 
                            variant="secondary" 
                            className="px-2 py-1 bg-purple-100 text-purple-800 border-purple-200 cursor-help"
                          >
                            <Variable className="w-3 h-3 mr-1" />
                            {varValue || varName}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-mono text-xs">{`{{${varName}}}`} = {varValue || 'undefined'}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                } else if (part) {
                  return <span key={`${block.id}-${partIndex}`} className="text-sm">{part}</span>;
                }
                return null;
              })}
              {index < transmissionData.populatedBlocks.length - 1 && (
                <span className="text-sm text-gray-500">,</span>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex justify-end">
      <Card className="max-w-lg w-full">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="font-semibold">Your Transmission</span>
            </div>
            {isListening && (
              <Badge variant="destructive" className="animate-pulse">
                <Mic className="w-3 h-3 mr-1" />
                Recording {recordingTime}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {expectedResponse && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
              <div>
                <p className="text-xs font-medium text-blue-700 mb-2">Template:</p>
                {renderTemplateWithChips()}
              </div>
              <div className="pt-2 border-t border-blue-200">
                <p className="text-xs font-medium text-blue-700 mb-1">Expected Response:</p>
                <p className="text-sm text-blue-900 font-mono">{expectedResponse}</p>
              </div>
            </div>
          )}
          <div className="flex gap-3 items-stretch">
            <div className="flex-1">
              <Textarea
                value={isListening ? (transcript || value) : value}
                onChange={(e) => onChange(e.target.value)}
                onKeyPress={onKeyPress}
                placeholder={isListening ? "Listening..." : hasValidationResult ? "Transmission sent" : "Type your transmission or use voice input..."}
                className="min-h-[80px]"
                disabled={isProcessing || isListening || hasValidationResult}
              />
            </div>
            <div className="flex items-center">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant={isListening ? "destructive" : "secondary"}
                      className={`h-[80px] w-[80px] rounded-full shadow-lg transition-all ${
                        isListening ? 'ring-4 ring-red-200 animate-pulse' : 'hover:scale-105'
                      }`}
                      onClick={handleMicToggle}
                      disabled={isProcessing || hasValidationResult}
                      type="button"
                      aria-label={isListening ? "Stop recording" : "Start voice input"}
                    >
                      {isListening && isTranscribing ? (
                        <Loader2 className="w-8 h-8 animate-spin" />
                      ) : isListening ? (
                        <MicOff className="w-8 h-8" />
                      ) : (
                        <Mic className="w-8 h-8" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isListening ? 'Stop recording' : 'Start voice input (Push to talk)'}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={onTransmit}
              disabled={!value.trim() || isProcessing || isListening || hasValidationResult}
              className="flex-1"
            >
              <Send className="w-4 h-4 mr-2" />
              {hasValidationResult ? 'Transmitted' : 'Transmit'}
            </Button>
            {value && !isListening && !hasValidationResult && (
              <Button
                variant="outline"
                onClick={() => onChange('')}
                disabled={isProcessing}
                type="button"
              >
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}