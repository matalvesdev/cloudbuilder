import { create } from "zustand";
import type { Node, Edge } from "@xyflow/react";

// ─── Selection Store ──────────────────────────────────────────────
// Manages node/edge selection state, multi-selection, and editing mode.
// Separated from CanvasStore for single-responsibility and performance.

export interface SelectionState {
  // Single selection (legacy)
  selectedNodeId: string | null;
  selectedEdgeId: string | null;

  // Multi-selection
  selectedNodeIds: string[];
  selectedEdgeIds: string[];
  selectionCount: { nodes: number; edges: number };

  // Editing mode
  editingNodeId: string | null;

  // Actions
  selectNode: (id: string | null) => void;
  selectEdge: (id: string | null) => void;
  selectNodes: (ids: string[]) => void;
  selectEdges: (ids: string[]) => void;
  clearSelection: () => void;
  onSelectionChange: (params: { nodes: Node[]; edges: Edge[] }) => void;
  startEditing: (nodeId: string) => void;
  stopEditing: () => void;
  isSelected: (id: string) => boolean;
  hasSelection: () => boolean;
}

export const useSelectionStore = create<SelectionState>((set, get) => ({
  selectedNodeId: null,
  selectedEdgeId: null,
  selectedNodeIds: [],
  selectedEdgeIds: [],
  selectionCount: { nodes: 0, edges: 0 },
  editingNodeId: null,

  selectNode: (id) => {
    set({
      selectedNodeId: id,
      selectedEdgeId: null,
      selectedNodeIds: id ? [id] : [],
      selectedEdgeIds: [],
      selectionCount: { nodes: id ? 1 : 0, edges: 0 },
    });
  },

  selectEdge: (id) => {
    set({
      selectedEdgeId: id,
      selectedNodeId: null,
      selectedEdgeIds: id ? [id] : [],
      selectedNodeIds: [],
      selectionCount: { nodes: 0, edges: id ? 1 : 0 },
    });
  },

  selectNodes: (ids) => {
    set({
      selectedNodeIds: ids,
      selectedNodeId: ids.length === 1 ? ids[0] : null,
      selectionCount: { ...get().selectionCount, nodes: ids.length },
    });
  },

  selectEdges: (ids) => {
    set({
      selectedEdgeIds: ids,
      selectedEdgeId: ids.length === 1 ? ids[0] : null,
      selectionCount: { ...get().selectionCount, edges: ids.length },
    });
  },

  clearSelection: () => {
    set({
      selectedNodeId: null,
      selectedEdgeId: null,
      selectedNodeIds: [],
      selectedEdgeIds: [],
      selectionCount: { nodes: 0, edges: 0 },
    });
  },

  onSelectionChange: ({ nodes, edges }) => {
    const nodeIds = nodes.map((n) => n.id);
    const edgeIds = edges.map((e) => e.id);
    set({
      selectedNodeIds: nodeIds,
      selectedEdgeIds: edgeIds,
      selectedNodeId: nodeIds.length === 1 ? nodeIds[0] : null,
      selectedEdgeId: edgeIds.length === 1 ? edgeIds[0] : null,
      selectionCount: { nodes: nodeIds.length, edges: edgeIds.length },
    });
  },

  startEditing: (nodeId) => set({ editingNodeId: nodeId }),
  stopEditing: () => set({ editingNodeId: null }),

  isSelected: (id) => {
    const s = get();
    return s.selectedNodeId === id || s.selectedNodeIds.includes(id);
  },

  hasSelection: () => {
    const s = get();
    return s.selectedNodeIds.length > 0 || s.selectedEdgeIds.length > 0;
  },
}));
