import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

describe("ProjectsModule", () => {
  it("renders the module header", async () => {
    const { ProjectsModule } = await import("../ProjectsModule");
    render(React.createElement(ProjectsModule));

    expect(screen.getByText("Projects")).toBeDefined();
  });

  it("renders project cards", async () => {
    const { ProjectsModule } = await import("../ProjectsModule");
    render(React.createElement(ProjectsModule));

    expect(screen.getByText("Production Infrastructure")).toBeDefined();
    expect(screen.getByText("Staging Environment")).toBeDefined();
  });
});
