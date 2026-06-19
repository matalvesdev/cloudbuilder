import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ProviderCredential, Environment, Provider, ProviderCredentialStatus, Deployment } from '@/types/settings.types'

interface CredentialState {
  credentials: ProviderCredential[]
  environments: Environment[]
  deployments: Deployment[]

  // Credential actions
  addCredential: (cred: Omit<ProviderCredential, 'id' | 'maskedSecret' | 'status' | 'lastTestedAt' | 'createdAt' | 'updatedAt'>) => void
  updateCredential: (id: string, updates: Partial<ProviderCredential>) => void
  removeCredential: (id: string) => void
  testCredential: (id: string) => Promise<boolean>
  getCredentialById: (id: string) => ProviderCredential | undefined

  // Environment actions
  addEnvironment: (env: Omit<Environment, 'id' | 'status' | 'canvasVersion' | 'createdAt' | 'updatedAt'>) => void
  updateEnvironment: (id: string, updates: Partial<Environment>) => void
  removeEnvironment: (id: string) => void
  getEnvironmentById: (id: string) => Environment | undefined

  // Deployment actions
  addDeployment: (dep: Omit<Deployment, 'id'>) => void
  updateDeployment: (id: string, updates: Partial<Deployment>) => void
  getDeploymentsByEnvironment: (envId: string) => Deployment[]
}

export const useCredentialStore = create<CredentialState>()(
  persist(
    (set, get) => ({
      credentials: [],
      environments: [],
      deployments: [],

      // ─── Credential actions ───

      addCredential: (cred) => {
        const now = new Date().toISOString()
        const maskedSecret = `****${cred.secret.slice(-4)}`
        const newCred: ProviderCredential = {
          ...cred,
          id: crypto.randomUUID(),
          maskedSecret,
          status: 'unknown' as ProviderCredentialStatus,
          lastTestedAt: null,
          createdAt: now,
          updatedAt: now,
        }
        set((state) => ({ credentials: [...state.credentials, newCred] }))
      },

      updateCredential: (id, updates) => {
        set((state) => ({
          credentials: state.credentials.map((c) =>
            c.id === id ? { ...c, ...updates, secret: updates.secret || c.secret, updatedAt: new Date().toISOString() } : c
          ),
        }))
      },

      removeCredential: (id) => {
        set((state) => ({
          credentials: state.credentials.filter((c) => c.id !== id),
          environments: state.environments.map((e) =>
            e.credentialId === id ? { ...e, credentialId: '' } : e
          ),
        }))
      },

      testCredential: async (id) => {
        const cred = get().credentials.find((c) => c.id === id)
        if (!cred) return false

        // Simulate connection test — in production this calls the backend
        const success = await new Promise<boolean>((resolve) => {
          setTimeout(() => resolve(true), 1500)
        })

        set((state) => ({
          credentials: state.credentials.map((c) =>
            c.id === id
              ? { ...c, status: success ? 'valid' : 'invalid', lastTestedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
              : c
          ),
        }))

        return success
      },

      getCredentialById: (id) => get().credentials.find((c) => c.id === id),

      // ─── Environment actions ───

      addEnvironment: (env) => {
        const now = new Date().toISOString()
        const newEnv: Environment = {
          ...env,
          id: crypto.randomUUID(),
          status: 'PENDING',
          canvasVersion: 1,
          createdAt: now,
          updatedAt: now,
        }
        set((state) => ({ environments: [...state.environments, newEnv] }))
      },

      updateEnvironment: (id, updates) => {
        set((state) => ({
          environments: state.environments.map((e) =>
            e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e
          ),
        }))
      },

      removeEnvironment: (id) => {
        set((state) => ({
          environments: state.environments.filter((e) => e.id !== id),
        }))
      },

      getEnvironmentById: (id) => get().environments.find((e) => e.id === id),

      // ─── Deployment actions ───

      addDeployment: (dep) => {
        const newDep: Deployment = {
          ...dep,
          id: crypto.randomUUID(),
        }
        set((state) => ({ deployments: [...state.deployments, newDep] }))
      },

      updateDeployment: (id, updates) => {
        set((state) => ({
          deployments: state.deployments.map((d) =>
            d.id === id ? { ...d, ...updates } : d
          ),
        }))
      },

      getDeploymentsByEnvironment: (envId) => {
        return get().deployments.filter((d) => d.environmentId === envId)
      },
    }),
    {
      name: 'cloudbuilder-credentials',
      partialize: (state) => ({
        credentials: state.credentials.map(({ secret, ...rest }) => ({ ...rest, secret: '' })),
        environments: state.environments,
        deployments: state.deployments,
      }),
    }
  )
)
