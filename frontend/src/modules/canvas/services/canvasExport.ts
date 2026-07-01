import type { Node, Edge } from '@xyflow/react'
import { useCanvasStore } from '@/store/canvasStore'
import type { CanvasNodeData } from '@/types/canvas.types'

export interface CanvasExportData {
  id: string
  name: string
  description: string
  version: number
  schema: string
  exportedAt: string
  nodes: Node<CanvasNodeData>[]
  edges: Edge[]
  metadata: {
    nodeCount: number
    edgeCount: number
    providers: string[]
  }
}

export interface CanvasExportDataV2 {
  formatVersion: '1.0'
  metadata: {
    name: string
    description: string
    source: 'manual'
    importedAt: string
    provider: 'aws' | 'azure' | 'gcp' | 'k8s' | 'multi'
    resourceCount: number
  }
  resources: {
    id: string
    type: string
    provider: string
    name: string
    displayType: string
    properties: Record<string, string>
    source: string
  }[]
  connections: {
    source: string
    target: string
    type: string
  }[]
  canvas: {
    nodes: Node<CanvasNodeData>[]
    edges: Edge[]
  }
}

export function exportCanvas(): CanvasExportData | null {
  const { nodes, edges, canvasId, canvasName, canvasVersion } = useCanvasStore.getState()

  if (!nodes.length) return null

  const providers = Array.from(new Set(nodes.map((n) => n.data.provider)))

  return {
    id: canvasId ?? crypto.randomUUID(),
    name: canvasName,
    description: '',
    version: canvasVersion,
    schema: 'cloudbuilder/v1',
    exportedAt: new Date().toISOString(),
    nodes,
    edges,
    metadata: {
      nodeCount: nodes.length,
      edgeCount: edges.length,
      providers,
    },
  }
}

export function exportCanvasV2(): CanvasExportDataV2 {
  const state = useCanvasStore.getState()
  const providers = Array.from(new Set(state.nodes.map((n) => n.data.provider)))
  const providerType = providers.length === 1 ? (providers[0] as 'aws' | 'azure' | 'gcp' | 'k8s') : 'multi'

  return {
    formatVersion: '1.0',
    metadata: {
      name: state.canvasName,
      description: '',
      source: 'manual',
      importedAt: new Date().toISOString(),
      provider: providerType,
      resourceCount: state.nodes.length,
    },
    resources: state.nodes.map((n) => ({
      id: `${n.data.resourceType}.${n.data.label}`,
      type: n.data.resourceType,
      provider: n.data.provider,
      name: n.data.label,
      displayType: n.data.resourceType,
      properties: {},
      source: 'json',
    })),
    connections: state.edges.map((e) => {
      const sourceNode = state.nodes.find(n => n.id === e.source)
      const targetNode = state.nodes.find(n => n.id === e.target)
      return {
        source: sourceNode ? `${sourceNode.data.resourceType}.${sourceNode.data.label}` : e.source,
        target: targetNode ? `${targetNode.data.resourceType}.${targetNode.data.label}` : e.target,
        type: 'reference',
      }
    }),
    canvas: {
      nodes: state.nodes,
      edges: state.edges,
    },
  }
}

export function downloadCanvasJsonV2(): void {
  const data = exportCanvasV2()

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${data.metadata.name}.cloudbuilder.json`
  anchor.click()
  URL.revokeObjectURL(url)
}

export function downloadCanvasJson(): void {
  const data = exportCanvas()
  if (!data) return

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${data.name}-v${data.version}.cloudbuilder.json`
  anchor.click()
  URL.revokeObjectURL(url)
}

export async function importCanvasFromFile(file: File): Promise<void> {
  const text = await file.text()

  let parsed: any
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('Arquivo inválido: JSON inválido')
  }

  // Support both v1 (cloudbuilder/v1) and v2 (formatVersion: '1.0') formats
  const isV2 = parsed.formatVersion === '1.0'
  const isV1 = parsed.schema === 'cloudbuilder/v1'

  if (!isV2 && !isV1) {
    throw new Error('Formato não reconhecido. Use .cloudbuilder.json (exportado do CloudBuilder).')
  }

  const { loadCanvas, addNode, addEdgeWithType, autoLayout } = useCanvasStore.getState()

  if (isV2 && parsed.canvas?.nodes) {
    // V2 format — has canvas state embedded
    loadCanvas({
      id: parsed.metadata?.name ?? crypto.randomUUID(),
      name: parsed.metadata?.name ?? 'Design importado',
      description: '',
      version: 1,
      nodes: parsed.canvas.nodes,
      edges: parsed.canvas.edges,
      createdAt: parsed.metadata?.importedAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  } else if (isV2 && parsed.resources) {
    // V2 format — resources only, generate canvas nodes
    const nameToId = new Map<string, string>()
    const cols = Math.max(1, Math.ceil(Math.sqrt(parsed.resources.length)))

    for (let i = 0; i < parsed.resources.length; i++) {
      const res = parsed.resources[i]
      const displayName = res.displayType !== res.type
        ? `${res.displayType}: ${res.name}`
        : res.name

      addNode(
        { id: res.type, displayName, provider: res.provider, resourceType: res.type },
        { x: 80 + (i % cols) * 300, y: 80 + Math.floor(i / cols) * 180 }
      )

      const state = useCanvasStore.getState()
      const newNode = state.nodes[state.nodes.length - 1]
      if (newNode) {
        nameToId.set(res.type + '.' + res.name, newNode.id)
      }
    }

    // Connect resources
    if (parsed.connections) {
      for (const conn of parsed.connections) {
        const sourceId = nameToId.get(conn.source)
        const targetId = nameToId.get(conn.target)
        if (sourceId && targetId) {
          addEdgeWithType(sourceId, targetId, 'default')
        }
      }
    }

    await new Promise(r => setTimeout(r, 50))
    await autoLayout()
  } else {
    // V1 fallback
    if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
      throw new Error('Arquivo inválido: nodes ou edges ausentes')
    }

    loadCanvas({
      id: parsed.id ?? crypto.randomUUID(),
      name: parsed.name ?? 'Design importado',
      description: parsed.description ?? '',
      version: parsed.version ?? 1,
      nodes: parsed.nodes,
      edges: parsed.edges,
      createdAt: parsed.createdAt ?? new Date().toISOString(),
      updatedAt: parsed.updatedAt ?? new Date().toISOString(),
    })
  }
}

export async function copyCanvasToClipboard(): Promise<boolean> {
  const data = exportCanvas()
  if (!data) return false

  try {
    await navigator.clipboard.writeText(JSON.stringify(data, null, 2))
    return true
  } catch {
    return false
  }
}

export function generateCanvasSnapshot(): string {
  const { nodes, edges } = useCanvasStore.getState()
  return JSON.stringify({ nodes, edges, capturedAt: new Date().toISOString() })
}
