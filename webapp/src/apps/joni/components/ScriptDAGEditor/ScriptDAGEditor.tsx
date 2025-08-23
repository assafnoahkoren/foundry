import { useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  BackgroundVariant,
  MarkerType,
  type Node,
  type Edge,
  type NodeTypes,
  type Connection
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { TransmissionNode } from './nodes/TransmissionNode';
import { EventNode } from './nodes/EventNode';
import { DecisionNode } from './nodes/DecisionNode';
import { CrewInteractionNode } from './nodes/CrewInteractionNode';
import { SystemAlertNode } from './nodes/SystemAlertNode';
import type { ScriptDAG, ScriptEdge } from '../../types/script-dag.types';

const nodeTypes: NodeTypes = {
  transmission: TransmissionNode,
  event: EventNode,
  decision_point: DecisionNode,
  crew_interaction: CrewInteractionNode,
  system_alert: SystemAlertNode,
};

interface ScriptDAGEditorProps {
  dag: ScriptDAG | null;
  onChange?: (dag: ScriptDAG) => void;
  onNodeSelect?: (nodeId: string | null) => void;
  selectedNodeId?: string | null;
  readOnly?: boolean;
}

export function ScriptDAGEditor({ dag, onChange, onNodeSelect, selectedNodeId, readOnly = false }: ScriptDAGEditorProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Convert DAG to ReactFlow format
  useEffect(() => {
    if (!dag) return;

    const flowNodes: Node[] = dag.nodes.map(node => ({
      id: node.id,
      type: node.type,
      position: node.position || { x: 0, y: 0 },
      selected: node.id === selectedNodeId,
      data: {
        label: node.name,
        description: node.description,
        content: node.content,
        expectedResponse: node.expectedResponse,
        timeLimit: node.timeLimit,
        hints: node.hints,
        feedback: node.feedback,
        originalType: node.type
      }
    }));

    const flowEdges: Edge[] = dag.edges.map((edge, index) => ({
      id: edge.id || `${edge.from}-${edge.to}-${index}`,
      source: edge.from,
      target: edge.to,
      label: edge.label || edge.feedback,
      animated: edge.style?.animated ?? (edge.condition.type === 'default'),
      style: edge.style ? {
        stroke: edge.style.stroke,
        strokeWidth: edge.style.strokeWidth
      } : undefined,
      markerEnd: {
        type: MarkerType.ArrowClosed,
      },
      data: {
        condition: edge.condition,
        feedback: edge.feedback
      }
    }));

    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [dag, selectedNodeId, setNodes, setEdges]);

  // Handle connection creation
  const onConnect = useCallback((params: Connection) => {
    if (readOnly) return;
    
    const newEdge: Edge = {
      ...params,
      id: `${params.source}-${params.target}`,
      animated: true,
      markerEnd: {
        type: MarkerType.ArrowClosed,
      },
    };
    
    setEdges((eds) => addEdge(newEdge, eds));
    
    // Update DAG
    if (onChange && dag) {
      const scriptEdge: ScriptEdge = {
        from: params.source!,
        to: params.target!,
        condition: { type: 'default', priority: 0 },
        style: { animated: true }
      };
      
      const newDag: ScriptDAG = {
        ...dag,
        edges: [...dag.edges, scriptEdge]
      };
      
      onChange(newDag);
    }
  }, [readOnly, setEdges, onChange, dag]);

  // Handle node click/selection
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    if (onNodeSelect) {
      onNodeSelect(node.id);
    }
  }, [onNodeSelect]);

  // Handle clicking on empty space (deselect)
  const onPaneClick = useCallback(() => {
    if (onNodeSelect) {
      onNodeSelect(null);
    }
  }, [onNodeSelect]);

  // Handle node position changes
  const handleNodesChange = useCallback((changes: Array<{ type: string; id: string; position?: { x: number; y: number } }>) => {
    if (!readOnly) {
      onNodesChange(changes);
      
      // Update DAG with new positions
      if (onChange && dag) {
        const positionChanges = changes.filter((c: { type: string }) => c.type === 'position');
        if (positionChanges.length > 0) {
          const updatedNodes = dag.nodes.map(node => {
            const change = positionChanges.find((c: { id: string; position?: { x: number; y: number } }) => c.id === node.id);
            if (change && change.position) {
              return { ...node, position: change.position };
            }
            return node;
          });
          
          const newDag: ScriptDAG = {
            ...dag,
            nodes: updatedNodes
          };
          
          onChange(newDag);
        }
      }
    }
  }, [readOnly, onNodesChange, onChange, dag]);

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
      >
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={12} 
          size={1} 
          className="bg-gray-50 dark:bg-gray-900"
        />
        <Controls />
        <MiniMap 
          nodeStrokeWidth={3}
          className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700"
        />
      </ReactFlow>
    </div>
  );
}