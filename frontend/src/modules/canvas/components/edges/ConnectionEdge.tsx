import { useCallback } from 'react'
import { BaseEdge, EdgeLabelRenderer, getBezierPath, getSmoothStepPath, type EdgeProps } from '@xyflow/react'
import { EDGE_TYPE_STYLES, type ConnectionEdgeType } from './EdgeTypes'
import EdgeToolbar from './EdgeToolbar'
import { useCanvasStore } from '@/store/canvasStore'
import { cn } from '@/lib/utils'

export function ConnectionEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps) {
  const edgeType = (data?.edgeType as ConnectionEdgeType) ?? 'default'
  const config = EDGE_TYPE_STYLES[edgeType] ?? EDGE_TYPE_STYLES.default
  const updateEdgeType = useCanvasStore((s: any) => s.updateEdgeType)
  const removeEdge = useCanvasStore((s) => s.removeEdge)

  const handleTypeChange = useCallback(
    (newType: ConnectionEdgeType) => updateEdgeType(id, newType),
    [id, updateEdgeType]
  )
  const handleDelete = useCallback(() => removeEdge(id), [id, removeEdge])

  const pathParams = { sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition }
  const [edgePath, labelX, labelY] = (config as any).pathType === 'smoothstep'
    ? getSmoothStepPath({ ...pathParams, borderRadius: 12 })
    : getBezierPath(pathParams)

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        className={config.animated ? 'edge-animated' : ''}
        style={{
          stroke: config.color,
          strokeWidth: selected ? config.strokeWidth + 1 : config.strokeWidth,
          strokeDasharray: config.dashed && !config.animated ? '5 4' : 'none',
        }}
        markerEnd={`url(#arrow-${id})`}
      />
      <defs>
        <marker id={`arrow-${id}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="6" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill={config.color} />
        </marker>
      </defs>
      <EdgeToolbar
        edgeType={edgeType}
        labelX={labelX}
        labelY={labelY}
        onTypeChange={handleTypeChange}
        onDelete={handleDelete}
        selected={selected}
      />
      <EdgeLabelRenderer>
        <div
          className={cn(
            'absolute whitespace-nowrap transition-all pointer-events-none',
            selected
              ? 'px-2.5 py-1 rounded-md text-[10px] font-semibold border bg-white shadow-sm'
              : 'px-1.5 py-0.5 rounded text-[8px] border-0 bg-transparent opacity-40 hover:opacity-100'
          )}
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            borderColor: selected ? config.color : 'transparent',
            color: config.color,
          }}
        >
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: config.color }} />
            {config.labelPtBr}
          </span>
        </div>
      </EdgeLabelRenderer>
    </>
  )
}
