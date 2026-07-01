import { create } from 'zustand'
import { orgApi, type Project } from '@/api/organizations'

interface ProjectState {
  projects: Project[]
  currentProject: Project | null
  isLoading: boolean
  error: string | null

  loadProjects: (organizationId: string) => Promise<void>
  selectProject: (id: string) => void
  createProject: (organizationId: string, name: string, description: string) => Promise<Project>
  updateProject: (organizationId: string, projectId: string, name?: string, description?: string) => Promise<void>
  deleteProject: (organizationId: string, projectId: string) => Promise<void>
  clearError: () => void
}

export const useProjectStore = create<ProjectState>()((set, get) => ({
  projects: [],
  currentProject: null,
  isLoading: false,
  error: null,

  loadProjects: async (organizationId: string) => {
    set({ isLoading: true, error: null })
    try {
      const projects = await orgApi.listProjects(organizationId)
      set({ projects, isLoading: false })
      if (projects.length === 1 && !get().currentProject) {
        set({ currentProject: projects[0] })
      }
    } catch (err: any) {
      set({ isLoading: false, error: err?.message || 'Falha ao carregar projetos' })
    }
  },

  selectProject: (id: string) => {
    const project = get().projects.find(p => p.id === id) || null
    set({ currentProject: project })
  },

  createProject: async (organizationId: string, name: string, description: string) => {
    set({ isLoading: true, error: null })
    try {
      const project = await orgApi.createProject(organizationId, name, description)
      set(state => ({
        projects: [...state.projects, project],
        currentProject: project,
        isLoading: false,
      }))
      return project
    } catch (err: any) {
      set({ isLoading: false, error: err?.message || 'Falha ao criar projeto' })
      throw err
    }
  },

  updateProject: async (organizationId: string, projectId: string, name?: string, description?: string) => {
    set({ isLoading: true, error: null })
    try {
      const updated = await orgApi.updateProject(organizationId, projectId, name, description)
      set(state => ({
        projects: state.projects.map(p => p.id === projectId ? updated : p),
        currentProject: state.currentProject?.id === projectId ? updated : state.currentProject,
        isLoading: false,
      }))
    } catch (err: any) {
      set({ isLoading: false, error: err?.message || 'Falha ao atualizar projeto' })
      throw err
    }
  },

  deleteProject: async (organizationId: string, projectId: string) => {
    set({ isLoading: true, error: null })
    try {
      await orgApi.deleteProject(organizationId, projectId)
      set(state => ({
        projects: state.projects.filter(p => p.id !== projectId),
        currentProject: state.currentProject?.id === projectId ? null : state.currentProject,
        isLoading: false,
      }))
    } catch (err: any) {
      set({ isLoading: false, error: err?.message || 'Falha ao excluir projeto' })
      throw err
    }
  },

  clearError: () => set({ error: null }),
}))
