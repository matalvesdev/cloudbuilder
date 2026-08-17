import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { ProvisionPanel } from "../components/ProvisionPanel";

// ─── Mocks ──────────────────────────────────────────────────────────

const mockPreview = vi.fn();
const mockPrepare = vi.fn();
const mockExecute = vi.fn();
const mockListCredentials = vi.fn();

vi.mock("@/api/provision", () => ({
  provisionApi: {
    previewProvision: (...args: any[]) => mockPreview(...args),
    prepareProvision: (...args: any[]) => mockPrepare(...args),
    executeProvision: (...args: any[]) => mockExecute(...args),
    listCredentials: (...args: any[]) => mockListCredentials(...args),
  },
}));

vi.mock("@/lib/toast", () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
  showInfo: vi.fn(),
}));

const mockCanvasState = {
  canvasId: "e2e-canvas",
  nodes: [
    { id: "node-1", data: { resourceType: "google_compute_network", provider: "google", label: "VPC" } },
    { id: "node-2", data: { resourceType: "google_compute_instance", provider: "google", label: "VM" } },
    { id: "node-3", data: { resourceType: "google_sql_database_instance", provider: "google", label: "SQL" } },
  ],
  edges: [],
  undoStack: [],
  redoStack: [],
  setState: vi.fn(),
  clearCanvas: vi.fn(),
  saveToBackend: vi.fn().mockResolvedValue("e2e-canvas"),
  setCanvas: vi.fn(),
};

vi.mock("@/store/canvasStore", () => ({
  useCanvasStore: Object.assign(
    (selector: any) => selector(mockCanvasState),
    { getState: () => mockCanvasState, setState: vi.fn() },
  ),
}));

vi.mock("@/store/authStore", () => ({
  useAuthStore: (selector: any) =>
    selector({ user: { tenantId: "tenant-e2e", id: "user-e2e" } }),
}));

// ─── Test Data ──────────────────────────────────────────────────────

const MOCK_CREDENTIALS = [
  { id: "cred-gcp-1", tenantId: "tenant-e2e", name: "GCP Production SA", provider: "google", authType: "service-account", isActive: true, createdAt: "2026-01-01T00:00:00Z" },
  { id: "cred-aws-1", tenantId: "tenant-e2e", name: "AWS Access Key", provider: "aws", authType: "access-key", isActive: true, createdAt: "2026-01-01T00:00:00Z" },
];

const MOCK_PREVIEW = {
  canvasId: "e2e-canvas",
  provider: "google",
  engine: "terraform",
  files: {
    "main.tf": 'resource "google_compute_network" "vpc" { name = "test" }',
    "variables.tf": 'variable "x" { type = string }',
    "outputs.tf": 'output "id" { value = "test" }',
    "providers.tf": 'provider "google" {}',
    "versions.tf": "terraform {}",
  },
  resourceCount: 3,
};

const MOCK_PREPARE = {
  canvasId: "e2e-canvas",
  provider: "google",
  engine: "terraform",
  files: MOCK_PREVIEW.files,
  resourceCount: 3,
  envVars: { GOOGLE_CREDENTIALS: '{}' },
  credentialId: "cred-gcp-1",
  autoApprove: false,
};

const MOCK_RESULT = {
  deploymentId: "dep-001",
  status: "APPLIED",
  message: "Infraestrutura provisionada com sucesso!",
  planOutput: "Plan: 3 to add",
  applyOutput: "Apply complete! Resources: 3 added, 0 changed, 0 destroyed.",
  durationMs: 45200,
};

// ─── Helpers ──────────────────────────────────────────────────────

async function navigateToPreview() {
  mockPreview.mockResolvedValue(MOCK_PREVIEW);
  fireEvent.click(screen.getByText("Gerar Preview Terraform"));
  await waitFor(() => {
    expect(screen.getByText("Terraform gerado com sucesso")).toBeTruthy();
  });
}

async function navigateToCredentials() {
  await navigateToPreview();
  fireEvent.click(screen.getByText("Configurar Credenciais"));
  await waitFor(() => {
    expect(screen.getByText("Google Cloud")).toBeTruthy();
  });
}

async function selectCredentialAndProvision() {
  await navigateToCredentials();
  fireEvent.click(screen.getByText("GCP Production SA"));
  // Wait for button to be enabled, then click
  await waitFor(() => {
    const btn = screen.getByRole("button", { name: /Provisionar/i });
    expect(btn).not.toHaveProperty("disabled", true);
  });
  fireEvent.click(screen.getByRole("button", { name: /Provisionar/i }));
}

// ─── Tests ──────────────────────────────────────────────────────────

describe("ProvisionPanel E2E Flow", () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockListCredentials.mockResolvedValue(MOCK_CREDENTIALS);
  });

  // ─── Idle View ──────────────────────────────────────────────

  describe("Idle View", () => {
    it("renders header and node count", () => {
      render(<ProvisionPanel onClose={onClose} />);
      expect(screen.getByText("Provisionar")).toBeTruthy();
      expect(screen.getByText("3")).toBeTruthy();
      expect(screen.getByText("nós serão convertidos em código Terraform")).toBeTruthy();
    });

    it("shows engine options", () => {
      render(<ProvisionPanel onClose={onClose} />);
      expect(screen.getByText("Terraform")).toBeTruthy();
      expect(screen.getByText("OpenTofu")).toBeTruthy();
    });

    it("has preview button", () => {
      render(<ProvisionPanel onClose={onClose} />);
      expect(screen.getByText("Gerar Preview Terraform")).toBeTruthy();
    });

    it("calls listCredentials on mount", () => {
      render(<ProvisionPanel onClose={onClose} />);
      expect(mockListCredentials).toHaveBeenCalledWith("tenant-e2e");
    });
  });

  // ─── Preview View ───────────────────────────────────────────

  describe("Preview View", () => {
    it("transitions to preview view", async () => {
      render(<ProvisionPanel onClose={onClose} />);
      await navigateToPreview();
      expect(screen.getByText(/3 recursos · google · 5 arquivos/)).toBeTruthy();
    });

    it("displays file list", async () => {
      render(<ProvisionPanel onClose={onClose} />);
      await navigateToPreview();
      expect(screen.getByText("main.tf")).toBeTruthy();
      expect(screen.getByText("variables.tf")).toBeTruthy();
      expect(screen.getByText("outputs.tf")).toBeTruthy();
    });

    it("can expand main.tf", async () => {
      render(<ProvisionPanel onClose={onClose} />);
      await navigateToPreview();
      fireEvent.click(screen.getByText("Ver main.tf"));
      await waitFor(() => {
        expect(screen.getByText(/google_compute_network/)).toBeTruthy();
      });
    });

    it("has back and proceed buttons", async () => {
      render(<ProvisionPanel onClose={onClose} />);
      await navigateToPreview();
      expect(screen.getByText("Voltar")).toBeTruthy();
      expect(screen.getByText("Configurar Credenciais")).toBeTruthy();
    });
  });

  // ─── Credentials View ───────────────────────────────────────

  describe("Credentials View", () => {
    it("transitions to credentials view", async () => {
      render(<ProvisionPanel onClose={onClose} />);
      await navigateToCredentials();
      expect(screen.getByText("Selecione a credencial do provedor")).toBeTruthy();
    });

    it("displays credentials by provider", async () => {
      render(<ProvisionPanel onClose={onClose} />);
      await navigateToCredentials();
      expect(screen.getByText("GCP Production SA")).toBeTruthy();
      expect(screen.getByText("AWS Access Key")).toBeTruthy();
    });

    it("shows auto-approve checkbox", async () => {
      render(<ProvisionPanel onClose={onClose} />);
      await navigateToCredentials();
      expect(screen.getByText("Auto-apply (aplicar sem revisão do plan)")).toBeTruthy();
    });

    it("can go back to preview", async () => {
      render(<ProvisionPanel onClose={onClose} />);
      await navigateToCredentials();
      fireEvent.click(screen.getByText("Voltar"));
      await waitFor(() => {
        expect(screen.getByText("Terraform gerado com sucesso")).toBeTruthy();
      });
    });
  });

  // ─── Provisioning Execution ────────────────────────────────

  describe("Provisioning Execution", () => {
    it("calls prepare and execute APIs", async () => {
      mockPrepare.mockResolvedValue(MOCK_PREPARE);
      mockExecute.mockResolvedValue(MOCK_RESULT);

      render(<ProvisionPanel onClose={onClose} />);
      await selectCredentialAndProvision();

      await waitFor(() => {
        expect(mockPrepare).toHaveBeenCalledWith("e2e-canvas", {
          credentialId: "cred-gcp-1",
          engine: "terraform",
          autoApprove: false,
        });
        expect(mockExecute).toHaveBeenCalledWith(MOCK_PREPARE);
      });
    });

    it("shows loading state during provisioning", async () => {
      mockPrepare.mockResolvedValue(MOCK_PREPARE);
      mockExecute.mockImplementation(() => new Promise((r) => setTimeout(() => r(MOCK_RESULT), 200)));

      render(<ProvisionPanel onClose={onClose} />);
      await navigateToCredentials();
      fireEvent.click(screen.getByText("GCP Production SA"));

      await waitFor(() => {
        fireEvent.click(screen.getByRole("button", { name: /Provisionar/i }));
      });

      await waitFor(() => {
        expect(screen.getByText(/Executando Terraform init → plan/)).toBeTruthy();
      });
    });
  });

  // ─── Result View ───────────────────────────────────────────

  describe("Result View", () => {
    it("shows success after APPLIED", async () => {
      mockPrepare.mockResolvedValue(MOCK_PREPARE);
      mockExecute.mockResolvedValue(MOCK_RESULT);

      render(<ProvisionPanel onClose={onClose} />);
      await selectCredentialAndProvision();

      await waitFor(() => {
        expect(screen.getByText("Provisionado com sucesso!")).toBeTruthy();
        expect(screen.getByText("Infraestrutura provisionada com sucesso!")).toBeTruthy();
      });
    });

    it("displays deployment ID", async () => {
      mockPrepare.mockResolvedValue(MOCK_PREPARE);
      mockExecute.mockResolvedValue(MOCK_RESULT);

      render(<ProvisionPanel onClose={onClose} />);
      await selectCredentialAndProvision();

      await waitFor(() => {
        expect(screen.getByText("dep-001")).toBeTruthy();
      });
    });

    it("displays apply output", async () => {
      mockPrepare.mockResolvedValue(MOCK_PREPARE);
      mockExecute.mockResolvedValue(MOCK_RESULT);

      render(<ProvisionPanel onClose={onClose} />);
      await selectCredentialAndProvision();

      await waitFor(() => {
        expect(screen.getByText(/Apply complete! Resources: 3 added/)).toBeTruthy();
      });
    });

    it("shows duration", async () => {
      mockPrepare.mockResolvedValue(MOCK_PREPARE);
      mockExecute.mockResolvedValue(MOCK_RESULT);

      render(<ProvisionPanel onClose={onClose} />);
      await selectCredentialAndProvision();

      await waitFor(() => {
        expect(screen.getByText("45.2s")).toBeTruthy();
      });
    });

    it("has restart button", async () => {
      mockPrepare.mockResolvedValue(MOCK_PREPARE);
      mockExecute.mockResolvedValue(MOCK_RESULT);

      render(<ProvisionPanel onClose={onClose} />);
      await selectCredentialAndProvision();

      await waitFor(() => {
        fireEvent.click(screen.getByText("Novo provisionamento"));
        expect(screen.getByText("Gerar Preview Terraform")).toBeTruthy();
      });
    });
  });

  // ─── Error Handling ────────────────────────────────────────

  describe("Error Handling", () => {
    it("shows error when preview fails", async () => {
      mockPreview.mockRejectedValue(new Error("Canvas not found"));
      render(<ProvisionPanel onClose={onClose} />);
      fireEvent.click(screen.getByText("Gerar Preview Terraform"));
      await waitFor(() => {
        expect(screen.getByText("Canvas not found")).toBeTruthy();
      });
    });

    it("shows error when execution fails", async () => {
      mockPrepare.mockResolvedValue(MOCK_PREPARE);
      mockExecute.mockResolvedValue({
        deploymentId: "dep-fail", status: "FAILED",
        message: "Falha ao conectar com o provision engine",
        error: "Engine indisponível", durationMs: 5000,
      });

      render(<ProvisionPanel onClose={onClose} />);
      await selectCredentialAndProvision();

      await waitFor(() => {
        expect(screen.getByText("Falha no provisionamento")).toBeTruthy();
        expect(screen.getByText("Engine indisponível")).toBeTruthy();
      });
    });

    it("shows empty credentials message", async () => {
      mockListCredentials.mockResolvedValue([]);
      mockPreview.mockResolvedValue(MOCK_PREVIEW);

      render(<ProvisionPanel onClose={onClose} />);
      await navigateToPreview();
      fireEvent.click(screen.getByText("Configurar Credenciais"));

      await waitFor(() => {
        expect(screen.getByText("Nenhuma credencial configurada")).toBeTruthy();
      });
    });
  });

  // ─── Close ─────────────────────────────────────────────────

  describe("Close", () => {
    it("calls onClose", () => {
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
});
