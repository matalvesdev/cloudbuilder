import { describe, bench, beforeEach } from 'vitest'
import { useCanvasStore } from '../src/store/canvasStore'

const componentData = {
  id: 'comp-id',
  provider: 'aws' as const,
  resourceType: 'aws_vpc',
  displayName: 'VPC',
  category: 'network' as const,
}

beforeEach(() => {
  useCanvasStore.setState({
    nodes: [],
    edges: [],
    selectedNode: null,
    selectedEdge: null,
    editingNodeId: null,
    canvasId: null,
    canvasName: 'Bench',
    canvasVersion: 1,
    undoStack: [],
    redoStack: [],
    generatedCode: [],
  })
})

describe('canvasStore — addNode', () => {
  bench('add 1 node', () => {
    useCanvasStore.getState().addNode(componentData, { x: 0, y: 0 })
  })

  bench('add 10 nodes', () => {
    for (let i = 0; i < 10; i++) {
      useCanvasStore.getState().addNode(componentData, { x: i * 100, y: 0 })
    }
  })

  bench('add 50 nodes', () => {
    for (let i = 0; i < 50; i++) {
      useCanvasStore.getState().addNode(componentData, { x: i * 100, y: i * 100 })
    }
  })

  bench('add 100 nodes', () => {
    for (let i = 0; i < 100; i++) {
      useCanvasStore.getState().addNode(componentData, { x: i * 50, y: i * 50 })
    }
  })
})

describe('canvasStore — removeNode', () => {
  beforeEach(() => {
    for (let i = 0; i < 50; i++) {
      useCanvasStore.getState().addNode({ ...componentData, id: `n-${i}` }, { x: i * 100, y: 0 })
    }
  })

  bench('remove 1 node from 50', () => {
    const id = useCanvasStore.getState().nodes[0].id
    useCanvasStore.getState().removeNode(id)
  })
})

describe('canvasStore — undo/redo', () => {
  beforeEach(() => {
    for (let i = 0; i < 20; i++) {
      useCanvasStore.getState().addNode(componentData, { x: i * 100, y: 0 })
    }
  })

  bench('undo 10 times', () => {
    for (let i = 0; i < 10; i++) {
      useCanvasStore.getState().undo()
    }
  })

  bench('redo 10 times', () => {
    for (let i = 0; i < 10; i++) {
      useCanvasStore.getState().undo()
    }
    for (let i = 0; i < 10; i++) {
      useCanvasStore.getState().redo()
    }
  })
})

describe('canvasStore — edges', () => {
  beforeEach(() => {
    for (let i = 0; i < 30; i++) {
      useCanvasStore.getState().addNode({ ...componentData, id: `n-${i}` }, { x: i * 100, y: 0 })
    }
  })

  bench('add 20 edges', () => {
    const nodes = useCanvasStore.getState().nodes
    for (let i = 0; i < Math.min(20, nodes.length - 1); i++) {
      useCanvasStore.getState().addEdgeWithType(nodes[i].id, nodes[i + 1].id, 'default')
    }
  })
})

describe('canvasStore — updateNodeProperties', () => {
  beforeEach(() => {
    for (let i = 0; i < 20; i++) {
      useCanvasStore.getState().addNode(componentData, { x: i * 100, y: 0 })
    }
  })

  bench('update properties on 10 nodes', () => {
    const nodes = useCanvasStore.getState().nodes
    for (let i = 0; i < 10 && i < nodes.length; i++) {
      useCanvasStore.getState().updateNodeProperties(nodes[i].id, { key: `value-${i}` })
    }
  })
})

describe('canvasStore — clearCanvas', () => {
  beforeEach(() => {
    for (let i = 0; i < 100; i++) {
      useCanvasStore.getState().addNode(componentData, { x: i * 50, y: i * 50 })
    }
  })

  bench('clear 100 nodes', () => {
    useCanvasStore.getState().clearCanvas()
  })
})
