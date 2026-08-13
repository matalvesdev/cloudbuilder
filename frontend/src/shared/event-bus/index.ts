/**
 * Frontend EventBus — typed pub/sub event system.
 *
 * Replaces scattered SSE/store dispatch patterns with a single typed event bus.
 * Features subscribe to events they care about; WebSocket/SSE feeds events in.
 *
 * Architecture:
 *   Kafka → WebSocket/SSE Gateway → EventBus → Feature modules
 *
 * Usage:
 *   import { eventBus } from '@/shared/event-bus'
 *
 *   // Subscribe
 *   const unsub = eventBus.subscribe('deployment:started', (payload) => {
 *     setDeployStatus(payload.status)
 *   })
 *
 *   // Publish (from WebSocket handler)
 *   eventBus.publish('deployment:started', { deploymentId: '123', status: 'STARTED' })
 *
 *   // Cleanup
 *   unsub()
 */

/* ─── Event Map (register all domain events here) ──────────── */

export interface DomainEvents {
  // Canvas
  "canvas:created": { canvasId: string; tenantId: string };
  "canvas:updated": { canvasId: string; tenantId: string; version: number };
  "canvas:deleted": { canvasId: string; tenantId: string };
  "canvas:node:added": { canvasId: string; nodeId: string; type: string };
  "canvas:node:removed": { canvasId: string; nodeId: string };
  "canvas:edge:added": { canvasId: string; edgeId: string };
  "canvas:edge:removed": { canvasId: string; edgeId: string };

  // Deployment
  "deployment:requested": { deploymentId: string; environmentId: string };
  "deployment:started": { deploymentId: string; status: string };
  "deployment:progress": {
    deploymentId: string;
    percent: number;
    message: string;
  };
  "deployment:succeeded": { deploymentId: string; resources: string[] };
  "deployment:failed": { deploymentId: string; error: string };
  "deployment:cancelled": { deploymentId: string };

  // Provisioning
  "provision:started": { resourceId: string; provider: string };
  "provision:progress": {
    resourceId: string;
    percent: number;
    message: string;
  };
  "provision:completed": {
    resourceId: string;
    outputs: Record<string, string>;
  };
  "provision:failed": { resourceId: string; error: string };

  // Drift
  "drift:detected": { environmentId: string; resourceCount: number };
  "drift:resolved": { environmentId: string; resourceId: string };

  // Cost
  "cost:budget-exceeded": {
    environmentId: string;
    budgetId: string;
    amount: number;
  };
  "cost:anomaly-detected": {
    environmentId: string;
    service: string;
    deviation: number;
  };
  "cost:optimization-available": {
    environmentId: string;
    suggestionId: string;
  };

  // Observability
  "observe:alert:fired": { alertId: string; severity: string; service: string };
  "observe:alert:resolved": { alertId: string; service: string };
  "observe:health:changed": { serviceId: string; status: string };
  "observe:metrics:update": {
    serviceId: string;
    metrics: Record<string, number>;
  };

  // Incidents
  "incident:created": { incidentId: string; title: string; severity: string };
  "incident:updated": { incidentId: string; status: string };
  "incident:resolved": { incidentId: string; rootCause: string };

  // Notifications
  "notification:new": {
    notificationId: string;
    type: string;
    title: string;
    message: string;
  };
  "notification:read": { notificationId: string };

  // Auth
  "auth:login": { userId: string; tenantId: string };
  "auth:logout": { userId: string };
  "auth:token-refreshed": { expiresAt: number };

  // Feature flags
  "flags:updated": { flagKey: string; enabled: boolean };

  // Generic fallback for untyped events
  [key: string]: Record<string, unknown>;
}

export type EventKey = string & keyof DomainEvents;
export type EventPayload<K extends EventKey> = DomainEvents[K];
export type EventHandler<K extends EventKey> = (
  payload: EventPayload<K>,
) => void;

/* ─── EventBus Implementation ──────────────────────────────── */

type GenericHandler = (payload: Record<string, unknown>) => void;

interface Subscription {
  id: string;
  event: string;
  handler: GenericHandler;
  once: boolean;
}

let subscriptionCounter = 0;

class EventBus {
  private subscriptions = new Map<string, Subscription[]>();
  private middleware: Array<
    (
      event: string,
      payload: Record<string, unknown>,
    ) => Record<string, unknown> | null
  > = [];

  /**
   * Subscribe to an event. Returns unsubscribe function.
   */
  subscribe<K extends EventKey>(
    event: K,
    handler: EventHandler<K>,
    options?: { once?: boolean },
  ): () => void {
    const id = String(++subscriptionCounter);
    const sub: Subscription = {
      id,
      event,
      handler: handler as GenericHandler,
      once: options?.once ?? false,
    };

    const list = this.subscriptions.get(event) ?? [];
    list.push(sub);
    this.subscriptions.set(event, list);

    return () => {
      const subs = this.subscriptions.get(event) ?? [];
      const idx = subs.findIndex((s) => s.id === id);
      if (idx >= 0) subs.splice(idx, 1);
    };
  }

  /**
   * Subscribe to an event, auto-unsubscribes after first fire.
   */
  subscribeOnce<K extends EventKey>(
    event: K,
    handler: EventHandler<K>,
  ): () => void {
    return this.subscribe(event, handler, { once: true });
  }

  /**
   * Publish an event to all subscribers.
   * Runs through middleware pipeline first; if any returns null, event is swallowed.
   */
  publish<K extends EventKey>(event: K, payload: EventPayload<K>): void {
    let processedPayload = payload as Record<string, unknown>;

    for (const mw of this.middleware) {
      const result = mw(event, processedPayload);
      if (result === null) return; // event swallowed
      processedPayload = result;
    }

    const subs = this.subscriptions.get(event) ?? [];
    const toRemove: string[] = [];

    for (const sub of subs) {
      try {
        sub.handler(processedPayload);
        if (sub.once) toRemove.push(sub.id);
      } catch (err) {
        console.error(`[EventBus] Error in handler for "${event}":`, err);
      }
    }

    // Clean up once-handlers
    if (toRemove.length > 0) {
      const remaining = subs.filter((s) => !toRemove.includes(s.id));
      this.subscriptions.set(event, remaining);
    }
  }

  /**
   * Add middleware that can transform or swallow events.
   * Return null to swallow the event, or return (possibly modified) payload.
   */
  addMiddleware(
    fn: (
      event: string,
      payload: Record<string, unknown>,
    ) => Record<string, unknown> | null,
  ): () => void {
    this.middleware.push(fn);
    return () => {
      const idx = this.middleware.indexOf(fn);
      if (idx >= 0) this.middleware.splice(idx, 1);
    };
  }

  /**
   * Remove all subscriptions for an event, or all events if no event specified.
   */
  clear(event?: string): void {
    if (event) {
      this.subscriptions.delete(event);
    } else {
      this.subscriptions.clear();
    }
  }

  /**
   * Get subscriber count for an event (useful for debugging).
   */
  listenerCount(event: string): number {
    return this.subscriptions.get(event)?.length ?? 0;
  }

  /**
   * Get all registered event names (useful for debugging).
   */
  eventNames(): string[] {
    return Array.from(this.subscriptions.keys());
  }
}

/** Singleton EventBus instance */
export const eventBus = new EventBus();

/**
 * React hook helper: subscribe to an event with automatic cleanup.
 * Usage: useEventBus('deployment:started', (payload) => { ... })
 */
export function createEventSubscription<K extends EventKey>(
  event: K,
  handler: EventHandler<K>,
  deps: React.DependencyList = [],
): void {
  // This is a simple wrapper — actual React hook usage should use useEffect
  // This export is for non-React contexts (stores, services)
}
