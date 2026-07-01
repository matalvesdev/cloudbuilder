import { memo, useState, useCallback, useRef, useEffect } from 'react'
import { NodeToolbar as RFNodeToolbar, Position, type NodeProps, type Node } from '@xyflow/react'
import {
  Trash2, Copy, ExternalLink, Info, BringToFront, SendToBack, Lock, Unlock,
  PenLine, Plug, ChevronRight,
} from 'lucide-react'
import type { CanvasNodeData } from '@/types/canvas.types'
import { useCanvasStore } from '@/store/canvasStore'
import { cn } from '@/lib/utils'

type CanvasNode = Node<CanvasNodeData>

function CanvasNodeToolbar({ data, id }: NodeProps<CanvasNode>) {
  const removeNode = useCanvasStore((s) => s.removeNode)
  const bringToFront = useCanvasStore((s) => s.bringToFront)
  const sendToBack = useCanvasStore((s) => s.sendToBack)
  const toggleLockNode = useCanvasStore((s) => s.toggleLockNode)
  const duplicateNode = useCanvasStore((s) => s.duplicateNode)
  const updateNodeLabel = useCanvasStore((s) => s.updateNodeLabel)
  const isLocked = data?.locked ?? false

  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(data.label as string || '')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  const handleStartEdit = useCallback(() => {
    setEditValue(data.label as string || '')
    setEditing(true)
  }, [data.label])

  const handleFinishEdit = useCallback(() => {
    if (editValue.trim()) {
      updateNodeLabel(id, editValue.trim())
    }
    setEditing(false)
  }, [editValue, id, updateNodeLabel])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleFinishEdit()
    if (e.key === 'Escape') setEditing(false)
  }, [handleFinishEdit])

  return (
    <RFNodeToolbar
      position={Position.Top}
      align="center"
      offset={10}
      className="flex items-center gap-0.5 bg-white border border-slate-100 rounded-xl card-shadow p-0.5 z-50"
    >
      <button
        onClick={() => removeNode(id)}
        className={cn(
          'flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded-lg transition-colors',
          'text-red-600 hover:bg-red-50 hover:text-red-700'
        )}
        title="Excluir"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
      <div className="w-px h-4 bg-slate-100 mx-0.5" />
      <button
        onClick={() => duplicateNode(id)}
        className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
        title="Duplicar"
      >
        <Copy className="w-3.5 h-3.5" />
      </button>
      <div className="w-px h-4 bg-slate-100 mx-0.5" />
      <button
        onClick={handleStartEdit}
        className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
        title="Renomear"
      >
        <PenLine className="w-3.5 h-3.5" />
      </button>
      <div className="w-px h-4 bg-slate-100 mx-0.5" />
      <button
        onClick={() => bringToFront(id)}
        className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
        title="Trazer para frente"
      >
        <BringToFront className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => sendToBack(id)}
        className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
        title="Enviar para trás"
      >
        <SendToBack className="w-3.5 h-3.5" />
      </button>
      <div className="w-px h-4 bg-slate-100 mx-0.5" />
      <button
        onClick={() => toggleLockNode(id)}
        className={cn(
          'flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded-lg transition-colors',
          isLocked ? 'text-amber-600 bg-amber-50' : 'text-slate-600 hover:bg-slate-50'
        )}
        title={isLocked ? 'Desbloquear' : 'Bloquear'}
      >
        {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
      </button>
      <div className="w-px h-4 bg-slate-100 mx-0.5" />
      <button className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded-lg text-slate-600 hover:bg-slate-50 transition-colors" title="Tipo de recurso">
        <Info className="w-3.5 h-3.5" />
        <span className="text-[10px]">{data.resourceType}</span>
      </button>

      {/* Inline rename input */}
      {editing && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/20" onClick={() => handleFinishEdit()}>
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-3 min-w-[240px]" onClick={e => e.stopPropagation()}>
            <p className="text-xs font-medium text-slate-500 mb-2">Renomear componente</p>
            <input
              ref={inputRef}
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-lime/60 focus:border-brand-navy"
              placeholder="Nome do componente"
            />
            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => setEditing(false)}
                className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleFinishEdit}
                className="px-3 py-1.5 text-xs font-medium bg-brand-navy text-white rounded-lg hover:bg-brand-navy/90 transition-colors"
              >
                Renomear
              </button>
            </div>
          </div>
        </div>
      )}
    </RFNodeToolbar>
  )
}

export default memo(CanvasNodeToolbar)
