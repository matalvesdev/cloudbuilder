import { create } from 'zustand'
import type { DriftReport, DriftResource, DriftSummary } from '@/types/drift.types'
import { getDriftReport, resolveDrift } from '@/api/provision'
import type { DriftReportDTO, DriftItemDTO } from '@/api/types'
import { eventBus } from '@/shared/event-bus'

interface DriftState {
  reports: DriftReport[]
  loading: boolean
  error: string | null
  detectionInterval: number | null
  selectedEnvironmentId: string | null

  setSelectedEnvironment: (envId: string | null) => void
  loadDriftReport: () => Promise<void>
  handleDriftEvent: (event: { type: string; payload?: { environmentId: string; reportId: string; driftCount: number; hasDrift: boolean } }) => void
  acceptDrift: (resourceId: string) => void
  ignoreDrift: (resourceId: string) => void
  remediateDrift: (resourceId: string) => void
  acceptAllDrifts: (reportId: string) => void
  ignoreAllDrifts: (reportId: string) => void
  remediateAllDrifts: (reportId: string) => void
  resolveReport: (reportId: string) => Promise<void>
  startPeriodicDetection: (intervalMs?: number) => void
  stopPeriodicDetection: () => void
  clearResolved: () => void
}

function buildSummary(resources: DriftResource[]): DriftSummary {
  const summary: DriftSummary = { add: 0, change: 0, destroy: 0 }
  for (const r of resources) {
    if (r.driftType === 'ADDED') summary.add++
    else if (r.driftType === 'MODIFIED') summary.change++
    else if (r.driftType === 'REMOVED') summary.destroy++
  }
  return summary
}

/** Map a single backend DriftItemDTO to the store's DriftResource type */
function toDriftResource(item: DriftItemDTO, envId: string): DriftResource {
  const provider = item.resourceType.includes('_')
    ? item.resourceType.split('_')[0]
    : 'aws'

  const driftType = item.driftType as DriftResource['driftType'] === 'ADDED'
    ? 'ADDED'
    : item.driftType === 'REMOVED'
      ? 'REMOVED'
      : 'MODIFIED'

  const severity = item.severity === 'HIGH'
    ? 'CRITICAL'
    : item.severity === 'LOW'
      ? 'INFO'
      : 'MODERATE'

  return {
    id: item.resourceId,
    resourceName: item.resourceName,
    resourceType: item.resourceType,
    provider,
    driftType,
    severity,
    propertyChanges: item.expectedValue || item.actualValue
      ? [{
          property: item.resourceName,
          expectedValue: item.expectedValue ?? '—',
          actualValue: item.actualValue ?? '—',
          changeType: driftType === 'ADDED' ? 'CREATED' : driftType === 'REMOVED' ? 'DELETED' : 'UPDATED',
        }]
      : [],
    detectedAt: new Date().toISOString(),
    status: 'DETECTED',
    nodeId: item.resourceId,
  }
}

/** Map backend DriftReportDTO to the store's DriftReport type */
function toDriftReport(dto: DriftReportDTO): DriftReport {
  const resources = dto.drifts?.map((d) => toDriftResource(d, dto.environmentId)) ?? []
  return {
    id: dto.id,
    environmentId: dto.environmentId,
    canvasId: dto.environmentId,
    canvasVersion: 1,
    resources,
    summary: buildSummary(resources),
    detectedAt: dto.detectedAt,
    resolvedAt: null,
    status: (dto.status === 'RESOLVED' ? 'REMEDIATED' : dto.status === 'IGNORED' ? 'IGNORED' : 'DETECTED') as DriftReport['status'],
  }
}

export const useDriftStore = create<DriftState>()((set, get) => ({
  reports: [],
  loading: false,
  error: null,
  detectionInterval: null,
  selectedEnvironmentId: null,

  setSelectedEnvironment: (envId) => set({ selectedEnvironmentId: envId }),

  handleDriftEvent: (event) => {
    // Triggered by SSE events from useEventStream
    // Reload drift report when drift is detected or resolved
    const envId = event.payload?.environmentId
    if (envId) {
      set({ selectedEnvironmentId: envId })
      get().loadDriftReport()
    }
  },

  loadDriftReport: async () => {
    const envId = get().selectedEnvironmentId
    if (!envId) return

    set({ loading: true, error: null })
    try {
      const dto = await getDriftReport(envId)
      if (dto) {
        const report = toDriftReport(dto)
        set((state) => ({
          reports: state.reports.some((r) => r.id === report.id)
            ? state.reports
            : [report, ...state.reports],
        }))
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Falha ao detectar drift' })
    } finally {
      set({ loading: false })
    }
  },

  acceptDrift: (resourceId) => {
    set((state) => ({
      reports: state.reports.map((r) => ({
        ...r,
        resources: r.resources.map((res) =>
          res.id === resourceId ? { ...res, status: 'ACCEPTED' as const } : res
        ),
      })),
    }))
  },

  ignoreDrift: (resourceId) => {
    set((state) => ({
      reports: state.reports.map((r) => ({
        ...r,
        resources: r.resources.map((res) =>
          res.id === resourceId ? { ...res, status: 'IGNORED' as const } : res
        ),
      })),
    }))
  },

  remediateDrift: (resourceId) => {
    set((state) => ({
      reports: state.reports.map((r) => ({
        ...r,
        resources: r.resources.map((res) =>
          res.id === resourceId ? { ...res, status: 'REMEDIATED' as const } : res
        ),
      })),
    }))
  },

  acceptAllDrifts: (reportId) => {
    set((state) => ({
      reports: state.reports.map((r) =>
        r.id === reportId
          ? {
              ...r,
              resources: r.resources.map((res) => ({ ...res, status: 'ACCEPTED' as const })),
              status: 'ACCEPTED' as const,
              resolvedAt: new Date().toISOString(),
            }
          : r
      ),
    }))
  },

  ignoreAllDrifts: (reportId) => {
    set((state) => ({
      reports: state.reports.map((r) =>
        r.id === reportId
          ? {
              ...r,
              resources: r.resources.map((res) => ({ ...res, status: 'IGNORED' as const })),
              status: 'IGNORED' as const,
              resolvedAt: new Date().toISOString(),
            }
          : r
      ),
    }))
  },

  remediateAllDrifts: (reportId) => {
    set((state) => ({
      reports: state.reports.map((r) =>
        r.id === reportId
          ? {
              ...r,
              resources: r.resources.map((res) => ({ ...res, status: 'REMEDIATED' as const })),
              status: 'REMEDIATED' as const,
              resolvedAt: new Date().toISOString(),
            }
          : r
      ),
    }))
  },

  resolveReport: async (reportId) => {
    const envId = get().selectedEnvironmentId
    if (!envId) return

    try {
      await resolveDrift(envId, reportId)
    } catch {
      // Optimistic update even if API call fails
    }

    set((state) => ({
      reports: state.reports.map((r) =>
        r.id === reportId
          ? { ...r, status: 'REMEDIATED' as const, resolvedAt: new Date().toISOString() }
          : r
      ),
    }))
  },

  startPeriodicDetection: (intervalMs = 30000) => {
    const existing = get().detectionInterval
    if (existing) clearInterval(existing)
    const id = window.setInterval(() => {
      get().loadDriftReport()
    }, intervalMs)
    set({ detectionInterval: id })
  },

  stopPeriodicDetection: () => {
    const existing = get().detectionInterval
    if (existing) {
      clearInterval(existing)
      set({ detectionInterval: null })
    }
  },

  clearResolved: () => {
    set((state) => ({
      reports: state.reports.filter(
        (r) => r.status === 'DETECTED' || r.resources.some((res) => res.status === 'DETECTED')
      ),
    }))
  },
}))

// ─── EventBus subscriptions (architectural consistency) ─────────────
// SSE events flow through EventBus → stores react here
eventBus.subscribe('drift:detected', () => {
  const envId = useDriftStore.getState().selectedEnvironmentId
  if (envId) {
    useDriftStore.getState().loadDriftReport()
  }
})
eventBus.subscribe('drift:resolved', () => {
  const envId = useDriftStore.getState().selectedEnvironmentId
  if (envId) {
    useDriftStore.getState().loadDriftReport()
  }
})
