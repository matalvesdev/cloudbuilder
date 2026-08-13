export interface SsoProvider {
  id: string;
  name: string;
  providerType: string;
  clientId: string;
  issuerUrl?: string;
  enabled: boolean;
  domains: string[];
  createdAt: string;
}

export interface SamlConfig {
  id: string;
  entityId: string;
  acsUrl: string;
  certificate: string;
  enabled: boolean;
}
