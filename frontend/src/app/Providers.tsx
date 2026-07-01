import { Suspense, useEffect, type ReactNode } from 'react'
import { Cloud } from 'lucide-react'
import { ToastProvider } from '@/lib/toast'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { wsClient } from '@/shared/websocket'
import { registerCommandHandlers } from '@/shared/command-bus/handlers'

function ModuleFallback() {
  return (
    <div className="flex items-center justify-center h-full py-24">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-brand-navy flex items-center justify-center">
          <Cloud className="h-4 w-4 text-brand-lime animate-pulse" />
        </div>
        <div className="w-5 h-5 border-2 border-brand-navy border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  )
}

interface AppProvidersProps {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  useEffect(() => {
    // Register command handlers for CommandBus
    registerCommandHandlers()

    // Connect WebSocket and bridge events to EventBus
    wsClient.connect()
    wsClient.bridgeToEventBus()

    return () => {
      wsClient.disconnect()
    }
  }, [])

  return (
    <ToastProvider>
      <ErrorBoundary moduleName="Geral">
        <Suspense fallback={<ModuleFallback />}>
          {children}
        </Suspense>
      </ErrorBoundary>
    </ToastProvider>
  )
}
