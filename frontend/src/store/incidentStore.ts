import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { nanoid } from 'nanoid'

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

interface IncidentState {
  fixHistory: FixHistoryEntry[]
  autoFixEnabled: boolean

  addFixHistory: (entry: Omit<FixHistoryEntry, 'id' | 'appliedAt'>) => FixHistoryEntry
  markDeployed: (fixId: string) => void
  markResult: (fixId: string, result: FixHistoryEntry['result']) => void
  getFixesByIncident: (incidentId: string) => FixHistoryEntry[]
  toggleAutoFix: () => void
  clearHistory: () => void
}

export const useIncidentStore = create<IncidentState>()(
  persist(
    (set, get) => ({
      fixHistory: [],
      autoFixEnabled: false,

      addFixHistory: (entry) => {
        const newEntry: FixHistoryEntry = {
          ...entry,
          id: nanoid(),
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
    }),
    {
      name: 'cloudbuilder-incident-store',
    }
  )
)
