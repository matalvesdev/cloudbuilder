import { useState, useEffect, useCallback } from 'react'
import {
  Flag,
  RefreshCw,
  Plus,
  Check,
  X,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
  Search,
} from 'lucide-react'
import { useUiStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'
import { featureFlagsApi, type FeatureFlagDTO, type UpdateFlagRequest } from '@/api/featureFlags'
import { showSuccess, showError } from '@/lib/toast'
import { cn } from '@/lib/utils'

const defaultFlags = [
  { key: 'module.cost', label: 'Módulo Custos', desc: 'Habilitar módulo de Custos' },
  { key: 'module.platform', label: 'Módulo Plataforma', desc: 'Habilitar módulo de Plataforma' },
  { key: 'module.aiops', label: 'Módulo AIOps', desc: 'Habilitar módulo AIOps' },
  { key: 'module.audit', label: 'Módulo Auditoria', desc: 'Habilitar módulo de Auditoria' },
  { key: 'module.iam', label: 'Módulo IAM', desc: 'Habilitar módulo IAM (stub)' },
  { key: 'feature.what-if-cost', label: 'What-if Custos', desc: 'Cenários what-if de custos' },
  { key: 'feature.preview-workflow', label: 'Preview Workflow', desc: 'Preview de deploy workflow' },
  { key: 'config.max-users', label: 'Limite de Usuários', desc: 'Limite máximo de usuários por tenant' },
]

export function FeatureFlagsPage() {
  const { featureFlags, refreshFlags, flagsLoaded, flagsLoading } = useUiStore()
  const { user } = useAuthStore()
  const [localFlags, setLocalFlags] = useState<FeatureFlagDTO[]>([])
  const [toggling, setToggling] = useState<Record<string, boolean>>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [editingConfig, setEditingConfig] = useState<string | null>(null)
  const [configValue, setConfigValue] = useState('')

  const isAdmin = user?.roles?.includes('admin') ?? false

  const loadFlags = useCallback(async () => {
    try {
      const flags = await featureFlagsApi.getFlags()
      setLocalFlags(flags)
    } catch {
      // uiStore already has flags, use those
      setLocalFlags(Object.values(featureFlags))
    }
  }, [featureFlags])

  useEffect(() => {
    if (flagsLoaded) {
      setLocalFlags(Object.values(featureFlags))
    } else {
      loadFlags()
    }
  }, [flagsLoaded, featureFlags, loadFlags])

  const handleToggle = async (flag: FeatureFlagDTO) => {
    if (!isAdmin) return
    setToggling((prev) => ({ ...prev, [flag.id]: true }))
    try {
      const updated = await featureFlagsApi.updateFlag(flag.id, {
        enabled: !flag.enabled,
      })
      setLocalFlags((prev) =>
        prev.map((f) => (f.id === flag.id ? updated : f))
      )
      await refreshFlags()
      showSuccess(flag.enabled ? `Flag "${flag.flagKey}" desabilitada` : `Flag "${flag.flagKey}" habilitada`)
    } catch (err: any) {
      showError(err?.message || 'Erro ao alterar flag')
    } finally {
      setToggling((prev) => ({ ...prev, [flag.id]: false }))
    }
  }

  const handleUpdateConfig = async (flag: FeatureFlagDTO) => {
    if (!isAdmin) return
    try {
      const req: UpdateFlagRequest = { configJson: configValue }
      const updated = await featureFlagsApi.updateFlag(flag.id, req)
      setLocalFlags((prev) =>
        prev.map((f) => (f.id === flag.id ? updated : f))
      )
      await refreshFlags()
      setEditingConfig(null)
      showSuccess(`Config da flag "${flag.flagKey}" atualizada`)
    } catch (err: any) {
      showError(err?.message || 'Erro ao atualizar config')
    }
  }

  const handleRefresh = async () => {
    try {
      await refreshFlags()
      await loadFlags()
      showSuccess('Cache de flags recarregado')
    } catch {
      showError('Erro ao recarregar cache')
    }
  }

  const filteredFlags = localFlags.filter((f) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      f.flagKey.toLowerCase().includes(q) ||
      (f.description ?? '').toLowerCase().includes(q)
    )
  })

  // Group flags by prefix
  const groupedFlags: Record<string, FeatureFlagDTO[]> = {}
  for (const flag of filteredFlags) {
    const group = flag.flagKey.startsWith('module.')
      ? 'Módulos'
      : flag.flagKey.startsWith('feature.')
        ? 'Funcionalidades'
        : 'Configurações'
    if (!groupedFlags[group]) groupedFlags[group] = []
    groupedFlags[group].push(flag)
  }

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Header */}
      <div className="shrink-0 bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-navy flex items-center justify-center">
              <Flag className="w-4 h-4 text-brand-lime" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-brand-navy">Feature Flags</h1>
              <p className="text-xs text-slate-500">
                Gerencie flags de funcionalidades por tenant (ADR-032)
              </p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={flagsLoading}
            className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-bold bg-ice-blue/60 text-brand-navy hover:bg-ice-blue border border-brand-navy/10 transition-all disabled:opacity-50"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', flagsLoading && 'animate-spin')} />
            Recarregar
          </button>
        </div>
        {/* Search */}
        <div className="relative max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar flags..."
            className="w-full h-8 pl-8 pr-3 rounded-lg bg-slate-100 border border-transparent text-xs text-brand-navy placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-slate-200 focus:shadow-sm transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        {!isAdmin && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-600">
            <AlertTriangle className="w-3.5 h-3.5" />
            Apenas administradores podem alterar flags
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {!flagsLoaded && localFlags.length === 0 ? (
          <div className="flex items-center justify-center h-48">
            <div className="flex flex-col items-center gap-2 text-sm text-slate-400">
              <div className="w-8 h-8 rounded-lg bg-brand-navy flex items-center justify-center">
                <Flag className="h-4 w-4 text-brand-lime animate-pulse" />
              </div>
              Carregando flags...
            </div>
          </div>
        ) : filteredFlags.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-sm text-slate-400">
            Nenhuma flag encontrada para "{searchQuery}"
          </div>
        ) : (
          Object.entries(groupedFlags).map(([group, flags]) => (
            <div key={group} className="mb-6 last:mb-0">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
                {group}
              </h3>
              <div className="space-y-1">
                {flags.map((flag) => (
                  <div
                    key={flag.id}
                    className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <code className="text-xs font-mono font-bold text-brand-navy">
                            {flag.flagKey}
                          </code>
                          {flag.resolved && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                              tenant
                            </span>
                          )}
                        </div>
                        {flag.description && (
                          <p className="text-xs text-slate-500">{flag.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1.5">
                          {flag.tenantId ? (
                            <span className="text-[10px] font-medium text-slate-400">
                              Tenant: {flag.tenantId.substring(0, 8)}...
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-green-600">
                              Global
                            </span>
                          )}
                          {flag.configJson && (
                            <button
                              onClick={() => {
                                setEditingConfig(editingConfig === flag.id ? null : flag.id)
                                setConfigValue(flag.configJson ?? '')
                              }}
                              className="text-[10px] font-medium text-ice-blue-600 hover:text-brand-navy transition-colors"
                              disabled={!isAdmin}
                            >
                              {editingConfig === flag.id ? 'Fechar' : 'Config'}
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isAdmin ? (
                          <button
                            onClick={() => handleToggle(flag)}
                            disabled={toggling[flag.id]}
                            className={cn(
                              'inline-flex items-center gap-1.5 px-2.5 h-7 rounded-lg text-[11px] font-bold border transition-all disabled:opacity-50',
                              flag.enabled
                                ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                                : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                            )}
                          >
                            {toggling[flag.id] ? (
                              <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : flag.enabled ? (
                              <ToggleRight className="w-3.5 h-3.5" />
                            ) : (
                              <ToggleLeft className="w-3.5 h-3.5" />
                            )}
                            {flag.enabled ? 'Ativo' : 'Inativo'}
                          </button>
                        ) : (
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 px-2 h-6 rounded-full text-[10px] font-semibold',
                              flag.enabled
                                ? 'bg-green-50 text-green-700'
                                : 'bg-slate-100 text-slate-500'
                            )}
                          >
                            {flag.enabled ? (
                              <Check className="w-3 h-3" />
                            ) : (
                              <X className="w-3 h-3" />
                            )}
                            {flag.enabled ? 'Ativo' : 'Inativo'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Config editor */}
                    {editingConfig === flag.id && (
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
                          Config JSON
                        </label>
                        <div className="flex gap-2">
                          <input
                            value={configValue}
                            onChange={(e) => setConfigValue(e.target.value)}
                            className="flex-1 h-8 px-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono text-brand-navy focus:outline-none focus:border-brand-navy focus:ring-1 focus:ring-brand-navy/20"
                            placeholder='{"value": 10}'
                          />
                          <button
                            onClick={() => handleUpdateConfig(flag)}
                            className="px-3 h-8 rounded-lg bg-brand-navy text-white text-[11px] font-bold hover:bg-[#0D1B2A] transition-all"
                          >
                            Salvar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
