import { api } from './client'
import type { DocTreeItem, DocContent, StaleDoc, DocLink } from '@/modules/settings/docsStore'

const BASE = '/docs'

export function fetchDocTree(): Promise<DocTreeItem[]> {
  return api.get(`${BASE}/tree`)
}

export function fetchDocContent(path: string): Promise<DocContent> {
  return api.get(`${BASE}/content?path=${encodeURIComponent(path)}`)
}

export function saveDocContent(path: string, content: string): Promise<DocContent> {
  return api.put(`${BASE}/content`, { path, content })
}

export function searchDocs(query: string): Promise<DocTreeItem[]> {
  return api.get(`${BASE}/search?q=${encodeURIComponent(query)}`)
}

export function scanDocsDirectory(): Promise<{ scanned: number }> {
  return api.post(`${BASE}/scan`)
}

export function generateDocFromCanvas(canvasId: string, canvasName?: string, description?: string): Promise<DocContent> {
  return api.post(`${BASE}/generate`, { canvasId, canvasName, description })
}

export function fetchStaleDocs(): Promise<StaleDoc[]> {
  return api.get(`${BASE}/stale`)
}

// ── Cross-module links ──

export function fetchDocLinks(path: string): Promise<DocLink[]> {
  return api.get(`${BASE}/links?path=${encodeURIComponent(path)}`)
}

export function createDocLink(sourcePath: string, linkedPath: string, relationship: string = 'references', tenantId?: string): Promise<DocLink> {
  return api.post(`${BASE}/links`, { sourcePath, linkedPath, relationship, tenantId })
}

export function deleteDocLink(id: string): Promise<void> {
  return api.delete(`${BASE}/links/${id}`)
}
