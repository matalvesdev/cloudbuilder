import { api } from './client'

export interface AlertRule {
  id: string
  name: string
  description?: string
  metricName: string
  condition: string
  threshold: number
  durationSec?: number
  severity: string
  enabled: boolean
  notifyChannels?: string[]
}

export interface SloDefinition {
  id: string
  name: string
  target: number
  indicator: string
  window: string
}

export interface Incident {
  id: string
  title: string
  description: string
  severity: string
  status: string
  alertRuleId?: string
  startedAt: string
  acknowledgedAt?: string
  resolvedAt?: string
}

export interface NotificationChannel {
  id: string
  name: string
  type: string
  config: string
  enabled: boolean
}

// ─── Dashboard ─────────────────────────────────────────────────

export function getDashboard(environmentId: string): Promise<any> {
  return api.get(`/observe/dashboard/${environmentId}`)
}

// ─── Alerts ────────────────────────────────────────────────────

export function listAlerts(environmentId: string): Promise<any[]> {
  return api.get(`/observe/alerts/${environmentId}`)
}

export function resolveAlert(alertId: string): Promise<void> {
  return api.post(`/observe/alerts/${alertId}/resolve`)
}

// ─── Alert Rules ───────────────────────────────────────────────

export function listAlertRules(): Promise<AlertRule[]> {
  return api.get('/observability/alert-rules')
}

export function createAlertRule(rule: Partial<AlertRule>): Promise<AlertRule> {
  return api.post('/observability/alert-rules', rule)
}

export function updateAlertRule(id: string, rule: Partial<AlertRule>): Promise<AlertRule> {
  return api.put(`/observability/alert-rules/${id}`, rule)
}

export function deleteAlertRule(id: string): Promise<void> {
  return api.delete(`/observability/alert-rules/${id}`)
}

// ─── Incidents ─────────────────────────────────────────────────

export function getActiveIncidents(): Promise<Incident[]> {
  return api.get('/observability/incidents')
}

export function acknowledgeIncident(id: string): Promise<void> {
  return api.post(`/observability/incidents/${id}/acknowledge`)
}

export function resolveIncident(id: string): Promise<void> {
  return api.post(`/observability/incidents/${id}/resolve`)
}

// ─── SLO ───────────────────────────────────────────────────────

export function listSloDefinitions(): Promise<SloDefinition[]> {
  return api.get('/observability/slo')
}

// ─── Metrics ───────────────────────────────────────────────────

export function getMetrics(resourceId: string, metricName: string, range: string): Promise<any> {
  return api.get(`/observability/metrics/query?resourceId=${resourceId}&metricName=${metricName}&range=${range}`)
}

export function recordMetric(resourceId: string, metricName: string, value: number): Promise<void> {
  return api.post('/observability/metrics/record', { resourceId, metricName, value })
}

// ─── Traces ────────────────────────────────────────────────────

export function listTraces(): Promise<any[]> {
  return api.get('/observability/traces')
}

export function getTrace(traceId: string): Promise<any> {
  return api.get(`/observability/traces/${traceId}`)
}

export function getTraceErrors(): Promise<any[]> {
  return api.get('/observability/traces/errors')
}

// ─── Logs ──────────────────────────────────────────────────────

export function listLogs(): Promise<any[]> {
  return api.get('/observability/logs')
}

export function searchLogs(query: string): Promise<any[]> {
  return api.get(`/observability/logs?q=${encodeURIComponent(query)}`)
}

// ─── Health ────────────────────────────────────────────────────

export function checkHealth(): Promise<any> {
  return api.post('/observe/health')
}

// ─── Notification Channels ─────────────────────────────────────

export function listNotificationChannels(): Promise<NotificationChannel[]> {
  return api.get('/observability/notification-channels')
}

export function createNotificationChannel(channel: Omit<NotificationChannel, 'id'>): Promise<NotificationChannel> {
  return api.post('/observability/notification-channels', channel)
}

// ─── Observability API Object ──────────────────────────────────

export const observabilityApi = {
  getDashboard,
  listAlerts,
  resolveAlert,
  listAlertRules,
  createAlertRule,
  updateAlertRule,
  deleteAlertRule,
  listSloDefinitions,
  getMetrics,
  recordMetric,
  listTraces,
  getTrace,
  getTraceErrors,
  listLogs,
  searchLogs,
  checkHealth,
  getActiveIncidents,
  acknowledgeIncident,
  resolveIncident,
  listNotificationChannels,
  createNotificationChannel,
}
