import { create } from "zustand";
import type {
  Organization,
  Workspace,
  Invitation,
} from "@/types/workspace.types";
import { workspaceApi } from "@/api/workspace";

interface WorkspaceState {
  organizations: Organization[];
  activeOrg: Organization | null;
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  invitations: Invitation[];
  loading: boolean;
  error: string | null;

  fetchOrganizations: () => Promise<void>;
  selectOrganization: (org: Organization) => void;
  createOrganization: (
    name: string,
    slug: string,
    description?: string,
  ) => Promise<void>;
  updateOrganization: (
    id: string,
    data: Partial<Organization>,
  ) => Promise<void>;
  fetchWorkspaces: (orgId: string) => Promise<void>;
  selectWorkspace: (ws: Workspace) => void;
  createWorkspace: (
    orgId: string,
    name: string,
    description?: string,
  ) => Promise<void>;
  deleteWorkspace: (orgId: string, id: string) => Promise<void>;
  fetchInvitations: (orgId: string) => Promise<void>;
  inviteMember: (orgId: string, email: string, role: string) => Promise<void>;
  cancelInvitation: (orgId: string, invitationId: string) => Promise<void>;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  organizations: [],
  activeOrg: null,
  workspaces: [],
  activeWorkspace: null,
  invitations: [],
  loading: false,
  error: null,

  fetchOrganizations: async () => {
    set({ loading: true, error: null });
    try {
      const orgs = await workspaceApi.listOrganizations();
      set({ organizations: orgs, loading: false });
      if (orgs.length > 0 && !get().activeOrg) {
        set({ activeOrg: orgs[0] });
      }
    } catch {
      set({ error: "Falha ao carregar organizações", loading: false });
    }
  },

  selectOrganization: (org) => set({ activeOrg: org }),

  createOrganization: async (name, slug, description) => {
    set({ loading: true, error: null });
    try {
      const org = await workspaceApi.createOrganization({
        name,
        slug,
        description,
      });
      set((s) => ({
        organizations: [...s.organizations, org],
        activeOrg: org,
        loading: false,
      }));
    } catch {
      set({ error: "Falha ao criar organização", loading: false });
    }
  },

  updateOrganization: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const updated = await workspaceApi.updateOrganization(id, data);
      set((s) => ({
        organizations: s.organizations.map((o) => (o.id === id ? updated : o)),
        activeOrg: s.activeOrg?.id === id ? updated : s.activeOrg,
        loading: false,
      }));
    } catch {
      set({ error: "Falha ao atualizar organização", loading: false });
    }
  },

  fetchWorkspaces: async (orgId) => {
    set({ loading: true, error: null });
    try {
      const workspaces = await workspaceApi.listWorkspaces(orgId);
      set({ workspaces, loading: false });
    } catch {
      set({ error: "Falha ao carregar workspaces", loading: false });
    }
  },

  selectWorkspace: (ws) => set({ activeWorkspace: ws }),

  createWorkspace: async (orgId, name, description) => {
    set({ loading: true, error: null });
    try {
      const ws = await workspaceApi.createWorkspace(orgId, {
        organizationId: orgId,
        name,
        description,
      });
      set((s) => ({
        workspaces: [...s.workspaces, ws],
        activeWorkspace: ws,
        loading: false,
      }));
    } catch {
      set({ error: "Falha ao criar workspace", loading: false });
    }
  },

  deleteWorkspace: async (orgId, id) => {
    set({ loading: true, error: null });
    try {
      await workspaceApi.deleteWorkspace(orgId, id);
      set((s) => ({
        workspaces: s.workspaces.filter((w) => w.id !== id),
        activeWorkspace:
          s.activeWorkspace?.id === id ? null : s.activeWorkspace,
        loading: false,
      }));
    } catch {
      set({ error: "Falha ao excluir workspace", loading: false });
    }
  },

  fetchInvitations: async (orgId) => {
    try {
      const invitations = await workspaceApi.listInvitations(orgId);
      set({ invitations });
    } catch {
      /* silent */
    }
  },

  inviteMember: async (orgId, email, role) => {
    set({ loading: true, error: null });
    try {
      await workspaceApi.inviteMember(orgId, email, role);
      await get().fetchInvitations(orgId);
      set({ loading: false });
    } catch {
      set({ error: "Falha ao convidar membro", loading: false });
    }
  },

  cancelInvitation: async (orgId, invitationId) => {
    try {
      await workspaceApi.cancelInvitation(orgId, invitationId);
      set((s) => ({
        invitations: s.invitations.filter((i) => i.id !== invitationId),
      }));
    } catch {
      /* silent */
    }
  },
}));
