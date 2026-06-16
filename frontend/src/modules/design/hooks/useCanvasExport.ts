import {
  exportCanvas,
  downloadCanvasJson,
  importCanvasFromFile,
  copyCanvasToClipboard,
  generateCanvasSnapshot,
} from '../services/canvasExport'

export function useCanvasExport() {
  return {
    exportCanvas,
    downloadCanvasJson,
    importCanvasFromFile,
    copyCanvasToClipboard,
    generateCanvasSnapshot,
  }
}
