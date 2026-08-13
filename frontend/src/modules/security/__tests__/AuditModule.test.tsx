import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

vi.mock("../AuditTimelineView", () => ({
  default: () => React.createElement("div", { "data-testid": "audit-timeline" }, "Timeline"),
  AuditTimelineView: () => React.createElement("div", { "data-testid": "audit-timeline" }, "Timeline"),
}));

vi.mock("../ComplianceDashboardView", () => ({
  default: () => React.createElement("div", { "data-testid": "compliance" }, "Compliance"),
  ComplianceDashboardView: () => React.createElement("div", { "data-testid": "compliance" }, "Compliance"),
}));

vi.mock("../RegoPolicyView", () => ({
  default: () => React.createElement("div", { "data-testid": "rego" }, "Rego"),
  RegoPolicyView: () => React.createElement("div", { "data-testid": "rego" }, "Rego"),
}));

describe("AuditModule", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the module header", async () => {
    const { AuditModule } = await import("../AuditModule");
    render(React.createElement(AuditModule));

    expect(screen.getByText("Auditoria & Conformidade")).toBeDefined();
  });

  it("renders all three tab triggers", async () => {
    const { AuditModule } = await import("../AuditModule");
    render(React.createElement(AuditModule));

    expect(screen.getAllByText("Timeline").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Conformidade")).toBeDefined();
    expect(screen.getByText("Políticas OPA")).toBeDefined();
  });

  it("shows timeline tab content by default", async () => {
    const { AuditModule } = await import("../AuditModule");
    render(React.createElement(AuditModule));

    expect(screen.getByTestId("audit-timeline")).toBeDefined();
  });
});
