import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
  globalThis.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));
});

const mockCanvasStore = {
  nodes: [],
  edges: [],
  canvasId: null,
  canvasName: "",
  canvasVersion: 1,
  undoStack: [],
  redoStack: [],
  addNode: vi.fn(),
  addEdgeWithType: vi.fn(),
  autoLayout: vi.fn(),
  clearCanvas: vi.fn(),
  loadCanvas: vi.fn(),
  loadFromBackend: vi.fn(),
  saveToBackend: vi.fn(),
  setCanvas: vi.fn(),
  getState: vi.fn(() => ({ nodes: [] })),
};

const mockAuthStore = {
  user: { id: "u1", tenantId: "t1", role: "admin" },
};

const mockUiStore = {
  showVersionPanel: false,
  toggleVersionPanel: vi.fn(),
};

const mockCollaborationStore = {
  teamMembers: [],
};

vi.mock("@/store/canvasStore", () => ({
  useCanvasStore: Object.assign(
    vi.fn((selector) =>
      typeof selector === "function" ? selector(mockCanvasStore) : mockCanvasStore,
    ),
    { getState: vi.fn(() => mockCanvasStore) },
  ),
}));

vi.mock("@/store/authStore", () => ({
  useAuthStore: vi.fn((selector) =>
    typeof selector === "function" ? selector(mockAuthStore) : mockAuthStore,
  ),
}));

vi.mock("@/store/uiStore", () => ({
  useUiStore: vi.fn((selector) =>
    typeof selector === "function" ? selector(mockUiStore) : mockUiStore,
  ),
}));

vi.mock("@/store/collaborationStore", () => ({
  useCollaborationStore: vi.fn((selector) =>
    typeof selector === "function" ? selector(mockCollaborationStore) : mockCollaborationStore,
  ),
}));

describe("DesignModule", () => {
  it("renders empty canvas state", async () => {
    const { DesignModule } = await import("../DesignModule");
    render(React.createElement(DesignModule));

    expect(screen.getAllByText("Canvas vazio").length).toBeGreaterThanOrEqual(1);
  });
});
