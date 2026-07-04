import { api } from './client'

export interface DesignTemplateResource {
  id: string
  label: string
  provider: string
  resourceType: string
}

export interface DesignTemplateConnection {
  source: string
  target: string
  edgeType: string
}

export interface DesignTemplate {
  id: string
  name: string
  description: string
  provider: string
  resources: DesignTemplateResource[]
  connections: DesignTemplateConnection[]
}

export interface MetricAnalysisResponse {
  metricName?: string
  analysis?: string
  anomalies: Array<{ metric: string; value: number; threshold: number }>
  recommendations: string[]
}

export function queryAnalysis(query: string): Promise<MetricAnalysisResponse> {
  return api.post('/aiops/query', { query })
}

export interface Incident {
  id: string
  title: string
  description: string
  severity: string
  status: string
  environmentId?: string
  startedAt: string
  resolvedAt?: string
}

export interface Runbook {
  id: string
  title: string
  content: string
  category: string
  severity: string
}

export interface PostMortem {
  id: string
  incidentId: string
  summary: string
  rootCause: string
  impact: string
  status: string
}

export function listIncidents(): Promise<Incident[]> {
  return api.get('/aiops/incidents')
}

export function getIncident(id: string): Promise<Incident> {
  return api.get(`/aiops/incidents/${id}`)
}

export function listDesignTemplates(): Promise<DesignTemplate[]> {
  return api.get('/aiops/templates')
}

export function analyzeMetric(params: { metricName: string; recentValues?: number[]; threshold?: number }): Promise<MetricAnalysisResponse> {
  return api.post('/aiops/analyze-metric', params)
}

export function listRunbooks(): Promise<Runbook[]> {
  return api.get('/aiops/runbooks')
}

export function listPostMortems(): Promise<PostMortem[]> {
  return api.get('/aiops/postmortems')
}

export function getTemplates(): Promise<DesignTemplate[]> {
  return api.get('/aiops/templates')
}

export interface ChatResponse {
  answer: string
  suggestions?: string[]
}

export function chatQuery(params: { question: string; context?: string; extraContext?: Record<string, unknown> }): Promise<ChatResponse> {
  return api.post('/aiops/query', params)
}

export interface AiChatResponse {
  answer: string
  category: string
}

export function explainArchitecture(canvasId: string, canvasName: string): Promise<AiChatResponse> {
  return api.post('/aiops/chat/explain-architecture', { canvasId, canvasName, extraContext: {} })
}

export function optimizeCost(canvasId: string): Promise<AiChatResponse> {
  return api.post('/aiops/chat/optimize-cost', { canvasId, extraContext: {} })
}

export function securityReview(canvasId: string): Promise<AiChatResponse> {
  return api.post('/aiops/chat/security-review', { canvasId, extraContext: {} })
}

export function generateK8s(canvasId: string): Promise<AiChatResponse> {
  return api.post('/aiops/chat/generate-k8s', { canvasId, extraContext: {} })
}

export const aiopsApi = {
  queryAnalysis,
  listIncidents,
  getIncident,
  listDesignTemplates,
  getTemplates,
  analyzeMetric,
  listRunbooks,
  listPostMortems,
  chatQuery,
  explainArchitecture,
  optimizeCost,
  securityReview,
  generateK8s,
}
