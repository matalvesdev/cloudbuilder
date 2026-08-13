import { api } from "./client";

export interface KnowledgeGraphNode {
  id: string;
  label: string;
  type: string;
  metadata: Record<string, string>;
}

export interface KnowledgeGraphEdge {
  sourceId: string;
  targetId: string;
  relationship: string;
  metadata: Record<string, string>;
}

export interface KnowledgeGraphData {
  nodes: KnowledgeGraphNode[];
  edges: KnowledgeGraphEdge[];
}

export interface ImpactAnalysis {
  nodeId: string;
  directDependents: string[];
  directDependencies: string[];
  transitiveImpact: string[];
  impactCount: number;
}

export const knowledgeGraphApi = {
  getGraph: (canvasId: string): Promise<KnowledgeGraphData> =>
    api.get(`/canvases/${canvasId}/knowledge-graph`),

  getAiContext: (canvasId: string): Promise<{ context: string }> =>
    api.get(`/canvases/${canvasId}/knowledge-graph/ai-context`),

  analyzeImpact: (canvasId: string, nodeId: string): Promise<ImpactAnalysis> =>
    api.get(`/canvases/${canvasId}/knowledge-graph/impact/${nodeId}`),
};
