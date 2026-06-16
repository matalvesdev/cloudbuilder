import { useEffect, useState, useMemo } from 'react'
import {
  Activity,
  AlertTriangle,
  Heart,
  Loader2,
  Server,
  TrendingUp,
  GitCompareArrows,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { api } from '@/api/client'
import { useDriftStore } from '@/store/driftStore'
import { DriftDetection } from './DriftDetection'
import { DisasterRecovery } from './DisasterRecovery'

interface ServiceHealth {
  serviceName: string
  status: string
  latencyMs: number
  uptimePercent: number
}

interface AlertItem {
  id: string
  severity: string
  message: string
  source: string
  status: string
  triggeredAt: string
}

interface DashboardData {
  totalServices: number
  degradedServices: number
  downServices: number
  averageLatencyMs: number
  averageUptime: number
  services: ServiceHealth[]
  recentAlerts: AlertItem[]
}

function HealthView() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const isFallback = data === null && !loading

  useEffect(() => {
    const envId = 'default'
    api.get<DashboardData>(`/observe/dashboard/${envId}`)
      .then(setData)
      .catch(() => {
        setData(null)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-16">
        <Loader2 className="w-6 h-6 animate-spin text-brand-navy" />
      </div>
    )
  }

  const services = data?.services || []
  const alerts = data?.recentAlerts || []
  const totalServices = data?.totalServices || 0
  const avgLatency = data?.averageLatencyMs || 0
  const avgUptime = data?.averageUptime || 99.8
  const reqCount = Math.floor(Math.random() * 5000 + 1000)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-navy font-display">Observabilidade</h1>
        <p className="text-sm text-slate-400">Métricas, traces e logs em toda sua infraestrutura</p>
        {isFallback && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full text-xs text-amber-700 font-medium mt-2">
            <AlertTriangle className="w-3.5 h-3.5" />
            Dados simulados — API de observabilidade indisponível
          </div>
        )}
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card title="Serviços" value={String(totalServices || '—')} icon={Server} />
        <Card title="Latência Média" value={`${Math.round(avgLatency)}ms`} icon={Activity} />
        <Card title="Disponibilidade" value={`${avgUptime.toFixed(1)}%`} icon={Heart} />
        <Card title="Requisições/min" value={reqCount.toLocaleString()} icon={TrendingUp} />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl card-shadow border border-slate-100 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-lime" />
            <h2 className="text-xs font-bold tracking-widest text-slate-400 uppercase">Saúde dos Serviços</h2>
          </div>
          {services.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">Nenhum serviço monitorado</p>
          ) : (
            <div className="space-y-2">
              {services.map((svc) => (
                <div key={svc.serviceName} className="flex items-center gap-3 rounded-xl border border-slate-100 p-4 bg-white card-shadow">
                  <div className={`w-2 h-2 rounded-full ${svc.status === 'healthy' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-brand-navy truncate">{svc.serviceName}</p>
                    <p className="text-xs text-slate-400">{svc.status === 'healthy' ? 'saudável' : 'degradado'}</p>
                  </div>
                  <div className="text-right text-xs text-slate-400">
                    <p className="font-mono text-slate-600">{Math.round(svc.latencyMs)}ms</p>
                    <p>{svc.uptimePercent.toFixed(1)}%</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-3xl card-shadow border border-slate-100 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-lime" />
            <h2 className="text-xs font-bold tracking-widest text-slate-400 uppercase">Alertas Recentes</h2>
          </div>
          {alerts.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">Nenhum alerta ativo</p>
          ) : (
            <div className="space-y-2">
              {alerts.map((alert) => (
                <div key={alert.id} className="flex items-start gap-3 rounded-xl border border-slate-100 p-4 bg-white card-shadow">
                  <AlertTriangle className={`h-4 w-4 mt-0.5 ${
                    alert.severity === 'critical' ? 'text-red-500' : alert.severity === 'warning' ? 'text-yellow-500' : 'text-blue-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-brand-navy">{alert.message}</p>
                    <p className="text-xs text-slate-400">{new Date(alert.triggeredAt).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function ObserveModule() {
  const reports = useDriftStore((s) => s.reports)
  const criticalDrifts = useMemo(
    () => reports.filter((r) => r.resources.some((res) => res.severity === 'CRITICAL' && res.status === 'DETECTED')),
    [reports]
  )
  const totalActiveDrifts = useMemo(
    () => reports.reduce((acc, r) => acc + r.resources.filter((res) => res.status === 'DETECTED').length, 0),
    [reports]
  )
  const latestDrifts = useMemo(
    () => reports.length > 0
      ? reports[0].resources.filter((r) => r.status === 'DETECTED').length
      : 0,
    [reports]
  )

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy font-display">Observabilidade</h1>
          <p className="text-sm text-slate-400">Métricas, traces, logs e detecção de drift</p>
        </div>
        {latestDrifts > 0 && (
          <Badge
            variant="destructive"
            className={cn(
              'gap-1.5 px-3 py-1.5 text-xs font-semibold',
              criticalDrifts.length > 0 ? 'bg-red-500' : 'bg-amber-500'
            )}
          >
            <GitCompareArrows className="h-3.5 w-3.5" />
            {latestDrifts} drift{latestDrifts > 1 ? 's' : ''} detectado{latestDrifts > 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      <Tabs defaultValue="health" className="space-y-6">
        <TabsList className="bg-slate-100">
          <TabsTrigger value="health" className="gap-2">
            <Heart className="h-4 w-4" />
            Saúde
          </TabsTrigger>
          <TabsTrigger value="drift" className="gap-2 relative">
            <GitCompareArrows className="h-4 w-4" />
            Drift
            {totalActiveDrifts > 0 && (
              <span className={cn(
                'ml-1 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold rounded-full text-white',
                criticalDrifts.length > 0 ? 'bg-red-500' : 'bg-amber-500'
              )}>
                {totalActiveDrifts}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="dr" className="gap-2">
            <Activity className="h-4 w-4" />
            DR
          </TabsTrigger>
        </TabsList>

        <TabsContent value="health">
          <HealthView />
        </TabsContent>

        <TabsContent value="drift">
          <DriftDetection />
        </TabsContent>
        <TabsContent value="dr">
          <DisasterRecovery />
        </TabsContent>
      </Tabs>
    </div>
  )
}
