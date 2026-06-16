import { useState, useEffect, useRef } from 'react'
import {
  X, AlertTriangle, AlertCircle, Info, Activity,
  Loader2, CheckCircle, ChevronDown, ChevronRight,
  Clock, Server, GitBranch,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1'

interface TraceDTO {
  traceId: string
  serviceName: string
  operation: string
  startTime: number
  durationMs: number
  statusCode: number
  isError: boolean
  spans: { spanId: string; operation: string; serviceName: string; startTime: number; durationMs: number; statusCode: number; status: string }[]
}

interface AlertDTO {
  id: string
  severity: 'critical' | 'warning' | 'info'
  title: string
  message: string
  resourceName: string
  resourceType: string
  timestamp: number
  acknowledged: boolean
}

interface APMSnapshot {
  recentTraces: TraceDTO[]
  activeAlerts: AlertDTO[]
  timestamp: number
}

interface Props {
  onClose: () => void
}

const severityConfig = {
  critical: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200', label: 'Crítico' },
  warning: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200', label: 'Alerta' },
  info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200', label: 'Info' },
}

export function ObservabilityPanel({ onClose }: Props) {
  const [tab, setTab] = useState<'alerts' | 'traces'>('alerts')
  const [snapshot, setSnapshot] = useState<APMSnapshot | null>(null)
  const [connected, setConnected] = useState(false)
  const [expandedTrace, setExpandedTrace] = useState<string | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    const es = new EventSource(`${API_BASE}/apm/stream`)
    eventSourceRef.current = es

    es.onopen = () => setConnected(true)

    es.addEventListener('apm', (event) => {
      try {
        const data: APMSnapshot = JSON.parse(event.data)
        setSnapshot(data)
      } catch { /* ignore parse errors */ }
    })

    es.onerror = () => {
      setConnected(false)
    }

    return () => {
      es.close()
      eventSourceRef.current = null
    }
  }, [])

  const fmtTime = (ts: number) => {
    const d = new Date(ts)
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  const fmtDuration = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
        <Activity className="w-4 h-4 text-slate-600" />
        <span className="text-sm font-bold text-brand-navy flex-1">Observabilidade</span>
        <span className={cn('w-2 h-2 rounded-full', connected ? 'bg-green-400' : 'bg-red-400')} />
        <button onClick={onClose} className="text-slate-400 hover:text-brand-navy transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-100">
        <button
          onClick={() => setTab('alerts')}
          className={cn(
            'flex-1 px-4 py-2.5 text-xs font-bold transition-colors relative',
            tab === 'alerts' ? 'text-brand-navy' : 'text-slate-400 hover:text-slate-600'
          )}
        >
          Alertas
          {snapshot && snapshot.activeAlerts.filter(a => !a.acknowledged).length > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 bg-red-50 text-red-600 rounded-full text-[9px]">
              {snapshot.activeAlerts.filter(a => !a.acknowledged).length}
            </span>
          )}
          {tab === 'alerts' && <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-brand-navy rounded-full" />}
        </button>
        <button
          onClick={() => setTab('traces')}
          className={cn(
            'flex-1 px-4 py-2.5 text-xs font-bold transition-colors relative',
            tab === 'traces' ? 'text-brand-navy' : 'text-slate-400 hover:text-slate-600'
          )}
        >
          Traces
          {tab === 'traces' && <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-brand-navy rounded-full" />}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {!snapshot ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
          </div>
        ) : tab === 'alerts' ? (
          <div className="divide-y divide-slate-50">
            {snapshot.activeAlerts.length === 0 ? (
              <div className="text-center py-12 text-sm text-slate-400">Nenhum alerta ativo</div>
            ) : (
              snapshot.activeAlerts.map((alert) => {
                const sev = severityConfig[alert.severity]
                const Icon = sev.icon
                return (
                  <div key={alert.id} className={cn(
                    'px-4 py-3 transition-colors',
                    !alert.acknowledged && 'bg-slate-50/50'
                  )}>
                    <div className="flex items-start gap-3">
                      <Icon className={cn('w-4 h-4 mt-0.5 shrink-0', sev.color)} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-bold text-brand-navy truncate">{alert.title}</span>
                          <span className={cn(
                            'px-1.5 py-0.5 text-[9px] font-bold rounded-full border',
                            sev.bg, sev.color, sev.border
                          )}>{sev.label}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mb-1">{alert.message}</p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                          <Server className="w-3 h-3" />
                          <span>{alert.resourceName}</span>
                          <span>·</span>
                          <Clock className="w-3 h-3" />
                          <span>{fmtTime(alert.timestamp)}</span>
                        </div>
                      </div>
                      {alert.acknowledged && (
                        <CheckCircle className="w-3.5 h-3.5 text-green-400 mt-1 shrink-0" />
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        ) : (
          /* Traces tab */
          <div className="divide-y divide-slate-50">
            {snapshot.recentTraces.length === 0 ? (
              <div className="text-center py-12 text-sm text-slate-400">Nenhum trace encontrado</div>
            ) : (
              snapshot.recentTraces.map((trace) => {
                const isExpanded = expandedTrace === trace.traceId
                return (
                  <div key={trace.traceId} className="px-4 py-2.5">
                    <div
                      onClick={() => setExpandedTrace(isExpanded ? null : trace.traceId)}
                      className="flex items-center gap-3 cursor-pointer"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-brand-navy truncate">{trace.operation}</span>
                          {trace.isError && (
                            <span className="px-1.5 py-0.5 bg-red-50 text-red-600 rounded text-[9px] font-bold border border-red-200">
                              ERRO
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                          <GitBranch className="w-3 h-3" />
                          <span>{trace.serviceName}</span>
                          <span>·</span>
                          <Clock className="w-3 h-3" />
                          <span>{fmtTime(trace.startTime)}</span>
                        </div>
                      </div>
                      <span className={cn(
                        'text-xs font-mono font-bold min-w-[60px] text-right',
                        trace.durationMs > 500 ? 'text-red-500' : trace.durationMs > 200 ? 'text-amber-500' : 'text-green-500'
                      )}>
                        {fmtDuration(trace.durationMs)}
                      </span>
                      {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-300" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-300" />}
                    </div>

                    {/* Spans */}
                    {isExpanded && (
                      <div className="mt-2 ml-4 pl-3 border-l-2 border-slate-100 space-y-1.5">
                        {trace.spans.map((span, i) => (
                          <div key={span.spanId} className="flex items-center gap-3 py-1">
                            <div className={cn(
                              'w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold',
                              span.status === 'ERROR' ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'
                            )}>
                              {i + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-xs text-slate-600 truncate block">{span.operation}</span>
                              <span className="text-[10px] text-slate-400">{span.serviceName}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">{fmtDuration(span.durationMs)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
        <span>{connected ? 'Conectado' : 'Reconectando...'}</span>
        {snapshot && <span>{fmtTime(snapshot.timestamp)}</span>}
      </div>
    </div>
  )
}
