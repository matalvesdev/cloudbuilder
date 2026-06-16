import { create } from 'zustand'
import { nanoid } from 'nanoid'
import type { Node } from '@xyflow/react'
import type { CanvasNodeData } from '@/types/canvas.types'
import type { Policy, PolicyViolation, PolicyCategory, PolicySeverity } from '@/types/policy.types'
import { useCanvasStore } from './canvasStore'

function detectResourceType(resourceType: string): 'storage' | 'compute' | 'network' | 'database' | 'security' | null {
  const storageTypes = ['s3_bucket', 'ebs_volume', 'efs_file_system']
  const computeTypes = ['ec2_instance', 'ecs_service', 'lambda', 'node_group']
  const networkTypes = ['vpc', 'alb', 'security_group', 'api_gateway', 'alb_ingress']
  const databaseTypes = ['rds_instance', 'dynamodb', 'redshift', 'elasticache']
  const securityTypes = ['security_group', 'iam_role', 'kms_key']
  if (storageTypes.includes(resourceType)) return 'storage'
  if (computeTypes.includes(resourceType)) return 'compute'
  if (networkTypes.includes(resourceType)) return 'network'
  if (databaseTypes.includes(resourceType)) return 'database'
  if (securityTypes.includes(resourceType)) return 'security'
  return null
}

function hasTag(node: Node<CanvasNodeData>, tag: string): boolean {
  const props = node.data.properties
  if (!props) return false
  if (props.tags && typeof props.tags === 'object' && tag in props.tags) return true
  if (Array.isArray(props.tags)) return props.tags.some((t: any) => typeof t === 'string' ? t === tag : t.key === tag || t.Key === tag)
  return false
}

const BUILT_IN_POLICIES: Policy[] = [
  {
    id: 'encryption',
    name: 'Criptografia em Repouso',
    description: 'Todos os recursos de armazenamento devem ter criptografia habilitada',
    category: 'security',
    severity: 'critical',
    resourceTypes: ['s3_bucket', 'rds_instance', 'elasticache', 'dynamodb', 'redshift', 'ebs_volume', 'efs_file_system'],
    rule: 'storageEncrypted === true || encryption !== undefined || atRestEncryptionEnabled === true',
    autoFixable: true,
  },
  {
    id: 'iam-principle',
    name: 'IAM Menor Privilégio',
    description: 'Security groups não devem permitir acesso 0.0.0.0/0 na porta 22 (SSH)',
    category: 'security',
    severity: 'critical',
    resourceTypes: ['security_group'],
    rule: 'inboundRules não contém {port:22, cidr:"0.0.0.0/0"}',
    autoFixable: true,
  },
  {
    id: 'tagging',
    name: 'Tagging Obrigatório',
    description: 'Todos os recursos devem ter as tags Environment e CostCenter',
    category: 'compliance',
    severity: 'high',
    resourceTypes: ['*'],
    rule: 'tags contém Environment e CostCenter',
    autoFixable: true,
  },
  {
    id: 'backup',
    name: 'Backup Configurado',
    description: 'Instâncias RDS devem ter retention de backup maior que 0',
    category: 'operations',
    severity: 'high',
    resourceTypes: ['rds_instance'],
    rule: 'backupRetentionDays > 0',
    autoFixable: true,
  },
  {
    id: 'cost-control',
    name: 'Custo Controlado',
    description: 'Instâncias EC2 devem ser da família t3.* (não t2 ou m5)',
    category: 'cost',
    severity: 'medium',
    resourceTypes: ['ec2_instance', 'rds_instance', 'elasticache', 'node_group'],
    rule: 'instanceClass/instanceType/nodeType deve ser t3.* (não t2 nem m5)',
    autoFixable: true,
  },
]

function isStorageResource(resourceType: string): boolean {
  return ['s3_bucket', 'rds_instance', 'elasticache', 'dynamodb', 'redshift', 'ebs_volume', 'efs_file_system'].includes(resourceType)
}

function isSecurityGroup(resourceType: string): boolean {
  return resourceType === 'security_group'
}

function isRds(resourceType: string): boolean {
  return resourceType === 'rds_instance'
}

function isInstanceTypeResource(resourceType: string): boolean {
  return ['ec2_instance', 'rds_instance', 'elasticache', 'node_group'].includes(resourceType)
}

type InstanceProperty = 'instanceClass' | 'instanceType' | 'nodeType'

function getInstanceProperty(node: Node<CanvasNodeData>): { key: InstanceProperty; value: string } | null {
  const props = node.data.properties
  if (!props) return null
  if (props.instanceClass) return { key: 'instanceClass', value: props.instanceClass as string }
  if (props.instanceType) return { key: 'instanceType', value: props.instanceType as string }
  if (props.nodeType) return { key: 'nodeType', value: props.nodeType as string }
  return null
}

function isNonCompliantInstance(instanceValue: string): boolean {
  const clean = instanceValue.replace(/^db\./, '')
  return clean.startsWith('t2.') || clean.startsWith('m5.') || clean.startsWith('dc2.')
}

interface FilterState {
  category: PolicyCategory | 'all'
  severity: PolicySeverity | 'all'
  status: 'all' | 'open' | 'resolved' | 'ignored'
}

interface PolicyState {
  policies: Policy[]
  violations: PolicyViolation[]
  activeFilters: FilterState
  isChecking: boolean
  lastCheckAt: string | null

  checkPolicies: () => PolicyViolation[]
  applyFix: (violationId: string) => boolean
  ignoreViolation: (violationId: string) => void
  resolveAll: () => void
  setFilter: (filter: Partial<FilterState>) => void
  clearViolations: () => void
}

export const usePolicyStore = create<PolicyState>((set, get) => ({
  policies: BUILT_IN_POLICIES,
  violations: [],
  activeFilters: { category: 'all', severity: 'all', status: 'all' },
  isChecking: false,
  lastCheckAt: null,

  checkPolicies: () => {
    set({ isChecking: true })
    const canvasNodes = useCanvasStore.getState().nodes
    const newViolations: PolicyViolation[] = []

    for (const policy of BUILT_IN_POLICIES) {
      for (const node of canvasNodes) {
        const resourceType = node.data.resourceType
        if (policy.resourceTypes[0] !== '*' && !policy.resourceTypes.includes(resourceType)) continue

        let violated = false
        let description = ''
        let autoFixAvailable = policy.autoFixable

        const props = node.data.properties || {}

        if (isStorageResource(resourceType) && policy.id === 'encryption') {
          if (resourceType === 's3_bucket' && !props.encryption) {
            violated = true
            description = 'Bucket S3 sem criptografia habilitada'
          } else if (resourceType === 'rds_instance' && !props.storageEncrypted) {
            violated = true
            description = 'Instância RDS sem criptografia de armazenamento'
          } else if (resourceType === 'elasticache' && !props.atRestEncryptionEnabled) {
            violated = true
            description = 'Cluster ElastiCache sem criptografia em repouso'
          } else if (resourceType === 'dynamodb' && !props.sseSpecification?.enabled && !props.sseEnabled) {
            violated = true
            description = 'Tabela DynamoDB sem criptografia SSE'
          } else if (resourceType === 'redshift' && !props.encrypted) {
            violated = true
            description = 'Cluster Redshift sem criptografia'
          }
        }

        if (isSecurityGroup(resourceType) && policy.id === 'iam-principle') {
          const rules = props.inboundRules as Array<{ port?: number; cidr?: string; fromPort?: number; toPort?: number }> | undefined
          if (rules) {
            const openSsh = rules.some(
              (r) => (r.port === 22 || r.fromPort === 22) && r.cidr === '0.0.0.0/0'
            )
            if (openSsh) {
              violated = true
              description = 'Porta SSH (22) aberta para 0.0.0.0/0'
            }
          }
        }

        if (policy.id === 'tagging') {
          if (!hasTag(node, 'Environment') || !hasTag(node, 'CostCenter')) {
            violated = true
            const missing = []
            if (!hasTag(node, 'Environment')) missing.push('Environment')
            if (!hasTag(node, 'CostCenter')) missing.push('CostCenter')
            description = `Tags obrigatórias ausentes: ${missing.join(', ')}`
          }
        }

        if (isRds(resourceType) && policy.id === 'backup') {
          const retention = props.backupRetentionDays
          if (retention === undefined || retention === null || retention <= 0) {
            violated = true
            description = 'Backup retention não configurado ou igual a 0'
          }
        }

        if (isInstanceTypeResource(resourceType) && policy.id === 'cost-control') {
          const inst = getInstanceProperty(node)
          if (inst && isNonCompliantInstance(inst.value)) {
            violated = true
            description = `Tipo de instância ${inst.value} não pertence à família t3.* (custos elevados)`
          }
        }

        if (violated) {
          newViolations.push({
            id: nanoid(),
            policyId: policy.id,
            resourceId: node.id,
            resourceName: node.data.label || resourceType,
            resourceType,
            description,
            severity: policy.severity,
            detectedAt: new Date().toISOString(),
            status: 'open',
            autoFixAvailable,
          })
        }
      }
    }

    set({ violations: newViolations, isChecking: false, lastCheckAt: new Date().toISOString() })
    return newViolations
  },

  applyFix: (violationId: string) => {
    const violation = get().violations.find((v) => v.id === violationId)
    if (!violation || violation.status !== 'open') return false

    const policy = BUILT_IN_POLICIES.find((p) => p.id === violation.policyId)
    if (!policy || !policy.autoFixable) return false

    const canvasStore = useCanvasStore.getState()
    const node = canvasStore.nodes.find((n) => n.id === violation.resourceId)
    if (!node) return false

    const resourceType = node.data.resourceType
    const props = { ...node.data.properties }

    if (policy.id === 'encryption') {
      if (resourceType === 's3_bucket') props.encryption = 'AES256'
      else if (resourceType === 'rds_instance') props.storageEncrypted = true
      else if (resourceType === 'elasticache') props.atRestEncryptionEnabled = true
      else if (resourceType === 'dynamodb') props.sseEnabled = true
      else if (resourceType === 'redshift') props.encrypted = true
    }

    if (policy.id === 'iam-principle') {
      const rules = (props.inboundRules as Array<any> || []).filter(
        (r: any) => !((r.port === 22 || r.fromPort === 22) && r.cidr === '0.0.0.0/0')
      )
      props.inboundRules = rules
    }

    if (policy.id === 'tagging') {
      const tags = { ...(props.tags || {}), Environment: 'production', CostCenter: 'shared' }
      props.tags = tags
    }

    if (policy.id === 'backup') {
      props.backupRetentionDays = 30
    }

    if (policy.id === 'cost-control') {
      const inst = getInstanceProperty(node)
      if (inst) {
        const newVal = inst.value.replace(/^db\./, 'db.t3.').replace(/^t2\./, 't3.').replace(/^m5\./, 't3.').replace(/^dc2\./, 't3.')
        props[inst.key] = newVal
      }
    }

    canvasStore.updateNodeProperties(violation.resourceId, props)

    set({
      violations: get().violations.map((v) =>
        v.id === violationId ? { ...v, status: 'resolved' as const } : v
      ),
    })

    return true
  },

  ignoreViolation: (violationId: string) => {
    set({
      violations: get().violations.map((v) =>
        v.id === violationId ? { ...v, status: 'ignored' as const } : v
      ),
    })
  },

  resolveAll: () => {
    set({
      violations: get().violations.map((v) =>
        v.status === 'open' ? { ...v, status: 'resolved' as const } : v
      ),
    })
  },

  setFilter: (filter) => {
    set({ activeFilters: { ...get().activeFilters, ...filter } })
  },

  clearViolations: () => {
    set({ violations: [] })
  },
}))
