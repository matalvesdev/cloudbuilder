import { create } from 'zustand'
import { orgApi, type Organization, type Membership } from '@/api/organizations'

interface OrganizationState {
  organizations: Organization[]
  currentOrganization: Organization | null
  memberships: Membership[]
  isLoading: boolean
  error: string | null

  loadOrganizations: () => Promise<void>
  selectOrganization: (id: string) => void
  createOrganization: (name: string, slug: string) => Promise<Organization>
  updateOrganization: (id: string, name?: string, settings?: string) => Promise<void>
  deleteOrganization: (id: string) => Promise<void>
  loadMemberships: (organizationId: string) => Promise<void>
  addMember: (organizationId: string, userId: string, role: string) => Promise<void>
  removeMember: (organizationId: string, membershipId: string) => Promise<void>
  clearError: () => void
}

export const useOrganizationStore = create<OrganizationState>()((set, get) => ({
  organizations: [],
  currentOrganization: null,
  memberships: [],
  isLoading: false,
  error: null,

  loadOrganizations: async () => {
    set({ isLoading: true, error: null })
    try {
      const orgs = await orgApi.listOrganizations()
      set({ organizations: orgs, isLoading: false })
      // Auto-select if only one organization
      if (orgs.length === 1 && !get().currentOrganization) {
        set({ currentOrganization: orgs[0] })
      }
    } catch (err: any) {
      set({ isLoading: false, error: err?.message || 'Falha ao carregar organizações' })
    }
  },

  selectOrganization: (id: string) => {
    const org = get().organizations.find(o => o.id === id) || null
    set({ currentOrganization: org })
  },

  createOrganization: async (name: string, slug: string) => {
    set({ isLoading: true, error: null })
    try {
      const org = await orgApi.createOrganization(name, slug)
      set(state => ({
        organizations: [...state.organizations, org],
        currentOrganization: org,
        isLoading: false,
      }))
      return org
    } catch (err: any) {
      set({ isLoading: false, error: err?.message || 'Falha ao criar organização' })
      throw err
    }
  },

  updateOrganization: async (id: string, name?: string, settings?: string) => {
    set({ isLoading: true, error: null })
    try {
      const updated = await orgApi.updateOrganization(id, name, settings)
      set(state => ({
        organizations: state.organizations.map(o => o.id === id ? updated : o),
        currentOrganization: state.currentOrganization?.id === id ? updated : state.currentOrganization,
        isLoading: false,
      }))
    } catch (err: any) {
      set({ isLoading: false, error: err?.message || 'Falha ao atualizar organização' })
      throw err
    }
  },

  deleteOrganization: async (id: string) => {
    set({ isLoading: true, error: null })
    try {
      await orgApi.deleteOrganization(id)
      set(state => ({
        organizations: state.organizations.filter(o => o.id !== id),
        currentOrganization: state.currentOrganization?.id === id ? null : state.currentOrganization,
        isLoading: false,
      }))
    } catch (err: any) {
      set({ isLoading: false, error: err?.message || 'Falha ao excluir organização' })
      throw err
    }
  },

  loadMemberships: async (organizationId: string) => {
    set({ isLoading: true, error: null })
    try {
      const members = await orgApi.listMemberships(organizationId)
      set({ memberships: members, isLoading: false })
    } catch (err: any) {
      set({ isLoading: false, error: err?.message || 'Falha ao carregar membros' })
    }
  },

  addMember: async (organizationId: string, userId: string, role: string) => {
    set({ isLoading: true, error: null })
    try {
      const member = await orgApi.addMember(organizationId, userId, role)
      set(state => ({
        memberships: [...state.memberships, member],
        isLoading: false,
      }))
    } catch (err: any) {
      set({ isLoading: false, error: err?.message || 'Falha ao adicionar membro' })
      throw err
    }
  },

  removeMember: async (organizationId: string, membershipId: string) => {
    set({ isLoading: true, error: null })
    try {
      await orgApi.removeMember(organizationId, membershipId)
      set(state => ({
        memberships: state.memberships.filter(m => m.id !== membershipId),
        isLoading: false,
      }))
    } catch (err: any) {
      set({ isLoading: false, error: err?.message || 'Falha ao remover membro' })
      throw err
    }
  },

  clearError: () => set({ error: null }),
}))
