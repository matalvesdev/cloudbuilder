import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import {
  GitBranch,
  GitCommit,
  GitPullRequest,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  ExternalLink,
  RefreshCw,
  User,
  Calendar,
  MessageSquare,
  Shield,
  AlertTriangle,
  Code2,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import type { ConnectedRepo } from '@/types/repo.types'
import { REPO_PROVIDER_LABELS } from '@/types/repo.types'

// ─── Types ────────────────────────────────────────────────────

export interface GitCommit {
  id: string
  hash: string
  author: string
  email: string
  message: string
  timestamp: string
  branch: string
  repoId: string
}

export interface PipelineRun {
  id: string
  repoId: string
  branch: string
  commitHash: string
  status: 'passing' | 'failing' | 'running' | 'pending' | 'unknown'
  startedAt: string
  finishedAt: string | null
  duration: string
  pipelineName: string
  pipelineUrl: string | null
  stages: PipelineStage[]
}

export interface PipelineStage {
  name: string
  status: 'passing' | 'failing' | 'running' | 'pending' | 'skipped'
  duration: string
}

// ─── Mock data generators ─────────────────────────────────────

function generateMockCommits(repoId: string, repoName: string, count: number = 8): GitCommit[] {
  const authors = [
    { name: 'Ana Silva', email: 'ana.silva@cloudbuilder.io' },
    { name: 'Carlos Oliveira', email: 'carlos.oliveira@cloudbuilder.io' },
    { name: 'Maria Santos', email: 'maria.santos@cloudbuilder.io' },
    { name: 'Pedro Costa', email: 'pedro.costa@cloudbuilder.io' },
  ]
  const subjects = [
    'feat: add auto-scaling configuration for ECS services',
    'fix: resolve security group ingress CIDR validation',
    'chore: update Terraform provider versions to 5.x',
    'feat: implement VPC flow logs integration',
    'fix: correct RDS backup retention period configuration',
    'refactor: extract common variables into shared module',
    'feat: add health check endpoints for all services',
    'docs: update deployment documentation with new workflows',
    'fix: resolve IAM role trust policy syntax error',
    'feat: implement multi-region failover support',
  ]

  return Array.from({ length: count }, (_, i) => {
    const author = authors[i % authors.length]
    const timestamp = new Date(Date.now() - i * 3600000 * (1 + (i * 0.1)))
    return {
      id: crypto.randomUUID(),
      hash: `a${i.toString(16).padStart(6, '0')}`,
      author: author.name,
      email: author.email,
      message: subjects[i % subjects.length],
      timestamp: timestamp.toISOString(),
      branch: i < 2 ? 'feature/auto-scaling' : i < 4 ? 'main' : 'develop',
      repoId,
    }
  })
}

function generateMockPipelines(repoId: string, commits: GitCommit[]): PipelineRun[] {
  return commits.slice(0, 5).map((commit, i) => {
    const statuses: PipelineRun['status'][] = ['passing', 'passing', 'passing', 'failing', 'running', 'passing', 'pending']
    const status = statuses[i % statuses.length]
    const start = new Date(commit.timestamp)
    const durMinutes = 5 + (i * 2)
    const finish = new Date(start.getTime() + durMinutes * 60000)

    return {
      id: crypto.randomUUID(),
      repoId,
      branch: commit.branch,
      commitHash: commit.hash,
      status,
      startedAt: start.toISOString(),
      finishedAt: status !== 'running' && status !== 'pending' ? finish.toISOString() : null,
      duration: status === 'running' ? `${2 + i}m` : `${durMinutes}m ${(i * 10) % 60}s`,
      pipelineName: `CI: ${commit.message.substring(0, 40)}...`,
      pipelineUrl: status === 'passing' || status === 'failing' ? `https://ci.cloudbuilder.io/pipelines/${commit.hash}` : null,
      stages: [
        { name: 'Checkout', status: 'passing', duration: '30s' },
        { name: 'Lint', status: status === 'failing' ? 'failing' : 'passing', duration: '45s' },
        { name: 'Test', status: status === 'running' ? 'running' : status === 'failing' ? 'skipped' : 'passing', duration: '2m' },
        { name: 'Build', status: status === 'running' ? 'running' : status === 'failing' ? 'skipped' : 'passing', duration: '3m' },
        { name: 'Deploy', status: status === 'passing' ? 'passing' : status === 'running' ? 'pending' : 'skipped', duration: '1m' },
      ],
    }
  })
}

// ─── Sub-components ──────────────────────────────────────────

function PipelineStatusBadge({ status }: { status: PipelineRun['status'] }) {
  const config = {
    passing: { icon: CheckCircle2, bg: 'bg-green-50 text-green-700 border-green-200', label: 'Passando' },
    failing: { icon: XCircle, bg: 'bg-red-50 text-red-700 border-red-200', label: 'Falhando' },
    running: { icon: Loader2, bg: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Executando' },
    pending: { icon: Clock, bg: 'bg-slate-50 text-slate-600 border-slate-200', label: 'Pendente' },
    unknown: { icon: AlertTriangle, bg: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Desconhecido' },
  }[status]

  const Icon = config.icon

  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border', config.bg)}>
      <Icon className={cn('w-3 h-3', status === 'running' && 'animate-spin')} />
      {config.label}
    </span>
  )
}

function StageBadge({ stage }: { stage: PipelineStage }) {
  const config = {
    passing: { icon: CheckCircle2, color: 'text-green-500' },
    failing: { icon: XCircle, color: 'text-red-500' },
    running: { icon: Loader2, color: 'text-blue-500' },
    pending: { icon: Clock, color: 'text-slate-400' },
    skipped: { icon: AlertTriangle, color: 'text-slate-400' },
  }[stage.status]

  const Icon = config.icon

  return (
    <div className="flex items-center gap-1.5 text-xs">
      <Icon className={cn('w-3 h-3', config.color, stage.status === 'running' && 'animate-spin')} />
      <span className="text-slate-600">{stage.name}</span>
      <span className="text-slate-400 ml-auto">{stage.duration}</span>
    </div>
  )
}

function CommitTimeline({ commits, repoName }: { commits: GitCommit[]; repoName: string }) {
  const [expanded, setExpanded] = useState(false)
  const displayCommits = expanded ? commits : commits.slice(0, 5)

  if (commits.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-slate-400">
        <GitCommit className="w-6 h-6 mx-auto mb-2 text-slate-300" />
        Nenhum commit encontrado para {repoName}
      </div>
    )
  }

  return (
    <div>
      <div className="space-y-0">
        {displayCommits.map((commit, idx) => (
          <div key={commit.id} className="relative flex gap-3 pb-4 last:pb-0">
            {/* Timeline line */}
            {idx < displayCommits.length - 1 && (
              <div className="absolute left-[11px] top-5 bottom-0 w-px bg-slate-200" />
            )}
            {/* Dot */}
            <div className="relative mt-1 shrink-0">
              <div className="w-[22px] h-[22px] rounded-full bg-ice-blue border-2 border-white flex items-center justify-center">
                <GitCommit className="w-2.5 h-2.5 text-brand-navy" />
              </div>
            </div>
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-semibold text-brand-navy truncate">{commit.message}</p>
                <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0">
                  {timeAgo(commit.timestamp)}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                  <User className="w-2.5 h-2.5" />
                  <span>{commit.author}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-300">{commit.hash}</span>
                <span className={cn(
                  'text-[9px] px-1.5 py-0.5 rounded-full font-mono border',
                  commit.branch === 'main'
                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                    : commit.branch.startsWith('feature')
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                )}>
                  {commit.branch}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      {commits.length > 5 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs font-semibold text-brand-navy hover:text-brand-navy/70 mt-1 ml-9 transition-colors"
        >
          {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          {expanded ? 'Mostrar menos' : `Mostrar mais ${commits.length - 5} commits`}
        </button>
      )}
    </div>
  )
}

function PipelineCard({ pipeline }: { pipeline: PipelineRun }) {
  const [expandedStages, setExpandedStages] = useState(false)

  return (
    <div className="border border-slate-100 rounded-xl p-4 hover:bg-slate-50/50 transition-colors">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-xs font-semibold text-brand-navy truncate">{pipeline.pipelineName}</p>
            <PipelineStatusBadge status={pipeline.status} />
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-400">
            <GitBranch className="w-2.5 h-2.5" />
            <span>{pipeline.branch}</span>
            <span className="text-slate-300">|</span>
            <span>{pipeline.duration}</span>
            {pipeline.finishedAt && (
              <>
                <span className="text-slate-300">|</span>
                <Calendar className="w-2.5 h-2.5" />
                <span>{new Date(pipeline.finishedAt).toLocaleDateString('pt-BR')}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {pipeline.pipelineUrl && (
            <a
              href={pipeline.pipelineUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg text-slate-400 hover:text-brand-navy hover:bg-slate-100 transition-all"
              title="Ver pipeline"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* Stages */}
      <button
        onClick={() => setExpandedStages(!expandedStages)}
        className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 hover:text-brand-navy transition-colors mb-1"
      >
        {expandedStages ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        {pipeline.stages.length} estágios
      </button>
      {expandedStages && (
        <div className="space-y-1 mt-2 pl-3 border-l-2 border-slate-100">
          {pipeline.stages.map((stage, i) => (
            <StageBadge key={i} stage={stage} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `${mins}min atrás`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h atrás`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d atrás`
  return new Date(iso).toLocaleDateString('pt-BR')
}

// ─── Main Component ──────────────────────────────────────────

interface GitOpsSectionProps {
  connectedRepos: ConnectedRepo[]
  className?: string
}

export function GitOpsSection({ connectedRepos, className }: GitOpsSectionProps) {
  const [expandedRepo, setExpandedRepo] = useState<string | null>(null)

  // Generate mock data per repo
  const repoData = useMemo(() => {
    return connectedRepos.map((repo) => {
      const commits = generateMockCommits(repo.id, repo.repoName)
      const pipelines = generateMockPipelines(repo.id, commits)
      return { repo, commits, pipelines }
    })
  }, [connectedRepos])

  if (connectedRepos.length === 0) {
    return (
      <div className={cn('bg-white border border-slate-200 rounded-xl p-6', className)}>
        <div className="py-8 text-center">
          <GitBranch className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-brand-navy mb-1">Nenhum repositório conectado</p>
          <p className="text-xs text-slate-400 mb-4">Conecte repositórios nas Configurações para visualizar commits e pipelines</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-brand-navy" />
          <h3 className="text-sm font-bold text-brand-navy">GitOps</h3>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-ice-blue text-brand-navy font-semibold">
            {connectedRepos.length} repositório{connectedRepos.length > 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400">
            {repoData.reduce((acc, r) => acc + r.pipelines.filter(p => p.status === 'passing').length, 0)} pipelines ativos
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {repoData.map(({ repo, commits, pipelines }) => {
          const isExpanded = expandedRepo === repo.id
          const passingPipelines = pipelines.filter(p => p.status === 'passing').length
          const failingPipelines = pipelines.filter(p => p.status === 'failing').length

          return (
            <div key={repo.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              {/* Repo Header */}
              <button
                onClick={() => setExpandedRepo(isExpanded ? null : repo.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold',
                    repo.provider === 'github' ? 'bg-gray-900 text-white' :
                    repo.provider === 'gitlab' ? 'bg-orange-500 text-white' :
                    'bg-blue-600 text-white'
                  )}>
                    {repo.provider === 'github' ? 'GH' : repo.provider === 'gitlab' ? 'GL' : 'BB'}
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-brand-navy">{repo.repoName}</p>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium">
                        {REPO_PROVIDER_LABELS[repo.provider]}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">{repo.fullName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-[10px] text-green-600 font-medium">
                      <CheckCircle2 className="w-3 h-3" />
                      {passingPipelines}
                    </span>
                    {failingPipelines > 0 && (
                      <span className="flex items-center gap-1 text-[10px] text-red-600 font-medium">
                        <XCircle className="w-3 h-3" />
                        {failingPipelines}
                      </span>
                    )}
                  </div>
                  {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                </div>
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="border-t border-slate-100">
                  <div className="grid grid-cols-2 divide-x divide-slate-100">
                    {/* Commit Timeline */}
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <GitCommit className="w-3.5 h-3.5 text-brand-navy" />
                        <span className="text-[11px] font-bold text-brand-navy uppercase tracking-wide">Commits Recentes</span>
                        <span className="text-[10px] text-slate-400 ml-auto">{commits.length} commits</span>
                      </div>
                      <CommitTimeline commits={commits} repoName={repo.repoName} />
                    </div>

                    {/* Pipeline History */}
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <GitPullRequest className="w-3.5 h-3.5 text-brand-navy" />
                        <span className="text-[11px] font-bold text-brand-navy uppercase tracking-wide">Pipelines</span>
                        <span className="text-[10px] text-slate-400 ml-auto">
                          <RefreshCw className="w-3 h-3 inline mr-1" />
                          Automático
                        </span>
                      </div>
                      <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        {pipelines.map((pipeline) => (
                          <PipelineCard key={pipeline.id} pipeline={pipeline} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
