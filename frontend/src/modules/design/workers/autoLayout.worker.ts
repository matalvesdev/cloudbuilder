// AutoLayout Web Worker - Offloads dagre layout computation to background thread
// Prevents main thread blocking with 500+ nodes

interface WorkerInput {
  nodes: Array<{ id: string; position: { x: number; y: number } }>
  edges: Array<{ source: string; target: string }>
  options: {
    rankdir: 'TB' | 'LR'
    nodesep: number
    ranksep: number
    marginx: number
    marginy: number
    nodeWidth: number
    nodeHeight: number
  }
}

interface WorkerOutput {
  positions: Array<{ id: string; x: number; y: number }>
  error?: string
}

// Simple dagre implementation for web worker (no external deps)
class SimpleDagre {
  private nodes = new Map<string, { width: number; height: number; x: number; y: number }>()
  private edges: Array<{ source: string; target: string }> = []
  private graph: Map<string, Set<string>> = new Map()
  private reverseGraph: Map<string, Set<string>> = new Map()
  private options: WorkerInput['options']

  constructor(options: WorkerInput['options']) {
    this.options = options
  }

  setNode(id: string, dims: { width: number; height: number }) {
    this.nodes.set(id, { ...dims, x: 0, y: 0 })
    if (!this.graph.has(id)) this.graph.set(id, new Set())
    if (!this.reverseGraph.has(id)) this.reverseGraph.set(id, new Set())
  }

  setEdge(source: string, target: string) {
    this.edges.push({ source, target })
    this.graph.get(source)?.add(target)
    this.reverseGraph.get(target)?.add(source)
  }

  layout() {
    // Topological sort for ranking
    const ranks = this.computeRanks()
    this.assignPositions(ranks)
  }

  private computeRanks(): Map<string, number> {
    const ranks = new Map<string, number>()
    const visited = new Set<string>()
    const temp = new Set<string>()

    const visit = (nodeId: string): number => {
      if (temp.has(nodeId)) return 0 // cycle
      if (visited.has(nodeId)) return ranks.get(nodeId) || 0

      temp.add(nodeId)
      let maxRank = 0
      const children = this.graph.get(nodeId) || new Set()
      for (const child of children) {
        maxRank = Math.max(maxRank, visit(child) + 1)
      }
      temp.delete(nodeId)
      visited.add(nodeId)
      ranks.set(nodeId, maxRank)
      return maxRank
    }

    for (const nodeId of this.nodes.keys()) {
      if (!visited.has(nodeId)) visit(nodeId)
    }
    return ranks
  }

  private assignPositions(ranks: Map<string, number>) {
    const rankGroups = new Map<number, string[]>()
    for (const [nodeId, rank] of ranks) {
      if (!rankGroups.has(rank)) rankGroups.set(rank, [])
      rankGroups.get(rank)!.push(nodeId)
    }

    const sortedRanks = Array.from(rankGroups.keys()).sort((a, b) => a - b)
    const { nodesep, ranksep, marginx, marginy, nodeWidth, nodeHeight } = this.options

    for (let i = 0; i < sortedRanks.length; i++) {
      const rank = sortedRanks[i]
      const nodesInRank = rankGroups.get(rank) || []
      const totalWidth = nodesInRank.length * nodeWidth + (nodesInRank.length - 1) * nodesep
      let startX = marginx + totalWidth / 2 - nodeWidth / 2

      for (const nodeId of nodesInRank) {
        const node = this.nodes.get(nodeId)
        if (node) {
          node.x = startX
          node.y = marginy + i * (nodeHeight + ranksep)
          startX += nodeWidth + nodesep
        }
      }
    }
  }

  getNodePositions(): Array<{ id: string; x: number; y: number }> {
    const result: Array<{ id: string; x: number; y: number }> = []
    for (const [id, node] of this.nodes) {
      result.push({ id, x: node.x, y: node.y })
    }
    return result
  }
}

self.onmessage = (e: MessageEvent<WorkerInput>) => {
  try {
    const { nodes, edges, options } = e.data
    const dagre = new SimpleDagre(options)

    for (const node of nodes) {
      dagre.setNode(node.id, { width: options.nodeWidth, height: options.nodeHeight })
    }
    for (const edge of edges) {
      dagre.setEdge(edge.source, edge.target)
    }

    dagre.layout()
    const positions = dagre.getNodePositions()

    self.postMessage({ positions } as WorkerOutput)
  } catch (err) {
    self.postMessage({ positions: [], error: err instanceof Error ? err.message : 'Layout failed' } as WorkerOutput)
  }
}

export {} // Make this a module