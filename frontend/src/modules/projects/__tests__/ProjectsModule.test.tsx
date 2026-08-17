import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

vi.mock("@/api/projects", () => ({
  projectsApi: {
    listProjects: vi.fn().mockResolvedValue([]),
    createProject: vi.fn(),
    deleteProject: vi.fn(),
    getProject: vi.fn(),
    updateProject: vi.fn(),
    listProjectMembers: vi.fn(),
    inviteProjectMember: vi.fn(),
    removeProjectMember: vi.fn(),
    updateMemberRole: vi.fn(),
  },
}));

vi.mock("@/store/authStore", () => ({
  useAuthStore: Object.assign(
    vi.fn(() => ({
      user: { tenantId: "tenant-1", id: "user-1" },
    })),
    { getState: vi.fn(() => ({ user: { tenantId: "tenant-1", id: "user-1" } })) },
  ),
}));

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

describe("ProjectsModule", () => {
  it("renders the module header", async () => {
    const { ProjectsModule } = await import("../ProjectsModule");
    render(React.createElement(ProjectsModule));

    expect(screen.getByText("Projetos")).toBeDefined();
  });

  it("renders the create button", async () => {
    const { ProjectsModule } = await import("../ProjectsModule");
    render(React.createElement(ProjectsModule));

    expect(screen.getByText("Novo Projeto")).toBeDefined();
  });
});
