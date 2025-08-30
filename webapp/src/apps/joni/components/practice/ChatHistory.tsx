import { ScrollArea } from '@/components/ui/scroll-area';

export interface ChatMessage {
  id: string;
  type: 'atc' | 'pilot' | 'system';
  speaker?: string;
  content: string;
  timestamp: Date;
}

interface ChatHistoryProps {
  messages: ChatMessage[];
}

export function ChatHistory({ messages }: ChatHistoryProps) {
  return (
    <div className="w-80 border-r bg-white">
      <div className="p-4 border-b">
        <h2 className="font-semibold">Transmission Log</h2>
      </div>
      <ScrollArea className="h-[calc(100vh-180px)]">
        <div className="p-4 space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`text-sm ${
                msg.type === 'pilot' ? 'text-right' : ''
              }`}
            >
              <div className="font-medium text-xs text-muted-foreground mb-1">
                {msg.speaker}
              </div>
              <div
                className={`inline-block p-2 rounded-lg max-w-[90%] ${
                  msg.type === 'pilot'
                    ? 'bg-blue-500 text-white'
                    : msg.type === 'system'
                    ? 'bg-yellow-100 text-yellow-900'
                    : 'bg-gray-100'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}