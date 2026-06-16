import { api } from './client'
import type {
  CanvasDTO,
  CanvasNodeDTO,
  CanvasEdgeDTO,
  CreateCanvasRequest,
  UpdateCanvasRequest,
  AddNodeRequest,
  AddEdgeRequest,
  PaginatedResponse,
} from './types'

const BASE = '/canvases'

// Canvas CRUD
export function listCanvases(page = 0, size = 20): Promise<PaginatedResponse<CanvasDTO>> {
  return api.get(`${BASE}?page=${page}&size=${size}`)
}

export function getCanvas(id: string): Promise<CanvasDTO> {
  return api.get(`${BASE}/${id}`)
}

export function createCanvas(req: CreateCanvasRequest): Promise<CanvasDTO> {
  return api.post(BASE, req)
}

export function updateCanvas(id: string, req: UpdateCanvasRequest): Promise<CanvasDTO> {
  return api.put(`${BASE}/${id}`, req)
}

export function deleteCanvas(id: string): Promise<void> {
  return api.delete(`${BASE}/${id}`)
}

// Nodes
export function addNode(canvasId: string, req: AddNodeRequest): Promise<CanvasNodeDTO> {
  return api.post(`${BASE}/${canvasId}/nodes`, req)
}

export function updateNode(canvasId: string, nodeId: string, properties: string): Promise<CanvasNodeDTO> {
  return api.put(`${BASE}/${canvasId}/nodes/${nodeId}`, { properties })
}

export function removeNode(canvasId: string, nodeId: string): Promise<void> {
  return api.delete(`${BASE}/${canvasId}/nodes/${nodeId}`)
}

// Edges
export function addEdge(canvasId: string, req: AddEdgeRequest): Promise<CanvasEdgeDTO> {
  return api.post(`${BASE}/${canvasId}/edges`, req)
}

export function removeEdge(canvasId: string, edgeId: string): Promise<void> {
  return api.delete(`${BASE}/${canvasId}/edges/${edgeId}`)
}

// Validation
export function validateCanvas(canvasId: string): Promise<{ status: string; issues: unknown[] }> {
  return api.post(`${BASE}/${canvasId}/validate`)
}

// Versions
export function listVersions(canvasId: string): Promise<unknown[]> {
  return api.get(`${BASE}/${canvasId}/versions`)
}

export function createVersion(canvasId: string): Promise<unknown> {
  return api.post(`${BASE}/${canvasId}/versions`)
}
