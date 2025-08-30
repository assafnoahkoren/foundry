import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronRight } from 'lucide-react';

interface SituationCardProps {
  title?: string;
  name: string;
  description?: string;
  onContinue: () => void;
}

export function SituationCard({ title, name, description, onContinue }: SituationCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title || name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="whitespace-pre-wrap">{description}</p>
        <Button onClick={onContinue}>
          Continue
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}