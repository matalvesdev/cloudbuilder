import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

const mockPlatformStore = {
  catalogItems: [],
  marketplaceListings: [],
  partners: [],
  loading: false,
  activeTab: "catalogo",
  fetchCatalog: vi.fn(),
  fetchMarketplace: vi.fn(),
  fetchPartners: vi.fn(),
  versionHistory: [],
  versionHistoryLoading: false,
  loadVersionHistory: vi.fn(),
  publishItem: vi.fn(),
  unpublishItem: vi.fn(),
};

const mockCanvasStore = {
  nodes: [],
  loadCanvas: vi.fn(),
  setSelectedNode: vi.fn(),
  addNodesFromTemplate: vi.fn(),
};

const mockPolicyStore = {
  policies: [],
  violations: [],
  isChecking: false,
  lastCheckAt: null,
  checkPolicies: vi.fn(),
  applyFix: vi.fn(),
  ignoreViolation: vi.fn(),
  resolveAll: vi.fn(),
};

const mockUiStore = {};

vi.mock("@/api/platform", () => ({
  platformApi: {
    listCatalog: vi.fn().mockResolvedValue([]),
    fetchMarketplaceListings: vi.fn().mockResolvedValue([]),
    fetchPartners: vi.fn().mockResolvedValue([]),
    activatePartner: vi.fn().mockResolvedValue({}),
    updatePartnerConfig: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("@/store/platformStore", () => ({
  usePlatformStore: vi.fn((selector) =>
    typeof selector === "function" ? selector(mockPlatformStore) : mockPlatformStore,
  ),
}));

vi.mock("@/store/canvasStore", () => ({
  useCanvasStore: vi.fn((selector) =>
    typeof selector === "function" ? selector(mockCanvasStore) : mockCanvasStore,
  ),
}));

vi.mock("@/store/policyStore", () => ({
  usePolicyStore: vi.fn((selector) =>
    typeof selector === "function" ? selector(mockPolicyStore) : mockPolicyStore,
  ),
}));

vi.mock("@/store/uiStore", () => ({
  useUiStore: vi.fn((selector) =>
    typeof selector === "function" ? selector(mockUiStore) : mockUiStore,
  ),
}));

describe("PlatformModule", () => {
  it("renders the catalog header by default", async () => {
    const { PlatformModule } = await import("../PlatformModule");
    render(React.createElement(PlatformModule));

    expect(screen.getByText("Catálogo da Plataforma")).toBeDefined();
  });
});
