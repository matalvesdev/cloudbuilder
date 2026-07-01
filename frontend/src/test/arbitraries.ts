import * as fc from 'fast-check'

// ─── Canvas Domain Arbitraries ────────────────────────────────────

export const ProviderTypeArb = fc.constantFrom('aws', 'azure', 'gcp', 'k8s', 'vercel', 'supabase', 'render')

export const ComponentCategoryArb = fc.constantFrom(
  'compute', 'network', 'storage', 'database', 'security', 'serverless', 'monitoring', 'integration',
)

export const PositionArb = fc.record({
  x: fc.float({ min: -5000, max: 5000, noNaN: true }),
  y: fc.float({ min: -5000, max: 5000, noNaN: true }),
})

export const ResourceTypeArb = fc.oneof(
  fc.constant('aws_vpc'),
  fc.constant('aws_subnet'),
  fc.constant('aws_instance'),
  fc.constant('aws_security_group'),
  fc.constant('aws_s3_bucket'),
  fc.constant('aws_rds_instance'),
  fc.constant('aws_lambda_function'),
  fc.constant('azure_resource_group'),
  fc.constant('azure_virtual_network'),
  fc.constant('azure_linux_virtual_machine'),
  fc.constant('gcp_compute_instance'),
  fc.constant('gcp_storage_bucket'),
  fc.constant('gcp_compute_network'),
  fc.constant('kubernetes_deployment'),
  fc.constant('kubernetes_service'),
  fc.constant('kubernetes_config_map'),
)

export const ComponentDataArb = fc.record({
  provider: ProviderTypeArb,
  resourceType: ResourceTypeArb,
  category: ComponentCategoryArb,
  displayName: fc.string({ minLength: 1, maxLength: 50 }),
})

export const NodeIdArb = fc.uuid()

// ─── Feature Flag Arbitraries ─────────────────────────────────────

export const FlagKeyArb = fc.oneof(
  fc.constant('module.cost'),
  fc.constant('module.platform'),
  fc.constant('module.aiops'),
  fc.constant('module.audit'),
  fc.constant('module.iam'),
  fc.constant('feature.what-if-cost'),
  fc.constant('feature.preview-workflow'),
  fc.constant('config.max-users'),
)

export const ModuleFlagKeyArb = fc.constantFrom(
  'module.cost', 'module.platform', 'module.aiops', 'module.audit', 'module.iam',
)

export const FeatureFlagArb = fc.record({
  flagKey: FlagKeyArb,
  enabled: fc.boolean(),
  description: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
})

// ─── UI State Arbitraries ─────────────────────────────────────────

export const PanelTabArb = fc.constantFrom('palette', 'properties', 'validation')

export const ModuleIdArb = fc.constantFrom(
  'design', 'provision', 'observe', 'cost', 'platform', 'aiops', 'audit', 'iam', 'dashboard', 'docs', 'settings', 'analytics', 'flags',
)

// ─── Cost Arbitraries ─────────────────────────────────────────────

export const CostRecordArb = fc.record({
  service: fc.string({ minLength: 1, maxLength: 50 }),
  amount: fc.float({ min: 0, max: 100000, noNaN: true }),
  region: fc.constantFrom('us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1'),
})

export const BudgetArb = fc.record({
  limit: fc.float({ min: 1, max: 500000, noNaN: true }),
  period: fc.constantFrom('monthly', 'quarterly', 'yearly'),
})

// ─── Edge Arbitraries ─────────────────────────────────────────────

export const EdgeTypeArb = fc.constantFrom('default', 'animated', 'dashed')

export const EdgeArb = fc.record({
  source: fc.uuid(),
  target: fc.uuid(),
  type: EdgeTypeArb,
})

// ─── Validation Result Arbitraries ────────────────────────────────

export const ValidationSeverityArb = fc.constantFrom('ERROR', 'WARNING', 'INFO')

export const ValidationMessageArb = fc.record({
  severity: ValidationSeverityArb,
  rule: fc.string({ minLength: 1, maxLength: 50 }),
  message: fc.string({ minLength: 1, maxLength: 200 }),
})
