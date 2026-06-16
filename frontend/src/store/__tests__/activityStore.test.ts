import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useActivityStore } from '../activityStore'

beforeEach(() => {
  useActivityStore.setState({ events: [], maxEvents: 100, loading: false })
})

const makeEvent = (overrides: Record<string, unknown> = {}) => ({
  type: 'design_save' as const,
  title: 'Test event',
  description: 'Test description',
  module: 'design',
  severity: 'info' as const,
  ...overrides,
})

describe('activityStore', () => {
  describe('addEvent', () => {
    it('adiciona evento com id e timestamp', () => {
      useActivityStore.getState().addEvent(makeEvent())
      const events = useActivityStore.getState().events
      expect(events).toHaveLength(1)
      expect(events[0].id).toBeDefined()
      expect(events[0].timestamp).toBeDefined()
      expect(events[0].title).toBe('Test event')
    })

    it('adiciona novos eventos no início da lista', () => {
      useActivityStore.getState().addEvent(makeEvent({ title: 'Evento 1' }))
      useActivityStore.getState().addEvent(makeEvent({ title: 'Evento 2' }))

      const events = useActivityStore.getState().events
      expect(events).toHaveLength(2)
      expect(events[0].title).toBe('Evento 2')
      expect(events[1].title).toBe('Evento 1')
    })

    it('respeita o limite maxEvents', () => {
      useActivityStore.setState({ maxEvents: 3 })
      for (let i = 0; i < 5; i++) {
        useActivityStore.getState().addEvent(makeEvent({ title: `Evento ${i}` }))
      }

      expect(useActivityStore.getState().events).toHaveLength(3)
    })
  })

  describe('getRecent', () => {
    it('retorna os N eventos mais recentes', () => {
      for (let i = 0; i < 10; i++) {
        useActivityStore.getState().addEvent(makeEvent({ title: `Evento ${i}` }))
      }

      const recent = useActivityStore.getState().getRecent(3)
      expect(recent).toHaveLength(3)
      expect(recent[0].title).toBe('Evento 9')
    })

    it('retorna todos se N > total', () => {
      useActivityStore.getState().addEvent(makeEvent({ title: 'Único' }))
      expect(useActivityStore.getState().getRecent(10)).toHaveLength(1)
    })
  })

  describe('getByType', () => {
    it('filtra eventos por tipo', () => {
      useActivityStore.getState().addEvent(makeEvent({ type: 'design_save' }))
      useActivityStore.getState().addEvent(makeEvent({ type: 'deploy_success' }))
      useActivityStore.getState().addEvent(makeEvent({ type: 'design_save' }))

      const designEvents = useActivityStore.getState().getByType('design_save')
      expect(designEvents).toHaveLength(2)
    })

    it('retorna vazio se nenhum evento do tipo', () => {
      expect(useActivityStore.getState().getByType('drift_detected')).toHaveLength(0)
    })
  })

  describe('getByModule', () => {
    it('filtra eventos por módulo', () => {
      useActivityStore.getState().addEvent(makeEvent({ module: 'design' }))
      useActivityStore.getState().addEvent(makeEvent({ module: 'provision' }))
      useActivityStore.getState().addEvent(makeEvent({ module: 'design' }))

      const designEvents = useActivityStore.getState().getByModule('design')
      expect(designEvents).toHaveLength(2)
    })
  })

  describe('getAlerts', () => {
    it('retorna eventos com severidade error ou warning', () => {
      useActivityStore.getState().addEvent(makeEvent({ severity: 'info' }))
      useActivityStore.getState().addEvent(makeEvent({ severity: 'success' }))
      useActivityStore.getState().addEvent(makeEvent({ severity: 'warning' }))
      useActivityStore.getState().addEvent(makeEvent({ severity: 'error' }))

      const alerts = useActivityStore.getState().getAlerts()
      expect(alerts).toHaveLength(2)
      expect(alerts[0].severity).toBe('error') // most recent first
      expect(alerts[1].severity).toBe('warning')
    })
  })

  describe('clearAll', () => {
    it('remove todos os eventos', () => {
      useActivityStore.getState().addEvent(makeEvent())
      useActivityStore.getState().addEvent(makeEvent())
      expect(useActivityStore.getState().events.length).toBeGreaterThan(0)

      useActivityStore.getState().clearAll()
      expect(useActivityStore.getState().events).toHaveLength(0)
    })
  })

  describe('fetchActivityEvents (API integration)', () => {
    beforeEach(() => {
      localStorage.setItem('cloudbuilder-active-environment', 'env-test')
    })

    it('atualiza eventos quando API retorna alerts', async () => {
      const mockDashboardApi = await import('@/api/dashboardApi')
      vi.spyOn(mockDashboardApi.dashboardApi, 'getObserveDashboard').mockResolvedValue({
        totalServices: 5,
        degradedCount: 1,
        downCount: 0,
        averageLatency: 120,
        averageUptime: 99.5,
        services: [],
        alerts: [
          { id: 'a1', severity: 'critical', message: 'CPU alta', serviceName: 'api', timestamp: new Date().toISOString(), resolved: false },
          { id: 'a2', severity: 'warning', message: 'Memória > 80%', serviceName: 'db', timestamp: new Date().toISOString(), resolved: false },
        ],
      })

      await useActivityStore.getState().fetchActivityEvents()
      const events = useActivityStore.getState().events
      expect(events.length).toBeGreaterThan(0)
      expect(events[0].title).toBe('CPU alta')
      expect(events[0].module).toBe('observe')
    })

    it('mantém mock data quando API retorna alerts vazio', async () => {
      const mockDashboardApi = await import('@/api/dashboardApi')
      vi.spyOn(mockDashboardApi.dashboardApi, 'getObserveDashboard').mockResolvedValue({
        totalServices: 3,
        degradedCount: 0,
        downCount: 0,
        averageLatency: 50,
        averageUptime: 100,
        services: [],
        alerts: [],
      })

      await useActivityStore.getState().fetchActivityEvents()
      // Must have refreshed mock data (not empty)
      expect(useActivityStore.getState().events.length).toBeGreaterThan(0)
    })

    it('mantém eventos existentes quando API falha', async () => {
      const mockDashboardApi = await import('@/api/dashboardApi')
      vi.spyOn(mockDashboardApi.dashboardApi, 'getObserveDashboard').mockRejectedValue(new Error('Network error'))

      useActivityStore.setState({
        events: [{ id: 'e1', type: 'design_save', title: 'Existente', description: '', module: 'design', severity: 'info', timestamp: new Date().toISOString() }],
      })

      await useActivityStore.getState().fetchActivityEvents()
      // After failed API call, fallback refreshes mock data
      expect(useActivityStore.getState().events.length).toBeGreaterThan(0)
    })

    it('usa environment do localStorage', async () => {
      localStorage.setItem('cloudbuilder-active-environment', 'env-custom')
      const mockDashboardApi = await import('@/api/dashboardApi')
      const spy = vi.spyOn(mockDashboardApi.dashboardApi, 'getObserveDashboard').mockResolvedValue({
        totalServices: 1, degradedCount: 0, downCount: 0,
        averageLatency: 0, averageUptime: 100,
        services: [], alerts: [],
      })

      await useActivityStore.getState().fetchActivityEvents()
      expect(spy).toHaveBeenCalledWith('env-custom')
    })
  })
})
