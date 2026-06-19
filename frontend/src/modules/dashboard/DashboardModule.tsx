import { useEffect, useState, useMemo, useCallback } from 'react'
import {
  Activity, Server, Cloud, Cpu,
  TrendingUp, AlertTriangle, CheckCircle2,
  Loader2, Key, Box, ArrowRight, Sparkles,
  Palette, Rocket, DollarSign, Shield, BrainCircuit,
  GitCompare, ShieldAlert, UserCheck, Users,
  ShieldCheck as ShieldCheckIcon,
  Plus, Layout, BarChart3, Eye,
  Heart, GitCompareArrows,
} from 'lucide-react'
import { dashboardApi } from '@/api/dashboardApi'
import { useCredentialStore } from '@/store/credentialStore'
import { useCanvasStore } from '@/store/canvasStore'
import { useActivityStore } from '@/store/activityStore'
import { useUiStore } from '@/store/uiStore'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import type { CostOverview } from '@/api/dashboardApi'
import {
  ACTIVITY_ICONS,
  ACTIVITY_SEVERITY_STYLES,
  type ActivityEvent,
} from '@/types/activity.types'
import { useOnboardingStore } from '@/store/onboardingStore'
import { SetupWizard } from './SetupWizard'
import { DashboardCharts } from './DashboardCharts'
import { cn } from '@/lib/utils'

type ModuleId = 'design' | 'provision' | 'observe' | 'cost' | 'platform' | 'aiops' | 'audit' | 'iam' | 'docs' | 'dashboard' | 'settings'

const NAV_MODULES: Record<string, ModuleId> = {
  design: 'design', provision: 'provision', observe: 'observe',
  cost: 'cost', platform: 'platform', aiops: 'aiops',
  settings: 'settings', dashboard: 'dashboard', docs: 'docs',
}

/* ─────────────────────────────────────────────
   Utility
   ───────────────────────────────────────────── */

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
    Play: Rocket, AlertCircle: AlertTriangle,
    ArrowUpFromLine: ArrowRight, GitCompare,
    TrendingUp, Sparkles, DollarSign, ShieldAlert, Shield,
    UserCheck, XCircle: AlertTriangle, MessageSquare: Activity,
    Share2: Activity, BrainCircuit, Wrench: Sparkles, Key,
    AlertTriangle, Box, Users, UserPlus: Users, Activity,
  }
  const Icon = icons[iconName] || Activity
  return <Icon className={cn('w-4 h-4', className)} />
}

/* ─────────────────────────────────────────────
   Types
   ───────────────────────────────────────────── */

interface TodoItem {
  id: string
  label: string
  description: string
  icon: React.ElementType
  action: () => void
  actionLabel: string
  priority: 'high' | 'medium' | 'low'
}

/* ─────────────────────────────────────────────
   Shared Components
   ───────────────────────────────────────────── */

function SectionHeader({ title, action, badge }: {
  title: string; action?: React.ReactNode; badge?: string | number
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2.5">
        <div className="h-2 w-2 rounded-full bg-brand-lime ring-2 ring-brand-lime/30" />
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</h3>
        {badge != null && (
          <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-brand-navy text-[10px] font-bold text-white px-1.5">
            {badge}
          </span>
        )}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  )
}

/* ──────────────── Stat Card ────────────────── */

function StatCard({ label, value, sub, icon: Icon, trend }: {
  label: string; value: string; sub?: string; icon: React.ElementType; trend?: { value: string; positive: boolean }
}) {
  return (
    <div className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 p-5">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
        <div className="w-9 h-9 rounded-xl bg-brand-navy/5 flex items-center justify-center group-hover:bg-brand-lime/15 transition-colors">
          <Icon className="w-4.5 h-4.5 text-brand-navy" />
        </div>
      </div>
      <p className="text-2xl font-bold text-brand-navy font-display tracking-tight">{value}</p>
      {sub && (
        <div className="flex items-center gap-2 mt-1">
          <p className="text-xs text-slate-400">{sub}</p>
          {trend && (
            <span className={cn(
              'inline-flex items-center gap-0.5 text-[11px] font-semibold',
              trend.positive ? 'text-green-600' : 'text-red-500'
            )}>
              <TrendingUp className={cn('w-3 h-3', !trend.positive && 'rotate-180')} />
              {trend.value}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

/* ──────────────── Alert Card ───────────────── */

interface AlertCardLink { label: string; module: string }

const ALERT_STYLES = {
  amber: { border: 'border-amber-200/60', bg: 'bg-amber-50/80', icon: 'text-amber-500', title: 'text-amber-800', desc: 'text-amber-600', link: 'text-amber-700' },
  green: { border: 'border-green-200/60', bg: 'bg-green-50/80', icon: 'text-green-500', title: 'text-green-800', desc: 'text-green-600', link: 'text-green-700' },
  purple: { border: 'border-purple-200/60', bg: 'bg-purple-50/80', icon: 'text-purple-500', title: 'text-purple-800', desc: 'text-purple-600', link: 'text-purple-700' },
  red: { border: 'border-red-200/60', bg: 'bg-red-50/80', icon: 'text-red-500', title: 'text-red-800', desc: 'text-red-600', link: 'text-red-700' },
  blue: { border: 'border-blue-200/60', bg: 'bg-blue-50/80', icon: 'text-blue-500', title: 'text-blue-800', desc: 'text-blue-600', link: 'text-blue-700' },
  slate: { border: 'border-slate-200/60', bg: 'bg-slate-50/80', icon: 'text-slate-400', title: 'text-slate-700', desc: 'text-slate-400', link: 'text-slate-600' },
} as const

function AlertCard({
  icon: Icon, color, title, description, link, onNavigate,
}: {
  icon: React.ElementType; color: keyof typeof ALERT_STYLES
  title: string; description?: string; link?: AlertCardLink; onNavigate?: (m: ModuleId) => void
}) {
  const c = ALERT_STYLES[color]
  return (
    <div className={cn('flex items-start gap-3 rounded-xl border p-3.5 transition-colors hover:shadow-sm', c.border, c.bg)}>
      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-white/60', c.icon)}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-semibold', c.title)}>{title}</p>
        {description && <p className={cn('text-xs mt-0.5 line-clamp-2', c.desc)}>{description}</p>}
        {link && onNavigate && (
          <button onClick={() => onNavigate(NAV_MODULES[link.module] || 'dashboard')}
            className={cn('mt-1.5 text-xs font-bold underline underline-offset-2 hover:no-underline', c.link)}>
            {link.label} →
          </button>
        )}
      </div>
    </div>
  )
}

/* ──────────────── Todo Row ─────────────────── */

function TodoRow({ item, onDismiss }: { item: TodoItem; onDismiss: (id: string) => void }) {
  const priorityBar = item.priority === 'high' ? 'bg-red-400' :
    item.priority === 'medium' ? 'bg-amber-400' : 'bg-slate-300'

  return (
    <div className="group flex items-start gap-3 py-2.5 px-3.5 rounded-xl bg-white border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all duration-150">
      <div className={cn('w-1 self-stretch rounded-full shrink-0 mt-1', priorityBar)} />
      <div className="w-8 h-8 rounded-lg bg-ice-blue/40 flex items-center justify-center shrink-0 group-hover:bg-brand-lime/15 transition-colors">
        <item.icon className="w-4 h-4 text-brand-navy" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-brand-navy">{item.label}</p>
        <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{item.description}</p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={item.action}
          className="text-xs font-bold px-3 h-7 rounded-lg bg-brand-navy text-white hover:bg-brand-navy/90 transition-colors shadow-sm"
        >
          {item.actionLabel}
        </button>
        <button
          onClick={() => onDismiss(item.id)}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-all"
          title="Ignorar"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

/* ──────────────── Provider Badge ───────────── */

const PROVIDER_BADGES: Record<string, { bg: string; text: string; border: string }> = {
  aws: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200/60' },
  azure: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200/60' },
  gcp: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200/60' },
  k8s: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200/60' },
}

/* ─── Main Dashboard ─────────────────────────── */

export function DashboardModule() {
  const [health, setHealth] = useState<'UP' | 'DOWN' | 'DEGRADED' | null>(null)
  const [costOverview, setCostOverview] = useState<CostOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [showSetupWizard, setShowSetupWizard] = useState(false)
  const [dismissedTodos, setDismissedTodos] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem('cloudbuilder-dismissed-todos')
      return raw ? new Set(JSON.parse(raw)) : new Set()
    } catch { return new Set() }
  })

  const { credentials, environments, deployments } = useCredentialStore()
  const { nodes, edges } = useCanvasStore()
  const { isFullyConfigured } = useOnboardingStore()
  const allEvents = useActivityStore((s) => s.events)
  const activityEvents = useMemo(() => allEvents.slice(0, 10), [allEvents])
  const { setActiveModule } = useUiStore()

  /* ─── Quick Action Modals ─── */
  const [quickModal, setQuickModal] = useState<'design' | 'deploy' | 'aiops' | 'cost' | 'observe' | null>(null)

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
      dashboardApi.getCostOverview(envId).catch(() => null),
    ]).then(([h, costData]) => {
      if (h) {
        setHealth(h.status)
      }
      if (costData) {
        setCostOverview(costData)
      }
    }).finally(() => setLoading(false))
  }, [])

  /* ─── Derived data ─── */

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
  const deployedEnvs = environments.filter((e) => e.status === 'ACTIVE')
  const activeDeployments = deployments.filter((d) => d.status === 'running')
  const monthlyCost = costOverview?.totalCost

  const driftEvents = useMemo(() =>
    activityEvents.filter((e) => e.type === 'drift_detected'), [activityEvents])
  const costEvents = useMemo(() =>
    activityEvents.filter((e) =>
      ['cost_saving', 'cost_anomaly', 'cost_optimization'].includes(e.type)
    ), [activityEvents])
  const complianceEvents = useMemo(() =>
    activityEvents.filter((e) =>
      ['compliance_violation', 'compliance_fixed', 'compliance_ok'].includes(e.type)
    ), [activityEvents])
  const approvalEvents = useMemo(() =>
    activityEvents.filter((e) => e.type === 'approval_requested'), [activityEvents])
  const deployEvents = useMemo(() =>
    activityEvents.filter((e) =>
      ['deploy_success', 'deploy_fail'].includes(e.type)
    ), [activityEvents])

  /* ─── Smart To-Dos ─── */

  const pendingTodos = useMemo<TodoItem[]>(() => {
    const items: TodoItem[] = []

    if (needsSetup) {
      items.push({
        id: 'setup-creds',
        label: 'Configurar credenciais de nuvem',
        description: 'Nenhuma credencial configurada — você precisa de uma para provisionar infraestrutura.',
        icon: Key,
        action: () => setShowSetupWizard(true),
        actionLabel: 'Configurar',
        priority: 'high',
      })
    } else if (!hasEnvSetup) {
      items.push({
        id: 'create-env',
        label: 'Criar um ambiente',
        description: 'Credenciais OK, mas você precisa de ao menos um ambiente para fazer deploy.',
        icon: Server,
        action: () => setActiveModule('settings'),
        actionLabel: 'Criar',
        priority: 'high',
      })
    }

    if (totalResources === 0 && !needsSetup) {
      items.push({
        id: 'create-design',
        label: 'Adicionar recursos ao canvas',
        description: 'Seu canvas está vazio. Adicione componentes de infraestrutura para começar.',
        icon: Palette,
        action: () => setActiveModule('design'),
        actionLabel: 'Design',
        priority: 'medium',
      })
    }

    if (hasEnvSetup && activeDeployments.length === 0 && environments.length > 0 && totalResources > 0) {
      items.push({
        id: 'trigger-deploy',
        label: 'Fazer deploy da infraestrutura',
        description: `${totalResources} recurso(s) pronto(s) no canvas e ${environments.length} ambiente(s) configurado(s).`,
        icon: Rocket,
        action: () => setActiveModule('provision'),
        actionLabel: 'Deploy',
        priority: 'medium',
      })
    }

    if (driftEvents.length > 0) {
      items.push({
        id: 'fix-drift',
        label: 'Corrigir drift detectado',
        description: `${driftEvents.length} drift(s) — infraestrutura real divergiu do estado desejado.`,
        icon: GitCompare,
        action: () => setActiveModule('observe'),
        actionLabel: 'Revisar',
        priority: 'high',
      })
    }

    if (costEvents.length > 0) {
      items.push({
        id: 'review-cost',
        label: 'Oportunidades de economia',
        description: `${costEvents.length} recomendação(ões) de otimização de custos disponível(is).`,
        icon: DollarSign,
        action: () => setActiveModule('cost'),
        actionLabel: 'Ver',
        priority: 'medium',
      })
    }

    if (complianceEvents.length > 0) {
      items.push({
        id: 'fix-compliance',
        label: 'Revisar violações de compliance',
        description: `${complianceEvents.length} evento(s) de compliance que precisa(m) de atenção.`,
        icon: ShieldAlert,
        action: () => setActiveModule('platform'),
        actionLabel: 'Revisar',
        priority: 'high',
      })
    }

    if (approvalEvents.length > 0) {
      items.push({
        id: 'approve-pending',
        label: 'Aprovações pendentes',
        description: `${approvalEvents.length} solicitação(ões) de deploy aguardando aprovação.`,
        icon: UserCheck,
        action: () => setActiveModule('provision'),
        actionLabel: 'Aprovar',
        priority: 'high',
      })
    }

    if (deployEvents.some((e) => e.type === 'deploy_fail')) {
      items.push({
        id: 'check-failed',
        label: 'Deploy com falha',
        description: 'Um ou mais deploys falharam. Verifique os logs para diagnóstico.',
        icon: AlertTriangle,
        action: () => setActiveModule('provision'),
        actionLabel: 'Ver',
        priority: 'high',
      })
    }

    return items.filter((i) => !dismissedTodos.has(i.id))
  }, [needsSetup, hasEnvSetup, totalResources, environments.length, activeDeployments.length,
    driftEvents, costEvents, complianceEvents, approvalEvents, deployEvents, dismissedTodos, setActiveModule])

  const dismissTodo = useCallback((id: string) => {
    setDismissedTodos((prev) => {
      const next = new Set(prev)
      next.add(id)
      localStorage.setItem('cloudbuilder-dismissed-todos', JSON.stringify([...next]))
      return next
    })
  }, [])

  const handleNewDesign = useCallback(() => setActiveModule('design'), [setActiveModule])
  const handleDeploy = useCallback(() => {
    if (!hasEnvSetup && !needsSetup) {
      setActiveModule('settings')
    } else {
      setActiveModule('provision')
    }
  }, [hasEnvSetup, needsSetup, setActiveModule])

  /* ─── Unified Dashboard Body ─── */
  function UnifiedBody() {
    const alertCount = driftEvents.length + complianceEvents.filter(e => e.severity === 'error').length
    const successRate = deployEvents.length > 0
      ? Math.round((deployEvents.filter(e => e.type === 'deploy_success').length / deployEvents.length) * 100)
      : null
    const uptimeLabel = health === 'UP' ? '100%' : health === 'DEGRADED' ? 'Degradado' : 'Indisponível'

    return (
      <>
        {/* ═══ TOP: 3×3 Stats Grid (left) + Activity Feed (right) ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* 3×3 Stats Grid — left 7-col */}
          <div className="lg:col-span-7">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard label="Provedores" value={String(Object.values(providerCounts).filter(Boolean).length || 1)}
                sub={totalResources > 0 ? `${totalResources} recurso(s)` : undefined} icon={Cloud} />
              <StatCard label="Ambientes" value={String(environments.length || 1)}
                sub={deployedEnvs.length > 0 ? `${deployedEnvs.length} ativo(s)` : undefined} icon={Server} />
              <StatCard label="Deploys" value={String(deployments.length || 0)}
                sub={activeDeployments.length > 0 ? `${activeDeployments.length} em andamento` : undefined} icon={Rocket} />
              <StatCard label="Custo Mensal" value={monthlyCost != null ? `$${Math.round(monthlyCost).toLocaleString()}` : '—'}
                sub={totalResources > 0 ? 'por mês' : 'Sem recursos'} icon={DollarSign} />
              <StatCard label="Alertas" value={String(alertCount)}
                sub={alertCount > 0 ? `${driftEvents.length} drift(s)` : 'Nenhum crítico'} icon={AlertTriangle} />
              <StatCard label="Recursos" value={String(totalResources)}
                sub={`${totalConnections} conexões`} icon={Cpu} />
              <StatCard label="Disponibilidade" value={uptimeLabel}
                sub={health ? 'última verificação' : 'sem dados'} icon={Shield} />
              <StatCard label="Sucesso" value={successRate !== null ? `${successRate}%` : '—'}
                sub={successRate !== null ? 'taxa de deploy' : 'sem deploys'} icon={CheckCircle2} />
              <StatCard label="Serviços" value={String(deployedEnvs.length || 1)}
                sub={deployments.length > 0 ? `${deployments.length} total` : 'sem dados'} icon={Activity} />
            </div>
          </div>

          {/* Activity Feed — right 5-col, narrower */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <SectionHeader
                title="Feed de Atividade"
                badge={activityEvents.length > 0 ? activityEvents.length : undefined}
              />
              <div className="space-y-1.5 max-h-[340px] overflow-y-auto pr-0.5 -mr-0.5">
                {activityEvents.length === 0 ? (
                  <div className="flex items-center justify-center py-6 text-slate-400">
                    <Activity className="w-4 h-4 mr-2" />
                    <p className="text-xs">Nenhuma atividade recente</p>
                  </div>
                ) : (
                  activityEvents.slice(0, 8).map((event: ActivityEvent) => (
                    <div key={event.id}
                      className="group flex items-start gap-2.5 py-2 px-3 rounded-xl bg-white border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all duration-150">
                      <div className={cn(
                        'w-7 h-7 rounded-lg flex items-center justify-center shrink-0',
                        event.severity === 'error' ? 'bg-red-50' :
                        event.severity === 'warning' ? 'bg-amber-50' :
                        event.severity === 'success' ? 'bg-green-50' : 'bg-ice-blue/50'
                      )}>
                        <ActivityIcon type={event.type} className={
                          event.severity === 'error' ? 'text-red-500' :
                          event.severity === 'warning' ? 'text-amber-500' :
                          event.severity === 'success' ? 'text-green-600' : 'text-brand-navy'
                        } />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-semibold text-brand-navy truncate">{event.title}</p>
                          <span className={cn(
                            'inline-flex items-center px-1 py-0.5 rounded text-[9px] font-bold shrink-0',
                            ACTIVITY_SEVERITY_STYLES[event.severity]
                          )}>
                            {event.severity === 'error' ? 'Erro' :
                             event.severity === 'warning' ? 'Aviso' :
                             event.severity === 'success' ? 'OK' : 'Info'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{event.description}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-slate-400">{formatRelativeTime(event.timestamp)}</span>
                          {event.link && (
                            <button onClick={() => setActiveModule(NAV_MODULES[event.link!.module] || 'design')}
                              className="text-[10px] font-semibold text-brand-navy hover:text-brand-lime transition-colors">
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
          </div>
        </div>

        {/* ═══ PIPELINE (left) + TODOS (right) ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <SectionHeader
                title="Pipeline de Deploy"
                badge={environments.length}
                action={
                  <button onClick={() => setActiveModule('provision')}
                    className="text-xs font-semibold text-brand-navy hover:text-brand-lime transition-colors">
                    Ver todos →
                  </button>
                }
              />
              {environments.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
                    <Rocket className="w-5 h-5 text-slate-400" />
                  </div>
                  <p className="text-sm font-medium text-slate-500">Nenhum ambiente configurado</p>
                  <button onClick={() => setActiveModule('settings')}
                    className="mt-2 text-xs font-semibold text-brand-navy underline underline-offset-2">
                    Criar ambiente
                  </button>
                </div>
              ) : (
                <div className="space-y-0">
                  {environments.slice(0, 5).map((env, idx) => {
                    const lastDep = deployments.filter((d) => d.environmentId === env.id).pop()
                    return (
                      <div key={env.id} className="flex items-start gap-3 pb-3 last:pb-0">
                        <div className="flex flex-col items-center">
                          <div className={cn(
                            'w-7 h-7 rounded-xl flex items-center justify-center shrink-0',
                            env.status === 'ACTIVE' ? 'bg-green-100 text-green-600' :
                            env.status === 'PROVISIONING' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'
                          )}>
                            <Server className="w-3.5 h-3.5" />
                          </div>
                          {idx < Math.min(environments.length, 5) - 1 && (
                            <div className="w-0.5 flex-1 min-h-[12px] bg-slate-200 my-0.5 rounded-full" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 pt-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-brand-navy">{env.name}</span>
                            <span className={cn(
                              'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold',
                              env.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                              env.status === 'PROVISIONING' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
                            )}>
                              {env.status === 'ACTIVE' ? 'Ativo' : env.status === 'PROVISIONING' ? 'Provisionando' : 'Inativo'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {lastDep
                              ? `Último deploy ${formatRelativeTime(lastDep.startedAt)}${lastDep.status === 'success' ? ` — v${lastDep.version || '?'}` : ''}`
                              : 'Nenhum deploy realizado'}
                          </p>
                        </div>
                        <button onClick={() => setActiveModule('provision')}
                          className="shrink-0 inline-flex items-center gap-1 px-2.5 h-7 rounded-lg text-xs font-bold bg-brand-navy text-white hover:bg-brand-navy/90 transition-all">
                          Ir <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Tarefas & Lembretes — right 5-col (between 3×3 grid, alerts, and feed) */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <SectionHeader
                title="Tarefas & Lembretes"
                badge={pendingTodos.length > 0 ? pendingTodos.length : undefined}
              />
              {pendingTodos.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center mb-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  </div>
                  <p className="text-sm font-semibold text-green-700">Tudo em dia!</p>
                  <p className="text-xs text-slate-400 mt-1">Nenhuma tarefa pendente no momento.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 -mr-1">
                  {pendingTodos.slice(0, 4).map((todo) => (
                    <TodoRow key={todo.id} item={todo} onDismiss={dismissTodo} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ═══ CANVAS (left) + ALERTS (right) ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <SectionHeader
                title="Prévia do Canvas"
                badge={totalResources > 0 ? totalResources : undefined}
                action={
                  <button onClick={() => setActiveModule('design')}
                    className="text-xs font-semibold text-brand-navy hover:text-brand-lime transition-colors">
                    Abrir canvas →
                  </button>
                }
              />
              {totalResources === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
                    <Palette className="w-5 h-5 text-slate-400" />
                  </div>
                  <p className="text-sm font-medium text-slate-500">Canvas vazio</p>
                  <button onClick={() => setActiveModule('design')}
                    className="mt-2 inline-flex items-center gap-1.5 px-4 h-8 rounded-lg text-xs font-bold bg-brand-navy text-white hover:bg-brand-navy/90 transition-all shadow-sm">
                    <Plus className="w-3.5 h-3.5" /> Novo Design
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                    {(['aws', 'azure', 'gcp', 'k8s'] as const).map((p) => {
                      const count = providerCounts[p]
                      const badge = PROVIDER_BADGES[p]
                      return count > 0 ? (
                        <div key={p} className={cn('rounded-xl px-3 py-2.5 text-center border', badge.bg, badge.text, badge.border)}>
                          <p className="text-[10px] font-bold uppercase tracking-wider">{p}</p>
                          <p className="text-xl font-bold font-display mt-0.5">{count}</p>
                        </div>
                      ) : (
                        <div key={p} className="rounded-xl px-3 py-2.5 text-center bg-slate-50 border border-slate-100">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-300">{p}</p>
                          <p className="text-xl font-bold font-display text-slate-300 mt-0.5">0</p>
                        </div>
                      )
                    })}
                  </div>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Cpu className="w-3.5 h-3.5 text-slate-400" />
                        <strong className="text-brand-navy">{totalResources}</strong> nós
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Activity className="w-3.5 h-3.5 text-slate-400" />
                        <strong className="text-brand-navy">{totalConnections}</strong> conexões
                      </span>
                    </div>
                    {(() => {
                      const s = activityEvents.find((e) => e.type === 'design_save')
                      return s ? (
                        <span className="text-xs text-slate-400">
                          Salvo {formatRelativeTime(s.timestamp)}
                        </span>
                      ) : null
                    })()}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <SectionHeader title="Alertas & Oportunidades" />
              {totalResources === 0 && !needsSetup ? (
                <AlertCard
                  icon={Sparkles} color="blue"
                  title="Comece criando um design"
                  description="Adicione componentes de infraestrutura no canvas para começar a visualizar sua arquitetura."
                  link={{ label: 'Ir para Design', module: 'design' }}
                  onNavigate={setActiveModule}
                />
              ) : (
                <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1 -mr-1">
                  {driftEvents.slice(0, 1).map((evt) => (
                    <AlertCard key={evt.id} icon={GitCompare} color="amber" title={evt.title}
                      description={evt.description}
                      link={evt.link ? { label: evt.link.label, module: evt.link.module } : undefined}
                      onNavigate={setActiveModule} />
                  ))}
                  {driftEvents.length === 0 && totalResources > 0 && (
                    <AlertCard icon={ShieldCheckIcon} color="green"
                      title="Sem drift detectado"
                      description="Infraestrutura sincronizada com o estado desejado." />
                  )}
                  {costEvents.slice(0, 1).map((evt) => (
                    <AlertCard key={evt.id} icon={DollarSign} color="purple" title={evt.title}
                      description={evt.description}
                      link={evt.link ? { label: evt.link.label, module: evt.link.module } : undefined}
                      onNavigate={setActiveModule} />
                  ))}
                  {costEvents.length === 0 && totalResources > 0 && (
                    <AlertCard icon={DollarSign} color="slate"
                      title="Sem oportunidades de economia"
                      description="Monitore custos na página dedicada." />
                  )}
                  {complianceEvents.slice(0, 1).map((evt) => (
                    <AlertCard key={evt.id}
                      icon={evt.severity === 'error' ? ShieldAlert : ShieldCheckIcon}
                      color={evt.severity === 'error' ? 'red' : 'green'}
                      title={evt.title} description={evt.description}
                      link={evt.link ? { label: evt.link.label, module: evt.link.module } : undefined}
                      onNavigate={setActiveModule} />
                  ))}
                  {approvalEvents.slice(0, 1).map((evt) => (
                    <AlertCard key={evt.id} icon={UserCheck} color="blue" title={evt.title}
                      description={evt.description}
                      link={evt.link ? { label: evt.link.label, module: evt.link.module } : undefined}
                      onNavigate={setActiveModule} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ═══ ALL CHARTS ═══ */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <SectionHeader title="Análises e Gráficos" />
          <DashboardCharts />
        </div>
      </>
    )
  }

  /* ─── Loading ─── */

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-7 h-7 animate-spin text-brand-navy" />
          <p className="text-sm text-slate-400 font-medium">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  const healthStatus = health === 'UP' ? 'healthy' : health === 'DEGRADED' ? 'degraded' : 'down'
  const statusColor = healthStatus === 'healthy' ? 'bg-green-500' : healthStatus === 'degraded' ? 'bg-amber-500' : 'bg-red-500'
  const statusLabel = healthStatus === 'healthy' ? 'Sistema operacional' : healthStatus === 'degraded' ? 'Degradado' : 'Indisponível'

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-slate-50 to-white">
      {/* ═══ HEADER ═══ */}
      <div className="bg-white border-b border-slate-200 shadow-sm z-10 shrink-0">
        <div className="px-6 py-4 max-w-screen-2xl mx-auto">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Title + Status */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="shrink-0">
                <h1 className="text-lg font-bold text-brand-navy font-display">Dashboard</h1>
                <p className="text-xs text-slate-400 mt-0.5">Visão geral da plataforma</p>
              </div>

              <div className="h-6 w-px bg-slate-200 shrink-0" />

              {/* Status indicators */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className={cn('animate-ping absolute inline-flex h-full w-full rounded-full opacity-60', statusColor)} />
                    <span className={cn('relative inline-flex rounded-full h-1.5 w-1.5', statusColor)} />
                  </span>
                  <span className="text-[10px] font-medium text-slate-500 hidden sm:inline">{statusLabel}</span>
                </div>
                <div className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1 rounded-lg border',
                  activeDeployments.length > 0 ? 'bg-amber-50/80 border-amber-200/60' : 'bg-green-50/80 border-green-200/60'
                )}>
                  <span className={cn('w-1.5 h-1.5 rounded-full', activeDeployments.length > 0 ? 'bg-amber-500' : 'bg-green-500')} />
                  <span className={cn('text-[10px] font-medium hidden sm:inline', activeDeployments.length > 0 ? 'text-amber-700' : 'text-green-700')}>
                    {activeDeployments.length > 0 ? `${activeDeployments.length}` : '0'}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Quick Action Buttons → open modals */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setQuickModal('design')}
                className="inline-flex items-center gap-1.5 px-3.5 h-8 rounded-lg text-xs font-bold bg-brand-navy text-white hover:bg-brand-navy/90 transition-all shadow-sm"
                title="Criar um novo design de infraestrutura"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Novo Design</span>
              </button>
              <button
                onClick={() => setQuickModal('deploy')}
                className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-bold border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all"
                title="Gerenciar deploys e ambientes"
              >
                <Rocket className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Deploy</span>
              </button>
              <button
                onClick={() => setQuickModal('aiops')}
                className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-bold border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all"
                title="Assistente AIOps para diagnóstico e runbooks"
              >
                <BrainCircuit className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Runbook</span>
              </button>
              <button
                onClick={() => setQuickModal('cost')}
                className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-medium text-slate-500 hover:text-brand-navy hover:bg-slate-100 transition-all"
                title="Ver relatório de custos"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Custos</span>
              </button>
              <button
                onClick={() => setQuickModal('observe')}
                className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-medium text-slate-500 hover:text-brand-navy hover:bg-slate-100 transition-all"
                title="Abrir painel de observabilidade"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ BODY ═══ */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-5 space-y-6 max-w-screen-2xl mx-auto">

          {/* ─── Setup Wizard ─── */}
          {showSetupWizard && <SetupWizard onClose={() => setShowSetupWizard(false)} />}

          {/* ─── Onboarding ─── */}
          {needsSetup && !showSetupWizard && wizardDone && (
            <div className="bg-gradient-to-r from-brand-navy to-[#1a2a5e] rounded-2xl p-5 text-white shadow-md">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-lime/15 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5 text-brand-lime" />
                  </div>
                  <div>
                    <p className="text-base font-bold font-display">Bem-vindo ao CloudBuilder!</p>
                    <p className="text-sm text-white/70 mt-0.5">Configure suas credenciais de nuvem para começar a provisionar infraestrutura.</p>
                  </div>
                </div>
                <button onClick={() => setShowSetupWizard(true)}
                  className="inline-flex items-center gap-1.5 px-5 h-9 rounded-xl text-xs font-bold bg-brand-lime text-brand-navy hover:bg-brand-lime/90 transition-all shadow-sm">
                  <Key className="w-4 h-4" /> Configurar <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {!needsSetup && !hasEnvSetup && (
            <div className="flex items-center justify-between gap-3 bg-amber-50/80 border border-amber-200/60 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-amber-800">Ambientes não configurados</p>
                  <p className="text-xs text-amber-600 mt-0.5">Crie um ambiente para poder fazer deploy da sua infraestrutura.</p>
                </div>
              </div>
              <button onClick={() => setActiveModule('settings')}
                className="inline-flex items-center gap-1.5 px-4 h-8 rounded-lg text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 transition-all shrink-0">
                <Box className="w-3.5 h-3.5" /> Configurar Ambiente
              </button>
            </div>
          )}

          {/* ─── Unified Dashboard Body ─── */}
          <UnifiedBody />

        </div>
      </div>

      {/* ═══ QUICK ACTION MODALS ═══ */}

      {/* Novo Design Modal */}
      <Dialog open={quickModal === 'design'} onOpenChange={() => setQuickModal(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Design</DialogTitle>
            <DialogDescription>Criar um novo design de infraestrutura</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <button onClick={() => { setQuickModal(null); setActiveModule('design') }}
              className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-brand-navy hover:shadow-sm transition-all text-left group">
              <div className="w-10 h-10 rounded-xl bg-brand-navy/5 flex items-center justify-center group-hover:bg-brand-lime/15 transition-colors">
                <Palette className="w-5 h-5 text-brand-navy" />
              </div>
              <div>
                <p className="text-sm font-bold text-brand-navy">Canvas em Branco</p>
                <p className="text-xs text-slate-400 mt-0.5">Comece do zero arrastando recursos</p>
              </div>
            </button>
            <button onClick={() => { setQuickModal(null); setActiveModule('platform') }}
              className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-purple-400 hover:shadow-sm transition-all text-left group">
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                <Layout className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-brand-navy">Usar Template</p>
                <p className="text-xs text-slate-400 mt-0.5">Arquiteturas pré-prontas do catálogo</p>
              </div>
            </button>
            <button onClick={() => { localStorage.setItem('cloudbuilder-import-mode', 'true'); setQuickModal(null); setActiveModule('provision') }}
              className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-amber-400 hover:shadow-sm transition-all text-left group">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                <Box className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-brand-navy">Importar Infraestrutura</p>
                <p className="text-xs text-slate-400 mt-0.5">Terraform, CloudFormation ou Kubernetes</p>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Deploy Modal */}
      <Dialog open={quickModal === 'deploy'} onOpenChange={() => setQuickModal(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Gerenciar Deploy</DialogTitle>
            <DialogDescription>Ambientes e deploys disponíveis</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {environments.length === 0 ? (
              <div className="flex flex-col items-center py-6 text-center">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
                  <Server className="w-5 h-5 text-slate-400" />
                </div>
                <p className="text-sm font-medium text-slate-500">Nenhum ambiente configurado</p>
                <button onClick={() => { setQuickModal(null); setActiveModule('settings') }}
                  className="mt-3 inline-flex items-center gap-1.5 px-4 h-8 rounded-lg text-xs font-bold bg-brand-navy text-white hover:bg-brand-navy/90 transition-all">
                  <Box className="w-3.5 h-3.5" /> Criar Ambiente
                </button>
              </div>
            ) : (
              environments.slice(0, 4).map((env) => (
                <button key={env.id}
                  onClick={() => { setQuickModal(null); setActiveModule('provision') }}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-brand-navy hover:shadow-sm transition-all">
                  <div className="flex items-center gap-3">
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center',
                      env.status === 'ACTIVE' ? 'bg-green-100' : 'bg-slate-100')}>
                      <Server className={cn('w-4 h-4', env.status === 'ACTIVE' ? 'text-green-600' : 'text-slate-400')} />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-brand-navy">{env.name}</p>
                      <p className="text-[11px] text-slate-400">
                        {env.status === 'ACTIVE' ? 'Ativo' : env.status === 'PROVISIONING' ? 'Provisionando' : 'Inativo'}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </button>
              ))
            )}
            {environments.length > 4 && (
              <button onClick={() => { setQuickModal(null); setActiveModule('provision') }}
                className="w-full text-center text-xs font-semibold text-brand-navy hover:text-brand-lime transition-colors py-1">
                Ver todos os {environments.length} ambientes →
              </button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* AIOps Modal */}
      <Dialog open={quickModal === 'aiops'} onOpenChange={() => setQuickModal(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assistente AIOps</DialogTitle>
            <DialogDescription>Diagnóstico inteligente e runbooks automatizados</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <button onClick={() => { setQuickModal(null); setActiveModule('aiops') }}
              className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-brand-navy hover:shadow-sm transition-all text-left group">
              <div className="w-10 h-10 rounded-xl bg-brand-navy/5 flex items-center justify-center group-hover:bg-brand-lime/15 transition-colors">
                <BrainCircuit className="w-5 h-5 text-brand-navy" />
              </div>
              <div>
                <p className="text-sm font-bold text-brand-navy">Chat com IA</p>
                <p className="text-xs text-slate-400 mt-0.5">Diagnosticar incidentes e obter recomendações</p>
              </div>
            </button>
            <button onClick={() => { setQuickModal(null); setActiveModule('aiops') }}
              className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-amber-400 hover:shadow-sm transition-all text-left group">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-brand-navy">Incidentes Recentes</p>
                <p className="text-xs text-slate-400 mt-0.5">Histórico e resolução de incidentes</p>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cost Modal */}
      <Dialog open={quickModal === 'cost'} onOpenChange={() => setQuickModal(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Resumo de Custos</DialogTitle>
            <DialogDescription>Visão rápida dos custos de infraestrutura</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-brand-navy to-[#1a2a5e] text-white">
              <div>
                <p className="text-xs text-white/70 font-medium">Custo Estimado</p>
                <p className="text-2xl font-bold font-display tracking-tight mt-1">
                  {monthlyCost != null ? `$${Math.round(monthlyCost).toLocaleString()}` : '—'}
                </p>
                <p className="text-xs text-white/50 mt-0.5">Mês atual • {totalResources} recursos</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-brand-lime/15 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-brand-lime" />
              </div>
            </div>
            {costEvents.length > 0 && (
              <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200/60">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <p className="text-sm font-semibold text-purple-800">{costEvents.length} oportunidade(s) de economia</p>
                </div>
              </div>
            )}
            <button onClick={() => { setQuickModal(null); setActiveModule('cost') }}
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 h-9 rounded-lg text-xs font-bold bg-brand-navy text-white hover:bg-brand-navy/90 transition-all">
              <BarChart3 className="w-4 h-4" /> Ver Dashboard de Custos
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Observe Modal */}
      <Dialog open={quickModal === 'observe'} onOpenChange={() => setQuickModal(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Observabilidade</DialogTitle>
            <DialogDescription>Métricas, alertas e monitoramento da infraestrutura</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <button onClick={() => { setQuickModal(null); setActiveModule('observe') }}
              className="flex flex-col items-center text-center gap-2 p-4 rounded-xl border border-slate-200 hover:border-green-400 hover:shadow-sm transition-all group">
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center group-hover:bg-green-100 transition-colors">
                <Heart className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-brand-navy">Saúde</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Status dos serviços</p>
              </div>
            </button>
            <button onClick={() => { setQuickModal(null); setActiveModule('observe') }}
              className="flex flex-col items-center text-center gap-2 p-4 rounded-xl border border-slate-200 hover:border-amber-400 hover:shadow-sm transition-all group">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-brand-navy">Alertas</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Notificações ativas</p>
              </div>
            </button>
            <button onClick={() => { setQuickModal(null); setActiveModule('observe') }}
              className="flex flex-col items-center text-center gap-2 p-4 rounded-xl border border-slate-200 hover:border-brand-navy hover:shadow-sm transition-all group">
              <div className="w-10 h-10 rounded-xl bg-brand-navy/5 flex items-center justify-center group-hover:bg-brand-lime/15 transition-colors">
                <Activity className="w-5 h-5 text-brand-navy" />
              </div>
              <div>
                <p className="text-xs font-bold text-brand-navy">Métricas</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Performance e uso</p>
              </div>
            </button>
            <button onClick={() => { setQuickModal(null); setActiveModule('observe') }}
              className="flex flex-col items-center text-center gap-2 p-4 rounded-xl border border-slate-200 hover:border-purple-400 hover:shadow-sm transition-all group">
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                <GitCompareArrows className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-brand-navy">Drift</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Detecção de desvios</p>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}
