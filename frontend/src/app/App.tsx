import { useEffect, useState } from 'react'
import { Cloud } from 'lucide-react'
import { useUiStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'
import { useEventStream } from '@/hooks/useEventStream'
import { useOnboardingStore } from '@/store/onboardingStore'
import { setToken } from '@/api/client'
import { AppProviders } from './Providers'
import { MainLayout } from '@/layouts/MainLayout'
import { AuthLayout } from '@/layouts/AuthLayout'
import { OnboardingLayout } from '@/layouts/OnboardingLayout'
import {
  DashboardModule,
  CanvasModule,
  ProvisioningModule,
  ObservabilityModule,
  FinOpsModule,
  PlatformModule,
  AIModule,
  SecurityModule,
  SettingsModule,
  DocsModule,
  type ModuleId,
} from '@/router'
import { ProtectedContent } from '@/components/ProtectedContent'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Suspense } from 'react'

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

const moduleComponents: Record<string, React.ReactNode> = {
  dashboard: <ErrorBoundary moduleName="Dashboard"><Suspense fallback={<ModuleFallback />}><DashboardModule /></Suspense></ErrorBoundary>,
  canvas: <ErrorBoundary moduleName="Canvas"><Suspense fallback={<ModuleFallback />}><CanvasModule /></Suspense></ErrorBoundary>,
  provisioning: <ErrorBoundary moduleName="Provisionamento"><Suspense fallback={<ModuleFallback />}><ProvisioningModule /></Suspense></ErrorBoundary>,
  observability: <ErrorBoundary moduleName="Observabilidade"><Suspense fallback={<ModuleFallback />}><ObservabilityModule /></Suspense></ErrorBoundary>,
  finops: <ErrorBoundary moduleName="Custos"><Suspense fallback={<ModuleFallback />}><FinOpsModule /></Suspense></ErrorBoundary>,
  platform: <ErrorBoundary moduleName="Plataforma"><Suspense fallback={<ModuleFallback />}><PlatformModule /></Suspense></ErrorBoundary>,
  ai: <ErrorBoundary moduleName="AI"><Suspense fallback={<ModuleFallback />}><AIModule /></Suspense></ErrorBoundary>,
  security: <ProtectedContent roles={['admin']}><ErrorBoundary moduleName="Segurança"><Suspense fallback={<ModuleFallback />}><SecurityModule /></Suspense></ErrorBoundary></ProtectedContent>,
  docs: <ErrorBoundary moduleName="Documentação"><Suspense fallback={<ModuleFallback />}><DocsModule /></Suspense></ErrorBoundary>,
  settings: <ErrorBoundary moduleName="Configurações"><Suspense fallback={<ModuleFallback />}><SettingsModule /></Suspense></ErrorBoundary>,
}

type AuthMode = 'login' | 'register' | 'forgot-password' | 'reset-password'
type OnboardingView = 'welcome' | 'tour' | 'gateway' | 'done'

function AppContent() {
  const { activeModule, setActiveModule } = useUiStore()
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore()
  const { progress } = useOnboardingStore()

  useEventStream()

  const [authMode, setAuthMode] = useState<AuthMode>('login')
  const [resetToken, setResetToken] = useState<string | null>(null)
  const [onboardingView, setOnboardingView] = useState<OnboardingView>(() => {
    if (progress.stage === 'complete' || progress.stage === 'skipped') return 'done'
    if (progress.stage === 'gateway-setup') return 'gateway'
    return 'welcome'
  })

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    const params = searchParams.size > 0 ? searchParams : hashParams
    const mode = params.get('authMode')
    const token = params.get('token')
    const refreshToken = params.get('refreshToken')

    if (mode === 'reset-password' && token) {
      setResetToken(token)
      setAuthMode('reset-password')
      window.history.replaceState({}, '', window.location.pathname)
    } else if (token && mode !== 'reset-password') {
      setToken(token, refreshToken || undefined)
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-brand-navy flex items-center justify-center">
            <Cloud className="h-5 w-5 text-brand-lime animate-pulse" />
          </div>
          <div className="w-6 h-6 border-2 border-brand-navy border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <AuthLayout mode={authMode} resetToken={resetToken} onSwitch={setAuthMode} />
  }

  if (onboardingView !== 'done') {
    return <OnboardingLayout view={onboardingView} onViewChange={setOnboardingView} />
  }

  return (
    <MainLayout activeModule={activeModule} onModuleChange={setActiveModule}>
      {moduleComponents[activeModule]}
    </MainLayout>
  )
}

export default function App() {
  return (
    <AppProviders>
      <AppContent />
    </AppProviders>
  )
}
