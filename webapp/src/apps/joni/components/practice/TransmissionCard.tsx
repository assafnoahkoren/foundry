import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Radio } from 'lucide-react';

interface TransmissionCardProps {
  speaker: string;
  content: string;
  actorRole?: string;
}

export function TransmissionCard({ speaker, content, actorRole }: TransmissionCardProps) {
  const getSpeakerColor = (role?: string): string => {
    switch (role) {
      case 'tower': return 'bg-blue-500/10 border-blue-500/20 text-blue-900';
      case 'ground': return 'bg-green-500/10 border-green-500/20 text-green-900';
      case 'departure': return 'bg-purple-500/10 border-purple-500/20 text-purple-900';
      case 'approach': return 'bg-orange-500/10 border-orange-500/20 text-orange-900';
      default: return 'bg-gray-500/10 border-gray-500/20 text-gray-900';
    }
  };

  return (
    <div className="flex justify-start">
      <Card className={`max-w-lg ${getSpeakerColor(actorRole)}`}>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4" />
            <span className="font-semibold">{speaker}</span>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm">{content}</p>
        </CardContent>
      </Card>
    </div>
  );
}