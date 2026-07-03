import { api } from './client'

export interface RegionDto {
  id: string
  name: string
  provider: string
  location: string
  status: string
}

export interface ReplicationConfig {
  id: string
  sourceRegionId: string
  targetRegionId: string
  type: string
  status: string
}

export function listRegions(): Promise<RegionDto[]> {
  return api.get('/regions')
}

export function getRegion(id: string): Promise<RegionDto> {
  return api.get(`/regions/${id}`)
}

export function createRegion(region: Omit<RegionDto, 'id'>): Promise<RegionDto> {
  return api.post('/regions', region)
}

export function listDrPlans(): Promise<any[]> {
  return api.get('/dr-plans')
}

export function createDrPlan(plan: any): Promise<any> {
  return api.post('/dr-plans', plan)
}

export function getRegionHealth(id: string): Promise<any> {
  return api.get(`/regions/${id}/health`)
}

export function listReplicationConfigs(): Promise<ReplicationConfig[]> {
  return api.get('/regions/replication')
}

export const multiregionApi = {
  listRegions,
  getRegion,
  createRegion,
  listDrPlans,
  createDrPlan,
  getRegionHealth,
  listReplicationConfigs,
}
