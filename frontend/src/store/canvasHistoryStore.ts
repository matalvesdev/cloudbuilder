import { create } from "zustand";
import type { Node, Edge } from "@xyflow/react";
import type { CanvasNodeData } from "@/types/canvas.types";

// ─── History Store ──────────────────────────────────────────────
// Manages undo/redo stack with transactional snapshots.
// Separated from CanvasStore for single-responsibility and testability.

const MAX_HISTORY = 100;

interface HistorySnapshot {
  nodes: Node<CanvasNodeData>[];
  edges: Edge[];
  timestamp: number;
}

export interface HistoryState {
  undoStack: HistorySnapshot[];
  redoStack: HistorySnapshot[];
  canUndo: boolean;
  canRedo: boolean;
  lastAction: string | null;
  lastActionTime: number | null;

  // Actions
  pushSnapshot: (nodes: Node<CanvasNodeData>[], edges: Edge[]) => void;
  undo: () => { nodes: Node<CanvasNodeData>[]; edges: Edge[] } | null;
  redo: () => { nodes: Node<CanvasNodeData>[]; edges: Edge[] } | null;
  clearHistory: () => void;
  getUndoCount: () => number;
  getRedoCount: () => number;
  canUndoCheck: () => boolean;
  canRedoCheck: () => boolean;
}

function cloneSnapshot(
  nodes: Node<CanvasNodeData>[],
  edges: Edge[],
): HistorySnapshot {
  const data = { nodes, edges };
  if (nodes.length + edges.length < 200) {
    const cloned = JSON.parse(JSON.stringify(data));
    return { ...cloned, timestamp: Date.now() };
  }
  const cloned = structuredClone(data);
  return { ...cloned, timestamp: Date.now() };
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  undoStack: [],
  redoStack: [],
  canUndo: false,
  canRedo: false,
  lastAction: null,
  lastActionTime: null,

  pushSnapshot: (nodes, edges) => {
    const snapshot = cloneSnapshot(nodes, edges);
    const { undoStack } = get();
    const next = [...undoStack, snapshot];
    if (next.length > MAX_HISTORY) next.shift();
    set({
      undoStack: next,
      redoStack: [],
      canUndo: next.length > 0,
      canRedo: false,
    });
  },

  undo: () => {
    const { undoStack, redoStack } = get();
    if (!undoStack.length) return null;

    const snapshot = undoStack[undoStack.length - 1];
    const remaining = undoStack.slice(0, -1);

    set({
      undoStack: remaining,
      redoStack: [...redoStack, snapshot],
      canUndo: remaining.length > 0,
      canRedo: true,
      lastAction: "undo",
      lastActionTime: Date.now(),
    });

    return { nodes: snapshot.nodes, edges: snapshot.edges };
  },

  redo: () => {
    const { redoStack, undoStack } = get();
    if (!redoStack.length) return null;

    const snapshot = redoStack[redoStack.length - 1];
    const remaining = redoStack.slice(0, -1);

    set({
      redoStack: remaining,
      undoStack: [...undoStack, snapshot],
      canUndo: true,
      canRedo: remaining.length > 0,
      lastAction: "redo",
      lastActionTime: Date.now(),
    });

    return { nodes: snapshot.nodes, edges: snapshot.edges };
  },

  clearHistory: () => {
    set({
      undoStack: [],
      redoStack: [],
      canUndo: false,
      canRedo: false,
      lastAction: null,
      lastActionTime: null,
    });
  },

  getUndoCount: () => get().undoStack.length,
  getRedoCount: () => get().redoStack.length,
  canUndoCheck: () => get().undoStack.length > 0,
  canRedoCheck: () => get().redoStack.length > 0,
}));
