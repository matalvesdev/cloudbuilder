import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

const mockCredentialStore = {
  credentials: [],
  environments: [],
  deployments: [],
  loading: false,
  fetchCredentials: vi.fn(),
};

const mockCanvasStore = {
  nodes: [],
  edges: [],
  getState: vi.fn(() => ({ nodes: [], edges: [] })),
};

const mockActivityStore = {
  events: [],
  loading: false,
  fetchEvents: vi.fn(),
  fetchActivityEvents: vi.fn(),
};

const mockUiStore = {
  onboardingCompleted: true,
  flagsLoaded: true,
  featureFlags: {},
  setOnboardingCompleted: vi.fn(),
};

const mockOnboardingStore = {
  completed: true,
  currentStep: 0,
  isOnboarding: false,
};

vi.mock("@/store/credentialStore", () => ({
  useCredentialStore: vi.fn((selector) =>
    typeof selector === "function" ? selector(mockCredentialStore) : mockCredentialStore,
  ),
}));

vi.mock("@/store/canvasStore", () => ({
  useCanvasStore: vi.fn((selector) =>
    typeof selector === "function" ? selector(mockCanvasStore) : mockCanvasStore,
  ),
}));

vi.mock("@/store/activityStore", () => ({
  useActivityStore: vi.fn((selector) =>
    typeof selector === "function" ? selector(mockActivityStore) : mockActivityStore,
  ),
}));

vi.mock("@/store/uiStore", () => ({
  useUiStore: vi.fn((selector) =>
    typeof selector === "function" ? selector(mockUiStore) : mockUiStore,
  ),
}));

vi.mock("@/store/onboardingStore", () => ({
  useOnboardingStore: vi.fn((selector) =>
    typeof selector === "function" ? selector(mockOnboardingStore) : mockOnboardingStore,
  ),
}));

vi.mock("@/api/dashboardApi", () => ({
  dashboardApi: {
    getOverview: vi.fn().mockResolvedValue({
      totalEnvironments: 0,
      healthyEnvironments: 0,
      activeDeployments: 0,
      pendingApprovals: 0,
    }),
    getCostOverview: vi.fn().mockResolvedValue({
      currentSpend: 0,
      projectedSpend: 0,
      budget: 0,
      savings: 0,
    }),
    getResourceCount: vi.fn().mockResolvedValue(0),
    getHealth: vi.fn().mockResolvedValue({ status: "healthy" }),
  },
}));

describe("DashboardModule", () => {
  it("renders the dashboard header", async () => {
    const { DashboardModule } = await import("../DashboardModule");
    render(React.createElement(DashboardModule));

    await waitFor(() => {
      expect(screen.getByText("Dashboard")).toBeDefined();
    });
  });
});
