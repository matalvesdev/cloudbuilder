import { useEffect, useRef, useState } from 'react'
import type { MetricsSnapshot, ResourceMetrics } from '@/api/types'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1'

interface UseMetricsStreamOptions {
  enabled: boolean
  nodeIds: string[]
  nodeNames: Record<string, string>  // nodeId → display name
}

/**
 * Connects to the backend SSE metrics endpoint and streams
 * resource metrics into a state map keyed by nodeId.
 *
 * Auto-reconnects on connection loss (standard SSE behavior).
 */
export function useMetricsStream({ enabled, nodeIds, nodeNames }: UseMetricsStreamOptions) {
  const [metricsMap, setMetricsMap] = useState<Record<string, ResourceMetrics>>({})
  const [connected, setConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<number | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!enabled || nodeIds.length === 0) {
      // Clean up if disabled
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
      setConnected(false)
      return
    }

    // Build URL with node IDs and names
    const nameParams = nodeIds.map((id, i) => `name${i}=${encodeURIComponent(nodeNames[id] || id)}`).join('&')
    const url = `${API_BASE}/metrics/stream?nodeIds=${nodeIds.join(',')}&${nameParams}`

    const connect = () => {
      const es = new EventSource(url)
      eventSourceRef.current = es

      es.onopen = () => {
        setConnected(true)
      }

      es.addEventListener('metrics', (event) => {
        try {
          const snapshot: MetricsSnapshot = JSON.parse(event.data)
          const map: Record<string, ResourceMetrics> = {}
          for (const res of snapshot.resources) {
            map[res.nodeId] = res
          }
          setMetricsMap(map)
          setLastUpdate(snapshot.timestamp)
        } catch (err) {
          console.error('[MetricsStream] Failed to parse metrics event:', err)
        }
      })

      es.onerror = () => {
        setConnected(false)
        es.close()
        // Auto-reconnect after 5s
        reconnectTimerRef.current = setTimeout(() => {
          connect()
        }, 5000)
      }
    }

    connect()

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current)
        reconnectTimerRef.current = null
      }
      setConnected(false)
    }
  }, [enabled, nodeIds.join(',')]) // eslint-disable-line react-hooks/exhaustive-deps

  return { metricsMap, connected, lastUpdate }
}
