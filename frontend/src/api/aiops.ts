import { api } from './client'

// ─── Types ────────────────────────────────────────────────────

export interface DesignTemplateResource {
  id: string
  label: string
  provider: string
  resourceType: string
  category: string
}

export interface DesignTemplateConnection {
  source: string
  target: string
  edgeType: string
}

export interface DesignTemplate {
  id: string
  name: string
  description: string
  resources: DesignTemplateResource[]
  connections: DesignTemplateConnection[]
}

// ─── Fallback design templates ──────────────────────────────

const FALLBACK_DESIGN_TEMPLATES: DesignTemplate[] = [
  {
    id: 'vpc-ecs-rds',
    name: 'VPC + ECS + RDS',
    description: 'Arquitetura de três camadas na AWS com VPC, ECS para containers e RDS para banco de dados relacional',
    resources: [
      { id: 'vpc', label: 'VPC', provider: 'aws', resourceType: 'vpc', category: 'network' },
      { id: 'public-subnet', label: 'Public Subnet', provider: 'aws', resourceType: 'subnet', category: 'network' },
      { id: 'private-subnet', label: 'Private Subnet', provider: 'aws', resourceType: 'subnet', category: 'network' },
      { id: 'igw', label: 'Internet Gateway', provider: 'aws', resourceType: 'internet_gateway', category: 'network' },
      { id: 'ecs-cluster', label: 'ECS Cluster', provider: 'aws', resourceType: 'ecs_cluster', category: 'compute' },
      { id: 'ecs-service', label: 'ECS Service', provider: 'aws', resourceType: 'ecs_service', category: 'compute' },
      { id: 'rds', label: 'RDS PostgreSQL', provider: 'aws', resourceType: 'rds_instance', category: 'database' },
      { id: 'sg-web', label: 'Security Group Web', provider: 'aws', resourceType: 'security_group', category: 'security' },
      { id: 'sg-db', label: 'Security Group DB', provider: 'aws', resourceType: 'security_group', category: 'security' },
    ],
    connections: [
      { source: 'vpc', target: 'public-subnet', edgeType: 'default' },
      { source: 'vpc', target: 'private-subnet', edgeType: 'default' },
      { source: 'igw', target: 'vpc', edgeType: 'default' },
      { source: 'public-subnet', target: 'ecs-cluster', edgeType: 'default' },
      { source: 'ecs-cluster', target: 'ecs-service', edgeType: 'dashed' },
      { source: 'ecs-service', target: 'rds', edgeType: 'animated' },
      { source: 'sg-web', target: 'ecs-service', edgeType: 'dashed' },
      { source: 'sg-db', target: 'rds', edgeType: 'dashed' },
    ],
  },
  {
    id: 'kubernetes-cluster',
    name: 'Kubernetes Cluster',
    description: 'Cluster Kubernetes gerenciado na AWS com EKS, node groups e balanceador de carga',
    resources: [
      { id: 'vpc', label: 'VPC', provider: 'aws', resourceType: 'vpc', category: 'network' },
      { id: 'subnet-1', label: 'Subnet AZ A', provider: 'aws', resourceType: 'subnet', category: 'network' },
      { id: 'subnet-2', label: 'Subnet AZ B', provider: 'aws', resourceType: 'subnet', category: 'network' },
      { id: 'eks-cluster', label: 'EKS Cluster', provider: 'k8s', resourceType: 'eks_cluster', category: 'compute' },
      { id: 'node-group', label: 'Node Group', provider: 'k8s', resourceType: 'node_group', category: 'compute' },
      { id: 'nodes', label: 'Worker Nodes (t3.medium)', provider: 'k8s', resourceType: 'worker_node', category: 'compute' },
      { id: 'ingress', label: 'Ingress Controller', provider: 'k8s', resourceType: 'ingress', category: 'network' },
      { id: 'sg-eks', label: 'Security Group EKS', provider: 'aws', resourceType: 'security_group', category: 'security' },
    ],
    connections: [
      { source: 'vpc', target: 'subnet-1', edgeType: 'default' },
      { source: 'vpc', target: 'subnet-2', edgeType: 'default' },
      { source: 'subnet-1', target: 'eks-cluster', edgeType: 'default' },
      { source: 'subnet-2', target: 'eks-cluster', edgeType: 'default' },
      { source: 'eks-cluster', target: 'node-group', edgeType: 'dashed' },
      { source: 'node-group', target: 'nodes', edgeType: 'animated' },
      { source: 'ingress', target: 'eks-cluster', edgeType: 'dashed' },
      { source: 'sg-eks', target: 'eks-cluster', edgeType: 'dashed' },
    ],
  },
  {
    id: 'serverless-api',
    name: 'Serverless API',
    description: 'API serverless na AWS com API Gateway, Lambda, DynamoDB e S3 para armazenamento',
    resources: [
      { id: 'api-gw', label: 'API Gateway REST', provider: 'aws', resourceType: 'api_gateway', category: 'serverless' },
      { id: 'lambda-auth', label: 'Lambda Authorizer', provider: 'aws', resourceType: 'lambda_function', category: 'serverless' },
      { id: 'lambda-biz', label: 'Lambda Business Logic', provider: 'aws', resourceType: 'lambda_function', category: 'serverless' },
      { id: 'dynamodb', label: 'DynamoDB Table', provider: 'aws', resourceType: 'dynamodb_table', category: 'database' },
      { id: 's3-assets', label: 'S3 Assets Bucket', provider: 'aws', resourceType: 's3_bucket', category: 'storage' },
      { id: 'cognito', label: 'Cognito User Pool', provider: 'aws', resourceType: 'cognito_user_pool', category: 'security' },
      { id: 'cw-logs', label: 'CloudWatch Logs', provider: 'aws', resourceType: 'cloudwatch_log_group', category: 'monitoring' },
    ],
    connections: [
      { source: 'api-gw', target: 'lambda-auth', edgeType: 'default' },
      { source: 'api-gw', target: 'lambda-biz', edgeType: 'animated' },
      { source: 'lambda-biz', target: 'dynamodb', edgeType: 'animated' },
      { source: 'lambda-biz', target: 's3-assets', edgeType: 'dashed' },
      { source: 'cognito', target: 'api-gw', edgeType: 'dashed' },
      { source: 'lambda-auth', target: 'cognito', edgeType: 'dashed' },
      { source: 'cw-logs', target: 'lambda-biz', edgeType: 'dashed' },
    ],
  },
]

// ─── AIOps API Service ───────────────────────────────────────

export interface ChatRequest {
  question: string
  context: string
  canvas?: {
    name: string
    resourceCount: number
    connectionCount: number
    providers: string[]
    nodes: Array<{ label: string; provider: string; resourceType: string; properties: any }>
  } | null
}

export interface ChatResponse {
  answer: string
  design?: any
}

class AIOpsApiService {
  async getTemplates(): Promise<DesignTemplate[]> {
    try {
      const data = await api.get<DesignTemplate[]>('/aiops/templates')
      if (Array.isArray(data) && data.length > 0) return data
      return FALLBACK_DESIGN_TEMPLATES
    } catch {
      return FALLBACK_DESIGN_TEMPLATES
    }
  }

  async chatQuery(body: ChatRequest): Promise<ChatResponse | null> {
    try {
      return await api.post<ChatResponse>('/aiops/query', body)
    } catch {
      return null
    }
  }

  async getIncidents(environmentId: string): Promise<any[] | null> {
    try {
      return await api.get<any[]>(`/aiops/incidents/${environmentId}`)
    } catch {
      return null
    }
  }

  async analyzeIncident(incidentId: string): Promise<any | null> {
    try {
      return await api.post<any>(`/aiops/incidents/${incidentId}/analyze`)
    } catch {
      return null
    }
  }

  async resolveIncident(incidentId: string): Promise<any | null> {
    try {
      return await api.post<any>(`/aiops/incidents/${incidentId}/resolve`)
    } catch {
      return null
    }
  }
}

export const aiopsApi = new AIOpsApiService()
export default FALLBACK_DESIGN_TEMPLATES
