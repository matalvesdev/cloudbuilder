import { api } from './client'
import type {
  GeneratedCodeResponse,
  ManagedResourceDTO,
  DriftReportDTO,
} from './types'

const BASE = '/environments'

// Code generation — backend expects POST + ?engine= query param, no double /api/v1 prefix
export function generateCode(canvasId: string, provider: 'terraform' | 'opentofu' = 'terraform'): Promise<GeneratedCodeResponse> {
  return api.post(`/canvases/${canvasId}/generate?engine=${provider}`)
}

// Resources
export function listResources(environmentId: string): Promise<ManagedResourceDTO[]> {
  return api.get(`${BASE}/${environmentId}/resources`)
}

// Sync — backend expects StateSyncRequest body
export function syncEnvironment(environmentId: string, stateJson?: string): Promise<{ status: string; timestamp: string }> {
  return api.post(`${BASE}/${environmentId}/sync`, { stateJson })
}

// Drift
export function getDriftReport(environmentId: string): Promise<DriftReportDTO> {
  return api.get(`${BASE}/${environmentId}/drift`)
}

export function resolveDrift(environmentId: string, reportId: string, resolvedBy?: string): Promise<{ status: string; resolvedCount: number }> {
  return api.post(`${BASE}/${environmentId}/drift/resolve/${reportId}`, { resolvedBy })
}
