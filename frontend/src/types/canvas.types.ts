export type ProviderType = 'aws' | 'azure' | 'gcp' | 'k8s' | 'vercel' | 'supabase' | 'render';
export type ComponentCategory = 'compute' | 'network' | 'storage' | 'database' | 'security' | 'serverless' | 'monitoring' | 'integration';

export interface ComponentDefinition {
  id: string;
  provider: ProviderType;
  resourceType: string;
  category: ComponentCategory;
  displayName: string;
  description: string;
  icon: string;
  propertiesSchema: Record<string, any>;
}

export interface CanvasNodeData {
  label: string;
  componentDefinitionId: string;
  provider: ProviderType;
  resourceType: string;
  properties: Record<string, any>;
  validationStatus: 'VALID' | 'INVALID' | 'PENDING' | 'WARNING';
  [key: string]: any;
}

export interface CanvasDesign {
  id: string;
  name: string;
  description: string;
  version: number;
  nodes: any[];
  edges: any[];
  createdAt: string;
  updatedAt: string;
}

export type CanvasNodeProperties = Record<string, any>;
