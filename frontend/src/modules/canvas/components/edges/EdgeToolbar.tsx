import { useEffect, useRef } from 'react'
import { EDGE_TYPE_STYLES, type ConnectionEdgeType } from './EdgeTypes'
import { useCanvasStore } from '@/store/canvasStore'
import { cn } from '@/lib/utils'

interface EdgeToolbarProps {
  edgeType: ConnectionEdgeType
  labelX: number
  labelY: number
  onTypeChange: (type: ConnectionEdgeType) => void
  onDelete: () => void
  selected?: boolean
}

export default function EdgeToolbar({ edgeType, labelX, labelY, onTypeChange, onDelete, selected }: EdgeToolbarProps) {
  if (!selected) return null

  return (
    <div
      className="absolute flex items-center gap-1 bg-white border border-slate-200 rounded-lg shadow-lg px-1.5 py-1 z-30"
      style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY - 30}px)` }}
    >
      {(Object.keys(EDGE_TYPE_STYLES) as ConnectionEdgeType[]).map((type) => (
        <button
          key={type}
          onClick={() => onTypeChange(type)}
          className={cn(
            'w-7 h-7 flex items-center justify-center rounded-md text-[9px] font-bold transition-all',
            edgeType === type
              ? 'bg-brand-navy text-brand-lime'
              : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
          )}
          title={EDGE_TYPE_STYLES[type].labelPtBr}
        >
          {EDGE_TYPE_STYLES[type].labelPtBr.charAt(0)}
        </button>
      ))}
      <div className="w-px h-5 bg-slate-200 mx-0.5" />
      <button
        onClick={onDelete}
        className="w-7 h-7 flex items-center justify-center rounded-md text-red-400 hover:bg-red-50 hover:text-red-600 transition-all"
        title="Excluir"
      >
        <span className="text-xs">✕</span>
      </button>
    </div>
  )
}
