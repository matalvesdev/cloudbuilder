import type { Node, Edge } from '@xyflow/react'
import type { CanvasNodeData } from '@/types/canvas.types'

export interface CodeTab {
  id: string
  name: string
  content: string
  language: string
}

/**
 * Generates Terraform HCL code from the current canvas nodes/edges.
 * Produces main.tf, variables.tf, outputs.tf and a provider config.
 */
export function generateTerraformCode(
  nodes: Node<CanvasNodeData>[],
  edges: Edge[]
): CodeTab[] {
  if (nodes.length === 0) return []

  const tabs: CodeTab[] = []

  // ── providers.tf ──
  const providers = new Set(nodes.map((n) => n.data.provider))
  const providerBlock = Array.from(providers)
    .map((p) => {
      switch (p) {
        case 'aws':
          return 'provider "aws" {\n  region = "us-east-1"\n}'
        case 'azure':
          return 'provider "azurerm" {\n  features {}\n}'
        case 'gcp':
          return 'provider "google" {\n  project = "my-project"\n  region  = "us-central1"\n}'
        case 'k8s':
          return 'provider "kubernetes" {\n  config_path = "~/.kube/config"\n}'
        default:
          return ''
      }
    })
    .filter(Boolean)
    .join('\n\n')
  tabs.push({
    id: 'providers.tf',
    name: 'providers.tf',
    content: providerBlock,
    language: 'hcl',
  })

  // ── main.tf ──
  // Build a name for each node (Terraform resource address)
  const nodeNames = new Map<string, string>()
  const nameCount = new Map<string, number>()
  for (const node of nodes) {
    const type = node.data.resourceType
    const baseName = toSnakeCase(node.data.label)
    const count = nameCount.get(baseName) || 0
    nameCount.set(baseName, count + 1)
    const name = count > 0 ? `${baseName}_${count}` : baseName
    nodeNames.set(node.id, name)
  }

  // For each edge, connect source resource reference to target
  const edgesBySource = new Map<string, string[]>()
  const edgesByTarget = new Map<string, string[]>()
  for (const edge of edges) {
    if (!edgesBySource.has(edge.source)) edgesBySource.set(edge.source, [])
    if (!edgesByTarget.has(edge.target)) edgesByTarget.set(edge.target, [])
    edgesBySource.get(edge.source)!.push(edge.target)
    edgesByTarget.get(edge.target)!.push(edge.source)
  }

  const mainBlocks = nodes.map((node) => {
    const terraformType = node.data.resourceType
    const terraformName = nodeNames.get(node.id) || 'resource'
    const props = node.data.properties || {}
    const indent = '  '

    // Build attributes from properties
    const attrLines = propertyList(props).map(([key, val]) => {
      const formatted = formatValue(val)
      return `${indent}${toSnakeCase(key)} = ${formatted}`
    })

    // Build depends_on from incoming edges
    const incoming = edgesByTarget.get(node.id) || []
    if (incoming.length > 0) {
      const depNames = incoming
        .map((srcId) => nodeNames.get(srcId))
        .filter(Boolean)
        .map((n) => `${node.data.resourceType}.${n}`)
      if (depNames.length > 0) {
        attrLines.push(`${indent}depends_on = [${depNames.join(', ')}]`)
      }
    }

    // Add tags if any provider properties exist
    if (node.data.provider === 'aws' && !props.tags) {
      attrLines.push(`${indent}tags = {\n${indent}  Name        = "${node.data.label}"\n${indent}  Environment = "production"\n${indent}}`)
    }

    const attrBody = attrLines.length > 0 ? `\n${attrLines.join('\n')}\n` : ''
    return `resource "${terraformType}" "${terraformName}" {${attrBody}}`
  })

  tabs.push({
    id: 'main.tf',
    name: 'main.tf',
    content: mainBlocks.join('\n\n'),
    language: 'hcl',
  })

  // ── variables.tf ──
  const variableBlock = `variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}`
  tabs.push({
    id: 'variables.tf',
    name: 'variables.tf',
    content: variableBlock,
    language: 'hcl',
  })

  // ── outputs.tf ──
  // Generate outputs for compute resources and databases
  const outputResources = nodes.filter((n) =>
    ['aws_instance', 'google_compute_instance', 'azurerm_virtual_machine'].includes(n.data.resourceType) ||
    n.data.resourceType?.includes('db') ||
    n.data.resourceType?.includes('database')
  )

  if (outputResources.length > 0) {
    const outputBlock = outputResources
      .map((node) => {
        const name = nodeNames.get(node.id) || 'resource'
        const terraformType = node.data.resourceType
        return `output "${name}_id" {
  description = "ID of ${node.data.label}"
  value       = ${terraformType}.${name}.id
}`
      })
      .join('\n\n')
    tabs.push({
      id: 'outputs.tf',
      name: 'outputs.tf',
      content: outputBlock,
      language: 'hcl',
    })
  }

  return tabs
}

function toSnakeCase(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9_ ]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .toLowerCase()
    || 'resource'
}

function propertyList(props: Record<string, any>): [string, any][] {
  // Skip internal/system properties
  const skip = new Set(['Name', 'name', 'tags', 'Tags'])
  return Object.entries(props).filter(([k]) => !skip.has(k))
}

function formatValue(val: any): string {
  if (typeof val === 'string') {
    if (val.startsWith('aws_') || val.startsWith('azurerm_') || val.startsWith('google_')) {
      return val // already a reference
    }
    return `"${val.replace(/"/g, '\\"')}"`
  }
  if (typeof val === 'number') return String(val)
  if (typeof val === 'boolean') return val ? 'true' : 'false'
  if (val === null || val === undefined) return 'null'
  if (Array.isArray(val)) return `[${val.map(formatValue).join(', ')}]`
  return JSON.stringify(val)
}
