export type Provider = 'aws' | 'azure' | 'gcp'

export type ProviderCredentialStatus = 'valid' | 'invalid' | 'unknown'

export interface ProviderCredential {
  id: string
  name: string
  provider: Provider
  /** AWS: accessKeyId / Azure: clientId / GCP: serviceAccountEmail */
  keyId: string
  /** Half-masked secret — only last 4 chars shown */
  maskedSecret: string
  /** Raw secret — stored only in memory, never persisted to localStorage */
  secret: string
  region: string
  status: ProviderCredentialStatus
  /** ISO date string */
  lastTestedAt: string | null
  createdAt: string
  updatedAt: string
}

export type EnvironmentStatus =
  | 'PENDING'
  | 'PROVISIONING'
  | 'ACTIVE'
  | 'FAILED'
  | 'DESTROYING'
  | 'DESTROYED'

export type StateBackendType = 's3' | 'local' | 'remote'

export interface Environment {
  id: string
  name: string
  type: 'development' | 'staging' | 'production'
  provider: Provider
  region: string
  credentialId: string
  stateBackendType: StateBackendType
  stateBackendConfig: Record<string, string>
  status: EnvironmentStatus
  canvasId: string | null
  canvasVersion: number
  createdAt: string
  updatedAt: string
}

export interface Deployment {
  id: string
  environmentId: string
  version: string
  status: 'running' | 'success' | 'failed' | 'cancelled'
  resourceCount: number
  duration: string
  startedAt: string
  completedAt: string | null
  planSummary: {
    add: number
    change: number
    destroy: number
  }
}

export const PROVIDER_LABELS: Record<Provider, string> = {
  aws: 'Amazon Web Services',
  azure: 'Microsoft Azure',
  gcp: 'Google Cloud Platform',
}

export const PROVIDER_COLORS: Record<Provider, string> = {
  aws: 'bg-amber-50 text-amber-700 border-amber-200',
  azure: 'bg-blue-50 text-blue-700 border-blue-200',
  gcp: 'bg-green-50 text-green-700 border-green-200',
}

export const PROVIDER_ICON_COLORS: Record<Provider, string> = {
  aws: 'text-amber-500',
  azure: 'text-blue-500',
  gcp: 'text-green-500',
}

export const ENVIRONMENT_REGIONS: Record<Provider, string[]> = {
  aws: ['us-east-1', 'us-east-2', 'us-west-1', 'us-west-2', 'eu-west-1', 'eu-central-1', 'sa-east-1', 'ap-southeast-1'],
  azure: ['eastus', 'eastus2', 'westus', 'westus2', 'westeurope', 'northeurope', 'brazilsouth', 'southeastasia'],
  gcp: ['us-central1', 'us-east1', 'us-west1', 'europe-west1', 'europe-west4', 'southamerica-east1', 'asia-east1'],
}

export const ENVIRONMENT_TYPE_LABELS: Record<string, string> = {
  development: 'Desenvolvimento',
  staging: 'Staging',
  production: 'Produção',
}

export const ENVIRONMENT_STATUS_LABELS: Record<EnvironmentStatus, string> = {
  PENDING: 'Pendente',
  PROVISIONING: 'Provisionando',
  ACTIVE: 'Ativo',
  FAILED: 'Falha',
  DESTROYING: 'Destruindo',
  DESTROYED: 'Destruído',
}
