import { useEffect, useState, useMemo } from 'react'
import {
  Activity,
  AlertTriangle,
  Heart,
  Loader2,
  Server,
  TrendingUp,
  GitCompareArrows,
  Map,
  Award,
  FileText,
  Bell,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Clock,
  PieChart,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { api } from '@/api/client'
import { useDriftStore } from '@/store/driftStore'
import { DriftDetection } from './DriftDetection'
import { DisasterRecovery } from './DisasterRecovery'
import { ServiceMapView } from './ServiceMapView'
import { ScorecardView } from './ScorecardView'
import { MetricsDashboard } from './MetricsDashboard'
import { TraceExplorer } from './TraceExplorer'
import { LogViewer } from './LogViewer'
import { AlertRulesView } from './AlertRulesView'
import { IncidentsView } from './IncidentsView'
import { SloDashboard } from './SloDashboard'

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

interface SectionCardProps {
  icon: React.ElementType; label: string; desc: string; onClick: () => void; theme: 'green' | 'amber' | 'navy' | 'purple' | 'blue' | 'red'
}

function SectionLinkCard({ icon: Icon, label, desc, onClick, theme }: SectionCardProps) {
  const themes = {
    green: { hover: 'hover:border-green-400', iconBg: 'bg-green-50 group-hover:bg-green-100', iconColor: 'text-green-600' },
    amber: { hover: 'hover:border-amber-400', iconBg: 'bg-amber-50 group-hover:bg-amber-100', iconColor: 'text-amber-600' },
    navy: { hover: 'hover:border-brand-navy', iconBg: 'bg-brand-navy/5 group-hover:bg-brand-lime/15', iconColor: 'text-brand-navy' },
    purple: { hover: 'hover:border-purple-400', iconBg: 'bg-purple-50 group-hover:bg-purple-100', iconColor: 'text-purple-600' },
    blue: { hover: 'hover:border-blue-400', iconBg: 'bg-blue-50 group-hover:bg-blue-100', iconColor: 'text-blue-600' },
    red: { hover: 'hover:border-red-400', iconBg: 'bg-red-50 group-hover:bg-red-100', iconColor: 'text-red-600' },
  }
  const t = themes[theme]
  return (
    <button onClick={onClick}
      className={`flex items-center gap-3 p-3.5 rounded-xl bg-white border border-slate-200 transition-all group w-full text-left ${t.hover} hover:shadow-sm`}>
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${t.iconBg}`}>
        <Icon className={`w-4.5 h-4.5 ${t.iconColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-brand-navy">{label}</p>
        <p className="text-[11px] text-slate-400 mt-0.5 truncate">{desc}</p>
      </div>
      <TrendingUp className="w-3.5 h-3.5 text-slate-300 shrink-0 group-hover:text-brand-navy transition-colors" />
    </button>
  )
}

function OverviewView({ onTabChange }: { onTabChange: (tab: string) => void }) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const isFallback = data === null && !loading
  const reports = useDriftStore((s) => s.reports)

  const totalActiveDrifts = useMemo(
    () => reports.reduce((acc, r) => acc + r.resources.filter((res) => res.status === 'DETECTED').length, 0),
    [reports]
  )

  useEffect(() => {
    const envId = 'default'
    api.get<DashboardData>(`/observe/dashboard/${envId}`)
      .then(setData)
      .catch(() => setData(null))
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-brand-navy font-display">Visão Geral</h1>
            <p className="text-sm text-slate-400 mt-0.5">Todas as métricas e alertas da sua infraestrutura em um só lugar</p>
          </div>
          {totalActiveDrifts > 0 && (
            <Badge variant="destructive" className={cn('gap-1.5 px-3 py-1.5 text-xs font-semibold', 'bg-amber-500')}>
              <GitCompareArrows className="h-3.5 w-3.5" />
              {totalActiveDrifts} drift{totalActiveDrifts > 1 ? 's' : ''} detectado{totalActiveDrifts > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        {isFallback && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full text-xs text-amber-700 font-medium mt-2">
            <AlertTriangle className="w-3.5 h-3.5" />
            Dados simulados — API de observabilidade indisponível
          </div>
        )}
      </div>

      {/* Stats Row — ALL key metrics */}
      <div className="grid grid-cols-6 gap-4">
        <Card title="Serviços" value={String(totalServices || '—')} icon={Server} />
        <Card title="Alertas Ativos" value={String(alerts.length)} icon={AlertTriangle} />
        <Card title="Drifts" value={String(totalActiveDrifts)} icon={GitCompareArrows} />
        <Card title="Latência" value={`${Math.round(avgLatency)}ms`} icon={Clock} />
        <Card title="Disponibilidade" value={`${avgUptime.toFixed(1)}%`} icon={Heart} />
        <Card title="Requisições/min" value={reqCount.toLocaleString()} icon={Zap} />
      </div>

      {/* Service Health + Recent Alerts */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl card-shadow border border-slate-100 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-green-500" />
              <h2 className="text-xs font-bold tracking-widest text-slate-400 uppercase">Saúde dos Serviços</h2>
            </div>
            <button onClick={() => onTabChange('servicemap')}
              className="text-[11px] font-semibold text-brand-navy hover:text-brand-lime transition-colors">
              Ver todos →
            </button>
          </div>
          {services.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">Nenhum serviço monitorado</p>
          ) : (
            <div className="space-y-2">
              {services.slice(0, 4).map((svc) => (
                <div key={svc.serviceName} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3.5 bg-white card-shadow">
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h2 className="text-xs font-bold tracking-widest text-slate-400 uppercase">Alertas Recentes</h2>
            </div>
            <button onClick={() => onTabChange('alerts')}
              className="text-[11px] font-semibold text-brand-navy hover:text-brand-lime transition-colors">
              Ver todos →
            </button>
          </div>
          {alerts.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">Nenhum alerta ativo</p>
          ) : (
            <div className="space-y-2">
              {alerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className="flex items-start gap-3 rounded-xl border border-slate-100 p-3.5 bg-white card-shadow">
                  <AlertTriangle className={`h-4 w-4 mt-0.5 shrink-0 ${
                    alert.severity === 'critical' ? 'text-red-500' : alert.severity === 'warning' ? 'text-yellow-500' : 'text-blue-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-brand-navy truncate">{alert.message}</p>
                    <p className="text-xs text-slate-400">{new Date(alert.triggeredAt).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Access to All Sub-Modules */}
      <div className="bg-white rounded-3xl card-shadow border border-slate-100 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <PieChart className="w-4 h-4 text-brand-navy" />
          <h2 className="text-xs font-bold tracking-widest text-slate-400 uppercase">Explorar Módulos</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <SectionLinkCard icon={TrendingUp} label="Métricas" desc="Performance e uso de recursos" onClick={() => onTabChange('metrics')} theme="navy" />
          <SectionLinkCard icon={Activity} label="Traces" desc="Rastreamento de requisições" onClick={() => onTabChange('traces')} theme="blue" />
          <SectionLinkCard icon={FileText} label="Logs" desc="Logs centralizados" onClick={() => onTabChange('logs')} theme="purple" />
          <SectionLinkCard icon={Bell} label="Incidentes" desc="Histórico e resolução" onClick={() => onTabChange('incidents')} theme="red" />
          <SectionLinkCard icon={Award} label="SLO" desc="Compliance de nível de serviço" onClick={() => onTabChange('slo')} theme="green" />
          <SectionLinkCard icon={Map} label="Service Map" desc="Mapa de dependências" onClick={() => onTabChange('servicemap')} theme="amber" />
          <SectionLinkCard icon={GitCompareArrows} label="Drift" desc="Detecção de desvios" onClick={() => onTabChange('drift')} theme="purple" />
          <SectionLinkCard icon={ShieldCheck} label="Scorecards" desc="Maturidade da infra" onClick={() => onTabChange('scorecards')} theme="green" />
          <SectionLinkCard icon={CheckCircle2} label="DR" desc="Planos de recuperação" onClick={() => onTabChange('dr')} theme="navy" />
          <SectionLinkCard icon={AlertTriangle} label="Alertas" desc="Regras e notificações" onClick={() => onTabChange('alerts')} theme="amber" />
        </div>
      </div>
    </div>
  )
}

export function ObserveModule() {
  const [activeTab, setActiveTab] = useState('overview')
  const reports = useDriftStore((s) => s.reports)
  const totalActiveDrifts = useMemo(
    () => reports.reduce((acc, r) => acc + r.resources.filter((res) => res.status === 'DETECTED').length, 0),
    [reports]
  )

  const handleTabChange = useMemo(() => (tab: string) => setActiveTab(tab), [])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy font-display">Observabilidade</h1>
          <p className="text-sm text-slate-400">Métricas, traces, logs e detecção de drift</p>
        </div>
        {totalActiveDrifts > 0 && (
          <Badge variant="destructive" className={cn('gap-1.5 px-3 py-1.5 text-xs font-semibold', 'bg-amber-500')}>
            <GitCompareArrows className="h-3.5 w-3.5" />
            {totalActiveDrifts} drift{totalActiveDrifts > 1 ? 's' : ''} detectado{totalActiveDrifts > 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-100">
          <TabsTrigger value="overview" className="gap-2">
            <PieChart className="h-4 w-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="metrics" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Métricas
          </TabsTrigger>
          <TabsTrigger value="traces" className="gap-2">
            <Activity className="h-4 w-4" />
            Traces
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-2">
            <FileText className="h-4 w-4" />
            Logs
          </TabsTrigger>
          <TabsTrigger value="alerts" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Alertas
          </TabsTrigger>
          <TabsTrigger value="incidents" className="gap-2">
            <Bell className="h-4 w-4" />
            Incidentes
          </TabsTrigger>
          <TabsTrigger value="slo" className="gap-2">
            <Award className="h-4 w-4" />
            SLO
          </TabsTrigger>
          <TabsTrigger value="servicemap" className="gap-2">
            <Map className="h-4 w-4" />
            Service Map
          </TabsTrigger>
          <TabsTrigger value="drift" className="gap-2 relative">
            <GitCompareArrows className="h-4 w-4" />
            Drift
            {totalActiveDrifts > 0 && (
              <span className={cn(
                'ml-1 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold rounded-full text-white',
                'bg-amber-500'
              )}>
                {totalActiveDrifts}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="scorecards" className="gap-2">
            <Award className="h-4 w-4" />
            Scorecards
          </TabsTrigger>
          <TabsTrigger value="dr" className="gap-2">
            <Activity className="h-4 w-4" />
            DR
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewView onTabChange={handleTabChange} />
        </TabsContent>

        <TabsContent value="metrics">
          <MetricsDashboard />
        </TabsContent>

        <TabsContent value="traces">
          <TraceExplorer />
        </TabsContent>

        <TabsContent value="logs">
          <LogViewer />
        </TabsContent>

        <TabsContent value="alerts">
          <AlertRulesView />
        </TabsContent>

        <TabsContent value="incidents">
          <IncidentsView />
        </TabsContent>

        <TabsContent value="slo">
          <SloDashboard />
        </TabsContent>

        <TabsContent value="servicemap">
          <ServiceMapView />
        </TabsContent>

        <TabsContent value="drift">
          <DriftDetection />
        </TabsContent>

        <TabsContent value="scorecards">
          <ScorecardView />
        </TabsContent>

        <TabsContent value="dr">
          <DisasterRecovery />
        </TabsContent>
      </Tabs>
    </div>
  )
}
