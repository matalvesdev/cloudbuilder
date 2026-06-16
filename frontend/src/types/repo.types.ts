export type RepoProvider = 'github' | 'gitlab' | 'bitbucket'

export type RepoConnectionStatus = 'connected' | 'scanning' | 'error' | 'disconnected'

export type RepoFileType = 'file' | 'dir'

export type DetectedAppType = 'web-app' | 'microservice' | 'data-pipeline' | 'docker-compose' | null

export interface ConnectedRepo {
  id: string
  provider: RepoProvider
  repoUrl: string
  repoName: string
  fullName: string
  owner: string
  defaultBranch: string
  connectedAt: string
  lastScanAt: string | null
  status: RepoConnectionStatus
  token: string
}

export interface RepoFile {
  path: string
  name: string
  type: RepoFileType
  extension: string
}

export interface RepoScanResult {
  repoId: string
  iacFiles: RepoFile[]
  appType: DetectedAppType
  resources: number
  lastScan: string
  languages: string[]
  hasDockerfile: boolean
  hasK8sManifest: boolean
}

export interface RepoAppDetection {
  appType: DetectedAppType
  language: string | null
  framework: string | null
  hasDockerfile: boolean
  hasK8sManifest: boolean
}

export const REPO_PROVIDER_LABELS: Record<RepoProvider, string> = {
  github: 'GitHub',
  gitlab: 'GitLab',
  bitbucket: 'Bitbucket',
}

export const REPO_PROVIDER_COLORS: Record<RepoProvider, string> = {
  github: 'bg-gray-900 text-white border-gray-700',
  gitlab: 'bg-orange-500 text-white border-orange-400',
  bitbucket: 'bg-blue-600 text-white border-blue-500',
}

export const REPO_STATUS_LABELS: Record<RepoConnectionStatus, string> = {
  connected: 'Conectado',
  scanning: 'Escaneando',
  error: 'Erro',
  disconnected: 'Desconectado',
}
