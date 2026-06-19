import { useMemo, useState, useEffect } from 'react'
import { DollarSign, X, Server, HardDrive, Database, Globe, Cloud, HelpCircle } from 'lucide-react'
import { useCanvasStore } from '@/store/canvasStore'
import { cn } from '@/lib/utils'
import type { ProviderType, CanvasNodeData } from '@/types/canvas.types'

interface ResourceCost {
  resourceType: string
  displayName: string
  estimatedMonthly: number
  quantity: number
}

interface ProviderCostSummary {
  provider: ProviderType
  totalMonthly: number
  resources: ResourceCost[]
}

// ─── Mock pricing database (simplified per-resource estimates in USD/mo) ──
const MOCK_PRICING: Partial<Record<string, number>> = {
  // AWS
  'ec2-instance': 35,
  'ec2-instance-t3-medium': 30,
  'ec2-instance-t3-large': 60,
  'ec2-instance-t3-xlarge': 120,
  'ec2-instance-m5-large': 70,
  'ec2-instance-m5-xlarge': 140,
  'vpc': 0,
  'subnet': 0,
  'security-group': 0,
  'internet-gateway': 0,
  'nat-gateway': 32,
  's3-bucket': 2.5,
  's3-bucket-standard': 2.5,
  'rds-instance': 50,
  'rds-instance-db-t3-medium': 50,
  'rds-instance-db-t3-large': 100,
  'lambda-function': 1,
  'elb': 20,
  'alb': 22,
  'ecs-cluster': 0,
  'ecs-service': 0,
  'ecs-task-definition': 0,
  'ecr-repository': 0.1,
  'eks-cluster': 73,
  'cloudfront': 8.5,
  'route53-zone': 0.5,
  'dynamodb-table': 25,
  'elasticache-cluster': 30,
  'kms-key': 1,
  'iam-role': 0,
  'sns-topic': 0,
  'sqs-queue': 0,
  'cloudwatch-log-group': 0,
  'api-gateway': 3.5,
  'step-function': 1,
  'codepipeline': 1,
  'codebuild-project': 1,

  // Azure
  'virtual-machine': 40,
  'vm-standard-b2s': 35,
  'vm-standard-d2s-v3': 70,
  'vm-standard-d4s-v3': 140,
  'virtual-network': 0,
  'network-security-group': 0,
  'public-ip': 3.5,
  'storage-account': 1.5,
  'blob-container': 0,
  'sql-database': 55,
  'sql-database-s0': 15,
  'sql-database-s1': 30,
  'sql-database-s2': 75,
  'function-app': 1,
  'app-service-plan': 20,
  'app-service': 20,
  'aks-cluster': 75,
  'key-vault': 0.5,
  'resource-group': 0,
  'log-analytics-workspace': 2,
  'application-insights': 0,
  'load-balancer': 20,
  'container-registry': 5,
  'cosmosdb-account': 30,
  'redis-cache': 30,

  // GCP
  'compute-instance': 35,
  'compute-instance-n1-standard-2': 50,
  'compute-instance-n1-standard-4': 100,
  'compute-instance-e2-medium': 25,
  'compute-instance-e2-standard-2': 50,
  'vpc-network': 0,
  'subnetwork': 0,
  'firewall-rule': 0,
  'cloud-router': 5,
  'cloud-storage-bucket': 2,
  'cloud-sql-instance': 50,
  'cloud-functions': 1,
  'cloud-run': 5,
  'gke-cluster': 73,
  'cloud-dns-zone': 0.2,
  'bigquery-dataset': 5,
  'pubsub-topic': 0,
  'iam-custom-role': 0,
  'cloud-armor': 5,
  'secret-manager': 0.5,
  'cloud-cdn': 8,

  // K8s
  'namespace': 0,
  'deployment': 0,
  'service': 0,
  'configmap': 0,
  'secret': 0,
  'persistent-volume-claim': 5,
  'ingress': 0,
  'horizontal-pod-autoscaler': 0,
  'cluster-role': 0,
  'service-account': 0,
}

const PROVIDER_LABELS: Record<ProviderType, string> = {
  aws: 'AWS',
  azure: 'Azure',
  gcp: 'GCP',
  k8s: 'Kubernetes',
}

const PROVIDER_ICONS: Record<ProviderType, typeof Cloud> = {
  aws: Server,
  azure: Globe,
  gcp: Database,
  k8s: HardDrive,
}

const PROVIDER_COLORS: Record<ProviderType, string> = {
  aws: 'text-orange-500 bg-orange-50 border-orange-200',
  azure: 'text-blue-500 bg-blue-50 border-blue-200',
  gcp: 'text-green-500 bg-green-50 border-green-200',
  k8s: 'text-indigo-500 bg-indigo-50 border-indigo-200',
}

export function getResourcePrice(resourceType: string): number {
  // Exact match first
  if (MOCK_PRICING[resourceType] !== undefined) return MOCK_PRICING[resourceType]!

  // Prefix match for known resource families
  const prefixes: [string, number][] = [
    ['ec2-instance', 35],
    ['vm-standard', 40],
    ['compute-instance', 35],
    ['rds-instance', 50],
    ['sqs-queue', 0],
    ['sns-topic', 0],
    ['iam-role', 0],
    ['cloudwatch', 0],
    ['ecs-', 0],
    ['eks-', 73],
    ['aks-', 75],
    ['gke-', 73],
    ['lambda-', 1],
    ['function-app', 1],
    ['cloud-functions', 1],
    ['cloud-run', 5],
    ['sql-database', 55],
    ['cloud-sql', 50],
    ['s3-', 2.5],
    ['storage-account', 1.5],
    ['cloud-storage', 2],
    ['bigquery', 5],
    ['dynamodb', 25],
    ['cosmosdb', 30],
    ['redis-cache', 30],
    ['elasticache', 30],
    ['load-balancer', 20],
    ['cloudfront', 8.5],
    ['api-gateway', 3.5],
    ['nat-gateway', 32],
    ['key-vault', 0.5],
    ['kms-key', 1],
    ['vpc', 0],
    ['virtual-network', 0],
    ['subnet', 0],
    ['subnetwork', 0],
    ['security-group', 0],
    ['firewall', 0],
    ['ingress', 0],
    ['namespace', 0],
    ['deployment', 0],
    ['service', 0],
    ['configmap', 0],
    ['secret', 0],
    ['persistent-volume', 5],
    ['public-ip', 3.5],
    ['cloud-router', 5],
    ['route53', 0.5],
    ['cloud-dns', 0.2],
    ['cloud-cdn', 8],
    ['cloud-armor', 5],
    ['secret-manager', 0.5],
    ['container-registry', 5],
    ['ecr-repository', 0.1],
    ['app-service-plan', 20],
    ['app-service', 20],
    ['log-analytics', 2],
    ['application-insights', 0],
    ['monitoring', 0],
    ['codepipeline', 1],
    ['codebuild', 1],
    ['step-function', 1],
    ['pubsub', 0],
    ['resource-group', 0],
    ['iam-custom', 0],
    ['cluster-role', 0],
    ['service-account', 0],
  ]

  for (const [prefix, price] of prefixes) {
    if (resourceType.startsWith(prefix)) return price
  }

  // Unknown resource — charge a minimal fee
  return 2
}

interface CostEstimationBarProps {
  onClose: () => void
}

export function CostEstimationBar({ onClose }: CostEstimationBarProps) {
  const nodes = useCanvasStore((s) => s.nodes)
  const [lastCalcTime, setLastCalcTime] = useState(Date.now())

  useEffect(() => {
    setLastCalcTime(Date.now())
  }, [nodes.length])

  const summary = useMemo(() => {
    const providerMap = new Map<ProviderType, ProviderCostSummary>()

    for (const node of nodes) {
      const data = node.data as CanvasNodeData
      const provider = data.provider
      const resourceType = data.resourceType
      const displayName = data.label || resourceType

      if (!providerMap.has(provider)) {
        providerMap.set(provider, {
          provider,
          totalMonthly: 0,
          resources: [],
        })
      }

      const pSummary = providerMap.get(provider)!
      const price = getResourcePrice(resourceType)

      // Check if this resource type already exists in the summary
      const existing = pSummary.resources.find(
        (r) => r.resourceType === resourceType && r.displayName === displayName
      )

      if (existing) {
        existing.quantity++
        existing.estimatedMonthly += price
      } else {
        pSummary.resources.push({
          resourceType,
          displayName,
          estimatedMonthly: price,
          quantity: 1,
        })
      }

      pSummary.totalMonthly += price
    }

    return Array.from(providerMap.values()).sort(
      (a, b) => b.totalMonthly - a.totalMonthly
    )
  }, [nodes])

  const grandTotal = useMemo(
    () => summary.reduce((acc, p) => acc + p.totalMonthly, 0),
    [summary]
  )

  if (nodes.length === 0) {
    return (
      <div className="bg-white border-l border-slate-100 flex items-center justify-center text-sm text-slate-400 p-4">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-ice-blue flex items-center justify-center mx-auto">
            <DollarSign className="w-6 h-6 text-brand-navy" />
          </div>
          <div className="text-xs text-slate-400 max-w-[160px]">
            Adicione componentes ao canvas para estimar custos
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border-l border-slate-100 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-ice-blue p-1.5">
            <DollarSign className="w-4 h-4 text-brand-navy" />
          </div>
          <span className="text-sm font-semibold text-brand-navy font-display">
            Estimativa de Custos
          </span>
        </div>
        <button
          onClick={onClose}
          className="h-6 w-6 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-brand-navy transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Grand total */}
      <div className="px-4 py-3 bg-gradient-to-r from-brand-navy to-blue-900">
        <div className="text-[10px] text-white/60 uppercase tracking-wider font-medium">
          Custo mensal estimado
        </div>
        <div className="text-2xl font-bold text-white font-display mt-0.5">
          ${grandTotal.toFixed(2)}
          <span className="text-sm font-normal text-white/60 ml-1">/mês</span>
        </div>
      </div>

      {/* Provider breakdown */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {summary.map((provider) => {
          const Icon = PROVIDER_ICONS[provider.provider]
          return (
            <div
              key={provider.provider}
              className="rounded-xl border border-slate-200 overflow-hidden"
            >
              {/* Provider header */}
              <div className={cn(
                'flex items-center justify-between px-3 py-2 border-b',
                PROVIDER_COLORS[provider.provider].split(' ').slice(1).join(' ')
              )}>
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-bold text-slate-800">
                    {PROVIDER_LABELS[provider.provider]}
                  </span>
                </div>
                <span className="text-sm font-bold text-slate-800">
                  ${provider.totalMonthly.toFixed(2)}
                </span>
              </div>

              {/* Resource list */}
              <div className="divide-y divide-slate-50">
                {provider.resources.map((resource, idx) => (
                  <div
                    key={`${resource.resourceType}-${idx}`}
                    className="flex items-center justify-between px-3 py-2 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-1.5 h-1.5 rounded-full shrink-0 bg-slate-300" />
                      <div className="min-w-0">
                        <div className="text-xs text-slate-700 truncate">
                          {resource.displayName}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {resource.resourceType}
                          {resource.quantity > 1 && (
                            <span className="ml-1">×{resource.quantity}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-slate-600 shrink-0 ml-2">
                      ${resource.estimatedMonthly.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer note */}
      <div className="px-4 py-2 border-t border-slate-100 space-y-1">
        <div className="flex items-start gap-1.5">
          <HelpCircle className="w-3 h-3 text-slate-400 mt-0.5 shrink-0" />
          <p className="text-[10px] text-slate-400 leading-relaxed">
            Estimativa baseada em preços públicos de referência (USD). Custos reais podem variar conforme região, tier e uso.
          </p>
        </div>
        <div className="text-right">
          <span className="text-[9px] text-slate-400">
            Atualizado {new Date(lastCalcTime).toLocaleTimeString('pt-BR')}
          </span>
        </div>
      </div>
    </div>
  )
}
