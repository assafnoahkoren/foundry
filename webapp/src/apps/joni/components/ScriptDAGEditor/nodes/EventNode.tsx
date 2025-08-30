import { Handle, Position } from '@xyflow/react';
import { AlertTriangle, Cloud, Wrench, Heart, Shield } from 'lucide-react';

import type { NodeContent } from '../../../types/script-dag.types';

interface EventNodeProps {
  data: {
    label: string;
    description?: string;
    content: NodeContent;
    originalType: string;
  };
  selected: boolean;
}

const categoryIcons = {
  weather: Cloud,
  technical: Wrench,
  medical: Heart,
  operational: AlertTriangle,
  security: Shield
};

const severityColors = {
  info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-300',
  caution: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-400',
  warning: 'bg-orange-50 dark:bg-orange-900/20 border-orange-400',
  emergency: 'bg-red-50 dark:bg-red-900/20 border-red-400'
};

export function EventNode({ data, selected }: EventNodeProps) {
  const category = data.content?.category || 'operational';
  const severity = data.content?.severity || 'info';
  const Icon = categoryIcons[category as keyof typeof categoryIcons] || AlertTriangle;
  const colorClass = severityColors[severity as keyof typeof severityColors];
  
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
        <Icon className="w-5 h-5 mt-0.5" />
        <div className="flex-1">
          <div className="font-medium text-sm">{data.label}</div>
          {data.description && (
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {data.description}
            </div>
          )}
          <div className="text-xs font-semibold mt-1 uppercase">
            {severity}
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