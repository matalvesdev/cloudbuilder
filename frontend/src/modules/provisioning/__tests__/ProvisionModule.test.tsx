import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

const mockCanvasStore = {
  nodes: [],
  canvasId: null,
  canvasName: "",
  edges: [],
};

const mockUiStore = {};

const mockCredentialStore = {
  credentials: [],
  environments: [],
  deployments: [],
  fetchCredentials: vi.fn(),
};

const mockPromotionStore = {
  promotions: [],
  fetchPromotions: vi.fn(),
};

const mockApprovalStore = {
  approvals: [],
  approvalRequests: [],
  fetchApprovals: vi.fn(),
  approve: vi.fn(),
  reject: vi.fn(),
  getEnvsRequiringApproval: vi.fn().mockReturnValue([]),
};

const mockAuthStore = {
  user: { id: "u1", tenantId: "t1", role: "admin", roles: ["admin"] },
};

const mockRepoStore = {
  repos: [],
  connectedRepos: [],
  fetchRepos: vi.fn(),
};

const mockDeployStore = {
  deployments: [],
  fetchDeployments: vi.fn(),
};

vi.mock("@/store/canvasStore", () => ({
  useCanvasStore: vi.fn((selector) =>
    typeof selector === "function" ? selector(mockCanvasStore) : mockCanvasStore,
  ),
}));

vi.mock("@/store/uiStore", () => ({
  useUiStore: vi.fn((selector) =>
    typeof selector === "function" ? selector(mockUiStore) : mockUiStore,
  ),
}));

vi.mock("@/store/credentialStore", () => ({
  useCredentialStore: vi.fn((selector) =>
    typeof selector === "function" ? selector(mockCredentialStore) : mockCredentialStore,
  ),
}));

vi.mock("@/store/promotionStore", () => ({
  usePromotionStore: vi.fn((selector) =>
    typeof selector === "function" ? selector(mockPromotionStore) : mockPromotionStore,
  ),
}));

vi.mock("@/store/approvalStore", () => ({
  useApprovalStore: vi.fn((selector) =>
    typeof selector === "function" ? selector(mockApprovalStore) : mockApprovalStore,
  ),
}));

vi.mock("@/store/authStore", () => ({
  useAuthStore: vi.fn((selector) =>
    typeof selector === "function" ? selector(mockAuthStore) : mockAuthStore,
  ),
}));

vi.mock("@/store/repoStore", () => ({
  useRepoStore: vi.fn((selector) =>
    typeof selector === "function" ? selector(mockRepoStore) : mockRepoStore,
  ),
}));

vi.mock("@/store/deployStore", () => ({
  useDeployStore: vi.fn((selector) =>
    typeof selector === "function" ? selector(mockDeployStore) : mockDeployStore,
  ),
}));

vi.mock("@/lib/provisionApi", () => ({
  provisionApi: {
    generateCode: vi.fn(),
    detectDrift: vi.fn(),
    getLatestDrift: vi.fn(),
    resolveDrift: vi.fn(),
    syncResources: vi.fn(),
  },
}));

describe("ProvisionModule", () => {
  it("renders the module header", async () => {
    const { ProvisionModule } = await import("../ProvisionModule");
    render(React.createElement(ProvisionModule));

    expect(screen.getByText("Provisionar")).toBeDefined();
  });
});
