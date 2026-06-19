import type { ProviderType, CanvasDesign } from '@/types/canvas.types'
import type { DesignTemplate } from '@/api/aiops'
import type { FixSuggestion, Incident } from './aiops.types'

// ─── Provider Display Config ───────────────────────────────

export const PROVIDER_STYLES: Record<ProviderType, { color: string; bg: string; border: string; label: string }> = {
  aws: { color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200', label: 'AWS' },
  azure: { color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', label: 'Azure' },
  gcp: { color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', label: 'GCP' },
  k8s: { color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200', label: 'K8s' },
}

export const CATEGORY_STYLES: Record<string, string> = {
  compute: 'bg-purple-50 text-purple-700 border-purple-200',
  network: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  storage: 'bg-amber-50 text-amber-700 border-amber-200',
  database: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  security: 'bg-red-50 text-red-700 border-red-200',
  serverless: 'bg-violet-50 text-violet-700 border-violet-200',
  monitoring: 'bg-slate-50 text-slate-700 border-slate-200',
  integration: 'bg-blue-50 text-blue-700 border-blue-200',
}

export const CATEGORY_LABELS: Record<string, string> = {
  compute: 'Compute',
  network: 'Rede',
  storage: 'Armazenamento',
  database: 'Banco de Dados',
  security: 'Segurança',
  serverless: 'Serverless',
  monitoring: 'Monitoramento',
  integration: 'Integração',
}

// ─── Severity / Status helpers ─────────────────────────────

export function severityColor(severity: string): string {
  switch (severity) {
    case 'critical': return 'bg-red-500'
    case 'warning': return 'bg-amber-500'
    case 'info': return 'bg-blue-500'
    default: return 'bg-slate-400'
  }
}

export function severityLabel(severity: string): string {
  switch (severity) {
    case 'critical': return 'Crítico'
    case 'warning': return 'Atenção'
    case 'info': return 'Info'
    default: return severity
  }
}

export function statusColor(status: string): string {
  switch (status) {
    case 'OPEN': return 'bg-red-100 text-red-700 border-red-200'
    case 'RESOLVED': return 'bg-green-100 text-green-700 border-green-200'
    default: return 'bg-slate-100 text-slate-600 border-slate-200'
  }
}

// ─── Design Suggestions ───────────────────────────────────

export function getDesignSuggestions(): string[] {
  return [
    'Criar design: VPC + ECS + RDS',
    'Criar design: Kubernetes cluster',
    'Criar design: Serverless API',
  ]
}

// ─── Design Intent Detection ─────────────────────────────

export function detectDesignIntent(text: string): string | null {
  const lower = text.toLowerCase().trim()

  if (lower.includes('vpc') && (lower.includes('ecs') || lower.includes('rds'))) return 'vpc-ecs-rds'
  if (lower.includes('kubernetes') || lower.includes('eks') || lower.includes('k8s')) return 'kubernetes-cluster'
  if (lower.includes('serverless')) return 'serverless-api'
  if (lower.includes('lambda') && lower.includes('api')) return 'serverless-api'
  if (lower.includes('api gateway') && lower.includes('dynamodb')) return 'serverless-api'
  if (lower.includes('criar design') || lower.includes('crie um design') || lower.includes('cria uma infra')) return 'vpc-ecs-rds'
  if (lower.includes('create a design') || lower.includes('gerar design') || lower.includes('novo design')) return 'vpc-ecs-rds'

  return null
}

// ─── Simulated Incident Generation ───────────────────────

function findNodeByType(nodes: any[], resourceType: string): any | null {
  return nodes.find((n) => n.data?.resourceType?.toLowerCase().includes(resourceType.toLowerCase())) || null
}

export function generateSimulatedFix(incidentType: string, nodes: any[]): FixSuggestion | null {
  switch (incidentType) {
    case 'rds-cpu': {
      const rdsNode = findNodeByType(nodes, 'rds')
      if (!rdsNode) return null
      const currentClass = rdsNode.data?.properties?.instance_class || 'db.t3.micro'
      return {
        description: `Escalar instância RDS de ${currentClass} para db.t3.medium para lidar com o aumento de carga`,
        modifications: [{
          nodeId: rdsNode.id,
          nodeLabel: rdsNode.data?.label || 'RDS Instance',
          property: 'instance_class',
          oldValue: currentClass,
          newValue: 'db.t3.medium',
        }],
      }
    }
    case 'ecs-down': {
      const ecsNode = findNodeByType(nodes, 'ecs_service')
      if (!ecsNode) return null
      const currentCount = ecsNode.data?.properties?.desired_count ?? 1
      return {
        description: `Aumentar desired_count de ${currentCount} para 2 para garantir alta disponibilidade do serviço ECS`,
        modifications: [{
          nodeId: ecsNode.id,
          nodeLabel: ecsNode.data?.label || 'ECS Service',
          property: 'desired_count',
          oldValue: currentCount,
          newValue: 2,
        }],
      }
    }
    case 's3-public': {
      const s3Node = findNodeByType(nodes, 's3_bucket')
      if (!s3Node) return null
      return {
        description: 'Adicionar block_public_access = true no bucket S3 para eliminar exposição pública',
        modifications: [{
          nodeId: s3Node.id,
          nodeLabel: s3Node.data?.label || 'S3 Bucket',
          property: 'block_public_access',
          oldValue: s3Node.data?.properties?.block_public_access ?? false,
          newValue: true,
        }],
      }
    }
    default:
      return null
  }
}

export function generateSimulatedIncidents(nodes: any[]): Incident[] {
  const incidents: Incident[] = []
  const now = new Date()

  const rdsNode = findNodeByType(nodes, 'rds')
  if (rdsNode) {
    incidents.push({
      id: 'sim-rds-cpu',
      environmentId: 'default',
      title: 'RDS CPU > 90%',
      description: `A instância RDS "${rdsNode.data?.label || 'RDS PostgreSQL'}" está com utilização de CPU acima de 90% nos últimos 15 minutos. Impacto potencial em latência de consultas.`,
      severity: 'critical',
      status: 'OPEN',
      classification: null,
      suggestedRca: null,
      fixSuggestion: null,
      incidentType: 'rds-cpu',
      detectedAt: new Date(now.getTime() - 5 * 60000).toISOString(),
      resolvedAt: null,
      affectedNodeIds: [rdsNode.id],
    })
  }

  const ecsNode = findNodeByType(nodes, 'ecs_service')
  if (ecsNode) {
    incidents.push({
      id: 'sim-ecs-down',
      environmentId: 'default',
      title: 'ECS Service Down',
      description: `O serviço ECS "${ecsNode.data?.label || 'ECS Service'}" está com 0 tarefas em execução. O serviço foi implantado com 1 tarefa mas falhou ao iniciar.`,
      severity: 'critical',
      status: 'OPEN',
      classification: null,
      suggestedRca: null,
      fixSuggestion: null,
      incidentType: 'ecs-down',
      detectedAt: new Date(now.getTime() - 12 * 60000).toISOString(),
      resolvedAt: null,
      affectedNodeIds: [ecsNode.id],
    })
  }

  const s3Node = findNodeByType(nodes, 's3_bucket')
  if (s3Node) {
    incidents.push({
      id: 'sim-s3-public',
      environmentId: 'default',
      title: 'S3 Bucket Público',
      description: `O bucket S3 "${s3Node.data?.label || 'S3 Assets Bucket'}" está configurado como público. Isso pode expor dados sensíveis a acesso não autorizado.`,
      severity: 'warning',
      status: 'OPEN',
      classification: null,
      suggestedRca: null,
      fixSuggestion: null,
      incidentType: 's3-public',
      detectedAt: new Date(now.getTime() - 60 * 60000).toISOString(),
      resolvedAt: null,
      affectedNodeIds: [s3Node.id],
    })
  }

  if (nodes.length === 0) {
    incidents.push({
      id: 'sim-no-canvas',
      environmentId: 'default',
      title: 'Nenhum Design Ativo',
      description: 'Não há um design de infraestrutura carregado no canvas. Crie ou carregue um design para começar a monitorar.',
      severity: 'info',
      status: 'OPEN',
      classification: null,
      suggestedRca: null,
      fixSuggestion: null,
      incidentType: 'no-canvas',
      detectedAt: new Date(now.getTime() - 120 * 60000).toISOString(),
      resolvedAt: null,
      affectedNodeIds: [],
    })
  }

  return incidents
}

// ─── Design Generation ─────────────────────────────────────

export function generateCanvasDesign(templateId: string, designTemplates: DesignTemplate[], timestampSuffix?: number): { design: CanvasDesign; template: DesignTemplate } | null {
  const template = designTemplates.find(t => t.id === templateId)
  if (!template) return null

  const nodeIdMap = new Map<string, string>()
  const nodes: any[] = []
  const cols = 3
  const nodeW = 224
  const nodeH = 120
  const gapX = 40
  const gapY = 30
  const ts = timestampSuffix ?? Date.now()

  template.resources.forEach((res, i) => {
    const nodeId = `ai-${templateId}-${res.id}-${ts}-${i}`
    nodeIdMap.set(res.id, nodeId)

    const col = i % cols
    const row = Math.floor(i / cols)

    const properties: Record<string, any> = {}
    if (res.resourceType === 'rds_instance') properties.instance_class = 'db.t3.micro'
    if (res.resourceType === 'ecs_service') properties.desired_count = 1
    if (res.resourceType === 's3_bucket') properties.block_public_access = false

    nodes.push({
      id: nodeId,
      type: res.provider,
      position: {
        x: 60 + col * (nodeW + gapX),
        y: 60 + row * (nodeH + gapY),
      },
      width: nodeW,
      height: nodeH,
      data: {
        label: res.label,
        provider: res.provider,
        resourceType: res.resourceType,
        properties,
        validationStatus: 'PENDING' as const,
      },
    })
  })

  const edges: any[] = template.connections.map((conn, i) => ({
    id: `ai-${templateId}-edge-${i}-${ts}`,
    source: nodeIdMap.get(conn.source) || '',
    target: nodeIdMap.get(conn.target) || '',
    type: 'connection' as const,
    data: { edgeType: conn.edgeType },
  }))

  const design: CanvasDesign = {
    id: `ai-design-${crypto.randomUUID()}`,
    name: template.name,
    description: template.description,
    version: 1,
    nodes,
    edges,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  return { design, template }
}
