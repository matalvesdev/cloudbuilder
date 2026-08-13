import { useEffect, useRef, useState, useCallback } from "react";
import type { MetricsSnapshot, ResourceMetrics } from "@/api/types";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080/api/v1";
const MAX_RETRIES = 10;
const RETRY_BASE_DELAY = 2000;
const RETRY_MAX_DELAY = 60000;

interface UseMetricsStreamOptions {
  enabled: boolean;
  nodeIds: string[];
  nodeNames: Record<string, string>; // nodeId → display name
}

/**
 * Connects to the backend SSE metrics endpoint and streams
 * resource metrics into a state map keyed by nodeId.
 *
 * Auto-reconnects with exponential backoff on connection loss.
 */
export function useMetricsStream({
  enabled,
  nodeIds,
  nodeNames,
}: UseMetricsStreamOptions) {
  const [metricsMap, setMetricsMap] = useState<Record<string, ResourceMetrics>>(
    {},
  );
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCountRef = useRef(0);

  // Stable ref for nodeNames to avoid reconnect loop
  const nodeNamesRef = useRef(nodeNames);
  nodeNamesRef.current = nodeNames;

  const connect = useCallback(() => {
    if (!enabled || nodeIds.length === 0) return;

    // Clean up existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    // Build URL with node IDs and names
    const nameParams = nodeIds
      .map(
        (id, i) =>
          `name${i}=${encodeURIComponent(nodeNamesRef.current[id] || id)}`,
      )
      .join("&");
    const url = `${API_BASE}/metrics/stream?nodeIds=${nodeIds.join(",")}&${nameParams}`;

    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onopen = () => {
      retryCountRef.current = 0;
      setConnected(true);
    };

    es.addEventListener("metrics", (event) => {
      try {
        const snapshot: MetricsSnapshot = JSON.parse(event.data);
        const map: Record<string, ResourceMetrics> = {};
        for (const res of snapshot.resources) {
          map[res.nodeId] = res;
        }
        setMetricsMap(map);
        setLastUpdate(snapshot.timestamp);
      } catch (err) {
        console.error("[MetricsStream] Failed to parse metrics event:", err);
      }
    });

    es.onerror = () => {
      setConnected(false);
      es.close();
      retryCountRef.current++;

      if (retryCountRef.current <= MAX_RETRIES) {
        const delay = Math.min(
          RETRY_BASE_DELAY * Math.pow(2, retryCountRef.current - 1),
          RETRY_MAX_DELAY,
        );
        reconnectTimerRef.current = setTimeout(connect, delay);
      }
    };
  }, [enabled, nodeIds.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    connect();
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      setConnected(false);
    };
  }, [connect]);

  return { metricsMap, connected, lastUpdate };
}
