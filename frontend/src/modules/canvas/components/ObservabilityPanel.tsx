import { useState, useEffect, useRef, useCallback } from 'react'
import {
  X, AlertTriangle, AlertCircle, Info, Activity,
  Loader2, CheckCircle, ChevronDown, ChevronRight,
  Clock, Server, GitBranch,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { observabilityApi } from '@/api/observability'
import type { TraceDTO, IncidentDTO } from '@/types/observability.types'

const POLL_INTERVAL = 15_000

interface AlertDisplay {
  id: string
  severity: 'critical' | 'warning' | 'info'
  title: string
  message: string
  resourceName: string
  timestamp: number
  acknowledged: boolean
}

interface Props {
  onClose: () => void
}

const severityConfig = {
  critical: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200', label: 'Crítico' },
  warning: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200', label: 'Alerta' },
  info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200', label: 'Info' },
}

function incidentToAlert(incident: IncidentDTO): AlertDisplay {
  return {
    id: incident.id,
    severity: (incident.severity === 'critical' || incident.severity === 'warning' || incident.severity === 'info')
      ? incident.severity : 'info',
    title: incident.title,
    message: incident.description || incident.title,
    resourceName: incident.alertRuleId || '—',
    timestamp: new Date(incident.startedAt).getTime(),
    acknowledged: incident.acknowledgedAt !== null || incident.status === 'RESOLVED',
  }
}

export function ObservabilityPanel({ onClose }: Props) {
  const [tab, setTab] = useState<'alerts' | 'traces'>('alerts')
  const [alerts, setAlerts] = useState<AlertDisplay[]>([])
  const [traces, setTraces] = useState<TraceDTO[]>([])
  const [loadingAlerts, setLoadingAlerts] = useState(true)
  const [loadingTraces, setLoadingTraces] = useState(true)
  const [expandedTrace, setExpandedTrace] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

  const fetchAlerts = useCallback(async () => {
    try {
      const incidents = await observabilityApi.getActiveIncidents()
      setAlerts(incidents.map(incidentToAlert))
    } catch {
      // API unavailable — keep last known data
    } finally {
      setLoadingAlerts(false)
    }
  }, [])

  const fetchTraces = useCallback(async () => {
    try {
      const result = await observabilityApi.getTraces({ onlyErrors: false })
      setTraces(result)
    } catch {
      // API unavailable — keep last known data
    } finally {
      setLoadingTraces(false)
    }
  }, [])

  const handleAcknowledge = useCallback(async (id: string) => {
    try {
      await observabilityApi.acknowledgeIncident(id)
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a))
    } catch {
      // silent
    }
  }, [])

  useEffect(() => {
    fetchAlerts()
    fetchTraces()

    pollRef.current = setInterval(() => {
      fetchAlerts()
      fetchTraces()
    }, POLL_INTERVAL)

    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [fetchAlerts, fetchTraces])

  const fmtTime = (ts: number) => {
    const d = new Date(ts)
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  const fmtDuration = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  const unacknowledgedCount = alerts.filter(a => !a.acknowledged).length

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
        <Activity className="w-4 h-4 text-slate-600" />
        <span className="text-sm font-bold text-brand-navy flex-1">Observabilidade</span>
        <span className={cn('w-2 h-2 rounded-full', !loadingAlerts ? 'bg-green-400' : 'bg-slate-300')} />
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
          {unacknowledgedCount > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 bg-red-50 text-red-600 rounded-full text-[9px]">
              {unacknowledgedCount}
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
        {tab === 'alerts' ? (
          loadingAlerts ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {alerts.length === 0 ? (
                <div className="text-center py-12 text-sm text-slate-400">Nenhum alerta ativo</div>
              ) : (
                alerts.map((alert) => {
                  const sev = severityConfig[alert.severity]
                  const Icon = sev.icon
                  return (
                    <div
                      key={alert.id}
                      className={cn(
                        'px-4 py-3 transition-colors',
                        !alert.acknowledged && 'bg-slate-50/50'
                      )}
                      onClick={() => !alert.acknowledged && handleAcknowledge(alert.id)}
                      role={!alert.acknowledged ? 'button' : undefined}
                    >
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
          )
        ) : (
          loadingTraces ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {traces.length === 0 ? (
                <div className="text-center py-12 text-sm text-slate-400">Nenhum trace encontrado</div>
              ) : (
                traces.map((trace) => {
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
          )
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
        <span>{!loadingAlerts ? 'Conectado' : 'Carregando...'}</span>
        {alerts.length > 0 && <span>{fmtTime(Math.max(...alerts.map(a => a.timestamp)))}</span>}
      </div>
    </div>
  )
}
