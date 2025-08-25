import { Button } from '@/components/ui/button';
import {
  addEdge,
  Background,
  BackgroundVariant,
  MarkerType,
  MiniMap,
  Panel,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
  type NodeTypes
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { AlertTriangle, Bell, GitBranch, Mic, Radio, Users } from 'lucide-react';
import { useCallback, useEffect } from 'react';
import './ScriptDAGEditor.css';

import type { ScriptDAG, ScriptEdge } from '../../types/script-dag.types';
import { CrewInteractionNode } from './nodes/CrewInteractionNode';
import { DecisionNode } from './nodes/DecisionNode';
import { EventNode } from './nodes/EventNode';
import { SystemAlertNode } from './nodes/SystemAlertNode';
import { TransmissionNode } from './nodes/TransmissionNode';
import { UserResponseNode } from './nodes/UserResponseNode';

const nodeTypes: NodeTypes = {
  transmission: TransmissionNode,
  event: EventNode,
  decision_point: DecisionNode,
  crew_interaction: CrewInteractionNode,
  system_alert: SystemAlertNode,
  user_response: UserResponseNode,
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
      draggable: !readOnly,
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
      selectable: !readOnly,
      focusable: !readOnly,
      style: edge.style ? {
        stroke: edge.style.stroke,
        strokeWidth: edge.style.strokeWidth || 2,
        cursor: readOnly ? 'default' : 'pointer'
      } : {
        strokeWidth: 2,
        cursor: readOnly ? 'default' : 'pointer'
      },
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
  }, [dag, selectedNodeId, readOnly, setNodes, setEdges]);

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

  // Handle edge click
  const onEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    console.log('Edge clicked:', edge);
    // Edge selection is handled automatically by ReactFlow
    // The edge will be selected and can be deleted with Delete/Backspace
  }, []);

  // Handle clicking on empty space (deselect)
  const onPaneClick = useCallback(() => {
    if (onNodeSelect) {
      onNodeSelect(null);
    }
  }, [onNodeSelect]);

  // Handle nodes deletion (called by ReactFlow when delete key is pressed)
  const onNodesDelete = useCallback((nodesToDelete: Node[]) => {
    if (readOnly || !dag) return;
    
    const nodeIdsToDelete = new Set(nodesToDelete.map(n => n.id));
    const remainingNodes = dag.nodes.filter(node => !nodeIdsToDelete.has(node.id));
    const remainingEdges = dag.edges.filter(edge => 
      !nodeIdsToDelete.has(edge.from) && !nodeIdsToDelete.has(edge.to)
    );
    
    const updatedDag = {
      ...dag,
      nodes: remainingNodes,
      edges: remainingEdges
    };
    
    onChange(updatedDag);
    
    // Clear selection
    if (onNodeSelect) {
      onNodeSelect(null);
    }
  }, [readOnly, dag, onChange, onNodeSelect]);

  // Handle edges deletion (called by ReactFlow when delete key is pressed)
  const onEdgesDelete = useCallback((edgesToDelete: Edge[]) => {
    if (readOnly || !dag) return;
    
    const remainingEdges = dag.edges.filter(edge => 
      !edgesToDelete.some(e => e.source === edge.from && e.target === edge.to)
    );
    
    const updatedDag = {
      ...dag,
      edges: remainingEdges
    };
    
    onChange(updatedDag);
  }, [readOnly, dag, onChange]);

  // Add new node
  const addNode = useCallback((type: 'transmission' | 'event' | 'crew_interaction' | 'system_alert' | 'decision_point' | 'user_response') => {
    if (readOnly || !dag) return;
    
    // Get the center of the viewport for positioning
    const centerX = 250;
    const centerY = nodes.length * 100 + 50;
    
    const newNodeId = `node-${Date.now()}`;
    const newNode = {
      id: newNodeId,
      type,
      name: `New ${type.replace('_', ' ')}`,
      position: { x: centerX, y: centerY },
      content: (() => {
        switch (type) {
          case 'transmission':
            return {
              type: 'transmission_ref' as const,
              transmissionId: '',
              actorRole: 'ground' as const
            };
          case 'event':
            return {
              type: 'event' as const,
              category: 'operational' as const,
              severity: 'info' as const,
              title: 'New Event',
              details: '',
              description: ''
            };
          case 'crew_interaction':
            return {
              type: 'crew_message' as const,
              speaker: 'captain' as const,
              message: '',
              urgency: 'routine' as const
            };
          case 'system_alert':
            return {
              type: 'system_alert' as const,
              system: '',
              alertType: 'advisory' as const,
              message: ''
            };
          case 'decision_point':
            return {
              type: 'decision_point' as const,
              question: '',
              prompt: '',
              options: []
            };
          case 'user_response':
            return {
              type: 'user_response' as const,
              expectedElements: [],
              validationCriteria: '',
              maxRetries: 3
            };
          default:
            return { type: 'event' as const, category: 'operational' as const, severity: 'info' as const, title: '', details: '', description: '' };
        }
      })()
    };
    
    const updatedDag = {
      ...dag,
      nodes: [...dag.nodes, newNode]
    };
    
    onChange(updatedDag);
    
    // Select the new node
    if (onNodeSelect) {
      setTimeout(() => onNodeSelect(newNodeId), 100);
    }
  }, [readOnly, dag, nodes.length, onChange, onNodeSelect]);

  // Handle node position changes
  const handleNodesChange = useCallback((changes: Parameters<typeof onNodesChange>[0]) => {
    if (!readOnly) {
      // Let ReactFlow handle the changes first
      onNodesChange(changes);
      
      // Only update DAG positions for position changes, not other changes
      if (onChange && dag) {
        const positionChanges = changes.filter((c) => c.type === 'position' && c.dragging === false);
        if (positionChanges.length > 0) {
          const updatedNodes = dag.nodes.map(node => {
            const change = positionChanges.find((c) => c.id === node.id);
            if (change && change.position) {
              return { ...node, position: change.position };
            }
            return node;
          });
          
          const newDag: ScriptDAG = {
            ...dag,
            nodes: updatedNodes,
            edges: dag.edges
          };
          
          onChange(newDag);
        }
      }
    } else {
      // In read-only mode, just apply the changes to ReactFlow
      onNodesChange(changes);
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
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        onNodesDelete={onNodesDelete}
        onEdgesDelete={onEdgesDelete}
        nodeTypes={nodeTypes}
        deleteKeyCode={readOnly ? null : ['Delete', 'Backspace']}
        elementsSelectable={!readOnly}
        fitView
        attributionPosition="bottom-left"
      >
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={12} 
          size={1} 
          className="bg-gray-50 dark:bg-gray-900"
        />
        <MiniMap 
          nodeStrokeWidth={3}
          className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700"
        />
        
        {/* Node creation toolbar */}
        {!readOnly && (
          <Panel position="top-left" className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col gap-2">
              <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Add Node:</div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addNode('transmission')}
                  title="Add Transmission"
                  className="p-2"
                >
                  <Radio className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addNode('event')}
                  title="Add Event"
                  className="p-2"
                >
                  <AlertTriangle className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addNode('crew_interaction')}
                  title="Add Crew Interaction"
                  className="p-2"
                >
                  <Users className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addNode('system_alert')}
                  title="Add System Alert"
                  className="p-2"
                >
                  <Bell className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addNode('decision_point')}
                  title="Add Decision Point"
                  className="p-2"
                >
                  <GitBranch className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addNode('user_response')}
                  title="Add User Response"
                  className="p-2"
                >
                  <Mic className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
}