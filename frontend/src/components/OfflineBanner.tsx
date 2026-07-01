import { useEffect, useState, useCallback, useRef } from 'react'
import { WifiOff, RefreshCw, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1'

type ConnectionStatus = 'online' | 'degraded' | 'offline'

const DISMISS_KEY = 'cloudbuilder-offline-dismissed'
const DISMISS_TTL = 5 * 60 * 1000 // 5 minutes
const CHECK_INTERVAL = 30_000 // check every 30s

function isDismissed(): boolean {
  const raw = localStorage.getItem(DISMISS_KEY)
  if (!raw) return false
  const ts = parseInt(raw, 10)
  return Date.now() - ts < DISMISS_TTL
}

function setDismissed(): void {
  localStorage.setItem(DISMISS_KEY, String(Date.now()))
}

/**
 * Banner that monitors backend connectivity and shows degraded/offline status.
 * Placed at the top of the main layout, above the content area.
 */
export function OfflineBanner() {
  const [status, setStatus] = useState<ConnectionStatus>('online')
  const [dismissed, setDismissedState] = useState(isDismissed)
  const [checking, setChecking] = useState(false)
  const mountedRef = useRef(true)

  const checkHealth = useCallback(async () => {
    if (dismissed || checking) return
    setChecking(true)
    try {
      // Health check via actuator endpoint (público, sem auth)
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5000)

      // Use fetch directly to avoid HttpClient's error-throwing behavior
      const res = await fetch(`${BASE_URL.replace('/api/v1', '')}/actuator/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      }).catch(() => null)

      clearTimeout(timeout)

      if (!res) {
        setStatus('offline')
      } else if (res.status >= 500) {
        setStatus('degraded')
      } else {
        setStatus('online')
      }
    } catch {
      setStatus('offline')
    } finally {
      if (mountedRef.current) setChecking(false)
    }
  }, [dismissed, checking])

  // Periodic health checks
  useEffect(() => {
    mountedRef.current = true
    checkHealth()
    const interval = setInterval(checkHealth, CHECK_INTERVAL)
    return () => {
      mountedRef.current = false
      clearInterval(interval)
    }
  }, [dismissed])

  const handleDismiss = () => {
    setDismissed()
    setDismissedState(true)
  }

  const handleRetry = () => {
    setDismissedState(false)
    setStatus('online')
    checkHealth()
  }

  if (status === 'online' || dismissed) return null

  const isOffline = status === 'offline'

  return (
    <div
      className={cn(
        'flex items-center justify-between px-4 py-2 text-sm shrink-0 z-40',
        isOffline
          ? 'bg-red-50 text-red-800 border-b border-red-200'
          : 'bg-amber-50 text-amber-800 border-b border-amber-200',
      )}
    >
      <div className="flex items-center gap-2">
        <WifiOff className="w-4 h-4 shrink-0" />
        <span className="font-medium">
          {isOffline
            ? 'Backend offline — funcionalidades limitadas. Dados simulados podem ser exibidos.'
            : 'Backend com resposta lenta — algumas funcionalidades podem estar degradadas.'}
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleRetry}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium hover:bg-black/5 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Verificar
        </button>
        <button
          onClick={handleDismiss}
          className="p-1 rounded-lg hover:bg-black/5 transition-colors"
          aria-label="Dispensar"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
