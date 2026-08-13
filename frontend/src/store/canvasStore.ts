import { create } from "zustand";
import {
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  type XYPosition,
} from "@xyflow/react";
import type {
  CanvasNodeData,
  CanvasDesign,
  CanvasNodeProperties,
} from "@/types/canvas.types";
import * as designApi from "@/api/design";
import type { CanvasDTO, CanvasNodeDTO, CanvasEdgeDTO } from "@/api/types";

// ─── Handle ID sanitization ──────────────────────────────────────────
// ReactFlow v12 persists sourceHandle/targetHandle on edges when a Handle
// has an explicit `id` prop. Edges created or imported with stale handle IDs
// (e.g. from old CloudNode versions with different handle layouts) cause
// "Couldn't create edge for source/target handle id" warnings.
// This helper strips those IDs so ReactFlow auto-selects the correct handle.
const KNOWN_HANDLE_IDS = new Set(["right", "left", "top", "bottom", "source", "target"]);

function stripHandleIds(edge: Edge): Edge {
  const sanitized = { ...edge };
  // Strip stale top-level handle IDs
  if (sanitized.sourceHandle != null && !KNOWN_HANDLE_IDS.has(sanitized.sourceHandle)) {
    delete sanitized.sourceHandle;
  }
  if (sanitized.targetHandle != null && !KNOWN_HANDLE_IDS.has(sanitized.targetHandle)) {
    delete sanitized.targetHandle;
  }
  // Strip stale handle IDs leaked into data (from old properties payloads)
  if (sanitized.data) {
    const data = { ...sanitized.data as Record<string, unknown> };
    if ("sourceHandle" in data && !KNOWN_HANDLE_IDS.has(data.sourceHandle as string)) {
      delete data.sourceHandle;
    }
    if ("targetHandle" in data && !KNOWN_HANDLE_IDS.has(data.targetHandle as string)) {
      delete data.targetHandle;
    }
    sanitized.data = data;
  }
  return sanitized;
}

// ─── Performance: rAF batching for bulk position updates ──────────────
// Accumulates position changes and flushes them in the next rAF frame,
// preventing layout thrashing with 500+ nodes.
let pendingPositionUpdates: Map<string, XYPosition> | null = null;
let rAFHandle: number | null = null;
let dragHistorySnapshot: HistoryEntry | null = null;

function flushPositions(storeSet: any) {
  rAFHandle = null;
  if (!pendingPositionUpdates) return;
  const updates = pendingPositionUpdates;
  pendingPositionUpdates = null;
  storeSet((state: CanvasState) => ({
    nodes: state.nodes.map((n) => {
      const pos = updates!.get(n.id);
      return pos ? { ...n, position: pos } : n;
    }),
  }));
}

function batchUpdatePosition(
  nodeId: string,
  position: XYPosition,
  storeSet: any,
  storeGet: any,
) {
  if (typeof requestAnimationFrame === "undefined") {
    // Fallback for non-browser envs (test)
    storeSet((state: CanvasState) => ({
      nodes: state.nodes.map((n) => (n.id === nodeId ? { ...n, position } : n)),
    }));
    return;
  }
  if (!pendingPositionUpdates) pendingPositionUpdates = new Map();
  pendingPositionUpdates.set(nodeId, position);
  if (!rAFHandle) {
    rAFHandle = requestAnimationFrame(() => flushPositions(storeSet));
  }
}

// ─── Performance: Optimized history with shallow size limit ──────────
const MAX_HISTORY = 100;
function cloneEntry(nodes: Node<CanvasNodeData>[], edges: Edge[]) {
  // For < 200 entries use JSON (fast), for larger use structuredClone
  if (nodes.length + edges.length < 200) {
    return JSON.parse(JSON.stringify({ nodes, edges }));
  }
  return structuredClone({ nodes, edges });
}

// ─── Inline SimpleDagre (no external 'dagre' dependency) ──────────────
function simpleDagreLayout(
  nodes: Node<CanvasNodeData>[],
  edges: Edge[],
  opts: {
    rankdir: "TB" | "LR";
    nodesep: number;
    ranksep: number;
    marginx: number;
    marginy: number;
    nodeWidth: number;
    nodeHeight: number;
  },
): Array<{ id: string; x: number; y: number }> {
  // Build adjacency
  const children = new Map<string, Set<string>>();
  const nodeMap = new Map<string, { width: number; height: number }>();
  for (const n of nodes) {
    children.set(n.id, new Set());
    nodeMap.set(n.id, { width: opts.nodeWidth, height: opts.nodeHeight });
  }
  for (const e of edges) {
    if (children.has(e.source)) children.get(e.source)!.add(e.target);
    if (!children.has(e.target)) children.set(e.target, new Set());
  }

  // Topological sort for ranks
  const ranks = new Map<string, number>();
  const visited = new Set<string>();
  const temp = new Set<string>();
  function visit(nodeId: string): number {
    if (temp.has(nodeId)) return 0;
    if (visited.has(nodeId)) return ranks.get(nodeId) || 0;
    temp.add(nodeId);
    let maxRank = 0;
    for (const child of children.get(nodeId) || [])
      maxRank = Math.max(maxRank, visit(child) + 1);
    temp.delete(nodeId);
    visited.add(nodeId);
    ranks.set(nodeId, maxRank);
    return maxRank;
  }
  for (const id of children.keys()) if (!visited.has(id)) visit(id);

  // Group by rank and assign positions
  const rankGroups = new Map<number, string[]>();
  for (const [id, rank] of ranks) {
    if (!rankGroups.has(rank)) rankGroups.set(rank, []);
    rankGroups.get(rank)!.push(id);
  }
  const sortedRanks = Array.from(rankGroups.keys()).sort((a, b) => a - b);
  const positions: Array<{ id: string; x: number; y: number }> = [];
  for (let i = 0; i < sortedRanks.length; i++) {
    const ids = rankGroups.get(sortedRanks[i]) || [];
    const totalWidth =
      ids.length * opts.nodeWidth + (ids.length - 1) * opts.nodesep;
    let startX = opts.marginx + totalWidth / 2 - opts.nodeWidth / 2;
    for (const id of ids) {
      positions.push({
        id,
        x: startX,
        y: opts.marginy + i * (opts.nodeHeight + opts.ranksep),
      });
      startX += opts.nodeWidth + opts.nodesep;
    }
  }
  return positions;
}

// Web Worker for autoLayout (offloads to background thread)
let layoutWorker: Worker | null = null;
function getLayoutWorker(): Worker {
  if (!layoutWorker && typeof Worker !== "undefined") {
    layoutWorker = new Worker(
      new URL(
        "../modules/canvas/workers/autoLayout.worker.ts",
        import.meta.url,
      ),
      { type: "module" },
    );
  }
  return layoutWorker!;
}

interface HistoryEntry {
  nodes: Node<CanvasNodeData>[];
  edges: Edge[];
}

type AlignDirection = "left" | "center" | "right" | "top" | "middle" | "bottom";
type DistributeDirection = "horizontal" | "vertical";

interface GeneratedCodeTab {
  id: string;
  name: string;
  content: string;
}

interface CanvasState {
  nodes: Node<CanvasNodeData>[];
  edges: Edge[];
  selectedNode: string | null;
  selectedEdge: string | null;
  editingNodeId: string | null;
  canvasId: string | null;
  canvasName: string;
  canvasVersion: number;
  undoStack: HistoryEntry[];
  redoStack: HistoryEntry[];

  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  addNode: (componentData: any, position: XYPosition) => void;
  removeNode: (nodeId: string) => void;
  removeSelectedNodes: () => void;
  updateNodeProperties: (
    nodeId: string,
    properties: Record<string, any>,
  ) => void;
  updateNodeLabel: (nodeId: string, label: string) => void;
  setCanvas: (design: Partial<CanvasDesign>) => void;
  loadCanvas: (design: CanvasDesign) => void;
  clearCanvas: () => void;
  undo: () => void;
  redo: () => void;
  pushHistory: () => void;
  setSelectedNode: (id: string | null) => void;
  setSelectedEdge: (id: string | null) => void;
  updateNodePosition: (nodeId: string, position: XYPosition) => void;
  addEdgeWithType: (source: string, target: string, edgeType: string) => void;
  removeEdge: (edgeId: string) => void;

  alignNodes: (direction: AlignDirection) => void;
  distributeNodes: (direction: DistributeDirection) => void;
  bringToFront: (nodeId: string) => void;
  sendToBack: (nodeId: string) => void;
  bringForward: (nodeId: string) => void;
  sendBackward: (nodeId: string) => void;
  autoLayout: () => void;
  toggleLockNode: (nodeId: string) => void;
  duplicateSelected: () => void;
  duplicateNode: (nodeId: string) => void;
  setNodesValidationStatus: (
    statusMap: Record<string, "VALID" | "INVALID" | "WARNING" | "PENDING">,
  ) => void;
  generatedCode: GeneratedCodeTab[];
  setGeneratedCode: (code: GeneratedCodeTab[]) => void;
  startEditing: (nodeId: string) => void;
  stopEditing: () => void;

  highlightedIncidentNodes: string[];
  setHighlightedIncidentNodes: (nodeIds: string[]) => void;
  clearHighlightedIncidentNodes: () => void;

  loadFromBackend: (canvasId: string) => Promise<void>;
  saveToBackend: (tenantId: string, userId: string) => Promise<string | null>;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNode: null,
  selectedEdge: null,
  editingNodeId: null,
  canvasId: null,
  canvasName: "Design sem título",
  canvasVersion: 1,
  undoStack: [],
  redoStack: [],
  generatedCode: [],
  highlightedIncidentNodes: [],

  onNodesChange: (changes) => {
    const positionChanges = changes.filter((change) => change.type === "position");
    const isDragging = positionChanges.some((change) => change.dragging === true);
    const dragFinished = positionChanges.some((change) => change.dragging === false);
    if (isDragging && !dragHistorySnapshot) {
      dragHistorySnapshot = cloneEntry(get().nodes, get().edges) as HistoryEntry;
    }
    if (dragFinished && !dragHistorySnapshot) {
      get().pushHistory();
    }

    const nextNodes = applyNodeChanges(
      changes,
      get().nodes,
    ) as Node<CanvasNodeData>[];
    if (dragFinished && dragHistorySnapshot) {
      const snapshot = dragHistorySnapshot;
      dragHistorySnapshot = null;
      const nextUndoStack = [...get().undoStack, snapshot].slice(-MAX_HISTORY);
      set({ nodes: nextNodes, undoStack: nextUndoStack, redoStack: [] });
    } else {
      set({ nodes: nextNodes });
    }
  },

  onEdgesChange: (changes) => {
    const hasRemove = changes.some((c) => c.type === "remove");
    if (hasRemove) get().pushHistory();
    set({ edges: applyEdgeChanges(changes, get().edges) });
  },

  onConnect: (connection) => {
    get().pushHistory();
    // Strip stale/legacy handle IDs so ReactFlow auto-selects the correct handle
    const { sourceHandle, targetHandle, ...safeConnection } = connection;
    const cleanSourceHandle =
      sourceHandle != null && KNOWN_HANDLE_IDS.has(sourceHandle)
        ? sourceHandle
        : undefined;
    const cleanTargetHandle =
      targetHandle != null && KNOWN_HANDLE_IDS.has(targetHandle)
        ? targetHandle
        : undefined;
    set({
      edges: addEdge(
        {
          ...safeConnection,
          ...(cleanSourceHandle ? { sourceHandle: cleanSourceHandle } : {}),
          ...(cleanTargetHandle ? { targetHandle: cleanTargetHandle } : {}),
          type: "connection",
          data: { edgeType: "network" },
        } as any,
        get().edges,
      ),
    });
  },

  addNode: (componentData, position) => {
    get().pushHistory(); // Save state BEFORE adding
    const newNode: Node<CanvasNodeData> = {
      id: crypto.randomUUID(),
      type: componentData.provider,
      position,
      width: 224,
      height: 120,
      data: {
        label: componentData.displayName,
        componentDefinitionId: componentData.id,
        provider: componentData.provider,
        resourceType: componentData.resourceType,
        properties: {},
        validationStatus: "PENDING",
      },
    };
    set({ nodes: [...get().nodes, newNode] });
  },

  removeNode: (nodeId) => {
    get().pushHistory(); // Save state BEFORE removing
    set({
      nodes: get().nodes.filter((n) => n.id !== nodeId),
      edges: get().edges.filter(
        (e) => e.source !== nodeId && e.target !== nodeId,
      ),
      selectedNode: get().selectedNode === nodeId ? null : get().selectedNode,
    });
  },

  removeSelectedNodes: () => {
    const { nodes, edges, selectedNode } = get();
    if (selectedNode) {
      get().pushHistory(); // Save state BEFORE removing
      set({
        nodes: nodes.filter((n) => n.id !== selectedNode),
        edges: edges.filter(
          (e) => e.source !== selectedNode && e.target !== selectedNode,
        ),
        selectedNode: null,
      });
      return;
    }
    const selected = nodes.filter((n) => n.selected);
    if (selected.length) {
      const ids = new Set(selected.map((n) => n.id));
      get().pushHistory(); // BEFORE
      set({
        nodes: nodes.filter((n) => !ids.has(n.id)),
        edges: edges.filter((e) => !ids.has(e.source) && !ids.has(e.target)),
      });
    }
  },

  updateNodeProperties: (nodeId, properties) => {
    get().pushHistory(); // BEFORE
    set({
      nodes: get().nodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                properties: { ...node.data.properties, ...properties },
              },
            }
          : node,
      ),
    });
  },

  updateNodeLabel: (nodeId, label) => {
    get().pushHistory(); // BEFORE
    set({
      nodes: get().nodes.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, label } } : node,
      ),
    });
  },

  setCanvas: (design) => {
    set({
      canvasId: design.id ?? get().canvasId,
      canvasName: design.name ?? get().canvasName,
      canvasVersion: design.version ?? get().canvasVersion,
    });
  },

  loadCanvas: (design) => {
    const sanitizedEdges = (design.edges ?? []).map(stripHandleIds);
    set({
      nodes: design.nodes ?? [],
      edges: sanitizedEdges,
      canvasId: design.id,
      canvasName: design.name,
      canvasVersion: design.version,
      undoStack: [],
      redoStack: [],
      generatedCode: [],
    });
  },

  clearCanvas: () => {
    set({
      nodes: [],
      edges: [],
      selectedNode: null,
      selectedEdge: null,
      canvasId: null,
      canvasName: "Design sem título",
      canvasVersion: 1,
      undoStack: [],
      redoStack: [],
      generatedCode: [],
    });
  },

  pushHistory: () => {
    const { nodes, edges, undoStack } = get();
    const entry = cloneEntry(nodes, edges) as HistoryEntry;
    const next = [...undoStack, entry];
    if (next.length > MAX_HISTORY) next.shift();
    set({ undoStack: next, redoStack: [] });
  },

  undo: () => {
    const { undoStack, redoStack, nodes, edges } = get();
    if (!undoStack.length) return;
    const prev = undoStack[undoStack.length - 1];
    const current = cloneEntry(nodes, edges) as HistoryEntry;
    set({
      nodes: prev.nodes,
      edges: prev.edges,
      undoStack: undoStack.slice(0, -1),
      redoStack: [...redoStack, current],
    });
  },

  redo: () => {
    const { redoStack, undoStack, nodes, edges } = get();
    if (!redoStack.length) return;
    const next = redoStack[redoStack.length - 1];
    const current = cloneEntry(nodes, edges) as HistoryEntry;
    set({
      nodes: next.nodes,
      edges: next.edges,
      redoStack: redoStack.slice(0, -1),
      undoStack: [...undoStack, current],
    });
  },

  setSelectedNode: (id) => set({ selectedNode: id }),
  setSelectedEdge: (id) => set({ selectedEdge: id }),

  updateNodePosition: (nodeId, position) => {
    // Use rAF batching for smooth 60fps with 500+ nodes
    batchUpdatePosition(nodeId, position, set, get);
  },

  addEdgeWithType: (source, target, edgeType) => {
    get().pushHistory(); // BEFORE
    const newEdge = {
      id: crypto.randomUUID(),
      source,
      target,
      type: "connection" as const,
      data: { edgeType },
    };
    set({ edges: [...get().edges, newEdge] as any });
  },

  removeEdge: (edgeId) => {
    get().pushHistory(); // BEFORE
    set({ edges: get().edges.filter((e) => e.id !== edgeId) });
  },

  alignNodes: (direction) => {
    const { nodes } = get();
    const selected = nodes.filter((n) => n.selected);
    if (selected.length < 2) return;

    const positions = selected.map((n) => n.position);
    const minX = Math.min(...positions.map((p) => p.x));
    const maxX = Math.max(...positions.map((p) => p.x));
    const minY = Math.min(...positions.map((p) => p.y));
    const maxY = Math.max(...positions.map((p) => p.y));
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const idSet = new Set(selected.map((n) => n.id));
    const updated = nodes.map((n) => {
      if (!idSet.has(n.id)) return n;
      let { x, y } = n.position;
      switch (direction) {
        case "left":
          x = minX;
          break;
        case "center":
          x = centerX;
          break;
        case "right":
          x = maxX;
          break;
        case "top":
          y = minY;
          break;
        case "middle":
          y = centerY;
          break;
        case "bottom":
          y = maxY;
          break;
      }
      return { ...n, position: { x, y } };
    });
    get().pushHistory();
    set({ nodes: updated as Node<CanvasNodeData>[] });
  },

  distributeNodes: (direction) => {
    const { nodes } = get();
    const selected = nodes.filter((n) => n.selected);
    if (selected.length < 3) return;

    const sorted = [...selected].sort((a, b) =>
      direction === "horizontal"
        ? a.position.x - b.position.x
        : a.position.y - b.position.y,
    );

    const totalSpace =
      direction === "horizontal"
        ? sorted[sorted.length - 1].position.x - sorted[0].position.x
        : sorted[sorted.length - 1].position.y - sorted[0].position.y;
    const gap = totalSpace / (sorted.length - 1);

    const idSet = new Set(selected.map((n) => n.id));
    const updated = nodes.map((n) => {
      if (!idSet.has(n.id)) return n;
      const idx = sorted.findIndex((s) => s.id === n.id);
      if (idx <= 0) return n;
      const newPos =
        direction === "horizontal"
          ? sorted[0].position.x + gap * idx
          : sorted[0].position.y + gap * idx;
      return {
        ...n,
        position:
          direction === "horizontal"
            ? { x: newPos, y: n.position.y }
            : { x: n.position.x, y: newPos },
      };
    });
    get().pushHistory();
    set({ nodes: updated as Node<CanvasNodeData>[] });
  },

  bringToFront: (nodeId) => {
    const { nodes } = get();
    const idx = nodes.findIndex((n) => n.id === nodeId);
    if (idx === -1) return;
    get().pushHistory();
    const updated = [...nodes];
    const [item] = updated.splice(idx, 1);
    updated.push(item);
    set({ nodes: updated as Node<CanvasNodeData>[] });
  },

  sendToBack: (nodeId) => {
    const { nodes } = get();
    const idx = nodes.findIndex((n) => n.id === nodeId);
    if (idx === -1) return;
    get().pushHistory();
    const updated = [...nodes];
    const [item] = updated.splice(idx, 1);
    updated.unshift(item);
    set({ nodes: updated as Node<CanvasNodeData>[] });
  },

  bringForward: (nodeId) => {
    const { nodes } = get();
    const idx = nodes.findIndex((n) => n.id === nodeId);
    if (idx === -1 || idx >= nodes.length - 1) return;
    get().pushHistory();
    const updated = [...nodes];
    const temp = updated[idx];
    updated[idx] = updated[idx + 1];
    updated[idx + 1] = temp;
    set({ nodes: updated as Node<CanvasNodeData>[] });
  },

  sendBackward: (nodeId) => {
    const { nodes } = get();
    const idx = nodes.findIndex((n) => n.id === nodeId);
    if (idx <= 0) return;
    get().pushHistory();
    const updated = [...nodes];
    const temp = updated[idx];
    updated[idx] = updated[idx - 1];
    updated[idx - 1] = temp;
    set({ nodes: updated as Node<CanvasNodeData>[] });
  },

  autoLayout: async () => {
    const { nodes, edges } = get();
    if (nodes.length === 0) return;

    const nodeWidth = 224;
    const nodeHeight = 120;

    // Use Web Worker for layout computation (non-blocking for 500+ nodes)
    if (typeof Worker !== "undefined" && nodes.length > 50) {
      try {
        const worker = getLayoutWorker();

        const input = {
          nodes: nodes.map((n) => ({ id: n.id, position: n.position })),
          edges: edges.map((e) => ({ source: e.source, target: e.target })),
          options: {
            rankdir: "TB",
            nodesep: 60,
            ranksep: 80,
            marginx: 60,
            marginy: 60,
            nodeWidth,
            nodeHeight,
          },
        };

        const result = await new Promise<{
          positions: Array<{ id: string; x: number; y: number }>;
          error?: string;
        }>((resolve) => {
          const handler = (e: MessageEvent) => {
            worker.removeEventListener("message", handler);
            resolve(e.data);
          };
          worker.addEventListener("message", handler);
          worker.postMessage(input);
        });

        if (result.error) throw new Error(result.error);

        const positionMap = new Map(
          result.positions.map((p) => [p.id, { x: p.x, y: p.y }]),
        );
        const updated = nodes.map((n) => {
          const pos = positionMap.get(n.id);
          if (!pos) return n;
          return { ...n, position: pos };
        });
        get().pushHistory();
        set({ nodes: updated as Node<CanvasNodeData>[] });
        return;
      } catch {
        // Fall through to sync layout on worker failure
      }
    }

    // Sync fallback using inline SimpleDagre (no external dep)
    try {
      const positions = simpleDagreLayout(nodes, edges, {
        rankdir: "TB",
        nodesep: 60,
        ranksep: 80,
        marginx: 60,
        marginy: 60,
        nodeWidth,
        nodeHeight,
      });
      const positionMap = new Map(
        positions.map((p) => [p.id, { x: p.x, y: p.y }]),
      );
      const updated = nodes.map((n) => {
        const pos = positionMap.get(n.id);
        if (!pos) return n;
        return { ...n, position: pos };
      });
      get().pushHistory();
      set({ nodes: updated as Node<CanvasNodeData>[] });
    } catch {
      // Final fallback to grid layout
      const cols = Math.max(1, Math.floor(Math.sqrt(nodes.length * 2)));
      get().pushHistory();
      const updated = nodes.map((n, i) => ({
        ...n,
        position: {
          x: 60 + (i % cols) * (nodeWidth + 60),
          y: 60 + Math.floor(i / cols) * (nodeHeight + 60),
        },
      }));
      set({ nodes: updated as Node<CanvasNodeData>[] });
    }
  },

  toggleLockNode: (nodeId) => {
    get().pushHistory();
    set({
      nodes: get().nodes.map((n) =>
        n.id === nodeId
          ? {
              ...n,
              draggable: !n.draggable,
              data: { ...n.data, locked: !n.data?.locked },
            }
          : n,
      ),
    });
  },

  duplicateSelected: () => {
    const { nodes, edges } = get();
    const selected = nodes.filter((n) => n.selected);
    if (selected.length === 0) return;

    get().pushHistory(); // BEFORE
    const idMap = new Map<string, string>();
    const newNodes = selected.map((n) => {
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

    const deselected = nodes.map((n) => ({ ...n, selected: false }));
    set({
      nodes: [...deselected, ...newNodes] as Node<CanvasNodeData>[],
      edges: [...edges, ...newEdges] as Edge[],
    });
  },

  duplicateNode: (nodeId) => {
    const { nodes, edges } = get();
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;
    get().pushHistory(); // BEFORE
    const newId = crypto.randomUUID();
    const newNode = {
      ...node,
      id: newId,
      position: { x: node.position.x + 40, y: node.position.y + 40 },
      selected: false,
    };
    const relatedEdges = edges.filter(
      (e) => e.source === nodeId || e.target === nodeId,
    );
    const newEdges = relatedEdges.map((e) => ({
      ...e,
      id: crypto.randomUUID(),
      source: e.source === nodeId ? newId : e.source,
      target: e.target === nodeId ? newId : e.target,
    }));
    set({
      nodes: [...nodes, newNode] as Node<CanvasNodeData>[],
      edges: [...edges, ...newEdges] as Edge[],
    });
  },

  setNodesValidationStatus: (statusMap) => {
    set({
      nodes: get().nodes.map((node) => {
        const status = statusMap[node.id];
        if (!status) return node;
        return {
          ...node,
          data: { ...node.data, validationStatus: status },
        } as Node<CanvasNodeData>;
      }),
    });
  },

  setGeneratedCode: (code) => {
    set({ generatedCode: code });
  },

  startEditing: (nodeId) => {
    set({ editingNodeId: nodeId });
  },
  stopEditing: () => {
    set({ editingNodeId: null });
  },

  setHighlightedIncidentNodes: (nodeIds) => {
    set({ highlightedIncidentNodes: nodeIds });
  },
  clearHighlightedIncidentNodes: () => {
    set({ highlightedIncidentNodes: [] });
  },

  loadFromBackend: async (canvasId: string) => {
    try {
      const canvas = await designApi.getCanvas(canvasId);
      const nodes: Node<CanvasNodeData>[] = (canvas.canvasNodes || []).map(
        (nodeDto: CanvasNodeDTO) => {
          const props = nodeDto.properties
            ? JSON.parse(nodeDto.properties)
            : {};
          return {
            id: nodeDto.id,
            type: props.provider || "aws",
            position: { x: nodeDto.positionX, y: nodeDto.positionY },
            width: 224,
            height: 120,
            data: {
              label: props.label || "Resource",
              componentDefinitionId: nodeDto.componentDefinitionId,
              provider: props.provider || "aws",
              resourceType: props.resourceType || "unknown",
              properties: props.properties || {},
              validationStatus:
                (nodeDto.validationStatus as CanvasNodeData["validationStatus"]) ||
                "PENDING",
            },
          } as Node<CanvasNodeData>;
        },
      );
      const edges: Edge[] = (canvas.canvasEdges || []).map(
        (edgeDto: CanvasEdgeDTO) => stripHandleIds({
          id: edgeDto.id,
          source: edgeDto.sourceNodeId,
          target: edgeDto.targetNodeId,
          type: "connection",
          data: edgeDto.properties
            ? JSON.parse(edgeDto.properties)
            : { edgeType: edgeDto.edgeType },
        }),
      );
      set({
        nodes,
        edges,
        canvasId: canvas.id,
        canvasName: canvas.name,
        canvasVersion: canvas.designVersion,
        undoStack: [],
        redoStack: [],
        generatedCode: [],
      });
    } catch (err) {
      console.error("Falha ao carregar design do backend:", err);
      throw err;
    }
  },

  saveToBackend: async (tenantId: string, userId: string) => {
    const { nodes, edges, canvasName } = get();

    // Create the aggregate once; subsequent saves replace its content
    // transactionally with optimistic version checking on the backend.
    let currentCanvasId = get().canvasId;
    if (!currentCanvasId) {
      const created = await designApi.createCanvas({
        tenantId,
        name: canvasName || "Design sem título",
        userId,
      });
      currentCanvasId = created.id;
      set({ canvasId: currentCanvasId, canvasVersion: created.designVersion });
    }

    const nodeSnapshots = nodes.map((node) => {
      const storeProps = node.data.properties || {};
      const properties = JSON.stringify({
        label: node.data.label,
        provider: node.data.provider,
        resourceType: node.data.resourceType,
        properties: storeProps,
      });
      return {
        id: node.id,
        componentDefinitionId: node.data.componentDefinitionId,
        positionX: node.position.x,
        positionY: node.position.y,
        properties,
      };
    });
    const edgeSnapshots = edges.map((edge) => {
      const edgeData = edge.data as { edgeType?: string } | undefined;
      return {
        id: edge.id,
        sourceNodeId: edge.source,
        targetNodeId: edge.target,
        edgeType: edgeData?.edgeType || "connection",
        properties: JSON.stringify(edge.data || {}),
      };
    });

    const saved = await designApi.replaceCanvasContent(currentCanvasId, {
      expectedVersion: get().canvasVersion,
      name: canvasName || "Design sem título",
      metadata: JSON.stringify({ lastSavedAt: new Date().toISOString() }),
      nodes: nodeSnapshots,
      edges: edgeSnapshots,
    });
    set({ canvasVersion: saved.designVersion });

    return currentCanvasId;
  },
}));
