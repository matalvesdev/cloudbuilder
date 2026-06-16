import { useState, useCallback, useRef, useEffect } from 'react'
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
import { toPng } from 'html-to-image'
import { ReactFlowProvider } from '@xyflow/react'
import { Toaster, toast } from 'react-hot-toast'
import { CanvasView } from './components/CanvasView'
import { ComponentPalette } from './components/ComponentPalette'
import { PropertiesPanel } from './components/PropertiesPanel'
import { AIChatPanel } from './components/AIChatPanel'
import { CodePreviewPanel } from './components/CodePreviewPanel'
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
import { VersionHistoryPanel } from './components/VersionHistoryPanel'
import { CostEstimationBar } from './components/CostEstimationBar'
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
import { downloadCanvasJson, importCanvasFromFile } from './services'
import { importTerraform } from '@/api/import'
import { validateLocal, getNodeValidationStatus } from './validation/validationService'
import { ValidationPanel } from './validation/ValidationPanel'
import type { Node } from '@xyflow/react'
import type { ValidationIssue } from './validation/validationService'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'cloudbuilder-canvas'

export function DesignModule() {
  const { nodes, edges, undo, redo, undoStack, redoStack, clearCanvas, loadCanvas } = useCanvasStore()
  const teamMembers = useCollaborationStore((s) => s.teamMembers)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showPalette, setShowPalette] = useState(true)
  const [showProperties, setShowProperties] = useState(true)
  const [showAIChat, setShowAIChat] = useState(false)
  const [showCollaboration, setShowCollaboration] = useState(false)
  const [showCodePreview, setShowCodePreview] = useState(false)
  const [showValidation, setShowValidation] = useState(false)
  const [showVersionHistory, setShowVersionHistory] = useState(false)
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
    // Save current design
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
    toast.success('Design salvo com sucesso!', { duration: 2000 })
  }, [])

  const handleExport = useCallback(() => {
    downloadCanvasJson()
    toast.success('Design exportado!', { duration: 2000 })
  }, [])

  const handleExportImage = useCallback(async () => {
    const el = document.querySelector('.react-flow')
    if (!el) return
    try {
      const dataUrl = await toPng(el as HTMLElement, {
        backgroundColor: '#f8fafc',
        pixelRatio: 2,
        filter: (node) => {
          // Skip minimap and controls overlay
          if (node instanceof HTMLElement) {
            if (node.classList?.contains('react-flow__minimap')) return false
            if (node.classList?.contains('react-flow__controls')) return false
          }
          return true
        },
      })
      const link = document.createElement('a')
      link.download = `cloudbuilder-canvas-${Date.now()}.png`
      link.href = dataUrl
      link.click()
      toast.success('Imagem exportada!', { duration: 2000 })
    } catch (err) {
      console.error('Falha ao exportar imagem:', err)
      toast.error('Falha ao exportar imagem', { duration: 3000 })
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
        toast.success(`${resources.length} recursos importados com sucesso!`, { duration: 3000 })
      } else {
        // Canvas export JSON (.cloudbuilder.json ou .json)
        await importCanvasFromFile(file)
        toast.success('Design importado com sucesso!', { duration: 2000 })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao importar'
      console.error('Falha ao importar:', err)
      toast.error(message, { duration: 4000 })
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
    toast.success('Novo design criado!', { duration: 2000 })
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
      toast.success('Design válido!', { duration: 2000 })
    } else if (errorCount > 0) {
      toast.error(`${errorCount} erro(s) encontrado(s)`, { duration: 3000 })
    } else if (warningCount > 0) {
      toast(`${warningCount} aviso(s) encontrado(s)`, { icon: '⚠️', duration: 3000 })
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
    ? <VersionHistoryPanel onClose={() => setShowVersionHistory(false)} />
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
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            borderRadius: '12px',
            background: '#0a1128',
            color: '#fff',
            fontSize: '13px',
            fontWeight: 500,
          },
          success: { iconTheme: { primary: '#ccff00', secondary: '#0a1128' } },
        }}
      />
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
                    <DropdownMenuItem onSelect={() => { setShowVersionHistory(!showVersionHistory); setShowAIChat(false); setShowCollaboration(false) }}>
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

      <CodePreviewPanel
        expanded={showCodePreview}
        onToggle={() => setShowCodePreview(!showCodePreview)}
      />
    </div>
  )
}
