# CloudBuilder — Diagram vs Code Gap Analysis

Review of codebase against the comprehensive diagram set (2026-07-01).

---

## Summary

| Category | Exists (functional) | Exists (stub/partial) | Missing entirely |
|----------|--------------------|-----------------------|-----------------|
| **Integration Platform** | Credential CRUD (backend+frontend) | testConnection (DB-only check) | Connection Manager, Validation Engine, Discovery Engine, Provider Registry, Provider Adapter SPI |
| **Collaboration Platform** | VersionService (backend), VersionHistoryPanel (frontend, localStorage) | CollaborationManager, CursorsOverlay, yjsBridge, collaborationStore | RealtimeGateway (WebSocket server), Conflict Resolver, Backend persistence |
| **Provider Registry** | Go templates (AWS/Azure/GCP/K8s), ComponentDefinition entity, PropertyMappingService (AWS only) | Frontend Vercel/Supabase definitions (no backend) | Centralized ProviderRegistry, Adapter abstraction, Cloudflare/Stripe/Railway |
| **Knowledge Graph** | Service Map (health viz), Scorecards, DocAutoLink | Nothing close | Knowledge Graph, Architecture Graph, AI Context Builder |
| **Documentation Engine** | DocScannerService, AutoDocService (ADR only), 9 REST endpoints | Mermaid stub (empty graph) | README gen, C4 gen, meaningful Mermaid from canvas, git sync |
| **Canvas Collaboration** | CursorsOverlay, CollaborationPanel, Comments (in-memory), Share links (in-memory) | Version API exists but not wired to frontend | WebSocket server, CRDT/conflict resolution, backend persistence |

---

## Top Priority Gaps

1. **WebSocket Collaboration Server** — Without this, the entire collaboration frontend is non-functional.
2. **Provider Adapter SPI** — Adding any new provider requires touching 4+ disconnected locations with no abstraction.
3. **Knowledge Graph** — Referenced in architecture vision and roadmap but has zero implementation.
4. **Frontend-Backend Version Wiring** — Backend `VersionService` is complete; frontend ignores it for localStorage.
5. **C4/Mermaid Generation** — `AutoDocService` produces empty diagram stubs rather than rendering actual canvas topology.

---

## Per-Category Details

### 1. Integration Platform

**Exists:**
- `Credential.java` entity with tenantId, provider, authType, encryptedPayload
- `CredentialService.java` (CRUD + testConnection)
- `CredentialController.java` (REST `/api/v1/credentials`)
- `credentialStore.ts` (frontend Zustand store)

**Missing:**
- Connection Manager — no `ConnectionManager` class, testConnection only checks DB record
- Validation Engine — existing `ValidationService` validates canvas topology, not provider health
- Discovery Engine — no service auto-discovers provider resources
- Provider Registry — no centralized registry; knowledge scattered across Go templates, Java PropertyMappingService, frontend static arrays
- Provider Adapter SPI — no `ProviderAdapter` interface; adding a provider requires touching 4+ files
- Cloudflare, Stripe, Railway adapters — not referenced anywhere

### 2. Collaboration Platform

**Exists:**
- `CollaborationPanel.tsx` (616 lines) — Share, Comments, History tabs
- `CursorsOverlay.tsx` (135 lines) — SVG cursor rendering at 20fps
- `CollaborationManager` — wires canvasStore ↔ yjsBridge ↔ WebSocket
- `yjsBridge.ts` (298 lines) — WebSocket lifecycle with reconnect (replaces Yjs CRDT)
- `collaborationStore.ts` (103 lines) — team members, comments, share links (all in-memory)
- `VersionService.java` (292 lines) — create/restore/diff/rollback versions
- `CanvasVersion.java` — JPA entity with snapshot JSON
- `VersionController.java` — REST API at `/api/v1/canvases/{id}/versions`

**Missing:**
- RealtimeGateway — no WebSocket server in Java backend; frontend connects to `ws://localhost:8765` with no listener
- CRDT/Conflict Resolution — replaced with last-writer-wins JSON sync
- Backend persistence for comments, share links, presence
- Frontend-Backend Version wiring — `VersionHistoryPanel.tsx` uses localStorage instead of `VersionController` API

### 3. Provider Registry

**Exists:**
- Go templates: `aws.go` (9 resources), `azure.go` (5), `gcp.go` (4), `k8s.go` (4), `router.go` (dispatcher)
- `ComponentDefinition.java` — JPA entity with provider, resourceType, category, propertiesSchema
- `PropertyMappingService.java` — hardcoded switch/case for 16 AWS resource types
- Frontend: `providerDefinitions.ts` with Vercel (6) and Supabase (6) component definitions

**Missing:**
- Cloudflare — not referenced in any source file
- Stripe — only `BillingStub.java` has stripeCustomerId field
- Railway, Render — referenced in `ProviderType` union but no component definitions
- Centralized ProviderRegistry service
- Provider Adapter abstraction — adding a provider requires touching Go templates, Java PropertyMappingService, frontend providerDefinitions, and ComponentPalette

### 4. Knowledge Graph

**Exists:**
- Service Map (`ServiceMapView.tsx`) — health/alert visualization over canvas nodes
- Scorecards (`ScorecardView.tsx`) — 6 maturity criteria scoring
- DocAutoLink — lightweight document cross-references

**Missing:**
- Knowledge Graph — no graph structure, no graph database
- Architecture Graph — no graph traversal or relationship mapping
- AI Context Builder — `AIService.java` provides raw data to LLM, no structured graph-based context

### 5. Documentation Engine

**Exists:**
- `DocScannerService.java` (263 lines) — recursive .md scan, SHA-256, frontmatter extraction
- `AutoDocService.java` (68 lines) — ADR draft generation, staleness detection
- `CodeGeneratedDocListener.java` — auto-generates ADR after Terraform code gen
- `DocsModule.tsx` (721 lines) — sidebar tree, markdown renderer, search, import, "Gerar ADR"
- `DocsController.java` — 9 REST endpoints (tree, content, scan, search, generate, stale, links)

**Missing:**
- README auto-generation — `AutoDocService` only produces ADR drafts
- C4 diagram generation — Mermaid block in AutoDocService contains empty subgraph
- Meaningful Mermaid from canvas — no service iterates canvas nodes/edges to produce architecture diagrams
- Git sync — files written locally, never committed or pushed
- Broader event-driven doc generation — only `CodeGeneratedEvent` triggers docs; canvas/node/edge/deploy events don't

### 6. Canvas Collaboration

**Exists:**
- CursorsOverlay (frontend SVG cursors)
- CollaborationPanel (3-tab UI: Share, Comments, History)
- Comments (in-memory Zustand)
- Share links (in-memory Zustand with nanoId tokens)
- Version history (localStorage-based)

**Missing:**
- WebSocket server (RealtimeGateway) — entire frontend collaboration is non-functional
- CRDT/conflict resolution — concurrent edits silently overwrite
- Backend persistence for comments, share links, presence
- Frontend wired to backend VersionService API
