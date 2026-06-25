import { api } from './client'
import type { AnalyticsEvent, ModuleUsage, UserActivity } from '@/types/analytics.types'

export interface AnalyticsApi {
  trackEvent(event: Omit<AnalyticsEvent, 'id' | 'timestamp'>): Promise<AnalyticsEvent | null>
  getEvents(tenantId: string): Promise<AnalyticsEvent[]>
  getModuleUsage(tenantId: string, days?: number): Promise<Record<string, number>>
  getUserActivity(tenantId: string, days?: number): Promise<Record<string, number>>
}

export const analyticsApi: AnalyticsApi = {
  async trackEvent(event) {
    try {
      const res = await api.post<AnalyticsEvent>('/analytics/events', event)
      return res ?? null
    } catch {
      return null
    }
  },

  async getEvents(tenantId) {
    try {
      return (await api.get<AnalyticsEvent[]>(`/analytics/events/${tenantId}`)) ?? []
    } catch {
      return []
    }
  },

  async getModuleUsage(tenantId, days = 30) {
    try {
      return (await api.get<Record<string, number>>(`/analytics/usage/${tenantId}?days=${days}`)) ?? {}
    } catch {
      return {}
    }
  },

  async getUserActivity(tenantId, days = 30) {
    try {
      return (await api.get<Record<string, number>>(`/analytics/activity/${tenantId}?days=${days}`)) ?? {}
    } catch {
      return {}
    }
  },
}
