import { memo, useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react'
import type { CanvasNodeData } from '@/types/canvas.types'
import { ValidationBadge } from '../validation'
import { ServiceIcon } from './providerIcons'
import CanvasNodeToolbar from './NodeToolbar'
import { useCanvasStore } from '@/store/canvasStore'
import { useCollaborationStore } from '@/store/collaborationStore'
import { cn } from '@/lib/utils'
import { Lock, Check, X, MessageCircle, DollarSign } from 'lucide-react'
import { getResourcePrice } from '../components/CostEstimationBar'

type CanvasNode = NodeProps<Node<CanvasNodeData>>

// Memoized theme lookup - defined outside component to avoid recreation
const providerTheme: Record<string, { border: string; handle: string; labelColor: string; badgeBg: string; badgeText: string; propertyBg: string }> = {
  aws: {
    border: 'border-[#FF9900]/40',
    handle: '!bg-[#FF9900]',
    labelColor: 'text-[#FF9900]',
    badgeBg: 'bg-orange-50',
    badgeText: 'text-orange-700',
    propertyBg: 'bg-orange-50/30',
  },
  azure: {
    border: 'border-[#0078D4]/40',
    handle: '!bg-[#0078D4]',
    labelColor: 'text-[#0078D4]',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700',
    propertyBg: 'bg-blue-50/30',
  },
  gcp: {
    border: 'border-[#4285F4]/40',
    handle: '!bg-[#4285F4]',
    labelColor: 'text-[#4285F4]',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700',
    propertyBg: 'bg-blue-50/30',
  },
  k8s: {
    border: 'border-[#326CE5]/40',
    handle: '!bg-[#326CE5]',
    labelColor: 'text-[#326CE5]',
    badgeBg: 'bg-indigo-50',
    badgeText: 'text-indigo-700',
    propertyBg: 'bg-indigo-50/30',
  },
}

function getProviderForTheme(data: CanvasNodeData): string {
  if (data.provider) return data.provider
  if (data.componentDefinitionId?.startsWith('aws-')) return 'aws'
  if (data.componentDefinitionId?.startsWith('azure-')) return 'azure'
  if (data.componentDefinitionId?.startsWith('gcp-')) return 'gcp'
  if (data.componentDefinitionId?.startsWith('k8s-')) return 'k8s'
  return 'aws'
}

// Provider color mapping for the provider label
const providerColors: Record<string, string> = {
  aws: '#FF6600',
  azure: '#0078D4',
  gcp: '#4285F4',
  k8s: '#326CE5',
}

function CloudNode(props: CanvasNode) {
  const { id, data, selected } = props
  const provider = getProviderForTheme(data)
  const theme = providerTheme[provider] || providerTheme.aws
  const isEditing = useCanvasStore((s) => s.editingNodeId === id)
  const updateNodeLabel = useCanvasStore((s) => s.updateNodeLabel)
  const stopEditing = useCanvasStore((s) => s.stopEditing)
  const commentCount = useCollaborationStore((s) => s.comments.filter(c => c.nodeId === id && !c.resolved).length)
  const setSelectedCommentNodeId = useCollaborationStore((s) => s.setSelectedCommentNodeId)
  const highlightedIncidentNodes = useCanvasStore((s) => s.highlightedIncidentNodes)
  const isIncidentHighlighted = highlightedIncidentNodes.includes(id)

  const [editValue, setEditValue] = useState(data.label)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing) {
      setEditValue(data.label)
      // Focus + select all text on next paint
      requestAnimationFrame(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      })
    }
  }, [isEditing, data.label])

  const confirmEdit = useCallback(() => {
    const trimmed = editValue.trim()
    if (trimmed && trimmed !== data.label) {
      updateNodeLabel(id, trimmed)
    }
    stopEditing()
  }, [editValue, data.label, id, updateNodeLabel, stopEditing])

  const cancelEdit = useCallback(() => {
    setEditValue(data.label)
    stopEditing()
  }, [data.label, stopEditing])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') confirmEdit()
    if (e.key === 'Escape') cancelEdit()
  }, [confirmEdit, cancelEdit])

  const properties = Object.entries(data.properties || {}).slice(0, 2)
  const isLocked = data?.locked ?? false
  const estimatedCost = useMemo(() => getResourcePrice(data.resourceType || ''), [data.resourceType])

  return (
    <div
      className={cn(
        'rounded-xl border-[1.5px] bg-white card-shadow w-56 transition-all',
        selected ? `${theme.border} ring-2 ring-brand-lime/40 shadow-md` : 'border-slate-200 hover:border-slate-300',
        isLocked && 'opacity-85',
        isIncidentHighlighted && 'border-red-400 ring-2 ring-red-300 animate-pulse shadow-lg shadow-red-200/50'
      )}
    >
      <CanvasNodeToolbar {...props} />
      <Handle type="target" position={Position.Top} className={cn('w-3 h-3 !border-2 !border-white', theme.handle)} />

      {/* Header */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-1.5">
        <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0', theme.badgeBg)}>
          <ServiceIcon componentId={data.componentDefinitionId} size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            {isEditing ? (
              <div className="flex items-center gap-1 w-full">
                <input
                  ref={inputRef}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={confirmEdit}
                  className="flex-1 min-w-0 px-1.5 py-0.5 text-[13px] font-semibold text-brand-navy bg-ice-blue/50 border border-brand-navy/30 rounded outline-none ring-1 ring-brand-lime/40"
                  spellCheck={false}
                />
                <button
                  onClick={confirmEdit}
                  className="shrink-0 p-0.5 rounded hover:bg-green-100 text-green-600 transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={cancelEdit}
                  className="shrink-0 p-0.5 rounded hover:bg-red-100 text-red-500 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <>
                <div className="text-[13px] font-semibold text-brand-navy truncate leading-tight">{data.label}</div>
                {isLocked && <Lock className="w-3 h-3 text-amber-500 shrink-0" />}
              </>
            )}
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: providerColors[provider] }}>
              {data.provider?.toUpperCase() || provider.toUpperCase()}
            </span>
            <span className="text-[9px] text-slate-400">·</span>
            <span className="text-[9px] font-mono text-slate-400 truncate">{data.resourceType}</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {commentCount > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setSelectedCommentNodeId(id) }}
              className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
              title="Ver comentários"
            >
              <MessageCircle className="w-3 h-3" />
              <span className="text-[9px] font-bold">{commentCount}</span>
            </button>
          )}
          {estimatedCost > 0 && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[9px] font-bold border border-emerald-200/50 shrink-0">
              <DollarSign className="w-2.5 h-2.5" />
              {estimatedCost.toFixed(0)}
            </span>
          )}
          <ValidationBadge status={data.validationStatus} />
        </div>
      </div>

      {/* Properties */}
      {properties.length > 0 && (
        <div className={cn('mx-3 mb-2 px-2 py-1.5 rounded-lg', theme.propertyBg)}>
          {properties.map(([key, val]) => (
            <div key={key} className="flex items-center justify-between gap-2 text-[10px] leading-tight">
              <span className="text-slate-500 truncate font-medium">{key}:</span>
              <span className="font-mono text-slate-700 truncate max-w-[100px]">{String(val).slice(0, 18)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Resource type chip */}
      <div className="px-3 pb-2.5">
        <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-[8px] font-mono font-bold', theme.badgeBg, theme.badgeText)}>
          {data.resourceType}
        </span>
      </div>

      <Handle type="source" position={Position.Bottom} className={cn('w-3 h-3 !border-2 !border-white', theme.handle)} />
      <Handle type="source" position={Position.Right} id="right" className="w-2.5 h-2.5 !bg-slate-300 !border-2 !border-white" />
      <Handle type="target" position={Position.Left} id="left" className="w-2.5 h-2.5 !bg-slate-300 !border-2 !border-white" />
    </div>
  )
}

export default memo(CloudNode)