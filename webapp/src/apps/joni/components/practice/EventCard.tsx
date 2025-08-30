import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, ChevronRight } from 'lucide-react';

interface EventCardProps {
  title?: string;
  details?: string;
  description?: string;
  onAcknowledge: () => void;
}

export function EventCard({ title, details, description, onAcknowledge }: EventCardProps) {
  return (
    <Card className="border-yellow-300 bg-yellow-50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          <CardTitle className="text-yellow-900">
            {title || 'Event'}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-yellow-900">
          {details || description}
        </p>
        <Button 
          onClick={onAcknowledge}
          variant="outline"
          className="border-yellow-600 text-yellow-900 hover:bg-yellow-100"
        >
          Acknowledge
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}