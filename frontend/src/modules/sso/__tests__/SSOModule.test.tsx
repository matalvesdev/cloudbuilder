import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

const mockSsoStore: Record<string, any> = {
  providers: [],
  loading: false,
  error: null,
  samlConfig: { id: "sc1", entityId: "cloudbuilder", acsUrl: "https://example.com/acs", certificate: "", enabled: true },
  fetchProviders: vi.fn(),
  createProvider: vi.fn(),
  updateProvider: vi.fn(),
  deleteProvider: vi.fn(),
  toggleProvider: vi.fn(),
  fetchSamlConfig: vi.fn(),
  updateSamlConfig: vi.fn(),
};

vi.mock("@/store/ssoStore", () => ({
  useSsoStore: vi.fn((selector) =>
    typeof selector === "function" ? selector(mockSsoStore) : mockSsoStore,
  ),
}));

describe("SSOModule", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the module header", async () => {
    const { default: SSOModule } = await import("../SSOModule");
    render(React.createElement(SSOModule));

    expect(screen.getByText("SSO / Provedores de Identidade")).toBeDefined();
  });

  it("shows empty state when no providers configured", async () => {
    const { default: SSOModule } = await import("../SSOModule");
    render(React.createElement(SSOModule));

    expect(screen.getByText(/Nenhum provedor/i)).toBeDefined();
  });

  it("renders provider cards when providers exist", async () => {
    mockSsoStore.providers = [
      {
        id: "p1",
        name: "Google Workspace",
        providerType: "oidc",
        clientId: "client-123",
        enabled: true,
        domains: ["google.com"],
        createdAt: new Date().toISOString(),
      },
    ];

    const { default: SSOModule } = await import("../SSOModule");
    render(React.createElement(SSOModule));

    expect(screen.getByText("Google Workspace")).toBeDefined();
    expect(screen.getByText(/oidc/i)).toBeDefined();
  });
});
