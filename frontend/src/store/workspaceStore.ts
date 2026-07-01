import { create } from 'zustand'
import { api } from '@/api/client'
import type { Workspace } from '@/api/organizations'

interface WorkspaceState {
  workspaces: Workspace[]
  currentWorkspace: Workspace | null
  isLoading: boolean
  error: string | null

  loadWorkspaces: (organizationId: string) => Promise<void>
  selectWorkspace: (id: string) => void
  createWorkspace: (organizationId: string, name: string, description: string) => Promise<Workspace>
  updateWorkspace: (workspaceId: string, name?: string, description?: string, settings?: string) => Promise<void>
  deleteWorkspace: (organizationId: string, workspaceId: string) => Promise<void>
  clearError: () => void
}

export const useWorkspaceStore = create<WorkspaceState>()((set, get) => ({
  workspaces: [],
  currentWorkspace: null,
  isLoading: false,
  error: null,

  loadWorkspaces: async (organizationId: string) => {
    set({ isLoading: true, error: null })
    try {
      const workspaces = await api.get<Workspace[]>(`/organizations/${organizationId}/workspaces`)
      set({ workspaces, isLoading: false })
      if (workspaces.length === 1 && !get().currentWorkspace) {
        set({ currentWorkspace: workspaces[0] })
      }
    } catch (err: any) {
      set({ isLoading: false, error: err?.message || 'Falha ao carregar workspaces' })
    }
  },

  selectWorkspace: (id: string) => {
    const workspace = get().workspaces.find(w => w.id === id) || null
    set({ currentWorkspace: workspace })
  },

  createWorkspace: async (organizationId: string, name: string, description: string) => {
    set({ isLoading: true, error: null })
    try {
      const workspace = await api.post<Workspace>(`/organizations/${organizationId}/workspaces`, { name, description })
      set(state => ({
        workspaces: [...state.workspaces, workspace],
        currentWorkspace: workspace,
        isLoading: false,
      }))
      return workspace
    } catch (err: any) {
      set({ isLoading: false, error: err?.message || 'Falha ao criar workspace' })
      throw err
    }
  },

  updateWorkspace: async (workspaceId: string, name?: string, description?: string, settings?: string) => {
    set({ isLoading: true, error: null })
    try {
      const updated = await api.put<Workspace>(`/organizations/0/workspaces/${workspaceId}`, { name, description, settings })
      set(state => ({
        workspaces: state.workspaces.map(w => w.id === workspaceId ? updated : w),
        currentWorkspace: state.currentWorkspace?.id === workspaceId ? updated : state.currentWorkspace,
        isLoading: false,
      }))
    } catch (err: any) {
      set({ isLoading: false, error: err?.message || 'Falha ao atualizar workspace' })
      throw err
    }
  },

  deleteWorkspace: async (organizationId: string, workspaceId: string) => {
    set({ isLoading: true, error: null })
    try {
      await api.delete(`/organizations/${organizationId}/workspaces/${workspaceId}`)
      set(state => ({
        workspaces: state.workspaces.filter(w => w.id !== workspaceId),
        currentWorkspace: state.currentWorkspace?.id === workspaceId ? null : state.currentWorkspace,
        isLoading: false,
      }))
    } catch (err: any) {
      set({ isLoading: false, error: err?.message || 'Falha ao excluir workspace' })
      throw err
    }
  },

  clearError: () => set({ error: null }),
}))
