import { Handle, Position } from '@xyflow/react';
import { Mic } from 'lucide-react';

interface UserResponseNodeData {
  label: string;
  expectedElements?: string[];
  validationCriteria?: string;
  maxRetries?: number;
}

export function UserResponseNode({ data }: { data: UserResponseNodeData }) {
  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-400 dark:border-blue-600 rounded-lg p-3 min-w-[200px]">
      <Handle type="target" position={Position.Top} className="!bg-blue-500" />
      
      <div className="flex items-center gap-2 mb-2">
        <Mic className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        <div className="font-semibold text-sm text-blue-900 dark:text-blue-100">{data.label}</div>
      </div>
      
      {data.validationCriteria && (
        <div className="text-xs text-blue-700 dark:text-blue-300 mt-1">
          Validation: {data.validationCriteria}
        </div>
      )}
      
      {data.expectedElements && data.expectedElements.length > 0 && (
        <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
          Expected: {data.expectedElements.length} elements
        </div>
      )}
      
      {data.maxRetries && (
        <div className="text-xs text-blue-500 dark:text-blue-500 mt-1">
          Max retries: {data.maxRetries}
        </div>
      )}
      
      <Handle type="source" position={Position.Bottom} className="!bg-blue-500" />
    </div>
  );
}