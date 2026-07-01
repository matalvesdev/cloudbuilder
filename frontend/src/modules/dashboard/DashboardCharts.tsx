import { useEffect, useMemo } from 'react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area,
} from 'recharts'
import { DollarSign, TrendingUp, TrendingDown, Cpu, Server, Cloud, Shield, Zap, type LucideIcon } from 'lucide-react'
import { useCostStore } from '@/store/costStore'
import { useCanvasStore } from '@/store/canvasStore'
import { useActivityStore } from '@/store/activityStore'
import { useCredentialStore } from '@/store/credentialStore'
import { cn } from '@/lib/utils'
import type { ActivityEvent } from '@/types/activity.types'

const COLORS = {
  brandNavy: '#0a1128',
  brandLime: '#ccff00',
  brandIceBlue: '#E3E2FD',
  aws: '#FF9900',
  azure: '#0078D4',
  gcp: '#4285F4',
  k8s: '#326CE5',
  green: '#22c55e',
  red: '#ef4444',
  amber: '#f59e0b',
  purple: '#a855f7',
  slate: '#94a3b8',
}

const PROVIDER_COLORS: Record<string, string> = {
  aws: COLORS.aws,
  azure: COLORS.azure,
  gcp: COLORS.gcp,
  k8s: COLORS.k8s,
}

/* ─── Chart Card Wrapper ────────────────────── */

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="h-1.5 w-1.5 rounded-full bg-brand-lime ring-2 ring-brand-lime/30" />
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</h3>
      </div>
      {children}
    </div>
  )
}

/* ─── Chart 1: Monthly Cost Trend ───────────── */

function CostTrendChart() {
  const costHistory = useCostStore((s) => s.costHistory)

  const data = costHistory.map((m) => ({
    name: m.month,
    Total: m.total,
    AWS: m.breakdown.aws,
    Azure: m.breakdown.azure,
    GCP: m.breakdown.gcp,
  }))

  return (
    <ChartCard title="Tendência de Custos">
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
          <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`} />
          <Tooltip
            contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
            formatter={(value: any) => [`$${Number(value).toLocaleString()}`, undefined]}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Line type="monotone" dataKey="Total" stroke={COLORS.brandNavy} strokeWidth={2.5} dot={{ r: 3 }} />
          <Line type="monotone" dataKey="AWS" stroke={COLORS.aws} strokeWidth={1.5} dot={{ r: 2 }} />
          <Line type="monotone" dataKey="Azure" stroke={COLORS.azure} strokeWidth={1.5} dot={{ r: 2 }} />
          <Line type="monotone" dataKey="GCP" stroke={COLORS.gcp} strokeWidth={1.5} dot={{ r: 2 }} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

/* ─── Chart 2: Cost by Provider ─────────────── */

function CostByProviderChart() {
  const costSummary = useCostStore((s) => s.costSummary)
  const { byProvider } = costSummary

  const data = Object.entries(byProvider).map(([provider, value]) => ({
    name: provider.toUpperCase(),
    value,
    color: PROVIDER_COLORS[provider] || COLORS.slate,
  }))

  const total = data.reduce((s, d) => s + d.value, 0)

  return (
    <ChartCard title="Distribuição por Provedor">
      <div className="flex items-center gap-4">
        <ResponsiveContainer width="50%" height={180}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={65}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} stroke="none" />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
              formatter={(value: any) => [`$${Number(value).toLocaleString()}`, undefined]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex-1 space-y-2">
          {data.map((d) => (
            <div key={d.name} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-slate-600 font-medium">{d.name}</span>
              </div>
              <div className="text-right">
                <span className="font-semibold text-brand-navy">${d.value.toLocaleString()}</span>
                <span className="text-slate-400 ml-1 text-xs">({((d.value / total) * 100).toFixed(1)}%)</span>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-100">
            <span className="font-bold text-brand-navy">Total</span>
            <span className="font-bold text-brand-navy">${total.toLocaleString()}/mês</span>
          </div>
        </div>
      </div>
    </ChartCard>
  )
}

/* ─── Chart 3: Cost by Service ──────────────── */

function CostByServiceChart() {
  const costSummary = useCostStore((s) => s.costSummary)

  const data = Object.entries(costSummary.byService).map(([service, cost]) => ({
    name: service.charAt(0).toUpperCase() + service.slice(1),
    cost,
  }))

  return (
    <ChartCard title="Custos por Serviço">
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={(v) => `$${v}`} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" width={70} />
          <Tooltip
            contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
            formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Custo']}
          />
          <Bar dataKey="cost" radius={[0, 6, 6, 0]} maxBarSize={24}>
            {data.map((_, i) => (
              <Cell key={i} fill={[COLORS.brandNavy, COLORS.aws, COLORS.azure, COLORS.gcp, COLORS.purple][i % 5]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

/* ─── Chart 4: Provider Resources ───────────── */

function ProviderResourcesChart() {
  const nodes = useCanvasStore((s) => s.nodes)

  const providerCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const n of nodes) {
      const type = n.type || 'unknown'
      counts[type] = (counts[type] || 0) + 1
    }
    return counts
  }, [nodes])

  const data = Object.entries(providerCounts).map(([provider, count]) => ({
    name: provider.toUpperCase(),
    Recursos: count,
    fill: PROVIDER_COLORS[provider] || COLORS.slate,
  }))

  const total = data.reduce((s, d) => s + d.Recursos, 0)

  if (total === 0) {
    return (
      <ChartCard title="Recursos por Provedor">
        <div className="flex items-center justify-center h-[180px] text-slate-400 text-sm">
          Crie componentes no canvas para ver a distribuição
        </div>
      </ChartCard>
    )
  }

  return (
    <ChartCard title="Recursos por Provedor">
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
          <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" allowDecimals={false} />
          <Tooltip
            contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
          />
          <Bar dataKey="Recursos" radius={[6, 6, 0, 0]} maxBarSize={40}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

/* ─── Chart 5: Activity Health ───────────────── */

function ActivityHealthSummary() {
  const events = useActivityStore((s) => s.events)

  const stats = useMemo(() => {
    const deployEvents = events.filter((e: ActivityEvent) =>
      ['deploy_success', 'deploy_fail'].includes(e.type)
    )
    const deploysTotal = deployEvents.length
    const deploysOk = deployEvents.filter((e: ActivityEvent) => e.type === 'deploy_success').length
    const deploysFail = deploysTotal - deploysOk

    const alertsTotal = events.filter((e: ActivityEvent) =>
      ['error', 'warning'].includes(e.severity)
    ).length

    const driftEvents = events.filter((e: ActivityEvent) => e.type === 'drift_detected').length
    const violations = events.filter((e: ActivityEvent) => e.type === 'compliance_violation').length
    const optimizations = events.filter((e: ActivityEvent) => e.type === 'cost_optimization' || e.type === 'cost_saving').length

    return { deploysTotal, deploysOk, deploysFail, alertsTotal, driftEvents, violations, optimizations }
  }, [events])

  const items: Array<{
    label: string
    value: number
    icon: LucideIcon
    color: string
    bg: string
    ok?: number
    fail?: number
  }> = [
    {
      label: 'Deploys',
      value: stats.deploysTotal,
      ok: stats.deploysOk,
      fail: stats.deploysFail,
      icon: TrendingUp,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: 'Alertas Ativos',
      value: stats.alertsTotal,
      icon: Shield,
      color: stats.alertsTotal > 0 ? 'text-amber-600' : 'text-green-600',
      bg: stats.alertsTotal > 0 ? 'bg-amber-50' : 'bg-green-50',
    },
    {
      label: 'Drifts',
      value: stats.driftEvents,
      icon: Server,
      color: stats.driftEvents > 0 ? 'text-amber-600' : 'text-green-600',
      bg: stats.driftEvents > 0 ? 'bg-amber-50' : 'bg-green-50',
    },
    {
      label: 'Violações',
      value: stats.violations,
      icon: Shield,
      color: stats.violations > 0 ? 'text-red-600' : 'text-green-600',
      bg: stats.violations > 0 ? 'bg-red-50' : 'bg-green-50',
    },
    {
      label: 'Economias',
      value: stats.optimizations,
      icon: DollarSign,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
  ]

  return (
    <ChartCard title="Resumo de Atividade">
      <div className="grid grid-cols-5 gap-2">
        {items.map((item) => {
          const Icon = item.icon
          const isOkFail = 'ok' in item && 'fail' in item
          return (
            <div key={item.label} className={cn('rounded-xl p-3 text-center', item.bg)}>
              <Icon className={cn('w-5 h-5 mx-auto mb-1.5', item.color)} />
              <p className={cn('text-lg font-bold', item.color)}>
                {isOkFail ? `${item.ok}/${item.value}` : item.value}
              </p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">{item.label}</p>
              {isOkFail && item.value > 0 && (
                <div className="flex items-center justify-center gap-1 mt-1">
                  <span className="text-[10px] text-green-600 font-bold">{item.ok}✓</span>
                  {(item.fail ?? 0) > 0 && <span className="text-[10px] text-red-600 font-bold">{item.fail}✗</span>}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </ChartCard>
  )
}

/* ─── Chart 6: Optimization Savings ─────────── */

function OptimizationSavingsChart() {
  const optimizations = useCostStore((s) => s.optimizations)

  const data = optimizations
    .filter((o) => !o.applied)
    .slice(0, 5)
    .map((o) => ({
      name: o.resourceName.length > 14 ? o.resourceName.slice(0, 12) + '…' : o.resourceName,
      savings: o.savings,
      current: o.currentCost,
      fill: PROVIDER_COLORS[o.provider] || COLORS.slate,
    }))

  if (data.length === 0) {
    return (
      <ChartCard title="Oportunidades de Economia">
        <div className="flex items-center justify-center h-[180px] text-slate-400 text-sm">
          <Zap className="w-4 h-4 mr-1.5" />
          Todas as otimizações aplicadas
        </div>
      </ChartCard>
    )
  }

  return (
    <ChartCard title="Oportunidades de Economia">
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} layout="vertical" margin={{ left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={(v) => `$${v}`} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" width={70} />
          <Tooltip
            contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
            formatter={(value: any) => [`$${Number(value)}/mês`, 'Economia']}
          />
          <Bar dataKey="savings" radius={[0, 6, 6, 0]} maxBarSize={20}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

/* ─── Chart 7: Deploy Timeline ───────────────── */

function DeployTimelineChart() {
  const deployments = useCredentialStore((s) => s.deployments)

  const data = useMemo(() => {
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000)
      return {
        name: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        success: 0,
        fail: 0,
      }
    })

    for (const dep of deployments) {
      const depDate = new Date(dep.startedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
      const entry = last7.find((e) => e.name === depDate)
      if (entry) {
        if (dep.status === 'success') entry.success++
        else entry.fail++
      }
    }

    return last7
  }, [deployments])

  return (
    <ChartCard title="Deploys (7 dias)">
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
          <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" allowDecimals={false} />
          <Tooltip
            contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
          />
          <Area type="monotone" dataKey="success" stackId="1" stroke={COLORS.green} fill={COLORS.green} fillOpacity={0.2} strokeWidth={2} />
          <Area type="monotone" dataKey="fail" stackId="1" stroke={COLORS.red} fill={COLORS.red} fillOpacity={0.15} strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

/* ─── Main Component ─────────────────────────── */

export function DashboardCharts() {
  const fetchCostData = useCostStore((s) => s.fetchCostData)
  const fetchActivityEvents = useActivityStore((s) => s.fetchActivityEvents)

  useEffect(() => {
    fetchCostData()
    fetchActivityEvents()
  }, [fetchCostData, fetchActivityEvents])

  return (
    <div className="space-y-4">
      {/* Row A: 2 cols — Cost Trend + Donut */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-7">
          <CostTrendChart />
        </div>
        <div className="col-span-5">
          <CostByProviderChart />
        </div>
      </div>

      {/* Row B: 3 cols — Cost by Service + Provider Resources + Optimization Savings */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-4">
          <CostByServiceChart />
        </div>
        <div className="col-span-4">
          <ProviderResourcesChart />
        </div>
        <div className="col-span-4">
          <OptimizationSavingsChart />
        </div>
      </div>

      {/* Row C: 2 cols — Activity Health + Deploy Timeline */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-7">
          <ActivityHealthSummary />
        </div>
        <div className="col-span-5">
          <DeployTimelineChart />
        </div>
      </div>
    </div>
  )
}
