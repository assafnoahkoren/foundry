import { Handle, Position } from '@xyflow/react';
import { Radio } from 'lucide-react';

import type { NodeContent } from '../../../types/script-dag.types';

interface TransmissionNodeProps {
  data: {
    label: string;
    description?: string;
    content: NodeContent;
    originalType: string;
  };
  selected: boolean;
}

export function TransmissionNode({ data, selected }: TransmissionNodeProps) {
  const actorRole = data.content?.actorRole || 'unknown';
  
  return (
    <div 
      className={`
        px-4 py-3 rounded-lg border-2 min-w-[200px]
        ${selected ? 'border-primary shadow-lg' : 'border-gray-300'}
        bg-blue-50 dark:bg-blue-900/20
      `}
    >
      <Handle 
        type="target" 
        position={Position.Top} 
        className="w-3 h-3 bg-gray-400 border-2 border-white"
      />
      
      <div className="flex items-start gap-2">
        <Radio className="w-4 h-4 mt-1 text-blue-600" />
        <div className="flex-1">
          <div className="font-medium text-sm">{data.label}</div>
          {data.description && (
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {data.description}
            </div>
          )}
          <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
            {actorRole.toUpperCase()}
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