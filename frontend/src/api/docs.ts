import { api } from './client'

export interface DocNode {
  id: string
  path: string
  name: string
  type: 'file' | 'directory'
  children?: DocNode[]
}

export function fetchDocTree(): Promise<DocNode[]> {
  return api.get('/docs/tree')
}

export function fetchDocContent(path: string): Promise<string> {
  return api.get(`/docs/content?path=${encodeURIComponent(path)}`)
}

export function searchDocs(query: string): Promise<DocNode[]> {
  return api.get(`/docs/search?q=${encodeURIComponent(query)}`)
}

export function fetchStaleDocs(): Promise<DocNode[]> {
  return api.get('/docs/stale')
}

export function fetchDocLinks(path: string): Promise<string[]> {
  return api.get(`/docs/links?path=${encodeURIComponent(path)}`)
}

export function saveDocContent(path: string, content: string): Promise<void> {
  return api.put('/docs/content', { path, content })
}

export function generateDocFromCanvas(canvasId: string, canvasName?: string, description?: string): Promise<string> {
  return api.post('/docs/generate', { canvasId, canvasName, description })
}

export function generateArchitectureDoc(canvasId: string): Promise<{ path: string; title: string; content: string }> {
  return api.post('/docs/generate-architecture', { canvasId })
}

export function getAiContext(canvasId: string): Promise<{ context: string }> {
  return api.get(`/docs/ai-context/${canvasId}`)
}

export function generateReadme(canvasId: string): Promise<{ path: string; title: string; content: string }> {
  return api.post('/docs/generate-readme', { canvasId })
}

export function generateC4(canvasId: string): Promise<{ path: string; title: string; content: string }> {
  return api.post('/docs/generate-c4', { canvasId })
}
