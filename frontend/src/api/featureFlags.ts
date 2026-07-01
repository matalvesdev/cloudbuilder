import { api } from './client'

export interface FeatureFlagDTO {
  id: string
  flagKey: string
  enabled: boolean
  tenantId: string | null
  configJson: string | null
  description: string | null
  createdAt: string
  updatedAt: string
  resolved: boolean
}

export interface CreateFlagRequest {
  flagKey: string
  enabled: boolean
  tenantId?: string
  configJson?: string
  description?: string
}

export interface UpdateFlagRequest {
  enabled?: boolean
  configJson?: string
  description?: string
}

const BASE = '/flags'

export const featureFlagsApi = {
  /** Fetch all feature flags for the current tenant */
  getFlags: () =>
    api.get<FeatureFlagDTO[]>(BASE),

  /** Check if a specific flag is enabled */
  checkFlag: (flagKey: string) =>
    api.get<{ flagKey: string; enabled: boolean }>(`${BASE}/${flagKey}`),

  /** Create a new feature flag (admin) */
  createFlag: (request: CreateFlagRequest) =>
    api.post<FeatureFlagDTO>(BASE, request),

  /** Update an existing feature flag (admin) */
  updateFlag: (id: string, request: UpdateFlagRequest) =>
    api.put<FeatureFlagDTO>(`${BASE}/${id}`, request),

  /** Delete a feature flag (admin) */
  deleteFlag: (id: string) =>
    api.delete(`${BASE}/${id}`),

  /** Refresh the flag cache (admin) */
  refreshCache: () =>
    api.post<{ status: string }>(`${BASE}/refresh`),
}
