import { useEffect, useCallback } from 'react'
import { useCanvasStore } from '@/store/canvasStore'
import { useSelectionStore } from '@/store/canvasSelectionStore'

// ─── useCanvasKeyboard ───────────────────────────────────────────
// Global keyboard shortcuts for the canvas.
// Supports: Delete, Escape, Cmd+Z (undo), Cmd+Shift+Z (redo), Cmd+D (duplicate)

export function useCanvasKeyboard(enabled = true) {
  const removeSelectedNodes = useCanvasStore((s) => s.removeSelectedNodes)
  const undo = useCanvasStore((s) => s.undo)
  const redo = useCanvasStore((s) => s.redo)
  const duplicateSelected = useCanvasStore((s) => s.duplicateSelected)
  const stopEditing = useCanvasStore((s) => s.stopEditing)
  const clearSelection = useSelectionStore((s) => s.clearSelection)

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return

    // Don't intercept when typing in an input/textarea
    const tag = (e.target as HTMLElement)?.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
    if ((e.target as HTMLElement)?.contentEditable === 'true') return

    const isMod = e.metaKey || e.ctrlKey

    // Delete / Backspace — remove selected nodes
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault()
      removeSelectedNodes()
      return
    }

    // Escape — clear selection / stop editing
    if (e.key === 'Escape') {
      e.preventDefault()
      stopEditing()
      clearSelection()
      return
    }

    // Cmd+Z — Undo
    if (isMod && !e.shiftKey && e.key === 'z') {
      e.preventDefault()
      undo()
      return
    }

    // Cmd+Shift+Z — Redo
    if (isMod && e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
      e.preventDefault()
      redo()
      return
    }

    // Cmd+Y — Redo (alternative)
    if (isMod && e.key === 'y') {
      e.preventDefault()
      redo()
      return
    }

    // Cmd+D — Duplicate
    if (isMod && e.key === 'd') {
      e.preventDefault()
      duplicateSelected()
      return
    }
  }, [enabled, removeSelectedNodes, undo, redo, duplicateSelected, stopEditing, clearSelection])

  useEffect(() => {
    if (!enabled) return
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [enabled, handleKeyDown])
}
