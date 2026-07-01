import { useEffect, useState, useMemo } from 'react'
import {
  AlertTriangle,
  ArrowLeftRight,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Code,
  EyeOff,
  GitCompare,
  RefreshCw,
  Server,
  Shield,
  ShieldAlert,
  ShieldCheck,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useDriftStore } from '@/store/driftStore'
import type { DriftReport, DriftResource, PropertyChange, DriftType, DriftSeverity } from '@/types/drift.types'

const driftColors: Record<DriftType, { bg: string; text: string; border: string; dot: string }> = {
  MODIFIED: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-400' },
  ADDED: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-400' },
  REMOVED: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-400' },
}

const severityColors: Record<DriftSeverity, { bg: string; text: string; icon: typeof ShieldAlert }> = {
  CRITICAL: { bg: 'bg-red-50', text: 'text-red-700', icon: ShieldAlert },
  MODERATE: { bg: 'bg-amber-50', text: 'text-amber-700', icon: Shield },
  INFO: { bg: 'bg-blue-50', text: 'text-blue-700', icon: ShieldCheck },
}

const driftLabels: Record<DriftType, string> = {
  MODIFIED: 'Modificado',
  ADDED: 'Adicionado',
  REMOVED: 'Removido',
}

function providerColor(provider: string): string {
  switch (provider) {
    case 'aws': return 'text-orange-600'
    case 'azure': return 'text-blue-600'
    case 'gcp': return 'text-blue-500'
    case 'k8s': return 'text-indigo-600'
    default: return 'text-slate-600'
  }
}

function DriftSummaryCards({ report }: { report: DriftReport }) {
  const total = report.resources.length
  const active = report.resources.filter((r) => r.status === 'DETECTED').length
  const critical = report.resources.filter((r) => r.severity === 'CRITICAL' && r.status === 'DETECTED').length
  const modified = report.resources.filter((r) => r.driftType === 'MODIFIED' && r.status === 'DETECTED').length
  const added = report.resources.filter((r) => r.driftType === 'ADDED' && r.status === 'DETECTED').length
  const removed = report.resources.filter((r) => r.driftType === 'REMOVED' && r.status === 'DETECTED').length

  return (
    <div className="grid grid-cols-4 gap-4">
      <div className="bg-white rounded-3xl p-5 card-shadow border border-slate-100 flex items-center gap-4">
        <div className={cn('rounded-xl p-3', critical > 0 ? 'bg-red-50' : 'bg-ice-blue')}>
          <ShieldAlert className={cn('h-5 w-5', critical > 0 ? 'text-red-500' : 'text-brand-navy')} />
        </div>
        <div>
          <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">Total</p>
          <p className={cn('text-2xl font-bold', critical > 0 ? 'text-red-600' : 'text-brand-navy')}>
            {total}
          </p>
          <p className="text-xs text-slate-400">{active} ativos</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-5 card-shadow border border-slate-100 flex items-center gap-4">
        <div className={cn('rounded-xl p-3', critical > 0 ? 'bg-red-50' : 'bg-ice-blue')}>
          <AlertTriangle className={cn('h-5 w-5', critical > 0 ? 'text-red-500' : 'text-brand-navy')} />
        </div>
        <div>
          <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">Críticos</p>
          <p className={cn('text-2xl font-bold', critical > 0 ? 'text-red-600' : 'text-brand-navy')}>
            {critical}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-5 card-shadow border border-slate-100 flex items-center gap-4">
        <div className="rounded-xl p-3 bg-amber-50">
          <GitCompare className="h-5 w-5 text-amber-500" />
        </div>
        <div>
          <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">Modificados</p>
          <p className="text-2xl font-bold text-amber-600">{modified}</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-5 card-shadow border border-slate-100 flex items-center gap-3">
        <div className="rounded-xl p-3 bg-red-50">
          <X className="h-5 w-5 text-red-500" />
        </div>
        <div className="flex gap-3 flex-1">
          <div>
            <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">Add</p>
            <p className="text-2xl font-bold text-emerald-600">{added}</p>
          </div>
          <div className="w-px bg-slate-200" />
          <div>
            <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">Rem</p>
            <p className="text-2xl font-bold text-red-600">{removed}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function PropertyDiffRow({ change, compact }: { change: PropertyChange; compact?: boolean }) {
  return (
    <div className="flex items-center gap-2 text-xs font-mono">
      <span className="text-slate-500 min-w-[100px]">{change.property}</span>
      <span className="text-slate-400 line-through flex-1 truncate">{change.expectedValue}</span>
      <ArrowLeftRight className="h-3 w-3 text-slate-300 shrink-0" />
      <span className={cn(
        'flex-1 truncate font-semibold',
        change.changeType === 'CREATED' ? 'text-emerald-600' :
        change.changeType === 'DELETED' ? 'text-red-600' : 'text-amber-600'
      )}>
        {change.actualValue}
      </span>
    </div>
  )
}

function DriftResourceRow({
  resource,
  reportId,
  onAccept,
  onIgnore,
  onRemediate,
}: {
  resource: DriftResource
  reportId: string
  onAccept: (resourceId: string) => void
  onIgnore: (resourceId: string) => void
  onRemediate: (resourceId: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const colors = driftColors[resource.driftType]
  const SevIcon = severityColors[resource.severity].icon
  const resolved = resource.status !== 'DETECTED'

  return (
    <div
      className={cn(
        'rounded-2xl border transition-all',
        resolved ? 'border-slate-100 bg-slate-50 opacity-60' : 'bg-white card-shadow border-slate-100'
      )}
    >
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 text-left"
      >
        {expanded ? <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" /> : <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />}

        <div className={cn('w-2 h-2 rounded-full shrink-0', resolved ? 'bg-slate-300' : colors.dot)} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn('text-sm font-medium truncate', resolved ? 'text-slate-400' : 'text-brand-navy')}>
              {resource.resourceName}
            </span>
            <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', colors.bg, colors.text, colors.border)}>
              {driftLabels[resource.driftType]}
            </Badge>
            {resolved && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {resource.status === 'ACCEPTED' ? 'Aceito' : resource.status === 'IGNORED' ? 'Ignorado' : 'Remediado'}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={cn('text-xs font-medium', providerColor(resource.provider))}>{resource.provider}</span>
            <span className="text-xs text-slate-400">/</span>
            <span className="text-xs text-slate-500">{resource.resourceType}</span>
            <SevIcon className={cn('h-3 w-3 ml-1', severityColors[resource.severity].text)} />
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-400 shrink-0">
          <Clock className="h-3 w-3" />
          {new Date(resource.detectedAt).toLocaleString('pt-BR')}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          <div className="border-t border-slate-100 pt-3 space-y-1.5">
            {resource.propertyChanges.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Nenhuma propriedade com diferença</p>
            ) : (
              resource.propertyChanges.map((change, i) => (
                <PropertyDiffRow key={i} change={change} />
              ))
            )}
          </div>

          {!resolved && (
            <div className="flex items-center gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1.5 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                onClick={() => onAccept(resource.id)}
              >
                <Check className="h-3 w-3" />
                Aceitar Drift
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1.5 text-amber-600 border-amber-200 hover:bg-amber-50"
                onClick={() => onRemediate(resource.id)}
              >
                <RefreshCw className="h-3 w-3" />
                Remediar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1.5 text-slate-400"
                onClick={() => onIgnore(resource.id)}
              >
                <EyeOff className="h-3 w-3" />
                Ignorar
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function DiffPanel({ resource }: { resource: DriftResource | null }) {
  if (!resource) {
    return (
      <div className="bg-white rounded-3xl card-shadow border border-slate-100 p-6">
        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
          <GitCompare className="h-10 w-10 mb-3" />
          <p className="text-sm font-medium">Selecione um recurso com drift</p>
          <p className="text-xs mt-1">Expanda um recurso acima para ver o comparativo lado a lado</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-3xl card-shadow border border-slate-100 p-6 space-y-4">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-brand-lime" />
        <h2 className="text-xs font-bold tracking-widest text-slate-400 uppercase">
          Comparativo: {resource.resourceName}
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-brand-navy/10 bg-brand-navy/[0.02] p-4 space-y-2">
          <div className="flex items-center gap-2 pb-2 border-b border-brand-navy/10">
            <Code className="h-4 w-4 text-brand-navy" />
            <span className="text-xs font-bold text-brand-navy uppercase">Estado Desejado (Canvas)</span>
          </div>
          <div className="space-y-1.5">
            <div className="text-xs text-slate-500">
              <span className="font-medium text-slate-700">Provider:</span> {resource.provider}
            </div>
            <div className="text-xs text-slate-500">
              <span className="font-medium text-slate-700">Tipo:</span> {resource.resourceType}
            </div>
            {resource.propertyChanges.map((change, i) => (
              <div key={i} className="text-xs text-slate-500">
                <span className="font-medium text-slate-700">{change.property}:</span>{' '}
                <span className="text-slate-400">{change.expectedValue}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-red-200 bg-red-50/50 p-4 space-y-2">
          <div className="flex items-center gap-2 pb-2 border-b border-red-200">
            <Server className="h-4 w-4 text-red-500" />
            <span className="text-xs font-bold text-red-600 uppercase">Estado Real (Cloud)</span>
          </div>
          <div className="space-y-1.5">
            <div className="text-xs text-slate-500">
              <span className="font-medium text-slate-700">Provider:</span> {resource.provider}
            </div>
            <div className="text-xs text-slate-500">
              <span className="font-medium text-slate-700">Tipo:</span> {resource.resourceType}
            </div>
            {resource.propertyChanges.map((change, i) => (
              <div key={i} className="text-xs">
                <span className="font-medium text-slate-700">{change.property}:</span>{' '}
                <span className={cn(
                  'font-semibold',
                  change.changeType === 'CREATED' ? 'text-emerald-600' :
                  change.changeType === 'DELETED' ? 'text-red-600' : 'text-amber-600'
                )}>
                  {change.actualValue}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function DriftTimeline({ report }: { report: DriftReport }) {
  const events = report.resources.map((r) => ({
    id: r.id,
    resourceName: r.resourceName,
    driftType: r.driftType,
    detectedAt: r.detectedAt,
    status: r.status,
  }))

  if (events.length === 0) {
    return (
      <div className="bg-white rounded-3xl card-shadow border border-slate-100 p-6">
        <p className="text-xs text-slate-400 text-center py-4">Nenhum evento de drift</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-3xl card-shadow border border-slate-100 p-6 space-y-4">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-brand-lime" />
        <h2 className="text-xs font-bold tracking-widest text-slate-400 uppercase">Linha do Tempo</h2>
      </div>
      <div className="relative">
        <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-slate-200" />
        <div className="space-y-3">
          {events.map((event) => {
            const colors = driftColors[event.driftType]
            const resolved = event.status !== 'DETECTED'
            return (
              <div key={event.id} className="flex items-start gap-3">
                <div className={cn('w-4 h-4 rounded-full border-2 mt-0.5 shrink-0 z-10 bg-white',
                  resolved ? 'border-slate-300' : colors.dot.replace('bg-', 'border-')
                )}>
                  <div className={cn('w-1.5 h-1.5 rounded-full m-auto mt-[3px]',
                    resolved ? 'bg-slate-300' : colors.dot
                  )} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-brand-navy truncate">{event.resourceName}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', colors.bg, colors.text, colors.border)}>
                      {driftLabels[event.driftType]}
                    </Badge>
                    {resolved && (
                      <span className="text-[10px] text-slate-400">
                        {event.status === 'ACCEPTED' ? 'Aceito' : event.status === 'IGNORED' ? 'Ignorado' : 'Remediado'}
                      </span>
                    )}
                  </div>
                </div>
                <time className="text-[10px] text-slate-400 shrink-0 mt-0.5">
                  {new Date(event.detectedAt).toLocaleString('pt-BR')}
                </time>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function DriftDetection() {
  const {
    reports,
    loading,
    loadDriftReport,
    acceptDrift,
    ignoreDrift,
    remediateDrift,
    acceptAllDrifts,
    ignoreAllDrifts,
    remediateAllDrifts,
    clearResolved,
    startPeriodicDetection,
    stopPeriodicDetection,
  } = useDriftStore()

  const [selectedDiff, setSelectedDiff] = useState<DriftResource | null>(null)
  const [activeReportIdx, setActiveReportIdx] = useState(0)
  const [isDetecting, setIsDetecting] = useState(false)
  const [showDiff, setShowDiff] = useState(false)

  const activeReports = useMemo(() => reports.filter((r) => r.resources.some((res) => res.status === 'DETECTED')), [reports])
  const currentReport = reports[activeReportIdx] || activeReports[0] || reports[reports.length - 1]
  const activeResources = currentReport?.resources.filter((r) => r.status === 'DETECTED') || []
  const resolvedCount = currentReport?.resources.filter((r) => r.status !== 'DETECTED').length || 0
  const totalCount = currentReport?.resources.length || 0

  useEffect(() => {
    if (reports.length === 0) {
      loadDriftReport()
    }
  }, [])

  useEffect(() => {
    startPeriodicDetection(45000)
    return () => stopPeriodicDetection()
  }, [])

  const handleDetectNow = () => {
    setIsDetecting(true)
    loadDriftReport()
    setTimeout(() => setIsDetecting(false), 800)
  }

  const handleAccept = (resourceId: string) => {
    acceptDrift(resourceId)
    setSelectedDiff(null)
  }

  const handleIgnore = (resourceId: string) => {
    ignoreDrift(resourceId)
    setSelectedDiff(null)
  }

  const handleRemediate = (resourceId: string) => {
    remediateDrift(resourceId)
    setSelectedDiff(null)
  }

  if (!currentReport) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-3xl card-shadow border border-slate-100 p-12 flex flex-col items-center justify-center text-slate-400">
          <ShieldCheck className="h-12 w-12 mb-3 text-emerald-400" />
          <p className="text-base font-medium text-brand-navy">Nenhum drift detectado</p>
          <p className="text-sm mt-1">Toda a infraestrutura está sincronizada com o design do canvas.</p>
          <Button variant="outline" size="sm" className="mt-4 gap-1.5" onClick={handleDetectNow}>
            <RefreshCw className="h-3 w-3" />
            Verificar Agora
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-brand-navy font-display">Detecção de Drift</h2>
          <p className="text-xs text-slate-400">
            Última detecção: {new Date(currentReport.detectedAt).toLocaleString('pt-BR')}
            {' '}— v{currentReport.canvasVersion}
            {' '}— {currentReport.environmentId}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5"
            onClick={handleDetectNow}
            disabled={isDetecting}
          >
            <RefreshCw className={cn('h-3.5 w-3.5', isDetecting && 'animate-spin')} />
            Detectar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-slate-400"
            onClick={clearResolved}
          >
            <X className="h-3.5 w-3.5" />
            Limpar Resolvidos
          </Button>
        </div>
      </div>

      <DriftSummaryCards report={currentReport} />

      {/* Bulk actions */}
      {activeResources.length > 0 && (
        <div className="flex items-center gap-2 px-1">
          <span className="text-xs text-slate-400 font-medium mr-1">Ações em massa:</span>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
            onClick={() => currentReport && acceptAllDrifts(currentReport.id)}
          >
            <Check className="h-3 w-3" />
            Aceitar Todos
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1 text-amber-600 border-amber-200 hover:bg-amber-50"
            onClick={() => currentReport && remediateAllDrifts(currentReport.id)}
          >
            <RefreshCw className="h-3 w-3" />
            Remediar Todos
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1 text-slate-400"
            onClick={() => currentReport && ignoreAllDrifts(currentReport.id)}
          >
            <EyeOff className="h-3 w-3" />
            Ignorar Todos
          </Button>
          {resolvedCount > 0 && (
            <span className="text-xs text-slate-400 ml-auto">
              {resolvedCount}/{totalCount} resolvidos
            </span>
          )}
        </div>
      )}

      <div className="grid grid-cols-5 gap-6">
        <div className={showDiff ? 'col-span-3' : 'col-span-5 space-y-2'}>
          {currentReport.resources.map((resource) => (
            <div
              key={resource.id}
              onClick={() => {
                setSelectedDiff(resource)
                setShowDiff(true)
              }}
              className="cursor-pointer"
            >
              <DriftResourceRow
                resource={resource}
                reportId={currentReport.id}
                onAccept={handleAccept}
                onIgnore={handleIgnore}
                onRemediate={handleRemediate}
              />
            </div>
          ))}
        </div>

        {showDiff && (
          <div className="col-span-2 space-y-4">
            <button
              type="button"
              onClick={() => setShowDiff(false)}
              className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
            >
              <X className="h-3 w-3" /> Fechar
            </button>
            <DiffPanel resource={selectedDiff} />
            <DriftTimeline report={currentReport} />
          </div>
        )}
      </div>

      {!showDiff && (
        <div className="grid grid-cols-2 gap-6">
          <DriftTimeline report={currentReport} />
          <div className="bg-white rounded-3xl card-shadow border border-slate-100 p-6 space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-lime" />
              <h2 className="text-xs font-bold tracking-widest text-slate-400 uppercase">Histórico de Relatórios</h2>
            </div>
            <div className="space-y-2">
              {reports.slice(0, 10).map((r, i) => {
                const active = r.resources.filter((res) => res.status === 'DETECTED').length
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setActiveReportIdx(i)}
                    className={cn(
                      'w-full flex items-center gap-3 rounded-xl p-3 text-left transition-colors',
                      i === activeReportIdx ? 'bg-brand-navy/5 border border-brand-navy/10' : 'hover:bg-slate-50 border border-transparent'
                    )}
                  >
                    <div className={cn('w-2 h-2 rounded-full shrink-0', active > 0 ? 'bg-red-400' : 'bg-emerald-400')} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-brand-navy truncate">Relatório #{reports.length - i}</p>
                      <p className="text-[10px] text-slate-400">
                        {r.resources.length} recursos · {active} ativos
                      </p>
                    </div>
                    <time className="text-[10px] text-slate-400 shrink-0">
                      {new Date(r.detectedAt).toLocaleString('pt-BR')}
                    </time>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
