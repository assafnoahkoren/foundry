import { Handle, Position } from '@xyflow/react';
import { Users } from 'lucide-react';

import type { NodeContent } from '../../../types/script-dag.types';

interface CrewInteractionNodeProps {
  data: {
    label: string;
    description?: string;
    content: NodeContent;
    originalType: string;
  };
  selected: boolean;
}

const urgencyColors = {
  routine: 'bg-green-50 dark:bg-green-900/20 border-green-300',
  important: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-400',
  urgent: 'bg-orange-50 dark:bg-orange-900/20 border-orange-400',
  emergency: 'bg-red-50 dark:bg-red-900/20 border-red-400'
};

export function CrewInteractionNode({ data, selected }: CrewInteractionNodeProps) {
  const speaker = data.content?.speaker || 'crew';
  const urgency = data.content?.urgency || 'routine';
  const colorClass = urgencyColors[urgency as keyof typeof urgencyColors];
  
  return (
    <div 
      className={`
        px-4 py-3 rounded-lg border-2 min-w-[200px]
        ${selected ? 'border-primary shadow-lg' : ''}
        ${colorClass}
      `}
    >
      <Handle 
        type="target" 
        position={Position.Top} 
        className="w-3 h-3 bg-gray-400 border-2 border-white"
      />
      
      <div className="flex items-start gap-2">
        <Users className="w-4 h-4 mt-1 text-green-600" />
        <div className="flex-1">
          <div className="font-medium text-sm">{data.label}</div>
          {data.description && (
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {data.description}
            </div>
          )}
          <div className="text-xs text-green-600 dark:text-green-400 mt-1">
            {speaker.replace('_', ' ').toUpperCase()}
          </div>
        </div>
      </div>
      
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="w-3 h-3 bg-gray-400 border-2 border-white"
      />
    </div>
  );
}