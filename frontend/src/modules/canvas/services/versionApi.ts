import { request } from '@/services/api'

export interface CanvasVersion {
  id: string
  canvasId: string
  version: number
  changeDescription: string
  createdBy: string
  createdAt: string
}

export interface VersionDiff {
  canvasId: string
  versionA: number
  versionB: number
  nodesAdded: DiffEntry[]
  nodesRemoved: DiffEntry[]
  nodesModified: DiffEntry[]
  edgesAdded: DiffEntry[]
  edgesRemoved: DiffEntry[]
}

export interface DiffEntry {
  componentId: string
  componentName: string
  changeType: string
  details: string
}

export async function fetchVersions(canvasId: string): Promise<CanvasVersion[]> {
  return request<CanvasVersion[]>(`/canvases/${canvasId}/versions`)
}

export async function createVersion(canvasId: string, changeDescription: string, createdBy?: string): Promise<CanvasVersion> {
  return request<CanvasVersion>(`/canvases/${canvasId}/versions`, {
    method: 'POST',
    body: JSON.stringify({ changeDescription, createdBy: createdBy ?? 'anonymous' }),
  })
}

export async function rollbackToVersion(canvasId: string, version: number): Promise<void> {
  return request<void>(`/canvases/${canvasId}/versions/rollback/${version}`, {
    method: 'POST',
  })
}

export async function fetchVersionDiff(canvasId: string, from: number, to: number): Promise<VersionDiff> {
  return request<VersionDiff>(`/canvases/${canvasId}/versions/diff?from=${from}&to=${to}`)
}
