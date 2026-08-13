import { api } from "./client";

export interface SSOProvider {
  id: string;
  name: string;
  providerType: "google" | "github" | "microsoft" | "okta" | "auth0" | "custom" | string;
  enabled: boolean;
  clientId: string;
  domains: string[];
  createdAt: string;
}

export interface SsoProviderRequest {
  name: string;
  providerType: string;
  clientId: string;
  clientSecret: string;
  redirectUri?: string;
  issuerUrl?: string;
  domains?: string[];
}

export function listSSOProviders(): Promise<SSOProvider[]> {
  return api.get("/auth/oauth2/providers");
}

export function listProviders(orgId: string): Promise<SSOProvider[]> {
  return api.get(`/auth/oauth2/providers?orgId=${orgId}`);
}

export function createProvider(orgId: string, req: SsoProviderRequest): Promise<SSOProvider> {
  return api.post(`/auth/oauth2/providers?orgId=${orgId}`, req);
}

export function updateProvider(id: string, req: Partial<SsoProviderRequest>): Promise<SSOProvider> {
  return api.put(`/auth/oauth2/providers/${id}`, req);
}

export function deleteProvider(id: string): Promise<void> {
  return api.delete(`/auth/oauth2/providers/${id}`);
}

export function toggleProvider(id: string, enabled: boolean): Promise<SSOProvider> {
  return api.put(`/auth/oauth2/providers/${id}/toggle`, { enabled });
}

export function getSamlConfig(orgId: string): Promise<any> {
  return api.get(`/auth/saml/config?orgId=${orgId}`);
}

export function updateSamlConfig(orgId: string, config: any): Promise<any> {
  return api.put(`/auth/saml/config?orgId=${orgId}`, config);
}

export const ssoApi = {
  listSSOProviders,
  listProviders,
  createProvider,
  updateProvider,
  deleteProvider,
  toggleProvider,
  getSamlConfig,
  updateSamlConfig,
};
