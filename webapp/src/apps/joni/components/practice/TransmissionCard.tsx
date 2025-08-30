import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Radio, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

interface TransmissionCardProps {
  speaker: string;
  content: string;
  actorRole?: string;
  autoPlay?: boolean;
}

export function TransmissionCard({ speaker, content, actorRole, autoPlay = false }: TransmissionCardProps) {
  // Use TTS hook with auto-fetch enabled
  const {
    isLoading,
    isPlaying,
    error,
    play,
    stop,
    audioUrl,
  } = useTextToSpeech({
    text: content,
    role: 'atc', // All transmission cards are from ATC perspective
    autoFetch: true, // Fetch audio on render
    onError: (err) => {
      toast({
        title: 'Audio Error',
        description: err.message,
        variant: 'destructive',
      });
    },
  });

  // Auto-play when audio is ready (if enabled)
  useEffect(() => {
    if (autoPlay && audioUrl && !isLoading && !error && !isPlaying) {
      play();
    }
  }, [autoPlay, audioUrl, isLoading, error]); // eslint-disable-line react-hooks/exhaustive-deps
  const getSpeakerColor = (role?: string): string => {
    switch (role) {
      case 'tower': return 'bg-blue-500/10 border-blue-500/20 text-blue-900';
      case 'ground': return 'bg-green-500/10 border-green-500/20 text-green-900';
      case 'departure': return 'bg-purple-500/10 border-purple-500/20 text-purple-900';
      case 'approach': return 'bg-orange-500/10 border-orange-500/20 text-orange-900';
      default: return 'bg-gray-500/10 border-gray-500/20 text-gray-900';
    }
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      stop();
    } else {
      play();
    }
  };

  return (
    <div className="flex justify-start">
      <Card className={`max-w-lg ${getSpeakerColor(actorRole)}`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4" />
              <span className="font-semibold">{speaker}</span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={handlePlayPause}
              disabled={isLoading || !!error}
              className="h-8 w-8 p-0"
              aria-label={isPlaying ? 'Stop audio' : 'Play audio'}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isPlaying ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm">{content}</p>
        </CardContent>
      </Card>
    </div>
  );
}