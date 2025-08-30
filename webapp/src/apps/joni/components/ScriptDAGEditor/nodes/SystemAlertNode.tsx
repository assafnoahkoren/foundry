import { Handle, Position } from '@xyflow/react';
import { AlertCircle } from 'lucide-react';

import type { NodeContent } from '../../../types/script-dag.types';

interface SystemAlertNodeProps {
  data: {
    label: string;
    description?: string;
    content: NodeContent;
    originalType: string;
  };
  selected: boolean;
}

const alertColors = {
  advisory: 'bg-blue-50 dark:bg-blue-900/20 border-blue-300',
  caution: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-400',
  warning: 'bg-red-50 dark:bg-red-900/20 border-red-400'
};

export function SystemAlertNode({ data, selected }: SystemAlertNodeProps) {
  const system = data.content?.system || 'SYSTEM';
  const alertType = data.content?.alertType || 'advisory';
  const colorClass = alertColors[alertType as keyof typeof alertColors];
  
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
        <AlertCircle className="w-4 h-4 mt-1" />
        <div className="flex-1">
          <div className="font-medium text-sm">{data.label}</div>
          {data.description && (
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {data.description}
            </div>
          )}
          <div className="text-xs font-mono mt-1">
            {system} - {alertType.toUpperCase()}
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