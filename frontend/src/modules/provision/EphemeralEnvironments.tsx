import { useState, useEffect, useCallback } from 'react'
import {
  Timer,
  Plus,
  Trash2,
  ExternalLink,
  Clock,
  Loader2,
  GitBranch,
  Github,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Hourglass,
  RefreshCw,
  Zap,
  DollarSign,
  Globe,
  Server,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEphemeralStore } from '@/store/ephemeralStore'
import type { EphemeralEnv, EphemeralCreateRequest, ResourceSize } from '@/types/ephemeral.types'

const TTL_OPTIONS = [
  { value: 1, label: '1 hora' },
  { value: 6, label: '6 horas' },
  { value: 24, label: '24 horas' },
  { value: 48, label: '48 horas' },
]

const RESOURCE_SIZE_OPTIONS: { value: ResourceSize; label: string; desc: string }[] = [
  { value: 'small', label: 'Pequeno', desc: 't3.micro, db.t3.micro' },
  { value: 'medium', label: 'Médio', desc: 't3.medium, db.t3.medium' },
  { value: 'large', label: 'Grande', desc: 't3.large, db.t3.large' },
]

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string; icon: typeof Loader2 }> = {
  creating: { label: 'Criando', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: Loader2 },
  active: { label: 'Ativo', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: CheckCircle2 },
  destroying: { label: 'Destruindo', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: Loader2 },
  destroyed: { label: 'Destruído', bg: 'bg-slate-50', text: 'text-slate-500', border: 'border-slate-200', icon: XCircle },
}

function TtlCountdown({ expiresAt }: { expiresAt: string }) {
  const [remaining, setRemaining] = useState('')

  useEffect(() => {
    function tick() {
      const diff = new Date(expiresAt).getTime() - Date.now()
      if (diff <= 0) { setRemaining('Expirado'); return }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setRemaining(`${h}h ${m}m ${s}s`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [expiresAt])

  const isExpired = new Date(expiresAt).getTime() <= Date.now()

  return (
    <span className={cn(
      'inline-flex items-center gap-1 text-[11px] font-semibold',
      isExpired ? 'text-red-500' : 'text-slate-500'
    )}>
      <Clock className="w-3 h-3" />
      {remaining}
    </span>
  )
}

function EphemeralCard({ env, onDestroy, onExtend }: {
  env: EphemeralEnv
  onDestroy: (id: string) => void
  onExtend: (id: string) => void
}) {
  const cfg = STATUS_CONFIG[env.status]
  const StatusIcon = cfg.icon
  const isAnimating = env.status === 'creating' || env.status === 'destroying'

  return (
    <div className={cn(
      'bg-white border rounded-xl p-5 shadow-sm transition-all',
      env.status === 'active' ? 'border-slate-200 hover:shadow-md' :
      env.status === 'destroyed' ? 'border-slate-100 opacity-60' :
      'border-amber-200'
    )}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center',
            env.status === 'active' ? 'bg-green-50' :
            env.status === 'destroyed' ? 'bg-slate-100' :
            'bg-amber-50'
          )}>
            <Zap className={cn(
              'w-5 h-5',
              env.status === 'active' ? 'text-green-600' :
              env.status === 'destroyed' ? 'text-slate-400' :
              'text-amber-500'
            )} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-brand-navy">{env.name}</span>
              <span className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border',
                cfg.bg, cfg.text, cfg.border
              )}>
                {isAnimating ? <StatusIcon className="w-2.5 h-2.5 animate-spin" /> : <StatusIcon className="w-2.5 h-2.5" />}
                {cfg.label}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <GitBranch className="w-3 h-3 text-slate-400" />
              <span className="text-[11px] text-slate-500 font-mono">{env.branchName}</span>
              {env.prNumber && (
                <a
                  href={env.prUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-brand-navy hover:underline"
                >
                  <Github className="w-3 h-3" />
                  PR #{env.prNumber}
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </div>
          </div>
        </div>
        {env.status === 'active' && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => onExtend(env.id)}
              className="p-2 rounded-lg text-slate-400 hover:text-brand-navy hover:bg-slate-100 transition-all"
              title="Estender TTL"
            >
              <Timer className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDestroy(env.id)}
              className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
              title="Destruir ambiente"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 text-[11px]">
        <TtlCountdown expiresAt={env.expiresAt} />
        {env.baseUrl && env.status === 'active' && (
          <a
            href={env.baseUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-brand-navy hover:underline"
          >
            <ExternalLink className="w-3 h-3" />
            {env.baseUrl}
          </a>
        )}
        <span className="inline-flex items-center gap-1 text-slate-500">
          <DollarSign className="w-3 h-3" />
          $ {env.cost.toFixed(2)}
        </span>
      </div>

      {env.resources.length > 0 && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
          {env.resources.map((r, i) => (
            <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
              <Server className="w-2.5 h-2.5" />
              {r.name} ({r.size})
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function CreateEphemeralForm({ onClose }: { onClose: () => void }) {
  const { createEphemeral, creating } = useEphemeralStore()
  const [name, setName] = useState('')
  const [branchName, setBranchName] = useState('feature/')
  const [ttlHours, setTtlHours] = useState(6)
  const [resourceSize, setResourceSize] = useState<ResourceSize>('small')

  const handleCreate = async () => {
    if (!name.trim() || !branchName.trim()) return
    const req: EphemeralCreateRequest = {
      name: name.trim(),
      repoId: 'default',
      branchName: branchName.trim(),
      sourceEnvId: 'default',
      ttl_hours: ttlHours,
      resourceSize,
    }
    await createEphemeral(req)
    onClose()
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card">
      <h3 className="text-[12px] font-bold uppercase tracking-wide text-slate-400 mb-4">
        Criar Ambiente Efêmero
      </h3>
      <div className="space-y-3">
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Nome
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-9 px-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy bg-white transition-all"
            placeholder="Ex: feature-login-tests"
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Branch
          </label>
          <div className="relative">
            <GitBranch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={branchName}
              onChange={(e) => setBranchName(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy bg-white transition-all"
            />
          </div>
        </div>
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            TTL
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {TTL_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTtlHours(opt.value)}
                className={cn(
                  'py-2 rounded-lg text-[11px] font-semibold border transition-all',
                  ttlHours === opt.value
                    ? 'bg-brand-navy text-white border-brand-navy'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-brand-navy'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Tamanho dos Recursos
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {RESOURCE_SIZE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setResourceSize(opt.value)}
                className={cn(
                  'py-2 px-2 rounded-lg text-[11px] font-semibold border transition-all text-center',
                  resourceSize === opt.value
                    ? 'bg-brand-navy text-white border-brand-navy'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-brand-navy'
                )}
              >
                <div>{opt.label}</div>
                <div className="text-[8px] opacity-70 mt-0.5">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between pt-2">
          <span className="text-[11px] text-slate-400">
            Custo estimado: <strong className="text-brand-navy">${(ttlHours * 0.42 + (resourceSize === 'small' ? 0 : resourceSize === 'medium' ? 0.5 : 1.2)).toFixed(2)}</strong>
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 h-8 rounded-full text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={handleCreate}
              disabled={creating || !name.trim() || !branchName.trim()}
              className="inline-flex items-center gap-1.5 px-4 h-8 rounded-full text-[11px] font-bold bg-brand-navy text-white hover:bg-[#0D1B2A] transition-all disabled:opacity-50"
            >
              {creating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
              {creating ? 'Criando...' : 'Criar Ambiente'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function EphemeralEnvironments({ className }: { className?: string }) {
  const { environments, fetchEnvironments, loading, destroyEphemeral, extendTtl, getActiveCount, getMonthlyCost } = useEphemeralStore()
  const [showCreate, setShowCreate] = useState(false)
  const [extendingId, setExtendingId] = useState<string | null>(null)

  useEffect(() => {
    fetchEnvironments()
  }, [fetchEnvironments])

  const handleDestroy = useCallback(async (id: string) => {
    await destroyEphemeral(id)
  }, [destroyEphemeral])

  const handleExtend = useCallback(async (id: string) => {
    setExtendingId(id)
    await extendTtl(id, 6)
    setExtendingId(null)
  }, [extendTtl])

  const activeCount = getActiveCount()
  const monthlyCost = getMonthlyCost()

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <Zap className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h3 className="text-[12px] font-bold uppercase tracking-wide text-slate-400">Ambientes Efêmeros</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Ambientes temporários para PRs e branches de feature
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 text-[11px]">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200 font-semibold">
              <Zap className="w-3 h-3" />
              {activeCount} ativo{activeCount !== 1 ? 's' : ''}
            </span>
            <span className="inline-flex items-center gap-1 text-slate-500 font-medium">
              <DollarSign className="w-3 h-3" />
              Custo atual: ${monthlyCost.toFixed(2)}
            </span>
          </div>
          <button
            onClick={() => fetchEnvironments()}
            className="p-2 rounded-lg text-slate-400 hover:text-brand-navy hover:bg-slate-100 transition-all"
          >
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </button>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className={cn(
              'inline-flex items-center gap-1.5 px-4 h-8 rounded-full text-[11px] font-bold transition-all',
              showCreate
                ? 'bg-slate-100 text-slate-600'
                : 'bg-brand-navy text-white hover:bg-[#0D1B2A]'
            )}
          >
            {showCreate ? <XCircle className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            {showCreate ? 'Fechar' : 'Criar Efêmero'}
          </button>
        </div>
      </div>

      {showCreate && (
        <CreateEphemeralForm onClose={() => setShowCreate(false)} />
      )}

      {loading && environments.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-brand-navy" />
        </div>
      ) : environments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-ice-blue flex items-center justify-center mb-3">
            <Zap className="w-6 h-6 text-brand-navy" />
          </div>
          <p className="text-sm font-semibold text-brand-navy mb-1">Nenhum ambiente efêmero</p>
          <p className="text-[11px] text-slate-400 max-w-sm">
            Crie ambientes temporários para testar PRs e branches de feature com um custo reduzido.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {environments.map((env) => (
            <EphemeralCard
              key={env.id}
              env={env}
              onDestroy={handleDestroy}
              onExtend={handleExtend}
            />
          ))}
        </div>
      )}
    </div>
  )
}
