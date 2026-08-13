import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

const mockWorkspaceStore = {
  organizations: [{ id: "org1", name: "Minha Org" }],
  activeOrg: { id: "org1", name: "Minha Org" },
  workspaces: [{ id: "w1", name: "Minha Organização", slug: "my-org" }],
  activeWorkspace: { id: "w1", name: "Minha Organização", slug: "my-org" },
  invitations: [],
  loading: false,
  error: null,
  fetchOrganizations: vi.fn(),
  selectOrganization: vi.fn(),
  createOrganization: vi.fn(),
  updateOrganization: vi.fn(),
  fetchWorkspaces: vi.fn(),
  selectWorkspace: vi.fn(),
  createWorkspace: vi.fn(),
  deleteWorkspace: vi.fn(),
  fetchInvitations: vi.fn(),
  inviteMember: vi.fn(),
  cancelInvitation: vi.fn(),
};

vi.mock("@/store/workspaceStore", () => ({
  useWorkspaceStore: vi.fn((selector) =>
    typeof selector === "function" ? selector(mockWorkspaceStore) : mockWorkspaceStore,
  ),
}));

vi.mock("@/api/teams", () => ({
  teamsApi: {
    listTeams: vi.fn().mockResolvedValue([]),
  },
}));

describe("WorkspaceModule", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the module header", async () => {
    const { default: WorkspaceModule } = await import("../WorkspaceModule");
    render(React.createElement(WorkspaceModule));

    expect(screen.getByText("Organização")).toBeDefined();
  });

  it("shows the workspace name", async () => {
    const { default: WorkspaceModule } = await import("../WorkspaceModule");
    render(React.createElement(WorkspaceModule));

    expect(screen.getByText("Minha Org")).toBeDefined();
  });
});
