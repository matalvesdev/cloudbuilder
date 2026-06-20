import { api } from './client'
import type { AuditEvent, AuditQueryParams, ComplianceEvaluation, ComplianceRule, ComplianceScore } from '@/types/audit.types'

class AuditApiService {
  // ─── Event Queries ────────────────────────────────────────

  async queryEvents(tenantId: string, params: AuditQueryParams): Promise<AuditEvent[]> {
    const query = buildQueryString(params)
    const data = await api.get<AuditEvent[]>(`/audit/query/${tenantId}${query}`)
    return Array.isArray(data) ? data : []
  }

  async exportCsv(tenantId: string, params: AuditQueryParams): Promise<Blob> {
    const query = buildQueryString(params)
    const token = localStorage.getItem('cloudbuilder-auth-token')
    const response = await fetch(
      `${import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1'}/audit/export/${tenantId}/csv${query}`,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }
    )
    return response.blob()
  }

  async exportJson(tenantId: string, params: AuditQueryParams): Promise<Blob> {
    const query = buildQueryString(params)
    const token = localStorage.getItem('cloudbuilder-auth-token')
    const response = await fetch(
      `${import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1'}/audit/export/${tenantId}/json${query}`,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }
    )
    return response.blob()
  }

  // ─── Compliance ───────────────────────────────────────────

  async getComplianceScore(tenantId: string): Promise<ComplianceScore | null> {
    try {
      return await api.get<ComplianceScore>(`/audit/compliance/${tenantId}/score`)
    } catch {
      return null
    }
  }

  async getComplianceEvaluations(tenantId: string): Promise<ComplianceEvaluation[]> {
    try {
      const data = await api.get<ComplianceEvaluation[]>(`/audit/compliance/${tenantId}/evaluations`)
      return Array.isArray(data) ? data : []
    } catch {
      return []
    }
  }

  async getComplianceRules(tenantId: string): Promise<ComplianceRule[]> {
    try {
      const data = await api.get<ComplianceRule[]>(`/audit/compliance/rules/${tenantId}`)
      return Array.isArray(data) ? data : []
    } catch {
      return []
    }
  }

  async createComplianceRule(rule: Partial<ComplianceRule>): Promise<ComplianceRule | null> {
    try {
      return await api.post<ComplianceRule>('/audit/compliance/rules', rule)
    } catch {
      return null
    }
  }

  async deleteComplianceRule(id: string): Promise<boolean> {
    try {
      await api.delete(`/audit/compliance/rules/${id}`)
      return true
    } catch {
      return false
    }
  }
}

function buildQueryString(params: AuditQueryParams): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== ''
  )
  if (entries.length === 0) return ''
  return '?' + entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&')
}

export const auditApi = new AuditApiService()
