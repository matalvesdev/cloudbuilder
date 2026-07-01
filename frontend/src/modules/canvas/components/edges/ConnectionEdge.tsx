import { EdgeLabelRenderer, getBezierPath, type EdgeProps } from '@xyflow/react'
import { EDGE_TYPE_STYLES, type ConnectionEdgeType } from './EdgeTypes'
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

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  const markerId = `arrow-${edgeType}`

  return (
    <>
      <path
        id={id}
        d={edgePath}
        className={config.animated ? 'edge-animated' : ''}
        style={{
          stroke: config.color,
          strokeWidth: selected ? config.strokeWidth + 1 : config.strokeWidth,
          strokeDasharray: config.dashed && !config.animated
            ? '5 4'
            : 'none',
          fill: 'none',
          strokeLinecap: 'round',
        }}
        markerEnd={`url(#${markerId})`}
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
