import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

vi.mock("@/store/authStore", () => ({
  useAuthStore: vi.fn(() => ({
    user: { tenantId: "tenant-1", id: "user-1" },
  })),
}));

vi.mock("@/api/docs", () => ({
  docsApi: {
    getTree: vi.fn().mockResolvedValue([]),
    search: vi.fn().mockResolvedValue([]),
    fetchStaleDocs: vi.fn().mockResolvedValue([]),
    generateDoc: vi.fn().mockResolvedValue({}),
  },
  fetchStaleDocs: vi.fn().mockResolvedValue([]),
}));

describe("DocsModule", () => {
  it("renders the module", async () => {
    const { DocsModule } = await import("../DocsModule");
    const { container } = render(React.createElement(DocsModule));

    expect(container.firstChild).toBeDefined();
  });
});
