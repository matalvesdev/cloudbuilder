import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

// Polyfill scrollIntoView for jsdom (used by AIOpsModule's useEffect scroll-to-bottom)
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

// --- Mocks for stores ---

const mockCanvasStore = {
  nodes: [],
  edges: [],
  canvasName: "Meu Canvas",
  loadCanvas: vi.fn(),
  updateNodeProperties: vi.fn(),
  updateNodeLabel: vi.fn(),
  setHighlightedIncidentNodes: vi.fn(),
  clearHighlightedIncidentNodes: vi.fn(),
};

const mockIncidentStore = {
  fixHistory: [],
  autoFixEnabled: false,
  toggleAutoFix: vi.fn(),
  addFixHistory: vi.fn(() => ({ id: "fix-1", appliedAt: new Date().toISOString() })),
  markDeployed: vi.fn(),
  markResult: vi.fn(),
};

const mockUiStore = {
  setActiveModule: vi.fn(),
};

// --- Mocks for API ---

const mockAiopsApi = {
  listIncidentsByEnvironment: vi.fn(),
  analyzeIncident: vi.fn(),
  resolveIncident: vi.fn(),
  chatQuery: vi.fn(),
  analyzeMetric: vi.fn(),
  getTemplates: vi.fn().mockResolvedValue([]),
};

const mockGetDesignSuggestions = vi.fn(() => [
  "Criar design: VPC com ECS e RDS",
  "Criar design: Cluster Kubernetes",
  "Criar design: API Serverless",
]);

// --- Module-level mocks (hoisted by vitest) ---

vi.mock("@/store/canvasStore", () => ({
  useCanvasStore: vi.fn((selector) =>
    typeof selector === "function" ? selector(mockCanvasStore) : mockCanvasStore,
  ),
}));

vi.mock("@/store/incidentStore", () => ({
  useIncidentStore: vi.fn((selector) =>
    typeof selector === "function" ? selector(mockIncidentStore) : mockIncidentStore,
  ),
}));

vi.mock("@/store/uiStore", () => ({
  useUiStore: vi.fn((selector) =>
    typeof selector === "function" ? selector(mockUiStore) : mockUiStore,
  ),
}));

vi.mock("@/api/aiops", () => ({
  aiopsApi: mockAiopsApi,
}));

vi.mock("@/api/client", () => ({
  api: { post: vi.fn() },
}));

// Mock child components
vi.mock("../AutoRemediationPanel", () => ({
  AutoRemediationPanel: () => React.createElement("div", { "data-testid": "auto-remediation-panel" }, "Auto-Remoção"),
}));

vi.mock("../RunbooksPanel", () => ({
  RunbooksPanel: () => React.createElement("div", { "data-testid": "runbooks-panel" }, "Runbooks"),
}));

vi.mock("../PostMortemPanel", () => ({
  PostMortemPanel: () => React.createElement("div", { "data-testid": "postmortem-panel" }, "Pós-Mortem"),
}));

vi.mock("../IncidentFixDialog", () => ({
  IncidentFixDialog: () => React.createElement("div", { "data-testid": "incident-fix-dialog" }),
}));

vi.mock("../DesignPreview", () => ({
  default: () => null,
  DesignPreview: () => null,
}));

vi.mock("../FixWidget", () => ({
  default: () => null,
  FixWidget: () => null,
}));

vi.mock("../FixHistory", () => ({
  FixHistoryList: () => React.createElement("div", { "data-testid": "fix-history-list" }),
}));

// Mock aiops.utils functions used by the module
vi.mock("../aiops.utils", () => ({
  detectDesignIntent: vi.fn(() => null),
  getDesignSuggestions: vi.fn(() => mockGetDesignSuggestions()),
  generateCanvasDesign: vi.fn(() => null),
  PROVIDER_STYLES: {},
  severityColor: vi.fn(() => "bg-red-500"),
  severityLabel: vi.fn(() => "Crítico"),
  statusColor: vi.fn(() => "text-red-600 border-red-200"),
}));

describe("AIOpsModule", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAiopsApi.listIncidentsByEnvironment.mockResolvedValue([]);
    mockCanvasStore.nodes = [];
    mockCanvasStore.edges = [];
  });

  it("renders the module header", async () => {
    const { AIOpsModule } = await import("../AIOpsModule");
    render(React.createElement(AIOpsModule));

    expect(screen.getByText("Operações com IA")).toBeDefined();
    expect(screen.getByText("Automação inteligente e gestão de incidentes")).toBeDefined();
  });

  it("shows 'Nenhum incidente ativo' when no incidents", async () => {
    const { AIOpsModule } = await import("../AIOpsModule");
    render(React.createElement(AIOpsModule));

    expect(await screen.findByText("Nenhum incidente ativo")).toBeDefined();
  });

  it("fetches incidents on mount", async () => {
    const { AIOpsModule } = await import("../AIOpsModule");
    render(React.createElement(AIOpsModule));

    expect(mockAiopsApi.listIncidentsByEnvironment).toHaveBeenCalledWith("default");
  });

  it("displays incidents when data arrives", async () => {
    mockAiopsApi.listIncidentsByEnvironment.mockResolvedValue([
      {
        id: "inc-1",
        title: "CPU alta no servidor web",
        description: "CPU acima de 90% por 10 minutos",
        severity: "HIGH",
        status: "OPEN",
        affectedNodeIds: ["node-1"],
        startedAt: "2026-07-19T10:00:00Z",
      },
    ]);

    const { AIOpsModule } = await import("../AIOpsModule");
    render(React.createElement(AIOpsModule));

    expect(await screen.findByText("CPU alta no servidor web")).toBeDefined();
    expect(screen.getByText("Aberto")).toBeDefined();
  });

  it("renders all 4 sub-tabs", async () => {
    const { AIOpsModule } = await import("../AIOpsModule");
    render(React.createElement(AIOpsModule));

    expect(screen.getByText("Chat")).toBeDefined();
    expect(screen.getByText("Auto-Remoção")).toBeDefined();
    expect(screen.getByText("Runbooks")).toBeDefined();
    expect(screen.getByText("Pós-Mortem")).toBeDefined();
  });

  it("switches to Auto-Remoção tab on click", async () => {
    const { AIOpsModule } = await import("../AIOpsModule");
    render(React.createElement(AIOpsModule));

    fireEvent.click(screen.getByText("Auto-Remoção"));
    expect(screen.getByTestId("auto-remediation-panel")).toBeDefined();
  });

  it("switches to Runbooks tab on click", async () => {
    const { AIOpsModule } = await import("../AIOpsModule");
    render(React.createElement(AIOpsModule));

    fireEvent.click(screen.getByText("Runbooks"));
    expect(screen.getByTestId("runbooks-panel")).toBeDefined();
  });

  it("switches to Pós-Mortem tab on click", async () => {
    const { AIOpsModule } = await import("../AIOpsModule");
    render(React.createElement(AIOpsModule));

    fireEvent.click(screen.getByText("Pós-Mortem"));
    expect(screen.getByTestId("postmortem-panel")).toBeDefined();
  });

  it("renders chat input area", async () => {
    const { AIOpsModule } = await import("../AIOpsModule");
    render(React.createElement(AIOpsModule));

    const textarea = screen.getByPlaceholderText(/Pergunte à IA/);
    expect(textarea).toBeDefined();
    expect(screen.getByText("Nova Conversa")).toBeDefined();
  });

  it("shows suggestion buttons in chat", async () => {
    const { AIOpsModule } = await import("../AIOpsModule");
    render(React.createElement(AIOpsModule));

    expect(screen.getByText("Analisar incidentes atuais")).toBeDefined();
    expect(screen.getByText("Sugerir otimizações de custo")).toBeDefined();
  });

  it("shows 'IA Online' status indicator", async () => {
    const { AIOpsModule } = await import("../AIOpsModule");
    render(React.createElement(AIOpsModule));

    expect(screen.getByText("IA Online")).toBeDefined();
  });

  it("shows loading skeleton while fetching incidents", async () => {
    // Never resolve the API call to keep loading state
    mockAiopsApi.listIncidentsByEnvironment.mockReturnValue(new Promise(() => {}));

    const { AIOpsModule } = await import("../AIOpsModule");
    render(React.createElement(AIOpsModule));

    // Should show animated loading items (3 skeleton divs)
    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders Auto-Fix toggle button", async () => {
    const { AIOpsModule } = await import("../AIOpsModule");
    render(React.createElement(AIOpsModule));

    const toggleButton = screen.getByTitle("Auto-Fix desativado");
    expect(toggleButton).toBeDefined();
  });

  it("toggles Auto-Fix on button click", async () => {
    const { AIOpsModule } = await import("../AIOpsModule");
    render(React.createElement(AIOpsModule));

    const toggleButton = screen.getByTitle("Auto-Fix desativado");
    fireEvent.click(toggleButton);
    expect(mockIncidentStore.toggleAutoFix).toHaveBeenCalled();
  });

  it("shows 'Nova Conversa' button and creates new chat on click", async () => {
    const { AIOpsModule } = await import("../AIOpsModule");
    render(React.createElement(AIOpsModule));

    const newChatButton = screen.getByText("Nova Conversa");
    fireEvent.click(newChatButton);

    // After clicking "Nova Conversa", the message list is reset to the welcome message
    expect(screen.getByText(/Como posso ajudar/)).toBeDefined();
  });
});
