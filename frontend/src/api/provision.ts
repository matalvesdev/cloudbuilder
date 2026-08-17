import { api } from "./client";

export interface ProvisionRequest {
  credentialId: string;
  engine?: "terraform" | "opentofu";
  autoApprove?: boolean;
}

export interface ProvisionResponse {
  canvasId: string;
  provider: string;
  engine: string;
  files: Record<string, string>;
  resourceCount: number;
  envVars: Record<string, string>;
  credentialId: string;
  autoApprove: boolean;
}

export interface ProvisionResult {
  deploymentId: string;
  status: string;
  message: string;
  planOutput?: string;
  applyOutput?: string;
  error?: string;
  durationMs: number;
}

export interface PreviewResponse {
  canvasId: string;
  provider: string;
  engine: string;
  files: Record<string, string>;
  resourceCount: number;
}

/**
 * Generate Terraform code from canvas design (preview only, no provisioning).
 */
export function previewProvision(
  canvasId: string,
  engine: string = "terraform",
): Promise<PreviewResponse> {
  return api.post(
    `/canvases/${canvasId}/provision/preview?engine=${engine}`,
    {},
  );
}

/**
 * Generate Terraform + inject credentials → returns prepared payload.
 */
export function prepareProvision(
  canvasId: string,
  request: ProvisionRequest,
): Promise<ProvisionResponse> {
  return api.post(`/canvases/${canvasId}/provision/apply`, request);
}

/**
 * Send prepared Terraform payload to the Go provision engine for execution.
 * The Go engine runs: terraform init → plan → apply.
 */
export async function executeProvision(
  payload: ProvisionResponse,
): Promise<ProvisionResult> {
  const ENGINE_URL =
    import.meta.env.VITE_PROVISION_ENGINE_URL || "http://localhost:50052";
  const token = localStorage.getItem("cloudbuilder-auth-token");

  const startTime = Date.now();

  try {
    const response = await fetch(`${ENGINE_URL}/api/v1/provision/apply`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        canvas_id: payload.canvasId,
        files: payload.files,
        env_vars: payload.envVars,
        engine: payload.engine,
        auto_approve: payload.autoApprove,
        dry_run: false,
      }),
    });

    const data = await response.json();
    const durationMs = Date.now() - startTime;

    if (!response.ok) {
      return {
        deploymentId: `dep-${Date.now()}`,
        status: "FAILED",
        message: data.message || data.error || "Falha no provisionamento",
        error: data.details || data.message || "Erro desconhecido",
        durationMs,
      };
    }

    return {
      deploymentId: data.deployment_id || `dep-${Date.now()}`,
      status: data.status === "applied" ? "APPLIED" : data.status === "planned" ? "PLANNED" : "APPLIED",
      message: data.status === "applied"
        ? "Infraestrutura provisionada com sucesso!"
        : "Terraform plan concluído — aguardando aprovação",
      planOutput: data.plan_output || "",
      applyOutput: data.apply_output || data.output || "",
      durationMs,
    };
  } catch (err: any) {
    return {
      deploymentId: `dep-${Date.now()}`,
      status: "FAILED",
      message: "Falha ao conectar com o provision engine",
      error: err.message || "Engine indisponível",
      durationMs: Date.now() - startTime,
    };
  }
}

/**
 * Validate Terraform code without executing (init + validate).
 */
export function validateProvision(
  canvasId: string,
  engine: string = "terraform",
): Promise<ProvisionResult> {
  return api.post(`/canvases/${canvasId}/generate?engine=${engine}`, {});
}

/**
 * List cloud provider credentials for the current tenant.
 */
export interface Credential {
  id: string;
  tenantId: string;
  name: string;
  provider: string;
  authType: string;
  isActive: boolean;
  createdAt: string;
}

export function listCredentials(tenantId: string): Promise<Credential[]> {
  return api.get(`/credentials?tenantId=${tenantId}`);
}

/**
 * Get drift report for an environment.
 */
export function getDriftReport(environmentId: string): Promise<any> {
  return api.get(`/environments/${environmentId}/drift`);
}

/**
 * Resolve a drift item.
 */
export function resolveDrift(
  environmentId: string,
  reportId: string,
): Promise<void> {
  return api.post(`/environments/${environmentId}/drift/${reportId}/resolve`);
}

export const provisionApi = {
  previewProvision,
  prepareProvision,
  executeProvision,
  validateProvision,
  listCredentials,
  getDriftReport,
  resolveDrift,
};
