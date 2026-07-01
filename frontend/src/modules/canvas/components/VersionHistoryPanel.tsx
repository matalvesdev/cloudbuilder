import { useState, useCallback, useMemo } from 'react'
import { Clock, RotateCcw, Trash2, FileCode, X, ChevronRight, AlertTriangle, ArrowUp, ArrowDown, Minus } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useCanvasStore } from '@/store/canvasStore'
import { cn } from '@/lib/utils'

interface VersionEntry {
  id: string
  version: number
  name: string
  nodeCount: number
  edgeCount: number
  savedAt: string
}

const STORAGE_HISTORY_KEY = 'cloudbuilder-canvas-history'

function loadHistory(): VersionEntry[] {
  try {
    const stored = localStorage.getItem(STORAGE_HISTORY_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveHistory(entries: VersionEntry[]) {
  try {
    localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(entries.slice(0, 20)))
  } catch {
    // localStorage full — silently ignore
  }
}

export function VersionHistoryPanel({ onClose }: { onClose?: () => void }) {
  const { canvasName, loadCanvas } = useCanvasStore()
  const [versions, setVersions] = useState<VersionEntry[]>(loadHistory)
  const [confirmRestore, setConfirmRestore] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  const saveCurrentVersion = useCallback(() => {
    const state = useCanvasStore.getState()
    const entry: VersionEntry = {
      id: crypto.randomUUID(),
      version: (state.canvasVersion || 1) + 1,
      name: state.canvasName || canvasName,
      nodeCount: state.nodes.length,
      edgeCount: state.edges.length,
      savedAt: new Date().toISOString(),
    }
    const updated = [entry, ...versions.filter(v => v.id !== entry.id)]
    setVersions(updated)
    saveHistory(updated)
    // Update canvas state version
    state.setCanvas({ version: entry.version })
  }, [versions, canvasName])

  const restoreVersion = useCallback((entry: VersionEntry) => {
    try {
      const key = `cloudbuilder-canvas-v${entry.version}`
      const stored = localStorage.getItem(key)
      if (!stored) {
        // Try to find from the main canvas save
        toast('Versão não encontrada no armazenamento local')
        return
      }
      const design = JSON.parse(stored)
      loadCanvas(design)
      toast(`Restaurado: v${entry.version} - ${entry.name}`)
      setConfirmRestore(null)
    } catch {
      toast('Erro ao restaurar versão')
    }
  }, [loadCanvas])

  const deleteVersion = useCallback((id: string) => {
    const updated = versions.filter(v => v.id !== id)
    setVersions(updated)
    saveHistory(updated)
  }, [versions])

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  const formatRelative = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'agora'
    if (mins < 60) return `há ${mins}min`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `há ${hours}h`
    const days = Math.floor(hours / 24)
    if (days < 30) return `há ${days}d`
    return formatDate(iso)
  }

  return (
    <div className="w-[320px] bg-white border-l border-slate-100 flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-ice-blue/50 flex items-center justify-center">
            <Clock className="w-4 h-4 text-brand-navy" />
          </div>
          <h2 className="font-bold text-sm text-brand-navy">Histórico de Versões</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-brand-navy transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Save current button */}
      <div className="px-4 py-2 border-b border-slate-100">
        <button
          onClick={saveCurrentVersion}
          className="w-full px-3 py-2 bg-brand-navy text-brand-lime text-xs font-semibold rounded-xl hover:bg-brand-navy/90 transition-all flex items-center justify-center gap-1.5 shadow-sm"
        >
          <FileCode className="w-3.5 h-3.5" />
          Salvar versão atual
        </button>
      </div>

      {/* Version list */}
      <ScrollArea className="flex-1">
        {versions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
              <Clock className="w-5 h-5 text-slate-300" />
            </div>
            <p className="text-sm text-slate-500 font-medium">Nenhuma versão salva</p>
            <p className="text-xs text-slate-400 mt-1">Salve versões do seu design para poder restaurar depois</p>
          </div>
        )}
        <div className="p-2 space-y-0.5">
          {versions.map((entry) => (
            <div key={entry.id}>
              <div
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all',
                  confirmRestore === entry.id
                    ? 'bg-amber-50 border border-amber-200'
                    : 'hover:bg-slate-50 border border-transparent'
                )}
              >
                <div className="w-8 h-8 rounded-lg bg-ice-blue/30 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-brand-navy">v{entry.version}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-brand-navy truncate">{entry.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                    <span>{entry.nodeCount} nós</span>
                    <span>·</span>
                    <span>{entry.edgeCount} conexões</span>
                    <span>·</span>
                    <span>{formatRelative(entry.savedAt)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setConfirmRestore(confirmRestore === entry.id ? null : entry.id)
                    }}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:bg-amber-100 hover:text-amber-600 transition-colors"
                    title="Restaurar"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteVersion(entry.id)
                    }}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setExpanded(expanded === entry.id ? null : entry.id)
                    }}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors"
                  >
                    <ChevronRight className={cn('w-3.5 h-3.5 transition-transform', expanded === entry.id && 'rotate-90')} />
                  </button>
                </div>
              </div>

              {/* Confirm restore */}
              {confirmRestore === entry.id && (
                <div className="mx-3 mb-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-amber-800 font-medium mb-1">Restaurar v{entry.version}?</p>
                      <p className="text-amber-600 mb-2">O design atual será substituído.</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => restoreVersion(entry)}
                          className="px-3 py-1 bg-amber-600 text-white text-xs font-medium rounded-lg hover:bg-amber-700 transition-colors"
                        >
                          Restaurar
                        </button>
                        <button
                          onClick={() => setConfirmRestore(null)}
                          className="px-3 py-1 bg-white border border-slate-200 text-slate-600 text-xs font-medium rounded-lg hover:bg-slate-50 transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Expanded details */}
              {expanded === entry.id && (
                <div className="mx-3 mb-2 px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-500 space-y-1.5">
                  <div className="flex justify-between">
                    <span>ID:</span>
                    <span className="font-mono text-[10px]">{entry.id.slice(0, 8)}…</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Salvo em:</span>
                    <span>{formatDate(entry.savedAt)}</span>
                  </div>
                  <div className="h-px bg-slate-200 my-1" />
                  <div className="flex justify-between">
                    <span>Recursos:</span>
                    <span className="font-mono font-semibold">{entry.nodeCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Conexões:</span>
                    <span className="font-mono font-semibold">{entry.edgeCount}</span>
                  </div>
                  {/* Diff from previous version */}
                  {(() => {
                    const currentIdx = versions.findIndex(v => v.id === entry.id)
                    const prevVersion = currentIdx < versions.length - 1 ? versions[currentIdx + 1] : null
                    if (!prevVersion) return null
                    const nodeDiff = entry.nodeCount - prevVersion.nodeCount
                    const edgeDiff = entry.edgeCount - prevVersion.edgeCount
                    return (
                      <>
                        <div className="h-px bg-slate-200 my-1" />
                        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Diferença vs anterior</div>
                        <div className="flex justify-between items-center">
                          <span>Recursos</span>
                          <span className={cn('font-mono flex items-center gap-1', nodeDiff > 0 ? 'text-green-600' : nodeDiff < 0 ? 'text-red-600' : 'text-slate-400')}>
                            {nodeDiff > 0 ? <ArrowUp className="w-3 h-3" /> : nodeDiff < 0 ? <ArrowDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                            {nodeDiff > 0 ? `+${nodeDiff}` : nodeDiff}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Conexões</span>
                          <span className={cn('font-mono flex items-center gap-1', edgeDiff > 0 ? 'text-green-600' : edgeDiff < 0 ? 'text-red-600' : 'text-slate-400')}>
                            {edgeDiff > 0 ? <ArrowUp className="w-3 h-3" /> : edgeDiff < 0 ? <ArrowDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                            {edgeDiff > 0 ? `+${edgeDiff}` : edgeDiff}
                          </span>
                        </div>
                      </>
                    )
                  })()}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

// Toast helper using a custom event for the parent Toaster
function toast(msg: string) {
  // Dispatch a custom event that react-hot-toast can pick up
  // Fallback: create a temporary toast element
  const el = document.createElement('div')
  el.className = 'fixed bottom-4 right-4 z-[9999] px-4 py-2 bg-brand-navy text-white text-xs font-medium rounded-xl shadow-lg'
  Object.assign(el.style, {
    animation: 'fadeIn 0.2s ease-out',
    opacity: '1',
    transition: 'opacity 0.3s',
  })
  el.textContent = msg
  document.body.appendChild(el)
  const style = document.createElement('style')
  style.textContent = `@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`
  document.head.appendChild(style)
  setTimeout(() => {
    el.style.opacity = '0'
    setTimeout(() => { el.remove(); style.remove() }, 300)
  }, 2500)
}
