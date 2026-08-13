import { useEffect, useRef, useCallback, useState } from "react";
import { eventBus, type EventKey } from "@/shared/event-bus";

/**
 * Event payload received from the backend SSE stream.
 * Matches the JSON structure sent by EventStreamController.
 */
interface SSEEventPayload {
  type: string;
  tenantId: string;
  timestamp: string;
  payload: Record<string, unknown>;
}

export interface EventStreamState {
  connected: boolean;
  retryCount: number;
  lastEventTime: number | null;
}

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api/v1";
const SSE_URL = `${BASE_URL}/events/stream`;
const MAX_RETRIES = 10;
const RETRY_BASE_DELAY = 2000;
const RETRY_MAX_DELAY = 60000;

/**
 * SSE event type → EventBus topic mapping.
 * Bridges backend PlatformEvent types to frontend DomainEvents.
 */
const SSE_TO_EVENTBUS_MAP: Record<string, string> = {
  "deployment.started": "deployment:started",
  "deployment.completed": "deployment:succeeded",
  "deployment.failed": "deployment:failed",
  "deployment.deploying": "deployment:started",
  "drift.detected": "drift:detected",
  "drift.resolved": "drift:resolved",
  "incident.created": "incident:created",
  "incident.updated": "incident:updated",
  "incident.resolved": "incident:resolved",
  "cost.anomaly": "cost:anomaly-detected",
  "cost.budget-exceeded": "cost:budget-exceeded",
  "health.changed": "observe:health:changed",
};

/**
 * useEventStream connects to the single SSE endpoint at /api/v1/events/stream
 * and publishes typed events to the EventBus (architectural consistency).
 *
 * Zustand stores subscribe to EventBus events independently.
 *
 * Architecture:
 *   Backend SSE → useEventStream → EventBus → Zustand stores
 */
export function useEventStream() {
  const eventSourceRef = useRef<EventSource | null>(null);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [state, setState] = useState<EventStreamState>({
    connected: false,
    retryCount: 0,
    lastEventTime: null,
  });

  const connect = useCallback(() => {
    // Clean up any existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }

    const token = localStorage.getItem("cloudbuilder-auth-token");
    const url = `${SSE_URL}?token=${token || ""}`;
    const es = new EventSource(url);

    es.onopen = () => {
      retryCountRef.current = 0;
      setState((prev) => ({ ...prev, connected: true, retryCount: 0 }));
    };

    // Listen for ALL event types — each maps to a backend PlatformEvent type
    // Route through EventBus for architectural consistency
    es.addEventListener("deployment.started", (event) => {
      try {
        const parsed: SSEEventPayload = JSON.parse(event.data);
        eventBus.publish("deployment:started", {
          deploymentId: (parsed.payload?.deploymentId as string) || "",
          status: "started",
        });
        setState((prev) => ({ ...prev, lastEventTime: Date.now() }));
      } catch {
        /* skip malformed */
      }
    });
    es.addEventListener("deployment.completed", (event) => {
      try {
        const parsed: SSEEventPayload = JSON.parse(event.data);
        eventBus.publish("deployment:succeeded", {
          deploymentId: (parsed.payload?.deploymentId as string) || "",
          resources: (parsed.payload?.resources as string[]) || [],
        });
        setState((prev) => ({ ...prev, lastEventTime: Date.now() }));
      } catch {
        /* skip malformed */
      }
    });
    es.addEventListener("deployment.failed", (event) => {
      try {
        const parsed: SSEEventPayload = JSON.parse(event.data);
        eventBus.publish("deployment:failed", {
          deploymentId: (parsed.payload?.deploymentId as string) || "",
          error: (parsed.payload?.error as string) || "Unknown error",
        });
        setState((prev) => ({ ...prev, lastEventTime: Date.now() }));
      } catch {
        /* skip malformed */
      }
    });
    es.addEventListener("drift.detected", (event) => {
      try {
        const parsed: SSEEventPayload = JSON.parse(event.data);
        eventBus.publish("drift:detected", {
          environmentId: (parsed.payload?.environmentId as string) || "",
          resourceCount: (parsed.payload?.resourceCount as number) || 0,
        });
        setState((prev) => ({ ...prev, lastEventTime: Date.now() }));
      } catch {
        /* skip malformed */
      }
    });
    es.addEventListener("drift.resolved", (event) => {
      try {
        const parsed: SSEEventPayload = JSON.parse(event.data);
        eventBus.publish("drift:resolved", {
          environmentId: (parsed.payload?.environmentId as string) || "",
          resourceId: (parsed.payload?.resourceId as string) || "",
        });
        setState((prev) => ({ ...prev, lastEventTime: Date.now() }));
      } catch {
        /* skip malformed */
      }
    });
    es.addEventListener("incident.created", (event) => {
      try {
        const parsed: SSEEventPayload = JSON.parse(event.data);
        eventBus.publish("incident:created", {
          incidentId: (parsed.payload?.id as string) || "",
          title: (parsed.payload?.title as string) || "",
          severity: (parsed.payload?.severity as string) || "unknown",
        });
        setState((prev) => ({ ...prev, lastEventTime: Date.now() }));
      } catch {
        /* skip malformed */
      }
    });

    // Catch-all: route unknown event types through EventBus generic fallback
    es.onmessage = (event) => {
      try {
        const parsed: SSEEventPayload = JSON.parse(event.data);
        if (parsed.type) {
          // Map SSE type to EventBus topic, fallback to generic
          const eventBusTopic = SSE_TO_EVENTBUS_MAP[parsed.type];
          if (eventBusTopic) {
            eventBus.publish(eventBusTopic as EventKey, parsed.payload);
          }
        }
        setState((prev) => ({ ...prev, lastEventTime: Date.now() }));
      } catch {
        /* skip */
      }
    };

    es.onerror = () => {
      es.close();
      retryCountRef.current++;
      setState((prev) => ({
        ...prev,
        connected: false,
        retryCount: retryCountRef.current,
      }));

      if (retryCountRef.current <= MAX_RETRIES) {
        const delay = Math.min(
          RETRY_BASE_DELAY * Math.pow(2, retryCountRef.current - 1),
          RETRY_MAX_DELAY,
        );
        retryTimerRef.current = setTimeout(connect, delay);
      }
    };

    eventSourceRef.current = es;
  }, []);

  const reconnect = useCallback(() => {
    retryCountRef.current = 0;
    connect();
  }, [connect]);

  useEffect(() => {
    connect();
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }
    };
  }, [connect]);

  return { ...state, reconnect };
}
