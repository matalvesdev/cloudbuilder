import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Project, ProjectMember, ProjectRole, InviteRequest } from '@/types/tenant.types'

interface TenantState {
  projects: Project[]
  activeProjectId: string | null
  members: Record<string, ProjectMember[]>

  getActiveProject: () => Project | null
  getProjectMembers: (projectId: string) => ProjectMember[]
  createProject: (name: string, description: string) => Project
  switchProject: (projectId: string) => void
  inviteMember: (projectId: string, invite: InviteRequest) => void
  removeMember: (projectId: string, memberId: string) => void
  updateMemberRole: (projectId: string, memberId: string, role: ProjectRole) => void
  deleteProject: (projectId: string) => void
}

function createDefaultProject(): Project {
  return {
    id: crypto.randomUUID(),
    name: 'Projeto Padrão',
    description: 'Projeto principal da organização',
    memberCount: 1,
    resourceCount: 0,
    createdAt: new Date().toISOString(),
  }
}

function createDefaultMember(projectId: string): ProjectMember {
  return {
    id: crypto.randomUUID(),
    projectId,
    userId: 'current-user',
    userName: 'Admin',
    userEmail: 'admin@cloudbuilder.dev',
    role: 'owner',
    joinedAt: new Date().toISOString(),
  }
}

export const useTenantStore = create<TenantState>()(
  persist(
    (set, get) => ({
      projects: [],
      activeProjectId: null,
      members: {},

      getActiveProject: () => {
        const { projects, activeProjectId } = get()
        if (!activeProjectId && projects.length > 0) {
          return projects[0]
        }
        return projects.find((p) => p.id === activeProjectId) || null
      },

      getProjectMembers: (projectId) => {
        return get().members[projectId] || []
      },

      createProject: (name, description) => {
        const project: Project = {
          id: crypto.randomUUID(),
          name,
          description,
          memberCount: 1,
          resourceCount: 0,
          createdAt: new Date().toISOString(),
        }
        const owner: ProjectMember = {
          id: crypto.randomUUID(),
          projectId: project.id,
          userId: 'current-user',
          userName: 'Admin',
          userEmail: 'admin@cloudbuilder.dev',
          role: 'owner',
          joinedAt: new Date().toISOString(),
        }
        set((s) => ({
          projects: [...s.projects, project],
          activeProjectId: project.id,
          members: { ...s.members, [project.id]: [owner] },
        }))
        return project
      },

      switchProject: (projectId) => {
        set({ activeProjectId: projectId })
      },

      inviteMember: (projectId, invite) => {
        const member: ProjectMember = {
          id: crypto.randomUUID(),
          projectId,
          userId: crypto.randomUUID(),
          userName: invite.email.split('@')[0],
          userEmail: invite.email,
          role: invite.role,
          joinedAt: new Date().toISOString(),
        }
        set((s) => ({
          members: {
            ...s.members,
            [projectId]: [...(s.members[projectId] || []), member],
          },
          projects: s.projects.map((p) =>
            p.id === projectId ? { ...p, memberCount: p.memberCount + 1 } : p
          ),
        }))
      },

      removeMember: (projectId, memberId) => {
        set((s) => ({
          members: {
            ...s.members,
            [projectId]: (s.members[projectId] || []).filter((m) => m.id !== memberId),
          },
          projects: s.projects.map((p) =>
            p.id === projectId ? { ...p, memberCount: Math.max(0, p.memberCount - 1) } : p
          ),
        }))
      },

      updateMemberRole: (projectId, memberId, role) => {
        set((s) => ({
          members: {
            ...s.members,
            [projectId]: (s.members[projectId] || []).map((m) =>
              m.id === memberId ? { ...m, role } : m
            ),
          },
        }))
      },

      deleteProject: (projectId) => {
        set((s) => {
          const remaining = s.projects.filter((p) => p.id !== projectId)
          const newMembers = { ...s.members }
          delete newMembers[projectId]
          return {
            projects: remaining,
            activeProjectId: s.activeProjectId === projectId
              ? (remaining[0]?.id || null)
              : s.activeProjectId,
            members: newMembers,
          }
        })
      },
    }),
    {
      name: 'cloudbuilder-tenant-storage',
      partialize: (state) => ({
        projects: state.projects,
        activeProjectId: state.activeProjectId,
        members: state.members,
      }),
    }
  )
)
