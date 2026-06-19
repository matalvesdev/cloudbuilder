import { useEffect, useState, useRef, useCallback } from 'react'

interface SSEState<T> {
  data: T | null
  connected: boolean
  error: string | null
}

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1'

export function useSSE<T>(url: string, eventName: string): SSEState<T> & { reconnect: () => void } {
  const [state, setState] = useState<SSEState<T>>({
    data: null,
    connected: false,
    error: null,
  })
  const eventSourceRef = useRef<EventSource | null>(null)
  const retryCountRef = useRef(0)
  const maxRetries = 5

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    const token = localStorage.getItem('cloudbuilder-auth-token')
    const fullUrl = `${BASE_URL}${url}${url.includes('?') ? '&' : '?'}token=${token || ''}`
    const es = new EventSource(fullUrl)

    es.onopen = () => {
      retryCountRef.current = 0
      setState((prev) => ({ ...prev, connected: true, error: null }))
    }

    es.addEventListener(eventName, (event) => {
      try {
        const parsed = JSON.parse(event.data) as T
        setState((prev) => ({ ...prev, data: parsed }))
      } catch {
        // Ignore parse errors on incomplete events
      }
    })

    es.onerror = () => {
      es.close()
      setState((prev) => ({ ...prev, connected: false }))

      if (retryCountRef.current < maxRetries) {
        retryCountRef.current++
        setTimeout(connect, 3000 * retryCountRef.current)
      } else {
        setState((prev) => ({ ...prev, error: 'Conexão perdida após múltiplas tentativas' }))
      }
    }

    eventSourceRef.current = es
  }, [url, eventName])

  useEffect(() => {
    connect()
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [connect])

  const reconnect = useCallback(() => {
    retryCountRef.current = 0
    connect()
  }, [connect])

  return { ...state, reconnect }
}
