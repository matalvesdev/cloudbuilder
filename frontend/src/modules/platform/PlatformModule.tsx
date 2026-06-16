import { useState, useMemo } from 'react'
import {
  Search, X, Box, Network, Database, Container, Cloud,
  BookOpen, Compass, FileCode, ShieldCheck, AlertTriangle,
  CheckCircle, XCircle, Plus, ArrowRight, Info, Layers,
  Globe, Server, HardDrive, Lock, Wrench, Filter, ChevronRight,
  RefreshCw, Eye, Gavel
} from 'lucide-react'
import { nanoid } from 'nanoid'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { ProtectedAction } from '@/components/ProtectedContent'
import { useCanvasStore } from '@/store/canvasStore'
import { usePolicyStore } from '@/store/policyStore'
import { useUiStore } from '@/store/uiStore'
import type { CanvasDesign, ProviderType } from '@/types/canvas.types'
import type { PolicySeverity } from '@/types/policy.types'

interface TemplateNode {
  logicalId: string
  provider: ProviderType
  resourceType: string
  label: string
  row: number
  col: number
  properties: Record<string, any>
}

interface TemplateEdge {
  source: string
  target: string
}

interface TemplateDefinition {
  id: string
  name: string
  description: string
  descriptionLong: string
  category: string
  provider: ProviderType
  complexity: 'beginner' | 'intermediate' | 'advanced'
  estimatedCost: string
  resourceCount: number
  icon: string
  nodes: TemplateNode[]
  edges: TemplateEdge[]
}

const CATEGORY_LABELS: Record<string, string> = {
  web: 'Web',
  api: 'API',
  data: 'Dados',
  infra: 'Infraestrutura',
}

const TEMPLATES: TemplateDefinition[] = [
  {
    id: 'standard-web-app',
    name: 'Aplicação Web Padrão',
    description: 'Stack completa para aplicações web com load balancing, containers e banco relacional',
    descriptionLong: 'Arquitetura cloud-native para aplicações web em produção. Inclui VPC com sub-redes públicas e privadas, Application Load Balancer para distribuição de tráfego, cluster ECS Fargate para containers serverless, RDS PostgreSQL como banco relacional, ElastiCache Redis para cache e sessões, e Security Groups para segmentação de rede.',
    category: 'web',
    provider: 'aws',
    complexity: 'intermediate',
    estimatedCost: '~$450/mês',
    resourceCount: 7,
    icon: '🌐',
    nodes: [
      { logicalId: 'vpc', provider: 'aws', resourceType: 'vpc', label: 'VPC', row: 0, col: 0, properties: { cidr: '10.0.0.0/16', enableDnsHostnames: true, enableDnsSupport: true } },
      { logicalId: 'sg-web', provider: 'aws', resourceType: 'security_group', label: 'SG Web', row: 0, col: 1, properties: { name: 'web-sg', inboundRules: [{ port: 80, cidr: '0.0.0.0/0' }, { port: 443, cidr: '0.0.0.0/0' }] } },
      { logicalId: 'sg-db', provider: 'aws', resourceType: 'security_group', label: 'SG Database', row: 0, col: 2, properties: { name: 'db-sg', inboundRules: [{ port: 5432, cidr: '10.0.0.0/16' }, { port: 6379, cidr: '10.0.0.0/16' }] } },
      { logicalId: 'alb', provider: 'aws', resourceType: 'alb', label: 'ALB', row: 1, col: 0, properties: { scheme: 'internet-facing', port: 443, protocol: 'HTTPS', idleTimeout: 60 } },
      { logicalId: 'ecs-cluster', provider: 'aws', resourceType: 'ecs_cluster', label: 'ECS Cluster', row: 1, col: 1, properties: { name: 'web-cluster', namespace: 'default', capacityProviders: ['FARGATE'] } },
      { logicalId: 'ecs-service', provider: 'aws', resourceType: 'ecs_service', label: 'ECS Service', row: 1, col: 2, properties: { name: 'web-service', desiredCount: 2, cpu: 512, memory: 1024, port: 3000 } },
      { logicalId: 'rds', provider: 'aws', resourceType: 'rds_instance', label: 'RDS PostgreSQL', row: 2, col: 0, properties: { engine: 'postgres', engineVersion: '16', instanceClass: 'db.t3.medium', storage: 100, storageType: 'gp3', multiAz: true, backupRetentionDays: 30 } },
      { logicalId: 'redis', provider: 'aws', resourceType: 'elasticache', label: 'ElastiCache Redis', row: 2, col: 1, properties: { engine: 'redis', version: '7.1', nodeType: 'cache.t3.micro', numCacheNodes: 1, automaticFailoverEnabled: false } },
    ],
    edges: [
      { source: 'vpc', target: 'alb' },
      { source: 'vpc', target: 'ecs-cluster' },
      { source: 'sg-web', target: 'alb' },
      { source: 'sg-web', target: 'ecs-cluster' },
      { source: 'sg-web', target: 'ecs-service' },
      { source: 'sg-db', target: 'rds' },
      { source: 'sg-db', target: 'redis' },
      { source: 'alb', target: 'ecs-cluster' },
      { source: 'ecs-cluster', target: 'ecs-service' },
      { source: 'ecs-service', target: 'rds' },
      { source: 'ecs-service', target: 'redis' },
    ],
  },
  {
    id: 'microservice-api',
    name: 'API Microsserviço',
    description: 'API serverless com API Gateway, Lambda, DynamoDB e monitoramento',
    descriptionLong: 'Arquitetura de microsserviços serverless na AWS. API Gateway como ponto de entrada gerenciado, funções Lambda para lógica de negócio, DynamoDB como banco NoSQL escalável, ECS Fargate para cargas de trabalho stateful, e CloudWatch para logs, métricas e alarmes. Ideal para equipes que desejam escalar sob demanda sem gerenciar servidores.',
    category: 'api',
    provider: 'aws',
    complexity: 'beginner',
    estimatedCost: '~$200/mês',
    resourceCount: 6,
    icon: '⚡',
    nodes: [
      { logicalId: 'vpc', provider: 'aws', resourceType: 'vpc', label: 'VPC', row: 0, col: 0, properties: { cidr: '10.1.0.0/16', enableDnsHostnames: true } },
      { logicalId: 'api-gw', provider: 'aws', resourceType: 'api_gateway', label: 'API Gateway', row: 0, col: 1, properties: { name: 'api-gw', protocol: 'REST', endpointConfiguration: 'REGIONAL', throttlingRateLimit: 10000 } },
      { logicalId: 'lambda', provider: 'aws', resourceType: 'lambda', label: 'Lambda', row: 1, col: 0, properties: { name: 'api-handler', runtime: 'nodejs20', memory: 256, timeout: 30, handler: 'index.handler' } },
      { logicalId: 'fargate', provider: 'aws', resourceType: 'ecs_service', label: 'ECS Fargate', row: 1, col: 1, properties: { name: 'api-worker', desiredCount: 2, cpu: 256, memory: 512, launchType: 'FARGATE' } },
      { logicalId: 'dynamodb', provider: 'aws', resourceType: 'dynamodb', label: 'DynamoDB', row: 2, col: 0, properties: { tableName: 'api-data', billingMode: 'PAY_PER_REQUEST', hashKey: 'id', hashKeyType: 'S' } },
      { logicalId: 'cloudwatch', provider: 'aws', resourceType: 'cloudwatch', label: 'CloudWatch', row: 2, col: 1, properties: { logGroup: '/aws/api', retentionInDays: 30, metricFilters: ['ERROR', 'LATENCY'] } },
    ],
    edges: [
      { source: 'vpc', target: 'api-gw' },
      { source: 'vpc', target: 'fargate' },
      { source: 'api-gw', target: 'lambda' },
      { source: 'api-gw', target: 'fargate' },
      { source: 'lambda', target: 'dynamodb' },
      { source: 'fargate', target: 'dynamodb' },
      { source: 'lambda', target: 'cloudwatch' },
      { source: 'fargate', target: 'cloudwatch' },
    ],
  },
  {
    id: 'data-pipeline',
    name: 'Pipeline de Dados',
    description: 'ETL serverless com S3, Glue, Redshift e filas de processamento',
    descriptionLong: 'Pipeline de dados completa para processamento e análise. Ingere dados no S3, processa com AWS Glue ETL, armazena no Redshift para analytics, usa SQS para desacoplamento de serviços, e funções Lambda como gatilhos para processamento em tempo real. Ideal para equipes de dados e analytics.',
    category: 'data',
    provider: 'aws',
    complexity: 'advanced',
    estimatedCost: '~$800/mês',
    resourceCount: 5,
    icon: '📊',
    nodes: [
      { logicalId: 's3', provider: 'aws', resourceType: 's3_bucket', label: 'S3 Bucket', row: 0, col: 0, properties: { bucketName: 'data-lake', versioning: true, encryption: 'AES256', lifecycleRules: [{ prefix: 'raw/', expiration: 90 }] } },
      { logicalId: 'sqs', provider: 'aws', resourceType: 'sqs', label: 'SQS Queue', row: 0, col: 1, properties: { queueName: 'data-queue', type: 'standard', visibilityTimeout: 120, maxRetries: 3 } },
      { logicalId: 'glue', provider: 'aws', resourceType: 'glue_job', label: 'Glue Job', row: 1, col: 0, properties: { jobName: 'etl-job', glueVersion: '4.0', workerType: 'G.1X', numberOfWorkers: 2, timeout: 60 } },
      { logicalId: 'lambda', provider: 'aws', resourceType: 'lambda', label: 'Lambda Trigger', row: 1, col: 1, properties: { name: 's3-trigger', runtime: 'python3.12', memory: 256, timeout: 60, handler: 'lambda_handler' } },
      { logicalId: 'redshift', provider: 'aws', resourceType: 'redshift', label: 'Redshift', row: 2, col: 0, properties: { clusterId: 'dw-cluster', nodeType: 'dc2.large', numberOfNodes: 2, databaseName: 'dw', masterUser: 'admin' } },
    ],
    edges: [
      { source: 's3', target: 'sqs' },
      { source: 'sqs', target: 'glue' },
      { source: 's3', target: 'lambda' },
      { source: 'lambda', target: 'glue' },
      { source: 'glue', target: 'redshift' },
    ],
  },
  {
    id: 'kubernetes-cluster',
    name: 'Cluster Kubernetes',
    description: 'Cluster EKS gerenciado com node groups, ingress e bancos de dados',
    descriptionLong: 'Cluster Kubernetes completo na AWS usando EKS gerenciado. Inclui VPC com sub-redes para nós do Kubernetes, EKS cluster com control plane gerenciado, node groups auto-scaling, ALB Ingress Controller para roteamento de tráfego, RDS PostgreSQL para dados relacionais, e ElastiCache Redis para cache. Pronto para workloads conteinerizadas em produção.',
    category: 'infra',
    provider: 'k8s',
    complexity: 'advanced',
    estimatedCost: '~$1.200/mês',
    resourceCount: 6,
    icon: '☸️',
    nodes: [
      { logicalId: 'vpc', provider: 'aws', resourceType: 'vpc', label: 'VPC', row: 0, col: 0, properties: { cidr: '10.2.0.0/16', enableDnsHostnames: true, enableDnsSupport: true } },
      { logicalId: 'eks', provider: 'k8s', resourceType: 'eks_cluster', label: 'EKS Cluster', row: 0, col: 1, properties: { name: 'k8s-cluster', version: '1.30', endpointPrivate: false, logging: ['api', 'audit', 'authenticator'] } },
      { logicalId: 'node-group', provider: 'k8s', resourceType: 'node_group', label: 'Node Group', row: 1, col: 0, properties: { name: 'workers', instanceType: 't3.medium', desiredSize: 3, minSize: 2, maxSize: 10, diskSize: 100 } },
      { logicalId: 'ingress', provider: 'k8s', resourceType: 'alb_ingress', label: 'ALB Ingress', row: 1, col: 1, properties: { name: 'k8s-ingress', scheme: 'internet-facing', sslPolicy: 'ELBSecurityPolicy-TLS-1-2' } },
      { logicalId: 'rds', provider: 'aws', resourceType: 'rds_instance', label: 'RDS PostgreSQL', row: 2, col: 0, properties: { engine: 'postgres', engineVersion: '16', instanceClass: 'db.t3.small', storage: 50, storageType: 'gp3', backupRetentionDays: 7 } },
      { logicalId: 'redis', provider: 'aws', resourceType: 'elasticache', label: 'ElastiCache Redis', row: 2, col: 1, properties: { engine: 'redis', version: '7.1', nodeType: 'cache.t3.micro', numCacheNodes: 1 } },
    ],
    edges: [
      { source: 'vpc', target: 'eks' },
      { source: 'vpc', target: 'ingress' },
      { source: 'eks', target: 'node-group' },
      { source: 'ingress', target: 'eks' },
      { source: 'node-group', target: 'rds' },
      { source: 'node-group', target: 'redis' },
    ],
  },
]

const CATEGORIES = [
  { value: 'all', label: 'Todas Categorias', icon: Filter },
  { value: 'web', label: 'Web', icon: Globe },
  { value: 'api', label: 'API', icon: Server },
  { value: 'data', label: 'Dados', icon: Database },
  { value: 'infra', label: 'Infraestrutura', icon: Layers },
]

const PROVIDERS: { value: string; label: string; icon: any }[] = [
  { value: 'all', label: 'Todos Providers', icon: Cloud },
  { value: 'aws', label: 'AWS', icon: Cloud },
  { value: 'k8s', label: 'Kubernetes', icon: Container },
]

const ROW_HEIGHT = 170
const COL_WIDTH = 280
const GRID_START_X = 60
const GRID_START_Y = 60

function buildTemplateDesign(tpl: TemplateDefinition): CanvasDesign {
  const idMap = new Map<string, string>()

  const nodes = tpl.nodes.map((n) => {
    const nodeId = nanoid()
    idMap.set(n.logicalId, nodeId)
    return {
      id: nodeId,
      type: n.provider,
      position: {
        x: GRID_START_X + n.col * COL_WIDTH,
        y: GRID_START_Y + n.row * ROW_HEIGHT,
      },
      width: 224,
      height: 120,
      data: {
        label: n.label,
        componentDefinitionId: `${n.provider}/${n.resourceType}`,
        provider: n.provider,
        resourceType: n.resourceType,
        properties: n.properties,
        validationStatus: 'VALID' as const,
      },
    }
  })

  const edges = tpl.edges.map((e) => ({
    id: nanoid(),
    source: idMap.get(e.source)!,
    target: idMap.get(e.target)!,
    type: 'connection' as const,
    data: { edgeType: 'network' },
  }))

  return {
    id: nanoid(),
    name: tpl.name,
    description: tpl.description,
    version: 1,
    nodes,
    edges,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

const COMPLEXITY_CONFIG = {
  beginner: { label: 'Iniciante', color: 'bg-green-100 text-green-700 border-green-200' },
  intermediate: { label: 'Intermediário', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  advanced: { label: 'Avançado', color: 'bg-red-100 text-red-700 border-red-200' },
} as const

const PROVIDER_CONFIG: Record<string, { label: string; color: string }> = {
  aws: { label: 'AWS', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  azure: { label: 'Azure', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  gcp: { label: 'GCP', color: 'bg-sky-100 text-sky-700 border-sky-200' },
  k8s: { label: 'K8s', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
}

const SEVERITY_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  critical: { label: 'Crítica', color: 'text-red-700 bg-red-100', icon: XCircle },
  high: { label: 'Alta', color: 'text-red-600 bg-red-50', icon: AlertTriangle },
  medium: { label: 'Média', color: 'text-amber-600 bg-amber-50', icon: AlertTriangle },
  low: { label: 'Baixa', color: 'text-slate-600 bg-slate-50', icon: Info },
}

const POLICY_CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
  security: { label: 'Segurança', color: 'bg-red-50 text-red-600' },
  cost: { label: 'Custo', color: 'bg-amber-50 text-amber-600' },
  operations: { label: 'Operações', color: 'bg-blue-50 text-blue-600' },
  compliance: { label: 'Conformidade', color: 'bg-purple-50 text-purple-600' },
}

export function PlatformModule() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterProvider, setFilterProvider] = useState('all')
  const [filterComplexity, setFilterComplexity] = useState('all')
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateDefinition | null>(null)
  const [confirmTemplate, setConfirmTemplate] = useState<TemplateDefinition | null>(null)
  const [expandedPolicy, setExpandedPolicy] = useState<string | null>(null)
  const [policyFilter, setPolicyFilter] = useState<PolicySeverity | 'all'>('all')
  const [showComplianceReport, setShowComplianceReport] = useState(false)

  const loadCanvas = useCanvasStore((s) => s.loadCanvas)
  const setActiveModule = useUiStore((s) => s.setActiveModule)
  const setSelectedNode = useCanvasStore((s) => s.setSelectedNode)
  const canvasNodes = useCanvasStore((s) => s.nodes)

  const policies = usePolicyStore((s) => s.policies)
  const violations = usePolicyStore((s) => s.violations)
  const isChecking = usePolicyStore((s) => s.isChecking)
  const lastCheckAt = usePolicyStore((s) => s.lastCheckAt)
  const checkPolicies = usePolicyStore((s) => s.checkPolicies)
  const applyFix = usePolicyStore((s) => s.applyFix)
  const ignoreViolation = usePolicyStore((s) => s.ignoreViolation)
  const resolveAll = usePolicyStore((s) => s.resolveAll)

  const filteredTemplates = useMemo(() => {
    return TEMPLATES.filter((t) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        if (!t.name.toLowerCase().includes(q) && !t.description.toLowerCase().includes(q)) return false
      }
      if (filterCategory !== 'all' && t.category !== filterCategory) return false
      if (filterProvider !== 'all' && t.provider !== filterProvider) return false
      if (filterComplexity !== 'all' && t.complexity !== filterComplexity) return false
      return true
    })
  }, [searchQuery, filterCategory, filterProvider, filterComplexity])

  const openViolations = useMemo(() => violations.filter((v) => v.status === 'open'), [violations])
  const resolvedViolations = useMemo(() => violations.filter((v) => v.status === 'resolved'), [violations])

  const complianceScore = useMemo(() => {
    if (violations.length === 0) return 100
    const resolved = violations.filter((v) => v.status === 'resolved').length
    const ignored = violations.filter((v) => v.status === 'ignored').length
    return Math.round(((resolved + ignored) / violations.length) * 100)
  }, [violations])

  const policyViolationsMap = useMemo(() => {
    const map: Record<string, typeof violations> = {}
    for (const v of violations) {
      if (!map[v.policyId]) map[v.policyId] = []
      map[v.policyId].push(v)
    }
    return map
  }, [violations])

  const filteredViolations = useMemo(() => {
    return openViolations.filter((v) => {
      if (policyFilter === 'all') return true
      return v.severity === policyFilter
    })
  }, [openViolations, policyFilter])

  function handleUseTemplate(tpl: TemplateDefinition) {
    setConfirmTemplate(tpl)
  }

  function handleConfirmTemplate() {
    if (!confirmTemplate) return
    const design = buildTemplateDesign(confirmTemplate)
    loadCanvas(design)
    setConfirmTemplate(null)
    setSelectedTemplate(null)
    setActiveModule('design')
  }

  function handleCheckPolicies() {
    checkPolicies()
  }

  function handleFixPolicy(policyId: string, violationId: string) {
    applyFix(violationId)
  }

  function handleIgnoreViolation(violationId: string) {
    ignoreViolation(violationId)
  }

  function handleNavigateToResource(resourceId: string) {
    setSelectedNode(resourceId)
    setActiveModule('design')
  }

  function handleVerifyCompliance() {
    checkPolicies()
    setShowComplianceReport(true)
  }

  const summaryItems = [
    { title: 'Itens do Catálogo', value: String(TEMPLATES.length), icon: BookOpen },
    { title: 'Golden Paths', value: String(TEMPLATES.filter((t) => t.category !== 'infra').length), icon: Compass },
    { title: 'Templates', value: String(TEMPLATES.length), icon: FileCode },
    { title: 'Políticas', value: String(policies.length), icon: ShieldCheck },
  ]

  return (
    <div className="h-full flex flex-col bg-[#F8FAFC]">
      <div className="p-6 pb-0 space-y-6 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-brand-navy font-display">Catálogo da Plataforma</h1>
            <p className="text-sm text-slate-400">Golden paths, templates e conformidade</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-slate-100 card-shadow">
            <ShieldCheck className="h-4 w-4 text-brand-navy" />
            <span className="text-sm font-medium text-brand-navy">{complianceScore}% Conformidade</span>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {summaryItems.map((item) => (
            <Card key={item.title} title={item.title} value={item.value} icon={item.icon} />
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 bg-white border-slate-200 rounded-xl"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-navy/20"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>

            <select
              value={filterProvider}
              onChange={(e) => setFilterProvider(e.target.value)}
              className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-navy/20"
            >
              {PROVIDERS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>

            <select
              value={filterComplexity}
              onChange={(e) => setFilterComplexity(e.target.value)}
              className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-navy/20"
            >
              <option value="all">Todas Complexidades</option>
              <option value="beginner">Iniciante</option>
              <option value="intermediate">Intermediário</option>
              <option value="advanced">Avançado</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <ScrollArea className="flex-1 p-6 pt-4">
          {filteredTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <Search className="h-12 w-12 mb-3" />
              <p className="text-sm font-medium">Nenhum template encontrado</p>
              <p className="text-xs">Tente ajustar os filtros ou a busca</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {filteredTemplates.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => setSelectedTemplate(tpl)}
                  className={cn(
                    'relative text-left rounded-2xl border bg-white p-5 transition-all duration-200 card-shadow',
                    selectedTemplate?.id === tpl.id
                      ? 'border-brand-navy ring-2 ring-brand-navy/10'
                      : 'border-slate-100 hover:border-slate-200 hover:shadow-md'
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className="text-3xl shrink-0">{tpl.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-bold text-brand-navy truncate">{tpl.name}</h3>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 capitalize">
                          {CATEGORY_LABELS[tpl.category] || tpl.category}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2 mb-3">{tpl.description}</p>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={cn('text-[10px] px-2 py-0.5 rounded-full border font-medium', PROVIDER_CONFIG[tpl.provider]?.color)}>
                          {PROVIDER_CONFIG[tpl.provider]?.label}
                        </span>
                        <span className={cn('text-[10px] px-2 py-0.5 rounded-full border font-medium', COMPLEXITY_CONFIG[tpl.complexity].color)}>
                          {COMPLEXITY_CONFIG[tpl.complexity].label}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-50">
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Layers className="h-3 w-3" />
                        {tpl.resourceCount} recursos
                      </span>
                      <span className="flex items-center gap-1">
                        <Server className="h-3 w-3" />
                        {tpl.estimatedCost}
                      </span>
                    </div>
                    <ProtectedAction roles={['admin', 'editor']}>
                      <span
                        onClick={(e) => {
                          e.stopPropagation()
                          handleUseTemplate(tpl)
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand-navy text-white text-xs font-medium hover:bg-brand-navy/90 transition-colors cursor-pointer"
                      >
                        <Plus className="h-3 w-3" />
                        Usar Template
                      </span>
                    </ProtectedAction>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>

        {selectedTemplate && (
          <div className="w-80 border-l border-slate-200 bg-white p-5 overflow-y-auto shrink-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-brand-navy">Detalhes do Template</h3>
              <button onClick={() => setSelectedTemplate(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="text-4xl mb-3">{selectedTemplate.icon}</div>
            <h4 className="text-base font-bold text-brand-navy mb-1">{selectedTemplate.name}</h4>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">{selectedTemplate.descriptionLong}</p>

            <div className="flex flex-wrap gap-1.5 mb-4">
              <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium', PROVIDER_CONFIG[selectedTemplate.provider]?.color)}>
                {PROVIDER_CONFIG[selectedTemplate.provider]?.label}
              </span>
              <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium', COMPLEXITY_CONFIG[selectedTemplate.complexity].color)}>
                {COMPLEXITY_CONFIG[selectedTemplate.complexity].label}
              </span>
              <Badge variant="secondary" className="text-[10px] capitalize">
                {CATEGORY_LABELS[selectedTemplate.category] || selectedTemplate.category}
              </Badge>
            </div>

            <div className="space-y-1 mb-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Recursos</span>
                <span className="font-medium text-brand-navy">{selectedTemplate.resourceCount}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Custo Estimado</span>
                <span className="font-medium text-brand-navy">{selectedTemplate.estimatedCost}</span>
              </div>
            </div>

            <div className="mb-4">
              <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Recursos</h5>
              <div className="space-y-1.5">
                {selectedTemplate.nodes.map((n) => (
                  <div key={n.logicalId} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 text-xs">
                    <span className={cn(
                      'w-1.5 h-1.5 rounded-full shrink-0',
                      n.provider === 'aws' ? 'bg-orange-500' : 'bg-indigo-500'
                    )} />
                    <span className="text-brand-navy font-medium">{n.label}</span>
                    <span className="text-slate-400 ml-auto text-[10px]">{n.resourceType.replace(/_/g, ' ')}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Conexões</h5>
              <div className="space-y-1">
                {selectedTemplate.edges.slice(0, 6).map((e, i) => {
                  const src = selectedTemplate.nodes.find((n) => n.logicalId === e.source)
                  const tgt = selectedTemplate.nodes.find((n) => n.logicalId === e.target)
                  return (
                    <div key={i} className="flex items-center gap-1.5 text-xs text-slate-400">
                      <span className="text-brand-navy font-medium truncate max-w-[100px]">{src?.label}</span>
                      <ArrowRight className="h-3 w-3 shrink-0" />
                      <span className="text-brand-navy font-medium truncate max-w-[100px]">{tgt?.label}</span>
                    </div>
                  )
                })}
                {selectedTemplate.edges.length > 6 && (
                  <p className="text-xs text-slate-300 italic">+{selectedTemplate.edges.length - 6} conexões</p>
                )}
              </div>
            </div>

            <ProtectedAction roles={['admin', 'editor']}>
              <Button
                onClick={() => handleUseTemplate(selectedTemplate)}
                className="w-full rounded-xl bg-brand-navy hover:bg-brand-navy/90 text-white h-10 text-sm font-medium"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Usar Template
              </Button>
            </ProtectedAction>
          </div>
        )}
      </div>

      <div className="p-6 pt-0 shrink-0">
        <div className="bg-white rounded-3xl card-shadow border border-slate-100">
          <div className="p-5 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-lime" />
              <h2 className="text-xs font-bold tracking-widest text-slate-400 uppercase">
                Conformidade de Políticas
              </h2>
              <div className="flex items-center gap-2 ml-auto">
                <span className={cn(
                  'text-xs font-medium px-2 py-0.5 rounded-full',
                  complianceScore >= 80 ? 'bg-green-100 text-green-700' : complianceScore >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                )}>
                  {complianceScore}% conforme
                </span>
                <button
                  onClick={handleVerifyCompliance}
                  disabled={isChecking || canvasNodes.length === 0}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                    canvasNodes.length === 0
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-brand-navy text-white hover:bg-brand-navy/90'
                  )}
                >
                  <Gavel className="h-3.5 w-3.5" />
                  Verificar Compliance
                </button>
              </div>
            </div>

            {lastCheckAt && (
              <p className="text-[10px] text-slate-400 mt-1">
                Última verificação: {new Date(lastCheckAt).toLocaleString('pt-BR')}
              </p>
            )}
          </div>

          <div className="px-5 pb-2 flex items-center gap-2">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                {openViolations.length} aberta{openViolations.length !== 1 ? 's' : ''}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                {resolvedViolations.length} resolvida{resolvedViolations.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <select
                value={policyFilter}
                onChange={(e) => setPolicyFilter(e.target.value as PolicySeverity | 'all')}
                className="h-7 px-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-600 focus:outline-none"
              >
                <option value="all">Todas Severidades</option>
                <option value="critical">Crítica</option>
                <option value="high">Alta</option>
                <option value="medium">Média</option>
                <option value="low">Baixa</option>
              </select>
              <button
                onClick={handleCheckPolicies}
                disabled={isChecking || canvasNodes.length === 0}
                className={cn(
                  'inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border',
                  isChecking ? 'bg-slate-50 text-slate-400' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                )}
              >
                <RefreshCw className={cn('h-3 w-3', isChecking && 'animate-spin')} />
                Verificar Agora
              </button>
              {openViolations.length > 0 && (
                <ProtectedAction roles={['admin', 'editor']}>
                  <button
                    onClick={resolveAll}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-green-600 border border-green-200 hover:bg-green-50 transition-all"
                  >
                    <CheckCircle className="h-3 w-3" />
                    Resolver Todas
                  </button>
                </ProtectedAction>
              )}
            </div>
          </div>

          <div className="px-5 pb-2">
            <Progress value={complianceScore} className="h-1.5" />
          </div>

          <div className="space-y-0">
            {violations.length === 0 && lastCheckAt && (
              <div className="px-5 py-6 flex flex-col items-center justify-center text-slate-400">
                <CheckCircle className="h-8 w-8 text-green-500 mb-2" />
                <p className="text-sm font-medium text-green-600">Nenhuma violação encontrada</p>
                <p className="text-xs">Todos os recursos estão em conformidade com as políticas</p>
              </div>
            )}

            {violations.length === 0 && !lastCheckAt && (
              <div className="px-5 py-6 flex flex-col items-center justify-center text-slate-400">
                <ShieldCheck className="h-8 w-8 mb-2" />
                <p className="text-sm font-medium">Nenhuma verificação realizada</p>
                <p className="text-xs">Clique em "Verificar Agora" para analisar o canvas atual</p>
              </div>
            )}

            {violations.length > 0 && policies.map((policy) => {
              const policyVios = policyViolationsMap[policy.id] || []
              const openCount = policyVios.filter((v) => v.status === 'open').length
              const resolvedCount = policyVios.filter((v) => v.status === 'resolved').length

              if (openCount === 0 && expandedPolicy !== policy.id) return null

              return (
                <div key={policy.id} className="border-t border-slate-50">
                  <button
                    onClick={() => setExpandedPolicy(expandedPolicy === policy.id ? null : policy.id)}
                    className="w-full flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors"
                  >
                    <div
                      className={cn(
                        'w-2 h-2 rounded-full shrink-0',
                        openCount === 0 ? 'bg-green-500' : 'bg-red-500'
                      )}
                    />
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-brand-navy truncate">{policy.name}</p>
                        <span className={cn(
                          'text-[10px] px-1.5 py-0.5 rounded font-medium',
                          POLICY_CATEGORY_CONFIG[policy.category]?.color
                        )}>
                          {POLICY_CATEGORY_CONFIG[policy.category]?.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 truncate">{policy.description}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {openCount > 0 && (
                        <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-medium">
                          {openCount} violação{openCount !== 1 ? 'ões' : ''}
                        </span>
                      )}
                      {resolvedCount > 0 && (
                        <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-medium">
                          {resolvedCount} resolvida{resolvedCount !== 1 ? 's' : ''}
                        </span>
                      )}
                      <span className="text-xs text-slate-400">{policyVios.length} itens</span>
                      <ChevronRight className={cn(
                        'h-4 w-4 text-slate-400 transition-transform',
                        expandedPolicy === policy.id && 'rotate-90'
                      )} />
                    </div>
                  </button>

                  {expandedPolicy === policy.id && policyVios.length > 0 && (
                    <div className="px-5 pb-3 space-y-2">
                      {policyVios
                        .filter((v) => policyFilter === 'all' || v.severity === policyFilter)
                        .map((v) => {
                          const SevIcon = SEVERITY_CONFIG[v.severity]?.icon || AlertTriangle
                          return (
                            <div
                              key={v.id}
                              className={cn(
                                'rounded-xl border p-3 transition-all',
                                v.status === 'resolved' ? 'border-green-200 bg-green-50' :
                                v.status === 'ignored' ? 'border-slate-200 bg-slate-50' :
                                'border-red-100 bg-red-50/50'
                              )}
                            >
                              <div className="flex items-start gap-2">
                                {v.status === 'resolved' ? (
                                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                ) : v.status === 'ignored' ? (
                                  <Info className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                                ) : (
                                  <SevIcon className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-medium text-brand-navy">{v.resourceName}</span>
                                    <span className={cn(
                                      'text-[10px] px-1.5 py-0.5 rounded font-medium',
                                      SEVERITY_CONFIG[v.severity]?.color
                                    )}>
                                      {SEVERITY_CONFIG[v.severity]?.label}
                                    </span>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-slate-100 text-slate-500">
                                      {v.resourceType.replace(/_/g, ' ')}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-500 mb-2">{v.description}</p>
                                  <div className="flex items-center gap-2">
                                    {v.status === 'open' && (
                                      <>
                                    {v.autoFixAvailable && (
                                      <ProtectedAction roles={['admin', 'editor']}>
                                        <button
                                          onClick={() => handleFixPolicy(policy.id, v.id)}
                                          className="flex items-center gap-1 text-xs font-medium text-brand-navy hover:text-brand-navy/70 transition-colors"
                                        >
                                          <Wrench className="h-3 w-3" />
                                          Corrigir
                                        </button>
                                      </ProtectedAction>
                                    )}
                                    <ProtectedAction roles={['admin', 'editor']}>
                                      <button
                                        onClick={() => handleIgnoreViolation(v.id)}
                                        className="flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors"
                                      >
                                        <X className="h-3 w-3" />
                                        Ignorar
                                      </button>
                                    </ProtectedAction>
                                        <button
                                          onClick={() => handleNavigateToResource(v.resourceId)}
                                          className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors ml-auto"
                                        >
                                          <Eye className="h-3 w-3" />
                                          Ver no Canvas
                                        </button>
                                      </>
                                    )}
                                    {v.status === 'resolved' && (
                                      <p className="flex items-center gap-1 text-xs text-green-600 font-medium">
                                        <CheckCircle className="h-3 w-3" />
                                        Violação corrigida automaticamente
                                      </p>
                                    )}
                                    {v.status === 'ignored' && (
                                      <p className="flex items-center gap-1 text-xs text-slate-400 font-medium">
                                        <Info className="h-3 w-3" />
                                        Violação ignorada
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  )}

                  {expandedPolicy === policy.id && policyVios.length === 0 && (
                    <div className="px-5 pb-3 flex items-center gap-2 text-xs text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      Nenhuma violação encontrada
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <Dialog open={!!confirmTemplate} onOpenChange={(open) => !open && setConfirmTemplate(null)}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-brand-navy">
              <span className="text-2xl">{confirmTemplate?.icon}</span>
              {confirmTemplate?.name}
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              Este template criará os seguintes recursos no canvas de design:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 my-2">
            {confirmTemplate?.nodes.map((n) => (
              <div key={n.logicalId} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-50 border border-slate-100">
                <div className={cn(
                  'w-2 h-2 rounded-full shrink-0',
                  n.provider === 'aws' ? 'bg-orange-500' : n.provider === 'k8s' ? 'bg-indigo-500' : 'bg-blue-500'
                )} />
                <span className="text-sm font-medium text-brand-navy">{n.label}</span>
                <span className="text-xs text-slate-400 ml-auto">{n.resourceType.replace(/_/g, ' ')}</span>
              </div>
            ))}
          </div>

          {confirmTemplate && (
            <div className="flex items-center justify-between px-1 text-xs text-slate-400">
              <span className="flex items-center gap-1"><Layers className="h-3 w-3" /> {confirmTemplate.resourceCount} recursos</span>
              <span className="flex items-center gap-1"><Server className="h-3 w-3" /> Custo: {confirmTemplate.estimatedCost}</span>
              <span className={cn(
                'px-2 py-0.5 rounded-full border font-medium text-[10px]',
                COMPLEXITY_CONFIG[confirmTemplate.complexity].color
              )}>
                {COMPLEXITY_CONFIG[confirmTemplate.complexity].label}
              </span>
            </div>
          )}

          <div className="flex gap-3 justify-end mt-2">
            <Button
              variant="outline"
              onClick={() => setConfirmTemplate(null)}
              className="rounded-xl"
            >
              Cancelar
            </Button>
            <ProtectedAction roles={['admin', 'editor']}>
              <Button
                onClick={handleConfirmTemplate}
                className="rounded-xl bg-brand-navy hover:bg-brand-navy/90 text-white"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Criar Design
              </Button>
            </ProtectedAction>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
