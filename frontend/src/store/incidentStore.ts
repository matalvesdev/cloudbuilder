import { create } from 'zustand'
import { aiopsApi } from '@/api/aiops'

export interface ResourceModification {
  nodeId: string
  nodeLabel: string
  property: string
  oldValue: any
  newValue: any
}

export interface FixHistoryEntry {
  id: string
  incidentId: string
  incidentTitle: string
  fixDescription: string
  modifications: ResourceModification[]
  appliedAt: string
  deployedAt: string | null
  result: 'pending' | 'success' | 'failed' | 'rolled-back'
  autoFix: boolean
}

export interface BackendIncident {
  id: string
  title?: string
  description?: string
  severity?: string
  status?: string
  environmentId?: string
  detectedAt?: string
  resolvedAt?: string | null
}

interface IncidentState {
  fixHistory: FixHistoryEntry[]
  autoFixEnabled: boolean
  incidents: BackendIncident[]
  loading: boolean
  error: string | null

  addFixHistory: (entry: Omit<FixHistoryEntry, 'id' | 'appliedAt'>) => FixHistoryEntry
  markDeployed: (fixId: string) => void
  markResult: (fixId: string, result: FixHistoryEntry['result']) => void
  getFixesByIncident: (incidentId: string) => FixHistoryEntry[]
  toggleAutoFix: () => void
  clearHistory: () => void
  fetchIncidents: (environmentId: string) => Promise<void>
  analyzeIncident: (incidentId: string) => Promise<any | null>
  resolveIncident: (incidentId: string) => Promise<any | null>
}

export const useIncidentStore = create<IncidentState>()(
  (set, get) => ({
    fixHistory: [],
    autoFixEnabled: false,
    incidents: [],
    loading: false,
    error: null,

    addFixHistory: (entry) => {
      const newEntry: FixHistoryEntry = {
        ...entry,
        id: crypto.randomUUID(),
        appliedAt: new Date().toISOString(),
      }
      set((state) => ({ fixHistory: [...state.fixHistory, newEntry] }))
      return newEntry
    },

    markDeployed: (fixId) => {
      set((state) => ({
        fixHistory: state.fixHistory.map((f) =>
          f.id === fixId ? { ...f, deployedAt: new Date().toISOString() } : f
        ),
      }))
    },

    markResult: (fixId, result) => {
      set((state) => ({
        fixHistory: state.fixHistory.map((f) =>
          f.id === fixId ? { ...f, result } : f
        ),
      }))
    },

    getFixesByIncident: (incidentId) => {
      return get().fixHistory.filter((f) => f.incidentId === incidentId)
    },

    toggleAutoFix: () => {
      set((state) => ({ autoFixEnabled: !state.autoFixEnabled }))
    },

    clearHistory: () => {
      set({ fixHistory: [] })
    },

    fetchIncidents: async (environmentId: string) => {
      set({ loading: true, error: null })
      try {
        const data = await aiopsApi.getIncidents(environmentId)
        if (Array.isArray(data)) {
          set({ incidents: data as BackendIncident[], loading: false })
        } else {
          set({ loading: false })
        }
      } catch (err) {
        const msg = err && typeof err === 'object' && 'message' in err
          ? (err as { message: string }).message
          : 'Erro ao carregar incidentes'
        set({ error: msg, loading: false })
      }
    },

    analyzeIncident: async (incidentId: string) => {
      try {
        return await aiopsApi.analyzeIncident(incidentId)
      } catch {
        return null
      }
    },

    resolveIncident: async (incidentId: string) => {
      try {
        return await aiopsApi.resolveIncident(incidentId)
      } catch {
        return null
      }
    },
  })
)
