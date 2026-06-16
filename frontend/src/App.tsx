import { useEffect, useState, Suspense, lazy, ComponentType } from 'react'
import {
  LayoutDashboard,
  Box,
  Eye,
  DollarSign,
  Cpu,
  BrainCircuit,
  Cloud,
  LogOut,
  ScrollText,
  Shield,
  Activity,
  ChevronRight,
  Settings,
  Building2,
  Check,
} from 'lucide-react'
import { useUiStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'
import { useTenantStore } from '@/store/tenantStore'
import { LoginPage } from '@/modules/auth/LoginPage'
import { RegisterPage } from '@/modules/auth/RegisterPage'
import { ForgotPasswordPage } from '@/modules/auth/ForgotPasswordPage'
import { ResetPasswordPage } from '@/modules/auth/ResetPasswordPage'
import { TenantSelector } from '@/components/TenantSelector'
import { ProtectedContent } from '@/components/ProtectedContent'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Helper for named-export modules: lazy(() => import('./Foo')) needs default export,
// but our modules use named exports. This bridges the gap.
function lazyImport<T extends Record<string, ComponentType<any>>, K extends keyof T>(
  factory: () => Promise<T>,
  name: K,
) {
  return lazy(() => factory().then((mod) => ({ default: mod[name] })))
}

// Lazy-loaded modules (code-split into separate chunks)
const DashboardModule = lazyImport(() => import('@/modules/dashboard/DashboardModule'), 'DashboardModule')
const DesignModule = lazyImport(() => import('@/modules/design/DesignModule'), 'DesignModule')
const ProvisionModule = lazyImport(() => import('@/modules/provision/ProvisionModule'), 'ProvisionModule')
const ObserveModule = lazyImport(() => import('@/modules/observe/ObserveModule'), 'ObserveModule')
const CostModule = lazyImport(() => import('@/modules/cost/CostModule'), 'CostModule')
const PlatformModule = lazyImport(() => import('@/modules/platform/PlatformModule'), 'PlatformModule')
const AIOpsModule = lazyImport(() => import('@/modules/aiops/AIOpsModule'), 'AIOpsModule')
const AuditModule = lazyImport(() => import('@/modules/audit/AuditModule'), 'AuditModule')
const IAMModule = lazyImport(() => import('@/modules/iam/IAMModule'), 'IAMModule')
const SettingsModule = lazyImport(() => import('@/modules/settings/SettingsModule'), 'SettingsModule')

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

const moduleHierarchy: Record<string, { section: string; path: string[] }> = {
  dashboard: { section: 'Visão Geral', path: ['Dashboard'] },
  design: { section: 'Infraestrutura', path: ['Infraestrutura', 'Design'] },
  provision: { section: 'Infraestrutura', path: ['Infraestrutura', 'Provisionamento'] },
  observe: { section: 'Operações', path: ['Operações', 'Observabilidade'] },
  cost: { section: 'Operações', path: ['Operações', 'Custos'] },
  platform: { section: 'Plataforma', path: ['Plataforma', 'Catálogo'] },
  aiops: { section: 'Operações', path: ['Operações', 'AIOps'] },
  audit: { section: 'Governança', path: ['Governança', 'Auditoria'] },
  iam: { section: 'Governança', path: ['Governança', 'IAM'] },
  settings: { section: 'Sistema', path: ['Sistema', 'Configurações'] },
}

const modules = [
  { id: 'dashboard' as const, label: 'Dashboard', icon: Activity },
  { id: 'design' as const, label: 'Design', icon: LayoutDashboard },
  { id: 'provision' as const, label: 'Provisionar', icon: Box },
  { id: 'observe' as const, label: 'Observar', icon: Eye },
  { id: 'cost' as const, label: 'Custos', icon: DollarSign },
  { id: 'platform' as const, label: 'Plataforma', icon: Cpu },
  { id: 'aiops' as const, label: 'AIOps', icon: BrainCircuit },
  { id: 'audit' as const, label: 'Auditoria', icon: ScrollText },
  { id: 'iam' as const, label: 'IAM', icon: Shield },
  { id: 'settings' as const, label: 'Config', icon: Settings },
]

const moduleLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  design: 'Design',
  provision: 'Provisionamento',
  observe: 'Observabilidade',
  cost: 'Custos',
  platform: 'Plataforma',
  aiops: 'AIOps',
  audit: 'Auditoria',
  iam: 'IAM',
  settings: 'Configurações',
}

const moduleRoles: Record<string, string[]> = {
  iam: ['admin'],
  audit: ['admin'],
  settings: undefined as unknown as string[],
}

const moduleComponents: Record<string, React.ReactNode> = {
  dashboard: <Suspense fallback={<ModuleFallback />}><DashboardModule /></Suspense>,
  design: <Suspense fallback={<ModuleFallback />}><DesignModule /></Suspense>,
  provision: <Suspense fallback={<ModuleFallback />}><ProvisionModule /></Suspense>,
  observe: <Suspense fallback={<ModuleFallback />}><ObserveModule /></Suspense>,
  cost: <Suspense fallback={<ModuleFallback />}><CostModule /></Suspense>,
  platform: <Suspense fallback={<ModuleFallback />}><PlatformModule /></Suspense>,
  aiops: <Suspense fallback={<ModuleFallback />}><AIOpsModule /></Suspense>,
  audit: <ProtectedContent roles={['admin']}><Suspense fallback={<ModuleFallback />}><AuditModule /></Suspense></ProtectedContent>,
  iam: <ProtectedContent roles={['admin']}><Suspense fallback={<ModuleFallback />}><IAMModule /></Suspense></ProtectedContent>,
  settings: <Suspense fallback={<ModuleFallback />}><SettingsModule /></Suspense>,
}

function App() {
  const { activeModule, setActiveModule } = useUiStore()
  const { isAuthenticated, isLoading, checkAuth, logout, user } = useAuthStore()
  const { projects, activeProjectId, switchProject, getActiveProject } = useTenantStore()
  const [showProjectMenu, setShowProjectMenu] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot-password' | 'reset-password'>('login')
  const [resetToken, setResetToken] = useState<string | null>(null)

  useEffect(() => {
    // Check for reset-password token in URL params (hash-based)
    const params = new URLSearchParams(window.location.search)
    const mode = params.get('authMode')
    const token = params.get('token')
    if (mode === 'reset-password' && token) {
      setResetToken(token)
      setAuthMode('reset-password')
      // Clean URL without reload
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
    if (authMode === 'register') {
      return <RegisterPage onSwitchToLogin={() => setAuthMode('login')} />
    }
    if (authMode === 'forgot-password') {
      return <ForgotPasswordPage onSwitchToLogin={() => setAuthMode('login')} />
    }
    if (authMode === 'reset-password' && resetToken) {
      return <ResetPasswordPage token={resetToken} onSwitchToLogin={() => setAuthMode('login')} />
    }
    return <LoginPage
      onSwitchToRegister={() => setAuthMode('register')}
      onSwitchToForgotPassword={() => setAuthMode('forgot-password')}
    />
  }

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-slate-50 relative">
      {/* Dot grid background */}
      <div className="fixed inset-0 dot-grid pointer-events-none z-0 opacity-60" />
      <header className="h-14 bg-white/90 backdrop-blur-sm border-b border-slate-200 flex items-center px-5 gap-1 shrink-0 z-30">
        <div className="flex items-center gap-3 group cursor-pointer shrink-0">
          <div className="w-8 h-8 rounded-lg bg-brand-navy flex items-center justify-center transition-transform group-hover:scale-105">
            <Cloud className="h-5 w-5 text-brand-lime" />
          </div>
          <span className="font-display font-bold text-base text-brand-navy">CloudBuilder</span>
        </div>

        {/* Tenant Selector */}
        <TenantSelector />

        {/* Project Switcher */}
        {isAuthenticated && projects.length > 0 && (
          <div className="relative mx-2 shrink-0">
            <button
              onClick={() => setShowProjectMenu(!showProjectMenu)}
              className="inline-flex items-center gap-1.5 px-2.5 h-7 rounded-lg text-[11px] font-semibold bg-ice-blue/60 text-brand-navy hover:bg-ice-blue border border-brand-navy/10 transition-all"
            >
              <Building2 className="w-3 h-3" />
              <span className="max-w-[100px] truncate">{getActiveProject()?.name || 'Projeto'}</span>
              <ChevronRight className={cn('w-3 h-3 transition-transform', showProjectMenu && 'rotate-90')} />
            </button>
            {showProjectMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowProjectMenu(false)} />
                <div className="absolute left-0 top-full mt-1 w-56 bg-white rounded-xl border border-slate-200 shadow-lg z-50 py-1 max-h-64 overflow-y-auto">
                  {projects.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => { switchProject(p.id); setShowProjectMenu(false) }}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-2 text-xs transition-all text-left',
                        p.id === activeProjectId
                          ? 'bg-brand-navy/5 text-brand-navy font-bold'
                          : 'text-slate-600 hover:bg-slate-50'
                      )}
                    >
                      <Building2 className={cn(
                        'w-3.5 h-3.5 shrink-0',
                        p.id === activeProjectId ? 'text-brand-navy' : 'text-slate-400'
                      )} />
                      <span className="truncate flex-1">{p.name}</span>
                      {p.id === activeProjectId && <Check className="w-3 h-3 text-brand-navy shrink-0" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 mx-4 shrink-0">
          {moduleHierarchy[activeModule]?.path.map((item, idx, arr) => (
            <div key={item} className="flex items-center gap-1.5">
              {idx > 0 && <ChevronRight className="w-3 h-3 text-slate-300" />}
              {idx === 0 ? (
                <span className="text-[11px] font-medium text-slate-400">{item}</span>
              ) : idx === arr.length - 1 ? (
                <span className="text-[11px] font-bold text-brand-navy">{item}</span>
              ) : (
                <span className="text-[11px] font-medium text-slate-500">{item}</span>
              )}
            </div>
          ))}
        </div>

        {/* Visual separator */}
        <div className="w-px h-6 bg-slate-200 mx-1 shrink-0" />

        <nav className="flex items-center bg-slate-100/80 rounded-full p-0.5 gap-0.5 overflow-x-auto shrink-0">
          {modules.map((mod) => (
            <ProtectedContent key={mod.id} roles={moduleRoles[mod.id]}>
              <Button
                variant={activeModule === mod.id ? 'default' : 'ghost'}
                size="sm"
                className={`
                  h-8 gap-1.5 text-sm rounded-full px-3.5 transition-all shrink-0
                  ${activeModule === mod.id
                    ? 'bg-brand-navy text-brand-lime hover:bg-brand-navy hover:text-brand-lime shadow-sm'
                    : 'text-slate-500 hover:text-brand-navy hover:bg-white/80'
                  }
                `}
                onClick={() => setActiveModule(mod.id)}
              >
                <mod.icon className="h-4 w-4" />
                <span className="text-xs font-semibold">{mod.label}</span>
              </Button>
            </ProtectedContent>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 border border-green-200">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
            </span>
            <span className="text-[10px] font-semibold text-green-700">Online</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500 group relative">
            <div className="w-7 h-7 rounded-full bg-brand-navy flex items-center justify-center ring-2 ring-transparent hover:ring-brand-lime/50 transition-all">
              <span className="text-[10px] font-bold text-brand-lime">
                {user?.name?.substring(0, 2).toUpperCase() || '?'}
              </span>
            </div>
            <span className="text-xs font-medium hidden sm:inline text-slate-600">{user?.name || 'Usuário'}</span>
            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl border border-slate-200 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              <div className="p-3 border-b border-slate-100">
                <p className="text-sm font-medium text-brand-navy">{user?.name}</p>
                <p className="text-xs text-slate-400">{user?.email}</p>
              </div>
              <div className="p-1">
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sair
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 overflow-hidden">
        {moduleComponents[activeModule]}
      </main>
    </div>
  )
}

export default App
