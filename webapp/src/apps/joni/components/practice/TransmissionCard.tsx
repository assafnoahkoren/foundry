import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Radio, Volume2, VolumeX, Loader2, Waves } from 'lucide-react';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { useEffect, useState } from 'react';
import { toast } from '@/hooks/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface TransmissionCardProps {
  speaker: string;
  content: string;
  actorRole?: string;
  autoPlay?: boolean;
}

export function TransmissionCard({ speaker, content, actorRole, autoPlay = false }: TransmissionCardProps) {
  const [radioEffectEnabled, setRadioEffectEnabled] = useState(true);
  
  // Don't fetch audio if content is just a loading placeholder
  const isContentReady = content && !content.includes('[Loading transmission...]');
  
  // Use TTS hook with auto-fetch enabled only when content is ready
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
    autoFetch: isContentReady, // Only fetch when we have real content
    applyRadioEffect: radioEffectEnabled,
    onError: (err) => {
      toast({
        title: 'Audio Error',
        description: err.message,
        variant: 'destructive',
      });
    },
  });

  // Auto-play when audio is ready (if enabled and content is ready)
  useEffect(() => {
    if (autoPlay && isContentReady && audioUrl && !isLoading && !error && !isPlaying) {
      play();
    }
  }, [autoPlay, isContentReady, audioUrl, isLoading, error]); // eslint-disable-line react-hooks/exhaustive-deps
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
              {radioEffectEnabled && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Waves className="w-3 h-3 text-blue-500 animate-pulse" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Radio effect enabled</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setRadioEffectEnabled(!radioEffectEnabled)}
                    className="h-8 w-8 p-0"
                    aria-label={radioEffectEnabled ? 'Disable radio effect' : 'Enable radio effect'}
                  >
                    <Waves className={`w-4 h-4 ${radioEffectEnabled ? 'text-blue-500' : 'text-gray-400'}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">{radioEffectEnabled ? 'Disable' : 'Enable'} radio effect</p>
                </TooltipContent>
              </Tooltip>
              <Button
                size="sm"
                variant="ghost"
                onClick={handlePlayPause}
                disabled={!isContentReady || isLoading || !!error}
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
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm">{content}</p>
        </CardContent>
      </Card>
    </div>
  );
}