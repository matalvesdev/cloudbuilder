import { create } from "zustand";
import type { SsoProvider, SamlConfig } from "@/types/sso.types";
import { ssoApi, type SsoProviderRequest } from "@/api/sso";

interface SsoState {
  providers: SsoProvider[];
  samlConfig: SamlConfig | null;
  loading: boolean;
  error: string | null;

  fetchProviders: (orgId: string) => Promise<void>;
  createProvider: (orgId: string, req: SsoProviderRequest) => Promise<void>;
  updateProvider: (
    id: string,
    req: Partial<SsoProviderRequest>,
  ) => Promise<void>;
  deleteProvider: (id: string) => Promise<void>;
  toggleProvider: (id: string, enabled: boolean) => Promise<void>;
  fetchSamlConfig: (orgId: string) => Promise<void>;
  updateSamlConfig: (
    orgId: string,
    config: Partial<SamlConfig>,
  ) => Promise<void>;
}

export const useSsoStore = create<SsoState>((set) => ({
  providers: [],
  samlConfig: null,
  loading: false,
  error: null,

  fetchProviders: async (orgId) => {
    set({ loading: true, error: null });
    try {
      const providers = await ssoApi.listProviders(orgId);
      set({ providers, loading: false });
    } catch {
      set({ error: "Falha ao carregar provedores SSO", loading: false });
    }
  },

  createProvider: async (orgId, req) => {
    set({ loading: true, error: null });
    try {
      const provider = await ssoApi.createProvider(orgId, req);
      set((s) => ({ providers: [...s.providers, provider], loading: false }));
    } catch {
      set({ error: "Falha ao criar provedor SSO", loading: false });
    }
  },

  updateProvider: async (id, req) => {
    set({ loading: true, error: null });
    try {
      const updated = await ssoApi.updateProvider(id, req);
      set((s) => ({
        providers: s.providers.map((p) => (p.id === id ? updated : p)),
        loading: false,
      }));
    } catch {
      set({ error: "Falha ao atualizar provedor SSO", loading: false });
    }
  },

  deleteProvider: async (id) => {
    set({ loading: true, error: null });
    try {
      await ssoApi.deleteProvider(id);
      set((s) => ({
        providers: s.providers.filter((p) => p.id !== id),
        loading: false,
      }));
    } catch {
      set({ error: "Falha ao excluir provedor SSO", loading: false });
    }
  },

  toggleProvider: async (id, enabled) => {
    try {
      const updated = await ssoApi.toggleProvider(id, enabled);
      set((s) => ({
        providers: s.providers.map((p) => (p.id === id ? updated : p)),
      }));
    } catch {
      /* silent */
    }
  },

  fetchSamlConfig: async (orgId) => {
    try {
      const config = await ssoApi.getSamlConfig(orgId);
      set({ samlConfig: config });
    } catch {
      /* silent */
    }
  },

  updateSamlConfig: async (orgId, config) => {
    set({ loading: true, error: null });
    try {
      const updated = await ssoApi.updateSamlConfig(orgId, config);
      set({ samlConfig: updated, loading: false });
    } catch {
      set({ error: "Falha ao atualizar configuração SAML", loading: false });
    }
  },
}));
