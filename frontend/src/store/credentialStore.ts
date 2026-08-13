import { create } from "zustand";
import type {
  ProviderCredential,
  Environment,
  Provider,
  ProviderCredentialStatus,
  Deployment,
} from "@/types/settings.types";
import { api } from "@/api/client";

// ─── API response types (matching backend DTOs) ───────────────────────────

interface CredentialDTO {
  id: string;
  tenantId: string;
  name: string;
  provider: Provider;
  keyId: string;
  maskedSecret: string;
  region: string;
  status: ProviderCredentialStatus;
  lastTestedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CreateCredentialRequest {
  name: string;
  provider: Provider;
  keyId: string;
  secret: string;
  region: string;
  tenantId: string;
}

interface UpdateCredentialRequest {
  name?: string;
  keyId?: string;
  secret?: string;
  region?: string;
}

interface CredentialState {
  credentials: ProviderCredential[];
  environments: Environment[];
  deployments: Deployment[];
  loading: boolean;
  error: string | null;

  // API-backed credential actions
  fetchCredentials: (tenantId?: string) => Promise<void>;
  createCredential: (
    request: CreateCredentialRequest,
  ) => Promise<ProviderCredential | null>;
  updateCredentialApi: (
    id: string,
    request: UpdateCredentialRequest,
  ) => Promise<void>;
  deleteCredential: (id: string) => Promise<void>;
  testCredentialConnection: (id: string) => Promise<boolean>;

  // Local credential actions (kept for backward compatibility)
  addCredential: (
    cred: Omit<
      ProviderCredential,
      | "id"
      | "maskedSecret"
      | "status"
      | "lastTestedAt"
      | "createdAt"
      | "updatedAt"
    >,
  ) => void;
  updateCredential: (id: string, updates: Partial<ProviderCredential>) => void;
  removeCredential: (id: string) => void;
  testCredential: (id: string) => Promise<boolean>;
  getCredentialById: (id: string) => ProviderCredential | undefined;

  // Environment actions
  addEnvironment: (
    env: Omit<
      Environment,
      "id" | "status" | "canvasVersion" | "createdAt" | "updatedAt"
    >,
  ) => void;
  updateEnvironment: (id: string, updates: Partial<Environment>) => void;
  removeEnvironment: (id: string) => void;
  getEnvironmentById: (id: string) => Environment | undefined;

  // Deployment actions
  addDeployment: (dep: Omit<Deployment, "id">) => void;
  updateDeployment: (id: string, updates: Partial<Deployment>) => void;
  getDeploymentsByEnvironment: (envId: string) => Deployment[];
}

export const useCredentialStore = create<CredentialState>()((set, get) => ({
  credentials: [],
  environments: [],
  deployments: [],
  loading: false,
  error: null,

  // ─── API-backed credential actions ─────────────────────

  fetchCredentials: async (tenantId?: string) => {
    const tid =
      tenantId ||
      localStorage.getItem("cloudbuilder-active-tenant") ||
      "default";
    set({ loading: true, error: null });
    try {
      const data = await api.get<CredentialDTO[]>(
        `/credentials?tenantId=${encodeURIComponent(tid)}`,
      );
      const credentials: ProviderCredential[] = data.map((dto) => ({
        id: dto.id,
        name: dto.name,
        provider: dto.provider,
        keyId: dto.keyId,
        maskedSecret: dto.maskedSecret,
        secret: "",
        region: dto.region,
        status: dto.status,
        lastTestedAt: dto.lastTestedAt,
        createdAt: dto.createdAt,
        updatedAt: dto.updatedAt,
      }));
      set({ credentials, loading: false });
    } catch (err) {
      console.error("[credentialStore] fetchCredentials failed:", err);
      set({ loading: false, credentials: [] });
    }
  },

  createCredential: async (request) => {
    set({ loading: true, error: null });
    try {
      const dto = await api.post<CredentialDTO>("/credentials", request);
      const newCred: ProviderCredential = {
        id: dto.id,
        name: dto.name,
        provider: dto.provider,
        keyId: dto.keyId,
        maskedSecret: dto.maskedSecret,
        secret: request.secret,
        region: dto.region,
        status: dto.status,
        lastTestedAt: dto.lastTestedAt,
        createdAt: dto.createdAt,
        updatedAt: dto.updatedAt,
      };
      set((state) => ({
        credentials: [...state.credentials, newCred],
        loading: false,
      }));
      return newCred;
    } catch (err) {
      console.error("[credentialStore] createCredential failed:", err);
      set({ loading: false });
      return null;
    }
  },

  updateCredentialApi: async (id, request) => {
    set({ loading: true, error: null });
    try {
      const dto = await api.put<CredentialDTO>(`/credentials/${id}`, request);
      set((state) => ({
        credentials: state.credentials.map((c) =>
          c.id === id
            ? {
                ...c,
                name: dto.name,
                keyId: dto.keyId,
                maskedSecret: dto.maskedSecret,
                region: dto.region,
                status: dto.status,
                lastTestedAt: dto.lastTestedAt,
                updatedAt: dto.updatedAt,
                secret: request.secret || c.secret,
              }
            : c,
        ),
        loading: false,
      }));
    } catch {
      set({ loading: false });
    }
  },

  deleteCredential: async (id) => {
    set({ loading: true, error: null });
    try {
      await api.delete(`/credentials/${id}`);
      set((state) => ({
        credentials: state.credentials.filter((c) => c.id !== id),
        environments: state.environments.map((e) =>
          e.credentialId === id ? { ...e, credentialId: "" } : e,
        ),
        loading: false,
      }));
    } catch {
      set({ loading: false });
    }
  },

  testCredentialConnection: async (id) => {
    const credential = get().credentials.find((c) => c.id === id);
    if (!credential) return false;

    set({ loading: true, error: null });
    // Simula um pequeno delay para dar feedback visual do teste
    await new Promise((r) => setTimeout(r, 800));

    // Valida localmente se a credencial tem dados mínimos necessários
    const hasRequiredData = Boolean(
      credential.keyId?.trim() &&
      credential.secret?.trim() &&
      credential.region?.trim(),
    );

    const now = new Date().toISOString();
    set((state) => ({
      loading: false,
      credentials: state.credentials.map((c) =>
        c.id === id
          ? {
              ...c,
              status: hasRequiredData
                ? ("valid" as ProviderCredentialStatus)
                : ("invalid" as ProviderCredentialStatus),
              lastTestedAt: now,
            }
          : c,
      ),
    }));
    return hasRequiredData;
  },

  // ─── Local credential actions (kept for backward compatibility) ───

  addCredential: (cred) => {
    const now = new Date().toISOString();
    const maskedSecret = `****${cred.secret.slice(-4)}`;
    const newCred: ProviderCredential = {
      ...cred,
      id: crypto.randomUUID(),
      maskedSecret,
      status: "unknown" as ProviderCredentialStatus,
      lastTestedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    set((state) => ({ credentials: [...state.credentials, newCred] }));
  },

  updateCredential: (id, updates) => {
    set((state) => ({
      credentials: state.credentials.map((c) =>
        c.id === id
          ? {
              ...c,
              ...updates,
              secret: updates.secret || c.secret,
              updatedAt: new Date().toISOString(),
            }
          : c,
      ),
    }));
  },

  removeCredential: (id) => {
    set((state) => ({
      credentials: state.credentials.filter((c) => c.id !== id),
      environments: state.environments.map((e) =>
        e.credentialId === id ? { ...e, credentialId: "" } : e,
      ),
    }));
  },

  testCredential: async (_id) => {
    return get().testCredentialConnection(_id);
  },

  getCredentialById: (id) => get().credentials.find((c) => c.id === id),

  // ─── Environment actions ───

  addEnvironment: (env) => {
    const now = new Date().toISOString();
    const newEnv: Environment = {
      ...env,
      id: crypto.randomUUID(),
      status: "PENDING",
      canvasVersion: 1,
      createdAt: now,
      updatedAt: now,
    };
    set((state) => ({ environments: [...state.environments, newEnv] }));
  },

  updateEnvironment: (id, updates) => {
    set((state) => ({
      environments: state.environments.map((e) =>
        e.id === id
          ? { ...e, ...updates, updatedAt: new Date().toISOString() }
          : e,
      ),
    }));
  },

  removeEnvironment: (id) => {
    set((state) => ({
      environments: state.environments.filter((e) => e.id !== id),
    }));
  },

  getEnvironmentById: (id) => get().environments.find((e) => e.id === id),

  // ─── Deployment actions ───

  addDeployment: (dep) => {
    const newDep: Deployment = {
      ...dep,
      id: crypto.randomUUID(),
    };
    set((state) => ({ deployments: [...state.deployments, newDep] }));
  },

  updateDeployment: (id, updates) => {
    set((state) => ({
      deployments: state.deployments.map((d) =>
        d.id === id ? { ...d, ...updates } : d,
      ),
    }));
  },

  getDeploymentsByEnvironment: (envId) => {
    return get().deployments.filter((d) => d.environmentId === envId);
  },
}));
