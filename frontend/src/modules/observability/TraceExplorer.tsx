import { useState, useEffect } from 'react'
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Loader2,
  Search,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useSSE } from '@/hooks/useSSE'
import { observabilityApi } from '@/api/observability'
import type { TraceDTO } from '@/types/observability.types'

export function TraceExplorer() {
  const [traces, setTraces] = useState<TraceDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedTrace, setExpandedTrace] = useState<string | null>(null)
  const [onlyErrors, setOnlyErrors] = useState(false)
  const [searchService, setSearchService] = useState('')
  const { data: streamData } = useSSE<TraceDTO[]>('/observability/traces/stream', 'traces')

  useEffect(() => {
    loadTraces()
  }, [onlyErrors])

  useEffect(() => {
    if (streamData) {
      setTraces(streamData)
    }
  }, [streamData])

  const loadTraces = async () => {
    setLoading(true)
    try {
      const result = await observabilityApi.listTraces()
      setTraces(result as any[])
    } catch {
      setTraces([])
    } finally {
      setLoading(false)
    }
  }

  const filtered = traces.filter((t) =>
    !searchService || t.serviceName.toLowerCase().includes(searchService.toLowerCase())
  )

  const getStatusIcon = (isError: boolean) =>
    isError ? <AlertCircle className="h-4 w-4 text-red-500" /> : <CheckCircle2 className="h-4 w-4 text-green-500" />

  const getDurationColor = (ms: number) => {
    if (ms < 200) return 'text-green-600'
    if (ms < 500) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Activity className="h-5 w-5 text-brand-navy" />
        <h2 className="text-lg font-bold text-brand-navy font-display">Explorador de Traces</h2>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Filtrar por serviço..."
            value={searchService}
            onChange={(e) => setSearchService(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant={onlyErrors ? 'default' : 'outline'}
          size="sm"
          onClick={() => setOnlyErrors(!onlyErrors)}
          className={onlyErrors ? 'bg-red-500 text-white hover:bg-red-600' : ''}
        >
          <AlertCircle className="h-4 w-4 mr-1" />
          Erros apenas
        </Button>
        <Button variant="outline" size="sm" onClick={loadTraces}>
          <Loader2 className="h-4 w-4 mr-1" />
          Atualizar
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-brand-navy" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Activity className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum trace encontrado</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((trace) => (
            <div key={trace.traceId} className="bg-white rounded-xl border border-slate-100 card-shadow">
              <button
                onClick={() => setExpandedTrace(expandedTrace === trace.traceId ? null : trace.traceId)}
                className="w-full flex items-center gap-3 p-4 text-left"
              >
                {getStatusIcon(trace.isError)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-brand-navy">{trace.operation}</span>
                    <Badge variant="outline" className="text-[10px]">{trace.serviceName}</Badge>
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    {trace.traceId.substring(0, 12)} — {new Date(trace.startTime).toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="text-right">
                  <p className={cn('text-sm font-mono font-medium', getDurationColor(trace.durationMs))}>
                    {trace.durationMs}ms
                  </p>
                  <p className="text-xs text-slate-400">{trace.spans.length} spans</p>
                </div>
                {expandedTrace === trace.traceId
                  ? <ChevronDown className="h-4 w-4 text-slate-400" />
                  : <ChevronRight className="h-4 w-4 text-slate-400" />
                }
              </button>

              {expandedTrace === trace.traceId && (
                <div className="border-t border-slate-100 px-4 py-3 space-y-1.5">
                  {trace.spans.map((span) => (
                    <div
                      key={span.spanId}
                      className={cn(
                        'flex items-center gap-3 py-1.5 px-3 rounded-lg text-sm',
                        span.parentSpanId ? 'ml-6 bg-slate-50' : 'bg-slate-50'
                      )}
                    >
                      <span className={cn(
                        'w-1.5 h-1.5 rounded-full',
                        span.status === 'ERROR' ? 'bg-red-500' : 'bg-green-500'
                      )} />
                      <span className="flex-1 text-slate-600">{span.operation}</span>
                      <span className="text-xs text-slate-400 font-mono">{span.durationMs}ms</span>
                      <Badge variant="outline" className="text-[10px]">{span.serviceName}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
