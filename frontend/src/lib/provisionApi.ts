import { api } from '@/api/client'

// ─── Types ──────────────────────────────────────────────────────────────

export interface GeneratedCode {
  id: string
  canvasId: string
  provider: string
  engine: string
  files: Record<string, string>
  resourceCount: number
  generatedAt: string
}

export interface ManagedResource {
  id: string
  environmentId: string
  resourceType: string
  provider: string
  name: string
  status: string
  terraformId: string
  lastSyncedAt: string
}

export interface DriftReport {
  id: string
  environmentId: string
  detectedAt: string
  status: string
  driftedResources: DriftedResource[]
  resolvedBy: string | null
  resolvedAt: string | null
}

export interface DriftedResource {
  resourceId: string
  resourceName: string
  driftType: string
  expectedState: string
  actualState: string
}

export interface EphemeralEnvironment {
  id: string
  tenantId: string
  name: string
  sourceEnvironmentId: string
  branchName: string
  repoId: string
  ttlHours: number
  expiresAt: string
  status: string
  resourceSize: string
  createdAt: string
}

export interface RegionDeployment {
  id: string
  environmentId: string
  region: string
  isPrimary: boolean
  priority: number
  status: string
}

export interface FailoverGroup {
  id: string
  environmentId: string
  name: string
  primaryRegion: string
  secondaryRegions: string
  failoverThresholdMinutes: number
  autoFailover: boolean
  status: string
}

// ─── Provision API Service ──────────────────────────────────────────────

class ProvisionApiService {

  // ─── Code Generation ───

  async generateCode(
    canvasId: string,
    engine: 'terraform' | 'opentofu' = 'terraform',
    design?: {
      nodes: Array<{ id: string; label?: string; provider?: string; resourceType?: string; properties?: Record<string, unknown> }>
      edges: Array<{ source: string; target: string; type?: string }>
    }
  ): Promise<GeneratedCode> {
    return api.post<GeneratedCode>(
      `/canvases/${canvasId}/generate?engine=${engine}`,
      design
    )
  }

  // ─── State Management ───

  async listResources(environmentId: string): Promise<ManagedResource[]> {
    return api.get<ManagedResource[]>(`/environments/${environmentId}/resources`)
  }

  async syncResources(environmentId: string, stateJson: string): Promise<ManagedResource[]> {
    return api.post<ManagedResource[]>(`/environments/${environmentId}/sync`, { stateJson })
  }

  // ─── Drift Detection ───

  async getLatestDrift(environmentId: string): Promise<DriftReport | null> {
    try {
      return await api.get<DriftReport>(`/environments/${environmentId}/drift`)
    } catch {
      return null
    }
  }

  async getDriftHistory(environmentId: string): Promise<DriftReport[]> {
    return api.get<DriftReport[]>(`/environments/${environmentId}/drift/history`)
  }

  async resolveDrift(environmentId: string, reportId: string, resolvedBy: string): Promise<DriftReport> {
    return api.post<DriftReport>(
      `/environments/${environmentId}/drift/resolve/${reportId}`,
      { resolvedBy }
    )
  }

  async detectDrift(environmentId: string, stateJson: string): Promise<DriftReport> {
    return api.post<DriftReport>(
      `/environments/${environmentId}/detect-drift`,
      { stateJson }
    )
  }

  // ─── Ephemeral Environments ───

  async createEphemeral(req: {
    name: string
    repoId: string
    branchName: string
    sourceEnvironmentId: string
    ttlHours: number
    resourceSize: string
  }): Promise<EphemeralEnvironment> {
    return api.post<EphemeralEnvironment>('/ephemeral', req)
  }

  async listEphemeral(): Promise<EphemeralEnvironment[]> {
    return api.get<EphemeralEnvironment[]>('/ephemeral')
  }

  async getEphemeral(id: string): Promise<EphemeralEnvironment> {
    return api.get<EphemeralEnvironment>(`/ephemeral/${id}`)
  }

  async destroyEphemeral(id: string): Promise<EphemeralEnvironment> {
    return api.post<EphemeralEnvironment>(`/ephemeral/${id}/destroy`)
  }

  async extendEphemeral(id: string, extraHours: number): Promise<EphemeralEnvironment> {
    return api.post<EphemeralEnvironment>(`/ephemeral/${id}/extend`, { extraHours })
  }

  async deleteEphemeral(id: string): Promise<void> {
    return api.delete<void>(`/ephemeral/${id}`)
  }

  async getEphemeralActiveCount(): Promise<number> {
    return api.get<number>('/ephemeral/active-count')
  }

  // ─── Disaster Recovery ───

  async getRegionDeployments(environmentId: string): Promise<RegionDeployment[]> {
    return api.get<RegionDeployment[]>(`/dr/environments/${environmentId}/regions`)
  }

  async addRegionDeployment(environmentId: string, region: string, primary: boolean, priority: number): Promise<RegionDeployment> {
    return api.post<RegionDeployment>(`/dr/environments/${environmentId}/regions`, { region, primary, priority })
  }

  async getFailoverGroups(environmentId: string): Promise<FailoverGroup[]> {
    return api.get<FailoverGroup[]>(`/dr/environments/${environmentId}/groups`)
  }

  // ─── Import ───

  async importTerraform(content: string): Promise<{ nodes: unknown[]; connections: unknown[]; warnings: string[] }> {
    return api.post('/import/terraform', { content })
  }

  async importState(content: string): Promise<{ resources: unknown[]; connections: unknown[]; warnings: string[]; resourceCount: number }> {
    return api.post('/import/state', { content })
  }

  async importMulti(files: Array<{ fileName: string; content: string }>): Promise<{ nodes: unknown[]; connections: unknown[]; warnings: string[]; resourceCount: number }> {
    return api.post('/import/multi', { files })
  }
}

export const provisionApi = new ProvisionApiService()
