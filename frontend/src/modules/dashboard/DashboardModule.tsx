import { useEffect, useState, useMemo } from 'react'
import {
  Activity, Server, Cloud, Cpu, HardDrive, Network,
  TrendingUp, Users, Clock, AlertTriangle, CheckCircle2,
  Loader2, Key, Box, ArrowRight, Sparkles,
  Palette, Rocket, BarChart3, DollarSign, Shield, BrainCircuit,
  GitCompare, WandSparkles, ShieldAlert, UserCheck, Zap,
  ShieldCheck as ShieldCheckIcon,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { dashboardApi } from '@/api/dashboardApi'
import { useCredentialStore } from '@/store/credentialStore'
import { useCanvasStore } from '@/store/canvasStore'
import { useActivityStore } from '@/store/activityStore'
import { useUiStore } from '@/store/uiStore'
import type { CostOverview } from '@/api/dashboardApi'
import {
  ACTIVITY_ICONS,
  ACTIVITY_SEVERITY_STYLES,
  type ActivityEvent,
  type ActivityType,
} from '@/types/activity.types'
type ModuleId = 'design' | 'provision' | 'observe' | 'cost' | 'platform' | 'aiops' | 'audit' | 'iam' | 'dashboard' | 'settings'

const NAV_MODULES: Record<string, ModuleId> = {
  design: 'design',
  provision: 'provision',
  observe: 'observe',
  cost: 'cost',
  platform: 'platform',
  aiops: 'aiops',
  settings: 'settings',
  dashboard: 'dashboard',
}
import { SetupWizard } from './SetupWizard'
import { cn } from '@/lib/utils'
import { DashboardCharts } from './DashboardCharts'

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down'
  uptime: number
  services: { name: string; status: string; responseTime: number }[]
}

interface ResourceUsage {
  cpu: number
  memory: number
  storage: number
  activeConnections: number
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'agora'
  if (mins === 1) return 'há 1 min'
  if (mins < 60) return `há ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours === 1) return 'há 1 hora'
  if (hours < 24) return `há ${hours} horas`
  const days = Math.floor(hours / 24)
  return `há ${days} dia${days > 1 ? 's' : ''}`
}

function getActivityIcon(type: string): string {
  return (ACTIVITY_ICONS as Record<string, string>)[type] || 'Activity'
}

function ActivityIcon({ type, className }: { type: string; className?: string }) {
  const iconName = getActivityIcon(type)
  const icons: Record<string, React.ElementType> = {
    LayoutDashboard: Palette, CheckCircle2, Download: Cloud,
    Play: Rocket, Rocket, AlertCircle: AlertTriangle,
    ArrowUpFromLine: ArrowRight, GitCompare,
    TrendingUp, WandSparkles, DollarSign, ShieldAlert, Shield,
    UserCheck, XCircle: AlertTriangle, MessageSquare: Activity,
    Share2: Activity, BrainCircuit, Wrench: Sparkles, Key: Key,
    AlertTriangle, Box, User: Users, UserPlus: Users,
    Activity,
  }
  const Icon = icons[iconName] || Activity
  return <Icon className={cn('w-4 h-4', className)} />
}

export function DashboardModule() {
  const [health, setHealth] = useState<SystemHealth | null>(null)
  const [resources, setResources] = useState<ResourceUsage | null>(null)
  const [costOverview, setCostOverview] = useState<CostOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [showSetupWizard, setShowSetupWizard] = useState(false)
  const { credentials, environments, deployments } = useCredentialStore()
  const { nodes, edges } = useCanvasStore()
  const allEvents = useActivityStore((s) => s.events)
  const activityEvents = useMemo(() => allEvents.slice(0, 8), [allEvents])
  const { setActiveModule } = useUiStore()

  const needsSetup = credentials.length === 0
  const hasEnvSetup = environments.length > 0
  const wizardDone = localStorage.getItem('cloudbuilder-wizard-done') === 'true'

  useEffect(() => {
    if (needsSetup && !wizardDone && !showSetupWizard) {
      setShowSetupWizard(true)
    }
  }, [needsSetup, wizardDone, showSetupWizard])

  useEffect(() => {
    const envId = localStorage.getItem('cloudbuilder-active-environment') || 'default'
    Promise.all([
      dashboardApi.getHealth(),
      dashboardApi.getObserveDashboard(envId).catch(() => null),
      dashboardApi.getCostOverview(envId).catch(() => null),
    ]).then(([h, observeData, costData]) => {
      if (h) {
        setHealth({ status: h.status === 'UP' ? 'healthy' : 'down', uptime: 0, services: [] })
      }
      if (observeData) {
        setResources({
          cpu: Math.round(Math.random() * 100),
          memory: Math.round(Math.random() * 100),
          storage: Math.round(Math.random() * 100),
          activeConnections: Math.floor(Math.random() * 200),
        })
      }
      if (costData) {
        setCostOverview(costData)
      }
    }).finally(() => setLoading(false))
  }, [])

  // Provider breakdown from canvas nodes
  const providerCounts = useMemo(() => {
    const counts: Record<string, number> = { aws: 0, azure: 0, gcp: 0, k8s: 0 }
    for (const n of nodes) {
      const type = n.type || 'unknown'
      if (type in counts) counts[type]++
    }
    return counts
  }, [nodes])

  const totalResources = nodes.length
  const totalConnections = edges.length
  const deployedEnvs = environments.filter((e) =>
    e.status === 'ACTIVE'
  )
  const activeDeployments = deployments.filter(
    (d) => d.status === 'running'
  )

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-brand-navy" />
      </div>
    )
  }

  const monthlyCost = costOverview?.totalCost

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy font-display">Dashboard</h1>
          <p className="text-sm text-slate-400">Visão geral da plataforma</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 border border-green-200">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          <span className="text-xs font-semibold text-green-700">
            {activeDeployments.length > 0
              ? `${activeDeployments.length} deploy(s) em andamento`
              : 'Sistema operacional'}
          </span>
        </div>
      </div>

      {/* Setup wizard modal */}
      {showSetupWizard && (
        <SetupWizard onClose={() => setShowSetupWizard(false)} />
      )}

      {/* Setup banner */}
      {needsSetup && !showSetupWizard && wizardDone && (
        <div className="bg-gradient-to-r from-brand-navy to-[#1a2a5e] rounded-3xl p-6 text-white shadow-lg">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-lime/20 flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6 text-brand-lime" />
              </div>
              <div>
                <h2 className="text-lg font-bold font-display mb-1">Bem-vindo ao CloudBuilder!</h2>
                <p className="text-sm text-white/70 max-w-lg mb-4">
                  Sua plataforma de engenharia está pronta. Configure suas credenciais de provedor de nuvem
                  para começar a projetar e provisionar infraestrutura em minutos.
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowSetupWizard(true)}
                    className="inline-flex items-center gap-2 px-5 h-10 rounded-full text-sm font-bold bg-brand-lime text-brand-navy hover:bg-brand-lime/90 transition-all shadow-md"
                  >
                    <Key className="w-4 h-4" />
                    Configurar Credenciais
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setActiveModule('design')}
                    className="inline-flex items-center gap-2 px-5 h-10 rounded-full text-sm font-semibold bg-white/10 text-white hover:bg-white/20 transition-all border border-white/20"
                  >
                    Explorar Design
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!needsSetup && !hasEnvSetup && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-800">Ambientes não configurados</p>
              <p className="text-xs text-amber-600">
                Suas credenciais estão configuradas, mas você precisa criar ao menos um ambiente para fazer deploy.
              </p>
            </div>
            <button
              onClick={() => setActiveModule('settings')}
              className="inline-flex items-center gap-1.5 px-4 h-8 rounded-full text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 transition-all"
            >
              <Box className="w-3.5 h-3.5" />
              Configurar
            </button>
          </div>
        </div>
      )}

      {/* Row 1: Project summary cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card title="Projetos" value={String(Math.max(1, environments.length))} icon={Box} />
        <Card title="Ambientes" value={String(environments.length || 1)} icon={Server} />
        <Card title="Recursos" value={String(totalResources || 0)} icon={Cpu} />
        <Card
          title="Custo/Mês"
          value={monthlyCost != null ? `~$${Math.round(monthlyCost)}` : (totalResources > 0 ? '—' : '$0')}
          icon={DollarSign}
        />
      </div>

      {/* Row 2: Pipeline + Canvas Preview */}
      <div className="grid grid-cols-12 gap-6">
        {/* Pipeline de Deploy */}
        <div className="col-span-7 bg-white rounded-3xl card-shadow border border-slate-100 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-lime" />
              <h2 className="text-xs font-bold tracking-widest text-slate-400 uppercase">
                Pipeline de Deploy
              </h2>
            </div>
            <button
              onClick={() => setActiveModule('provision')}
              className="text-xs font-semibold text-brand-navy hover:text-brand-lime transition-colors"
            >
              Ver todos
            </button>
          </div>

          {environments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Rocket className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-sm text-slate-400">Nenhum ambiente configurado</p>
              <button
                onClick={() => setActiveModule('settings')}
                className="mt-2 text-xs font-semibold text-brand-navy underline hover:text-brand-lime"
              >
                Criar ambiente
              </button>
            </div>
          ) : (
            <div className="space-y-0 relative">
              {environments.slice(0, 4).map((env, idx) => {
                const envDeployments = deployments.filter((d) => d.environmentId === env.id)
                const lastDep = envDeployments[envDeployments.length - 1]
                return (
                  <div key={env.id} className="relative flex items-start gap-4 pb-5 last:pb-0">
                    {/* Timeline connector */}
                    <div className="flex flex-col items-center">
                      <div
                        className={cn(
                          'w-8 h-8 rounded-xl flex items-center justify-center shrink-0',
                          env.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-600'
                            : env.status === 'PENDING' || env.status === 'PROVISIONING'
                              ? 'bg-amber-100 text-amber-600'
                              : 'bg-slate-100 text-slate-400'
                        )}
                      >
                        <Server className="w-4 h-4" />
                      </div>
                      {idx < Math.min(environments.length, 4) - 1 && (
                        <div className="w-px flex-1 min-h-[24px] bg-slate-200 my-1" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-brand-navy">{env.name}</p>
                        <span
                          className={cn(
                            'text-[10px] font-bold px-2 py-0.5 rounded-full',
                            env.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-700'
                            : env.status === 'PENDING' || env.status === 'PROVISIONING'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-slate-100 text-slate-500'
                          )}
                        >
                          {env.status || 'PENDING'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {lastDep
                          ? `Deploy v${lastDep.version || '?'} — ${formatRelativeTime(lastDep.startedAt)}`
                          : 'Nenhum deploy ainda'}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        // Navigate to provision module with this env selected
                        setActiveModule('provision')
                      }}
                      className="shrink-0 inline-flex items-center gap-1 px-3 h-7 rounded-full text-[10px] font-bold bg-brand-navy text-white hover:bg-brand-navy/90 transition-all"
                      title="Promover"
                    >
                      Promover
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Prévia do Canvas */}
        <div className="col-span-5 bg-white rounded-3xl card-shadow border border-slate-100 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-lime" />
              <h2 className="text-xs font-bold tracking-widest text-slate-400 uppercase">
                Prévia do Canvas
              </h2>
            </div>
            <button
              onClick={() => setActiveModule('design')}
              className="text-xs font-semibold text-brand-navy hover:text-brand-lime transition-colors"
            >
              Abrir Design
            </button>
          </div>

          {totalResources === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Palette className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-sm text-slate-400">Canvas vazio</p>
              <button
                onClick={() => setActiveModule('design')}
                className="mt-2 inline-flex items-center gap-1.5 px-4 h-8 rounded-full text-xs font-bold bg-brand-navy text-white hover:bg-brand-navy/90 transition-all"
              >
                <Box className="w-3.5 h-3.5" />
                Novo Design
              </button>
            </div>
          ) : (
            <>
              {/* Provider breakdown */}
              <div className="grid grid-cols-4 gap-2">
                {(['aws', 'azure', 'gcp', 'k8s'] as const).map((provider) => {
                  const count = providerCounts[provider]
                  const colors: Record<string, string> = {
                    aws: 'bg-amber-100 text-amber-700',
                    azure: 'bg-blue-100 text-blue-700',
                    gcp: 'bg-green-100 text-green-700',
                    k8s: 'bg-purple-100 text-purple-700',
                  }
                  return (
                    <div
                      key={provider}
                      className={cn(
                        'rounded-xl px-3 py-2 text-center',
                        count > 0 ? colors[provider] : 'bg-slate-50 text-slate-400'
                      )}
                    >
                      <p className="text-xs font-bold uppercase">{provider}</p>
                      <p className="text-lg font-bold">{count}</p>
                    </div>
                  )
                })}
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Cpu className="w-3.5 h-3.5" />
                  <strong className="text-brand-navy">{totalResources}</strong> nós
                </span>
                <span className="flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5" />
                  <strong className="text-brand-navy">{totalConnections}</strong> conexões
                </span>
              </div>

              {/* Last saved timestamp from activity */}
              {activityEvents.some((e) => e.type === 'design_save') && (
                <p className="text-[10px] text-slate-400">
                  Último salvamento:{' '}
                  {formatRelativeTime(
                    activityEvents.find((e) => e.type === 'design_save')!.timestamp
                  )}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Charts Section — Análises e Visualizações */}
      <DashboardCharts />

      {/* Row 3: Activity Feed + Alerts */}
      <div className="grid grid-cols-12 gap-6">
        {/* Feed de Atividade */}
        <div className="col-span-7 bg-white rounded-3xl card-shadow border border-slate-100 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-lime" />
              <h2 className="text-xs font-bold tracking-widest text-slate-400 uppercase">
                Feed de Atividade
              </h2>
            </div>
          </div>

          <div className="space-y-2 max-h-[360px] overflow-y-auto">
            {activityEvents.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">Nenhuma atividade recente</p>
            ) : (
              activityEvents.map((event: ActivityEvent) => (
                <div
                  key={event.id}
                  className="flex items-start gap-3 rounded-xl border border-slate-100 p-3 bg-white card-shadow hover:border-slate-200 transition-colors"
                >
                  <div
                    className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                      event.severity === 'error'
                        ? 'bg-red-50'
                        : event.severity === 'warning'
                          ? 'bg-amber-50'
                          : event.severity === 'success'
                            ? 'bg-green-50'
                            : 'bg-ice-blue/50'
                    )}
                  >
                    <ActivityIcon
                      type={event.type}
                      className={
                        event.severity === 'error'
                          ? 'text-red-500'
                          : event.severity === 'warning'
                            ? 'text-amber-500'
                            : event.severity === 'success'
                              ? 'text-green-600'
                              : 'text-brand-navy'
                      }
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-brand-navy">{event.title}</p>
                      <span
                        className={cn(
                          'text-[10px] font-semibold px-1.5 py-0.5 rounded-full',
                          ACTIVITY_SEVERITY_STYLES[event.severity]
                        )}
                      >
                        {event.severity}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 truncate mt-0.5">{event.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-slate-400">
                        {formatRelativeTime(event.timestamp)}
                      </span>
                      {event.link && (
                        <button
                          onClick={() => setActiveModule(NAV_MODULES[event.link!.module] || 'design')}
                          className="text-[10px] font-semibold text-brand-navy hover:text-brand-lime transition-colors"
                        >
                          {event.link.label}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Alertas e Oportunidades */}
        <div className="col-span-5 bg-white rounded-3xl card-shadow border border-slate-100 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-lime" />
            <h2 className="text-xs font-bold tracking-widest text-slate-400 uppercase">
              Alertas e Oportunidades
            </h2>
          </div>

          <div className="space-y-2">
            {totalResources === 0 ? (
              <>
                {/* Setup hint */}
                <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-3">
                  <Sparkles className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-blue-800">Comece criando um design</p>
                    <p className="text-xs text-blue-600">
                      Adicione componentes de infraestrutura no canvas para ver alertas e oportunidades.
                    </p>
                    <button
                      onClick={() => setActiveModule('design')}
                      className="mt-1.5 text-[10px] font-bold text-blue-700 underline"
                    >
                      Ir para Design
                    </button>
                  </div>
                </div>

                {/* Deploy hint */}
                <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white p-3 card-shadow">
                  <Rocket className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-slate-600">Ambientes de deploy</p>
                    <p className="text-xs text-slate-400">
                      Configure ambientes em Settings para ativar o pipeline de CI/CD.
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Drift alerts - read from store */}
                {(() => {
                  const driftEvents = activityEvents.filter((e) => e.type === 'drift_detected')
                  return driftEvents.length > 0 ? (
                    driftEvents.slice(0, 2).map((evt) => (
                      <div
                        key={evt.id}
                        className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50 p-3"
                      >
                        <GitCompare className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-amber-800">{evt.title}</p>
                          <p className="text-xs text-amber-600 truncate">{evt.description}</p>
                          {evt.link && (
                            <button
                              onClick={() => setActiveModule(NAV_MODULES[evt.link!.module] || 'design')}
                              className="mt-1 text-[10px] font-bold text-amber-700 underline"
                            >
                              {evt.link.label}
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-start gap-3 rounded-xl border border-green-100 bg-green-50 p-3">
                      <Shield className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-green-800">Sem drift detectado</p>
                        <p className="text-xs text-green-600">Todos os recursos estão sincronizados.</p>
                      </div>
                    </div>
                  )
                })()}

                {/* Cost optimizations */}
                {(() => {
                  const costEvents = activityEvents.filter(
                    (e) => e.type === 'cost_saving' || e.type === 'cost_anomaly' || e.type === 'cost_optimization'
                  )
                  return costEvents.slice(0, 2).map((evt) => (
                    <div
                      key={evt.id}
                      className="flex items-start gap-3 rounded-xl border border-purple-100 bg-purple-50 p-3"
                    >
                      <DollarSign className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-purple-800">{evt.title}</p>
                        <p className="text-xs text-purple-600 truncate">{evt.description}</p>
                        {evt.link && (
                          <button
                            onClick={() => setActiveModule(NAV_MODULES[evt.link!.module] || 'dashboard')}
                            className="mt-1 text-[10px] font-bold text-purple-700 underline"
                          >
                            {evt.link.label}
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                })()}

                {/* Compliance violations */}
                {(() => {
                  const compEvents = activityEvents.filter(
                    (e) => e.type === 'compliance_violation' || e.type === 'compliance_fixed' || e.type === 'compliance_ok'
                  )
                  return compEvents.slice(0, 2).map((evt) => (
                    <div
                      key={evt.id}
                      className={cn(
                        'flex items-start gap-3 rounded-xl border p-3',
                        evt.severity === 'error'
                          ? 'border-red-100 bg-red-50'
                          : 'border-green-100 bg-green-50'
                      )}
                    >
                      {evt.severity === 'error' ? (
                        <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      ) : (
                        <Shield className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800">{evt.title}</p>
                        <p className="text-xs text-slate-600 truncate">{evt.description}</p>
                        {evt.link && (
                          <button
                            onClick={() => setActiveModule(NAV_MODULES[evt.link!.module] || 'dashboard')}
                            className="mt-1 text-[10px] font-bold text-slate-700 underline"
                          >
                            {evt.link.label}
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                })()}

                {/* Pending approvals */}
                {(() => {
                  const approvalEvents = activityEvents.filter(
                    (e) => e.type === 'approval_requested'
                  )
                  return approvalEvents.slice(0, 2).map((evt) => (
                    <div
                      key={evt.id}
                      className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-3"
                    >
                      <UserCheck className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-blue-800">{evt.title}</p>
                        <p className="text-xs text-blue-600 truncate">{evt.description}</p>
                        {evt.link && (
                          <button
                            onClick={() => setActiveModule(NAV_MODULES[evt.link!.module] || 'dashboard')}
                            className="mt-1 text-[10px] font-bold text-blue-700 underline"
                          >
                            {evt.link.label}
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                })()}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="bg-white rounded-3xl card-shadow border border-slate-100 p-4">
        <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-3">
          Ações Rápidas
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveModule('design')}
            className="inline-flex items-center gap-2 px-4 h-9 rounded-xl text-xs font-bold bg-brand-navy text-white hover:bg-brand-navy/90 transition-all"
          >
            <Palette className="w-4 h-4" />
            Novo Design
          </button>
          <button
            onClick={() => setActiveModule('provision')}
            className="inline-flex items-center gap-2 px-4 h-9 rounded-xl text-xs font-bold bg-green-600 text-white hover:bg-green-700 transition-all"
          >
            <Rocket className="w-4 h-4" />
            Fazer Deploy
          </button>
          <button
            onClick={() => setActiveModule('observe')}
            className="inline-flex items-center gap-2 px-4 h-9 rounded-xl text-xs font-bold text-brand-navy bg-ice-blue/50 hover:bg-ice-blue transition-all border border-slate-200"
          >
            <BarChart3 className="w-4 h-4" />
            Ver Métricas
          </button>
          <button
            onClick={() => setActiveModule('cost')}
            className="inline-flex items-center gap-2 px-4 h-9 rounded-xl text-xs font-bold text-brand-navy bg-ice-blue/50 hover:bg-ice-blue transition-all border border-slate-200"
          >
            <DollarSign className="w-4 h-4" />
            Analisar Custos
          </button>
          <button
            onClick={() => setActiveModule('platform')}
            className="inline-flex items-center gap-2 px-4 h-9 rounded-xl text-xs font-bold text-brand-navy bg-ice-blue/50 hover:bg-ice-blue transition-all border border-slate-200"
          >
            <Shield className="w-4 h-4" />
            Compliance
          </button>
          <button
            onClick={() => setActiveModule('aiops')}
            className="inline-flex items-center gap-2 px-4 h-9 rounded-xl text-xs font-bold text-brand-navy bg-ice-blue/50 hover:bg-ice-blue transition-all border border-slate-200"
          >
            <BrainCircuit className="w-4 h-4" />
            AI Ops
          </button>
        </div>
      </div>
    </div>
  )
}
