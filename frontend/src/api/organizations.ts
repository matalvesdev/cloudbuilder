import { api } from './client'

// ─── Types ──────────────────────────────────────────────────────

export interface Organization {
  id: string
  name: string
  slug: string
  ownerId: string
  settings: string
  active: boolean
  memberCount: number
  createdAt: string
  updatedAt: string
}

export interface Team {
  id: string
  organizationId: string
  name: string
  description: string
  createdAt: string
  updatedAt: string
}

export interface Membership {
  id: string
  organizationId: string
  teamId: string | null
  userId: string
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST'
  status: 'ACTIVE' | 'INVITED' | 'DISABLED'
  invitedAt: string
  joinedAt: string | null
}

export interface Project {
  id: string
  organizationId: string
  name: string
  description: string
  settings: string
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface Workspace {
  id: string
  organizationId: string
  name: string
  description: string
  settings: string
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface Invitation {
  id: string
  organizationId: string
  email: string
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST'
  token: string
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED'
  invitedBy: string
  expiresAt: string
  acceptedAt: string | null
  createdAt: string
}

// ─── API Service ────────────────────────────────────────────────

class OrganizationApiService {
  // ── Organizations ──

  async listOrganizations(): Promise<Organization[]> {
    return api.get<Organization[]>('/organizations')
  }

  async getOrganization(id: string): Promise<Organization> {
    return api.get<Organization>(`/organizations/${id}`)
  }

  async getOrganizationBySlug(slug: string): Promise<Organization> {
    return api.get<Organization>(`/organizations/slug/${slug}`)
  }

  async createOrganization(name: string, slug: string): Promise<Organization> {
    return api.post<Organization>('/organizations', { name, slug })
  }

  async updateOrganization(id: string, name?: string, settings?: string): Promise<Organization> {
    return api.put<Organization>(`/organizations/${id}`, { name, settings })
  }

  async deactivateOrganization(id: string): Promise<Organization> {
    return api.post<Organization>(`/organizations/${id}/deactivate`)
  }

  async activateOrganization(id: string): Promise<Organization> {
    return api.post<Organization>(`/organizations/${id}/activate`)
  }

  async deleteOrganization(id: string): Promise<void> {
    return api.delete(`/organizations/${id}`)
  }

  // ── Teams ──

  async listTeams(organizationId: string): Promise<Team[]> {
    return api.get<Team[]>(`/organizations/${organizationId}/teams`)
  }

  async createTeam(organizationId: string, name: string, description: string): Promise<Team> {
    return api.post<Team>(`/organizations/${organizationId}/teams`, { name, description })
  }

  async updateTeam(organizationId: string, teamId: string, name?: string, description?: string): Promise<Team> {
    return api.put<Team>(`/organizations/${organizationId}/teams/${teamId}`, { name, description })
  }

  async deleteTeam(organizationId: string, teamId: string): Promise<void> {
    return api.delete(`/organizations/${organizationId}/teams/${teamId}`)
  }

  // ── Memberships ──

  async listMemberships(organizationId: string): Promise<Membership[]> {
    return api.get<Membership[]>(`/organizations/${organizationId}/memberships`)
  }

  async addMember(organizationId: string, userId: string, role: string): Promise<Membership> {
    return api.post<Membership>(`/organizations/${organizationId}/memberships`, { userId, role })
  }

  async updateMemberRole(organizationId: string, membershipId: string, role: string): Promise<Membership> {
    return api.put<Membership>(`/organizations/${organizationId}/memberships/${membershipId}`, { role })
  }

  async removeMember(organizationId: string, membershipId: string): Promise<void> {
    return api.delete(`/organizations/${organizationId}/memberships/${membershipId}`)
  }

  // ── Projects ──

  async listProjects(organizationId: string): Promise<Project[]> {
    return api.get<Project[]>(`/organizations/${organizationId}/projects`)
  }

  async createProject(organizationId: string, name: string, description: string): Promise<Project> {
    return api.post<Project>(`/organizations/${organizationId}/projects`, { name, description })
  }

  async updateProject(organizationId: string, projectId: string, name?: string, description?: string): Promise<Project> {
    return api.put<Project>(`/organizations/${organizationId}/projects/${projectId}`, { name, description })
  }

  async deleteProject(organizationId: string, projectId: string): Promise<void> {
    return api.delete(`/organizations/${organizationId}/projects/${projectId}`)
  }

  // ── Invitations ──

  async listInvitations(organizationId: string): Promise<Invitation[]> {
    return api.get<Invitation[]>(`/organizations/${organizationId}/invitations`)
  }

  async listPendingInvitations(organizationId: string): Promise<Invitation[]> {
    return api.get<Invitation[]>(`/organizations/${organizationId}/invitations/pending`)
  }

  async createInvitation(organizationId: string, email: string, role: string): Promise<Invitation> {
    return api.post<Invitation>(`/organizations/${organizationId}/invitations`, { email, role })
  }

  async cancelInvitation(organizationId: string, invitationId: string): Promise<Invitation> {
    return api.post<Invitation>(`/organizations/${organizationId}/invitations/${invitationId}/cancel`)
  }

  async acceptInvitation(token: string): Promise<void> {
    return api.post('/organizations/0/invitations/accept', { token })
  }
}

export const orgApi = new OrganizationApiService()
