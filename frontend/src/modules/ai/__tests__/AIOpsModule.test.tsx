import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

vi.mock("@/api/aiops", () => ({
  aiopsApi: {
    getIncidents: vi.fn().mockResolvedValue([]),
    getRunbooks: vi.fn().mockResolvedValue([]),
    getPostMortems: vi.fn().mockResolvedValue([]),
    getTemplates: vi.fn().mockResolvedValue([]),
  },
}));

describe("AIOpsModule", () => {
  it("renders the module", async () => {
    const { AIOpsModule } = await import("../AIOpsModule");
    const { container } = render(React.createElement(AIOpsModule));

    expect(container.firstChild).toBeDefined();
  });
});
