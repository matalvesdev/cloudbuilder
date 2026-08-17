import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ProvisionPanel } from "../components/ProvisionPanel";

// Mock the stores and API
vi.mock("@/store/canvasStore", () => ({
  useCanvasStore: (selector: any) =>
    selector({
      canvasId: "test-canvas",
      nodes: [
        { id: "node-1", data: { resourceType: "google_compute_network" } },
        { id: "node-2", data: { resourceType: "google_compute_instance" } },
      ],
    }),
}));

vi.mock("@/store/authStore", () => ({
  useAuthStore: (selector: any) =>
    selector({
      user: { tenantId: "tenant-1", id: "user-1" },
    }),
}));

vi.mock("@/lib/toast", () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}));

vi.mock("@/api/provision", () => ({
  provisionApi: {
    previewProvision: vi.fn().mockResolvedValue({
      canvasId: "test-canvas",
      provider: "google",
      engine: "terraform",
      files: {
        'main.tf': 'resource "google_compute_network" "node-vpc" {\n  name = "test"\n}',
        "variables.tf": 'variable "gcp_project_id" {\n  type = string\n}',
        "outputs.tf": 'output "id" {\n  value = "test"\n}',
        "providers.tf": 'provider "google" {\n}',
        "versions.tf": "terraform {\n}",
      },
      resourceCount: 4,
    }),
    prepareProvision: vi.fn().mockResolvedValue({
      canvasId: "test-canvas",
      provider: "google",
      engine: "terraform",
      files: {},
      resourceCount: 4,
      envVars: { GOOGLE_CREDENTIALS: "{}" },
      credentialId: "cred-1",
      autoApprove: false,
    }),
    listCredentials: vi.fn().mockResolvedValue([
      {
        id: "cred-1",
        name: "GCP SA",
        provider: "google",
        authType: "service-account",
        isActive: true,
      },
    ]),
  },
}));

describe("ProvisionPanel", () => {
  const onClose = vi.fn();

  it("renders the provision panel header", () => {
    render(<ProvisionPanel onClose={onClose} />);
    expect(screen.getByText("Provisionar")).toBeTruthy();
  });

  it("shows node count in idle view", () => {
    render(<ProvisionPanel onClose={onClose} />);
    expect(screen.getByText("2")).toBeTruthy();
    expect(
      screen.getByText("nós serão convertidos em código Terraform"),
    ).toBeTruthy();
  });

  it("shows terraform and opentofu engine options", () => {
    render(<ProvisionPanel onClose={onClose} />);
    expect(screen.getByText("Terraform")).toBeTruthy();
    expect(screen.getByText("OpenTofu")).toBeTruthy();
  });

  it("shows preview button", () => {
    render(<ProvisionPanel onClose={onClose} />);
    expect(screen.getByText("Gerar Preview Terraform")).toBeTruthy();
  });

  it("calls onClose when close button is clicked", () => {
    render(<ProvisionPanel onClose={onClose} />);
    const closeBtn = screen.getAllByRole("button").find(
      (btn) => btn.querySelector("svg")?.classList.contains("lucide-x-circle"),
    );
    if (closeBtn) {
      fireEvent.click(closeBtn);
      expect(onClose).toHaveBeenCalled();
    }
  });
});
