import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

const mockDocsStore = {
  tree: [],
  currentContent: "",
  currentDocPath: null,
  loading: false,
  searchResults: [],
  staleDocs: [],
  links: [],
  fetchTree: vi.fn(),
  fetchContent: vi.fn(),
  search: vi.fn(),
  fetchStale: vi.fn(),
  fetchLinks: vi.fn(),
  saveContent: vi.fn(),
  getState: vi.fn(() => ({
    tree: [],
    activeDoc: null,
    editing: false,
    loading: false,
    docLinks: [],
    fetchTree: vi.fn(),
    fetchDoc: vi.fn(),
    saveDoc: vi.fn(),
    searchDocs: vi.fn(),
    importDoc: vi.fn(),
    scanDirectory: vi.fn(),
    generateDoc: vi.fn(),
    setActiveDoc: vi.fn(),
    setEditing: vi.fn(),
    fetchDocLinks: vi.fn(),
    refreshContent: vi.fn(),
  })),
};

const mockCanvasStore = {
  canvasId: null,
  canvasName: "",
  nodes: [],
};

vi.mock("../docsStore", () => ({
  useDocsStore: Object.assign(
    vi.fn((selector) =>
      typeof selector === "function" ? selector(mockDocsStore) : mockDocsStore,
    ),
    {
      setState: vi.fn(),
      getState: mockDocsStore.getState,
    },
  ),
}));

vi.mock("@/store/canvasStore", () => ({
  useCanvasStore: Object.assign(
    vi.fn((selector) =>
      typeof selector === "function" ? selector(mockCanvasStore) : mockCanvasStore,
    ),
    {
      setState: vi.fn(),
      getState: vi.fn(() => mockCanvasStore),
    },
  ),
}));

vi.mock("@/api/docs", () => ({
  fetchDocTree: vi.fn().mockResolvedValue([]),
  fetchDocContent: vi.fn().mockResolvedValue(""),
  searchDocs: vi.fn().mockResolvedValue([]),
  fetchStaleDocs: vi.fn().mockResolvedValue([]),
  fetchDocLinks: vi.fn().mockResolvedValue([]),
  saveDocContent: vi.fn(),
  generateDocFromCanvas: vi.fn(),
  importDoc: vi.fn(),
  scanDocs: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
  showInfo: vi.fn(),
}));

describe("DocsModule", () => {
  it("renders the module header", async () => {
    const { DocsModule } = await import("../DocsModule");
    render(React.createElement(DocsModule));

    expect(screen.getByText("Documentação")).toBeDefined();
  });
});
