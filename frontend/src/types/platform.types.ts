export interface CatalogTemplate {
  id: string
  name: string
  description: string
  type: 'infrastructure' | 'application' | 'network' | 'security' | 'storage' | 'serverless'
  category: string
  provider: 'aws' | 'azure' | 'gcp' | 'k8s'
  resources: { type: string; count: number }[]
  estimatedCost: string
  complexity: 'basic' | 'intermediate' | 'advanced'
}

export const templateCategories = [
  { id: 'all', label: 'Todos' },
  { id: 'infrastructure', label: 'Infraestrutura' },
  { id: 'application', label: 'Aplicação' },
  { id: 'network', label: 'Rede' },
  { id: 'security', label: 'Segurança' },
  { id: 'storage', label: 'Armazenamento' },
  { id: 'serverless', label: 'Serverless' },
]
