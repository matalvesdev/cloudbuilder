import { create } from "zustand";
import type { Viewport } from "@xyflow/react";

// ─── Viewport Store ──────────────────────────────────────────────
// Manages viewport state: zoom, pan, fit view, grid, snap.
// ReactFlow handles the actual transforms; this store mirrors state
// for UI display and programmatic control.

export type LayoutDirection = "TB" | "LR";
export type ColorMode = "light" | "dark" | "system";

export interface ViewportStoreState {
  // Zoom
  zoom: number;
  minZoom: number;
  maxZoom: number;
  zoomPercentage: number;

  // Pan
  panX: number;
  panY: number;

  // Grid
  snapEnabled: boolean;
  gridSize: number;

  // Layout
  layoutDirection: LayoutDirection;
  isLayoutAnimating: boolean;

  // Theme
  colorMode: ColorMode;

  // Panel visibility
  showPalette: boolean;
  showCodePreview: boolean;
  showVersionHistory: boolean;
  showAIChat: boolean;
  showObservability: boolean;
  showCostEstimation: boolean;
  showCollaboration: boolean;
  showProperties: boolean;
  showValidation: boolean;
  showMetrics: boolean;
  showRepoBrowser: boolean;
  showShortcuts: boolean;

  // Stats
  nodeCount: number;
  edgeCount: number;

  // Actions
  setViewport: (viewport: Viewport) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  toggleSnap: () => void;
  setGridSize: (size: number) => void;
  setLayoutDirection: (dir: LayoutDirection) => void;
  setLayoutAnimating: (v: boolean) => void;
  setColorMode: (mode: ColorMode) => void;
  setNodeCount: (count: number) => void;
  setEdgeCount: (count: number) => void;

  // Panel toggles
  togglePalette: () => void;
  toggleCodePreview: () => void;
  toggleVersionHistory: () => void;
  toggleAIChat: () => void;
  toggleObservability: () => void;
  toggleCostEstimation: () => void;
  toggleCollaboration: () => void;
  toggleProperties: () => void;
  toggleValidation: () => void;
  toggleMetrics: () => void;
  toggleRepoBrowser: () => void;
  toggleShortcuts: () => void;
  closeAllPanels: () => void;
}

export const useViewportStore = create<ViewportStoreState>((set, get) => ({
  zoom: 1,
  minZoom: 0.1,
  maxZoom: 4,
  zoomPercentage: 100,
  panX: 0,
  panY: 0,
  snapEnabled: true,
  gridSize: 16,
  layoutDirection: "TB",
  isLayoutAnimating: false,
  colorMode: "light",
  showPalette: true,
  showCodePreview: false,
  showVersionHistory: false,
  showAIChat: false,
  showObservability: false,
  showCostEstimation: false,
  showCollaboration: false,
  showProperties: false,
  showValidation: false,
  showMetrics: false,
  showRepoBrowser: false,
  showShortcuts: false,
  nodeCount: 0,
  edgeCount: 0,

  setViewport: ({ x, y, zoom }) => {
    set({
      zoom,
      zoomPercentage: Math.round(zoom * 100),
      panX: x,
      panY: y,
    });
  },

  zoomIn: () => {
    const z = Math.min(get().zoom * 1.2, get().maxZoom);
    set({ zoom: z, zoomPercentage: Math.round(z * 100) });
  },

  zoomOut: () => {
    const z = Math.max(get().zoom / 1.2, get().minZoom);
    set({ zoom: z, zoomPercentage: Math.round(z * 100) });
  },

  resetZoom: () => {
    set({ zoom: 1, zoomPercentage: 100, panX: 0, panY: 0 });
  },

  toggleSnap: () => set((s) => ({ snapEnabled: !s.snapEnabled })),
  setGridSize: (size) => set({ gridSize: size }),
  setLayoutDirection: (dir) => set({ layoutDirection: dir }),
  setLayoutAnimating: (v) => set({ isLayoutAnimating: v }),
  setColorMode: (mode) => set({ colorMode: mode }),
  setNodeCount: (count) => set({ nodeCount: count }),
  setEdgeCount: (count) => set({ edgeCount: count }),

  togglePalette: () => set((s) => ({ showPalette: !s.showPalette })),
  toggleCodePreview: () =>
    set((s) => ({
      showCodePreview: !s.showCodePreview,
      showVersionHistory: false,
      showAIChat: false,
      showObservability: false,
      showCostEstimation: false,
      showCollaboration: false,
    })),
  toggleVersionHistory: () =>
    set((s) => ({
      showVersionHistory: !s.showVersionHistory,
      showCodePreview: false,
      showAIChat: false,
      showObservability: false,
      showCostEstimation: false,
      showCollaboration: false,
    })),
  toggleAIChat: () =>
    set((s) => ({
      showAIChat: !s.showAIChat,
      showCodePreview: false,
      showVersionHistory: false,
      showObservability: false,
      showCostEstimation: false,
      showCollaboration: false,
    })),
  toggleObservability: () =>
    set((s) => ({
      showObservability: !s.showObservability,
      showCodePreview: false,
      showVersionHistory: false,
      showAIChat: false,
      showCostEstimation: false,
      showCollaboration: false,
    })),
  toggleCostEstimation: () =>
    set((s) => ({
      showCostEstimation: !s.showCostEstimation,
      showCodePreview: false,
      showVersionHistory: false,
      showAIChat: false,
      showObservability: false,
      showCollaboration: false,
    })),
  toggleCollaboration: () =>
    set((s) => ({
      showCollaboration: !s.showCollaboration,
      showCodePreview: false,
      showVersionHistory: false,
      showAIChat: false,
      showObservability: false,
      showCostEstimation: false,
    })),
  toggleProperties: () => set((s) => ({ showProperties: !s.showProperties })),
  toggleValidation: () => set((s) => ({ showValidation: !s.showValidation })),
  toggleMetrics: () => set((s) => ({ showMetrics: !s.showMetrics })),
  toggleRepoBrowser: () =>
    set((s) => ({ showRepoBrowser: !s.showRepoBrowser })),
  toggleShortcuts: () => set((s) => ({ showShortcuts: !s.showShortcuts })),
  closeAllPanels: () =>
    set({
      showCodePreview: false,
      showVersionHistory: false,
      showAIChat: false,
      showObservability: false,
      showCostEstimation: false,
      showCollaboration: false,
      showProperties: false,
      showValidation: false,
      showMetrics: false,
      showRepoBrowser: false,
      showShortcuts: false,
    }),
}));
