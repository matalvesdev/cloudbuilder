// Backend DTOs matching Java records
export interface ApiResponse<T> {
  data: T
  status: number
  message?: string
}

export interface ApiError {
  status: number
  message: string
  details?: Record<string, string[]>
  timestamp: string
  path?: string
}

export interface PaginatedResponse<T> {
  content: T[]
  totalPages: number
  totalElements: number
  size: number
  number: number
  first: boolean
  last: boolean
}

// Canvas DTOs
export interface CanvasDTO {
  id: string
  tenantId: string
  name: string
  description: string | null
  designVersion: number
  metadata: string | null
  createdBy: string
  canvasNodes: CanvasNodeDTO[]
  canvasEdges: CanvasEdgeDTO[]
}

export interface CanvasNodeDTO {
  id: string
  canvasId?: string
  componentDefinitionId: string
  positionX: number
  positionY: number
  properties: string | null
  validationStatus: string | null
  validationDetails: string | null
  createdAt: string
}

export interface CanvasEdgeDTO {
  id: string
  canvasId?: string
  sourceNodeId: string
  targetNodeId: string
  edgeType: string
  properties: string | null
}

// Request DTOs
export interface CreateCanvasRequest {
  tenantId: string
  name: string
  description?: string
  userId: string
}

export interface UpdateCanvasRequest {
  name: string
  description?: string
  metadata?: string
}

export interface AddNodeRequest {
  componentDefinitionId: string
  positionX: number
  positionY: number
  properties?: string
  id?: string
}

export interface AddEdgeRequest {
  sourceNodeId: string
  targetNodeId: string
  edgeType: string
  properties?: string
}

// Auth DTOs
export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  refreshToken: string
  expiresIn: number
  userId: string
  name: string
  email: string
  roles: string[]
  tenantId?: string
  tenantName?: string
  tenantSlug?: string
}

// Provision DTOs
export interface GenerateCodeRequest {
  canvasId: string
  provider: 'terraform' | 'opentofu'
}

export interface GeneratedCodeResponse {
  canvasId: string
  provider: string
  files: Record<string, string>
  resourceCount: number
  generatedAt: number
}

export interface ManagedResourceDTO {
  id: string
  environmentId: string
  resourceType: string
  provider: string
  name: string
  status: string
  properties: string | null
  lastUpdated: string
}

export interface DriftReportDTO {
  id: string
  environmentId: string
  detectedAt: string
  status: string
  drifts: DriftItemDTO[]
  summary: string
}

export interface DriftItemDTO {
  resourceId: string
  resourceName: string
  resourceType: string
  driftType: 'ADDED' | 'REMOVED' | 'MODIFIED'
  expectedValue: string | null
  actualValue: string | null
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
}

// Import DTOs
export interface ImportTerraformRequest {
  content: string
}

export interface ParsedResource {
  name: string
  resourceType: string   // e.g. "aws_vpc"
  provider: string       // e.g. "aws"
  displayType: string    // e.g. "VPC"
  isDataSource: boolean
  properties: Record<string, string>
}

export interface ParsedConnection {
  sourceResourceName: string
  targetResourceName: string
}

export interface ImportTerraformResponse {
  resources: ParsedResource[]
  connections: ParsedConnection[]
  warnings: string[]
  resourceCount: number
}

// ── Track A: .tfstate import ─────────────────────────────
export interface ImportStateRequest {
  content: string
}

export interface ImportStateResponse {
  resources: ParsedResource[]
  connections: ParsedConnection[]
  warnings: string[]
  resourceCount: number
}

// ── Track A: Multi-file import ───────────────────────────
export interface MultiFileEntry {
  fileName: string
  content: string
}

export interface ImportMultiRequest {
  files: MultiFileEntry[]
}

export interface ImportMultiResponse {
  resources: ParsedResource[]
  connections: ParsedConnection[]
  warnings: string[]
  resourceCount: number
}

// ── Track A: .cloudbuilder.json native format ────────────
export interface CloudBuilderDesign {
  formatVersion: '1.0'
  metadata: {
    name: string
    description?: string
    source: 'manual' | 'import:terraform' | 'import:tfstate' | 'import:github'
    sourceUrl?: string
    importedAt: string
    provider: 'aws' | 'azure' | 'gcp' | 'k8s' | 'multi'
    resourceCount: number
  }
  resources: ImportedResource[]
  connections: ImportedConnection[]
  canvas?: {
    nodes: any[]
    edges: any[]
  }
}

export interface ImportedResource {
  id: string
  type: string
  provider: string
  name: string
  properties: Record<string, string>
  tags?: Record<string, string>
  source: 'hcl' | 'state' | 'json' | 'inferred'
  status?: string
}

export interface ImportedConnection {
  source: string
  target: string
  type: 'reference' | 'depends_on' | 'module' | 'inferred'
  attribute?: string
}

// ── Track B.2: Code Analysis ────────────────────────────
export interface CodeAnalysisRequest {
  files: { fileName: string; path: string; content: string }[]
  repoUrl?: string
}

export interface InferredResource {
  resourceType: string
  provider: string
  displayName: string
  description: string
  confidence: number
  evidence: string[]
  suggestedProperties: Record<string, string | number | boolean>
}

export interface CodeAnalysisResponse {
  repoUrl: string
  detectedStack: string
  stackDescription: string
  detectedFrameworks: string[]
  inferredResources: InferredResource[]
  warnings: string[]
}

// ── Track B.3: Live Metrics ─────────────────────────────
export interface MetricPoint {
  timestamp: number
  value: number
}

export interface ResourceMetrics {
  nodeId: string
  resourceName: string
  cpuUtilization?: MetricPoint[]
  memoryUtilization?: MetricPoint[]
  networkIn?: MetricPoint[]
  networkOut?: MetricPoint[]
  diskReadOps?: MetricPoint[]
  diskWriteOps?: MetricPoint[]
  status: 'healthy' | 'warning' | 'critical' | 'unknown'
  lastUpdated: number
}

export interface MetricsSnapshot {
  timestamp: number
  resources: ResourceMetrics[]
}
