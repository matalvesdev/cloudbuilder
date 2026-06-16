import type { Node } from '@xyflow/react'
import type { CanvasNodeData } from '@/types/canvas.types'

type ConnectionValidationResult = {
  valid: boolean
  reason?: string
}

type ConnectionRule = {
  name: string
  check: (source: Node<CanvasNodeData>, target: Node<CanvasNodeData>, sourceHandle?: string) => ConnectionValidationResult
}

const connectionRules: ConnectionRule[] = [
  {
    name: 'self-connection',
    check: (source, target) => {
      if (source.id === target.id) {
        return { valid: false, reason: 'Cannot connect a component to itself' }
      }
      return { valid: true }
    },
  },
  {
    name: 'subnet-ec2',
    check: (source, target) => {
      if (source.data.resourceType === 'aws_subnet' && target.data.resourceType === 'aws_instance') {
        return { valid: true }
      }
      return { valid: true } // non-blocking for now
    },
  },
  {
    name: 'sg-ec2',
    check: (source, target) => {
      if (source.data.resourceType === 'aws_security_group' && target.data.resourceType === 'aws_instance') {
        return { valid: true }
      }
      return { valid: true }
    },
  },
  {
    name: 'vpc-subnet',
    check: (source, target) => {
      if (source.data.resourceType === 'aws_vpc' && target.data.resourceType === 'aws_subnet') {
        return { valid: true }
      }
      return { valid: true }
    },
  },
  {
    name: 'alb-ec2',
    check: (source, target) => {
      if (source.data.resourceType === 'aws_lb' && target.data.resourceType === 'aws_instance') {
        return { valid: true }
      }
      return { valid: true }
    },
  },
]

export function validateConnection(
  source: Node<CanvasNodeData>,
  target: Node<CanvasNodeData>,
  sourceHandle?: string
): ConnectionValidationResult {
  for (const rule of connectionRules) {
    const result = rule.check(source, target, sourceHandle)
    if (!result.valid) return result
  }
  return { valid: true }
}
