import { api } from './client'

export interface AlertRule {
  id: string
  name: string
  metric: string
  condition: string
  threshold: number
  severity: string
  enabled: boolean
}

export interface SloDefinition {
  id: string
  name: string
  target: number
  indicator: string
  window: string
}

export function getDashboard(environmentId: string): Promise<any> {
  return api.get(`/observe/dashboard/${environmentId}`)
}

export function listAlerts(environmentId: string): Promise<any[]> {
  return api.get(`/observe/alerts/${environmentId}`)
}

export function resolveAlert(alertId: string): Promise<void> {
  return api.post(`/observe/alerts/${alertId}/resolve`)
}

export function listAlertRules(): Promise<AlertRule[]> {
  return api.get('/observe/alert-rules')
}

export function createAlertRule(rule: Omit<AlertRule, 'id'>): Promise<AlertRule> {
  return api.post('/observe/alert-rules', rule)
}

export function deleteAlertRule(id: string): Promise<void> {
  return api.delete(`/observe/alert-rules/${id}`)
}

export function listSloDefinitions(): Promise<SloDefinition[]> {
  return api.get('/observe/slo')
}

export function getMetrics(resourceId: string, metricName: string, range: string): Promise<any> {
  return api.get(`/metrics/${resourceId}/${metricName}?range=${range}`)
}

export function listTraces(): Promise<any[]> {
  return api.get('/apm/traces')
}

export function getTrace(traceId: string): Promise<any> {
  return api.get(`/apm/traces/${traceId}`)
}

export function listLogs(): Promise<any[]> {
  return api.get('/apm/logs')
}

export function checkHealth(): Promise<any> {
  return api.post('/observe/health')
}

export function getActiveIncidents(): Promise<any[]> {
  return api.get('/observe/incidents/active')
}

export function getTraces(filters?: Record<string, string>): Promise<any[]> {
  return api.get('/apm/traces')
}

export function acknowledgeIncident(id: string): Promise<void> {
  return api.post(`/observe/incidents/${id}/acknowledge`)
}

export const observabilityApi = {
  getDashboard,
  listAlerts,
  resolveAlert,
  listAlertRules,
  createAlertRule,
  deleteAlertRule,
  listSloDefinitions,
  getMetrics,
  listTraces,
  getTrace,
  listLogs,
  checkHealth,
  getActiveIncidents,
  getTraces,
  acknowledgeIncident,
}
