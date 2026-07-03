import { api } from './client'

export interface AuditEvent {
  id: string
  tenantId: string
  userId: string
  action: string
  resource: string
  resourceId: string
  details: string
  timestamp: string
  ipAddress: string
}

export function listEvents(): Promise<{ content: AuditEvent[]; totalElements: number }> {
  return api.get('/audit/events')
}

export function getEvent(id: string): Promise<AuditEvent> {
  return api.get(`/audit/events/${id}`)
}

export function listComplianceRules(): Promise<any[]> {
  return api.get('/audit/compliance/rules')
}

export function generateComplianceReport(): Promise<any> {
  return api.post('/audit/compliance/report')
}

export const auditApi = {
  listEvents,
  getEvent,
  listComplianceRules,
  generateComplianceReport,
}
