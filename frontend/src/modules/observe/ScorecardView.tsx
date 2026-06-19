import { useEffect, useState, useCallback } from 'react'
import { api } from '@/api/client'
import { Loader2, AlertTriangle, TrendingUp, Shield, DollarSign, Layers, Eye, FileText, Lightbulb, RefreshCw, Award } from 'lucide-react'
import { cn } from '@/lib/utils'

/* ─── Types ────────────────────────────────────────────────────────── */

interface ScoreItem {
  criterion: string
  score: number
  maxScore: number
  suggestions: string[]
}

interface ScorecardResponse {
  canvasId: string
  canvasName: string
  overallScore: number
  level: string
  scores: ScoreItem[]
}

/* ─── Criterion Icons ──────────────────────────────────────────────── */

const criterionIcons: Record<string, typeof TrendingUp> = {
  'Alta Disponibilidade': TrendingUp,
  'Segurança': Shield,
  'Otimização de Custos': DollarSign,
  'Escalabilidade': Layers,
  'Observabilidade': Eye,
  'Documentação': FileText,
}

const levelConfig: Record<string, { label: string; color: string; bg: string }> = {
  platinum: { label: 'Platina', color: 'text-slate-100', bg: 'bg-gradient-to-r from-slate-600 to-slate-400' },
  gold: { label: 'Ouro', color: 'text-yellow-700', bg: 'bg-gradient-to-r from-yellow-500 to-yellow-400' },
  silver: { label: 'Prata', color: 'text-slate-500', bg: 'bg-gradient-to-r from-slate-400 to-slate-300' },
  bronze: { label: 'Bronze', color: 'text-amber-700', bg: 'bg-gradient-to-r from-amber-600 to-amber-500' },
  initial: { label: 'Inicial', color: 'text-slate-400', bg: 'bg-gradient-to-r from-slate-300 to-slate-200' },
}

/* ─── Main Component ───────────────────────────────────────────────── */

export function ScorecardView() {
  const [data, setData] = useState<ScorecardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [canvasId, setCanvasId] = useState('')
  const [canvasList, setCanvasList] = useState<{ id: string; name: string }[]>([])
  const [showPicker, setShowPicker] = useState(false)

  const fetchScorecard = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get<ScorecardResponse>(`/scorecards/${id}`)
      setData(res)
    } catch {
      setError('API de scorecards indisponível')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch canvas list
  useEffect(() => {
    api.get<{ id: string; name: string }[]>('/canvases?size=50')
      .then((res: any) => {
        const list = res?.content || []
        setCanvasList(list.map((c: any) => ({ id: c.id, name: c.name })))
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!canvasId && canvasList.length > 0) {
      setCanvasId(canvasList[0].id)
    }
  }, [canvasList, canvasId])

  useEffect(() => {
    if (canvasId) fetchScorecard(canvasId)
  }, [canvasId, fetchScorecard])

  const levelInfo = data ? levelConfig[data.level] || levelConfig.initial : null
  const scoreColor = data
    ? data.overallScore >= 75 ? 'text-green-600'
      : data.overallScore >= 55 ? 'text-yellow-600'
      : data.overallScore >= 35 ? 'text-orange-600'
      : 'text-slate-500'
    : ''

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-full py-16">
        <Loader2 className="w-6 h-6 animate-spin text-brand-navy" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <button
            onClick={() => setShowPicker(!showPicker)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-brand-navy hover:bg-slate-50 transition-all"
          >
            <Award className="w-4 h-4 text-slate-400" />
            {data?.canvasName || 'Selecionar Canvas'}
          </button>
          {showPicker && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowPicker(false)} />
              <div className="absolute left-0 top-full mt-1 w-56 bg-white rounded-xl border border-slate-200 shadow-lg z-50 py-1 max-h-48 overflow-y-auto">
                {canvasList.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => { setCanvasId(c.id); setShowPicker(false) }}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 text-xs transition-all text-left',
                      c.id === canvasId ? 'bg-brand-navy/5 text-brand-navy font-bold' : 'text-slate-600 hover:bg-slate-50'
                    )}
                  >
                    {c.name}
                  </button>
                ))}
                {canvasList.length === 0 && (
                  <p className="px-3 py-2 text-xs text-slate-400">Nenhum canvas encontrado</p>
                )}
              </div>
            </>
          )}
        </div>

        {levelInfo && (
          <span className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white', levelInfo.bg)}>
            <Award className="w-3.5 h-3.5" />
            {levelInfo.label}
          </span>
        )}

        <button
          onClick={() => canvasId && fetchScorecard(canvasId)}
          className="ml-auto inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-brand-navy hover:bg-slate-100 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Atualizar
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-700">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {data && (
        <>
          {/* Overall Score */}
          <div className="bg-white rounded-3xl card-shadow border border-slate-100 p-8 text-center">
            <div className="text-6xl font-bold font-display mb-2">
              <span className={scoreColor}>{data.overallScore}</span>
              <span className="text-2xl text-slate-300">/{data.scores.length * 100}</span>
            </div>
            <p className="text-sm text-slate-400">Pontuação Geral de Maturidade</p>
          </div>

          {/* Criteria Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.scores.map((item) => {
              const Icon = criterionIcons[item.criterion] || TrendingUp
              const pct = item.maxScore > 0 ? (item.score / item.maxScore) * 100 : 0
              const barColor = pct >= 75 ? 'bg-green-500'
                : pct >= 55 ? 'bg-yellow-500'
                : pct >= 35 ? 'bg-orange-500'
                : 'bg-slate-300'

              return (
                <div key={item.criterion} className="bg-white rounded-2xl card-shadow border border-slate-100 p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl p-2 bg-ice-blue">
                      <Icon className="w-4 h-4 text-brand-navy" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-brand-navy">{item.criterion}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className={cn('h-full rounded-full transition-all duration-700', barColor)} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs font-bold text-slate-500">{item.score}/{item.maxScore}</span>
                      </div>
                    </div>
                  </div>

                  {/* Suggestions */}
                  {item.suggestions.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      {item.suggestions.map((s, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-slate-500">
                          <Lightbulb className="w-3 h-3 text-amber-500 mt-0.5 shrink-0" />
                          <span>{s}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {item.suggestions.length === 0 && (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      Nenhuma melhoria necessária
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
