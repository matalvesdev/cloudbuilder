import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import {
  Wrench,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  AlertTriangle,
  Search,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────

export interface RemediationAction {
  id: string
  incidentId: string
  incidentTitle: string
  description: string
  command: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  service: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped'
  createdAt: string
  completedAt: string | null
  result: string | null
  automated: boolean
}

// ─── Sub-components ──────────────────────────────────────────

function SeverityBadge({ severity }: { severity: RemediationAction['severity'] }) {
  const config = {
    critical: { bg: 'bg-red-50 text-red-700 border-red-200', label: 'Crítico' },
    high: { bg: 'bg-orange-50 text-orange-700 border-orange-200', label: 'Alto' },
    medium: { bg: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Médio' },
    low: { bg: 'bg-slate-50 text-slate-600 border-slate-200', label: 'Baixo' },
  }[severity]

  return (
    <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full border font-medium', config.bg)}>
      {config.label}
    </span>
  )
}

function StatusBadge({ status }: { status: RemediationAction['status'] }) {
  const config = {
    pending: { icon: Clock, bg: 'bg-slate-50 text-slate-600 border-slate-200', label: 'Pendente' },
    running: { icon: Loader2, bg: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Executando' },
    completed: { icon: CheckCircle2, bg: 'bg-green-50 text-green-700 border-green-200', label: 'Concluído' },
    failed: { icon: XCircle, bg: 'bg-red-50 text-red-700 border-red-200', label: 'Falhou' },
    skipped: { icon: AlertTriangle, bg: 'bg-slate-50 text-slate-500 border-slate-200', label: 'Pulado' },
  }[status]

  const Icon = config.icon
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border', config.bg)}>
      <Icon className={cn('w-3 h-3', status === 'running' && 'animate-spin')} />
      {config.label}
    </span>
  )
}

// ─── Main Component ──────────────────────────────────────────

interface AutoRemediationPanelProps {
  className?: string
  actions?: RemediationAction[]
  onExecute?: (action: RemediationAction) => Promise<void>
}

export function AutoRemediationPanel({ className, actions = [], onExecute }: AutoRemediationPanelProps) {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [executingId, setExecutingId] = useState<string | null>(null)
  const [selectedAction, setSelectedAction] = useState<RemediationAction | null>(null)

  const filteredActions = useMemo(() => {
    return actions.filter((a) => {
      const matchesSearch =
        a.description.toLowerCase().includes(search.toLowerCase()) ||
        a.incidentTitle.toLowerCase().includes(search.toLowerCase()) ||
        a.service.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = filterStatus === 'all' || a.status === filterStatus
      return matchesSearch && matchesStatus
    })
  }, [actions, search, filterStatus])

  const handleExecute = async (action: RemediationAction) => {
    if (!onExecute) return
    setExecutingId(action.id)
    try {
      await onExecute(action)
    } finally {
      setExecutingId(null)
    }
  }

  const stats = useMemo(() => {
    return {
      total: actions.length,
      completed: actions.filter((a) => a.status === 'completed').length,
      running: actions.filter((a) => a.status === 'running').length,
      failed: actions.filter((a) => a.status === 'failed').length,
      pending: actions.filter((a) => a.status === 'pending').length,
    }
  }, [actions])

  if (actions.length === 0) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="py-12 text-center">
          <Wrench className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-400">Nenhuma ação de remediação disponível</p>
          <p className="text-xs text-slate-300 mt-1">As ações aparecerão automaticamente quando incidentes forem detectados</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Stats */}
      <div className="grid grid-cols-5 gap-3">
        <div className="bg-white rounded-xl p-3 border border-slate-100 text-center">
          <p className="text-lg font-bold text-brand-navy">{stats.total}</p>
          <p className="text-[10px] text-slate-400">Total</p>
        </div>
        <div className="bg-white rounded-xl p-3 border border-slate-100 text-center">
          <p className="text-lg font-bold text-green-600">{stats.completed}</p>
          <p className="text-[10px] text-slate-400">Concluídas</p>
        </div>
        <div className="bg-white rounded-xl p-3 border border-slate-100 text-center">
          <p className="text-lg font-bold text-blue-600">{stats.running}</p>
          <p className="text-[10px] text-slate-400">Executando</p>
        </div>
        <div className="bg-white rounded-xl p-3 border border-slate-100 text-center">
          <p className="text-lg font-bold text-red-600">{stats.failed}</p>
          <p className="text-[10px] text-slate-400">Falhas</p>
        </div>
        <div className="bg-white rounded-xl p-3 border border-slate-100 text-center">
          <p className="text-lg font-bold text-amber-600">{stats.pending}</p>
          <p className="text-[10px] text-slate-400">Pendentes</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar remediações..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-lime"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-lime"
        >
          <option value="all">Todos os status</option>
          <option value="pending">Pendente</option>
          <option value="running">Executando</option>
          <option value="completed">Concluído</option>
          <option value="failed">Falhou</option>
        </select>
      </div>

      {/* Actions List */}
      <div className="space-y-2">
        {filteredActions.length === 0 ? (
          <div className="py-12 text-center">
            <Wrench className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-400">Nenhuma ação de remediação encontrada</p>
          </div>
        ) : (
          filteredActions.map((action) => (
            <div
              key={action.id}
              className={cn(
                'bg-white border border-slate-200 rounded-xl p-4 transition-all',
                selectedAction?.id === action.id && 'ring-2 ring-brand-navy/20',
                action.status === 'failed' && 'border-red-200 bg-red-50/30',
                action.status === 'completed' && 'border-green-200 bg-green-50/30'
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {action.automated ? (
                      <span className="text-amber-500 font-medium text-xs">🤖</span>
                    ) : (
                      <Wrench className="w-4 h-4 text-brand-navy" />
                    )}
                    <p className="text-sm font-semibold text-brand-navy truncate">
                      {action.incidentTitle}
                    </p>
                    <SeverityBadge severity={action.severity} />
                    <StatusBadge status={action.status} />
                  </div>
                  <p className="text-xs text-slate-600 mb-1">{action.description}</p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <span>{action.service}</span>
                    <span className="text-slate-300">|</span>
                    {action.automated ? (
                      <span className="text-amber-600 font-medium">Automática</span>
                    ) : (
                      <span className="text-brand-navy font-medium">Manual</span>
                    )}
                    <span className="text-slate-300">|</span>
                    <Clock className="w-3 h-3" />
                    <span>{new Date(action.createdAt).toLocaleString('pt-BR')}</span>
                  </div>
                  {action.result && (
                    <div className={cn(
                      'mt-2 p-2 rounded-lg text-xs border',
                      action.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' :
                      action.status === 'failed' ? 'bg-red-50 text-red-700 border-red-200' :
                      'bg-slate-50 text-slate-600 border-slate-200'
                    )}>
                      {action.status === 'completed' ? <CheckCircle2 className="w-3 h-3 inline mr-1" /> : null}
                      {action.status === 'failed' ? <XCircle className="w-3 h-3 inline mr-1" /> : null}
                      {action.result}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
