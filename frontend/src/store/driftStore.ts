import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DriftReport, DriftResource, DriftSummary } from '@/types/drift.types'
import { useCanvasStore } from './canvasStore'

interface DriftState {
  reports: DriftReport[]
  detectionInterval: number | null

  addDriftReport: (report: DriftReport) => void
  acceptDrift: (resourceId: string) => void
  ignoreDrift: (resourceId: string) => void
  remediateDrift: (resourceId: string) => void
  acceptAllDrifts: (reportId: string) => void
  ignoreAllDrifts: (reportId: string) => void
  remediateAllDrifts: (reportId: string) => void
  resolveReport: (reportId: string) => void
  simulateDriftDetection: () => void
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

export const useDriftStore = create<DriftState>()(
  persist(
    (set, get) => ({
      reports: [],
      detectionInterval: null,

      addDriftReport: (report) => {
        set((state) => ({
          reports: [{ ...report, summary: report.summary || buildSummary(report.resources) }, ...state.reports],
        }))
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

      resolveReport: (reportId) => {
        set((state) => ({
          reports: state.reports.map((r) =>
            r.id === reportId
              ? { ...r, status: 'ACCEPTED' as const, resolvedAt: new Date().toISOString() }
              : r
          ),
        }))
      },

      simulateDriftDetection: () => {
        const canvas = useCanvasStore.getState()
        const canvasNodes = canvas.nodes
        const now = new Date().toISOString()

        const mockResources: DriftResource[] = []

        if (canvasNodes.length > 0) {
          const node = canvasNodes[0]
          const props = node.data.properties || {}
          mockResources.push({
            id: crypto.randomUUID(),
            resourceName: node.data.label || node.data.resourceType,
            resourceType: node.data.resourceType,
            provider: node.data.provider,
            driftType: 'MODIFIED',
            severity: 'CRITICAL',
            propertyChanges: [
              {
                property: 'instance_type',
                expectedValue: props.instance_type || 't3.micro',
                actualValue: 't3.medium',
                changeType: 'UPDATED',
              },
              {
                property: 'storage_gb',
                expectedValue: String(props.storage_gb || '20'),
                actualValue: '50',
                changeType: 'UPDATED',
              },
            ],
            detectedAt: now,
            status: 'DETECTED',
            nodeId: node.id,
          })

          if (canvasNodes.length > 1) {
            const node2 = canvasNodes[1]
            mockResources.push({
              id: crypto.randomUUID(),
              resourceName: node2.data.label || node2.data.resourceType,
              resourceType: node2.data.resourceType,
              provider: node2.data.provider,
              driftType: 'REMOVED',
              severity: 'CRITICAL',
              propertyChanges: [
                {
                  property: 'status',
                  expectedValue: 'running',
                  actualValue: 'NÃO ENCONTRADO',
                  changeType: 'DELETED',
                },
              ],
              detectedAt: now,
              status: 'DETECTED',
              nodeId: node2.id,
            })
          }
        } else {
          mockResources.push({
            id: crypto.randomUUID(),
            resourceName: 'web-server-01',
            resourceType: 'aws_instance',
            provider: 'aws',
            driftType: 'MODIFIED',
            severity: 'CRITICAL',
            propertyChanges: [
              { property: 'instance_type', expectedValue: 't3.micro', actualValue: 't3.medium', changeType: 'UPDATED' },
              { property: 'storage_gb', expectedValue: '20', actualValue: '50', changeType: 'UPDATED' },
            ],
            detectedAt: now,
            status: 'DETECTED',
          })
          mockResources.push({
            id: crypto.randomUUID(),
            resourceName: 'app-db',
            resourceType: 'aws_db_instance',
            provider: 'aws',
            driftType: 'REMOVED',
            severity: 'CRITICAL',
            propertyChanges: [
              { property: 'status', expectedValue: 'running', actualValue: 'NÃO ENCONTRADO', changeType: 'DELETED' },
            ],
            detectedAt: now,
            status: 'DETECTED',
          })
          mockResources.push({
            id: crypto.randomUUID(),
            resourceName: 'security-group-api',
            resourceType: 'aws_security_group',
            provider: 'aws',
            driftType: 'MODIFIED',
            severity: 'MODERATE',
            propertyChanges: [
              { property: 'ingress_port', expectedValue: '443', actualValue: '8443', changeType: 'UPDATED' },
            ],
            detectedAt: now,
            status: 'DETECTED',
          })
          mockResources.push({
            id: crypto.randomUUID(),
            resourceName: 'redis-cache',
            resourceType: 'aws_elasticache_cluster',
            provider: 'aws',
            driftType: 'ADDED',
            severity: 'INFO',
            propertyChanges: [
              { property: 'node_type', expectedValue: '—', actualValue: 'cache.t3.small', changeType: 'CREATED' },
            ],
            detectedAt: now,
            status: 'DETECTED',
          })
        }

        const report: DriftReport = {
          id: crypto.randomUUID(),
          environmentId: 'production',
          canvasId: canvas.canvasId || 'unknown',
          canvasVersion: canvas.canvasVersion,
          resources: mockResources,
          summary: buildSummary(mockResources),
          detectedAt: now,
          resolvedAt: null,
          status: 'DETECTED',
        }

        set((state) => ({
          reports: [report, ...state.reports],
        }))
      },

      startPeriodicDetection: (intervalMs = 30000) => {
        const existing = get().detectionInterval
        if (existing) clearInterval(existing)
        const id = window.setInterval(() => {
          get().simulateDriftDetection()
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
    }),
    {
      name: 'cloudbuilder-drift-store',
      partialize: (state) => ({ reports: state.reports }),
    }
  )
)
