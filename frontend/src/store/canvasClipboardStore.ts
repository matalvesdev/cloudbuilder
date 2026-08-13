import { create } from "zustand";
import type { Node, Edge } from "@xyflow/react";
import type { CanvasNodeData } from "@/types/canvas.types";

// ─── Clipboard Store ──────────────────────────────────────────────
// Manages copy/paste buffer for canvas nodes and edges.
// Supports both internal clipboard and system clipboard (Ctrl+C/V).

interface ClipboardEntry {
  nodes: Node<CanvasNodeData>[];
  edges: Edge[];
  copiedAt: number;
}

export interface ClipboardState {
  // Internal clipboard
  clipboardNodes: Node<CanvasNodeData>[];
  clipboardEdges: Edge[];
  copiedAt: number | null;
  pasteCount: number;

  // Actions
  copyNodes: (
    nodeIds: string[],
    allNodes: Node<CanvasNodeData>[],
    allEdges: Edge[],
  ) => void;
  pasteNodes: () => { nodes: Node<CanvasNodeData>[]; edges: Edge[] } | null;
  cutNodes: (
    nodeIds: string[],
    allNodes: Node<CanvasNodeData>[],
    allEdges: Edge[],
  ) => { removedNodeIds: string[] } | null;
  duplicateNodes: (
    nodeIds: string[],
    allNodes: Node<CanvasNodeData>[],
    allEdges: Edge[],
  ) => { nodes: Node<CanvasNodeData>[]; edges: Edge[] } | null;
  clearClipboard: () => void;
  hasContent: () => boolean;
  getClipboardSize: () => number;
}

export const useClipboardStore = create<ClipboardState>((set, get) => ({
  clipboardNodes: [],
  clipboardEdges: [],
  copiedAt: null,
  pasteCount: 0,

  copyNodes: (nodeIds, allNodes, allEdges) => {
    const idSet = new Set(nodeIds);
    const nodes = allNodes.filter((n) => idSet.has(n.id));
    const edges = allEdges.filter(
      (e) => idSet.has(e.source) && idSet.has(e.target),
    );

    // Also try to write to system clipboard
    try {
      const data = JSON.stringify({
        type: "cloudbuilder-canvas",
        nodes: nodes.map((n) => ({
          id: n.id,
          type: n.type,
          position: n.position,
          data: n.data,
          width: n.width,
          height: n.height,
        })),
        edges: edges.map((e) => ({
          source: e.source,
          target: e.target,
          sourceHandle: e.sourceHandle,
          targetHandle: e.targetHandle,
          type: e.type,
          data: e.data,
        })),
      });
      navigator.clipboard?.writeText(data).catch(() => {});
    } catch {
      /* system clipboard not available */
    }

    set({
      clipboardNodes: nodes,
      clipboardEdges: edges,
      copiedAt: Date.now(),
      pasteCount: 0,
    });
  },

  pasteNodes: () => {
    const { clipboardNodes, clipboardEdges, pasteCount } = get();
    if (!clipboardNodes.length) return null;

    const offset = (pasteCount + 1) * 40;
    const idMap = new Map<string, string>();

    const newNodes = clipboardNodes.map((n) => {
      const newId = crypto.randomUUID();
      idMap.set(n.id, newId);
      return {
        ...n,
        id: newId,
        position: { x: n.position.x + offset, y: n.position.y + offset },
        selected: true,
      };
    });

    const newEdges = clipboardEdges
      .filter((e) => idMap.has(e.source) && idMap.has(e.target))
      .map((e) => ({
        ...e,
        id: crypto.randomUUID(),
        source: idMap.get(e.source)!,
        target: idMap.get(e.target)!,
      }));

    set({ pasteCount: pasteCount + 1 });
    return {
      nodes: newNodes as Node<CanvasNodeData>[],
      edges: newEdges as Edge[],
    };
  },

  cutNodes: (nodeIds, allNodes, allEdges) => {
    get().copyNodes(nodeIds, allNodes, allEdges);
    return { removedNodeIds: nodeIds };
  },

  duplicateNodes: (nodeIds, allNodes, allEdges) => {
    const idSet = new Set(nodeIds);
    const nodes = allNodes.filter((n) => idSet.has(n.id));
    const edges = allEdges.filter(
      (e) => idSet.has(e.source) && idSet.has(e.target),
    );

    const idMap = new Map<string, string>();
    const newNodes = nodes.map((n) => {
      const newId = crypto.randomUUID();
      idMap.set(n.id, newId);
      return {
        ...n,
        id: newId,
        position: { x: n.position.x + 40, y: n.position.y + 40 },
        selected: true,
      };
    });

    const newEdges = edges
      .filter((e) => idMap.has(e.source) && idMap.has(e.target))
      .map((e) => ({
        ...e,
        id: crypto.randomUUID(),
        source: idMap.get(e.source)!,
        target: idMap.get(e.target)!,
      }));

    return {
      nodes: newNodes as Node<CanvasNodeData>[],
      edges: newEdges as Edge[],
    };
  },

  clearClipboard: () => {
    set({
      clipboardNodes: [],
      clipboardEdges: [],
      copiedAt: null,
      pasteCount: 0,
    });
  },

  hasContent: () => get().clipboardNodes.length > 0,
  getClipboardSize: () =>
    get().clipboardNodes.length + get().clipboardEdges.length,
}));
