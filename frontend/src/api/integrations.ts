import { api } from "./client";

export interface IntegrationDTO {
  id: string;
  tenantId: string;
  userId: string;
  name: string;
  providerId: string;
  category: string;
  config: string | null;
  status: string;
  healthStatus: string;
  lastHealthCheck: string | null;
  lastSyncAt: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProviderInfo {
  id: string;
  name: string;
  category: string;
  description: string;
  authMethods: string[];
  capabilities: Record<string, string>;
}

export interface IntegrationStats {
  total: number;
  connected: number;
  error: number;
  pending: number;
}

export const integrationApi = {
  list: () => api.get<IntegrationDTO[]>("/integrations"),
  get: (id: string) => api.get<IntegrationDTO>(`/integrations/${id}`),
  create: (data: {
    name: string;
    providerId: string;
    category: string;
    config?: string;
  }) =>
    api.post<{
      id: string;
      name: string;
      providerId: string;
      category: string;
      status: string;
    }>("/integrations", data),
  connect: (id: string) => api.post<void>(`/integrations/${id}/connect`),
  disconnect: (id: string) => api.post<void>(`/integrations/${id}/disconnect`),
  delete: (id: string) => api.delete<void>(`/integrations/${id}`),
  getHealth: (id: string) =>
    api.get<{ healthStatus: string; lastCheck: string | null }>(
      `/integrations/${id}/health`,
    ),
  getStats: () => api.get<IntegrationStats>("/integrations/stats"),

  listProviders: () => api.get<ProviderInfo[]>("/integrations/providers"),
  listProvidersByCategory: (category: string) =>
    api.get<ProviderInfo[]>(`/integrations/providers/${category}`),
  getProviderInfo: (providerId: string) =>
    api.get<ProviderInfo>(`/integrations/providers/info/${providerId}`),

  getOAuthUrl: (provider: string) =>
    api.get<{ url: string; state: string }>(
      `/integrations/oauth/${provider}/authorize`,
    ),
  handleOAuthCallback: (provider: string, code: string) =>
    api.post<{
      accessToken: string;
      user: { login: string; email: string; name: string };
    }>(`/integrations/oauth/${provider}/callback`, { code }),
};
