import { create } from 'zustand'
import type { AppDeployment, AppDeployStatus, CiProvider, DeployTargetType } from '@/types/deploy.types'
import { api } from '@/api/client'
import { eventBus } from '@/shared/event-bus'

// ─── API DTOs ─────────────────────────────────────────────────────────────

interface DeploymentDTO {
  id: string
  tenantId: string
  environmentId: string
  repoId: string
  appName: string
  appType: AppDeployment['appType']
  infraStackId: string
  status: AppDeployStatus
  url: string | null
  pipelineYaml: string | null
  ciProvider: CiProvider | null
  targetType: DeployTargetType
  version: string
  deployedAt: string | null
  lastHealthCheck: string | null
  healthStatus: AppDeployment['healthStatus']
  createdAt: string
  updatedAt: string
}

interface CreateDeploymentRequest {
  environmentId: string
  repoId: string
  appName: string
  appType: AppDeployment['appType'] | null
  infraStackId: string
  targetType: DeployTargetType
  version: string
}

interface DeployState {
  appDeployments: AppDeployment[]
  loading: boolean
  error: string | null

  // API-backed actions
  fetchDeployments: (environmentId: string) => Promise<void>
  createDeployment: (request: CreateDeploymentRequest) => Promise<AppDeployment | null>
  rollbackDeployment: (id: string) => Promise<void>

  // Local actions (kept for backward compatibility)
  addAppDeployment: (dep: Omit<AppDeployment, 'id' | 'createdAt' | 'status' | 'url' | 'pipelineYaml' | 'ciProvider' | 'deployedAt' | 'lastHealthCheck' | 'healthStatus'>) => AppDeployment
  updateAppDeployment: (id: string, updates: Partial<AppDeployment>) => void
  removeAppDeployment: (id: string) => void
  getAppDeploymentsByEnv: (envId: string) => AppDeployment[]
  getAppDeploymentsByRepo: (repoId: string) => AppDeployment[]
  setDeployStatus: (id: string, status: AppDeployStatus, url?: string | null) => void
  handleDeploymentEvent: (event: { type: string; payload?: { deploymentId: string; status: string; environmentId: string } }) => void
}

export const useDeployStore = create<DeployState>()(
  (set, get) => ({
      appDeployments: [],
      loading: false,
      error: null,

      // ─── API-backed actions ───────────────────────────────

      fetchDeployments: async (environmentId: string) => {
        set({ loading: true, error: null })
        try {
          const data = await api.get<DeploymentDTO[]>(
            `/deployments?environmentId=${encodeURIComponent(environmentId)}`
          )
          const deployments: AppDeployment[] = data.map((dto) => ({
            id: dto.id,
            repoId: dto.repoId,
            appName: dto.appName,
            appType: dto.appType,
            environmentId: dto.environmentId,
            infraStackId: dto.infraStackId,
            status: dto.status,
            url: dto.url,
            pipelineYaml: dto.pipelineYaml,
            ciProvider: dto.ciProvider,
            targetType: dto.targetType,
            version: dto.version,
            deployedAt: dto.deployedAt,
            lastHealthCheck: dto.lastHealthCheck,
            healthStatus: dto.healthStatus,
            createdAt: dto.createdAt,
          }))
          set({ appDeployments: deployments, loading: false })
        } catch {
          set({ loading: false, appDeployments: [] })
        }
      },

      createDeployment: async (request) => {
        set({ loading: true, error: null })
        try {
          const dto = await api.post<DeploymentDTO>('/deployments', request)
          const newDep: AppDeployment = {
            id: dto.id,
            repoId: dto.repoId,
            appName: dto.appName,
            appType: dto.appType,
            environmentId: dto.environmentId,
            infraStackId: dto.infraStackId,
            status: dto.status,
            url: dto.url,
            pipelineYaml: dto.pipelineYaml,
            ciProvider: dto.ciProvider,
            targetType: dto.targetType,
            version: dto.version,
            deployedAt: dto.deployedAt,
            lastHealthCheck: dto.lastHealthCheck,
            healthStatus: dto.healthStatus,
            createdAt: dto.createdAt,
          }
          set((state) => ({ appDeployments: [...state.appDeployments, newDep], loading: false }))
          return newDep
        } catch {
          set({ loading: false })
          return null
        }
      },

      rollbackDeployment: async (id) => {
        set({ loading: true, error: null })
        try {
          const dto = await api.post<DeploymentDTO>(`/deployments/${id}/rollback`)
          set((state) => ({
            appDeployments: state.appDeployments.map((d) =>
              d.id === id ? { ...d, status: dto.status, deployedAt: dto.deployedAt, updatedAt: dto.updatedAt } : d
            ),
            loading: false,
          }))
        } catch {
          set({ loading: false })
        }
      },

      // ─── Reactive event handling (SSE from useEventStream) ──

      handleDeploymentEvent: (event) => {
        const payload = event.payload
        if (!payload?.deploymentId) return
        const status = payload.status?.toLowerCase() as AppDeployStatus | undefined
        if (status && ['pending', 'running', 'success', 'failed'].includes(status)) {
          get().setDeployStatus(payload.deploymentId, status)
        }
      },

      // ─── Local actions (kept for backward compatibility) ──

      addAppDeployment: (dep) => {
        const now = new Date().toISOString()
        const newDep: AppDeployment = {
          ...dep,
          id: crypto.randomUUID(),
          status: 'pending',
          url: null,
          pipelineYaml: null,
          ciProvider: null,
          deployedAt: null,
          lastHealthCheck: null,
          healthStatus: null,
          createdAt: now,
        }
        set((state) => ({ appDeployments: [...state.appDeployments, newDep] }))
        return newDep
      },

      updateAppDeployment: (id, updates) => {
        set((state) => ({
          appDeployments: state.appDeployments.map((d) =>
            d.id === id ? { ...d, ...updates } : d
          ),
        }))
      },

      removeAppDeployment: (id) => {
        set((state) => ({
          appDeployments: state.appDeployments.filter((d) => d.id !== id),
        }))
      },

      getAppDeploymentsByEnv: (envId) => {
        return get().appDeployments.filter((d) => d.environmentId === envId)
      },

      getAppDeploymentsByRepo: (repoId) => {
        return get().appDeployments.filter((d) => d.repoId === repoId)
      },

      setDeployStatus: (id, status, url) => {
        const now = new Date().toISOString()
        const updates: Partial<AppDeployment> = { status }
        if (status === 'success' || status === 'running') {
          updates.deployedAt = now
        }
        if (url !== undefined) {
          updates.url = url
        }
        if (status === 'success') {
          updates.healthStatus = 'healthy'
          updates.lastHealthCheck = now
        }
        set((state) => ({
          appDeployments: state.appDeployments.map((d) =>
            d.id === id ? { ...d, ...updates } : d
          ),
        }))
      },
    })
)

// ─── EventBus subscriptions (architectural consistency) ─────────────
// SSE events flow through EventBus → stores react here
eventBus.subscribe('deployment:started', (payload) => {
  if (payload.deploymentId) {
    useDeployStore.getState().setDeployStatus(payload.deploymentId, 'running')
  }
})
eventBus.subscribe('deployment:succeeded', (payload) => {
  if (payload.deploymentId) {
    useDeployStore.getState().setDeployStatus(payload.deploymentId, 'success')
  }
})
eventBus.subscribe('deployment:failed', (payload) => {
  if (payload.deploymentId) {
    useDeployStore.getState().setDeployStatus(payload.deploymentId, 'failed')
  }
})
