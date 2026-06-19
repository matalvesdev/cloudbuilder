import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  ConnectedRepo,
  RepoProvider,
  RepoScanResult,
  RepoAppDetection,
  RepoFile,
} from '@/types/repo.types'

interface RepoState {
  connectedRepos: ConnectedRepo[]
  scanResults: RepoScanResult[]

  connectRepo: (provider: RepoProvider, token: string, repo: {
    repoUrl: string
    repoName: string
    fullName: string
    owner: string
    defaultBranch: string
  }) => ConnectedRepo

  disconnectRepo: (id: string) => void
  scanRepo: (id: string) => Promise<RepoScanResult>
  detectAppType: (id: string) => RepoAppDetection
  getRepoById: (id: string) => ConnectedRepo | undefined
  removeScanResult: (repoId: string) => void
}

function simulateIacScan(): { iacFiles: RepoFile[]; languages: string[]; hasDockerfile: boolean; hasK8sManifest: boolean } {
  const providers = ['aws', 'azure', 'gcp'] as const
  const provider = providers[Math.floor(Math.random() * providers.length)]

  const iacFiles: RepoFile[] = [
    { path: `infra/${provider}/main.tf`, name: 'main.tf', type: 'file', extension: '.tf' },
    { path: `infra/${provider}/variables.tf`, name: 'variables.tf', type: 'file', extension: '.tf' },
  ]

  if (Math.random() > 0.5) {
    iacFiles.push({
      path: `infra/${provider}/outputs.tf`,
      name: 'outputs.tf',
      type: 'file',
      extension: '.tf',
    })
  }

  const languages = ['TypeScript', 'JavaScript']
  const hasDockerfile = Math.random() > 0.3
  const hasK8sManifest = Math.random() > 0.5

  if (hasK8sManifest) {
    iacFiles.push({
      path: 'k8s/deployment.yaml',
      name: 'deployment.yaml',
      type: 'file',
      extension: '.yaml',
    })
    iacFiles.push({
      path: 'k8s/service.yaml',
      name: 'service.yaml',
      type: 'file',
      extension: '.yaml',
    })
  }

  return { iacFiles, languages, hasDockerfile, hasK8sManifest }
}

function detectAppTypeFromFiles(files: RepoFile[], hasDockerfile: boolean): RepoAppDetection {
  const terraformPresent = files.some((f) => f.extension === '.tf')
  const k8sPresent = files.some((f) => f.extension === '.yaml' || f.extension === '.yml')

  if (terraformPresent && k8sPresent && hasDockerfile) {
    return { appType: 'microservice', language: 'TypeScript', framework: 'Node.js/Express', hasDockerfile, hasK8sManifest: k8sPresent }
  }
  if (terraformPresent) {
    return { appType: 'data-pipeline', language: null, framework: null, hasDockerfile, hasK8sManifest: k8sPresent }
  }
  if (hasDockerfile) {
    return { appType: 'web-app', language: 'TypeScript', framework: 'React/Next.js', hasDockerfile, hasK8sManifest: k8sPresent }
  }
  return { appType: null, language: null, framework: null, hasDockerfile, hasK8sManifest: k8sPresent }
}

const MOCK_REPOS_BY_PROVIDER: Record<RepoProvider, Array<{
  repoUrl: string
  repoName: string
  fullName: string
  owner: string
  defaultBranch: string
}>> = {
  github: [
    { repoUrl: 'https://github.com/cloudbuilder/infra-core', repoName: 'infra-core', fullName: 'cloudbuilder/infra-core', owner: 'cloudbuilder', defaultBranch: 'main' },
    { repoUrl: 'https://github.com/cloudbuilder/api-gateway', repoName: 'api-gateway', fullName: 'cloudbuilder/api-gateway', owner: 'cloudbuilder', defaultBranch: 'main' },
    { repoUrl: 'https://github.com/cloudbuilder/frontend-app', repoName: 'frontend-app', fullName: 'cloudbuilder/frontend-app', owner: 'cloudbuilder', defaultBranch: 'master' },
    { repoUrl: 'https://github.com/myorg/data-pipeline', repoName: 'data-pipeline', fullName: 'myorg/data-pipeline', owner: 'myorg', defaultBranch: 'main' },
    { repoUrl: 'https://github.com/myorg/k8s-cluster', repoName: 'k8s-cluster', fullName: 'myorg/k8s-cluster', owner: 'myorg', defaultBranch: 'main' },
  ],
  gitlab: [
    { repoUrl: 'https://gitlab.com/cloudbuilder/backend-svc', repoName: 'backend-svc', fullName: 'cloudbuilder/backend-svc', owner: 'cloudbuilder', defaultBranch: 'main' },
    { repoUrl: 'https://gitlab.com/cloudbuilder/terraform-modules', repoName: 'terraform-modules', fullName: 'cloudbuilder/terraform-modules', owner: 'cloudbuilder', defaultBranch: 'master' },
    { repoUrl: 'https://gitlab.com/myteam/ml-infra', repoName: 'ml-infra', fullName: 'myteam/ml-infra', owner: 'myteam', defaultBranch: 'main' },
  ],
  bitbucket: [
    { repoUrl: 'https://bitbucket.org/acme/infra-prod', repoName: 'infra-prod', fullName: 'acme/infra-prod', owner: 'acme', defaultBranch: 'main' },
    { repoUrl: 'https://bitbucket.org/acme/monorepo', repoName: 'monorepo', fullName: 'acme/monorepo', owner: 'acme', defaultBranch: 'develop' },
  ],
}

export const useRepoStore = create<RepoState>()(
  persist(
    (set, get) => ({
      connectedRepos: [],
      scanResults: [],

      connectRepo: (provider, token, repo) => {
        const existing = get().connectedRepos.find(
          (r) => r.fullName === repo.fullName && r.provider === provider
        )
        if (existing) return existing

        const newRepo: ConnectedRepo = {
          id: crypto.randomUUID(),
          provider,
          token,
          ...repo,
          connectedAt: new Date().toISOString(),
          lastScanAt: null,
          status: 'connected',
        }

        set((state) => ({ connectedRepos: [...state.connectedRepos, newRepo] }))
        return newRepo
      },

      disconnectRepo: (id) => {
        set((state) => ({
          connectedRepos: state.connectedRepos.filter((r) => r.id !== id),
          scanResults: state.scanResults.filter((r) => r.repoId !== id),
        }))
      },

      scanRepo: async (id) => {
        const repo = get().connectedRepos.find((r) => r.id === id)
        if (!repo) throw new Error('Repositório não encontrado')

        set((state) => ({
          connectedRepos: state.connectedRepos.map((r) =>
            r.id === id ? { ...r, status: 'scanning' as const } : r
          ),
        }))

        await new Promise((r) => setTimeout(r, 2000))

        const { iacFiles, languages, hasDockerfile, hasK8sManifest } = simulateIacScan()
        const now = new Date().toISOString()

        const result: RepoScanResult = {
          repoId: id,
          iacFiles,
          appType: detectAppTypeFromFiles(iacFiles, hasDockerfile).appType,
          resources: iacFiles.filter((f) => f.extension === '.tf').length * 3 + (hasK8sManifest ? 2 : 0),
          lastScan: now,
          languages,
          hasDockerfile,
          hasK8sManifest,
        }

        set((state) => ({
          connectedRepos: state.connectedRepos.map((r) =>
            r.id === id ? { ...r, status: 'connected' as const, lastScanAt: now } : r
          ),
          scanResults: [...state.scanResults.filter((r) => r.repoId !== id), result],
        }))

        return result
      },

      detectAppType: (id) => {
        const result = get().scanResults.find((r) => r.repoId === id)
        if (!result) return { appType: null, language: null, framework: null, hasDockerfile: false, hasK8sManifest: false }
        return {
          appType: result.appType,
          language: result.languages[0] || null,
          framework: result.appType === 'web-app' ? 'React/Next.js' : result.appType === 'microservice' ? 'Node.js/Express' : null,
          hasDockerfile: result.hasDockerfile,
          hasK8sManifest: result.hasK8sManifest,
        }
      },

      getRepoById: (id) => get().connectedRepos.find((r) => r.id === id),

      removeScanResult: (repoId) => {
        set((state) => ({
          scanResults: state.scanResults.filter((r) => r.repoId !== repoId),
        }))
      },
    }),
    {
      name: 'cloudbuilder-repos',
      partialize: (state) => ({
        connectedRepos: state.connectedRepos.map(({ token, ...rest }) => ({ ...rest, token: '' })),
        scanResults: state.scanResults,
      }),
    }
  )
)

export { MOCK_REPOS_BY_PROVIDER }
export type { RepoState }
