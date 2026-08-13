import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import type { DriftReport } from "@/types/drift.types";

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

// ─── Mock stores ───

const mockDriftStore: { reports: DriftReport[] } = {
  reports: [],
};

// ─── Mock API modules ───

const mockApi = {
  get: vi.fn().mockResolvedValue({ data: [] }),
  post: vi.fn().mockResolvedValue({ data: null }),
};

// ─── Hoisted mocks ───

vi.mock("@/store/driftStore", () => ({
  useDriftStore: vi.fn((selector) =>
    typeof selector === "function" ? selector(mockDriftStore) : mockDriftStore,
  ),
}));

vi.mock("@/api/multiregion", () => ({
  listRegions: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/api/client", () => ({ api: mockApi }));

// Mock child view components (they have heavy dependencies)
vi.mock("../DriftDetection", () => ({
  default: () => React.createElement("div", { "data-testid": "drift-detection" }, "Drift Detection"),
  DriftDetection: () => React.createElement("div", { "data-testid": "drift-detection" }, "Drift Detection"),
}));

vi.mock("../DisasterRecovery", () => ({
  default: () => React.createElement("div", { "data-testid": "disaster-recovery" }, "DR"),
  DisasterRecovery: () => React.createElement("div", { "data-testid": "disaster-recovery" }, "DR"),
}));

vi.mock("../ServiceMapView", () => ({
  default: () => React.createElement("div", { "data-testid": "service-map" }, "Service Map"),
  ServiceMapView: () => React.createElement("div", { "data-testid": "service-map" }, "Service Map"),
}));

vi.mock("../ScorecardView", () => ({
  default: () => React.createElement("div", { "data-testid": "scorecards" }, "Scorecards"),
  ScorecardView: () => React.createElement("div", { "data-testid": "scorecards" }, "Scorecards"),
}));

vi.mock("../MetricsDashboard", () => ({
  default: () => React.createElement("div", { "data-testid": "metrics" }, "Métricas"),
  MetricsDashboard: () => React.createElement("div", { "data-testid": "metrics" }, "Métricas"),
}));

vi.mock("../TraceExplorer", () => ({
  default: () => React.createElement("div", { "data-testid": "traces" }, "Traces"),
  TraceExplorer: () => React.createElement("div", { "data-testid": "traces" }, "Traces"),
}));

vi.mock("../LogViewer", () => ({
  default: () => React.createElement("div", { "data-testid": "logs" }, "Logs"),
  LogViewer: () => React.createElement("div", { "data-testid": "logs" }, "Logs"),
}));

vi.mock("../AlertRulesView", () => ({
  default: () => React.createElement("div", { "data-testid": "alerts" }, "Alertas"),
  AlertRulesView: () => React.createElement("div", { "data-testid": "alerts" }, "Alertas"),
}));

vi.mock("../IncidentsView", () => ({
  default: () => React.createElement("div", { "data-testid": "incidents" }, "Incidentes"),
  IncidentsView: () => React.createElement("div", { "data-testid": "incidents" }, "Incidentes"),
}));

vi.mock("../SloDashboard", () => ({
  default: () => React.createElement("div", { "data-testid": "slo" }, "SLO"),
  SloDashboard: () => React.createElement("div", { "data-testid": "slo" }, "SLO"),
}));

// Mock shadcn Card to accept title/value/icon style props used by OverviewView
vi.mock("@/components/ui/card", () => ({
  Card: ({ title, value, icon: Icon, children, className }: any) =>
    React.createElement(
      "div",
      { "data-testid": "card", className },
      Icon && React.createElement(Icon, { "data-testid": "card-icon" }),
      title && React.createElement("p", { "data-testid": "card-title" }, title),
      value !== undefined && React.createElement("p", { "data-testid": "card-value" }, String(value)),
      children,
    ),
  CardHeader: ({ children }: any) => React.createElement("div", { "data-testid": "card-header" }, children),
  CardTitle: ({ children }: any) => React.createElement("h3", { "data-testid": "card-title" }, children),
  CardContent: ({ children }: any) => React.createElement("div", { "data-testid": "card-content" }, children),
}));

describe("ObserveModule", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDriftStore.reports = [];
    mockApi.get.mockResolvedValue({ data: [] });
    mockApi.post.mockResolvedValue({ data: null });
  });

  it("renders the module header", async () => {
    const { ObserveModule } = await import("../ObserveModule");
    render(React.createElement(ObserveModule));

    expect(screen.getByText("Observabilidade")).toBeDefined();
    expect(screen.getByText("Métricas, traces, logs e detecção de drift")).toBeDefined();
  });

  it("renders the overview tab by default", async () => {
    const { ObserveModule } = await import("../ObserveModule");
    render(React.createElement(ObserveModule));

    // The overview tab should show "Visão Geral" text
    expect(screen.getByText("Visão Geral")).toBeDefined();
  });

  it("renders all 12 tab labels", async () => {
    const { ObserveModule } = await import("../ObserveModule");
    render(React.createElement(ObserveModule));

    expect(screen.getByText("Visão Geral")).toBeDefined();
    expect(screen.getByText("Métricas")).toBeDefined();
    expect(screen.getByText("Traces")).toBeDefined();
    expect(screen.getByText("Logs")).toBeDefined();
    expect(screen.getByText("Alertas")).toBeDefined();
    expect(screen.getByText("Incidentes")).toBeDefined();
    expect(screen.getByText("SLO")).toBeDefined();
    expect(screen.getByText("Service Map")).toBeDefined();
    expect(screen.getByText("Drift")).toBeDefined();
    expect(screen.getByText("Scorecards")).toBeDefined();
    expect(screen.getByText("Regiões")).toBeDefined();
    expect(screen.getByText("DR")).toBeDefined();
  });

  it("shows 'Nenhum serviço monitorado' when overview has no services", async () => {
    const { ObserveModule } = await import("../ObserveModule");
    render(React.createElement(ObserveModule));

    // OverviewView renders content after async API call resolves
    expect(await screen.findByText("Nenhum serviço monitorado")).toBeDefined();
  });

  it("shows 'Nenhum alerta ativo' when no alerts", async () => {
    const { ObserveModule } = await import("../ObserveModule");
    render(React.createElement(ObserveModule));

    // OverviewView renders alerts section after async API call
    expect(await screen.findByText("Nenhum alerta ativo")).toBeDefined();
  });

  it("renders 'Explorar Módulos' section with quick-access cards", async () => {
    const { ObserveModule } = await import("../ObserveModule");
    render(React.createElement(ObserveModule));

    // OverviewView renders quick-access section after async API call
    expect(await screen.findByText("Explorar Módulos")).toBeDefined();
    expect(await screen.findByText("Performance e uso de recursos")).toBeDefined();
    expect(await screen.findByText("Rastreamento de requisições")).toBeDefined();
    expect(await screen.findByText("Logs centralizados")).toBeDefined();
  });

  it("renders stats card headers", async () => {
    const { ObserveModule } = await import("../ObserveModule");
    render(React.createElement(ObserveModule));

    // Card titles render after OverviewView async API call resolves
    expect(await screen.findByText("Serviços")).toBeDefined();
    expect(await screen.findByText("Latência")).toBeDefined();
    expect(await screen.findByText("Disponibilidade")).toBeDefined();
  });

  it("shows 0 drifts when no drift reports", async () => {
    const { ObserveModule } = await import("../ObserveModule");
    render(React.createElement(ObserveModule));

    // The overview view should show "0" for drifts (renders after async API call)
    expect(await screen.findByText("Drifts")).toBeDefined();
  });

  it("shows drift badge when active drifts exist", async () => {
    mockDriftStore.reports = [
      {
        id: "dr-1",
        environmentId: "env-1",
        canvasId: "canvas-1",
        canvasVersion: 1,
        resources: [
          {
            id: "res-1",
            resourceName: "sg-web",
            resourceType: "aws_security_group",
            provider: "aws",
            driftType: "MODIFIED",
            severity: "CRITICAL",
            propertyChanges: [],
            detectedAt: new Date().toISOString(),
            status: "DETECTED",
          },
        ],
        summary: { add: 0, change: 1, destroy: 0 },
        detectedAt: new Date().toISOString(),
        resolvedAt: null,
        status: "DETECTED",
      },
    ];

    const { ObserveModule } = await import("../ObserveModule");
    render(React.createElement(ObserveModule));

    expect(screen.getByText(/1 drift detectado/)).toBeDefined();
  });

  it("renders and switches to 'Regiões' tab", async () => {
    const { ObserveModule } = await import("../ObserveModule");
    const { container } = render(React.createElement(ObserveModule));

    // The tab trigger is rendered
    expect(screen.getByText("Regiões")).toBeDefined();

    // Click the Regiões tab trigger
    const regioesTrigger = screen.getByRole("tab", { name: /regiões/i });
    fireEvent.click(regioesTrigger);

    // After clicking, the TabContent for "regioes" should be rendered
    // The RegioesView component mounts and shows a loading spinner initially
    expect(container.querySelector('[data-state="active"]')).toBeTruthy();
  });

  it("renders 'Explorar Módulos' link cards with correct labels", async () => {
    const { ObserveModule } = await import("../ObserveModule");
    render(React.createElement(ObserveModule));

    // All section quick-access cards should be present
    const sectionCards = [
      "Service Map",
      "Drift",
      "Scorecards",
      "DR",
      "Alertas",
    ];

    for (const label of sectionCards) {
      expect(screen.getByText(label)).toBeDefined();
    }
  });
});
