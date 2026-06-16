import { useState, useCallback, useRef } from 'react'
import {
  Upload, FileText, AlertTriangle, CheckCircle2, X, Cloud,
  ArrowRight, Loader2, FileCode, FolderArchive, File,
} from 'lucide-react'
import { importUpload } from '@/api/import'
import { useCanvasStore } from '@/store/canvasStore'
import type { ParsedResource, ParsedConnection } from '@/api/types'
import { cn } from '@/lib/utils'

interface MultiFileImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MultiFileImportDialog({ open, onOpenChange }: MultiFileImportDialogProps) {
  const [files, setFiles] = useState<{ name: string; size: number }[]>([])
  const [parsing, setParsing] = useState(false)
  const [result, setResult] = useState<{ resources: ParsedResource[]; connections: ParsedConnection[]; warnings: string[] } | null>(null)
  const [error, setError] = useState('')
  const [selectedResources, setSelectedResources] = useState<Set<string>>(new Set())
  const fileInputRef = useRef<HTMLInputElement>(null)
  const addNode = useCanvasStore((s) => s.addNode)
  const addEdgeWithType = useCanvasStore((s) => s.addEdgeWithType)
  const autoLayout = useCanvasStore((s) => s.autoLayout)

  const reset = useCallback(() => {
    setFiles([])
    setResult(null)
    setError('')
    setSelectedResources(new Set())
    setParsing(false)
  }, [])

  const handleClose = useCallback(() => {
    reset()
    onOpenChange(false)
  }, [onOpenChange, reset])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files
    if (!selected || selected.length === 0) return

    const fileList: { name: string; size: number }[] = []
    for (let i = 0; i < selected.length; i++) {
      fileList.push({ name: selected[i].name, size: selected[i].size })
    }
    setFiles(prev => {
      const existing = new Set(prev.map(f => f.name))
      const unique = fileList.filter(f => !existing.has(f.name))
      return [...prev, ...unique]
    })
    setResult(null)
    setError('')
    e.target.value = ''
  }, [])

  const removeFile = useCallback((name: string) => {
    setFiles(prev => prev.filter(f => f.name !== name))
    setResult(null)
  }, [])

  const handleParse = useCallback(async () => {
    if (files.length === 0) {
      setError('Selecione pelo menos um arquivo.')
      return
    }
    setParsing(true)
    setError('')
    try {
      // Re-read files from the input (they're already tracked by name)
      const fileInput = fileInputRef.current
      if (!fileInput?.files) {
        setError('Arquivos não disponíveis. Tente selecionar novamente.')
        setParsing(false)
        return
      }
      const response = await importUpload(fileInput.files as unknown as File[])
      setResult(response)
      setSelectedResources(new Set(response.resources.map(r => `${r.resourceType}.${r.name}`)))
    } catch (err: any) {
      setError(err?.message || 'Erro ao processar os arquivos.')
    } finally {
      setParsing(false)
    }
  }, [files])

  const toggleResource = useCallback((key: string) => {
    setSelectedResources(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  const handleImport = useCallback(async () => {
    if (!result) return
    const { resources, connections } = result

    const nameToId = new Map<string, string>()
    const selectedRes = resources.filter(r => selectedResources.has(`${r.resourceType}.${r.name}`))
    const cols = Math.max(1, Math.ceil(Math.sqrt(selectedRes.length)))

    for (let i = 0; i < selectedRes.length; i++) {
      const res = selectedRes[i]
      const resourceKey = `${res.resourceType}.${res.name}`

      addNode(
        { id: res.resourceType, displayName: res.displayType !== res.resourceType ? `${res.displayType}: ${res.name}` : res.name, provider: res.provider, resourceType: res.resourceType },
        { x: 80 + (i % cols) * 300, y: 80 + Math.floor(i / cols) * 180 }
      )

      const store = useCanvasStore.getState()
      const newNode = store.nodes[store.nodes.length - 1]
      if (newNode) nameToId.set(resourceKey, newNode.id)
    }

    for (const conn of connections) {
      const sourceId = nameToId.get(conn.sourceResourceName)
      const targetId = nameToId.get(conn.targetResourceName)
      if (sourceId && targetId) {
        addEdgeWithType(sourceId, targetId, 'default')
      }
    }

    await new Promise(r => setTimeout(r, 50))
    await autoLayout()
    handleClose()
  }, [result, selectedResources, addNode, addEdgeWithType, autoLayout, handleClose])

  if (!open) return null

  const resourceCount = result?.resources.length ?? 0
  const selectedCount = selectedResources.size
  const connectionCount = result?.connections.length ?? 0

  const groupedResources = result
    ? groupBy(result.resources, (r) => r.provider)
    : new Map<string, ParsedResource[]>()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={handleClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-ice-blue/50 flex items-center justify-center">
              <FolderArchive className="w-5 h-5 text-brand-navy" />
            </div>
            <div>
              <h2 className="text-base font-bold text-brand-navy font-display">Importar Projeto</h2>
              <p className="text-xs text-slate-400">Importe múltiplos arquivos .tf, .tfstate ou um .zip com o projeto todo</p>
            </div>
          </div>
          <button onClick={handleClose} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {!result && (
            <>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center cursor-pointer hover:border-brand-navy/40 hover:bg-slate-50/50 transition-all"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".tf,.tf.json,.hcl,.tfstate,.tfstate.json,.json,.zip,.yml,.yaml"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <div className="w-12 h-12 rounded-2xl bg-ice-blue/50 flex items-center justify-center mx-auto mb-3">
                  <Upload className="w-6 h-6 text-brand-navy/60" />
                </div>
                <p className="text-sm font-medium text-brand-navy mb-1">
                  Clique para selecionar arquivos ou .zip
                </p>
                <p className="text-xs text-slate-400">
                  Suporta .tf, .tfstate, .zip (projeto completo)
                </p>
              </div>

              {files.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      {files.length} arquivo{files.length !== 1 ? 's' : ''} selecionado{files.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {files.map((f) => (
                      <div key={f.name} className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-100 rounded-xl">
                        <File className="w-4 h-4 text-slate-400" />
                        <span className="flex-1 text-xs font-medium text-slate-700 truncate">{f.name}</span>
                        <span className="text-[10px] text-slate-400">{(f.size / 1024).toFixed(1)} KB</span>
                        <button onClick={() => removeFile(f.name)} className="text-slate-300 hover:text-red-500 transition-colors">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {error && (
            <div className="flex items-start gap-2 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {result?.warnings && result.warnings.length > 0 && (
            <div className="space-y-1">
              {result.warnings.map((w, i) => (
                <div key={i} className="flex items-start gap-2 px-4 py-2 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>{w}</span>
                </div>
              ))}
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="px-4 py-3 bg-ice-blue/30 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-400 font-medium">Recursos</p>
                  <p className="text-xl font-bold text-brand-navy">{resourceCount}</p>
                </div>
                <div className="px-4 py-3 bg-ice-blue/30 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-400 font-medium">Selecionados</p>
                  <p className="text-xl font-bold text-brand-navy">{selectedCount}/{resourceCount}</p>
                </div>
                <div className="px-4 py-3 bg-ice-blue/30 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-400 font-medium">Conexões</p>
                  <p className="text-xl font-bold text-brand-navy">{connectionCount}</p>
                </div>
              </div>

              {Array.from(groupedResources.entries()).map(([provider, providerResources]) => (
                <div key={provider} className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{provider}</span>
                    <span className="text-[10px] text-slate-400">{providerResources.length} recursos</span>
                  </div>
                  <div className="space-y-1">
                    {providerResources.map((res) => {
                      const key = `${res.resourceType}.${res.name}`
                      const isSelected = selectedResources.has(key)
                      return (
                        <div
                          key={key}
                          onClick={() => toggleResource(key)}
                          className={cn(
                            'flex items-center gap-3 px-3 py-2 rounded-xl border cursor-pointer transition-all',
                            isSelected ? 'border-brand-navy/20 bg-brand-navy/5' : 'border-slate-100 bg-white hover:border-slate-200'
                          )}
                        >
                          <div className={cn(
                            'w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all',
                            isSelected ? 'border-brand-navy bg-brand-navy' : 'border-slate-300'
                          )}>
                            {isSelected && <CheckCircle2 className="w-3 h-3 text-brand-lime" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-brand-navy truncate">{res.name}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-mono">{res.resourceType}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}

              {connectionCount > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Conexões</span>
                  </div>
                  {result.connections.map((conn, i) => (
                    <div key={i} className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-xl border text-xs',
                      selectedResources.has(conn.sourceResourceName) && selectedResources.has(conn.targetResourceName)
                        ? 'border-slate-100 bg-white' : 'border-slate-100 bg-slate-50 text-slate-400'
                    )}>
                      <span className="font-mono text-xs truncate">{conn.sourceResourceName}</span>
                      <ArrowRight className="w-3 h-3 shrink-0" />
                      <span className="font-mono text-xs truncate">{conn.targetResourceName}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Cloud className="w-3.5 h-3.5" />
            {result ? `${selectedCount} recursos serão importados` : `${files.length} arquivo${files.length !== 1 ? 's' : ''} selecionado${files.length !== 1 ? 's' : ''}`}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleClose} className="px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">Cancelar</button>
            {!result ? (
              <button
                onClick={handleParse}
                disabled={parsing || files.length === 0}
                className={cn(
                  'px-4 py-2 text-sm font-semibold rounded-xl transition-all flex items-center gap-2',
                  parsing || files.length === 0 ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-brand-navy text-brand-lime hover:bg-brand-navy/90 shadow-sm'
                )}
              >
                {parsing ? <><Loader2 className="w-4 h-4 animate-spin" /> Analisando...</> : <><FileCode className="w-4 h-4" /> Visualizar</>}
              </button>
            ) : (
              <button
                onClick={handleImport}
                disabled={selectedCount === 0}
                className={cn(
                  'px-4 py-2 text-sm font-semibold rounded-xl transition-all flex items-center gap-2',
                  selectedCount === 0 ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-brand-navy text-brand-lime hover:bg-brand-navy/90 shadow-sm'
                )}
              >
                <FolderArchive className="w-4 h-4" />
                Importar {selectedCount} recurso{selectedCount !== 1 ? 's' : ''}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function groupBy<T>(items: T[], keyFn: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>()
  for (const item of items) {
    const key = keyFn(item)
    const group = map.get(key) || []
    group.push(item)
    map.set(key, group)
  }
  return map
}
