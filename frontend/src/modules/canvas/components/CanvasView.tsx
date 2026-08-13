import { useCallback, useRef, useState, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  BackgroundVariant,
  SelectionMode,
  useKeyPress,
  useOnSelectionChange,
  useViewport,
  useReactFlow,
  type Node,
  type Edge,
  type Connection,
  type OnSelectionChangeParams,
  type NodeTypes,
  type EdgeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCanvasStore } from "@/store/canvasStore";
import CloudNode from "../nodes/CloudNode";
import {
  ConnectionEdge,
  EDGE_TYPE_STYLES,
  type ConnectionEdgeType,
} from "../components/edges";
import type { CanvasNodeData } from "@/types/canvas.types";
import { validateConnection } from "../validation/connectionRules";
import { CursorsOverlay } from "./CursorsOverlay";
import {
  Box,
  LayoutGrid,
  Keyboard,
  AlignStartVertical,
  AlignEndVertical,
  AlignCenterVertical,
  AlignStartHorizontal,
  AlignEndHorizontal,
  AlignCenterHorizontal,
  Hand,
  Trash2,
  Copy,
  BringToFront,
  SendToBack,
  Lock,
  Unlock,
  ZoomIn,
  Undo2,
  Redo2,
  Pencil,
  Eye,
  Maximize2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

const nodeTypes: NodeTypes = {
  aws: CloudNode,
  azure: CloudNode,
  gcp: CloudNode,
  k8s: CloudNode,
};

const edgeTypes: EdgeTypes = {
  connection: ConnectionEdge,
};

const SNAP_GRID = 20;

interface CanvasViewProps {
  onNodeSelect?: (node: Node | null) => void;
  snapEnabled?: boolean;
  onCommandPalette?: () => void;
}

function CanvasFlow({
  onNodeSelect,
  snapEnabled: externalSnapEnabled,
  onCommandPalette,
}: CanvasViewProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const reactFlowInstance = useReactFlow();
  const viewport = useViewport();
  const deletePressed = useKeyPress(["Backspace", "Delete"]);
  const undoPressed = useKeyPress(["Meta+z", "Ctrl+z"]);
  const redoPressed = useKeyPress([
    "Meta+Shift+z",
    "Ctrl+Shift+z",
    "Meta+y",
    "Ctrl+y",
  ]);
  const selectAllPressed = useKeyPress(["Meta+a", "Ctrl+a"]);
  const copyPressed = useKeyPress(["Meta+c", "Ctrl+c"]);
  const cutPressed = useKeyPress(["Meta+x", "Ctrl+x"]);
  const duplicatePressed = useKeyPress(["Meta+d", "Ctrl+d"]);
  const cmdKPressed = useKeyPress(["Meta+k", "Ctrl+k"]);
  const spacePressed = useKeyPress("Space");
  const arrowUpPressed = useKeyPress("ArrowUp");
  const arrowDownPressed = useKeyPress("ArrowDown");
  const arrowLeftPressed = useKeyPress("ArrowLeft");
  const arrowRightPressed = useKeyPress("ArrowRight");
  const [isDragging, setIsDragging] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connectionSource, setConnectionSource] = useState<string | null>(null);
  const [selectionCount, setSelectionCount] = useState({ nodes: 0, edges: 0 });
  const [edgeType, setEdgeType] = useState<ConnectionEdgeType>("default");
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [layoutAnimating, setLayoutAnimating] = useState(false);
  const [showPanHint, setShowPanHint] = useState(() => {
    // Show pan hint on first visit (no nodes and never dismissed)
    const dismissed = localStorage.getItem("cloudbuilder-pan-hint-dismissed");
    return useCanvasStore.getState().nodes.length === 0 && !dismissed;
  });
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    type: "node" | "pane" | "edge";
    nodeId?: string;
    edgeId?: string;
  } | null>(null);
  const [quickActions, setQuickActions] = useState<{
    x: number;
    y: number;
    type: "node" | "pane";
    nodeId?: string;
  } | null>(null);
  const snapEnabled = externalSnapEnabled ?? true;
  const questionPressed = useKeyPress("?");
  const clipboardRef = useRef<{ nodes: Node[]; edges: Edge[] } | null>(null);
  const lastPaneClickRef = useRef(0);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const quickActionsRef = useRef<HTMLDivElement>(null);

  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    addNode,
    undo,
    redo,
    pushHistory,
    removeSelectedNodes,
    duplicateSelected,
    alignNodes,
    distributeNodes,
    autoLayout,
    updateNodePosition,
  } = useCanvasStore();

  // Auto-hide pan hint after 5 seconds
  useEffect(() => {
    if (!showPanHint) return;
    const timer = setTimeout(() => {
      setShowPanHint(false);
      localStorage.setItem("cloudbuilder-pan-hint-dismissed", "true");
    }, 5000);
    return () => clearTimeout(timer);
  }, [showPanHint]);

  // Dismiss pan hint on any canvas interaction
  useEffect(() => {
    if (!showPanHint) return;
    const dismiss = () => {
      setShowPanHint(false);
      localStorage.setItem("cloudbuilder-pan-hint-dismissed", "true");
    };
    window.addEventListener("mousedown", dismiss, { once: true });
    return () => window.removeEventListener("mousedown", dismiss);
  }, [showPanHint]);

  useEffect(() => {
    if (questionPressed) setShowShortcuts((prev) => !prev);
  }, [questionPressed]);

  useEffect(() => {
    if (cmdKPressed) onCommandPalette?.();
  }, [cmdKPressed, onCommandPalette]);

  useEffect(() => {
    if (deletePressed) {
      // Remove selected edges first, then selected nodes
      if (selectionCount.edges > 0) {
        const store = useCanvasStore.getState()
        const selectedEdges = store.edges.filter((e) => e.selected)
        if (selectedEdges.length > 0) {
          store.pushHistory()
          useCanvasStore.setState({
            edges: store.edges.filter((e) => !e.selected),
          })
        }
      } else {
        removeSelectedNodes()
      }
    }
  }, [deletePressed, removeSelectedNodes, selectionCount.edges]);

  useEffect(() => {
    if (undoPressed) undo();
  }, [undoPressed, undo]);

  useEffect(() => {
    if (redoPressed) redo();
  }, [redoPressed, redo]);

  useEffect(() => {
    if (duplicatePressed) duplicateSelected();
  }, [duplicatePressed, duplicateSelected]);

  useEffect(() => {
    if (selectAllPressed) {
      reactFlowInstance.setNodes(nodes.map((n) => ({ ...n, selected: true })));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectAllPressed]);

  useEffect(() => {
    if (copyPressed || cutPressed) {
      const selected = nodes.filter((n) => n.selected);
      if (selected.length) {
        clipboardRef.current = {
          nodes: JSON.parse(JSON.stringify(selected)),
          edges: edges.filter(
            (e) =>
              selected.some((n) => n.id === e.source) &&
              selected.some((n) => n.id === e.target),
          ),
        };
        if (cutPressed) removeSelectedNodes();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [copyPressed, cutPressed]);

  // Arrow keys nudge selected nodes (Miro/Figma behavior)
  useEffect(() => {
    const nudge = (dx: number, dy: number) => {
      const selected = nodes.filter((n) => n.selected);
      if (selected.length === 0) return;
      pushHistory();
      selected.forEach((n) => {
        updateNodePosition(n.id, {
          x: n.position.x + dx,
          y: n.position.y + dy,
        });
      });
    };

    if (arrowUpPressed) {
      nudge(0, -1);
      return;
    }
    if (arrowDownPressed) {
      nudge(0, 1);
      return;
    }
    if (arrowLeftPressed) {
      nudge(-1, 0);
      return;
    }
    if (arrowRightPressed) {
      nudge(1, 0);
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arrowUpPressed, arrowDownPressed, arrowLeftPressed, arrowRightPressed]);

  useOnSelectionChange({
    onChange: ({
      nodes: selNodes,
      edges: selEdges,
    }: OnSelectionChangeParams) => {
      setSelectionCount({ nodes: selNodes.length, edges: selEdges.length });
    },
  });

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setIsDragging(false);
      const data = event.dataTransfer?.getData("application/reactflow");
      if (!data) return;
      const componentData = JSON.parse(data);
      const flowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      if (!flowBounds) return;
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      const snapped = {
        x: Math.round(position.x / SNAP_GRID) * SNAP_GRID,
        y: Math.round(position.y / SNAP_GRID) * SNAP_GRID,
      };
      addNode(componentData, snapped);
    },
    [addNode, reactFlowInstance],
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
  }, []);

  const onDragEnter = useCallback(() => setIsDragging(true), []);
  const onDragLeave = useCallback(() => setIsDragging(false), []);

  const onNodeDoubleClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (node.draggable === false) return; // locked nodes
      const { startEditing } = useCanvasStore.getState();
      startEditing(node.id);
    },
    [],
  );

  const onConnectWithValidation = useCallback(
    (connection: Connection) => {
      const sourceNode = nodes.find((n) => n.id === connection.source);
      const targetNode = nodes.find((n) => n.id === connection.target);
      if (!sourceNode || !targetNode) return;

      if (connection.source === connection.target) return;

      const exists = edges.some(
        (e) => e.source === connection.source && e.target === connection.target,
      );
      if (exists) return;

      const validation = validateConnection(
        sourceNode as Node<CanvasNodeData>,
        targetNode as Node<CanvasNodeData>,
      );
      if (!validation.valid) return;

      const { addEdgeWithType } = useCanvasStore.getState();
      addEdgeWithType(connection.source!, connection.target!, edgeType);
    },
    [nodes, edges, edgeType],
  );

  const onConnectStart = useCallback((_: any, { nodeId }: any) => {
    setConnecting(true);
    setConnectionSource(nodeId || null);
  }, []);

  const onConnectEnd = useCallback(() => {
    setConnecting(false);
    setConnectionSource(null);
  }, []);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      onNodeSelect?.(node);
    },
    [onNodeSelect],
  );

  const onPaneClick = useCallback(() => {
    const now = Date.now();
    if (now - lastPaneClickRef.current < 300) {
      onCommandPalette?.();
      lastPaneClickRef.current = 0;
      return;
    }
    lastPaneClickRef.current = now;
    onNodeSelect?.(null);
  }, [onNodeSelect, onCommandPalette]);

  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault();
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        type: "node",
        nodeId: node.id,
      });
    },
    [],
  );

  // Edge context menu (right-click on edge)
  const onEdgeContextMenu = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      event.preventDefault();
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        type: "edge",
        edgeId: edge.id,
      });
    },
    [],
  );

  const onPaneContextMenu = useCallback(
    (event: React.MouseEvent | MouseEvent) => {
      event.preventDefault();
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        type: "pane",
      });
    },
    [],
  );

  // Close context menu on click outside
  useEffect(() => {
    if (!contextMenu) return;
    const handleClick = (e: MouseEvent) => {
      if (
        contextMenuRef.current &&
        e.target instanceof Node &&
        !contextMenuRef.current.contains(e.target)
      ) {
        setContextMenu(null);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setContextMenu(null);
        setQuickActions(null);
      }
    };
    // Delay adding listener to avoid the right-click itself closing the menu
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClick);
      document.addEventListener("keydown", handleEscape);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [contextMenu]);

  // Close quick actions on click outside / escape
  useEffect(() => {
    if (!quickActions) return;
    const handleClick = (e: MouseEvent) => {
      if (
        quickActionsRef.current &&
        e.target instanceof Node &&
        !quickActionsRef.current.contains(e.target)
      ) {
        setQuickActions(null);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setQuickActions(null);
    };
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClick);
      document.addEventListener("keydown", handleEscape);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [quickActions]);

  // Mouse button 4 (back) = undo, button 5 (forward) = redo
  // Uses pointerdown on window — reliably cancelable for browser back/forward
  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      if (e.button === 3 || e.button === 4) {
        e.preventDefault();
        if (e.button === 3) undo();
        else redo();
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [undo, redo]);

  // Middle-click (button 1) — Quick Actions Radial
  // Check if click target is a node or pane
  useEffect(() => {
    const wrapper = reactFlowWrapper.current;
    if (!wrapper) return;

    const handleAuxClick = (e: MouseEvent) => {
      if (e.button !== 1) return;

      // Find if clicking on a node by walking up from target
      let target = e.target as HTMLElement | null;
      let nodeId: string | null = null;

      while (target && target !== wrapper) {
        const dataId = target.getAttribute("data-id");
        if (dataId && target.classList.contains("react-flow__node")) {
          nodeId = dataId;
          break;
        }
        target = target.parentElement;
      }

      if (nodeId) {
        // Middle-click on a node — Node Quick Actions
        e.preventDefault();
        e.stopPropagation(); // prevents ReactFlow panOnDrag={[1]} from consuming the event
        setQuickActions({
          x: e.clientX,
          y: e.clientY,
          type: "node",
          nodeId,
        });
      } else if (wrapper.contains(e.target as HTMLElement)) {
        // Middle-click on empty canvas — handled by ReactFlow panning; no action needed
        // This allows the default pan-on-middle-click behavior to proceed
      }
    };

    wrapper.addEventListener("mousedown", handleAuxClick);
    return () => wrapper.removeEventListener("mousedown", handleAuxClick);
  }, []);

  const contextMenuNode =
    contextMenu?.type === "node"
      ? nodes.find((n) => n.id === contextMenu.nodeId)
      : null;

  const contextMenuEdge =
    contextMenu?.type === "edge"
      ? edges.find((e) => e.id === contextMenu.edgeId)
      : null;

  const quickActionsNode =
    quickActions?.type === "node"
      ? nodes.find((n) => n.id === quickActions.nodeId)
      : null;

  const handleAutoLayout = useCallback(() => {
    setLayoutAnimating(true);
    const store = useCanvasStore.getState();
    store.autoLayout();
    setTimeout(() => setLayoutAnimating(false), 600);
  }, []);

  const onNodeDragStart = useCallback(() => {
    pushHistory();
  }, [pushHistory]);

  const onNodeDragStop = useCallback(() => {
    pushHistory();
  }, [pushHistory]);

  const showEmptyState = nodes.length === 0;

  useEffect(() => {
    const handlePaste = (_e: Event) => {
      if (!clipboardRef.current) return;
      const idMap = new Map<string, string>();
      const newNodes = clipboardRef.current.nodes.map((n) => {
        const newId = crypto.randomUUID();
        idMap.set(n.id, newId);
        return {
          ...n,
          id: newId,
          position: {
            x: Math.round((n.position.x + 40) / SNAP_GRID) * SNAP_GRID,
            y: Math.round((n.position.y + 40) / SNAP_GRID) * SNAP_GRID,
          },
          selected: true,
        };
      });
      const newEdges = clipboardRef.current.edges.map((e) => ({
        ...e,
        id: crypto.randomUUID(),
        source: idMap.get(e.source) || e.source,
        target: idMap.get(e.target) || e.target,
      }));
      const store = useCanvasStore.getState();
      useCanvasStore.setState({
        nodes: [
          ...store.nodes.map((n) => ({ ...n, selected: false })),
          ...newNodes,
        ] as Node<CanvasNodeData>[],
        edges: [...store.edges, ...newEdges] as Edge[],
      });
      pushHistory();
    };
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [pushHistory]);

  const currentEdgeLabel = EDGE_TYPE_STYLES[edgeType].labelPtBr;
  const selectedCount = nodes.filter((n) => n.selected).length;

  return (
    <div
      ref={reactFlowWrapper}
      className={cn(
        "flex-1 h-full w-full transition-colors",
        isDragging && "bg-blue-50/50",
        connecting && "cursor-crosshair",
        spacePressed && "cursor-grab",
      )}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
    >
      {/* Hidden SVG defs for edge arrow markers */}
      <svg
        style={{ position: "absolute", width: 0, height: 0, top: 0, left: 0 }}
      >
        <defs>
          <marker
            id="arrow-default"
            markerWidth="8"
            markerHeight="6"
            refX="8"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0 8 3 0 6" fill="#0a1128" />
          </marker>
          <marker
            id="arrow-animated"
            markerWidth="8"
            markerHeight="6"
            refX="8"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0 8 3 0 6" fill="#ccff00" />
          </marker>
          <marker
            id="arrow-dashed"
            markerWidth="8"
            markerHeight="6"
            refX="8"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0 8 3 0 6" fill="#a855f7" />
          </marker>
          <marker
            id="arrow-network"
            markerWidth="8"
            markerHeight="6"
            refX="8"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0 8 3 0 6" fill="#3b82f6" />
          </marker>
        </defs>
      </svg>

      {/* Animate nodes during auto-layout */}
      {layoutAnimating && (
        <style>{`.react-flow__node { transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1) !important; }`}</style>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnectWithValidation}
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={onNodeDoubleClick}
        onNodeContextMenu={onNodeContextMenu}
        onEdgeContextMenu={onEdgeContextMenu}
        onPaneContextMenu={onPaneContextMenu}
        onPaneClick={onPaneClick}
        onNodeDragStart={onNodeDragStart}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={{
          type: "connection",
          data: { edgeType: "default" },
        }}
        fitView
        selectionMode={SelectionMode.Partial}
        multiSelectionKeyCode="Shift"
        panOnDrag={[1]}
        panActivationKeyCode={"Space"}
        selectionOnDrag={true}
        selectionKeyCode={null}
        snapToGrid={snapEnabled}
        snapGrid={[SNAP_GRID, SNAP_GRID]}
        minZoom={0.1}
        maxZoom={4}
        panOnScroll={false}
        zoomOnScroll={true}
        zoomOnDoubleClick={false}
        selectNodesOnDrag={false}
        elevateNodesOnSelect={true}
        onlyRenderVisibleElements={true}
        autoPanOnNodeDrag={true}
        autoPanOnConnect={true}
        connectionRadius={20}
        colorMode="light"
        // Performance: viewport culling for 500+ nodes
        // onlyRenderVisibleElements already enabled above
        // Performance: reduce re-renders with stable node/edge keys
        // Performance: throttle drag events
        nodeDragThreshold={2}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={32}
          size={1.5}
          color="#e0f2fe"
        />
        <Controls
          showInteractive={false}
          position="bottom-left"
          className="!bg-white !border !border-slate-200 !rounded-xl !shadow-card"
        />
        <Panel position="bottom-left" className="!mb-[100px] !ml-[4px]">
          <button
            onClick={() =>
              reactFlowInstance.fitView({ padding: 0.2, duration: 300 })
            }
            className="w-8 h-8 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-xl shadow-card flex items-center justify-center hover:bg-slate-50 transition-colors text-slate-500 hover:text-brand-navy"
            title="Ajustar à tela"
          >
            <span className="text-xs font-bold">⌗</span>
          </button>
        </Panel>
        <MiniMap
          nodeStrokeColor="#0a1128"
          nodeColor="#fff"
          nodeBorderRadius={6}
          maskColor="rgba(10,17,40,0.06)"
          pannable
          zoomable
          position="bottom-right"
          className="!border !border-slate-200 !rounded-xl !shadow-card"
        />

        {/* Zoom info + canvas stats with inline zoom controls */}
        <Panel position="top-right" className="!m-4">
          <div className="flex items-center gap-1 px-2 py-1 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-full shadow-card text-xs text-slate-500">
            <button
              onClick={() => reactFlowInstance.zoomIn()}
              className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 hover:text-brand-navy transition-colors"
              title="Ampliar zoom"
            >
              <span className="text-sm font-bold leading-none">+</span>
            </button>
            <span className="font-mono font-semibold text-slate-700 min-w-[36px] text-center select-none">
              {Math.round(viewport.zoom * 100)}%
            </span>
            <button
              onClick={() => reactFlowInstance.zoomOut()}
              className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 hover:text-brand-navy transition-colors"
              title="Reduzir zoom"
            >
              <span className="text-sm font-bold leading-none">−</span>
            </button>
            <span className="text-slate-300 mx-0.5 select-none">|</span>
            <span className="font-medium text-slate-500 select-none">
              {nodes.length} nós
            </span>
            <span className="text-slate-300 ml-0.5 select-none">·</span>
            <span className="font-medium text-slate-500 select-none">
              {edges.length} edges
            </span>
          </div>
        </Panel>

        {/* Connection hint */}
        {connecting && connectionSource && (
          <Panel position="top-center" className="!mt-16">
            <div className="px-4 py-2 bg-brand-navy text-white text-xs rounded-full shadow-lg animate-pulse">
              Conecte a um componente de destino
            </div>
          </Panel>
        )}

        {/* Pan hint — auto-hides after 5s on first visit */}
        {showPanHint && (
          <Panel position="bottom-center" className="!mb-14">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-navy/80 text-white text-xs rounded-full shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300">
              <Hand className="w-3.5 h-3.5" />
              Botão do meio + arrastar para navegar · Scroll para zoom · Espaço
              + arrastar para seleção
            </div>
          </Panel>
        )}

        {/* Empty state */}
        {showEmptyState && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
            <div className="flex flex-col items-center gap-5 max-w-[280px]">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-navy/5 to-ice-blue/20 flex items-center justify-center ring-1 ring-brand-navy/5">
                <LayoutGrid className="w-8 h-8 text-brand-navy/30" />
              </div>
              <div className="text-center space-y-1.5">
                <h3 className="text-base font-display font-semibold text-brand-navy/50">
                  Canvas vazio
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Arraste componentes da paleta ao lado, use{" "}
                  <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-xs font-mono text-slate-500 border border-slate-200">
                    ⌘K
                  </kbd>{" "}
                  para comandos, ou duplo clique no canvas para começar.
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-300">
                <span className="flex items-center gap-1">
                  <Keyboard className="w-3 h-3" /> shortcuts
                </span>
                <span className="w-1 h-1 rounded-full bg-slate-200" />
                <span className="flex items-center gap-1">
                  <LayoutGrid className="w-3 h-3" /> snap grid
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Bottom toolbar: edge type selector + snap */}
        <Panel position="bottom-center" className="!mb-20">
          <div className="flex items-center gap-1.5 px-2 py-1.5 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-full shadow-card">
            <Select
              value={edgeType}
              onValueChange={(v) => setEdgeType(v as ConnectionEdgeType)}
            >
              <SelectTrigger className="flex items-center gap-1 px-3 py-1 h-7 w-auto text-xs font-medium rounded-full bg-brand-navy text-white border-none shadow-none gap-1.5">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: EDGE_TYPE_STYLES[edgeType].color }}
                />
                <SelectValue placeholder={currentEdgeLabel} />
              </SelectTrigger>
              <SelectContent
                align="center"
                className="min-w-[140px] rounded-xl"
              >
                {(
                  Object.entries(EDGE_TYPE_STYLES) as [
                    ConnectionEdgeType,
                    (typeof EDGE_TYPE_STYLES)["default"],
                  ][]
                ).map(([value, config]) => (
                  <SelectItem key={value} value={value} className="text-xs">
                    <span className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: config.color }}
                      />
                      <span>{config.labelPtBr}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="w-px h-4 bg-slate-200 mx-1" />
            {externalSnapEnabled === undefined && (
              <button
                className={cn(
                  "px-2.5 py-1 rounded-full transition-colors flex items-center gap-1",
                  snapEnabled
                    ? "bg-brand-navy/10 text-brand-navy"
                    : "text-slate-400",
                )}
                title={snapEnabled ? "Snap ativado" : "Snap desativado"}
              >
                <LayoutGrid className="w-3 h-3" />
              </button>
            )}
          </div>
        </Panel>

        {/* Selection count */}
        {selectionCount.nodes > 0 && (
          <Panel position="bottom-center" className="!mb-14">
            <div className="px-3 py-1.5 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-full shadow-card text-xs text-slate-600">
              {selectionCount.nodes}{" "}
              {selectionCount.nodes === 1
                ? "nó selecionado"
                : "nós selecionados"}
              {selectionCount.edges > 0 &&
                ` · ${selectionCount.edges} ${selectionCount.edges === 1 ? "conexão" : "conexões"}`}
            </div>
          </Panel>
        )}

        {/* Keyboard shortcuts help */}
        <Panel position="top-left" className="!m-4">
          <button
            onClick={() => setShowShortcuts((prev) => !prev)}
            className="w-8 h-8 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-full shadow-card flex items-center justify-center hover:bg-slate-50 transition-colors"
            title="Atalhos de teclado (? para alternar)"
          >
            <Keyboard className="w-4 h-4 text-slate-500" />
          </button>
          {showShortcuts && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowShortcuts(false)}
              />
              {/* Modal */}
              <div className="absolute top-10 left-0 z-50 w-[340px] bg-white border border-slate-200 rounded-2xl shadow-2xl text-xs overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                  <p className="font-bold text-slate-700">Atalhos do teclado</p>
                  <button
                    onClick={() => setShowShortcuts(false)}
                    className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <span className="text-xs font-bold">✕</span>
                  </button>
                </div>
                <div className="p-3 max-h-[400px] overflow-y-auto space-y-1">
                  {[
                    ["⌘K", "Paleta de comandos"],
                    ["Botão do meio + arrastar", "Navegar (pan)"],
                    ["Botão 4 (←)", "Desfazer (undo)"],
                    ["Botão 5 (→)", "Refazer (redo)"],
                    ["Clique do meio em nó", "Ações rápidas do nó"],
                    ["Espaço + arrastar", "Navegar (pan)"],
                    ["Clique + arrastar vazio", "Seleção múltipla"],
                    ["Clique", "Selecionar nó"],
                    ["Shift + clique", "Seleção múltipla adicional"],
                    ["Duplo clique nó", "Renomear"],
                    ["Duplo clique vazio", "Adicionar componente"],
                    ["⌘Z", "Desfazer"],
                    ["⇧⌘Z", "Refazer"],
                    ["⌘D", "Duplicar selecionados"],
                    ["⌘C / ⌘X", "Copiar / Recortar"],
                    ["⌘V", "Colar"],
                    ["⌘A", "Selecionar tudo"],
                    ["⌫ / Delete", "Remover selecionados"],
                    ["↑↓←→", "Mover selecionados (1px)"],
                    ["?", "Mostrar/ocultar atalhos"],
                    ["Scroll", "Zoom in/out"],
                    ['Clique em "+"/"−"', "Zoom no HUD"],
                  ].map(([key, desc]) => (
                    <div key={key} className="flex justify-between gap-4 py-1">
                      <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-mono text-slate-600 whitespace-nowrap shrink-0">
                        {key}
                      </kbd>
                      <span className="text-slate-500 text-right leading-tight">
                        {desc}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 text-[9px] text-slate-400 text-center">
                  Pressione{" "}
                  <kbd className="px-1 py-0.5 bg-white rounded text-[9px] font-mono border border-slate-200">
                    ?
                  </kbd>{" "}
                  a qualquer momento
                </div>
              </div>
            </>
          )}
        </Panel>
      </ReactFlow>

      {/* Remote cursor overlay for multiplayer */}
      <CursorsOverlay />

      {/* Context Menu overlay */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          style={{
            position: "fixed",
            left: contextMenu.x,
            top: contextMenu.y,
            zIndex: 9999,
          }}
          className="min-w-[180px] bg-white border border-slate-200 rounded-xl shadow-xl py-1 animate-in fade-in-0 zoom-in-95"
        >
          {contextMenu.type === "node" && contextMenuNode && (
            <>
              <div className="px-3 py-1.5 text-xs font-medium text-slate-500 border-b border-slate-100 truncate">
                {(contextMenuNode.data?.label as string) ?? "Nó"}
              </div>
              <button
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                onClick={() => {
                  onNodeSelect?.(contextMenuNode);
                  setContextMenu(null);
                }}
              >
                <Eye className="w-3.5 h-3.5 text-slate-400" />
                Propriedades
              </button>
              <button
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                onClick={() => {
                  const store = useCanvasStore.getState();
                  store.startEditing(contextMenu.nodeId!);
                  setContextMenu(null);
                }}
              >
                <Pencil className="w-3.5 h-3.5 text-slate-400" />
                Renomear
              </button>
              <div className="h-px bg-slate-100 my-1" />
              <button
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                onClick={() => {
                  const store = useCanvasStore.getState();
                  store.duplicateNode(contextMenu.nodeId!);
                  setContextMenu(null);
                }}
              >
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                Duplicar
              </button>
              <button
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                onClick={() => {
                  const store = useCanvasStore.getState();
                  store.bringToFront(contextMenu.nodeId!);
                  setContextMenu(null);
                }}
              >
                <BringToFront className="w-3.5 h-3.5 text-slate-400" />
                Trazer para frente
              </button>
              <button
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                onClick={() => {
                  const store = useCanvasStore.getState();
                  store.sendToBack(contextMenu.nodeId!);
                  setContextMenu(null);
                }}
              >
                <SendToBack className="w-3.5 h-3.5 text-slate-400" />
                Enviar para trás
              </button>
              <button
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                onClick={() => {
                  const store = useCanvasStore.getState();
                  store.toggleLockNode(contextMenu.nodeId!);
                  setContextMenu(null);
                }}
              >
                {contextMenuNode.draggable !== false ? (
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <Unlock className="w-3.5 h-3.5 text-slate-400" />
                )}
                {contextMenuNode.draggable !== false
                  ? "Bloquear"
                  : "Desbloquear"}
              </button>
              <div className="h-px bg-slate-100 my-1" />
              <button
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                onClick={() => {
                  const store = useCanvasStore.getState();
                  store.removeNode(contextMenu.nodeId!);
                  setContextMenu(null);
                }}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Excluir
              </button>
            </>
          )}

          {contextMenu.type === "edge" && contextMenuEdge && (
            <>
              <div className="px-3 py-1.5 text-xs font-medium text-slate-500 border-b border-slate-100 truncate">
                Conexão: {contextMenuEdge.source} → {contextMenuEdge.target}
              </div>
              <div className="px-3 py-2 space-y-1.5">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Tipo de conexão
                </p>
                <div className="space-y-1">
                  {(
                    Object.entries(EDGE_TYPE_STYLES) as [
                      ConnectionEdgeType,
                      (typeof EDGE_TYPE_STYLES)["default"],
                    ][]
                  ).map(([value, config]) => (
                    <button
                      key={value}
                      className={cn(
                        "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors",
                        contextMenuEdge.data?.edgeType === value
                          ? "bg-brand-navy/10 text-brand-navy font-semibold"
                          : "text-slate-600 hover:bg-slate-50",
                      )}
                      onClick={() => {
                        // Remove and recreate edge with new type
                        const store = useCanvasStore.getState();
                        const edge = store.edges.find(
                          (e: any) => e.id === contextMenu.edgeId,
                        );
                        if (edge) {
                          store.removeEdge(contextMenu.edgeId!);
                          store.addEdgeWithType(
                            edge.source,
                            edge.target,
                            value,
                          );
                        }
                        setContextMenu(null);
                      }}
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: config.color }}
                      />
                      {config.labelPtBr}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-px bg-slate-100 my-1" />
              <button
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                onClick={() => {
                  const store = useCanvasStore.getState();
                  store.removeEdge?.(contextMenu.edgeId!);
                  setContextMenu(null);
                }}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Excluir conexão
              </button>
            </>
          )}

          {contextMenu.type === "pane" && (
            <>
              <div className="px-3 py-1.5 text-xs font-medium text-slate-500 border-b border-slate-100">
                Canvas
              </div>
              <button
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                onClick={() => {
                  const event = new KeyboardEvent("keydown", {
                    key: "v",
                    metaKey: true,
                  });
                  document.dispatchEvent(event);
                  setContextMenu(null);
                }}
              >
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                Colar
              </button>
              <button
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                onClick={() => {
                  onCommandPalette?.();
                  setContextMenu(null);
                }}
              >
                <Box className="w-3.5 h-3.5 text-slate-400" />
                Adicionar componente
              </button>
              <div className="h-px bg-slate-100 my-1" />
              <button
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                onClick={() => {
                  handleAutoLayout();
                  setContextMenu(null);
                }}
              >
                <LayoutGrid className="w-3.5 h-3.5 text-slate-400" />
                Organizar layout
              </button>
              <button
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                onClick={() => {
                  reactFlowInstance.fitView({ padding: 0.2, duration: 300 });
                  setContextMenu(null);
                }}
              >
                <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
                Zoom para conteúdo
              </button>
              <button
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                onClick={() => {
                  reactFlowInstance.zoomTo(1);
                  setContextMenu(null);
                }}
              >
                <ZoomIn className="w-3.5 h-3.5 text-slate-400" />
                Zoom 100%
              </button>
              <div className="h-px bg-slate-100 my-1" />
              <button
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                onClick={() => {
                  undo();
                  setContextMenu(null);
                }}
              >
                <Undo2 className="w-3.5 h-3.5 text-slate-400" />
                Desfazer
              </button>
              <button
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                onClick={() => {
                  redo();
                  setContextMenu(null);
                }}
              >
                <Redo2 className="w-3.5 h-3.5 text-slate-400" />
                Refazer
              </button>
              <div className="h-px bg-slate-100 my-1" />
              <button
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                onClick={() => {
                  reactFlowInstance.setNodes(
                    nodes.map((n) => ({ ...n, selected: true })),
                  );
                  setContextMenu(null);
                }}
              >
                <span className="w-3.5 h-3.5 flex items-center justify-center text-slate-400 text-xs font-bold">
                  ⌗
                </span>
                Selecionar tudo
              </button>
            </>
          )}
        </div>
      )}

      {/* Quick Actions overlay (middle-click) */}
      {quickActions && (
        <div
          ref={quickActionsRef}
          style={{
            position: "fixed",
            left: quickActions.x - 80,
            top: quickActions.y - 40,
            zIndex: 9999,
          }}
          className="min-w-[160px] bg-white border border-slate-200 rounded-2xl shadow-2xl py-2 px-2 animate-in fade-in-0 zoom-in-95"
        >
          {quickActions.type === "node" && quickActionsNode && (
            <div className="flex gap-1">
              <button
                className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors min-w-[60px]"
                onClick={() => {
                  const store = useCanvasStore.getState();
                  store.startEditing(quickActions.nodeId!);
                  setQuickActions(null);
                }}
                title="Renomear"
              >
                <Pencil className="w-4 h-4 text-slate-500" />
                <span className="text-[10px] text-slate-500">Renomear</span>
              </button>
              <button
                className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors min-w-[60px]"
                onClick={() => {
                  const store = useCanvasStore.getState();
                  store.duplicateNode(quickActions.nodeId!);
                  setQuickActions(null);
                }}
                title="Duplicar"
              >
                <Copy className="w-4 h-4 text-slate-500" />
                <span className="text-[10px] text-slate-500">Duplicar</span>
              </button>
              <button
                className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors min-w-[60px]"
                onClick={() => {
                  const store = useCanvasStore.getState();
                  store.toggleLockNode(quickActions.nodeId!);
                  setQuickActions(null);
                }}
                title={
                  quickActionsNode.draggable !== false
                    ? "Bloquear"
                    : "Desbloquear"
                }
              >
                {quickActionsNode.draggable !== false ? (
                  <Lock className="w-4 h-4 text-slate-500" />
                ) : (
                  <Unlock className="w-4 h-4 text-slate-500" />
                )}
                <span className="text-[10px] text-slate-500">
                  {quickActionsNode.draggable !== false
                    ? "Bloquear"
                    : "Desbloq."}
                </span>
              </button>
              <button
                className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl hover:bg-red-50 transition-colors min-w-[60px]"
                onClick={() => {
                  const store = useCanvasStore.getState();
                  store.removeNode(quickActions.nodeId!);
                  setQuickActions(null);
                }}
                title="Excluir"
              >
                <Trash2 className="w-4 h-4 text-red-400" />
                <span className="text-[10px] text-red-400">Excluir</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function CanvasView(props: CanvasViewProps) {
  return <CanvasFlow {...props} />;
}
