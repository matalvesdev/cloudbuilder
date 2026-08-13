import { api } from "./client";

export interface ApiTokenDTO {
  id: string;
  name: string;
  prefix: string;
  scopes: string;
  active: boolean;
  createdAt: string;
  lastUsedAt: string | null;
}

export interface CreateTokenResponse extends ApiTokenDTO {
  token: string;
  message: string;
}

export interface SshKeyDTO {
  id: string;
  name: string;
  fingerprint: string;
  active: boolean;
  createdAt: string;
  lastUsedAt: string | null;
}

export const settingsApi = {
  // API Tokens
  listTokens: () => api.get<ApiTokenDTO[]>("/api-tokens"),
  createToken: (name: string, scopes?: string) =>
    api.post<CreateTokenResponse>("/api-tokens", {
      name,
      scopes: scopes || "read,write",
    }),
  revokeToken: (id: string) => api.delete<void>(`/api-tokens/${id}`),

  // SSH Keys
  listSshKeys: () => api.get<SshKeyDTO[]>("/ssh-keys"),
  addSshKey: (name: string, publicKey: string) =>
    api.post<SshKeyDTO>("/ssh-keys", { name, publicKey }),
  deleteSshKey: (id: string) => api.delete<void>(`/ssh-keys/${id}`),
};
