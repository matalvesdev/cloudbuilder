import { create } from 'zustand'
import { analyticsApi } from '@/api/analytics'
import type { AnalyticsEvent, ModuleUsage, UserActivity, FeatureAdoption } from '@/types/analytics.types'

interface AnalyticsState {
  moduleUsage: ModuleUsage[]
  userActivity: UserActivity[]
  featureAdoption: FeatureAdoption[]
  recentEvents: AnalyticsEvent[]
  loading: boolean
  error: string | null
  period: number
  fetchModuleUsage: (tenantId: string) => Promise<void>
  fetchUserActivity: (tenantId: string) => Promise<void>
  trackEvent: (event: Omit<AnalyticsEvent, 'id' | 'timestamp'>) => Promise<void>
  setPeriod: (days: number) => void
}

export const useAnalyticsStore = create<AnalyticsState>((set, get) => ({
  moduleUsage: [],
  userActivity: [],
  featureAdoption: [],
  recentEvents: [],
  loading: false,
  error: null,
  period: 30,

  fetchModuleUsage: async (tenantId: string) => {
    set({ loading: true, error: null })
    try {
      const raw = await analyticsApi.getModuleUsage(tenantId, get().period)
      if (raw && Object.keys(raw).length > 0) {
        const total = Object.values(raw).reduce((a, b) => a + b, 0)
        const usage: ModuleUsage[] = Object.entries(raw)
          .map(([module, events]) => ({
            module,
            events,
            percentage: total > 0 ? Math.round((events / total) * 100) : 0,
          }))
          .sort((a, b) => b.events - a.events)
        set({ moduleUsage: usage, loading: false })
      } else {
        set({ loading: false })
      }
    } catch {
      set({ loading: false, error: 'Falha ao carregar uso dos módulos' })
    }
  },

  fetchUserActivity: async (tenantId: string) => {
    set({ loading: true, error: null })
    try {
      const raw = await analyticsApi.getUserActivity(tenantId, get().period)
      if (raw && Object.keys(raw).length > 0) {
        const activity: UserActivity[] = Object.entries(raw).map(([email, count]) => ({
          email,
          sessions: count,
          lastActivity: new Date().toISOString(),
          actions: count * 3,
        }))
        set({ userActivity: activity, loading: false })
      } else {
        set({ loading: false })
      }
    } catch {
      set({ loading: false, error: 'Falha ao carregar atividade de usuários' })
    }
  },

  trackEvent: async (event) => {
    try {
      await analyticsApi.trackEvent(event)
    } catch {
      // silent
    }
  },

  setPeriod: (days: number) => set({ period: days }),
}))
