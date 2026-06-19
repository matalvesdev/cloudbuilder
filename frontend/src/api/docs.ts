import { api } from './client'
import type { DocTreeItem, DocContent, StaleDoc } from '@/modules/docs/docsStore'

const BASE = '/docs'

export function fetchDocTree(): Promise<DocTreeItem[]> {
  return api.get(`${BASE}/tree`)
}

export function fetchDocContent(path: string): Promise<DocContent> {
  return api.get(`${BASE}/content?path=${encodeURIComponent(path)}`)
}

export function searchDocs(query: string): Promise<DocTreeItem[]> {
  return api.get(`${BASE}/search?q=${encodeURIComponent(query)}`)
}

export function scanDocsDirectory(): Promise<{ scanned: number }> {
  return api.post(`${BASE}/scan`)
}

export function generateDocFromCanvas(canvasId: string): Promise<DocContent> {
  return api.post(`${BASE}/generate`, { canvasId })
}

export function fetchStaleDocs(): Promise<StaleDoc[]> {
  return api.get(`${BASE}/stale`)
}
