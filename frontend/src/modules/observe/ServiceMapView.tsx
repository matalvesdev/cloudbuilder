import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  MarkerType,
  type Node,
  type Edge,
  type NodeProps,
  Handle,
  Position,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { api } from '@/api/client'
import { Loader2, AlertTriangle, Server, Activity, Clock, Zap, Hash, AlertCircle, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

/* ─── Types ────────────────────────────────────────────────────────── */

interface ServiceMapNodeDTO {
  nodeId: string
  componentDefinitionId: string
  positionX: number
  positionY: number
  status: string
  latencyMs: number
  uptimePercent: number
  alertCount: number
  hasCriticalAlert: boolean
}

interface ServiceMapEdgeDTO {
  edgeId: string
  sourceNodeId: string
  targetNodeId: string
  edgeType: string
}

interface ServiceMapResponse {
  canvasId: string
  canvasName: string
  environmentId: string
  overallStatus: string
  nodes: ServiceMapNodeDTO[]
  edges: ServiceMapEdgeDTO[]
}

/* ─── Custom Node ──────────────────────────────────────────────────── */

interface ServiceMapNodeData {
  label: string
  status: string
  latencyMs: number
  uptimePercent: number
  alertCount: number
  hasCriticalAlert: boolean
}

function ServiceMapNode({ data }: NodeProps) {
  const d = data as unknown as ServiceMapNodeData
  const statusColor = {
    healthy: 'bg-green-500 border-green-300',
    degraded: 'bg-yellow-500 border-yellow-300',
    down: 'bg-red-500 border-red-300',
    critical: 'bg-red-600 border-red-400',
    unknown: 'bg-slate-300 border-slate-200',
  }[d.status] || 'bg-slate-300 border-slate-200'

  const statusLabel = {
    healthy: 'Saudável',
    degraded: 'Degradado',
    down: 'Indisponível',
    critical: 'Crítico',
    unknown: 'Desconhecido',
  }[d.status] || 'Desconhecido'

  return (
    <div className={cn(
      'px-4 py-3 rounded-2xl border-2 shadow-lg bg-white min-w-[180px] transition-all hover:shadow-xl',
      d.status === 'healthy' && 'border-green-300',
      d.status === 'degraded' && 'border-yellow-300',
      d.status === 'down' && 'border-red-300',
      d.status === 'critical' && 'border-red-400',
      d.status === 'unknown' && 'border-slate-200',
    )}>
      <Handle type="target" position={Position.Top} className="!bg-slate-300" />
      <div className="flex items-center gap-2 mb-2">
        <div className={cn('w-3 h-3 rounded-full border-2', statusColor)} />
        <span className="text-sm font-bold text-brand-navy truncate">{d.label}</span>
        {d.alertCount > 0 && (
          <Badge variant="destructive" className="ml-auto text-[10px] h-5 px-1.5 gap-1">
            <AlertCircle className="w-3 h-3" />
            {d.alertCount}
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-3 text-[11px] text-slate-500">
        <span className="flex items-center gap-1">
          <Activity className="w-3 h-3" />
          {d.latencyMs.toFixed(0)}ms
        </span>
        <span className="flex items-center gap-1">
          <Zap className="w-3 h-3" />
          {d.uptimePercent.toFixed(1)}%
        </span>
      </div>
      <div className={cn(
        'text-[10px] font-semibold mt-1.5',
        d.status === 'healthy' && 'text-green-600',
        d.status === 'degraded' && 'text-yellow-600',
        d.status === 'down' && 'text-red-600',
        d.status === 'unknown' && 'text-slate-400',
      )}>
        {statusLabel}
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-slate-300" />
    </div>
  )
}

const nodeTypes = { serviceMapNode: ServiceMapNode }

/* ─── Edge style helper ────────────────────────────────────────────── */

function edgeStyle(status: string) {
  if (status === 'critical' || status === 'down') return { stroke: '#ef4444', strokeWidth: 2, animated: true }
  if (status === 'degraded') return { stroke: '#eab308', strokeWidth: 2, animated: true }
  return { stroke: '#94a3b8', strokeWidth: 1.5 }
}

/* ─── Main Component ───────────────────────────────────────────────── */

export function ServiceMapView() {
  const [data, setData] = useState<ServiceMapResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [canvasId, setCanvasId] = useState<string>('')
  const [canvasList, setCanvasList] = useState<{ id: string; name: string }[]>([])
  const [showCanvasPicker, setShowCanvasPicker] = useState(false)

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

  const fetchServiceMap = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get<ServiceMapResponse>(`/service-map/${id}`)
      setData(res)

      const flowNodes: Node[] = res.nodes.map((n, i) => ({
        id: n.nodeId,
        type: 'serviceMapNode',
        position: { x: n.positionX || (i % 4) * 250, y: n.positionY || Math.floor(i / 4) * 180 },
        data: {
          label: n.componentDefinitionId.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
          status: n.status,
          latencyMs: n.latencyMs,
          uptimePercent: n.uptimePercent,
          alertCount: n.alertCount,
          hasCriticalAlert: n.hasCriticalAlert,
        },
      }))

      const flowEdges: Edge[] = res.edges.map((e) => ({
        id: e.edgeId,
        source: e.sourceNodeId,
        target: e.targetNodeId,
        type: 'smoothstep',
        markerEnd: { type: MarkerType.ArrowClosed, color: edgeStyle(res.overallStatus).stroke },
        style: edgeStyle(res.overallStatus),
      }))

      setNodes(flowNodes)
      setEdges(flowEdges)
    } catch (err) {
      setError('Não foi possível carregar o service map. API indisponível.')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [setNodes, setEdges])

  // Fetch canvas list for picker
  useEffect(() => {
    api.get<{ id: string; name: string }[]>('/service-map')
      .then((list) => setCanvasList(list))
      .catch(() => {})
  }, [])

  // Auto-select first canvas
  useEffect(() => {
    if (!canvasId && canvasList.length > 0) {
      setCanvasId(canvasList[0].id)
    }
  }, [canvasList, canvasId])

  useEffect(() => {
    if (canvasId) {
      fetchServiceMap(canvasId)
    }
  }, [canvasId, fetchServiceMap])

  const handleRefresh = () => {
    if (canvasId) fetchServiceMap(canvasId)
  }

  const overallBadge = useMemo(() => {
    if (!data) return null
    const { overallStatus } = data
    const variant = overallStatus === 'healthy' ? 'default' as const
      : overallStatus === 'degraded' ? 'secondary' as const
      : 'destructive' as const
    const label = {
      healthy: 'Saudável',
      degraded: 'Degradado',
      critical: 'Crítico',
      unknown: 'Desconhecido',
    }[overallStatus] || overallStatus
    return <Badge variant={variant} className="gap-1.5 px-3 py-1 text-xs font-semibold">{label}</Badge>
  }, [data])

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-full py-16">
        <Loader2 className="w-6 h-6 animate-spin text-brand-navy" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <button
            onClick={() => setShowCanvasPicker(!showCanvasPicker)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-brand-navy hover:bg-slate-50 transition-all"
          >
            <Server className="w-4 h-4 text-slate-400" />
            {data?.canvasName || 'Selecionar Canvas'}
          </button>
          {showCanvasPicker && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowCanvasPicker(false)} />
              <div className="absolute left-0 top-full mt-1 w-56 bg-white rounded-xl border border-slate-200 shadow-lg z-50 py-1 max-h-48 overflow-y-auto">
                {canvasList.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => { setCanvasId(c.id); setShowCanvasPicker(false) }}
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
        {overallBadge}
        <button
          onClick={handleRefresh}
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

      {/* Canvas */}
      {data && nodes.length > 0 ? (
        <div className="bg-white rounded-3xl card-shadow border border-slate-100 overflow-hidden" style={{ height: 520 }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            attributionPosition="bottom-left"
            minZoom={0.3}
            maxZoom={2}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e2e8f0" />
            <Controls showInteractive={false} className="!rounded-xl !border !border-slate-200 !shadow-sm" />
            <MiniMap
              nodeStrokeColor="#0a1128"
              nodeColor={(n) => {
                const s = (n.data as any)?.status
                if (s === 'healthy') return '#22c55e'
                if (s === 'degraded') return '#eab308'
                if (s === 'down' || s === 'critical') return '#ef4444'
                return '#94a3b8'
              }}
              className="!rounded-xl !border !border-slate-200 !shadow-sm"
            />
          </ReactFlow>
        </div>
      ) : data && nodes.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[300px] bg-white rounded-3xl card-shadow border border-slate-100">
          <Server className="w-12 h-12 text-slate-200 mb-3" />
          <p className="text-sm text-slate-400">Canvas vazio — adicione componentes ao design para ver o service map</p>
        </div>
      ) : null}
    </div>
  )
}
