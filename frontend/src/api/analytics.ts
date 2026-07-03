import { api } from './client'

export interface AnalyticsEvent {
  id: string
  tenantId: string
  userId: string
  action: string
  resource: string
  timestamp: string
  metadata: Record<string, any>
}

export function getSummary(period: string): Promise<any> {
  return api.get(`/analytics/summary?period=${period}`)
}

export function listEvents(): Promise<{ content: AnalyticsEvent[]; totalElements: number }> {
  return api.get('/analytics/events')
}

export function getMetrics(resourceType: string, period: string): Promise<any> {
  return api.get(`/analytics/metrics/${resourceType}?period=${period}`)
}

export function getUsageStats(): Promise<any> {
  return api.get('/analytics/usage')
}

export const analyticsApi = {
  getSummary,
  listEvents,
  getMetrics,
  getUsageStats,
}
