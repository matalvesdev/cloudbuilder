import { useState } from 'react'
import {
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
  GitBranch,
  GitFork,
  Globe,
  ChevronDown,
  ChevronRight,
  FileCode2,
  FolderOpen,
  Settings,
  ScanLine,
  ExternalLink,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRepoStore } from '@/store/repoStore'
import {
  REPO_PROVIDER_LABELS,
  REPO_STATUS_LABELS,
  type RepoProvider,
  type RepoScanResult,
} from '@/types/repo.types'
import { CiCdPipeline } from '@/modules/provision/CiCdPipeline'

function ProviderIcon({ provider, className }: { provider: RepoProvider; className?: string }) {
  const icons: Record<RepoProvider, typeof GitBranch> = {
    github: GitBranch,
    gitlab: GitFork,
    bitbucket: Globe,
  }
  const Icon = icons[provider]
  const colors: Record<RepoProvider, string> = {
    github: 'text-gray-800',
    gitlab: 'text-orange-500',
    bitbucket: 'text-blue-600',
  }
  return <Icon className={cn(className, colors[provider])} />
}

function ConnectDialog({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { connectRepo, connectedRepos } = useRepoStore()
  const [provider, setProvider] = useState<RepoProvider>('github')
  const [token, setToken] = useState('')
  const [repoUrl, setRepoUrl] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  const handleConnect = async () => {
    if (!token.trim() || !repoUrl.trim()) {
      setError('Preencha o token e a URL do repositório')
      return
    }
    setConnecting(true)
    setError(null)
    try {
      const { api } = await import('@/api/client')
      const response = await api.post<{ id: string }>('/git/connect', {
        provider,
        repoUrl,
        token,
      })
      if (response?.id) {
        connectRepo(provider, token, {
          repoUrl,
          repoName: repoUrl.split('/').pop() || 'repo',
          fullName: repoUrl.replace(/https?:\/\/(www\.)?(github|gitlab|bitbucket)\.com\//, ''),
          owner: repoUrl.split('/').slice(-2)[0] || 'owner',
          defaultBranch: 'main',
        })
      }
    } catch (err) {
      setError(err && typeof err === 'object' && 'message' in err
        ? (err as { message: string }).message
        : 'Erro ao conectar repositório')
    } finally {
      setConnecting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold text-brand-navy font-display">Conectar Repositório</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Conecte um repositório Git para escanear infraestrutura e configurar pipelines
          </p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Provedor
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.entries(REPO_PROVIDER_LABELS) as [RepoProvider, string][]).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setProvider(key)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-xs font-medium',
                    provider === key
                      ? 'border-brand-navy bg-brand-navy/5 text-brand-navy'
                      : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                  )}
                >
                  <ProviderIcon provider={key} className="w-5 h-5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Token de Acesso
            </label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm font-mono focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy bg-white transition-all"
              placeholder={
                provider === 'github'
                  ? 'ghp_xxxxxxxxxxxxxxxxxxxx'
                  : provider === 'gitlab'
                    ? 'glpat-xxxxxxxxxxxxxxxxxxxx'
                    : 'BBxxxx-xxxxxxxxxxxxxxxxxxxx'
              }
            />
            <p className="text-[10px] text-slate-400 mt-1.5">
              {provider === 'github'
                ? 'Crie um token em Settings → Developer settings → Personal access tokens'
                : provider === 'gitlab'
                  ? 'Crie um token em Preferences → Access Tokens'
                  : 'Crie um token em Personal settings → App passwords'}
            </p>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              URL do Repositório
            </label>
            <input
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy bg-white transition-all"
              placeholder="https://github.com/meu-org/meu-repo"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
              {error}
            </div>
          )}
        </div>
        <div className="p-6 pt-0 flex items-center justify-end gap-2">
          <button
            onClick={() => { setToken(''); setRepoUrl(''); setError(null); onClose() }}
            className="px-4 h-9 rounded-full text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleConnect}
            disabled={connecting || !token.trim() || !repoUrl.trim()}
            className="inline-flex items-center gap-1.5 px-5 h-9 rounded-full text-xs font-bold bg-brand-navy text-white hover:bg-[#0D1B2A] transition-all disabled:opacity-50"
          >
            {connecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            {connecting ? 'Conectando...' : 'Conectar'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ScanResultsSection({ result }: { result: RepoScanResult }) {
  const [expanded, setExpanded] = useState(false)

  if (!result) return null

  return (
    <div className="bg-slate-50 rounded-xl mt-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 text-xs font-medium text-slate-600 hover:text-brand-navy transition-all"
      >
        <div className="flex items-center gap-2">
          <FileCode2 className="w-3.5 h-3.5" />
          <span>
            {result.iacFiles.length} arquivos IaC detectados · {result.resources} recursos estimados
          </span>
        </div>
        {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
      </button>
      {expanded && (
        <div className="px-3 pb-3 space-y-1">
          {result.iacFiles.map((file) => (
            <div
              key={file.path}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-mono text-slate-600"
            >
              {file.type === 'dir' ? (
                <FolderOpen className="w-3 h-3 text-amber-500 shrink-0" />
              ) : (
                <FileCode2 className="w-3 h-3 text-blue-500 shrink-0" />
              )}
              <span className="truncate">{file.path}</span>
              <span className={cn(
                'text-[9px] px-1 rounded font-semibold uppercase ml-auto shrink-0',
                file.extension === '.tf' ? 'bg-purple-50 text-purple-700' :
                file.extension === '.yaml' || file.extension === '.yml' ? 'bg-cyan-50 text-cyan-700' :
                'bg-slate-100 text-slate-500'
              )}>
                {file.extension.slice(1)}
              </span>
            </div>
          ))}
          <div className="flex flex-wrap gap-2 mt-2">
            {result.languages.map((lang) => (
              <span key={lang} className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                {lang}
              </span>
            ))}
            {result.hasDockerfile && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 font-medium">
                Dockerfile
              </span>
            )}
            {result.hasK8sManifest && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium">
                K8s Manifest
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function RepositorySettings() {
  const { connectedRepos, scanResults, scanRepo, disconnectRepo, detectAppType, getRepoById } = useRepoStore()
  const [showConnect, setShowConnect] = useState(false)
  const [scanningId, setScanningId] = useState<string | null>(null)
  const [pipelineRepoId, setPipelineRepoId] = useState<string | null>(null)

  const handleScan = async (id: string) => {
    setScanningId(id)
    await scanRepo(id)
    setScanningId(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-slate-400">{connectedRepos.length} repositórios conectados</p>
        <button
          onClick={() => setShowConnect(true)}
          className="inline-flex items-center gap-1.5 px-4 h-8 rounded-full text-xs font-bold bg-brand-navy text-white hover:bg-[#0D1B2A] transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          Conectar Repositório
        </button>
      </div>

      {connectedRepos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-ice-blue flex items-center justify-center mb-4">
            <GitBranch className="w-7 h-7 text-brand-navy" />
          </div>
          <p className="text-sm font-semibold text-brand-navy mb-1">Nenhum repositório conectado</p>
          <p className="text-xs text-slate-400 mb-4 max-w-sm">
            Conecte seus repositórios GitHub, GitLab ou Bitbucket para escanear infraestrutura como código
            e configurar pipelines de CI/CD automaticamente.
          </p>
          <button
            onClick={() => setShowConnect(true)}
            className="inline-flex items-center gap-1.5 px-5 h-9 rounded-full text-xs font-bold bg-brand-navy text-white hover:bg-[#0D1B2A] transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Conectar Repositório
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          {connectedRepos.map((repo) => {
            const result = scanResults.find((r) => r.repoId === repo.id)
            const detection = repo.id ? detectAppType(repo.id) : null
            const isScanning = scanningId === repo.id

            return (
              <div
                key={repo.id}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                      repo.provider === 'github' ? 'bg-gray-100' :
                      repo.provider === 'gitlab' ? 'bg-orange-50' :
                      'bg-blue-50'
                    )}>
                      <ProviderIcon provider={repo.provider} className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-brand-navy truncate max-w-[280px]">{repo.fullName}</p>
                        <span className={cn(
                          'text-[10px] px-1.5 py-0.5 rounded-full border font-medium',
                          repo.provider === 'github' ? 'border-gray-300 text-gray-700 bg-gray-50' :
                          repo.provider === 'gitlab' ? 'border-orange-300 text-orange-700 bg-orange-50' :
                          'border-blue-300 text-blue-700 bg-blue-50'
                        )}>
                          {REPO_PROVIDER_LABELS[repo.provider]}
                        </span>
                        <span className={cn(
                          'inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border font-medium',
                          repo.status === 'connected' ? 'bg-green-50 text-green-700 border-green-200' :
                          repo.status === 'scanning' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          repo.status === 'error' ? 'bg-red-50 text-red-700 border-red-200' :
                          'bg-slate-50 text-slate-600 border-slate-200'
                        )}>
                          {repo.status === 'scanning' && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
                          {REPO_STATUS_LABELS[repo.status]}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <GitBranch className="w-3 h-3" />
                          {repo.defaultBranch}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span>
                          Conectado {new Date(repo.connectedAt).toLocaleDateString('pt-BR')}
                        </span>
                        {repo.lastScanAt && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span>
                              Último scan: {new Date(repo.lastScanAt).toLocaleDateString('pt-BR')}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Scan Results */}
                      {result && (
                        <div className="mt-2 flex items-center gap-2 flex-wrap">
                          {result.appType && (
                            <span className={cn(
                              'text-[10px] px-2 py-0.5 rounded-full font-semibold border',
                              result.appType === 'web-app' ? 'bg-green-50 text-green-700 border-green-200' :
                              result.appType === 'microservice' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                              result.appType === 'data-pipeline' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              result.appType === 'docker-compose' ? 'bg-sky-50 text-sky-700 border-sky-200' :
                              'bg-slate-50 text-slate-500 border-slate-200'
                            )}>
                              {result.appType === 'web-app' ? 'Web App' :
                               result.appType === 'microservice' ? 'Microsserviço' :
                               result.appType === 'data-pipeline' ? 'Data Pipeline' :
                               result.appType === 'docker-compose' ? 'Docker Compose' : ''}
                            </span>
                          )}
                          {result.resources > 0 && (
                            <span className="text-[10px] text-slate-500">
                              {result.resources} recursos estimados
                            </span>
                          )}
                        </div>
                      )}

                      {/* Expandable IaC files */}
                      {result && <ScanResultsSection result={result} />}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <a
                      href={repo.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg text-slate-400 hover:text-brand-navy hover:bg-slate-100 transition-all"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => handleScan(repo.id)}
                      disabled={isScanning || repo.status === 'scanning'}
                      className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all disabled:opacity-50"
                    >
                      {isScanning ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <ScanLine className="w-3 h-3" />
                      )}
                      {isScanning ? 'Escaneando...' : 'Scanear'}
                    </button>
                    <button
                      onClick={() => setPipelineRepoId(repo.id)}
                      disabled={!result}
                      className={cn(
                        'inline-flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-semibold transition-all',
                        result
                          ? 'bg-brand-navy text-white hover:bg-[#0D1B2A]'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      )}
                    >
                      <Settings className="w-3 h-3" />
                      Pipeline
                    </button>
                    <button
                      onClick={() => disconnectRepo(repo.id)}
                      className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Connect Dialog */}
      <ConnectDialog
        open={showConnect}
        onClose={() => setShowConnect(false)}
      />

      {/* Pipeline Config Dialog */}
      {pipelineRepoId && (
        <CiCdPipeline
          repoId={pipelineRepoId}
          onClose={() => setPipelineRepoId(null)}
        />
      )}
    </div>
  )
}
