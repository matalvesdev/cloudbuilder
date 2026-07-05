import { api } from './client'

export interface Team {
  id: string
  organizationId: string
  name: string
  description: string
  createdAt: string
  updatedAt: string
}

export interface Squad {
  id: string
  workspaceId: string
  tenantId: string
  name: string
  description: string
  leadId: string | null
  createdAt: string
}

export interface CreateTeamRequest {
  name: string
  description: string
}

export interface UpdateTeamRequest {
  name?: string
  description?: string
}

export interface CreateSquadRequest {
  workspaceId: string
  name: string
  description: string
  leadId?: string
}

export interface UpdateSquadRequest {
  name?: string
  description?: string
  leadId?: string
}

export interface MembershipDTO {
  id: string
  organizationId: string
  teamId: string | null
  userId: string
  role: string
  status: string
  invitedAt: string
  joinedAt: string
}

// ─── Teams ────────────────────────────────────────────────────────

export function listTeams(orgId: string): Promise<Team[]> {
  return api.get(`/organizations/${orgId}/teams`)
}

export function getTeam(orgId: string, id: string): Promise<Team> {
  return api.get(`/organizations/${orgId}/teams/${id}`)
}

export function createTeam(orgId: string, req: CreateTeamRequest): Promise<Team> {
  return api.post(`/organizations/${orgId}/teams`, req)
}

export function updateTeam(orgId: string, id: string, req: UpdateTeamRequest): Promise<Team> {
  return api.put(`/organizations/${orgId}/teams/${id}`, req)
}

export function deleteTeam(orgId: string, id: string): Promise<void> {
  return api.delete(`/organizations/${orgId}/teams/${id}`)
}

export function searchTeams(orgId: string, q: string): Promise<Team[]> {
  return api.get(`/organizations/${orgId}/teams/search?q=${encodeURIComponent(q)}`)
}

// ─── Squads ───────────────────────────────────────────────────────

export function listSquads(orgId: string): Promise<Squad[]> {
  return api.get(`/organizations/${orgId}/squads`)
}

export function getSquad(orgId: string, id: string): Promise<Squad> {
  return api.get(`/organizations/${orgId}/squads/${id}`)
}

export function createSquad(orgId: string, req: CreateSquadRequest): Promise<Squad> {
  return api.post(`/organizations/${orgId}/squads`, req)
}

export function updateSquad(orgId: string, id: string, req: UpdateSquadRequest): Promise<Squad> {
  return api.put(`/organizations/${orgId}/squads/${id}`, req)
}

export function deleteSquad(orgId: string, id: string): Promise<void> {
  return api.delete(`/organizations/${orgId}/squads/${id}`)
}

export function searchSquads(orgId: string, workspaceId: string, q: string): Promise<Squad[]> {
  return api.get(`/organizations/${orgId}/squads/search?workspaceId=${encodeURIComponent(workspaceId)}&q=${encodeURIComponent(q)}`)
}

export function listSquadsByWorkspace(orgId: string, workspaceId: string): Promise<Squad[]> {
  return api.get(`/organizations/${orgId}/squads/workspace/${workspaceId}`)
}

// ─── Team Members (via Membership API) ────────────────────────────

export function listMembersByTeam(orgId: string, teamId: string): Promise<MembershipDTO[]> {
  return api.get(`/organizations/${orgId}/members/team/${teamId}`)
}

export function assignToTeam(orgId: string, membershipId: string, teamId: string): Promise<MembershipDTO> {
  return api.post(`/organizations/${orgId}/members/${membershipId}/team`, { teamId })
}

export function removeFromTeam(orgId: string, membershipId: string): Promise<MembershipDTO> {
  return api.delete(`/organizations/${orgId}/members/${membershipId}/team`)
}

export const teamsApi = {
  listTeams, getTeam, createTeam, updateTeam, deleteTeam, searchTeams,
  listSquads, getSquad, createSquad, updateSquad, deleteSquad, searchSquads, listSquadsByWorkspace,
  listMembersByTeam, assignToTeam, removeFromTeam,
}
