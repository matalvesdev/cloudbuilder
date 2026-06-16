# CloudBuilder — RFCs

## RFC-001: Canvas Data Model for Infrastructure Design

### Problem
How to represent infrastructure designs on the canvas in a way that is provider-agnostic, versionable, and can be translated to Terraform/OpenTofu.

### Proposed Solution
Define a **Canvas Data Model** with three core abstractions:

```
CanvasDocument {
  id: UUID
  tenant_id: UUID
  version: int
  name: string
  metadata: Map<string,string>
  nodes: Node[]
  edges: Edge[]
  created_at: timestamp
  updated_at: timestamp
}

Node {
  id: UUID
  type: string                    # e.g., "aws:ec2:instance"
  position: { x, y }
  properties: Map<string, any>    # type-specific config
  provider: string                # "aws", "azure", "gcp", "k8s"
  resource_type: string
  validation: ValidationState
}

Edge {
  id: UUID
  source: UUID                    # source node id
  target: UUID                    # target node id
  type: string                    # "network", "dependency", "dataflow"
  properties: Map<string, any>
  label: string
}
```

### Key Design Decisions
1. **Provider-Specific Types**: Node type uses `{provider}:{service}:{resource}` format
2. **Properties as JSON Schema**: Each component definition includes a JSON Schema for its properties
3. **Versioned Documents**: Every save creates a new version for audit and rollback
4. **Validation State**: Nodes carry validation state (valid, invalid, pending)

### Alternatives Considered
- **GraphQL-based model**: Too complex for canvas operations
- **Mermaid-style text**: Not suitable for real-time canvas manipulation

---

## RFC-002: Terraform Generation Pipeline

### Problem
How to reliably generate Terraform/OpenTofu code from a visual canvas design, supporting multiple providers and complex dependencies.

### Proposed Solution

```
Design → Component Resolver → Provider Mapper → DAG Sorter → Template Renderer → Code Artifact
```

1. **Component Resolver**: Validates all components exist, loads their property schemas
2. **Provider Mapper**: Maps each component to its Terraform resource declaration
3. **DAG Sorter**: Topological sort of components based on edge dependencies
4. **Template Renderer**: Uses provider-specific templates to generate `.tf` files
5. **Code Artifact**: Zipped directory containing `main.tf`, `variables.tf`, `outputs.tf`, `providers.tf`, `versions.tf`

### Provider Template Format
Each provider publishes templates in YAML:
```yaml
resource_type: "aws:ec2:instance"
terraform_resource: "aws_instance"
required_properties:
  - ami
  - instance_type
optional_properties:
  - subnet_id
  - vpc_security_group_ids
  - tags
dependencies:
  - "aws_subnet"
  - "aws_security_group"
template: |
  resource "aws_instance" "${id}" {
    ami                    = var.${id}_ami
    instance_type          = "${instance_type}"
    subnet_id              = aws_subnet.${subnet_id}.id
    vpc_security_group_ids = [${vpc_security_group_ids}]
    tags                   = var.${id}_tags
  }
```

---

## RFC-003: Event-Sourced Audit Trail

### Problem
All infrastructure changes must be auditable for compliance, with immutable records and point-in-time reconstruction.

### Proposed Solution
Event sourcing for critical aggregate roots (Canvas, Environment, Deployment):

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Command    │────►│ Aggregate   │────►│  Event      │
│  Handler    │     │  Root       │     │  Store      │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                                │
                                        ┌──────▼──────┐
                                        │  Kafka       │
                                        │  Topic       │
                                        └─────────────┘
```

- Events stored in PostgreSQL event store table
- Kafka topics for cross-module event distribution
- Event replay for reconstructing aggregate state
- Timestamp, actor, tenant, and resource IDs indexed

---

## RFC-004: Multi-Cloud Component Provider System

### Problem
CloudBuilder must support AWS, Azure, GCP, and Kubernetes with a unified component model.

### Proposed Solution
Provider Plugin Architecture:

```
ComponentProvider (interface)
├── AwsProvider
│   └── ComponentDefinitions: VPC, EC2, RDS, ALB, S3, Lambda, ECS, EKS
├── AzureProvider
│   └── ComponentDefinitions: VNet, VM, SQL, AppGateway, Blob, Functions, AKS
├── GcpProvider
│   └── ComponentDefinitions: VPC, ComputeInstance, CloudSQL, GKE, CloudRun
└── K8sProvider
    └── ComponentDefinitions: Deployment, Service, Ingress, ConfigMap, PVC
```

Each provider is a Go module (for Provision Engine) with:
1. Component definitions (UI metadata + validation rules)
2. Terraform templates (code generation)
3. Cost models (pricing data)
4. Observability templates (monitoring dashboards)
