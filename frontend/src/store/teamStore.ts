import { create } from 'zustand'
import { orgApi, type Team } from '@/api/organizations'

interface TeamState {
  teams: Team[]
  isLoading: boolean
  error: string | null

  loadTeams: (organizationId: string) => Promise<void>
  createTeam: (organizationId: string, name: string, description: string) => Promise<Team>
  updateTeam: (organizationId: string, teamId: string, name?: string, description?: string) => Promise<void>
  deleteTeam: (organizationId: string, teamId: string) => Promise<void>
  clearError: () => void
}

export const useTeamStore = create<TeamState>()((set) => ({
  teams: [],
  isLoading: false,
  error: null,

  loadTeams: async (organizationId: string) => {
    set({ isLoading: true, error: null })
    try {
      const teams = await orgApi.listTeams(organizationId)
      set({ teams, isLoading: false })
    } catch (err: any) {
      set({ isLoading: false, error: err?.message || 'Falha ao carregar squads' })
    }
  },

  createTeam: async (organizationId: string, name: string, description: string) => {
    set({ isLoading: true, error: null })
    try {
      const team = await orgApi.createTeam(organizationId, name, description)
      set(state => ({
        teams: [...state.teams, team],
        isLoading: false,
      }))
      return team
    } catch (err: any) {
      set({ isLoading: false, error: err?.message || 'Falha ao criar squad' })
      throw err
    }
  },

  updateTeam: async (organizationId: string, teamId: string, name?: string, description?: string) => {
    set({ isLoading: true, error: null })
    try {
      const updated = await orgApi.updateTeam(organizationId, teamId, name, description)
      set(state => ({
        teams: state.teams.map(t => t.id === teamId ? updated : t),
        isLoading: false,
      }))
    } catch (err: any) {
      set({ isLoading: false, error: err?.message || 'Falha ao atualizar squad' })
      throw err
    }
  },

  deleteTeam: async (organizationId: string, teamId: string) => {
    set({ isLoading: true, error: null })
    try {
      await orgApi.deleteTeam(organizationId, teamId)
      set(state => ({
        teams: state.teams.filter(t => t.id !== teamId),
        isLoading: false,
      }))
    } catch (err: any) {
      set({ isLoading: false, error: err?.message || 'Falha ao excluir squad' })
      throw err
    }
  },

  clearError: () => set({ error: null }),
}))
