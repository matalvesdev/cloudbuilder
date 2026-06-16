import { api } from './client'
import type { CatalogTemplate } from '@/types/platform.types'

// ─── Fallback mock templates when API is unavailable ─────────

const MOCK_TEMPLATES: CatalogTemplate[] = [
  {
    id: 'standard-web-app',
    name: 'Aplicação Web Padrão',
    description: 'Stack completa para aplicações web com load balancing, containers e banco relacional',
    type: 'application',
    category: 'web',
    provider: 'aws',
    resources: [
      { type: 'vpc', count: 1 },
      { type: 'alb', count: 1 },
      { type: 'ecs_cluster', count: 1 },
      { type: 'ecs_service', count: 1 },
      { type: 'rds_instance', count: 1 },
      { type: 'elasticache', count: 1 },
      { type: 'security_group', count: 2 },
    ],
    estimatedCost: '~$450/mês',
    complexity: 'intermediate',
  },
  {
    id: 'microservice-api',
    name: 'API Microsserviço',
    description: 'API serverless com API Gateway, Lambda, DynamoDB e monitoramento',
    type: 'serverless',
    category: 'api',
    provider: 'aws',
    resources: [
      { type: 'vpc', count: 1 },
      { type: 'api_gateway', count: 1 },
      { type: 'lambda', count: 1 },
      { type: 'ecs_service', count: 1 },
      { type: 'dynamodb', count: 1 },
      { type: 'cloudwatch', count: 1 },
    ],
    estimatedCost: '~$200/mês',
    complexity: 'basic',
  },
  {
    id: 'data-pipeline',
    name: 'Pipeline de Dados',
    description: 'ETL serverless com S3, Glue, Redshift e filas de processamento',
    type: 'storage',
    category: 'data',
    provider: 'aws',
    resources: [
      { type: 's3_bucket', count: 1 },
      { type: 'sqs', count: 1 },
      { type: 'glue_job', count: 1 },
      { type: 'lambda', count: 1 },
      { type: 'redshift', count: 1 },
    ],
    estimatedCost: '~$800/mês',
    complexity: 'advanced',
  },
  {
    id: 'kubernetes-cluster',
    name: 'Cluster Kubernetes',
    description: 'Cluster EKS gerenciado com node groups, ingress e bancos de dados',
    type: 'infrastructure',
    category: 'infra',
    provider: 'k8s',
    resources: [
      { type: 'vpc', count: 1 },
      { type: 'eks_cluster', count: 1 },
      { type: 'node_group', count: 1 },
      { type: 'alb_ingress', count: 1 },
      { type: 'rds_instance', count: 1 },
      { type: 'elasticache', count: 1 },
    ],
    estimatedCost: '~$1.200/mês',
    complexity: 'advanced',
  },
]

// ─── Platform API Service ────────────────────────────────────

class PlatformApiService {
  async getCatalog(): Promise<CatalogTemplate[]> {
    try {
      const data = await api.get<CatalogTemplate[]>('/platform/catalog')
      if (Array.isArray(data) && data.length > 0) return data
      return MOCK_TEMPLATES
    } catch {
      return MOCK_TEMPLATES
    }
  }

  async getMarketplace(): Promise<CatalogTemplate[]> {
    try {
      const data = await api.get<CatalogTemplate[]>('/platform/marketplace')
      if (Array.isArray(data) && data.length > 0) return data
      return []
    } catch {
      return []
    }
  }
}

export const platformApi = new PlatformApiService()
