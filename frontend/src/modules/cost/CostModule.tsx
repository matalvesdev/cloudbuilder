import { useState, useEffect } from 'react'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  Zap,
  CheckCircle2,
  Calculator,
  ChevronRight,
  ArrowRight,
  X,
  AlertTriangle,
  Server,
  HardDrive,
  Database,
  Network,
  Package,
  PieChart,
  Activity,
  BarChart3,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useCostStore } from '@/store/costStore'
import { useCanvasStore } from '@/store/canvasStore'
import { useUiStore } from '@/store/uiStore'
import { WhatIfCost } from './WhatIfCost'
import { BudgetComparisonView } from './BudgetComparisonView'
import { CostAnomaliesView } from './CostAnomaliesView'
import { CostProjectionChart } from './CostProjectionChart'
import { cn } from '@/lib/utils'
import { ProtectedAction } from '@/components/ProtectedContent'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { OptimizationSuggestion, ProviderType } from '@/types/cost.types'

const providerConfig: Record<ProviderType, { label: string; barColor: string; badge: string }> = {
  aws: { label: 'AWS', barColor: 'bg-orange-500', badge: 'bg-orange-100 text-orange-700' },
  azure: { label: 'Azure', barColor: 'bg-blue-600', badge: 'bg-blue-100 text-blue-700' },
  gcp: { label: 'GCP', barColor: 'bg-blue-500', badge: 'bg-green-100 text-green-700' },
}

const serviceConfig: Record<string, { label: string; icon: typeof Server }> = {
  compute: { label: 'Compute', icon: Server },
  storage: { label: 'Armazenamento', icon: HardDrive },
  database: { label: 'Banco de Dados', icon: Database },
  network: { label: 'Rede', icon: Network },
  outros: { label: 'Outros', icon: Package },
}

const severityConfig = {
  high: { label: 'Alta', class: 'bg-red-100 text-red-700' },
  medium: { label: 'Média', class: 'bg-amber-100 text-amber-700' },
  low: { label: 'Baixa', class: 'bg-slate-100 text-slate-600' },
}

function formatCurrency(value: number): string {
  return `US$ ${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function formatSavings(value: number): string {
  return `US$ ${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/mês`
}

function navigateToDesign(resourceName: string) {
  const { nodes } = useCanvasStore.getState()
  const match = nodes.find(
    (n) => n.data?.label?.toLowerCase().includes(resourceName.toLowerCase())
  )
  if (match) {
    useCanvasStore.getState().setSelectedNode(match.id)
  }
  useUiStore.getState().setActiveModule('design')
}

function ConfirmationModal({
  opt,
  onConfirm,
  onClose,
}: {
  opt: OptimizationSuggestion
  onConfirm: () => void
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-3xl card-shadow border border-slate-100 p-6 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-brand-navy font-display">Confirmar Otimização</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <Server className="w-5 h-5 text-brand-navy shrink-0" />
            <div>
              <p className="text-sm font-semibold text-brand-navy">{opt.resourceName}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', providerConfig[opt.provider].badge)}>
                  {providerConfig[opt.provider].label}
                </span>
                <span className="text-xs text-slate-400">{opt.resourceType}</span>
              </div>
            </div>
          </div>

          <p className="text-sm text-slate-600 bg-amber-50 border border-amber-200 rounded-xl p-3">
            <AlertTriangle className="w-4 h-4 inline mr-1.5 text-amber-500 align-middle" />
            {opt.suggestion}
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl bg-red-50 border border-red-100 p-4 text-center">
              <p className="text-xs text-red-600 font-medium mb-1">Custo Atual</p>
              <p className="text-xl font-bold text-red-600">{formatCurrency(opt.currentCost)}</p>
            </div>
            <div className="rounded-2xl bg-green-50 border border-green-100 p-4 text-center">
              <p className="text-xs text-green-600 font-medium mb-1">Custo Otimizado</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(opt.estimatedCost)}</p>
            </div>
          </div>

          <div className="rounded-2xl bg-brand-navy p-4 text-center">
            <p className="text-xs text-white/70 font-medium mb-1">Economia Mensal</p>
            <p className="text-2xl font-bold text-brand-lime">{formatSavings(opt.savings)}</p>
            <p className="text-xs text-white/50 mt-1">
              {opt.savingsPercent}% de redução
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <ProtectedAction roles={['admin', 'editor']}>
            <button
              onClick={onConfirm}
              className="flex-1 py-2.5 px-4 rounded-xl bg-brand-navy text-sm font-bold text-white hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4" />
              Confirmar e Aplicar
            </button>
          </ProtectedAction>
        </div>
      </div>
    </div>
  )
}

function OptimizationCard({
  opt,
  onOptimize,
}: {
  opt: OptimizationSuggestion
  onOptimize: (id: string) => void
}) {
  const pctWidth = Math.min((opt.savings / opt.currentCost) * 100, 100)

  return (
    <div
      className={cn(
        'rounded-2xl border p-4 transition-all',
        opt.applied
          ? 'border-green-200 bg-green-50/50'
          : 'border-slate-100 bg-white card-shadow hover:shadow-md'
      )}
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            'rounded-xl p-2.5 shrink-0',
            opt.applied ? 'bg-green-100' : 'bg-ice-blue'
          )}
        >
          {opt.applied ? (
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          ) : (
            <Zap className="w-5 h-5 text-brand-navy" />
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-brand-navy">{opt.resourceName}</p>
                <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', providerConfig[opt.provider].badge)}>
                  {providerConfig[opt.provider].label}
                </span>
                <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', severityConfig[opt.severity].class)}>
                  {severityConfig[opt.severity].label}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{opt.resourceType} · {opt.suggestion}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <div>
              <span className="text-slate-400">Atual: </span>
              <span className="font-semibold text-slate-700">{formatCurrency(opt.currentCost)}</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
            <div>
              <span className="text-slate-400">Otimizado: </span>
              <span className="font-semibold text-green-600">{formatCurrency(opt.estimatedCost)}</span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-lg">
                -{formatSavings(opt.savings)}
              </span>
            </div>
          </div>

          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-500"
              style={{ width: `${pctWidth}%` }}
            />
          </div>
        </div>

        <div className="shrink-0">
          {opt.applied ? (
            <button
              onClick={() => navigateToDesign(opt.resourceName)}
              className="py-2 px-4 rounded-xl bg-green-600 text-xs font-bold text-white hover:bg-green-700 transition-colors flex items-center gap-1.5"
            >
              <ChevronRight className="w-3.5 h-3.5" />
              Ir para Design
            </button>
          ) : (
          <ProtectedAction roles={['admin', 'editor']}>
            <button
              onClick={() => onOptimize(opt.id)}
              className="py-2 px-4 rounded-xl bg-brand-navy text-xs font-bold text-white hover:opacity-90 transition-opacity"
            >
              Otimizar
            </button>
          </ProtectedAction>
          )}
        </div>
      </div>
    </div>
  )
}

function OverviewContent() {
  const { costHistory, costSummary, optimizations, applyOptimization, loading } = useCostStore()
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

  const confirmingOpt = confirmingId
    ? optimizations.find((o) => o.id === confirmingId) ?? null
    : null

  const pendingCount = optimizations.filter((o) => !o.applied).length
  const totalSavings = optimizations
    .filter((o) => !o.applied)
    .reduce((s, o) => s + o.savings, 0)

  const maxHistory = Math.max(...costHistory.map((m) => m.total))
  const latestTotal = costHistory[costHistory.length - 1].total
  const prevTotal = costHistory[costHistory.length - 2]?.total ?? latestTotal
  const changePct = ((latestTotal - prevTotal) / prevTotal * 100).toFixed(1)
  const isUp = parseFloat(changePct) >= 0

  const providerTotal = Object.values(costSummary.byProvider).reduce((a, b) => a + b, 0)

  function handleConfirm() {
    if (confirmingId) {
      applyOptimization(confirmingId)
      setConfirmingId(null)
    }
  }

  return (
    <>
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card title="Custo Mensal" value={formatCurrency(costSummary.totalMonthly)} icon={DollarSign} />
        <Card title="Economia Potencial" value={formatSavings(totalSavings)} icon={Wallet} />
        <Card
          title="Otimizações"
          value={`${pendingCount} disponíveis`}
          icon={Zap}
        />
        <Card
          title="vs Mês Anterior"
          value={`${isUp ? '+' : ''}${changePct}%`}
          icon={isUp ? TrendingUp : TrendingDown}
        />
      </div>

      {/* Trend Chart + Provider Breakdown */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white rounded-3xl card-shadow border border-slate-100 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-lime" />
            <h2 className="text-xs font-bold tracking-widest text-slate-400 uppercase">Tendência Mensal</h2>
          </div>
          <div className="flex items-end gap-3 h-44 pt-2">
            {costHistory.map((m, i) => {
              const pct = (m.total / maxHistory) * 100
              const isCurrent = i === costHistory.length - 1
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <span className="text-[10px] font-semibold text-slate-500">
                    {formatCurrency(m.total)}
                  </span>
                  <div
                    className={cn(
                      'w-full rounded-t-lg transition-all duration-300',
                      isCurrent ? 'bg-brand-navy' : 'bg-slate-200 hover:bg-slate-300'
                    )}
                    style={{ height: `${pct}%`, minHeight: '8px' }}
                  />
                  <span
                    className={cn(
                      'text-xs font-medium',
                      isCurrent ? 'text-brand-navy font-bold' : 'text-slate-400'
                    )}
                  >
                    {m.month}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-white rounded-3xl card-shadow border border-slate-100 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-lime" />
            <h2 className="text-xs font-bold tracking-widest text-slate-400 uppercase">Por Provedor</h2>
          </div>

          <div className="flex h-3 rounded-full overflow-hidden">
            {(Object.entries(costSummary.byProvider) as [ProviderType, number][]).map(([provider, value]) => (
              <div
                key={provider}
                className={providerConfig[provider].barColor}
                style={{ width: `${(value / providerTotal) * 100}%` }}
              />
            ))}
          </div>

          <div className="space-y-3 pt-1">
            {(Object.entries(costSummary.byProvider) as [ProviderType, number][]).map(([provider, value]) => {
              const pct = ((value / providerTotal) * 100).toFixed(0)
              return (
                <div key={provider} className="flex items-center gap-3">
                  <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium min-w-[52px] text-center', providerConfig[provider].badge)}>
                    {providerConfig[provider].label}
                  </span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full', providerConfig[provider].barColor)}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-600 w-16 text-right">{formatCurrency(value)}</span>
                  <span className="text-xs text-slate-400 w-10 text-right">{pct}%</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Cost by Service */}
      <div className="bg-white rounded-3xl card-shadow border border-slate-100 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-brand-lime" />
          <h2 className="text-xs font-bold tracking-widest text-slate-400 uppercase">Custos por Serviço</h2>
        </div>
        <div className="grid grid-cols-5 gap-4">
          {(Object.entries(costSummary.byService) as [string, number][]).map(([key, value]) => {
            const config = serviceConfig[key] ?? { label: key, icon: Package }
            const Icon = config.icon
            const pct = ((value / costSummary.totalMonthly) * 100).toFixed(0)
            return (
              <div key={key} className="rounded-2xl bg-slate-50 border border-slate-100 p-4 text-center space-y-2">
                <div className="inline-flex p-2.5 rounded-xl bg-white card-shadow">
                  <Icon className="w-5 h-5 text-brand-navy" />
                </div>
                <p className="text-xs font-medium text-slate-500">{config.label}</p>
                <p className="text-lg font-bold text-brand-navy">{formatCurrency(value)}</p>
                <p className="text-[10px] text-slate-400">{pct}% do total</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Optimizations */}
      <div className="bg-white rounded-3xl card-shadow border border-slate-100 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-lime" />
            <h2 className="text-xs font-bold tracking-widest text-slate-400 uppercase">Otimizações Disponíveis</h2>
          </div>
          <Badge variant="outline" className="text-xs">
            {totalSavings > 0
              ? `${formatSavings(totalSavings)} em economia potencial`
              : 'Nenhuma pendente'}
          </Badge>
        </div>

        {optimizations.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-400" />
            <p className="text-sm font-medium">Todas as otimizações foram aplicadas</p>
          </div>
        ) : (
          <div className="space-y-3">
            {optimizations.map((opt) => (
              <OptimizationCard
                key={opt.id}
                opt={opt}
                onOptimize={setConfirmingId}
              />
            ))}
          </div>
        )}
      </div>

      {confirmingOpt && (
        <ConfirmationModal
          opt={confirmingOpt}
          onConfirm={handleConfirm}
          onClose={() => setConfirmingId(null)}
        />
      )}
    </>
  )
}

export function CostModule() {
  const { loading } = useCostStore()
  const [activeTab, setActiveTab] = useState('overview')
  const [initialLoad, setInitialLoad] = useState(true)
  const { fetchCostData } = useCostStore()

  useEffect(() => {
    fetchCostData().finally(() => setInitialLoad(false))
  }, [fetchCostData])

  return (
    <div className="p-6 space-y-6 overflow-y-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-brand-navy font-display">Custos e Otimizações</h1>
            <p className="text-sm text-slate-400">Monitore gastos e aplique otimizações nos recursos</p>
          </div>
        </div>
        <div className={cn(
          "flex items-center gap-2 text-xs rounded-xl px-4 py-2 border transition-colors",
          loading ? "bg-amber-50 text-amber-600 border-amber-200" : "bg-slate-50 text-slate-400 border-slate-100"
        )}>
          <div className={cn("w-2 h-2 rounded-full", loading ? "bg-amber-500 animate-pulse" : "bg-green-500")} />
          {loading ? 'Atualizando dados...' : 'Dados conectados à API'}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-100">
          <TabsTrigger value="overview" className="gap-2">
            <PieChart className="h-4 w-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="whatif" className="gap-2">
            <Calculator className="h-4 w-4" />
            What-if
          </TabsTrigger>
          <TabsTrigger value="budgets" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Orçamentos
          </TabsTrigger>
          <TabsTrigger value="anomalies" className="gap-2">
            <Activity className="h-4 w-4" />
            Anomalias
          </TabsTrigger>
          <TabsTrigger value="projection" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Projeção
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {loading && initialLoad ? (
            <div className="space-y-6">
              <div className="grid grid-cols-4 gap-4">
                {[1,2,3,4].map((i) => (
                  <div key={i} className="rounded-3xl bg-white border border-slate-100 card-shadow p-5 space-y-3">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-32" />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2 rounded-3xl bg-white border border-slate-100 card-shadow p-6">
                  <Skeleton className="h-4 w-32 mb-6" />
                  <div className="flex items-end gap-3 h-44">
                    {[1,2,3,4,5,6].map((i) => (
                      <Skeleton key={i} className="flex-1 h-24 rounded-t-lg" />
                    ))}
                  </div>
                </div>
                <div className="rounded-3xl bg-white border border-slate-100 card-shadow p-6">
                  <Skeleton className="h-4 w-24 mb-6" />
                  <Skeleton className="h-3 w-full mb-4" />
                  {[1,2,3].map((i) => (
                    <div key={i} className="flex items-center gap-3 mb-3">
                      <Skeleton className="h-5 w-12 rounded-full" />
                      <Skeleton className="flex-1 h-2" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-3xl bg-white border border-slate-100 card-shadow p-6">
                <Skeleton className="h-4 w-32 mb-6" />
                <div className="grid grid-cols-5 gap-4">
                  {[1,2,3,4,5].map((i) => (
                    <div key={i} className="rounded-2xl bg-slate-50 border border-slate-100 p-4 text-center space-y-2">
                      <Skeleton className="h-10 w-10 rounded-xl mx-auto" />
                      <Skeleton className="h-3 w-16 mx-auto" />
                      <Skeleton className="h-6 w-20 mx-auto" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-3xl bg-white border border-slate-100 card-shadow p-6">
                <Skeleton className="h-4 w-40 mb-6" />
                <div className="space-y-3">
                  {[1,2,3].map((i) => (
                    <div key={i} className="rounded-2xl border border-slate-100 p-4">
                      <div className="flex items-center gap-4">
                        <Skeleton className="h-10 w-10 rounded-xl" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-48" />
                          <Skeleton className="h-3 w-64" />
                        </div>
                        <Skeleton className="h-8 w-20 rounded-xl" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <OverviewContent />
          )}
        </TabsContent>

        <TabsContent value="whatif">
          <WhatIfCost />
        </TabsContent>

        <TabsContent value="budgets">
          <BudgetComparisonView />
        </TabsContent>

        <TabsContent value="anomalies">
          <CostAnomaliesView />
        </TabsContent>

        <TabsContent value="projection">
          <CostProjectionChart />
        </TabsContent>
      </Tabs>
    </div>
  )
}
