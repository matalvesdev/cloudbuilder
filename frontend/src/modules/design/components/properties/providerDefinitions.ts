import type { ComponentDefinition, ProviderType, ComponentCategory } from '@/types/canvas.types'

const awsComponents: ComponentDefinition[] = [
  { id: 'aws-vpc', provider: 'aws', resourceType: 'aws_vpc', category: 'network', displayName: 'VPC', description: 'Rede privada virtual na AWS', icon: 'Network', propertiesSchema: {} },
  { id: 'aws-subnet', provider: 'aws', resourceType: 'aws_subnet', category: 'network', displayName: 'Subnet', description: 'Sub-rede com bloco CIDR', icon: 'Layers', propertiesSchema: {} },
  { id: 'aws-igw', provider: 'aws', resourceType: 'aws_internet_gateway', category: 'network', displayName: 'Internet Gateway', description: 'Gateway de internet para VPC', icon: 'Globe', propertiesSchema: {} },
  { id: 'aws-natgw', provider: 'aws', resourceType: 'aws_nat_gateway', category: 'network', displayName: 'NAT Gateway', description: 'Gateway NAT para sub-redes privadas', icon: 'Router', propertiesSchema: {} },
  { id: 'aws-rtb', provider: 'aws', resourceType: 'aws_route_table', category: 'network', displayName: 'Route Table', description: 'Tabela de rotas com regras', icon: 'Network', propertiesSchema: {} },
  { id: 'aws-ec2', provider: 'aws', resourceType: 'aws_instance', category: 'compute', displayName: 'EC2 Instance', description: 'Máquina virtual na nuvem AWS', icon: 'Server', propertiesSchema: {} },
  { id: 'aws-asg', provider: 'aws', resourceType: 'aws_autoscaling_group', category: 'compute', displayName: 'Auto Scaling Group', description: 'Grupo de dimensionamento automático EC2', icon: 'Layers', propertiesSchema: {} },
  { id: 'aws-lt', provider: 'aws', resourceType: 'aws_launch_template', category: 'compute', displayName: 'Launch Template', description: 'Modelo de configuração EC2', icon: 'Box', propertiesSchema: {} },
  { id: 'aws-rds', provider: 'aws', resourceType: 'aws_db_instance', category: 'database', displayName: 'RDS Database', description: 'Banco de dados relacional gerenciado', icon: 'Database', propertiesSchema: {} },
  { id: 'aws-rds-cluster', provider: 'aws', resourceType: 'aws_rds_cluster', category: 'database', displayName: 'RDS Aurora Cluster', description: 'Cluster Aurora de banco de dados', icon: 'Database', propertiesSchema: {} },
  { id: 'aws-elasticache', provider: 'aws', resourceType: 'aws_elasticache_cluster', category: 'database', displayName: 'ElastiCache', description: 'Cache Redis/Memcached gerenciado', icon: 'Database', propertiesSchema: {} },
  { id: 'aws-dynamodb', provider: 'aws', resourceType: 'aws_dynamodb_table', category: 'database', displayName: 'DynamoDB Table', description: 'Banco NoSQL gerenciado', icon: 'Database', propertiesSchema: {} },
  { id: 'aws-alb', provider: 'aws', resourceType: 'aws_lb', category: 'network', displayName: 'ALB', description: 'Application Load Balancer', icon: 'Router', propertiesSchema: {} },
  { id: 'aws-nlb', provider: 'aws', resourceType: 'aws_lb', category: 'network', displayName: 'NLB', description: 'Network Load Balancer', icon: 'Router', propertiesSchema: {} },
  { id: 'aws-tg', provider: 'aws', resourceType: 'aws_lb_target_group', category: 'network', displayName: 'Target Group', description: 'Grupo de destino do load balancer', icon: 'Box', propertiesSchema: {} },
  { id: 'aws-s3', provider: 'aws', resourceType: 'aws_s3_bucket', category: 'storage', displayName: 'S3 Bucket', description: 'Armazenamento de objetos', icon: 'HardDrive', propertiesSchema: {} },
  { id: 'aws-ebs', provider: 'aws', resourceType: 'aws_ebs_volume', category: 'storage', displayName: 'EBS Volume', description: 'Armazenamento em bloco', icon: 'HardDrive', propertiesSchema: {} },
  { id: 'aws-efs', provider: 'aws', resourceType: 'aws_efs_file_system', category: 'storage', displayName: 'EFS', description: 'Sistema de arquivos NFS', icon: 'HardDrive', propertiesSchema: {} },
  { id: 'aws-sg', provider: 'aws', resourceType: 'aws_security_group', category: 'security', displayName: 'Security Group', description: 'Firewall de instância', icon: 'Shield', propertiesSchema: {} },
  { id: 'aws-nacl', provider: 'aws', resourceType: 'aws_network_acl', category: 'security', displayName: 'Network ACL', description: 'Firewall de sub-rede', icon: 'Lock', propertiesSchema: {} },
  { id: 'aws-ecs', provider: 'aws', resourceType: 'aws_ecs_cluster', category: 'compute', displayName: 'ECS Cluster', description: 'Orquestração de contêineres', icon: 'Container', propertiesSchema: {} },
  { id: 'aws-ecr', provider: 'aws', resourceType: 'aws_ecr_repository', category: 'compute', displayName: 'ECR Repository', description: 'Registro de contêineres', icon: 'Container', propertiesSchema: {} },
  { id: 'aws-lambda', provider: 'aws', resourceType: 'aws_lambda_function', category: 'serverless', displayName: 'Lambda Function', description: 'Função serverless', icon: 'FunctionSquare', propertiesSchema: {} },
  { id: 'aws-sqs', provider: 'aws', resourceType: 'aws_sqs_queue', category: 'integration', displayName: 'SQS Queue', description: 'Fila de mensagens', icon: 'Box', propertiesSchema: {} },
  { id: 'aws-sns', provider: 'aws', resourceType: 'aws_sns_topic', category: 'integration', displayName: 'SNS Topic', description: 'Tópico de notificações', icon: 'Box', propertiesSchema: {} },
  { id: 'aws-cw', provider: 'aws', resourceType: 'aws_cloudwatch_metric_alarm', category: 'monitoring', displayName: 'CloudWatch Alarm', description: 'Alarme de métricas', icon: 'Cloud', propertiesSchema: {} },
]

const azureComponents: ComponentDefinition[] = [
  { id: 'azure-vnet', provider: 'azure', resourceType: 'azurerm_virtual_network', category: 'network', displayName: 'Virtual Network', description: 'Rede virtual Azure com espaço de endereçamento', icon: 'Network', propertiesSchema: {} },
  { id: 'azure-subnet', provider: 'azure', resourceType: 'azurerm_subnet', category: 'network', displayName: 'Subnet', description: 'Sub-rede da VNet', icon: 'Layers', propertiesSchema: {} },
  { id: 'azure-vm', provider: 'azure', resourceType: 'azurerm_virtual_machine', category: 'compute', displayName: 'Virtual Machine', description: 'Máquina virtual Azure', icon: 'Server', propertiesSchema: {} },
  { id: 'azure-aks', provider: 'azure', resourceType: 'azurerm_kubernetes_cluster', category: 'compute', displayName: 'AKS Cluster', description: 'Serviço Kubernetes gerenciado', icon: 'Container', propertiesSchema: {} },
  { id: 'azure-sql', provider: 'azure', resourceType: 'azurerm_mssql_database', category: 'database', displayName: 'SQL Database', description: 'Banco SQL gerenciado Azure', icon: 'Database', propertiesSchema: {} },
  { id: 'azure-appgw', provider: 'azure', resourceType: 'azurerm_application_gateway', category: 'network', displayName: 'Application Gateway', description: 'Load balancer de camada 7', icon: 'Router', propertiesSchema: {} },
  { id: 'azure-storage', provider: 'azure', resourceType: 'azurerm_storage_account', category: 'storage', displayName: 'Storage Account', description: 'Armazenamento Blob/Arquivo/Tabela', icon: 'HardDrive', propertiesSchema: {} },
  { id: 'azure-func', provider: 'azure', resourceType: 'azurerm_function_app', category: 'serverless', displayName: 'Function App', description: 'Funções serverless Azure', icon: 'FunctionSquare', propertiesSchema: {} },
  { id: 'azure-nsg', provider: 'azure', resourceType: 'azurerm_network_security_group', category: 'security', displayName: 'Network Security Group', description: 'Regras de firewall', icon: 'Shield', propertiesSchema: {} },
]

const gcpComponents: ComponentDefinition[] = [
  { id: 'gcp-vpc', provider: 'gcp', resourceType: 'google_compute_network', category: 'network', displayName: 'VPC Network', description: 'Rede VPC do Google Cloud', icon: 'Network', propertiesSchema: {} },
  { id: 'gcp-subnet', provider: 'gcp', resourceType: 'google_compute_subnetwork', category: 'network', displayName: 'Subnet', description: 'Sub-rede da VPC', icon: 'Layers', propertiesSchema: {} },
  { id: 'gcp-vm', provider: 'gcp', resourceType: 'google_compute_instance', category: 'compute', displayName: 'Compute Engine', description: 'VM do Google Cloud', icon: 'Server', propertiesSchema: {} },
  { id: 'gcp-gke', provider: 'gcp', resourceType: 'google_container_cluster', category: 'compute', displayName: 'GKE Cluster', description: 'Cluster Kubernetes gerenciado', icon: 'Container', propertiesSchema: {} },
  { id: 'gcp-sql', provider: 'gcp', resourceType: 'google_sql_database_instance', category: 'database', displayName: 'Cloud SQL', description: 'MySQL/PostgreSQL gerenciado', icon: 'Database', propertiesSchema: {} },
  { id: 'gcp-gcs', provider: 'gcp', resourceType: 'google_storage_bucket', category: 'storage', displayName: 'Cloud Storage', description: 'Armazenamento de objetos', icon: 'HardDrive', propertiesSchema: {} },
  { id: 'gcp-cloudrun', provider: 'gcp', resourceType: 'google_cloud_run_service', category: 'serverless', displayName: 'Cloud Run', description: 'Contêineres serverless', icon: 'FunctionSquare', propertiesSchema: {} },
]

const k8sComponents: ComponentDefinition[] = [
  { id: 'k8s-namespace', provider: 'k8s', resourceType: 'kubernetes_namespace', category: 'compute', displayName: 'Namespace', description: 'Namespace do Kubernetes', icon: 'Box', propertiesSchema: {} },
  { id: 'k8s-deploy', provider: 'k8s', resourceType: 'kubernetes_deployment', category: 'compute', displayName: 'Deployment', description: 'Deployment de workloads', icon: 'Container', propertiesSchema: {} },
  { id: 'k8s-service', provider: 'k8s', resourceType: 'kubernetes_service', category: 'network', displayName: 'Service', description: 'Endpoint de rede do K8s', icon: 'Network', propertiesSchema: {} },
  { id: 'k8s-ingress', provider: 'k8s', resourceType: 'kubernetes_ingress', category: 'network', displayName: 'Ingress', description: 'Roteamento HTTP/S', icon: 'Router', propertiesSchema: {} },
  { id: 'k8s-configmap', provider: 'k8s', resourceType: 'kubernetes_config_map', category: 'compute', displayName: 'ConfigMap', description: 'Dados de configuração', icon: 'Box', propertiesSchema: {} },
  { id: 'k8s-secret', provider: 'k8s', resourceType: 'kubernetes_secret', category: 'security', displayName: 'Secret', description: 'Dados sensíveis', icon: 'Lock', propertiesSchema: {} },
  { id: 'k8s-pvc', provider: 'k8s', resourceType: 'kubernetes_persistent_volume_claim', category: 'storage', displayName: 'PVC', description: 'Armazenamento persistente', icon: 'HardDrive', propertiesSchema: {} },
  { id: 'k8s-hpa', provider: 'k8s', resourceType: 'kubernetes_horizontal_pod_autoscaler', category: 'compute', displayName: 'HPA', description: 'Dimensionamento automático de pods', icon: 'Layers', propertiesSchema: {} },
]

const vercelComponents: ComponentDefinition[] = [
  { id: 'vercel-project', provider: 'vercel', resourceType: 'vercel_project', category: 'compute', displayName: 'Project', description: 'Projeto Vercel com deploy contínuo', icon: 'Globe', propertiesSchema: {} },
  { id: 'vercel-deployment', provider: 'vercel', resourceType: 'vercel_deployment', category: 'compute', displayName: 'Deployment', description: 'Instância de deploy Vercel', icon: 'Rocket', propertiesSchema: {} },
  { id: 'vercel-domain', provider: 'vercel', resourceType: 'vercel_domain', category: 'network', displayName: 'Domain', description: 'Domínio customizado Vercel', icon: 'Globe', propertiesSchema: {} },
  { id: 'vercel-edge-function', provider: 'vercel', resourceType: 'vercel_edge_function', category: 'serverless', displayName: 'Edge Function', description: 'Função serverless edge Vercel', icon: 'FunctionSquare', propertiesSchema: {} },
  { id: 'vercel-env', provider: 'vercel', resourceType: 'vercel_environment_variable', category: 'security', displayName: 'Env Variable', description: 'Variável de ambiente Vercel', icon: 'Lock', propertiesSchema: {} },
  { id: 'vercel-analytics', provider: 'vercel', resourceType: 'vercel_analytics', category: 'monitoring', displayName: 'Analytics', description: 'Métricas e analytics Vercel', icon: 'Activity', propertiesSchema: {} },
]

const supabaseComponents: ComponentDefinition[] = [
  { id: 'supabase-project', provider: 'supabase', resourceType: 'supabase_project', category: 'database', displayName: 'Project', description: 'Projeto Supabase com Postgres, Auth e Storage', icon: 'Database', propertiesSchema: {} },
  { id: 'supabase-table', provider: 'supabase', resourceType: 'supabase_table', category: 'database', displayName: 'Table', description: 'Tabela Postgres no Supabase', icon: 'Database', propertiesSchema: {} },
  { id: 'supabase-auth', provider: 'supabase', resourceType: 'supabase_auth', category: 'security', displayName: 'Authentication', description: 'Autenticação Supabase (email, OAuth, SSO)', icon: 'Shield', propertiesSchema: {} },
  { id: 'supabase-storage', provider: 'supabase', resourceType: 'supabase_storage_bucket', category: 'storage', displayName: 'Storage Bucket', description: 'Bucket de armazenamento Supabase', icon: 'HardDrive', propertiesSchema: {} },
  { id: 'supabase-edge-function', provider: 'supabase', resourceType: 'supabase_edge_function', category: 'serverless', displayName: 'Edge Function', description: 'Função serverless Deno no Supabase', icon: 'FunctionSquare', propertiesSchema: {} },
  { id: 'supabase-realtime', provider: 'supabase', resourceType: 'supabase_realtime', category: 'integration', displayName: 'Realtime', description: 'Subscriptions WebSocket em tempo real', icon: 'Network', propertiesSchema: {} },
]

const renderComponents: ComponentDefinition[] = [
  { id: 'render-web-service', provider: 'render', resourceType: 'render_web_service', category: 'compute', displayName: 'Web Service', description: 'Serviço web HTTP no Render', icon: 'Server', propertiesSchema: {} },
  { id: 'render-static-site', provider: 'render', resourceType: 'render_static_site', category: 'compute', displayName: 'Static Site', description: 'Site estático no Render', icon: 'Globe', propertiesSchema: {} },
  { id: 'render-cron-job', provider: 'render', resourceType: 'render_cron_job', category: 'compute', displayName: 'Cron Job', description: 'Job agendado no Render', icon: 'Clock', propertiesSchema: {} },
  { id: 'render-background-worker', provider: 'render', resourceType: 'render_background_worker', category: 'compute', displayName: 'Background Worker', description: 'Worker em background no Render', icon: 'Activity', propertiesSchema: {} },
  { id: 'render-postgres', provider: 'render', resourceType: 'render_postgres', category: 'database', displayName: 'PostgreSQL', description: 'Banco Postgres gerenciado no Render', icon: 'Database', propertiesSchema: {} },
  { id: 'render-redis', provider: 'render', resourceType: 'render_redis', category: 'database', displayName: 'Redis', description: 'Cache Redis gerenciado no Render', icon: 'Database', propertiesSchema: {} },
  { id: 'render-env-group', provider: 'render', resourceType: 'render_env_group', category: 'security', displayName: 'Env Group', description: 'Grupo de variáveis de ambiente', icon: 'Lock', propertiesSchema: {} },
]

export const allComponents: ComponentDefinition[] = [
  ...awsComponents,
  ...azureComponents,
  ...gcpComponents,
  ...k8sComponents,
  ...vercelComponents,
  ...supabaseComponents,
  ...renderComponents,
]

export function getComponentsByProvider(provider: ProviderType | string): ComponentDefinition[] {
  return allComponents.filter((c) => c.provider === provider)
}

export function getComponentsByCategory(category: ComponentCategory | string): ComponentDefinition[] {
  return allComponents.filter((c) => c.category === category)
}

export function searchComponents(query: string): ComponentDefinition[] {
  const q = query.toLowerCase()
  if (!q) return allComponents
  return allComponents.filter(
    (c) =>
      c.displayName.toLowerCase().includes(q) ||
      c.resourceType.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q) ||
      c.provider.includes(q)
  )
}

export function getComponentById(id: string): ComponentDefinition | undefined {
  return allComponents.find((c) => c.id === id)
}
