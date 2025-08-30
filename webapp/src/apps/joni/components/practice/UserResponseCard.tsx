import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Send, User, Mic, MicOff, Loader2 } from 'lucide-react';
import { useVoiceInput } from '@/hooks/useVoiceInput';

interface UserResponseCardProps {
  value: string;
  onChange: (value: string) => void;
  onTransmit: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  isProcessing: boolean;
}

export function UserResponseCard({ 
  value, 
  onChange, 
  onTransmit, 
  onKeyPress, 
  isProcessing 
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
    streamingInterval: 3000,  // Transcribe every 3 seconds
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
          <div className="relative">
            <Textarea
              value={isListening ? (transcript || value) : value}
              onChange={(e) => onChange(e.target.value)}
              onKeyPress={onKeyPress}
              placeholder={isListening ? "Listening..." : "Type your transmission or use voice input..."}
              className="min-h-[80px] pr-12"
              disabled={isProcessing || isListening}
            />
            <Button
              size="icon"
              variant={isListening ? "destructive" : "ghost"}
              className="absolute right-2 top-2 h-8 w-8"
              onClick={handleMicToggle}
              disabled={isProcessing}
              type="button"
            >
              {isListening && isTranscribing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isListening ? (
                <MicOff className="w-4 h-4" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </Button>
          </div>
          {isListening && isTranscribing && (
            <p className="text-xs text-blue-600 animate-pulse">
              Transcribing...
            </p>
          )}
          <div className="flex gap-2">
            <Button 
              onClick={onTransmit}
              disabled={!value.trim() || isProcessing || isListening}
              className="flex-1"
            >
              <Send className="w-4 h-4 mr-2" />
              Transmit
            </Button>
            {value && !isListening && (
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