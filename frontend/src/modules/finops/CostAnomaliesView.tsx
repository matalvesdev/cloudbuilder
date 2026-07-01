import { useEffect, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Loader2,
  RefreshCw,
  Filter,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCostStore } from '@/store/costStore'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { CostAnomaly } from '@/types/cost.types'

function formatCurrency(value: number): string {
  return `US$ ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const severityConfig: Record<string, { label: string; class: string }> = {
  LOW: { label: 'Baixa', class: 'bg-green-50 text-green-700 border-green-200' },
  MODERATE: { label: 'Moderada', class: 'bg-amber-50 text-amber-700 border-amber-200' },
  HIGH: { label: 'Alta', class: 'bg-orange-50 text-orange-700 border-orange-200' },
  CRITICAL: { label: 'Crítica', class: 'bg-red-50 text-red-700 border-red-200' },
}

function AnomalyRow({ anomaly }: { anomaly: CostAnomaly }) {
  const config = severityConfig[anomaly.severity] ?? severityConfig.LOW
  const isOver = anomaly.deviationPct >= 0

  return (
    <tr className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
      <td className="py-3.5 px-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            'rounded-lg p-2 shrink-0',
            isOver ? 'bg-red-50' : 'bg-green-50'
          )}>
            {isOver
              ? <TrendingUp className="w-4 h-4 text-red-500" />
              : <TrendingDown className="w-4 h-4 text-green-500" />
            }
          </div>
          <span className="text-sm font-semibold text-brand-navy">{anomaly.serviceName}</span>
        </div>
      </td>
      <td className="py-3.5 px-4 text-sm text-slate-500 whitespace-nowrap">
        {new Date(anomaly.date + 'T00:00:00').toLocaleDateString('pt-BR')}
      </td>
      <td className="py-3.5 px-4 text-sm font-semibold text-slate-700 whitespace-nowrap">
        {formatCurrency(anomaly.actualAmount)}
      </td>
      <td className="py-3.5 px-4 text-sm text-slate-500 whitespace-nowrap">
        {formatCurrency(anomaly.expectedAmount)}
      </td>
      <td className="py-3.5 px-4 whitespace-nowrap">
        <span className={cn(
          'text-sm font-bold inline-flex items-center gap-1',
          isOver ? 'text-red-600' : 'text-green-600'
        )}>
          {isOver ? '+' : ''}{anomaly.deviationPct.toFixed(1)}%
          {isOver
            ? <TrendingUp className="w-3.5 h-3.5" />
            : <TrendingDown className="w-3.5 h-3.5" />
          }
        </span>
      </td>
      <td className="py-3.5 px-4">
        <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium border', config.class)}>
          {config.label}
        </span>
      </td>
    </tr>
  )
}

export function CostAnomaliesView() {
  const {
    anomalies,
    anomaliesLoading,
    anomaliesError,
    fetchAnomalies,
  } = useCostStore()
  const [severityFilter, setSeverityFilter] = useState<string>('all')

  const envId = localStorage.getItem('cloudbuilder-active-environment') || 'default'

  useEffect(() => {
    fetchAnomalies(envId, 30)
  }, [envId, fetchAnomalies])

  function handleRefresh() {
    fetchAnomalies(envId, 30)
  }

  const filteredAnomalies = severityFilter === 'all'
    ? anomalies
    : anomalies.filter((a) => a.severity === severityFilter)

  const maxDeviation = anomalies.length > 0
    ? Math.max(...anomalies.map((a) => Math.abs(a.deviationPct)))
    : 0

  if (anomaliesLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-brand-navy font-display">Anomalias de Custo</h2>
            <p className="text-sm text-slate-400">Variações inesperadas nos gastos dos serviços</p>
          </div>
        </div>
        <div className="bg-white rounded-3xl card-shadow border border-slate-100 overflow-hidden">
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-20 ml-auto" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (anomaliesError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-brand-navy font-display">Anomalias de Custo</h2>
            <p className="text-sm text-slate-400">Variações inesperadas nos gastos dos serviços</p>
          </div>
        </div>
        <div className="rounded-2xl bg-red-50 border border-red-200 p-6 text-center">
          <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-red-400" />
          <p className="text-sm font-medium text-red-700 mb-1">Erro ao carregar anomalias</p>
          <p className="text-xs text-red-500 mb-4">{anomaliesError}</p>
          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-red-200 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-brand-navy font-display">Anomalias de Custo</h2>
          <p className="text-sm text-slate-400">Variações inesperadas nos gastos dos serviços</p>
        </div>
        <div className="flex items-center gap-3">
          {severityFilter !== 'all' && (
            <button
              onClick={() => setSeverityFilter('all')}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 text-xs font-medium text-slate-500 hover:text-brand-navy transition-colors"
            >
              <X className="w-3 h-3" />
              Limpar filtro
            </button>
          )}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="h-8 min-w-[140px] text-xs">
                <SelectValue placeholder="Todas as severidades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as severidades</SelectItem>
                <SelectItem value="LOW">Baixa</SelectItem>
                <SelectItem value="MODERATE">Moderada</SelectItem>
                <SelectItem value="HIGH">Alta</SelectItem>
                <SelectItem value="CRITICAL">Crítica</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-xs font-semibold text-slate-500 hover:text-brand-navy transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Atualizar
          </button>
        </div>
      </div>

      {anomalies.length === 0 ? (
        <div className="rounded-2xl bg-slate-50 border border-slate-100 p-12 text-center">
          <Activity className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-sm font-medium text-slate-500">Nenhuma anomalia detectada</p>
          <p className="text-xs text-slate-400 mt-1">
            Os gastos estão dentro do esperado para todos os serviços
          </p>
        </div>
      ) : filteredAnomalies.length === 0 ? (
        <div className="rounded-2xl bg-slate-50 border border-slate-100 p-12 text-center">
          <Filter className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-sm font-medium text-slate-500">Nenhuma anomalia com este filtro</p>
          <p className="text-xs text-slate-400 mt-1">
            Tente selecionar outra severidade para visualizar os dados
          </p>
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white rounded-3xl card-shadow border border-slate-100 p-4 text-center space-y-1">
              <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">Total</p>
              <p className="text-xl font-bold text-brand-navy">{anomalies.length}</p>
            </div>
            <div className="bg-white rounded-3xl card-shadow border border-slate-100 p-4 text-center space-y-1">
              <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">Críticas</p>
              <p className="text-xl font-bold text-red-600">
                {anomalies.filter((a) => a.severity === 'CRITICAL').length}
              </p>
            </div>
            <div className="bg-white rounded-3xl card-shadow border border-slate-100 p-4 text-center space-y-1">
              <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">Alta</p>
              <p className="text-xl font-bold text-orange-600">
                {anomalies.filter((a) => a.severity === 'HIGH').length}
              </p>
            </div>
            <div className="bg-white rounded-3xl card-shadow border border-slate-100 p-4 text-center space-y-1">
              <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">Máx. Desvio</p>
              <p className="text-xl font-bold text-brand-navy">{maxDeviation.toFixed(1)}%</p>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-3xl card-shadow border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="text-left py-3.5 px-4 text-xs font-bold tracking-widest text-slate-400 uppercase">Serviço</th>
                    <th className="text-left py-3.5 px-4 text-xs font-bold tracking-widest text-slate-400 uppercase">Data</th>
                    <th className="text-left py-3.5 px-4 text-xs font-bold tracking-widest text-slate-400 uppercase">Gasto Real</th>
                    <th className="text-left py-3.5 px-4 text-xs font-bold tracking-widest text-slate-400 uppercase">Esperado</th>
                    <th className="text-left py-3.5 px-4 text-xs font-bold tracking-widest text-slate-400 uppercase">Desvio</th>
                    <th className="text-left py-3.5 px-4 text-xs font-bold tracking-widest text-slate-400 uppercase">Severidade</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAnomalies.map((anomaly, idx) => (
                    <AnomalyRow key={`${anomaly.serviceName}-${anomaly.date}-${idx}`} anomaly={anomaly} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
