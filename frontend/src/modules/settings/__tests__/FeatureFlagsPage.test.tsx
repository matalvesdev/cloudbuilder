import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

const mockUiStore = {
  featureFlags: {
    "module.cost": {
      id: "f1",
      flagKey: "module.cost",
      enabled: true,
      description: "Módulo Custos",
      tenantId: null,
      valueJson: null,
    },
    "module.platform": {
      id: "f2",
      flagKey: "module.platform",
      enabled: true,
      description: "Módulo Plataforma",
      tenantId: null,
      valueJson: null,
    },
    "module.iam": {
      id: "f3",
      flagKey: "module.iam",
      enabled: false,
      description: "Módulo IAM",
      tenantId: null,
      valueJson: null,
    },
    "feature.what-if-cost": {
      id: "f4",
      flagKey: "feature.what-if-cost",
      enabled: true,
      description: "What-if Custos",
      tenantId: null,
      valueJson: null,
    },
    "config.max-users": {
      id: "f5",
      flagKey: "config.max-users",
      enabled: true,
      valueJson: '"50"',
      tenantId: null,
    },
  },
  flagsLoaded: true,
  flagsLoading: false,
  fetchFlags: vi.fn().mockResolvedValue(undefined),
  refreshFlags: vi.fn(),
  isEnabled: vi.fn((key: string) => {
    const flags: Record<string, string | boolean> = {
      "module.cost": true,
      "module.platform": true,
      "module.iam": false,
      "feature.what-if-cost": true,
      "config.max-users": "50",
    };
    return flags[key] ?? false;
  }),
};

const mockAuthStore = {
  user: { role: "admin" },
};

vi.mock("@/api/featureFlags", () => ({
  featureFlagsApi: {
    listFlags: vi.fn(),
    updateFlag: vi.fn(),
  },
}));

vi.mock("@/lib/toast", () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}));

vi.mock("@/store/uiStore", () => ({
  useUiStore: vi.fn((selector) =>
    typeof selector === "function" ? selector(mockUiStore) : mockUiStore,
  ),
}));

vi.mock("@/store/authStore", () => ({
  useAuthStore: vi.fn((selector) =>
    typeof selector === "function" ? selector(mockAuthStore) : mockAuthStore,
  ),
}));

describe("FeatureFlagsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the page header", async () => {
    const { FeatureFlagsPage } = await import("../FeatureFlagsPage");
    render(React.createElement(FeatureFlagsPage));

    expect(screen.getByText("Feature Flags")).toBeDefined();
  });

  it("renders flag cards with status", async () => {
    const { FeatureFlagsPage } = await import("../FeatureFlagsPage");
    render(React.createElement(FeatureFlagsPage));

    expect(screen.getByText("module.cost")).toBeDefined();
    expect(screen.getByText("module.platform")).toBeDefined();
    expect(screen.getByText("module.iam")).toBeDefined();
  });

  it("shows active/inactive indicators", async () => {
    const { FeatureFlagsPage } = await import("../FeatureFlagsPage");
    render(React.createElement(FeatureFlagsPage));

    // module.cost is enabled, module.iam is disabled
    const enabledToggles = screen.getAllByText("Ativo");
    expect(enabledToggles.length).toBeGreaterThanOrEqual(1);
  });
});
