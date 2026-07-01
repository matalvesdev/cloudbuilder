import { api } from './client'

export interface RegionDto {
  id: string
  code: string
  name: string
  provider: string
  country: string
  isPrimary: boolean
  isActive: boolean
  metadata: string | null
  createdAt: string
  updatedAt: string
}

export interface ReplicationConfig {
  id: string
  tenantId: string
  planId: string
  sourceRegionId: string
  targetRegionId: string
  resourceType: string
  strategy: string
  status: string
  lagMs: number
  lastSyncedAt: string | null
  createdAt: string
}

export interface DisasterRecoveryPlanDto {
  id: string
  name: string
  description: string | null
  primaryRegionId: string
  secondaryRegionId: string
  failoverStrategy: string
  status: string
  lastTestedAt: string | null
  createdAt: string
  updatedAt: string
}

const BASE = '/multiregion'

export async function getRegions(): Promise<RegionDto[]> {
  return api.get<RegionDto[]>(`${BASE}/regions`)
}

export async function getActiveRegions(): Promise<RegionDto[]> {
  return api.get<RegionDto[]>(`${BASE}/regions/active`)
}

export async function getRegion(id: string): Promise<RegionDto> {
  return api.get<RegionDto>(`${BASE}/regions/${id}`)
}

export async function getReplicationConfigsByPlan(planId: string): Promise<ReplicationConfig[]> {
  return api.get<ReplicationConfig[]>(`${BASE}/regions/replication/plan/${planId}`)
}

export async function getReplicationConfigsByTenant(tenantId: string): Promise<ReplicationConfig[]> {
  return api.get<ReplicationConfig[]>(`${BASE}/regions/replication/tenant/${tenantId}`)
}

export async function triggerAutoFailover(planId: string): Promise<DisasterRecoveryPlanDto> {
  return api.post<DisasterRecoveryPlanDto>(`${BASE}/regions/dr/plans/${planId}/auto-failover`)
}

export async function verifyFailover(planId: string): Promise<string> {
  return api.post<string>(`${BASE}/regions/dr/plans/${planId}/verify-failover`)
}
