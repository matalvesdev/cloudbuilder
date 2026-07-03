import { api } from './client'
import type { AuditEvent, ComplianceRule, ComplianceEvaluation } from '@/types/audit.types'

export interface AuditQueryParams {
  userId?: string
  action?: string
  resourceType?: string
  startDate?: string
  endDate?: string
  page?: number
  size?: number
}

export const auditApi = {
  // ─── Events ───────────────────────────────────────────────────

  listEvents: (tenantId?: string) =>
    api.get<{ content: AuditEvent[]; totalElements: number }>(
      tenantId ? `/audit/events/${tenantId}` : '/audit/events'
    ),

  getEvent: (id: string) =>
    api.get<AuditEvent>(`/audit/events/${id}`),

  createEvent: (event: Omit<AuditEvent, 'id' | 'timestamp'>) =>
    api.post<AuditEvent>('/audit/events', event),

  // ─── Query ────────────────────────────────────────────────────

  queryEvents: (tenantId: string, params: AuditQueryParams) => {
    const query = new URLSearchParams()
    if (params.userId) query.set('userId', params.userId)
    if (params.action) query.set('action', params.action)
    if (params.resourceType) query.set('resourceType', params.resourceType)
    if (params.startDate) query.set('startDate', params.startDate)
    if (params.endDate) query.set('endDate', params.endDate)
    if (params.page !== undefined) query.set('page', String(params.page))
    if (params.size !== undefined) query.set('size', String(params.size))
    return api.get<{ content: AuditEvent[]; totalElements: number }>(
      `/audit/query/${tenantId}?${query.toString()}`
    )
  },

  // ─── Export ───────────────────────────────────────────────────

  exportCsv: (tenantId: string, params?: AuditQueryParams) => {
    const query = new URLSearchParams()
    if (params?.startDate) query.set('startDate', params.startDate)
    if (params?.endDate) query.set('endDate', params.endDate)
    const qs = query.toString()
    return api.get<Blob>(`/audit/export/${tenantId}/csv${qs ? '?' + qs : ''}`)
  },

  exportJson: (tenantId: string, params?: AuditQueryParams) => {
    const query = new URLSearchParams()
    if (params?.startDate) query.set('startDate', params.startDate)
    if (params?.endDate) query.set('endDate', params.endDate)
    const qs = query.toString()
    return api.get<AuditEvent[]>(`/audit/export/${tenantId}/json${qs ? '?' + qs : ''}`)
  },

  // ─── Compliance ───────────────────────────────────────────────

  getComplianceScore: (tenantId: string) =>
    api.get<{ score: number; totalRules: number; passedRules: number }>(
      `/audit/compliance/${tenantId}/score`
    ),

  getComplianceEvaluations: (tenantId: string) =>
    api.get<ComplianceEvaluation[]>(`/audit/compliance/${tenantId}/evaluations`),

  listComplianceRules: (tenantId?: string) =>
    api.get<ComplianceRule[]>(tenantId ? `/audit/compliance/rules/${tenantId}` : '/audit/compliance/rules'),

  createComplianceRule: (rule: Omit<ComplianceRule, 'id'>) =>
    api.post<ComplianceRule>('/audit/compliance/rules', rule),

  // ─── OPA Status ───────────────────────────────────────────────

  getOpaStatus: () =>
    api.get<{ reachable: boolean; version?: string }>('/compliance/opa/status'),
}

// Backward-compatible exports
export const listEvents = auditApi.listEvents
export const getEvent = auditApi.getEvent
export const listComplianceRules = auditApi.listComplianceRules
