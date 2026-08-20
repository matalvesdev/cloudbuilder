import { describe, it, expect, vi, beforeAll } from "vitest";
import { render } from "@testing-library/react";
import React from "react";

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

vi.mock("@/store/driftStore", () => ({
  useDriftStore: vi.fn((selector?: any) => {
    const state = { reports: [], fetchReports: vi.fn() };
    return selector ? selector(state) : state;
  }),
}));

vi.mock("@/api/client", () => ({
  api: { get: vi.fn().mockRejectedValue(new Error("unavailable")) },
}));

vi.mock("@/api/multiregion", () => ({
  listRegions: vi.fn().mockRejectedValue(new Error("unavailable")),
}));

describe("ObserveModule", () => {
  it("renders the module", async () => {
    const { ObserveModule } = await import("../ObserveModule");
    const { container } = render(React.createElement(ObserveModule));

    expect(container.firstChild).toBeDefined();
  });
});
