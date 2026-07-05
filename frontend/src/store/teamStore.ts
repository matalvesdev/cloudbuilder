import { create } from 'zustand'
import {
  listTeams, createTeam, updateTeam, deleteTeam,
  listSquads, createSquad, updateSquad, deleteSquad, listSquadsByWorkspace,
  listMembersByTeam,
  type Team, type Squad, type MembershipDTO,
} from '@/api/teams'

interface TeamState {
  teams: Team[]
  squads: Squad[]
  members: MembershipDTO[]
  selectedTeamId: string | null
  loading: boolean
  error: string | null

  loadTeams: (orgId: string) => Promise<void>
  loadSquads: (orgId: string, workspaceId?: string) => Promise<void>
  loadMembersByTeam: (orgId: string, teamId: string) => Promise<void>
  createTeamAction: (orgId: string, name: string, description: string) => Promise<Team | null>
  updateTeamAction: (orgId: string, id: string, name?: string, description?: string) => Promise<Team | null>
  deleteTeamAction: (orgId: string, id: string) => Promise<boolean>
  createSquadAction: (orgId: string, workspaceId: string, name: string, description: string, leadId?: string) => Promise<Squad | null>
  updateSquadAction: (orgId: string, id: string, name?: string, description?: string, leadId?: string) => Promise<Squad | null>
  deleteSquadAction: (orgId: string, id: string) => Promise<boolean>
  selectTeam: (id: string | null) => void
  clearError: () => void
}

export const useTeamStore = create<TeamState>()((set, get) => ({
  teams: [],
  squads: [],
  members: [],
  selectedTeamId: null,
  loading: false,
  error: null,

  loadTeams: async (orgId) => {
    set({ loading: true, error: null })
    try {
      const teams = await listTeams(orgId)
      set({ teams, loading: false })
    } catch (err) {
      set({ error: (err as Error).message || 'Erro ao carregar times', loading: false })
    }
  },

  loadSquads: async (orgId, workspaceId) => {
    set({ loading: true, error: null })
    try {
      const squads = workspaceId
        ? await listSquadsByWorkspace(orgId, workspaceId)
        : await listSquads(orgId)
      set({ squads, loading: false })
    } catch (err) {
      set({ error: (err as Error).message || 'Erro ao carregar squads', loading: false })
    }
  },

  loadMembersByTeam: async (orgId, teamId) => {
    set({ loading: true, error: null })
    try {
      const members = await listMembersByTeam(orgId, teamId)
      set({ members, loading: false })
    } catch (err) {
      set({ error: (err as Error).message || 'Erro ao carregar membros', loading: false })
    }
  },

  createTeamAction: async (orgId, name, description) => {
    set({ error: null })
    try {
      const team = await createTeam(orgId, { name, description })
      set((s) => ({ teams: [...s.teams, team] }))
      return team
    } catch (err) {
      set({ error: (err as Error).message || 'Erro ao criar time' })
      return null
    }
  },

  updateTeamAction: async (orgId, id, name, description) => {
    set({ error: null })
    try {
      const team = await updateTeam(orgId, id, { name, description })
      set((s) => ({ teams: s.teams.map((t) => (t.id === id ? team : t)) }))
      return team
    } catch (err) {
      set({ error: (err as Error).message || 'Erro ao atualizar time' })
      return null
    }
  },

  deleteTeamAction: async (orgId, id) => {
    set({ error: null })
    try {
      await deleteTeam(orgId, id)
      set((s) => ({
        teams: s.teams.filter((t) => t.id !== id),
        selectedTeamId: s.selectedTeamId === id ? null : s.selectedTeamId,
      }))
      return true
    } catch (err) {
      set({ error: (err as Error).message || 'Erro ao excluir time' })
      return false
    }
  },

  createSquadAction: async (orgId, workspaceId, name, description, leadId) => {
    set({ error: null })
    try {
      const squad = await createSquad(orgId, { workspaceId, name, description, leadId })
      set((s) => ({ squads: [...s.squads, squad] }))
      return squad
    } catch (err) {
      set({ error: (err as Error).message || 'Erro ao criar squad' })
      return null
    }
  },

  updateSquadAction: async (orgId, id, name, description, leadId) => {
    set({ error: null })
    try {
      const squad = await updateSquad(orgId, id, { name, description, leadId })
      set((s) => ({ squads: s.squads.map((sq) => (sq.id === id ? squad : sq)) }))
      return squad
    } catch (err) {
      set({ error: (err as Error).message || 'Erro ao atualizar squad' })
      return null
    }
  },

  deleteSquadAction: async (orgId, id) => {
    set({ error: null })
    try {
      await deleteSquad(orgId, id)
      set((s) => ({ squads: s.squads.filter((sq) => sq.id !== id) }))
      return true
    } catch (err) {
      set({ error: (err as Error).message || 'Erro ao excluir squad' })
      return false
    }
  },

  selectTeam: (id) => set({ selectedTeamId: id }),
  clearError: () => set({ error: null }),
}))
