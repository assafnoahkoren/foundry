import { z } from 'zod';

// ============= Node Content Types =============

// Reference to existing transmission template
const TransmissionRefSchema = z.object({
  type: z.literal('transmission_ref'),
  transmissionId: z.string(), // References JoniTransmissionTemplate
  actorRole: z.enum(['pilot', 'tower', 'ground', 'approach', 'departure', 'center']),
  variables: z.record(z.string()).optional() // Variable values for template
});

// Reference to existing comm block
const CommBlockRefSchema = z.object({
  type: z.literal('comm_block_ref'),
  blockId: z.string(), // References JoniCommBlock
  expectedResponse: z.string()
});

// Inline event (weather, technical, medical, etc.)
const EventContentSchema = z.object({
  type: z.literal('event'),
  category: z.enum(['weather', 'technical', 'medical', 'operational', 'security']),
  severity: z.enum(['info', 'caution', 'warning', 'emergency']),
  title: z.string(),
  details: z.string(),
  requiredAction: z.string().optional()
});

// Crew interaction (flight attendant, co-pilot)
const CrewMessageSchema = z.object({
  type: z.literal('crew_message'),
  speaker: z.enum(['captain', 'first_officer', 'flight_attendant', 'ground_crew']),
  message: z.string(),
  urgency: z.enum(['routine', 'important', 'urgent', 'emergency'])
});

// System alert or warning
const SystemAlertSchema = z.object({
  type: z.literal('system_alert'),
  system: z.string(), // "TCAS", "GPWS", "ENGINE", etc.
  alertType: z.enum(['advisory', 'caution', 'warning']),
  message: z.string(),
  checklist: z.string().optional()
});

// Decision point (no specific content, just options)
const DecisionPointSchema = z.object({
  type: z.literal('decision_point'),
  question: z.string(),
  context: z.string().optional(),
  options: z.array(z.object({
    label: z.string(),
    value: z.string()
  }))
});

// Union of all content types
const NodeContentSchema = z.discriminatedUnion('type', [
  TransmissionRefSchema,
  CommBlockRefSchema,
  EventContentSchema,
  CrewMessageSchema,
  SystemAlertSchema,
  DecisionPointSchema
]);

// ============= Expected Response Types =============

const ExpectedResponseSchema = z.object({
  type: z.enum(['transmission', 'action', 'decision', 'acknowledgment']),
  acceptableResponses: z.array(z.union([
    z.string(), // Direct text match
    z.object({ transmissionId: z.string() }), // Reference to transmission template
    z.object({ keywords: z.array(z.string()) }), // Keyword matching
    z.object({ pattern: z.string() }) // Regex pattern
  ])),
  scoringCriteria: z.object({
    accuracy: z.number().min(0).max(1).optional(), // Weight for accuracy
    timeliness: z.number().min(0).max(1).optional(), // Weight for response time
    phraseology: z.number().min(0).max(1).optional() // Weight for proper phraseology
  }).optional()
});

// ============= Script Node =============

const ScriptNodeSchema = z.object({
  id: z.string(),
  type: z.enum(['transmission', 'event', 'crew_interaction', 'system_alert', 'decision_point']),
  name: z.string(),
  description: z.string().optional(),
  
  // Position for ReactFlow visualization
  position: z.object({
    x: z.number(),
    y: z.number()
  }).optional(),
  
  // Node content (situation)
  content: NodeContentSchema,
  
  // Expected response from user
  expectedResponse: ExpectedResponseSchema.optional(),
  
  // Time constraints
  timeLimit: z.number().optional(), // Seconds to respond
  minimumDelay: z.number().optional(), // Minimum seconds before allowing response
  
  // Metadata
  tags: z.array(z.string()).optional(),
  hints: z.array(z.string()).optional(), // Progressive hints if user struggles
  feedback: z.object({
    correct: z.string(),
    incorrect: z.string(),
    timeout: z.string()
  }).optional()
});

// ============= Edge Conditions =============

// Default edge (always follow)
const DefaultConditionSchema = z.object({
  type: z.literal('default'),
  priority: z.number().default(0)
});

// Score-based edge
const ScoreConditionSchema = z.object({
  type: z.literal('score'),
  minScore: z.number().min(0).max(100),
  priority: z.number().default(1)
});

// Keyword-based edge
const KeywordConditionSchema = z.object({
  type: z.literal('keyword'),
  keywords: z.array(z.string()),
  matchType: z.enum(['any', 'all']).default('any'),
  priority: z.number().default(1)
});

// Exact match edge
const ExactMatchConditionSchema = z.object({
  type: z.literal('exact_match'),
  value: z.string(),
  caseSensitive: z.boolean().default(false),
  priority: z.number().default(2)
});

// Timeout edge
const TimeoutConditionSchema = z.object({
  type: z.literal('timeout'),
  afterSeconds: z.number(),
  priority: z.number().default(0)
});

// Decision choice edge
const DecisionConditionSchema = z.object({
  type: z.literal('decision'),
  choice: z.string(), // Matches option value from decision node
  priority: z.number().default(1)
});

// Union of all condition types
const EdgeConditionSchema = z.discriminatedUnion('type', [
  DefaultConditionSchema,
  ScoreConditionSchema,
  KeywordConditionSchema,
  ExactMatchConditionSchema,
  TimeoutConditionSchema,
  DecisionConditionSchema
]);

// ============= Script Edge =============

const ScriptEdgeSchema = z.object({
  id: z.string().optional(), // Auto-generated if not provided
  from: z.string(), // Source node ID
  to: z.string(),   // Target node ID
  condition: EdgeConditionSchema,
  label: z.string().optional(), // Display label for visualization
  feedback: z.string().optional(), // Explanation when this path is taken
  
  // Visual properties for ReactFlow
  style: z.object({
    animated: z.boolean().optional(),
    stroke: z.string().optional(),
    strokeWidth: z.number().optional()
  }).optional()
});

// ============= Complete DAG Structure =============

const ScriptDAGSchema = z.object({
  nodes: z.array(ScriptNodeSchema),
  edges: z.array(ScriptEdgeSchema),
  
  // Metadata about the DAG
  metadata: z.object({
    version: z.string().default('1.0.0'),
    totalPaths: z.number().optional(), // Number of possible paths through DAG
    optimalPath: z.array(z.string()).optional(), // Node IDs for best path
    expectedDuration: z.number().optional(), // Minutes
    createdBy: z.string().optional(),
    lastModified: z.string().optional()
  }).optional(),
  
  // Layout information for visualization
  layout: z.object({
    type: z.enum(['manual', 'auto']).default('manual'),
    direction: z.enum(['TB', 'LR']).default('TB'), // Top-Bottom or Left-Right
    spacing: z.object({
      nodeWidth: z.number().default(200),
      nodeHeight: z.number().default(100),
      horizontalGap: z.number().default(150),
      verticalGap: z.number().default(100)
    }).optional()
  }).optional()
});

// ============= Type Exports =============

export type ScriptNode = z.infer<typeof ScriptNodeSchema>;
export type ScriptEdge = z.infer<typeof ScriptEdgeSchema>;
export type ScriptDAG = z.infer<typeof ScriptDAGSchema>;
export type NodeContent = z.infer<typeof NodeContentSchema>;
export type EdgeCondition = z.infer<typeof EdgeConditionSchema>;
export type ExpectedResponse = z.infer<typeof ExpectedResponseSchema>;

// ============= Validation Functions =============

export const validateScriptDAG = (data: unknown): ScriptDAG => {
  return ScriptDAGSchema.parse(data);
};

export const validateScriptNode = (data: unknown): ScriptNode => {
  return ScriptNodeSchema.parse(data);
};

export const validateScriptEdge = (data: unknown): ScriptEdge => {
  return ScriptEdgeSchema.parse(data);
};

// ============= Helper Functions =============

/**
 * Find all possible paths through the DAG
 */
export function findAllPaths(dag: ScriptDAG, startNodeId: string): string[][] {
  const paths: string[][] = [];
  const visited = new Set<string>();
  
  function dfs(nodeId: string, currentPath: string[]) {
    if (visited.has(nodeId)) return; // Avoid cycles
    
    visited.add(nodeId);
    currentPath.push(nodeId);
    
    const outgoingEdges = dag.edges.filter(e => e.from === nodeId);
    
    if (outgoingEdges.length === 0) {
      // Terminal node
      paths.push([...currentPath]);
    } else {
      for (const edge of outgoingEdges) {
        dfs(edge.to, [...currentPath]);
      }
    }
    
    visited.delete(nodeId);
  }
  
  dfs(startNodeId, []);
  return paths;
}

/**
 * Validate DAG has no unreachable nodes
 */
export function validateDAGConnectivity(dag: ScriptDAG, startNodeId: string): {
  isValid: boolean;
  unreachableNodes: string[];
} {
  const reachable = new Set<string>();
  const queue = [startNodeId];
  
  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    if (reachable.has(nodeId)) continue;
    
    reachable.add(nodeId);
    const outgoingEdges = dag.edges.filter(e => e.from === nodeId);
    queue.push(...outgoingEdges.map(e => e.to));
  }
  
  const allNodeIds = dag.nodes.map(n => n.id);
  const unreachableNodes = allNodeIds.filter(id => !reachable.has(id));
  
  return {
    isValid: unreachableNodes.length === 0,
    unreachableNodes
  };
}

/**
 * Get the next possible nodes based on current position and conditions
 */
export function getNextNodes(
  dag: ScriptDAG, 
  currentNodeId: string, 
  context: {
    score?: number;
    response?: string;
    decision?: string;
    timeElapsed?: number;
  }
): { nodeId: string; edge: ScriptEdge; reason: string }[] {
  const possibleEdges = dag.edges
    .filter(e => e.from === currentNodeId)
    .sort((a, b) => (b.condition.priority || 0) - (a.condition.priority || 0));
  
  const validTransitions: { nodeId: string; edge: ScriptEdge; reason: string }[] = [];
  
  for (const edge of possibleEdges) {
    let isValid = false;
    let reason = '';
    
    switch (edge.condition.type) {
      case 'default':
        isValid = true;
        reason = 'Default path';
        break;
        
      case 'score':
        if (context.score !== undefined && context.score >= edge.condition.minScore) {
          isValid = true;
          reason = `Score ${context.score} >= ${edge.condition.minScore}`;
        }
        break;
        
      case 'keyword':
        if (context.response) {
          const responseWords = context.response.toLowerCase().split(/\s+/);
          const keywords = edge.condition.keywords.map(k => k.toLowerCase());
          
          if (edge.condition.matchType === 'all') {
            isValid = keywords.every(k => responseWords.includes(k));
            reason = `All keywords matched: ${keywords.join(', ')}`;
          } else {
            isValid = keywords.some(k => responseWords.includes(k));
            reason = `Keyword matched: ${keywords.find(k => responseWords.includes(k))}`;
          }
        }
        break;
        
      case 'exact_match':
        if (context.response) {
          const response = edge.condition.caseSensitive 
            ? context.response 
            : context.response.toLowerCase();
          const expected = edge.condition.caseSensitive 
            ? edge.condition.value 
            : edge.condition.value.toLowerCase();
          
          isValid = response === expected;
          reason = `Exact match: "${edge.condition.value}"`;
        }
        break;
        
      case 'timeout':
        if (context.timeElapsed !== undefined && context.timeElapsed >= edge.condition.afterSeconds) {
          isValid = true;
          reason = `Timeout after ${edge.condition.afterSeconds} seconds`;
        }
        break;
        
      case 'decision':
        if (context.decision === edge.condition.choice) {
          isValid = true;
          reason = `Decision: ${edge.condition.choice}`;
        }
        break;
    }
    
    if (isValid) {
      validTransitions.push({
        nodeId: edge.to,
        edge,
        reason
      });
    }
  }
  
  // Return highest priority valid transition
  return validTransitions.length > 0 ? [validTransitions[0]] : [];
}

// ============= ReactFlow Conversion =============

/**
 * Convert our DAG structure to ReactFlow format
 * Note: ReactFlow types (Node, Edge) should be imported from @xyflow/react in the consuming component
 */
export function convertToReactFlow(
  dag: ScriptDAG,
  customNodeTypes?: string[]
): {
  nodes: any[]; // ReactFlowNode type
  edges: any[]; // ReactFlowEdge type
} {
  // Convert nodes
  const nodes = dag.nodes.map(node => ({
    id: node.id,
    type: customNodeTypes?.includes(node.type) ? node.type : 'default',
    position: node.position || { x: 0, y: 0 },
    data: {
      label: node.name,
      description: node.description,
      content: node.content,
      expectedResponse: node.expectedResponse,
      timeLimit: node.timeLimit,
      minimumDelay: node.minimumDelay,
      tags: node.tags,
      hints: node.hints,
      feedback: node.feedback,
      // Original type for custom rendering
      originalType: node.type
    }
  }));

  // Convert edges
  const edges = dag.edges.map((edge, index) => ({
    id: edge.id || `${edge.from}-${edge.to}-${index}`,
    source: edge.from,
    target: edge.to,
    label: edge.label || edge.feedback,
    animated: edge.style?.animated ?? (edge.condition.type === 'default'),
    style: edge.style ? {
      stroke: edge.style.stroke,
      strokeWidth: edge.style.strokeWidth
    } : undefined,
    data: {
      condition: edge.condition,
      feedback: edge.feedback,
      priority: edge.condition.priority
    }
  }));

  return { nodes, edges };
}

/**
 * Convert ReactFlow node position changes back to DAG updates
 */
export function updateDAGFromReactFlow(
  dag: ScriptDAG,
  nodePositions: Map<string, { x: number; y: number }>
): ScriptDAG {
  return {
    ...dag,
    nodes: dag.nodes.map(node => ({
      ...node,
      position: nodePositions.get(node.id) || node.position
    }))
  };
}

// Export schemas for use in validation
export {
  ScriptNodeSchema,
  ScriptEdgeSchema,
  ScriptDAGSchema,
  NodeContentSchema,
  EdgeConditionSchema,
  ExpectedResponseSchema
};