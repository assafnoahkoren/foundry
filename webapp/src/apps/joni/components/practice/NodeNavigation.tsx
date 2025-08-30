import { Button } from '@/components/ui/button';
import { Check, Radio, AlertCircle, FileText, MessageSquare } from 'lucide-react';
import type { ScriptNode } from '../../types/script-dag.types';

interface NodeNavigationProps {
  nodes: ScriptNode[];
  currentNodeId: string | null;
  visitedNodes: Set<string>;
  onNodeClick: (nodeId: string) => void;
}

export function NodeNavigation({ 
  nodes, 
  currentNodeId, 
  visitedNodes, 
  onNodeClick 
}: NodeNavigationProps) {
  const getNodeIcon = (node: ScriptNode) => {
    switch (node.type) {
      case 'transmission':
        return <Radio className="w-3 h-3" />;
      case 'user_response':
        return <MessageSquare className="w-3 h-3" />;
      case 'event':
        return <AlertCircle className="w-3 h-3" />;
      case 'situation':
        return <FileText className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const getNodeLabel = (node: ScriptNode) => {
    if (node.type === 'transmission' && node.content?.actorRole) {
      const roleLabels: Record<string, string> = {
        tower: 'Tower',
        ground: 'Ground',
        departure: 'Departure',
        approach: 'Approach'
      };
      return roleLabels[node.content.actorRole] || 'ATC';
    }
    if (node.type === 'user_response') {
      return 'Your Response';
    }
    return node.content?.title || node.name || node.type;
  };

  const getNodeStatus = (nodeId: string) => {
    if (nodeId === currentNodeId) return 'current';
    if (visitedNodes.has(nodeId)) return 'visited';
    return 'unvisited';
  };

  const getNodeClassName = (status: string) => {
    switch (status) {
      case 'current':
        return 'bg-blue-500 text-white border-blue-500';
      case 'visited':
        return 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50';
      default:
        return 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed';
    }
  };

  return (
    <div className="flex items-center gap-2 overflow-x-auto py-2">
      {nodes.map((node, index) => {
        const status = getNodeStatus(node.id);
        const isClickable = status === 'visited' || status === 'current';
        
        return (
          <div key={node.id} className="flex items-center">
            <Button
              variant="outline"
              size="sm"
              className={`h-7 px-2 gap-1 text-xs ${getNodeClassName(status)}`}
              onClick={() => isClickable && onNodeClick(node.id)}
              disabled={!isClickable}
            >
              {status === 'visited' && <Check className="w-3 h-3" />}
              {getNodeIcon(node)}
              <span className="max-w-[100px] truncate">
                {getNodeLabel(node)}
              </span>
            </Button>
            {index < nodes.length - 1 && (
              <div className="w-4 h-[1px] bg-gray-300 mx-1" />
            )}
          </div>
        );
      })}
    </div>
  );
}