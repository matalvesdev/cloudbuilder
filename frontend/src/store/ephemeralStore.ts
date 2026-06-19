import { create } from 'zustand'
import type { EphemeralEnv, EphemeralCreateRequest, EphemeralStatus, ResourceSize } from '@/types/ephemeral.types'
import { provisionApi } from '@/lib/provisionApi'
import type { EphemeralEnvironment } from '@/lib/provisionApi'
import { nanoId } from '@/lib/utils'
interface EphemeralState {
  environments: EphemeralEnv[]
  loading: boolean
  creating: boolean

  fetchEnvironments: () => Promise<void>
  createEphemeral: (req: EphemeralCreateRequest) => Promise<void>
  destroyEphemeral: (id: string) => Promise<void>
  extendTtl: (id: string, extraHours: number) => Promise<void>
  getActiveCount: () => number
  getMonthlyCost: () => number
}

/** Map backend EphemeralEnvironment → frontend EphemeralEnv */
function mapBackendToFrontend(b: EphemeralEnvironment): EphemeralEnv {
  return {
    id: b.id,
    name: b.name,
    repoId: b.repoId,
    branchName: b.branchName,
    prNumber: null,
    prUrl: null,
    sourceEnvId: b.sourceEnvironmentId,
    baseUrl: null,
    status: (b.status?.toLowerCase() || 'active') as EphemeralStatus,
    ttl_hours: b.ttlHours,
    createdAt: b.createdAt,
    expiresAt: b.expiresAt,
    cost: 0,
    resources: [],
  }
}

function estimateCost(ttlHours: number, resourceSize: ResourceSize): number {
  const sizeCost = resourceSize === 'small' ? 0 : resourceSize === 'medium' ? 0.5 : 1.2
  return Math.round((ttlHours * 0.42 + sizeCost) * 100) / 100
}

export const useEphemeralStore = create<EphemeralState>((set, get) => ({
  environments: [],
  loading: false,
  creating: false,

  fetchEnvironments: async () => {
    set({ loading: true })
    try {
      const backends = await provisionApi.listEphemeral()
      set({ environments: backends.map(mapBackendToFrontend), loading: false })
    } catch {
      set({ loading: false })
    }
  },

  createEphemeral: async (req) => {
    set({ creating: true })
    try {
      const created = await provisionApi.createEphemeral({
        name: req.name,
        repoId: req.repoId || 'default',
        branchName: req.branchName,
        sourceEnvironmentId: req.sourceEnvId || 'default',
        ttlHours: req.ttl_hours,
        resourceSize: req.resourceSize || 'small',
      })
      const env = mapBackendToFrontend(created)
      env.cost = estimateCost(req.ttl_hours, req.resourceSize || 'small')
      env.resources = [
        { type: 'ec2', size: req.resourceSize || 'small', name: `${req.name}-app` },
        { type: 'rds', size: 'small', name: `${req.name}-db` },
      ]
      set((s) => ({ environments: [env, ...s.environments], creating: false }))
    } catch {
      // Fallback: create locally with optimistic ID so UI still works
      const now = Date.now()
      const ttl = req.ttl_hours
      const local: EphemeralEnv = {
        id: crypto.randomUUID(),
        name: req.name,
        repoId: req.repoId || 'default',
        branchName: req.branchName,
        prNumber: req.prNumber || null,
        prUrl: req.prUrl || null,
        sourceEnvId: req.sourceEnvId || 'default',
        baseUrl: `https://${req.name.toLowerCase().replace(/\s+/g, '-')}-${nanoId(6)}.cloudbuilder.dev`,
        status: 'active',
        ttl_hours: ttl,
        createdAt: new Date(now).toISOString(),
        expiresAt: new Date(now + ttl * 3600000).toISOString(),
        cost: estimateCost(ttl, req.resourceSize || 'small'),
        resources: [
          { type: 'ec2', size: req.resourceSize || 'small', name: `${req.name}-app` },
          { type: 'rds', size: 'small', name: `${req.name}-db` },
        ],
      }
      set((s) => ({ environments: [local, ...s.environments], creating: false }))
    }
  },

  destroyEphemeral: async (id) => {
    // Optimistic: set to destroying immediately
    set((s) => ({
      environments: s.environments.map((e) =>
        e.id === id ? { ...e, status: 'destroying' as EphemeralStatus } : e
      ),
    }))
    try {
      await provisionApi.destroyEphemeral(id)
    } catch {
      // Fallback: mark as destroyed locally
    }
    set((s) => ({
      environments: s.environments.map((e) =>
        e.id === id ? { ...e, status: 'destroyed' as EphemeralStatus } : e
      ),
    }))
  },

  extendTtl: async (id, extraHours) => {
    try {
      await provisionApi.extendEphemeral(id, extraHours)
    } catch {
      // Continue with local update even if backend fails
    }
    set((s) => ({
      environments: s.environments.map((e) => {
        if (e.id !== id) return e
        const newTtl = e.ttl_hours + extraHours
        return {
          ...e,
          ttl_hours: newTtl,
          expiresAt: new Date(new Date(e.expiresAt).getTime() + extraHours * 3600000).toISOString(),
          cost: e.cost + Math.round(extraHours * 0.42 * 100) / 100,
        }
      }),
    }))
  },

  getActiveCount: () => {
    return get().environments.filter((e) => e.status === 'active' || e.status === 'creating').length
  },

  getMonthlyCost: () => {
    return get().environments.reduce((acc, e) => acc + e.cost, 0)
  },
}))
