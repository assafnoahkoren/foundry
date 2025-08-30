import { Handle, Position } from '@xyflow/react';
import { GitBranch } from 'lucide-react';

import type { NodeContent } from '../../../types/script-dag.types';

interface DecisionNodeProps {
  data: {
    label: string;
    description?: string;
    content: NodeContent;
    originalType: string;
  };
  selected: boolean;
}

export function DecisionNode({ data, selected }: DecisionNodeProps) {
  const options = data.content?.options || [];
  
  return (
    <div 
      className={`
        px-4 py-3 rounded-lg border-2 min-w-[200px]
        ${selected ? 'border-primary shadow-lg' : 'border-gray-300'}
        bg-purple-50 dark:bg-purple-900/20
        transform rotate-45
      `}
      style={{ transform: 'rotate(0deg)' }} // Override for content
    >
      <div 
        className="transform"
        style={{ 
          clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
          backgroundColor: 'inherit'
        }}
      >
        <Handle 
          type="target" 
          position={Position.Top} 
          className="w-3 h-3 bg-gray-400 border-2 border-white"
          style={{ top: '-8px' }}
        />
        
        <div className="flex items-center justify-center h-24 px-8">
          <div className="text-center">
            <GitBranch className="w-5 h-5 mx-auto mb-1 text-purple-600" />
            <div className="font-medium text-sm">{data.label}</div>
            {options.length > 0 && (
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {options.length} options
              </div>
            )}
          </div>
        </div>
        
        <Handle 
          type="source" 
          position={Position.Bottom} 
          className="w-3 h-3 bg-gray-400 border-2 border-white"
          style={{ bottom: '-8px' }}
        />
      </div>
    </div>
  );
}