import { create } from 'zustand'
import { api } from '@/api/client'
import type {
  ConnectedRepo,
  RepoProvider,
  RepoScanResult,
  RepoAppDetection,
} from '@/types/repo.types'

interface RepoState {
  connectedRepos: ConnectedRepo[]
  scanResults: RepoScanResult[]
  scanResultsError: string | null

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
  fetchRepos: () => Promise<void>
}

export const useRepoStore = create<RepoState>()((set, get) => ({
  connectedRepos: [],
  scanResults: [],
  scanResultsError: null,

  fetchRepos: async () => {
    try {
      const repos = await api.get<ConnectedRepo[]>('/git/repos')
      if (Array.isArray(repos)) {
        set({ connectedRepos: repos })
      }
    } catch {
      // Connected repos survive in memory for the session;
      // API failure just means nothing new loaded from server.
    }
  },

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
      scanResultsError: null,
    }))

    try {
      const result = await api.post<RepoScanResult>(`/git/repos/${id}/scan`)
      const now = new Date().toISOString()

      set((state) => ({
        connectedRepos: state.connectedRepos.map((r) =>
          r.id === id ? { ...r, status: 'connected' as const, lastScanAt: now } : r
        ),
        scanResults: [...state.scanResults.filter((r) => r.repoId !== id), result],
      }))

      return result
    } catch (err) {
      set((state) => ({
        connectedRepos: state.connectedRepos.map((r) =>
          r.id === id ? { ...r, status: 'connected' as const } : r
        ),
        scanResultsError: err && typeof err === 'object' && 'message' in err
          ? (err as { message: string }).message
          : 'Erro ao escanear repositório',
      }))
      throw err
    }
  },

  detectAppType: (id) => {
    const result = get().scanResults.find((r) => r.repoId === id)
    if (!result) return { appType: null, language: null, framework: null, hasDockerfile: false, hasK8sManifest: false }
    return {
      appType: result.appType,
      language: result.languages?.[0] || null,
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
}))
