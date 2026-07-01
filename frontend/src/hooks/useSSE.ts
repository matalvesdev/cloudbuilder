import { useEffect, useState, useRef, useCallback } from 'react'

interface SSEState<T> {
  data: T | null
  connected: boolean
  error: string | null
  retryCount: number
}

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1'
const MAX_RETRIES = 10
const RETRY_BASE_DELAY = 2000
const RETRY_MAX_DELAY = 60000

export function useSSE<T>(url: string, eventName: string): SSEState<T> & { reconnect: () => void } {
  const [state, setState] = useState<SSEState<T>>({
    data: null,
    connected: false,
    error: null,
    retryCount: 0,
  })
  const eventSourceRef = useRef<EventSource | null>(null)
  const retryCountRef = useRef(0)
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current)
      retryTimerRef.current = null
    }

    const token = localStorage.getItem('cloudbuilder-auth-token')
    const fullUrl = `${BASE_URL}${url}${url.includes('?') ? '&' : '?'}token=${token || ''}`
    const es = new EventSource(fullUrl)

    es.onopen = () => {
      retryCountRef.current = 0
      setState((prev) => ({ ...prev, connected: true, error: null, retryCount: 0 }))
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
      retryCountRef.current++
      setState((prev) => ({ ...prev, connected: false, retryCount: retryCountRef.current }))

      if (retryCountRef.current <= MAX_RETRIES) {
        const delay = Math.min(RETRY_BASE_DELAY * Math.pow(2, retryCountRef.current - 1), RETRY_MAX_DELAY)
        retryTimerRef.current = setTimeout(connect, delay)
      } else {
        setState((prev) => ({ ...prev, error: 'Conexão SSE perdida após múltiplas tentativas. Clique para reconectar.' }))
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
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current)
      }
    }
  }, [connect])

  const reconnect = useCallback(() => {
    retryCountRef.current = 0
    connect()
  }, [connect])

  return { ...state, reconnect }
}
