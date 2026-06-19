import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppDeployment, AppDeployStatus, CiProvider, DeployTargetType } from '@/types/deploy.types'

interface DeployState {
  appDeployments: AppDeployment[]

  addAppDeployment: (dep: Omit<AppDeployment, 'id' | 'createdAt' | 'status' | 'url' | 'pipelineYaml' | 'ciProvider' | 'deployedAt' | 'lastHealthCheck' | 'healthStatus'>) => AppDeployment
  updateAppDeployment: (id: string, updates: Partial<AppDeployment>) => void
  removeAppDeployment: (id: string) => void
  getAppDeploymentsByEnv: (envId: string) => AppDeployment[]
  getAppDeploymentsByRepo: (repoId: string) => AppDeployment[]
  setDeployStatus: (id: string, status: AppDeployStatus, url?: string | null) => void
}

export const useDeployStore = create<DeployState>()(
  persist(
    (set, get) => ({
      appDeployments: [],

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
    }),
    {
      name: 'cloudbuilder-app-deployments',
    }
  )
)
