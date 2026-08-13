/**
 * CloudBuilder — Frontend Performance Benchmarks
 *
 * ADR-036 Layer 10: Benchmark Tests
 * Vitest bench mode for critical frontend operations.
 *
 * Run: npx vitest bench
 * Or:  npm run test:bench
 */

import { bench, describe, expect } from "vitest";
import { useCanvasStore } from "../store/canvasStore";
import { useUiStore } from "../store/uiStore";
import { useCostStore } from "../store/costStore";
import { cn } from "../lib/utils";

// ─── Canvas Store Benchmarks ───────────────────────────────────

const makeComponentData = (label: string) => ({
  provider: "aws" as const,
  resourceType: "aws_vpc",
  displayName: label,
  category: "network" as const,
});

describe("CanvasStore Performance", () => {
  bench(
    "addNode (single)",
    () => {
      useCanvasStore.setState({ nodes: [], undoStack: [] });
      const store = useCanvasStore.getState();
      store.addNode(makeComponentData("Test Node"), {
        x: Math.random() * 1000,
        y: Math.random() * 1000,
      });
    },
    { iterations: 1000 },
  );

  bench(
    "addNode (batch 100)",
    () => {
      useCanvasStore.setState({ nodes: [], undoStack: [] });
      const store = useCanvasStore.getState();
      for (let i = 0; i < 100; i++) {
        store.addNode(makeComponentData(`Node ${i}`), { x: i * 250, y: 0 });
      }
    },
    { iterations: 10 },
  );

  bench(
    "removeNode",
    () => {
      useCanvasStore.setState({ nodes: [], edges: [], undoStack: [] });
      const store = useCanvasStore.getState();
      store.addNode(makeComponentData("Temp"), { x: 0, y: 0 });
      const nodeId = store.nodes[store.nodes.length - 1].id;
      store.removeNode(nodeId);
    },
    { iterations: 1000 },
  );

  bench(
    "addEdgeWithType",
    () => {
      useCanvasStore.setState({ nodes: [], edges: [], undoStack: [] });
      const store = useCanvasStore.getState();
      store.addNode(makeComponentData("Source"), { x: 0, y: 0 });
      store.addNode(makeComponentData("Target"), { x: 250, y: 0 });
      const [n1, n2] = store.nodes;
      store.addEdgeWithType(n1.id, n2.id, "default");
    },
    { iterations: 500 },
  );

  bench(
    "undo single action",
    () => {
      useCanvasStore.setState({ nodes: [], edges: [], undoStack: [] });
      const store = useCanvasStore.getState();
      store.addNode(makeComponentData("Undo test"), { x: 0, y: 0 });
      store.undo();
    },
    { iterations: 500 },
  );

  bench(
    "undo 10 actions",
    () => {
      useCanvasStore.setState({ nodes: [], edges: [], undoStack: [] });
      const store = useCanvasStore.getState();
      for (let i = 0; i < 10; i++) {
        store.addNode(makeComponentData(`Bulk ${i}`), { x: i * 250, y: 0 });
      }
      for (let i = 0; i < 10; i++) {
        store.undo();
      }
    },
    { iterations: 100 },
  );

  bench(
    "node lookup in 100-node graph",
    () => {
      useCanvasStore.setState({ nodes: [], edges: [], undoStack: [] });
      const store = useCanvasStore.getState();
      for (let i = 0; i < 100; i++) {
        store.addNode(makeComponentData(`Lookup ${i}`), { x: i * 250, y: 0 });
      }
      const target = store.nodes[50].id;
      store.nodes.find((n) => n.id === target);
    },
    { iterations: 100 },
  );

  bench(
    "clearCanvas (100 nodes)",
    () => {
      useCanvasStore.setState({ nodes: [], edges: [], undoStack: [] });
      const store = useCanvasStore.getState();
      for (let i = 0; i < 100; i++) {
        store.addNode(makeComponentData(`Clear ${i}`), { x: i * 250, y: 0 });
      }
      store.clearCanvas();
    },
    { iterations: 50 },
  );
});

// ─── UI Store Benchmarks ──────────────────────────────────────

describe("UiStore Performance", () => {
  bench(
    "setActiveModule",
    () => {
      const store = useUiStore.getState();
      store.setActiveModule("canvas");
      store.setActiveModule("provisioning");
      store.setActiveModule("observability");
    },
    { iterations: 1000 },
  );

  bench(
    "toggleSidebar",
    () => {
      const store = useUiStore.getState();
      store.toggleSidebar();
    },
    { iterations: 1000 },
  );

  bench(
    "setActiveTab",
    () => {
      const store = useUiStore.getState();
      store.setActiveTab("properties");
      store.setActiveTab("palette");
      store.setActiveTab("validation");
    },
    { iterations: 1000 },
  );

  bench(
    "isEnabled (flag check)",
    () => {
      const store = useUiStore.getState();
      for (let i = 0; i < 100; i++) {
        store.isEnabled("module.cost");
      }
    },
    { iterations: 1000 },
  );
});

// ─── Cost Store Benchmarks ────────────────────────────────────

describe("CostStore Performance", () => {
  bench(
    "fetchCostData (mock)",
    () => {
      const store = useCostStore.getState();
      store.fetchCostData();
    },
    { iterations: 100 },
  );

  bench(
    "anomaly detection (compute)",
    () => {
      // Simulate the anomaly detection calculation
      const values = Array.from({ length: 30 }, () => Math.random() * 100);
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const stdDev = Math.sqrt(
        values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length,
      );
      const threshold = mean + 2 * stdDev;
      const _anomalies = values.filter((v) => v > threshold);
    },
    { iterations: 1000 },
  );
});

// ─── Utility Benchmarks ───────────────────────────────────────

describe("Utility Performance", () => {
  bench(
    "cn() (class merging)",
    () => {
      cn("text-sm", "font-bold", "p-2", undefined, null, "bg-white");
      cn("flex", "items-center", "gap-2", false && "hidden");
      cn("rounded-md", "border", "border-gray-200", "hover:bg-gray-50");
    },
    { iterations: 10000 },
  );

  bench(
    "cn() (complex)",
    () => {
      cn(
        "inline-flex items-center justify-center",
        "rounded-md text-sm font-medium",
        "transition-colors",
        "focus-visible:outline-none focus-visible:ring-2",
        "disabled:pointer-events-none disabled:opacity-50",
        "bg-primary text-primary-foreground",
        "hover:bg-primary/90",
      );
    },
    { iterations: 10000 },
  );
});

// ─── Component Render Benchmarks ──────────────────────────────
// These require @testing-library/react and measure render time

describe("Component Render Performance", () => {
  // Placeholder for React render benchmarks
  // Requires @testing-library/react + renderHook
  // Uncomment when testing-library is available
  // bench("CloudNode render (AWS type)", async () => {
  //   const { render } = await import("@testing-library/react");
  //   render(<CloudNode data={{ label: "EC2", resourceType: "ec2" }} />);
  // }, { iterations: 100 });
  // bench("CloudNode render (K8s type)", async () => {
  //   const { render } = await import("@testing-library/react");
  //   render(<CloudNode data={{ label: "Pod", resourceType: "pod" }} />);
  // }, { iterations: 100 });
});
