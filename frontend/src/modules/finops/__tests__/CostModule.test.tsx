import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

vi.mock("@/store/costStore", () => ({
  useCostStore: vi.fn(() => ({
    costHistory: [],
    costSummary: { totalMonthly: 1500, byProvider: { aws: 800, gcp: 700 }, byService: { compute: 1000, storage: 500 } },
    optimizations: [],
    loading: false,
    fetchCostData: vi.fn().mockResolvedValue(undefined),
    applyOptimization: vi.fn(),
  })),
}));

vi.mock("@/store/canvasStore", () => ({
  useCanvasStore: { getState: vi.fn(() => ({ nodes: [], setSelectedNode: vi.fn() })) },
}));

vi.mock("@/store/uiStore", () => ({
  useUiStore: { getState: vi.fn(() => ({ setActiveModule: vi.fn() })) },
}));

vi.mock("@/store/costForecastStore", () => ({
  useCostForecastStore: vi.fn(() => ({
    forecasts: [],
    forecastsLoading: false,
    fetchForecasts: vi.fn().mockResolvedValue(undefined),
    addBudget: vi.fn(),
  })),
}));

describe("CostModule", () => {
  it("renders the module header", async () => {
    const { CostModule } = await import("../CostModule");
    render(React.createElement(CostModule));

    expect(screen.getByText("Custos e Otimizações")).toBeDefined();
  });

  it("renders all tab triggers", async () => {
    const { CostModule } = await import("../CostModule");
    render(React.createElement(CostModule));

    expect(screen.getByText("Visão Geral")).toBeDefined();
    expect(screen.getByText("What-if")).toBeDefined();
    expect(screen.getByText("Orçamentos")).toBeDefined();
    expect(screen.getByText("Anomalias")).toBeDefined();
    expect(screen.getByText("Projeção")).toBeDefined();
  });

  it("shows connected status", async () => {
    const { CostModule } = await import("../CostModule");
    render(React.createElement(CostModule));

    expect(screen.getByText("Dados conectados à API")).toBeDefined();
  });
});
