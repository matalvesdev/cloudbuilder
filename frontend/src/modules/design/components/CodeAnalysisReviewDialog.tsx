import { useState } from 'react'
import {
  X, Loader2, CheckCircle, AlertCircle, Info,
  Server, Globe, Database, Box, Cpu, Network,
  ChevronDown, ChevronRight,
} from 'lucide-react'
import { analyzeCode } from '@/api/codeAnalysis'
import { useCanvasStore } from '@/store/canvasStore'
import { cn } from '@/lib/utils'
import type { CodeAnalysisResponse, InferredResource } from '@/api/types'

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  files: { fileName: string; path: string; content: string }[]
  repoUrl?: string
}

const providerIcons: Record<string, typeof Server> = {
  aws: Server,
  azure: Globe,
  gcp: Box,
}

const typeIcons: Record<string, typeof Cpu> = {
  compute: Cpu,
  database: Database,
  network: Network,
  storage: Server,
  security: AlertCircle,
  container: Box,
}

export function CodeAnalysisReviewDialog({ open, onOpenChange, files, repoUrl }: Props) {
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<CodeAnalysisResponse | null>(null)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [expanded, setExpanded] = useState<Set<number>>(new Set([0]))
  const addNode = useCanvasStore((s) => s.addNode)
  const autoLayout = useCanvasStore((s) => s.autoLayout)

  const handleAnalyze = async () => {
    setAnalyzing(true)
    setError('')
    try {
      const response = await analyzeCode({ files, repoUrl })
      setResult(response)
      // Pre-select all high-confidence resources
      setSelected(new Set(
        response.inferredResources
          .map((r, i) => r.confidence >= 0.5 ? i : -1)
          .filter(i => i >= 0)
      ))
      setExpanded(new Set([0]))
    } catch (err: any) {
      setError(err.message || 'Erro ao analisar código')
    } finally {
      setAnalyzing(false)
    }
  }

  const toggleSelected = (idx: number) => {
    const next = new Set(selected)
    if (next.has(idx)) next.delete(idx)
    else next.add(idx)
    setSelected(next)
  }

  const toggleExpanded = (idx: number) => {
    const next = new Set(expanded)
    if (next.has(idx)) next.delete(idx)
    else next.add(idx)
    setExpanded(next)
  }

  const handleApply = async () => {
    if (!result) return
    const selectedResources = result.inferredResources.filter((_, i) => selected.has(i))
    const cols = Math.max(1, Math.ceil(Math.sqrt(selectedResources.length)))

    for (let i = 0; i < selectedResources.length; i++) {
      const res = selectedResources[i]
      addNode(
        {
          id: res.resourceType,
          displayName: res.displayName,
          provider: res.provider,
          resourceType: res.resourceType,
          properties: res.suggestedProperties || {},
        },
        { x: 80 + (i % cols) * 300, y: 80 + Math.floor(i / cols) * 160 }
      )
    }

    await new Promise(r => setTimeout(r, 50))
    await autoLayout()
    onOpenChange(false)
  }

  const confidenceColor = (c: number) => {
    if (c >= 0.8) return 'text-green-600 bg-green-50 border-green-200'
    if (c >= 0.5) return 'text-amber-600 bg-amber-50 border-amber-200'
    return 'text-slate-500 bg-slate-50 border-slate-200'
  }

  const confidenceLabel = (c: number) => {
    if (c >= 0.8) return 'Alta'
    if (c >= 0.5) return 'Média'
    return 'Baixa'
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-[640px] max-h-[80vh] bg-white rounded-2xl shadow-modal flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-lime/20 flex items-center justify-center">
              <Info className="w-4 h-4 text-brand-navy" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-brand-navy">Analisar Código Fonte</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {files.length} arquivo(s) · {repoUrl ? repoUrl : 'análise local'}
              </p>
            </div>
          </div>
          <button onClick={() => onOpenChange(false)} className="text-slate-400 hover:text-brand-navy transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {!result && !analyzing && !error && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-2xl bg-slate-50 mx-auto mb-4 flex items-center justify-center">
                <Info className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-sm text-slate-500 mb-2">Analise os arquivos do projeto para detectar a stack técnica</p>
              <p className="text-xs text-slate-400 mb-6">
                O CloudBuilder vai identificar frameworks, bancos de dados e infraestrutura necessária
              </p>
              <button
                onClick={handleAnalyze}
                className="px-6 py-2.5 bg-brand-navy text-brand-lime rounded-xl text-sm font-bold hover:bg-brand-navy/90 transition-colors"
              >
                Iniciar Análise
              </button>
            </div>
          )}

          {analyzing && (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-brand-lime mx-auto mb-4" />
              <p className="text-sm text-slate-500">Analisando arquivos...</p>
              <p className="text-xs text-slate-400 mt-1">Detectando frameworks e inferindo recursos</p>
            </div>
          )}

          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700 mb-4">
              {error}
            </div>
          )}

          {result && (
            <div className="space-y-5">
              {/* Stack summary */}
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                <div className="w-10 h-10 rounded-xl bg-brand-navy flex items-center justify-center">
                  <Server className="w-5 h-5 text-brand-lime" />
                </div>
                <div>
                  <p className="text-sm font-bold text-brand-navy">{result.detectedStack || 'Stack personalizada'}</p>
                  <p className="text-xs text-slate-500">{result.stackDescription || 'Stack não identificada'}</p>
                </div>
              </div>

              {/* Frameworks */}
              {result.detectedFrameworks.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Frameworks Detectados</p>
                  <div className="flex flex-wrap gap-2">
                    {result.detectedFrameworks.map((fw) => (
                      <span key={fw} className="px-2.5 py-1 bg-brand-lime/15 text-brand-navy text-xs font-medium rounded-lg border border-brand-lime/30">
                        {fw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Inferred resources */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Recursos de Infraestrutura ({result.inferredResources.length})
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelected(new Set(result.inferredResources.map((_, i) => i)))}
                      className="text-[11px] text-brand-navy underline underline-offset-2 hover:text-brand-navy/70"
                    >
                      Selecionar todos
                    </button>
                    <button
                      onClick={() => setSelected(new Set())}
                      className="text-[11px] text-slate-400 underline underline-offset-2 hover:text-slate-600"
                    >
                      Limpar
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {result.inferredResources.map((res: InferredResource, idx: number) => {
                    const Icon = providerIcons[res.provider] || Server
                    const isSelected = selected.has(idx)
                    const isExpanded = expanded.has(idx)

                    return (
                      <div
                        key={`${res.resourceType}-${idx}`}
                        className={cn(
                          'border rounded-xl overflow-hidden transition-all',
                          isSelected ? 'border-brand-navy/20 bg-white' : 'border-slate-100 bg-slate-50/50'
                        )}
                      >
                        {/* Header row */}
                        <div className="flex items-center gap-3 px-4 py-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelected(idx)}
                            className="w-4 h-4 rounded border-slate-300 text-brand-navy focus:ring-brand-lime"
                          />
                          <Icon className="w-4 h-4 text-slate-500 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-brand-navy truncate">{res.displayName}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-mono">{res.resourceType}</span>
                            </div>
                            <p className="text-[11px] text-slate-400 truncate">{res.description}</p>
                          </div>
                          <span className={cn(
                            'px-2 py-0.5 text-[10px] font-bold rounded-full border',
                            confidenceColor(res.confidence)
                          )}>
                            {confidenceLabel(res.confidence)}
                          </span>
                          <button
                            onClick={() => toggleExpanded(idx)}
                            className="text-slate-300 hover:text-brand-navy"
                          >
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </button>
                        </div>

                        {/* Expanded details */}
                        {isExpanded && (
                          <div className="px-4 pb-3 pt-0 border-t border-slate-50">
                            {/* Suggested properties */}
                            {Object.keys(res.suggestedProperties).length > 0 && (
                              <div className="mt-2">
                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Propriedades</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {Object.entries(res.suggestedProperties).map(([k, v]) => (
                                    <span key={k} className="px-2 py-0.5 bg-slate-50 rounded text-[10px] text-slate-500 font-mono border border-slate-100">
                                      {k}: {String(v)}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Evidence */}
                            {res.evidence.length > 0 && (
                              <div className="mt-2">
                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Evidência</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {res.evidence.map((e) => (
                                    <span key={e} className="px-2 py-0.5 bg-blue-50 rounded text-[10px] text-blue-600 font-mono border border-blue-100">
                                      {e}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Provider tag */}
                            <div className="mt-2">
                              <span className="px-2 py-0.5 bg-slate-50 rounded text-[10px] text-slate-500 border border-slate-100">
                                {res.provider}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Warnings */}
              {result.warnings.length > 0 && (
                <div className="px-4 py-3 bg-amber-50 border border-amber-100 rounded-xl">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-amber-800">Avisos</p>
                      {result.warnings.map((w, i) => (
                        <p key={i} className="text-xs text-amber-700 mt-1">{w}</p>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
          <p className="text-xs text-slate-400">
            {result ? `${selected.size} de ${result.inferredResources.length} recursos selecionados` : ''}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-brand-navy transition-colors"
            >
              Cancelar
            </button>
            {result && (
              <button
                onClick={handleApply}
                disabled={selected.size === 0}
                className={cn(
                  'px-5 py-2 rounded-xl text-xs font-bold transition-colors',
                  selected.size > 0
                    ? 'bg-brand-navy text-brand-lime hover:bg-brand-navy/90'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                )}
              >
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Adicionar {selected.size} {selected.size === 1 ? 'recurso' : 'recursos'} ao Canvas
                </div>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
