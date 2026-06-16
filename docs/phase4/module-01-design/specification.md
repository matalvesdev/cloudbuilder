# CloudBuilder Design — Módulo 01

## Epic

Como usuário do CloudBuilder, quero projetar visualmente minha infraestrutura em um canvas interativo, com componentes de nuvem, conexões entre recursos e validação em tempo real, para que eu possa criar arquiteturas completas sem escrever código manualmente.

## Features

| ID | Feature | Descrição |
|----|---------|-----------|
| F-01 | Canvas Interativo | Canvas com zoom, pan, grid, minimapa e infinite scroll |
| F-02 | Paleta de Componentes | Biblioteca de componentes de infraestrutura (AWS, Azure, GCP, K8s) |
| F-03 | Drag & Drop | Arrastar componentes da paleta para o canvas |
| F-04 | Conexões Inteligentes | Conectar componentes com validação de compatibilidade |
| F-05 | Editor de Propriedades | Painel lateral para configurar propriedades do componente |
| F-06 | Engine de Validação | Validação em tempo real de design, conexões e políticas |
| F-07 | Versionamento | Histórico de versões do design com diff |
| F-08 | Export/Import | Exportar design como JSON, PNG, SVG; importar JSON |
| F-09 | Colaboração | Edição colaborativa em tempo real |
| F-10 | Provedores | Sistema de plugins para provedores de infraestrutura |

## User Stories

### F-01: Canvas Interativo
**US-01**: Como arquiteto de nuvem, quero um canvas com zoom e pan para projetar arquiteturas complexas com muitos componentes.
**AC**: 
- Canvas suporta zoom de 25% a 400%
- Pan suave com mouse e touch
- Grid snap com configuração de spacing
- Minimapa no canto inferior direito
- Performance >30fps com 500 nodes

### F-02: Paleta de Componentes
**US-02**: Como platform engineer, quero uma paleta com componentes categorizados por provedor e tipo para montar minha arquitetura rapidamente.
**AC**:
- Componentes agrupados por provedor (AWS, Azure, GCP, K8s)
- Componentes agrupados por categoria (Compute, Network, Storage, Database, Security)
- Campo de busca com filtro por nome/provedor/tipo
- Favoritos e usados recentemente

### F-03: Drag & Drop
**US-03**: Como usuário, quero arrastar componentes da paleta para o canvas em posições específicas.
**AC**:
- Drag da paleta cria nova instância do componente
- Drop position respeita grid snap
- Auto-layout opcional ao dropar
- Feedback visual durante drag (ghost component)

### F-06: Engine de Validação
**US-04**: Como platform engineer, quero validação automática do design para detectar erros antes de gerar código.
**AC**:
- Validação em tempo real (debounce 500ms)
- Validação de propriedades obrigatórias
- Validação de conexões (tipos compatíveis)
- Validação de regras de negócio (CIDR overlap, port conflicts)
- Validação de políticas organizacionais
- Indicadores visuais de erro/warning nos componentes
- Painel de validação com lista de problemas

## Non Functional Requirements

| ID | Requisito | Especificação |
|----|-----------|---------------|
| NFR-01 | Performance Canvas | 60fps com 200 nodes, >30fps com 500 nodes |
| NFR-02 | Tempo de Resposta API | <100ms p95 para operações CRUD |
| NFR-03 | Tempo de Validação | <2s para designs com 100+ componentes |
| NFR-04 | Disponibilidade | 99.9% uptime |
| NFR-05 | Segurança | OWASP ASVS Level 2 |
| NFR-06 | Acessibilidade | WCAG 2.1 AA |

## Technical Design

### Frontend (React + ReactFlow)

```
src/modules/design/
├── components/
│   ├── canvas/
│   │   ├── CloudBuilderCanvas.tsx     # Main canvas wrapper
│   │   ├── CanvasToolbar.tsx          # Zoom, fit, layout controls
│   │   ├── CanvasMinimap.tsx          # Minimap component
│   │   └── CanvasContextMenu.tsx      # Right-click menu
│   ├── nodes/
│   │   ├── BaseNode.tsx               # Base node component
│   │   ├── AwsNode.tsx                # AWS-styled node
│   │   ├── AzureNode.tsx              # Azure-styled node
│   │   ├── GcpNode.tsx                # GCP-styled node
│   │   └── K8sNode.tsx                # Kubernetes-styled node
│   ├── palette/
│   │   ├── ComponentPalette.tsx       # Sidebar palette
│   │   ├── PaletteSearch.tsx          # Search filter
│   │   └── PaletteGroup.tsx           # Grouped component list
│   ├── properties/
│   │   ├── PropertiesPanel.tsx        # Right-side properties editor
│   │   ├── PropertyField.tsx          # Generic field renderer
│   │   └── DynamicForm.tsx            # JSON Schema → Form
│   └── validation/
│       ├── ValidationPanel.tsx        # Validation results panel
│       ├── ValidationBadge.tsx        # Node validation indicator
│       └── ValidationToast.tsx        # Toast notifications
├── hooks/
│   ├── useCanvas.ts                   # Canvas state management
│   ├── useDragAndDrop.ts              # DnD logic
│   ├── useValidation.ts               # Validation integration
│   └── useCollaboration.ts            # Real-time collaboration
├── services/
│   ├── canvasApi.ts                   # REST API calls
│   └── websocketClient.ts             # WebSocket for collaboration
├── store/
│   ├── canvasStore.ts                 # Zustand store for canvas state
│   └── uiStore.ts                     # UI state (panels, selections)
└── types/
    ├── canvas.types.ts                # TypeScript interfaces
    └── component.types.ts             # Component type definitions
```

### Backend (Spring Modulith)

```
src/main/java/com/cloudbuilder/design/
├── domain/
│   ├── model/
│   │   ├── Canvas.java                # Aggregate root
│   │   ├── CanvasNode.java            # Node entity
│   │   ├── CanvasEdge.java            # Edge entity
│   │   ├── CanvasVersion.java         # Version value object
│   │   ├── ComponentDefinition.java   # Component type definition
│   │   └── PropertyValue.java         # Property value object
│   ├── service/
│   │   ├── CanvasService.java         # Canvas operations
│   │   ├── ValidationService.java     # Validation orchestration
│   │   └── ComponentDefinitionService.java
│   ├── event/
│   │   ├── CanvasCreatedEvent.java
│   │   ├── CanvasModifiedEvent.java
│   │   ├── ComponentAddedEvent.java
│   │   └── DesignValidatedEvent.java
│   ├── port/
│   │   ├── CanvasRepository.java
│   │   └── ComponentDefinitionRepository.java
│   └── validator/
│       ├── ValidationRule.java        # Interface
│       ├── RequiredPropertyRule.java
│       ├── ConnectionCompatRule.java
│       ├── CidrOverlapRule.java
│       └── PolicyComplianceRule.java
├── application/
│   ├── dto/
│   │   ├── CanvasRequest.java
│   │   ├── CanvasResponse.java
│   │   ├── ValidationResultResponse.java
│   │   └── ComponentDefinitionResponse.java
│   └── usercase/
│       ├── CreateCanvasUseCase.java
│       ├── UpdateCanvasUseCase.java
│       ├── ValidateDesignUseCase.java
│       └── ExportCanvasUseCase.java
└── infrastructure/
    ├── persistence/
    │   ├── JpaCanvasRepository.java
    │   ├── JpaComponentDefinitionRepository.java
    │   └── entity/
    │       ├── CanvasEntity.java
    │       ├── CanvasNodeEntity.java
    │       └── CanvasVersionEntity.java
    ├── messaging/
    │   └── KafkaCanvasEventPublisher.java
    └── web/
        ├── CanvasController.java
        └── ComponentDefinitionController.java
```

## API Contracts

### Canvas API

```
POST   /api/v1/canvases                     → Create canvas
GET    /api/v1/canvases                      → List canvases (paginated)
GET    /api/v1/canvases/{id}                 → Get canvas with nodes/edges
PUT    /api/v1/canvases/{id}                 → Update canvas
DELETE /api/v1/canvases/{id}                 → Delete canvas

POST   /api/v1/canvases/{id}/nodes           → Add node
PUT    /api/v1/canvases/{id}/nodes/{nodeId}  → Update node
DELETE /api/v1/canvases/{id}/nodes/{nodeId}  → Remove node

POST   /api/v1/canvases/{id}/edges           → Add edge
DELETE /api/v1/canvases/{id}/edges/{edgeId}  → Remove edge

POST   /api/v1/canvases/{id}/validate        → Validate design
GET    /api/v1/canvases/{id}/versions        → List versions
GET    /api/v1/canvases/{id}/versions/{v}    → Get specific version
POST   /api/v1/canvases/{id}/export          → Export canvas
POST   /api/v1/canvases/import               → Import canvas

GET    /api/v1/component-definitions         → List all component types
GET    /api/v1/component-definitions/{id}    → Get component definition
```

### Canvas Response Schema

```json
{
  "id": "uuid",
  "name": "string",
  "description": "string",
  "version": 1,
  "nodes": [
    {
      "id": "uuid",
      "componentDefinitionId": "uuid",
      "type": "aws:ec2:instance",
      "position": { "x": 100, "y": 200 },
      "properties": {
        "instance_type": "t3.medium",
        "ami": "ami-12345",
        "subnet_id": "subnet-abc"
      },
      "validation": { "status": "VALID", "warnings": [] }
    }
  ],
  "edges": [
    {
      "id": "uuid",
      "sourceId": "uuid",
      "targetId": "uuid",
      "type": "network",
      "properties": { "port": 443, "protocol": "tcp" }
    }
  ],
  "validation": {
    "status": "VALID",
    "errors": [],
    "warnings": [],
    "validatedAt": "2026-06-08T12:00:00Z"
  },
  "createdAt": "2026-06-08T12:00:00Z",
  "updatedAt": "2026-06-08T12:00:00Z"
}
```

## Events

| Event | Payload | Publisher | Consumers |
|-------|---------|-----------|-----------|
| CanvasCreated | tenantId, canvasId, name, userId | Design | Audit |
| CanvasModified | tenantId, canvasId, version, changes[] | Design | Audit, AIOps |
| CanvasDeleted | tenantId, canvasId | Design | Audit |
| ComponentAddedToCanvas | canvasId, componentType, nodeId | Design | Cost (estimate) |
| ComponentConnected | canvasId, sourceId, targetId, edgeType | Design | Provision |
| DesignValidated | canvasId, status, issues[] | Design | Provision, Audit |
| DesignVersionCreated | canvasId, version, snapshot | Design | Audit |

## Database Model

```sql
-- Schema: design

CREATE TABLE canvases (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    version INTEGER NOT NULL DEFAULT 1,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by UUID NOT NULL
);

CREATE INDEX idx_canvases_tenant ON canvases(tenant_id);

CREATE TABLE canvas_nodes (
    id UUID PRIMARY KEY,
    canvas_id UUID NOT NULL REFERENCES canvases(id) ON DELETE CASCADE,
    component_definition_id UUID NOT NULL,
    position_x DOUBLE PRECISION NOT NULL,
    position_y DOUBLE PRECISION NOT NULL,
    properties JSONB NOT NULL DEFAULT '{}',
    validation_status VARCHAR(20) DEFAULT 'PENDING',
    validation_details JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_nodes_canvas ON canvas_nodes(canvas_id);

CREATE TABLE canvas_edges (
    id UUID PRIMARY KEY,
    canvas_id UUID NOT NULL REFERENCES canvases(id) ON DELETE CASCADE,
    source_node_id UUID NOT NULL REFERENCES canvas_nodes(id) ON DELETE CASCADE,
    target_node_id UUID NOT NULL REFERENCES canvas_nodes(id) ON DELETE CASCADE,
    edge_type VARCHAR(50) NOT NULL,
    properties JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_edges_canvas ON canvas_edges(canvas_id);

CREATE TABLE canvas_versions (
    id UUID PRIMARY KEY,
    canvas_id UUID NOT NULL REFERENCES canvases(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    snapshot JSONB NOT NULL,
    change_description TEXT,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    UNIQUE(canvas_id, version)
);

CREATE TABLE component_definitions (
    id UUID PRIMARY KEY,
    provider VARCHAR(50) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    icon_url VARCHAR(500),
    properties_schema JSONB NOT NULL,
    terraform_template TEXT,
    validation_rules JSONB,
    cost_model JSONB,
    tags TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_definitions_provider ON component_definitions(provider);
CREATE INDEX idx_definitions_category ON component_definitions(category);

CREATE TABLE canvas_tags (
    canvas_id UUID NOT NULL REFERENCES canvases(id) ON DELETE CASCADE,
    key VARCHAR(100) NOT NULL,
    value VARCHAR(255) NOT NULL,
    PRIMARY KEY (canvas_id, key)
);
```

## Test Plan

### Unit Tests (Jest — Frontend)
- Canvas render with 0, 1, 10, 100 nodes
- Drag and drop creates correct node type
- Connection validation rejects incompatible types
- Property editor renders correct form for each component type
- Undo/redo maintains correct state

### Unit Tests (JUnit — Backend)
- CanvasService.createCanvas returns canvas with correct tenant
- CanvasService.addNode validates component definition exists
- ValidationService detects missing required properties
- ValidationService detects invalid connections
- CanvasService.exportCanvas returns correct JSON

### Integration Tests
- POST /api/v1/canvases → 201 with created canvas
- POST /api/v1/canvases/{id}/nodes → adds node to canvas
- POST /api/v1/canvases/{id}/validate → returns validation results
- GET /api/v1/canvases/{id}/versions → returns version list
- PUT /api/v1/canvases/{id} → updates canvas name

### E2E Tests (Playwright/Cypress)
- User creates new canvas
- User drags component from palette to canvas
- User connects two components
- User edits component properties
- User runs validation and sees results
- User exports and re-imports canvas
- Error states: validation errors display correctly

### Performance Tests (k6)
- Load canvas with 500 nodes
- Bulk add 50 nodes via API
- Validate design with 100 components
- Export canvas with 200 nodes
