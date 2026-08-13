import { describe, it, expect, beforeEach } from "vitest";
import * as fc from "fast-check";
import { useCanvasStore } from "./canvasStore";
import type { CanvasNodeData } from "@/types/canvas.types";

beforeEach(() => {
  useCanvasStore.setState({
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
  });
});

const makeComponentData = (
  overrides?: Partial<CanvasNodeData> & { id?: string },
) => ({
  id: overrides?.id ?? "comp-id",
  provider: "aws" as const,
  resourceType: "aws_vpc",
  displayName: "VPC",
  category: "network" as const,
  ...overrides,
});

describe("canvasStore.addNode — property-based", () => {
  it("each addNode creates exactly one node", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 10 }), (count) => {
        useCanvasStore.setState({ nodes: [], undoStack: [] });
        for (let i = 0; i < count; i++) {
          useCanvasStore
            .getState()
            .addNode(makeComponentData(), { x: i * 10, y: i * 10 });
        }
        expect(useCanvasStore.getState().nodes).toHaveLength(count);
      }),
      { numRuns: 200 },
    );
  });

  it("every node has a unique UUID id", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 50 }), (count) => {
        useCanvasStore.setState({ nodes: [] });
        for (let i = 0; i < count; i++) {
          useCanvasStore
            .getState()
            .addNode(makeComponentData(), { x: 0, y: 0 });
        }
        const ids = useCanvasStore.getState().nodes.map((n) => n.id);
        expect(new Set(ids).size).toBe(ids.length);
      }),
      { numRuns: 100 },
    );
  });

  it("position is preserved exactly", () => {
    fc.assert(
      fc.property(
        fc.float({ min: -10000, max: 10000, noNaN: true }),
        fc.float({ min: -10000, max: 10000, noNaN: true }),
        (x, y) => {
          useCanvasStore.setState({ nodes: [] });
          useCanvasStore.getState().addNode(makeComponentData(), { x, y });
          expect(useCanvasStore.getState().nodes[0].position).toEqual({ x, y });
        },
      ),
      { numRuns: 200 },
    );
  });

  it("node type matches provider", () => {
    const providers = ["aws", "azure", "gcp", "k8s"] as const;
    fc.assert(
      fc.property(fc.constantFrom(...providers), (provider) => {
        useCanvasStore.setState({ nodes: [] });
        useCanvasStore
          .getState()
          .addNode(makeComponentData({ provider }), { x: 0, y: 0 });
        expect(useCanvasStore.getState().nodes[0].type).toBe(provider);
      }),
      { numRuns: 100 },
    );
  });
});

describe("canvasStore.removeNode — property-based", () => {
  it("removing a node reduces count by exactly 1", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 20 }), (count) => {
        useCanvasStore.setState({ nodes: [], edges: [] });
        for (let i = 0; i < count; i++) {
          useCanvasStore
            .getState()
            .addNode(makeComponentData({ id: `node-${i}` }), {
              x: i * 50,
              y: 0,
            });
        }
        const firstId = useCanvasStore.getState().nodes[0].id;
        useCanvasStore.getState().removeNode(firstId);
        expect(useCanvasStore.getState().nodes).toHaveLength(count - 1);
      }),
      { numRuns: 100 },
    );
  });

  it("removing a node removes all connected edges", () => {
    fc.assert(
      fc.property(fc.integer({ min: 2, max: 10 }), (count) => {
        useCanvasStore.setState({ nodes: [], edges: [] });
        for (let i = 0; i < count; i++) {
          useCanvasStore
            .getState()
            .addNode(makeComponentData({ id: `n-${i}` }), { x: i * 100, y: 0 });
        }
        // Connect first node to all others
        const nodes = useCanvasStore.getState().nodes;
        for (let i = 1; i < count; i++) {
          useCanvasStore
            .getState()
            .addEdgeWithType(nodes[0].id, nodes[i].id, "default");
        }
        expect(useCanvasStore.getState().edges).toHaveLength(count - 1);

        useCanvasStore.getState().removeNode(nodes[0].id);
        // No edges should reference the removed node
        const remainingEdges = useCanvasStore.getState().edges;
        for (const edge of remainingEdges) {
          expect(edge.source).not.toBe(nodes[0].id);
          expect(edge.target).not.toBe(nodes[0].id);
        }
      }),
      { numRuns: 100 },
    );
  });
});

describe("canvasStore.undo/redo — invariants", () => {
  it("undoStack never exceeds 100", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 200 }), (count) => {
        useCanvasStore.setState({ undoStack: [], redoStack: [] });
        for (let i = 0; i < count; i++) {
          useCanvasStore.getState().pushHistory();
        }
        expect(useCanvasStore.getState().undoStack.length).toBeLessThanOrEqual(
          100,
        );
      }),
      { numRuns: 100 },
    );
  });

  it("undo after push reduces undoStack by 1", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 50 }), (count) => {
        useCanvasStore.setState({ undoStack: [], redoStack: [] });
        for (let i = 0; i < count; i++) {
          useCanvasStore.getState().pushHistory();
        }
        const before = useCanvasStore.getState().undoStack.length;
        useCanvasStore.getState().undo();
        expect(useCanvasStore.getState().undoStack.length).toBe(before - 1);
      }),
      { numRuns: 100 },
    );
  });

  it("undo/redo round-trip preserves undoStack length", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 30 }), (count) => {
        useCanvasStore.setState({ undoStack: [], redoStack: [] });
        for (let i = 0; i < count; i++) {
          useCanvasStore.getState().pushHistory();
        }
        const original = useCanvasStore.getState().undoStack.length;
        useCanvasStore.getState().undo();
        useCanvasStore.getState().redo();
        expect(useCanvasStore.getState().undoStack.length).toBe(original);
      }),
      { numRuns: 100 },
    );
  });
});

describe("canvasStore.addEdgeWithType — property-based", () => {
  it("adding an edge always increases edge count by 1", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 20 }),
        fc.constantFrom("default", "animated", "dashed"),
        (extraEdges, edgeType) => {
          useCanvasStore.setState({ nodes: [], edges: [] });
          useCanvasStore
            .getState()
            .addNode(makeComponentData({ id: "a" }), { x: 0, y: 0 });
          useCanvasStore
            .getState()
            .addNode(makeComponentData({ id: "b" }), { x: 100, y: 0 });
          const nodes = useCanvasStore.getState().nodes;

          // Add some edges
          for (let i = 0; i < extraEdges; i++) {
            useCanvasStore
              .getState()
              .addEdgeWithType(nodes[0].id, nodes[1].id, edgeType);
          }
          const before = useCanvasStore.getState().edges.length;
          useCanvasStore
            .getState()
            .addEdgeWithType(nodes[0].id, nodes[1].id, edgeType);
          expect(useCanvasStore.getState().edges.length).toBe(before + 1);
        },
      ),
      { numRuns: 100 },
    );
  });
});

describe("canvasStore.clearCanvas — invariants", () => {
  it("clearCanvas resets everything to defaults", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 50 }), (count) => {
        for (let i = 0; i < count; i++) {
          useCanvasStore
            .getState()
            .addNode(makeComponentData(), { x: 0, y: 0 });
        }
        useCanvasStore.getState().clearCanvas();
        const state = useCanvasStore.getState();
        expect(state.nodes).toHaveLength(0);
        expect(state.edges).toHaveLength(0);
        expect(state.undoStack).toHaveLength(0);
        expect(state.canvasName).toBe("Design sem título");
        expect(state.canvasVersion).toBe(1);
      }),
      { numRuns: 100 },
    );
  });
});
