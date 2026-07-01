import { api } from './client'

// ─── Design Template Types ──────────────────────────────────

export interface DesignTemplateResource {
  id: string
  label: string
  provider: string
  resourceType: string
  category: string
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
  resources: DesignTemplateResource[]
  connections: DesignTemplateConnection[]
}

// ─── AIOps API Service ───────────────────────────────────────

export interface ChatRequest {
  question: string
  context: string
  extraContext?: Record<string, any>
}

export interface ChatResponse {
  answer: string
  design?: any
}

export interface MetricAnalysisRequest {
  metricName: string
  recentValues: number[]
  threshold: number
}

export interface MetricAnalysisResponse {
  metricName: string
  analysis: string
}

class AIOpsApiService {
  async getTemplates(): Promise<DesignTemplate[]> {
    try {
      const data = await api.get<DesignTemplate[]>('/aiops/templates')
      return Array.isArray(data) ? data : []
    } catch {
      return []
    }
  }

  async chatQuery(body: { question: string; context: string; extraContext?: Record<string, any> }): Promise<ChatResponse | null> {
    try {
      return await api.post<ChatResponse>('/aiops/query', body)
    } catch {
      return null
    }
  }

  async analyzeMetric(body: MetricAnalysisRequest): Promise<MetricAnalysisResponse | null> {
    try {
      return await api.post<MetricAnalysisResponse>('/aiops/analyze-metric', body)
    } catch {
      return null
    }
  }

  async getIncidents(environmentId: string): Promise<any[] | null> {
    try {
      return await api.get<any[]>(`/aiops/incidents/${environmentId}`)
    } catch {
      return null
    }
  }

  async analyzeIncident(incidentId: string): Promise<any | null> {
    try {
      return await api.post<any>(`/aiops/incidents/${incidentId}/analyze`)
    } catch {
      return null
    }
  }

  async resolveIncident(incidentId: string): Promise<any | null> {
    try {
      return await api.post<any>(`/aiops/incidents/${incidentId}/resolve`)
    } catch {
      return null
    }
  }
}

export const aiopsApi = new AIOpsApiService()
