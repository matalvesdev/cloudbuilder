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

/**
 * Response from backend after provisioning (backend proxies Go engine).
 */
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
 * Execute provisioning: generates Terraform, injects credentials, and runs via Go engine.
 * The backend proxies the call to the Go engine with circuit breaker + retry + bulkhead.
 */
export async function executeProvision(
  canvasId: string,
  request: ProvisionRequest,
): Promise<ProvisionResult> {
  try {
    const result: ProvisionResult = await api.post(
      `/canvases/${canvasId}/provision/apply`,
      request,
    );

    const status = (result.status || "APPLIED").toUpperCase();
    return {
      deploymentId: result.deploymentId || `dep-${Date.now()}`,
      status,
      message: status === "APPLIED"
        ? "Infraestrutura provisionada com sucesso!"
        : status === "PLANNED"
          ? "Terraform plan concluído — aguardando aprovação"
          : status === "FAILED"
            ? (result.error || "Falha no provisionamento")
            : result.message || "Provisionamento concluído",
      planOutput: result.planOutput || "",
      applyOutput: result.applyOutput || "",
      error: result.error,
      durationMs: result.durationMs || 0,
    };
  } catch (err: any) {
    return {
      deploymentId: `dep-${Date.now()}`,
      status: "FAILED",
      message: "Falha ao conectar com o provision engine",
      error: err.message || "Engine indisponível",
      durationMs: 0,
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
  executeProvision,
  validateProvision,
  listCredentials,
  getDriftReport,
  resolveDrift,
};
