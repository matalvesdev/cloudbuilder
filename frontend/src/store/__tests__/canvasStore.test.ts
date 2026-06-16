import { describe, it, expect, beforeEach } from 'vitest'
import { useCanvasStore } from '../canvasStore'
import type { CanvasNodeData } from '@/types/canvas.types'

beforeEach(() => {
  useCanvasStore.setState({
    nodes: [],
    edges: [],
    selectedNode: null,
    selectedEdge: null,
    editingNodeId: null,
    canvasId: null,
    canvasName: 'Design sem título',
    canvasVersion: 1,
    undoStack: [],
    redoStack: [],
    generatedCode: [],
  })
})

const mockComponentData = {
  id: 'vpc-id',
  provider: 'aws' as const,
  resourceType: 'aws_vpc',
  displayName: 'VPC',
  category: 'network' as const,
}

const mockPosition = { x: 100, y: 200 }

describe('canvasStore', () => {
  describe('addNode', () => {
    it('adiciona um nó com os dados corretos', () => {
      const store = useCanvasStore.getState()
      store.addNode(mockComponentData, mockPosition)

      const { nodes } = useCanvasStore.getState()
      expect(nodes).toHaveLength(1)
      expect(nodes[0].type).toBe('aws')
      expect(nodes[0].position).toEqual(mockPosition)
      expect(nodes[0].data?.label).toBe('VPC')
      expect(nodes[0].data?.provider).toBe('aws')
      expect(nodes[0].data?.resourceType).toBe('aws_vpc')
    })

    it('gera ID único para cada nó', () => {
      const store = useCanvasStore.getState()
      store.addNode(mockComponentData, { x: 0, y: 0 })
      store.addNode(mockComponentData, { x: 10, y: 10 })

      const { nodes } = useCanvasStore.getState()
      expect(nodes).toHaveLength(2)
      expect(nodes[0].id).not.toBe(nodes[1].id)
    })

    it('empilha histórico após adicionar', () => {
      const store = useCanvasStore.getState()
      expect(store.undoStack).toHaveLength(0)

      store.addNode(mockComponentData, mockPosition)
      expect(useCanvasStore.getState().undoStack).toHaveLength(1)
    })
  })

  describe('removeNode', () => {
    it('remove nó e edges conectadas', () => {
      const store = useCanvasStore.getState()
      store.addNode(mockComponentData, mockPosition)
      const nodeId = useCanvasStore.getState().nodes[0].id

      // Add a second node and connect
      store.addNode(
        { ...mockComponentData, id: 'sg-id', displayName: 'SG', resourceType: 'aws_security_group' },
        { x: 300, y: 200 }
      )
      const secondId = useCanvasStore.getState().nodes[1].id
      useCanvasStore.getState().addEdgeWithType(nodeId, secondId, 'default')

      expect(useCanvasStore.getState().edges).toHaveLength(1)

      // Remove first node
      useCanvasStore.getState().removeNode(nodeId)
      const state = useCanvasStore.getState()
      expect(state.nodes).toHaveLength(1)
      expect(state.edges).toHaveLength(0) // edge removed too
    })

    it('limpa selectedNode se o nó removido estava selecionado', () => {
      const store = useCanvasStore.getState()
      store.addNode(mockComponentData, mockPosition)
      const nodeId = useCanvasStore.getState().nodes[0].id

      useCanvasStore.setState({ selectedNode: nodeId })
      useCanvasStore.getState().removeNode(nodeId)

      expect(useCanvasStore.getState().selectedNode).toBeNull()
    })
  })

  describe('undo / redo', () => {
    it('pushHistory salva checkpoint e undo pop da pilha', () => {
      // pushHistory é chamado APÓS as mutações, salvando o estado pós-mutação
      const store = useCanvasStore.getState()
      store.addNode(mockComponentData, mockPosition)
      expect(useCanvasStore.getState().undoStack).toHaveLength(1)

      // undo() restaura o último checkpoint e move o estado atual para redoStack
      useCanvasStore.getState().undo()
      const afterUndo = useCanvasStore.getState()
      expect(afterUndo.undoStack).toHaveLength(0)
      expect(afterUndo.redoStack).toHaveLength(1)
    })

    it('redo restaura da redoStack', () => {
      const store = useCanvasStore.getState()
      store.addNode(mockComponentData, mockPosition)
      useCanvasStore.getState().undo()
      expect(useCanvasStore.getState().redoStack).toHaveLength(1)

      useCanvasStore.getState().redo()
      const afterRedo = useCanvasStore.getState()
      expect(afterRedo.redoStack).toHaveLength(0)
      expect(afterRedo.undoStack).toHaveLength(1)
    })

    it('não faz nada se undoStack vazio', () => {
      useCanvasStore.getState().undo()
      expect(useCanvasStore.getState().undoStack).toHaveLength(0)
    })

    it('limpa redoStack após nova ação (branches)', () => {
      const store = useCanvasStore.getState()
      store.addNode(mockComponentData, mockPosition)  // undoStack = [state1]
      useCanvasStore.getState().undo()                 // undoStack=[], redoStack=[state1]
      expect(useCanvasStore.getState().redoStack).toHaveLength(1)

      store.addNode(mockComponentData, mockPosition)  // pushHistory limpa redoStack
      expect(useCanvasStore.getState().redoStack).toHaveLength(0)
    })

    it('limita histórico a 100 entradas', () => {
      const store = useCanvasStore.getState()
      for (let i = 0; i < 110; i++) {
        store.pushHistory()
      }
      expect(useCanvasStore.getState().undoStack.length).toBeLessThanOrEqual(100)
    })
  })

  describe('updateNodeProperties', () => {
    it('atualiza propriedades do nó', () => {
      const store = useCanvasStore.getState()
      store.addNode(mockComponentData, mockPosition)
      const nodeId = useCanvasStore.getState().nodes[0].id

      useCanvasStore.getState().updateNodeProperties(nodeId, { cidr: '10.0.0.0/16' })
      expect(useCanvasStore.getState().nodes[0].data?.properties).toEqual({ cidr: '10.0.0.0/16' })
    })

    it('faz merge com propriedades existentes', () => {
      const store = useCanvasStore.getState()
      store.addNode(mockComponentData, mockPosition)
      const nodeId = useCanvasStore.getState().nodes[0].id

      useCanvasStore.getState().updateNodeProperties(nodeId, { cidr: '10.0.0.0/16' })
      useCanvasStore.getState().updateNodeProperties(nodeId, { region: 'us-east-1' })
      expect(useCanvasStore.getState().nodes[0].data?.properties).toEqual({
        cidr: '10.0.0.0/16',
        region: 'us-east-1',
      })
    })
  })

  describe('updateNodeLabel', () => {
    it('altera o label do nó', () => {
      const store = useCanvasStore.getState()
      store.addNode(mockComponentData, mockPosition)
      const nodeId = useCanvasStore.getState().nodes[0].id

      useCanvasStore.getState().updateNodeLabel(nodeId, 'Minha VPC Customizada')
      expect(useCanvasStore.getState().nodes[0].data?.label).toBe('Minha VPC Customizada')
    })
  })

  describe('addEdgeWithType', () => {
    it('adiciona edge com tipo especificado', () => {
      const store = useCanvasStore.getState()
      store.addNode(mockComponentData, mockPosition)
      store.addNode(
        { ...mockComponentData, id: 'sg-id', displayName: 'SG', resourceType: 'aws_security_group' },
        { x: 300, y: 200 }
      )
      const [a, b] = useCanvasStore.getState().nodes

      useCanvasStore.getState().addEdgeWithType(a.id, b.id, 'animated')
      const edges = useCanvasStore.getState().edges
      expect(edges).toHaveLength(1)
      expect(edges[0].source).toBe(a.id)
      expect(edges[0].target).toBe(b.id)
      expect(edges[0].data?.edgeType).toBe('animated')
    })
  })

  describe('toggleLockNode', () => {
    it('alterna locked/data.locked (primeiro toggle: !undefined → true)', () => {
      // Nota: draggable inicial é undefined (ReactFlow default = true)
      // toggleLockNode: draggable = !undefined = true (no change), locked = !undefined = true
      const store = useCanvasStore.getState()
      store.addNode(mockComponentData, mockPosition)
      const nodeId = useCanvasStore.getState().nodes[0].id

      useCanvasStore.getState().toggleLockNode(nodeId)
      const afterFirst = useCanvasStore.getState().nodes[0]
      expect(afterFirst.draggable).toBe(true)  // !undefined = true
      expect(afterFirst.data?.locked).toBe(true)

      // Segundo toggle: true → false
      useCanvasStore.getState().toggleLockNode(nodeId)
      const afterSecond = useCanvasStore.getState().nodes[0]
      expect(afterSecond.draggable).toBe(false)
      expect(afterSecond.data?.locked).toBe(false)
    })
  })

  describe('clearCanvas', () => {
    it('limpa todos os dados do canvas', () => {
      const store = useCanvasStore.getState()
      store.addNode(mockComponentData, mockPosition)
      store.addNode(mockComponentData, { x: 300, y: 200 })
      expect(useCanvasStore.getState().nodes.length).toBeGreaterThan(0)

      useCanvasStore.getState().clearCanvas()
      const state = useCanvasStore.getState()
      expect(state.nodes).toHaveLength(0)
      expect(state.edges).toHaveLength(0)
      expect(state.undoStack).toHaveLength(0)
      expect(state.canvasName).toBe('Design sem título')
      expect(state.canvasVersion).toBe(1)
    })
  })

  describe('duplicateNode', () => {
    it('duplica um nó com offset de 40px', () => {
      const store = useCanvasStore.getState()
      store.addNode(mockComponentData, mockPosition)
      const nodeId = useCanvasStore.getState().nodes[0].id

      useCanvasStore.getState().duplicateNode(nodeId)
      const { nodes } = useCanvasStore.getState()
      expect(nodes).toHaveLength(2)
      expect(nodes[1].position.x).toBe(mockPosition.x + 40)
      expect(nodes[1].position.y).toBe(mockPosition.y + 40)
    })
  })

  describe('alignNodes', () => {
    it('alinha nós selecionados à esquerda', () => {
      const store = useCanvasStore.getState()
      store.addNode(mockComponentData, { x: 100, y: 100 })
      store.addNode(mockComponentData, { x: 200, y: 200 })
      const [a, b] = useCanvasStore.getState().nodes

      // Select both
      useCanvasStore.setState({
        nodes: useCanvasStore.getState().nodes.map((n, i) => ({
          ...n,
          selected: true,
        })) as any,
      })

      useCanvasStore.getState().alignNodes('left')
      const nodes = useCanvasStore.getState().nodes
      expect(nodes[0].position.x).toBe(100)
      expect(nodes[1].position.x).toBe(100) // aligned to minX
    })
  })
})
