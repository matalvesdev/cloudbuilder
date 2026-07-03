import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import {
  Save,
  CheckCircle,
  Download,
  Upload,
  Undo2,
  Redo2,
  Palette,
  Sparkles,
  FileCode,
  MessageSquare,
  LayoutGrid,
  X,
  Copy,
  BadgeCheck,
  ImageDown,
  AlignStartVertical,
  AlignEndVertical,
  AlignCenterVertical,
  AlignStartHorizontal,
  AlignEndHorizontal,
  AlignCenterHorizontal,
  Search,
  Clock,
  Database,
  FolderArchive,
  Github,
  Activity,
  DollarSign,
  ChevronDown,
  Eye,
  Wrench,
  FileJson,
  PanelRightOpen,
} from 'lucide-react'

import { ReactFlowProvider } from '@xyflow/react'
import { showSuccess, showError, showInfo, showWarning } from '@/lib/toast'
import { CanvasView } from './components/CanvasView'
import { ComponentPalette } from './components/ComponentPalette'
import { PropertiesPanel } from './components/PropertiesPanel'
import { AIChatPanel } from './components/AIChatPanel'
import { CodePreviewPanel } from './components/CodePreviewPanel'
import { CanvasDocPanel } from './components/CanvasDocPanel'
import { CanvasLogsPanel } from './components/CanvasLogsPanel'
import { CanvasEventsPanel } from './components/CanvasEventsPanel'
import { CanvasConsolePanel } from './components/CanvasConsolePanel'
import { CollaborationPanel } from './components/CollaborationPanel'
import { ObservabilityPanel } from './components/ObservabilityPanel'
import { EmptyCanvasState } from './components/EmptyCanvasState'
import { StateFileImportDialog } from './components/StateFileImportDialog'
import { MultiFileImportDialog } from './components/MultiFileImportDialog'
import { GitHubConnectDialog } from './components/GitHubConnectDialog'
import { RepoBrowser } from './components/RepoBrowser'
import { MetricsOverlay } from './components/MetricsOverlay'
import { CanvasCommandPalette } from './components/CanvasCommandPalette'
import { ConfirmDialog } from './components/ConfirmDialog'
import { TerraformImportDialog } from './components/TerraformImportDialog'
import { VersionHistoryPanel } from './components/versions/VersionHistoryPanel'
import { CostEstimationBar, getResourcePrice } from './components/CostEstimationBar'
import { Button } from '@/components/ui/button'
import { Toggle } from '@/components/ui/toggle'
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
// import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'
// Resizable removido — layout flex puro resolve sobreposição do react-resizable-panels
import { useCanvasStore } from '@/store/canvasStore'
import { useCollaborationStore } from '@/store/collaborationStore'
import { useAuthStore } from '@/store/authStore'
import { useUiStore } from '@/store/uiStore'
import { downloadCanvasJson, importCanvasFromFile } from './services'
import { importTerraform } from '@/api/import'
import { generateDocFromCanvas } from '@/api/docs'
import { validateLocal, getNodeValidationStatus } from './validation/validationService'
import { ValidationPanel } from './validation/ValidationPanel'
import type { Node } from '@xyflow/react'
import type { ValidationIssue } from './validation/validationService'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'cloudbuilder-canvas'

export function DesignModule() {
  const { nodes, edges, undo, redo, undoStack, redoStack, clearCanvas, loadCanvas, loadFromBackend, saveToBackend } = useCanvasStore()
  const authUser = useAuthStore((s) => s.user)
  const teamMembers = useCollaborationStore((s) => s.teamMembers)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showPalette, setShowPalette] = useState(true)
  const [showProperties, setShowProperties] = useState(true)
  const [showAIChat, setShowAIChat] = useState(false)
  const [showCollaboration, setShowCollaboration] = useState(false)
  const [showCodePreview, setShowCodePreview] = useState(false)
  const [showCanvasDocs, setShowCanvasDocs] = useState(false)
  const [showCanvasLogs, setShowCanvasLogs] = useState(false)
  const [showCanvasEvents, setShowCanvasEvents] = useState(false)
  const [showCanvasConsole, setShowCanvasConsole] = useState(false)
  const [showValidation, setShowValidation] = useState(false)
  const showVersionHistory = useUiStore((s) => s.showVersionPanel)
  const toggleVersionHistory = useUiStore((s) => s.toggleVersionPanel)
  const [snapEnabled, setSnapEnabled] = useState(true)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [confirmNewOpen, setConfirmNewOpen] = useState(false)
  const [showTerraformImport, setShowTerraformImport] = useState(false)
  const [showStateImport, setShowStateImport] = useState(false)
  const [showMultiImport, setShowMultiImport] = useState(false)
  const [showGitHubConnect, setShowGitHubConnect] = useState(false)
  const [githubToken, setGithubToken] = useState<string | null>(null)
  const [showRepoBrowser, setShowRepoBrowser] = useState(false)
  const [showObservability, setShowObservability] = useState(false)
  const [showCostEstimation, setShowCostEstimation] = useState(false)
  const [showMetrics, setShowMetrics] = useState(false)

  // ── Shift-left cost: live total from canvas nodes ──────────
  const totalEstimatedCost = useMemo(() => {
    return nodes.reduce((sum, n) => sum + getResourcePrice(n.data?.resourceType || ''), 0)
  }, [nodes])

  const BUDGET_THRESHOLD = 500 // USD/mo — configurable
  const isOverBudget = totalEstimatedCost > BUDGET_THRESHOLD
  const [budgetDismissed, setBudgetDismissed] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const design = JSON.parse(stored)
        loadCanvas(design)
      }
    } catch {
      // ignore corrupt data
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Debounced autosave: save to localStorage 2s after last change ──
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (nodes.length === 0 && edges.length === 0) return
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current)
    autosaveTimerRef.current = setTimeout(() => {
      const state = useCanvasStore.getState()
      const design = {
        id: state.canvasId || crypto.randomUUID(),
        name: state.canvasName,
        version: state.canvasVersion || 1,
        nodes: state.nodes,
        edges: state.edges,
        savedAt: new Date().toISOString(),
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(design))
    }, 2000)
    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current)
    }
    }, [nodes, edges])

  const selectedCommentNodeId = useCollaborationStore((s) => s.selectedCommentNodeId)
  useEffect(() => {
    if (selectedCommentNodeId) {
      setShowCollaboration(true)
    }
  }, [selectedCommentNodeId])

  const handleNodeSelect = useCallback((node: Node | null) => {
    setSelectedNode(node)
  }, [])

  const handleSave = useCallback(() => {
    const state = useCanvasStore.getState()
    const newVersion = (state.canvasVersion || 1) + 1
    const design = {
      id: state.canvasId || crypto.randomUUID(),
      name: state.canvasName,
      version: newVersion,
      nodes: state.nodes,
      edges: state.edges,
      savedAt: new Date().toISOString(),
    }
    // Save current design (localStorage backup)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(design))
    // Also save versioned snapshot for version history
    localStorage.setItem(`cloudbuilder-canvas-v${newVersion}`, JSON.stringify(design))
    // Update version history index
    try {
      const historyKey = 'cloudbuilder-canvas-history'
      const stored = localStorage.getItem(historyKey)
      const history = stored ? JSON.parse(stored) : []
      const entry = {
        id: crypto.randomUUID(),
        version: newVersion,
        name: state.canvasName || 'Design sem título',
        nodeCount: state.nodes.length,
        edgeCount: state.edges.length,
        savedAt: new Date().toISOString(),
      }
      const updated = [entry, ...history.filter((h: any) => h.version !== newVersion)].slice(0, 20)
      localStorage.setItem(historyKey, JSON.stringify(updated))
    } catch { /* localStorage might be full */ }
    state.setCanvas(design)

    // Auto-generate documentation from canvas design (ADR-009)
    const canvasId = state.canvasId || design.id
    const canvasName = state.canvasName || 'Design sem título'
    generateDocFromCanvas(canvasId, canvasName, `Design com ${state.nodes.length} recursos e ${state.edges.length} conexões`)
      .then(() => { /* silent */ })
      .catch(() => { /* silent */ })

    // Save to backend API (persistent storage)
    const tenantId = authUser?.tenantId
    const userId = authUser?.id
    if (tenantId && userId) {
      saveToBackend(tenantId, userId)
        .then((id) => {
          showSuccess('Design salvo no servidor!')
          // Reload from backend to get fresh IDs
          if (id) loadFromBackend(id).catch(() => {})
        })
        .catch((err) => {
          console.error('Falha ao salvar no servidor:', err)
          showWarning('Design salvo localmente, mas falha ao salvar no servidor')
        })
    } else {
      showSuccess('Design salvo localmente')
    }
  }, [authUser, saveToBackend, loadFromBackend])

  const handleExport = useCallback(() => {
    downloadCanvasJson()
    showSuccess('Design exportado!')
  }, [])

  const handleExportImage = useCallback(async () => {
    const el = document.querySelector('.react-flow') as HTMLElement | null
    if (!el) return
    try {
      // Native DOM-to-image using foreignObject SVG (no html-to-image dep)
      const rect = el.getBoundingClientRect()
      const clone = el.cloneNode(true) as HTMLElement
      // Remove minimap and controls from clone
      clone.querySelectorAll('.react-flow__minimap, .react-flow__controls').forEach(n => n.remove())
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${rect.width}" height="${rect.height}">
        <foreignObject width="100%" height="100%">
          <div xmlns="http://www.w3.org/1999/xhtml" style="width:${rect.width}px;height:${rect.height}px;overflow:hidden;background:#f8fafc">${clone.outerHTML}</div>
        </foreignObject>
      </svg>`
      const canvas = document.createElement('canvas')
      canvas.width = rect.width * 2
      canvas.height = rect.height * 2
      const ctx = canvas.getContext('2d')!
      ctx.scale(2, 2)
      const img = new Image()
      const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      await new Promise<void>((resolve, reject) => {
        img.onload = () => { ctx.drawImage(img, 0, 0); URL.revokeObjectURL(url); resolve() }
        img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('SVG render failed')) }
        img.src = url
      })
      const link = document.createElement('a')
      link.download = `cloudbuilder-canvas-${Date.now()}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
      showSuccess('Imagem exportada!')
    } catch (err) {
      console.error('Falha ao exportar imagem:', err)
      showError('Falha ao exportar imagem')
    }
  }, [])

  const handleImport = useCallback(() => fileInputRef.current?.click(), [])
  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const isTerraform = file.name.endsWith('.tf') || file.name.endsWith('.tf.json')

    try {
      if (isTerraform) {
        // Import via Terraform API
        const content = await file.text()
        const result = await importTerraform(content)
        const { resources, connections } = result

        const nameToId = new Map<string, string>()
        const cols = Math.max(1, Math.ceil(Math.sqrt(resources.length)))

        // Add nodes in a grid layout
        for (let i = 0; i < resources.length; i++) {
          const res = resources[i]
          const displayName = res.displayType !== res.resourceType
            ? `${res.displayType}: ${res.name}`
            : res.name

          const col = i % cols
          const row = Math.floor(i / cols)
          const x = 80 + col * 300
          const y = 80 + row * 180

          useCanvasStore.getState().addNode(
            { id: res.resourceType, displayName, provider: res.provider, resourceType: res.resourceType },
            { x, y }
          )

          const nodes = useCanvasStore.getState().nodes
          const newNode = nodes[nodes.length - 1]
          if (newNode) {
            nameToId.set(`${res.resourceType}.${res.name}`, newNode.id)
          }
        }

        // Connect nodes that reference each other
        for (const conn of connections) {
          const sourceId = nameToId.get(conn.sourceResourceName)
          const targetId = nameToId.get(conn.targetResourceName)
          if (sourceId && targetId) {
            useCanvasStore.getState().addEdgeWithType(sourceId, targetId, 'default')
          }
        }

        // Auto-layout after a tick to let ReactFlow render nodes first
        await new Promise(r => setTimeout(r, 50))
        await useCanvasStore.getState().autoLayout()
        showSuccess(`${resources.length} recursos importados com sucesso!`)
      } else {
        // Canvas export JSON (.cloudbuilder.json ou .json)
        await importCanvasFromFile(file)
        showSuccess('Design importado com sucesso!')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao importar'
      console.error('Falha ao importar:', err)
      showError(message)
    }
    e.target.value = ''
  }, [])

  const handleNew = useCallback(() => {
    if (nodes.length > 0) {
      setConfirmNewOpen(true)
    } else {
      clearCanvas()
    }
  }, [nodes.length, clearCanvas])

  const confirmClear = useCallback(() => {
    clearCanvas()
    showSuccess('Novo design criado!')
  }, [clearCanvas])

  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([])

  const handleValidate = useCallback(() => {
    const { nodes, edges, setNodesValidationStatus } = useCanvasStore.getState()
    const issues = validateLocal(nodes, edges)
    setValidationIssues(issues)
    const statusMap: Record<string, 'VALID' | 'INVALID' | 'WARNING' | 'PENDING'> = {}
    for (const node of nodes) {
      statusMap[node.id] = getNodeValidationStatus(issues, node.id)
    }
    setNodesValidationStatus(statusMap)
    const errorCount = issues.filter(i => i.severity === 'ERROR').length
    const warningCount = issues.filter(i => i.severity === 'WARNING').length
    if (issues.length === 0) {
      showSuccess('Design válido!')
    } else if (errorCount > 0) {
      showError(`${errorCount} erro(s) encontrado(s)`)
    } else if (warningCount > 0) {
      showWarning(`${warningCount} aviso(s) encontrado(s)`)
    }
    if (issues.length > 0) setShowValidation(true)
  }, [])

  const {
    alignNodes,
    distributeNodes,
    autoLayout,
    duplicateSelected,
  } = useCanvasStore()

  const selectedCount = nodes.filter(n => n.selected).length

  const rightPanelContent = showAIChat
    ? <AIChatPanel onClose={() => setShowAIChat(false)} />
    : showCollaboration
    ? <CollaborationPanel onClose={() => setShowCollaboration(false)} />
    : showVersionHistory
    ? <VersionHistoryPanel />
    : showRepoBrowser && githubToken
    ? <RepoBrowser token={githubToken} onClose={() => setShowRepoBrowser(false)} />
    : showObservability
    ? <ObservabilityPanel onClose={() => setShowObservability(false)} />
    : showCostEstimation
    ? <CostEstimationBar onClose={() => setShowCostEstimation(false)} />
    : showProperties
    ? <PropertiesPanel node={selectedNode} onClose={() => setShowProperties(false)} />
    : null

  const tbBtn = 'w-[30px] h-[30px] flex items-center justify-center rounded-full text-slate-400 hover:bg-ice-blue hover:text-brand-navy transition-all'
  const tbDivider = 'w-px h-[14px] bg-slate-200 mx-1'

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      <input ref={fileInputRef} type="file" accept=".cloudbuilder.json,.json,.tf,.tf.json" className="hidden" onChange={handleFileChange} />

      <CanvasCommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
        onNewDesign={handleNew}
        onSave={handleSave}
        onToggleSnap={() => setSnapEnabled(prev => !prev)}
      />

      <ConfirmDialog
        open={confirmNewOpen}
        onOpenChange={setConfirmNewOpen}
        title="Novo design"
        description="Tem certeza que deseja criar um novo design? O design atual será perdido."
        confirmLabel="Criar novo"
        cancelLabel="Cancelar"
        variant="destructive"
        onConfirm={confirmClear}
      />

      <TerraformImportDialog
        open={showTerraformImport}
        onOpenChange={setShowTerraformImport}
      />

      <StateFileImportDialog
        open={showStateImport}
        onOpenChange={setShowStateImport}
      />

      <MultiFileImportDialog
        open={showMultiImport}
        onOpenChange={setShowMultiImport}
      />

      <GitHubConnectDialog
        open={showGitHubConnect}
        onOpenChange={setShowGitHubConnect}
        onConnected={(token) => {
          setGithubToken(token)
          setShowRepoBrowser(true)
        }}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar da paleta — largura fixa 240px */}
        {showPalette && (
          <div className="w-[240px] shrink-0 bg-white border-r border-slate-200 overflow-y-auto">
            <ComponentPalette variant="sidebar" />
          </div>
        )}

        {/* Canvas — ocupa espaço restante */}
        <div className="flex-1 overflow-hidden relative">
            <ReactFlowProvider>
              <CanvasView
                onNodeSelect={handleNodeSelect}
                snapEnabled={snapEnabled}
                onCommandPalette={() => setCommandPaletteOpen(true)}
              />
            </ReactFlowProvider>

          {/* Budget warning banner */}
          {isOverBudget && !budgetDismissed && (
            <div className="absolute top-[60px] left-1/2 -translate-x-1/2 z-10 max-w-[500px] w-full px-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-xl shadow-sm">
                <DollarSign className="w-4 h-4 text-red-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-red-700 truncate">
                    Custo estimado de ~${totalEstimatedCost.toFixed(0)}/mês excede o limite de ${BUDGET_THRESHOLD}/mês
                  </p>
                </div>
                <button
                  onClick={() => setBudgetDismissed(true)}
                  className="shrink-0 p-1 rounded-full hover:bg-red-100 text-red-400 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* Floating toolbar — grouped by category with horizontal scroll */}
          <div className="absolute top-[14px] left-1/2 -translate-x-1/2 z-10 max-w-[calc(100vw-560px)]">
            <div className="flex items-center gap-[2px] bg-white border border-slate-200 rounded-full px-1.5 py-1 shadow-card overflow-x-auto scrollbar-thin">
              <TooltipProvider>
                {/* Palette toggle — always visible */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Toggle size="sm" pressed={showPalette} onPressedChange={() => setShowPalette(!showPalette)} className="w-[30px] h-[30px] rounded-full p-0 data-[state=on]:bg-brand-navy data-[state=on]:text-brand-lime hover:bg-ice-blue hover:text-brand-navy shrink-0">
                      <Palette className="w-4 h-4" />
                    </Toggle>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Alternar paleta</TooltipContent>
                </Tooltip>

                <div className={tbDivider} />

                {/* File group: New / Save / Validate */}
                <div className="flex items-center gap-[2px] bg-ice-blue/20 rounded-full px-1 py-0.5 shrink-0">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className={tbBtn} onClick={handleNew}>
                        <span className="text-lg font-bold leading-none">+</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Novo design</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className={tbBtn} onClick={handleSave}>
                        <Save className="w-4 h-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Salvar (⌘S)</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className={tbBtn} onClick={handleValidate}>
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Validar design</TooltipContent>
                  </Tooltip>
                </div>

                <div className={tbDivider} />

                {/* Edit group: Undo / Redo / Duplicate */}
                <div className="flex items-center gap-[2px] bg-slate-50 rounded-full px-1 py-0.5 shrink-0">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className={tbBtn} onClick={undo} disabled={!undoStack.length}>
                        <Undo2 className="w-4 h-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Desfazer (⌘Z)</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className={tbBtn} onClick={redo} disabled={!redoStack.length}>
                        <Redo2 className="w-4 h-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Refazer (⇧⌘Z)</TooltipContent>
                  </Tooltip>
                  {selectedCount > 0 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className={tbBtn} onClick={duplicateSelected}>
                          <Copy className="w-4 h-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">Duplicar (⌘D)</TooltipContent>
                    </Tooltip>
                  )}
                </div>

                {/* Align group (2+ selected) */}
                {selectedCount >= 2 && (
                  <>
                    <div className={tbDivider} />
                    <div className="flex items-center gap-[2px] bg-slate-50 rounded-full px-1 py-0.5 shrink-0">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className={tbBtn} onClick={() => alignNodes('left')}><AlignStartHorizontal className="w-4 h-4" /></button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">Alinhar à esquerda</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className={tbBtn} onClick={() => alignNodes('center')}><AlignCenterHorizontal className="w-4 h-4" /></button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">Centralizar H</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className={tbBtn} onClick={() => alignNodes('right')}><AlignEndHorizontal className="w-4 h-4" /></button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">Alinhar à direita</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className={tbBtn} onClick={() => alignNodes('top')}><AlignStartVertical className="w-4 h-4" /></button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">Alinhar ao topo</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className={tbBtn} onClick={() => alignNodes('middle')}><AlignCenterVertical className="w-4 h-4" /></button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">Centralizar V</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className={tbBtn} onClick={() => alignNodes('bottom')}><AlignEndVertical className="w-4 h-4" /></button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">Alinhar à base</TooltipContent>
                      </Tooltip>
                    </div>
                  </>
                )}

                <div className={tbDivider} />

                {/* Export/Import group */}
                <div className="flex items-center gap-[2px] bg-slate-50 rounded-full px-1 py-0.5 shrink-0">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className={tbBtn} onClick={handleExport}>
                        <Download className="w-4 h-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Exportar JSON</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className={tbBtn} onClick={handleExportImage}>
                        <ImageDown className="w-4 h-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Exportar PNG</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className={tbBtn} onClick={handleImport}>
                        <Upload className="w-4 h-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Importar</TooltipContent>
                  </Tooltip>
                </div>

                <div className={tbDivider} />

                {/* View dropdown — panel toggles */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className={cn(tbBtn, 'flex items-center gap-0.5 shrink-0', (showCodePreview || showVersionHistory || showAIChat || showObservability || showCostEstimation) && 'bg-brand-navy/10 text-brand-navy')}>
                      <Eye className="w-3.5 h-3.5" />
                      <ChevronDown className="w-2.5 h-2.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="min-w-[180px] rounded-xl">
                    <DropdownMenuItem onSelect={() => { setShowValidation(!showValidation); setShowAIChat(false); setShowCollaboration(false) }}>
                      <BadgeCheck className="w-4 h-4 text-slate-500" />
                      <span>Validação</span>
                      {showValidation && <span className="ml-auto w-2 h-2 rounded-full bg-brand-lime" />}
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setShowCodePreview(!showCodePreview)}>
                      <FileCode className="w-4 h-4 text-slate-500" />
                      <span>Código Terraform</span>
                      {showCodePreview && <span className="ml-auto w-2 h-2 rounded-full bg-brand-lime" />}
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => { toggleVersionHistory(); setShowAIChat(false); setShowCollaboration(false) }}>
                      <Clock className="w-4 h-4 text-slate-500" />
                      <span>Histórico de versões</span>
                      {showVersionHistory && <span className="ml-auto w-2 h-2 rounded-full bg-brand-lime" />}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => { setShowAIChat(!showAIChat); setShowCollaboration(false); if (showAIChat) setShowProperties(true) }}>
                      <Sparkles className="w-4 h-4 text-slate-500" />
                      <span>Assistente IA</span>
                      {showAIChat && <span className="ml-auto w-2 h-2 rounded-full bg-brand-lime" />}
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => { setShowCollaboration(!showCollaboration); setShowAIChat(false); if (showCollaboration) setShowProperties(true) }}>
                      <MessageSquare className="w-4 h-4 text-slate-500" />
                      <span>Comentários</span>
                      {showCollaboration && <span className="ml-auto w-2 h-2 rounded-full bg-brand-lime" />}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => { setShowObservability(!showObservability); setShowAIChat(false); setShowCollaboration(false); setShowCostEstimation(false) }}>
                      <Activity className="w-4 h-4 text-slate-500" />
                      <span>Observabilidade</span>
                      {showObservability && <span className="ml-auto w-2 h-2 rounded-full bg-brand-lime" />}
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => { setShowCostEstimation(!showCostEstimation); setShowAIChat(false); setShowCollaboration(false); setShowObservability(false); if (showCostEstimation) setShowProperties(true) }}>
                      <DollarSign className="w-4 h-4 text-slate-500" />
                      <span>Estimativa de custos</span>
                      {showCostEstimation && <span className="ml-auto w-2 h-2 rounded-full bg-brand-lime" />}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Tools group: Terraform/State/Multi imports + Auto-layout + Snap */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className={cn(tbBtn, 'flex items-center gap-0.5 shrink-0')}>
                      <Wrench className="w-3.5 h-3.5" />
                      <ChevronDown className="w-2.5 h-2.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="min-w-[200px] rounded-xl">
                    <DropdownMenuItem onSelect={() => setShowTerraformImport(true)}>
                      <FileCode className="w-4 h-4 text-slate-500" />
                      <span>Importar HCL (.tf)</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setShowStateImport(true)}>
                      <Database className="w-4 h-4 text-slate-500" />
                      <span>Importar state (.tfstate)</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setShowMultiImport(true)}>
                      <FolderArchive className="w-4 h-4 text-slate-500" />
                      <span>Importar projeto (multi-arquivo)</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => autoLayout()}>
                      <LayoutGrid className="w-4 h-4 text-slate-500" />
                      <span>Organizar layout automático</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setSnapEnabled(!snapEnabled)}>
                      <LayoutGrid className="w-4 h-4 text-slate-500" />
                      <span>Snap ao grid {snapEnabled ? '(ativo)' : '(inativo)'}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <div className={tbDivider} />

                {/* Online members indicator */}
                {teamMembers.filter(m => m.status === 'online').length > 0 && (() => {
                  const online = teamMembers.filter(m => m.status === 'online')
                  return (
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-brand-lime/10 rounded-full shrink-0">
                      <div className="flex -space-x-1.5">
                        {online.slice(0, 3).map((m) => (
                          <div
                            key={m.id}
                            className="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-[7px] font-bold text-white"
                            style={{ backgroundColor: m.avatar === 'T' ? '#3b82f6' : m.avatar === 'A' ? '#f97316' : m.avatar === 'P' ? '#8b5cf6' : '#22c55e' }}
                            title={m.name}
                          >
                            {m.avatar}
                          </div>
                        ))}
                        {online.length > 3 && (
                          <div className="w-5 h-5 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[7px] font-bold text-slate-500">
                            +{online.length - 3}
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] font-semibold text-brand-navy whitespace-nowrap">{online.length} online</span>
                    </div>
                  )
                })()}

                {/* Cost indicator — always visible */}
                {nodes.length > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setShowCostEstimation(!showCostEstimation)}
                        className={cn(
                          'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border shrink-0 transition-all',
                          isOverBudget
                            ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        )}
                      >
                        <DollarSign className="w-3 h-3" />
                        ~${totalEstimatedCost.toFixed(0)}
                        <span className="text-[8px] font-normal opacity-60">/mo</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      {isOverBudget ? 'Custo excede limite — clique para detalhes' : 'Custo mensal estimado'}
                    </TooltipContent>
                  </Tooltip>
                )}

                {/* Command palette + GitHub + Metrics — always visible */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className={tbBtn} onClick={() => setCommandPaletteOpen(true)}>
                      <Search className="w-4 h-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Paleta de comandos (⌘K)</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Toggle size="sm" pressed={showMetrics} onPressedChange={() => setShowMetrics(!showMetrics)} className="w-[30px] h-[30px] rounded-full p-0 data-[state=on]:bg-brand-navy data-[state=on]:text-brand-lime hover:bg-ice-blue hover:text-brand-navy shrink-0">
                      <Activity className="w-4 h-4" />
                    </Toggle>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">{showMetrics ? 'Desativar métricas' : 'Métricas ao vivo'}</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Toggle size="sm" pressed={showRepoBrowser} onPressedChange={() => { if (!githubToken) setShowGitHubConnect(true); else setShowRepoBrowser(!showRepoBrowser) }} className="w-[30px] h-[30px] rounded-full p-0 data-[state=on]:bg-slate-900 data-[state=on]:text-white hover:bg-ice-blue hover:text-brand-navy shrink-0">
                      <Github className="w-4 h-4" />
                    </Toggle>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">{githubToken ? 'GitHub conectado' : 'Conectar GitHub'}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Validation overlay */}
          {showValidation && (
            <div className="absolute right-0 top-0 bottom-0 w-[300px] z-20 flex flex-col shadow-lg">
              <ValidationPanel
                issues={validationIssues}
                errorCount={validationIssues.filter(i => i.severity === 'ERROR').length}
                warningCount={validationIssues.filter(i => i.severity === 'WARNING').length}
                infoCount={validationIssues.filter(i => i.severity === 'INFO').length}
                overallStatus={validationIssues.length === 0 ? 'VALID' : validationIssues.some(i => i.severity === 'ERROR') ? 'INVALID' : 'WARNINGS'}
                onSelectIssue={(componentId) => {
                  if (componentId) {
                    const node = nodes.find(n => n.id === componentId)
                    if (node) setSelectedNode(node)
                  }
                }}
              />
            </div>
          )}

          <EmptyCanvasState />

          <MetricsOverlay
            enabled={showMetrics}
            onToggle={() => setShowMetrics(false)}
          />
        </div>

        {/* Painel direito — largura dinâmica conforme conteúdo */}
        {rightPanelContent && (
          <div className={cn(
            'shrink-0 bg-white border-l border-slate-200 overflow-y-auto transition-all duration-200',
            showAIChat ? 'w-[380px]' : showVersionHistory ? 'w-[320px]' : showCollaboration ? 'w-[340px]' : 'w-[280px]'
          )}>
            {rightPanelContent}
          </div>
        )}
      </div>

      {/* Bottom Panel — Tabbed: Terraform | Docs | Logs | Events | Console */}
      {(showCodePreview || showCanvasDocs || showCanvasLogs || showCanvasEvents || showCanvasConsole) && (
        <div className="h-[220px] border-t border-slate-200 flex flex-col shrink-0">
          {/* Tab bar */}
          <div className="flex items-center border-b border-slate-200 px-2 shrink-0">
            {[
              { key: 'terraform', label: 'Terraform', show: showCodePreview, toggle: () => { setShowCodePreview(!showCodePreview); setShowCanvasDocs(false); setShowCanvasLogs(false); setShowCanvasEvents(false); setShowCanvasConsole(false) } },
              { key: 'docs', label: 'Documentação', show: showCanvasDocs, toggle: () => { setShowCanvasDocs(!showCanvasDocs); setShowCodePreview(false); setShowCanvasLogs(false); setShowCanvasEvents(false); setShowCanvasConsole(false) } },
              { key: 'logs', label: 'Logs', show: showCanvasLogs, toggle: () => { setShowCanvasLogs(!showCanvasLogs); setShowCodePreview(false); setShowCanvasDocs(false); setShowCanvasEvents(false); setShowCanvasConsole(false) } },
              { key: 'events', label: 'Eventos', show: showCanvasEvents, toggle: () => { setShowCanvasEvents(!showCanvasEvents); setShowCodePreview(false); setShowCanvasDocs(false); setShowCanvasLogs(false); setShowCanvasConsole(false) } },
              { key: 'console', label: 'Console', show: showCanvasConsole, toggle: () => { setShowCanvasConsole(!showCanvasConsole); setShowCodePreview(false); setShowCanvasDocs(false); setShowCanvasLogs(false); setShowCanvasEvents(false) } },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={tab.toggle}
                className={cn(
                  'px-3 py-2 text-xs font-medium border-b-2 transition-colors',
                  tab.show ? 'border-brand-navy text-brand-navy' : 'border-transparent text-slate-400 hover:text-slate-600'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {/* Panel content */}
          <div className="flex-1 overflow-hidden">
            {showCodePreview && <CodePreviewPanel expanded={true} onToggle={() => setShowCodePreview(false)} />}
            {showCanvasDocs && <CanvasDocPanel canvasId={useCanvasStore.getState().canvasId ?? undefined} />}
            {showCanvasLogs && <CanvasLogsPanel environmentId={undefined} />}
            {showCanvasEvents && <CanvasEventsPanel canvasId={useCanvasStore.getState().canvasId ?? undefined} />}
            {showCanvasConsole && <CanvasConsolePanel canvasId={useCanvasStore.getState().canvasId ?? undefined} />}
          </div>
        </div>
      )}
    </div>
  )
}
