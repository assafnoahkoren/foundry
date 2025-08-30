import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Send, User } from 'lucide-react';

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
  return (
    <div className="flex justify-end">
      <Card className="max-w-lg w-full">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span className="font-semibold">Your Transmission</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyPress={onKeyPress}
            placeholder="Type your transmission here..."
            className="min-h-[80px]"
            disabled={isProcessing}
          />
          <Button 
            onClick={onTransmit}
            disabled={!value.trim() || isProcessing}
            className="w-full"
          >
            <Send className="w-4 h-4 mr-2" />
            Transmit
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}