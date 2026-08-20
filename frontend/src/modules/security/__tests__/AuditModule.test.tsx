import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

vi.mock("@/api/audit", () => ({
  auditApi: {
    getEvents: vi.fn().mockResolvedValue([]),
    getRules: vi.fn().mockResolvedValue([]),
  },
}));

describe("AuditModule", () => {
  it("renders the module header", async () => {
    const { AuditModule } = await import("../AuditModule");
    render(React.createElement(AuditModule));

    expect(screen.getByText("Auditoria & Conformidade")).toBeDefined();
  });

  it("renders tab navigation", async () => {
    const { AuditModule } = await import("../AuditModule");
    render(React.createElement(AuditModule));

    expect(screen.getByText("Timeline")).toBeDefined();
    expect(screen.getByText("Conformidade")).toBeDefined();
    expect(screen.getByText("Políticas OPA")).toBeDefined();
  });
});
