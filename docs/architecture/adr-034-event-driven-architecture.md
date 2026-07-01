# ADR-034: Event-Driven Architecture for MVP

**Status**: Implemented
**Date**: 2026-06-27
**Author**: Principal Architect (FAANg)
**References**: ADR-012 (Q3 Operations), ADR-016 (GitOps Webhook Event-Driven), ADR-031 (Deployment Architecture)

## Context

CloudBuilder's three MVP modules (Design/Provision, Observe, Cost/Analytics) and the Go provision engine were originally architected with synchronous request-response patterns and event *naming* (event classes, event types, EventPublisher) but without event-driven *behavior*:

- Go engine `EventPublisher` writes events to stdout only — no consumers
- Java `CodeGeneratedEvent` is published but has zero `@EventListener` listeners
- No message broker (Kafka removed Phase 4, no replacement)
- gRPC bridge Java↔Go is predominantly synchronous unary calls
- Zero `@TransactionalEventListener` or `@EventListener` annotations in the entire backend
- `shared/event/` directory does not exist (claimed in ADR-012)

The MVP deals with asynchronous events at every level:
- **Deployment lifecycle**: plan → approve → apply → complete → observe
- **Drift detection**: scheduled detection → alert → notify → resolve
- **Cost monitoring**: record → analyze → anomaly → alert
- **GitOps webhook**: push → scan → detect → suggest → deploy
- **Cross-module reactions**: deploy complete → update observe dashboard → record cost

## Decision

### Adopt True Event-Driven Architecture with Three Layers

```
┌─────────────────────────────────────────────────────────┐
│                    EVENT FLOW                            │
│                                                         │
│  Go Engine Events       Backend Events       Frontend   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌────────┐  │
│  │ Deployment       │  │ Spring Modulith  │  │ SSE    │  │
│  │ Started/Complete │─►│ Event Bus        │─►│ Stream │  │
│  │ Drift Detected   │  │ (@EventListener) │  │        │  │
│  │ Drift Resolved   │  │ DriftDetected    │  │ Event  │  │
│  └────────┬────────┘  │ CostAnomaly      │  │ Source │  │
│           │           │ IncidentCreated  │  └────────┘  │
│           │           │ DeploymentEvent  │              │
│           │           └────────┬─────────┘              │
│           │                    │                         │
│           ▼                    ▼                         │
│  ┌──────────────────────────────────────────┐           │
│  │        gRPC Streaming + HTTP SSE          │           │
│  │  (server-streaming para long-running ops) │           │
│  └──────────────────────────────────────────┘           │
│                                                         │
│  Cada evento: typed → published → logged → consumed     │
└─────────────────────────────────────────────────────────┘
```

### Layer 1 — Go Engine Event Publisher (gRPC Streaming)

**Current problem**: `EventPublisher.Publish()` calls `fmt.Printf` — events vanish.

**Solution**: Wire `EventPublisher` to push events through gRPC server-streaming endpoints. The Go engine already has server-streaming for `Deploy` and `Destroy` — extend this to all long-running operations.

```
Go Engine                                Backend Java
─────────                                ────────────
EventPublisher.Publish() ──gRPC stream──► gRPC client
  deployment.started                       → ApplicationEventPublisher
  drift.detected                            → @EventListener handlers
  cost.anomaly                              → Observe module
                                            → Cost module
                                            → SSE push to frontend
```

Key changes:
- Add `WatchEvents(WatchRequest) returns (stream EngineEvent)` gRPC endpoint
- Wire existing `EventPublisher` to push through it
- Backend runs gRPC client that subscribes and re-publishes as Spring Modulith events
- Drift detection publishes events instead of only returning sync responses

### Layer 2 — Backend Spring Modulith Events

**Current problem**: `CodeGeneratedEvent` is published but no listener exists. Zero `@EventListener` in codebase.

**Solution**: Create full event infrastructure in `shared/event/` and wire cross-module listeners.

```
Event Classes (shared/event/domain/):
├── CodeGeneratedEvent     (canvasId, canvasName, tenantId)
├── DeploymentEvent        (deploymentId, environmentId, status, tenantId)
├── DriftDetectedEvent     (environmentId, reportId, driftCount, tenantId)
├── CostAnomalyEvent       (environmentId, budgetId, currentSpend, threshold)
├── IncidentEvent          (incidentId, severity, status, tenantId)
├── HealthStateEvent       (serviceId, previousState, newState, tenantId)

Cross-Module Wiring:
  CodeGeneratedEvent → [AutoDocService.onCodeGenerated()]
  DeploymentEvent   → [ObserveService.updateServiceMap()]
                    → [CostService.recordDeploymentCost()]
  DriftDetectedEvent → [ObserveService.raiseAlert()]
                     → [NotificationService.notify()]
  CostAnomalyEvent    → [AlertService.raiseAlert()]
                     → [NotificationService.notify()]
  IncidentEvent       → [MetricsService.recordIncident()]
                     → [AuditService.recordAuditEvent()]
```

Implementation pattern:

```java
// Publisher (already works via ApplicationEventPublisher)
eventPublisher.publishEvent(new DeploymentEvent(id, envId, "COMPLETED", tenantId));

// Listener (NEW — currently zero exist in codebase)
@Component
public class DeploymentEventListener {
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onDeploymentCompleted(DeploymentEvent event) {
        // React: update service map, record cost, push SSE
    }
}
```

### Layer 3 — SSE for Frontend Real-Time Events

**Current problem**: Frontend polls REST endpoints. No real-time push.

**Solution**: Single SSE endpoint that fronts all Spring Modulith events.

```java
@RestController
public class EventStreamController {
    private final SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);

    @EventListener
    public void onEvent(PlatformEvent event) {
        emitter.send(SseEmitter.event()
            .name(event.getType())
            .data(event.getPayload()));
    }

    @GetMapping("/api/v1/events/stream")
    public SseEmitter stream() {
        return emitter;
    }
}
```

Frontend subscribes once and distributes typed events to Zustand stores:

```typescript
// useEventStream hook
const useEventStream = () => {
    useEffect(() => {
        const source = new EventSource('/api/v1/events/stream');
        source.addEventListener('drift.detected', (e) => {
            driftStore.handleDriftEvent(JSON.parse(e.data));
        });
        source.addEventListener('deployment.completed', (e) => {
            deployStore.handleDeploymentEvent(JSON.parse(e.data));
        });
        return () => source.close();
    }, []);
};
```

### Event Flow Diagrams

#### Deployment Lifecycle (now truly event-driven)

```
User clicks "Provisionar"
  → POST /api/v1/environments/{id}/deploy
  → DeployController → calls Go engine via gRPC Deploy (streaming)
  → Go engine streams: INIT → PLANNING → PLANNED → APPLYING → APPLIED
  → Backend gRPC client receives each status event
  → Publishes DeploymentEvent(status) via ApplicationEventPublisher
  → @EventListener: ObserveService.updateServiceMap()
  → @EventListener: CostService.recordDeploymentCost()
  → @EventListener: EventStreamController → SSE → Frontend
  → Frontend deployStore receives event → UI updates reactively
```

#### Drift Detection (now push, not poll)

```
Scheduler or manual trigger
  → Go engine runs terraform plan
  → DriftDetector.DetectDrift() returns report
  → EventPublisher.Publish(EventDriftDetected)
  → Wire to gRPC streaming or backend gRPC client polling
  → Backend: DriftDetectedEvent published
  → @EventListener: ObserveService.raiseAlert()
  → @EventListener: EventStreamController → SSE → Frontend
  → Frontend driftStore receives event → badge/notification appears
```

## Alternatives Considered

### A1: Kafka Reintroduction
Re-add Kafka + Zookeeper for cross-module events.

**Prós**: True message broker, persistence, replay, partitioning.
**Contras**: Added ~$200/mo infra cost, operational complexity, contradicts Phase 4 cleanup goal of $0 infra.
**Veredito**: Rejeitado — overengineering for MVP. Spring Modulith events + SSE cover all MVP use cases.

### A2: RabbitMQ via go-queue
Add lightweight RabbitMQ as Go→Java bridge.

**Prós**: Lightweight, AMQP standard, easy to operate.
**Contras**: Extra container, operational cost, single-JVM events don't need it.
**Veredito**: Rejeitado — gRPC streaming already exists and is sufficient.

### A3: WebSocket for All Events
Replace SSE with full-duplex WebSocket.

**Prós**: Bidirectional, lower latency, streaming from frontend possible.
**Contras**: More complex reconnection logic, not natively supported by EventSource API, overkill for server→client push only.
**Veredito**: Rejeitado — SSE is simpler for unidirectional push and natively supported by browsers.

### A4: In-Process Event Bus with gRPC Streaming (SELECTED)

Three-layer event architecture using:
1. Go engine: in-process EventPublisher → gRPC streaming
2. Backend: Spring Modulith `ApplicationEventPublisher` + `@TransactionalEventListener`
3. Frontend: SSE via dedicated controller

**Prós**:
- Zero new dependencies (SSE is native HTTP, Spring events are core Spring)
- Zero new infra cost
- gRPC streaming already exists for Deploy/Destroy — reuse pattern
- Each layer uses the right tool for its domain
- Migratable to Kafka in future without changing event contracts

**Contras**:
- Events are not persisted (no replay without Kafka)
- Single JVM bottleneck for cross-module events
- Not suitable for cross-service eventual consistency at scale

**Mitigations**:
- Outbox Pattern for critical events (deployment approval, cost overrun)
- Metrics on event bus health (event count, queue depth, processing latency)
- Documented migration path to Kafka if event volume exceeds single-JVM capacity

## Consequences

### Files Created
1. `shared/event/PlatformEvent.java` — base event interface
2. `shared/event/domain/DeploymentEvent.java` — deployment lifecycle event
3. `shared/event/domain/DriftDetectedEvent.java` — drift detection event
4. `shared/event/domain/CostAnomalyEvent.java` — cost anomaly event
5. `shared/event/domain/IncidentEvent.java` — incident lifecycle event
6. `shared/event/domain/HealthStateEvent.java` — health state change event
7. `shared/event/config/EventConfig.java` — async event configuration
8. `shared/event/listener/DeploymentEventListener.java` — cross-module handler
9. `shared/event/listener/DriftEventListener.java` — cross-module handler
10. `shared/event/listener/CostEventListener.java` — cross-module handler
11. `shared/event/listener/IncidentEventListener.java` — cross-module handler
12. `shared/event/web/EventStreamController.java` — SSE endpoint
13. `provision-engine/internal/messaging/stream.go` — gRPC stream wiring

### Files Modified
1. `provision/infrastructure/web/CodeGeneratorController.java` — event already published
2. `provision/domain/event/CodeGeneratedEvent.java` — move to shared/event
3. `provision-engine/internal/api/grpc/server.go` — wire EventPublisher to streams
4. `frontend/src/hooks/useEventStream.ts` — SSE subscription hook
5. `frontend/src/stores/driftStore.ts` — reactive event handling
6. `frontend/src/stores/deployStore.ts` — reactive event handling

### Positive
1. Cross-module reactions finally work (deploy → observe → cost)
2. Frontend receives real-time push instead of polling
3. Go engine events have actual consumers
4. Event infrastructure is zero-cost (Spring native + SSE native)
5. Clear migration path to Kafka for future scale
6. All MVP flows now event-driven as required

### Negative
1. Events are in-memory only (lost on restart without Outbox pattern)
2. Testing event chains requires integration test patterns

## References

- ADR-012: Q3 Operations Architecture (Modulith events pattern foundation)
- ADR-016: GitOps Webhook Event-Driven (webhook → event pattern)
- Spring Modulith Events Documentation
- SSE Specification (W3C)
- Enterprise Integration Patterns (Gregor Hohpe)
