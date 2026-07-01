import { type ReactNode, useState, useMemo } from 'react'
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
  ChevronDown,
  Settings,
  Building2,
  Check,
  BookOpen,
  Search,
  X,
  ArrowRight,
  BarChart3,
  Flag,
} from 'lucide-react'
import { useUiStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'
import { useTenantStore } from '@/store/tenantStore'
import { useOnboardingStore } from '@/store/onboardingStore'
import { useCredentialStore } from '@/store/credentialStore'
import { useRepoStore } from '@/store/repoStore'
import { TenantSelector } from '@/components/TenantSelector'
import { OfflineBanner } from '@/components/OfflineBanner'
import GlobalSearch from '@/components/GlobalSearch'
import { cn } from '@/lib/utils'
import { moduleHierarchy, navGroups, moduleRoles } from '@/router'

type ModuleId = 'dashboard' | 'canvas' | 'provisioning' | 'observability' | 'finops' | 'platform' | 'ai' | 'security' | 'security' | 'settings' | 'docs' | 'dashboard' | 'settings'

const iconMap: Record<string, React.ElementType> = {
  Activity,
  BarChart3,
  LayoutDashboard,
  Box,
  Eye,
  DollarSign,
  BrainCircuit,
  Cpu,
  ScrollText,
  Shield,
  Flag,
  BookOpen,
  Settings,
}

interface MainLayoutProps {
  children: ReactNode
  activeModule: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onModuleChange: (module: any) => void
}

export function MainLayout({ children, activeModule, onModuleChange }: MainLayoutProps) {
  const { toggleSearch } = useUiStore()
  const { isAuthenticated, logout, user } = useAuthStore()
  const { projects, activeProjectId, switchProject, getActiveProject } = useTenantStore()
  const { progress, resetToWelcome } = useOnboardingStore()
  const { credentials, environments } = useCredentialStore()
  const { connectedRepos } = useRepoStore()
  const [showProjectMenu, setShowProjectMenu] = useState(false)
  const [showSetupPopover, setShowSetupPopover] = useState(false)
  const [query, setQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)

  interface NavItem { id: string; label: string; icon: React.ElementType }
  const allNavItems = useMemo<NavItem[]>(
    () => navGroups.flatMap(g => g.items.map(item => ({
      ...item,
      icon: iconMap[item.icon] || Activity
    }))),
    []
  )
  
  const searchResults = useMemo<NavItem[]>(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    return allNavItems.filter(
      (item) => item.label.toLowerCase().includes(q) || item.id.includes(q)
    )
  }, [query, allNavItems])

  const hasCredentials = credentials.length > 0
  const hasEnvironments = environments.length > 0
  const hasRepos = connectedRepos.length > 0
  const configuredCount = [hasCredentials, hasEnvironments, hasRepos].filter(Boolean).length
  const totalConfigItems = 3

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

        <nav className="flex items-center gap-0.5 shrink-0">
          {navGroups.map((group) => {
            const visibleItems = group.items.filter((item) => {
              const reqRoles = moduleRoles[item.id]
              const hasRole = !reqRoles || !user?.roles || reqRoles.some((r) => user.roles.includes(r))
              if (!hasRole) return false
              if (item.id === 'finops') return useUiStore.getState().isEnabled('module.cost')
              if (item.id === 'platform') return useUiStore.getState().isEnabled('module.platform')
              if (item.id === 'ai') return useUiStore.getState().isEnabled('module.aiops')
              if (item.id === 'security') return useUiStore.getState().isEnabled('module.audit')
              return true
            })
            if (visibleItems.length === 0) return null

            if (visibleItems.length === 1) {
              const item = visibleItems[0]
              const IconComp = iconMap[item.icon] || Activity
              const isActive = activeModule === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => onModuleChange(item.id as ModuleId)}
                  className={cn(
                    "relative h-8 px-3 text-xs font-semibold transition-all flex items-center gap-1.5 rounded-lg shrink-0",
                    isActive
                      ? 'text-brand-navy bg-brand-navy/5'
                      : 'text-slate-500 hover:text-brand-navy hover:bg-slate-100'
                  )}
                >
                  <IconComp className="h-4 w-4" />
                  <span>{item.label}</span>
                  {isActive && <span className="absolute bottom-0.5 left-1.5 right-1.5 h-0.5 bg-brand-lime rounded-full" />}
                </button>
              )
            }

            const isGroupActive = visibleItems.some((item) => activeModule === item.id)
            return (
              <div key={group.label} className="relative group shrink-0">
                <button
                  className={cn(
                    "relative h-8 px-3 text-xs font-semibold transition-all flex items-center gap-1.5 rounded-lg cursor-default",
                    isGroupActive
                      ? 'text-brand-navy bg-brand-navy/5'
                      : 'text-slate-500 hover:text-brand-navy hover:bg-slate-100'
                  )}
                >
                  <span>{group.label}</span>
                  <ChevronDown className="h-3 w-3 opacity-50 group-hover:opacity-80 transition-opacity" />
                  {isGroupActive && <span className="absolute bottom-0.5 left-1.5 right-1.5 h-0.5 bg-brand-lime rounded-full" />}
                </button>
                <div className="absolute left-0 top-full mt-1 min-w-[11rem] bg-white rounded-xl border border-slate-200 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 py-1 overflow-hidden">
                  <div className="py-0.5">
                    {visibleItems.map((item) => {
                      const IconComp = iconMap[item.icon] || Activity
                      const isItemActive = activeModule === item.id
                      return (
                        <button
                          key={item.id}
                          onClick={() => onModuleChange(item.id as ModuleId)}
                          className={cn(
                            "w-full flex items-center gap-3 px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap",
                            isItemActive
                              ? 'text-brand-navy bg-brand-navy/5 font-semibold'
                              : 'text-slate-600 hover:bg-slate-50 hover:text-brand-navy'
                          )}
                        >
                          <span className={cn(
                            'flex items-center justify-center w-6 h-6 rounded-lg shrink-0',
                            isItemActive ? 'bg-brand-navy/10' : 'bg-slate-100'
                          )}>
                            <IconComp className="h-3.5 w-3.5" />
                          </span>
                          <span className="flex-1 text-left">{item.label}</span>
                          {isItemActive && <span className="w-1.5 h-1.5 rounded-full bg-brand-lime shrink-0" />}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })}
        </nav>

        {/* Global Search Bar */}
        <div className="relative flex-1 max-w-xs mx-3 shrink-0">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowSearch(true)}
            onBlur={() => setTimeout(() => setShowSearch(false), 200)}
            placeholder="Pesquisar módulos, recursos..."
            className="w-full h-8 pl-8 pr-3 rounded-lg bg-slate-100 border border-transparent text-xs text-brand-navy placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-slate-200 focus:shadow-sm transition-all"
          />
          {query.length > 0 && (
            <button onClick={() => setQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          {showSearch && query.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl border border-slate-200 shadow-lg z-50 py-2 max-h-72 overflow-y-auto">
              {searchResults.length === 0 ? (
                <div className="px-3.5 py-3 text-xs text-slate-400 text-center">Nenhum resultado encontrado</div>
              ) : (
                searchResults.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => { onModuleChange(r.id as ModuleId); setQuery(''); setShowSearch(false) }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-left hover:bg-slate-50 transition-colors"
                  >
                    <r.icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-medium text-brand-navy">{r.label}</span>
                    <ArrowRight className="w-3 h-3 text-slate-300 ml-auto shrink-0" />
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <div className="ml-auto flex items-center gap-3">
          {/* Setup Status Indicator */}
          <div className="relative hidden sm:block">
            <button
              onClick={() => setShowSetupPopover(!showSetupPopover)}
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 h-7 rounded-full text-[10px] font-semibold border transition-all',
                configuredCount === totalConfigItems
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : configuredCount > 0
                    ? 'bg-amber-50 border-amber-200 text-amber-700'
                    : 'bg-red-50 border-red-200 text-red-700'
              )}
            >
              <span className={cn(
                'w-1.5 h-1.5 rounded-full',
                configuredCount === totalConfigItems ? 'bg-green-500' :
                configuredCount > 0 ? 'bg-amber-500' : 'bg-red-500'
              )} />
              {configuredCount}/{totalConfigItems}
            </button>
            {showSetupPopover && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowSetupPopover(false)} />
                <div className="absolute right-0 top-full mt-1.5 w-56 bg-white rounded-xl border border-slate-200 shadow-lg z-50 p-3 space-y-2">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Configuração</p>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs">
                      <span className={cn('w-1.5 h-1.5 rounded-full', hasCredentials ? 'bg-green-500' : 'bg-slate-300')} />
                      <span className={hasCredentials ? 'text-brand-navy font-medium' : 'text-slate-400'}>Credenciais</span>
                      <span className="ml-auto text-slate-400">{credentials.length}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className={cn('w-1.5 h-1.5 rounded-full', hasEnvironments ? 'bg-green-500' : 'bg-slate-300')} />
                      <span className={hasEnvironments ? 'text-brand-navy font-medium' : 'text-slate-400'}>Ambientes</span>
                      <span className="ml-auto text-slate-400">{environments.length}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className={cn('w-1.5 h-1.5 rounded-full', hasRepos ? 'bg-green-500' : 'bg-slate-300')} />
                      <span className={hasRepos ? 'text-brand-navy font-medium' : 'text-slate-400'}>Repositórios</span>
                      <span className="ml-auto text-slate-400">{connectedRepos.length}</span>
                    </div>
                  </div>
                  {configuredCount < totalConfigItems && (
                    <button
                      onClick={() => { setShowSetupPopover(false); resetToWelcome() }}
                      className="w-full mt-1 inline-flex items-center justify-center gap-1.5 px-3 h-8 rounded-lg text-[11px] font-bold bg-brand-navy text-white hover:bg-[#0D1B2A] transition-all"
                    >
                      Continuar Configuração
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

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
                {(configuredCount < totalConfigItems || progress.stage === 'skipped') && (
                  <button
                    onClick={() => { resetToWelcome() }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-brand-navy hover:bg-ice-blue/50 rounded-lg transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Reabrir Configuração
                  </button>
                )}
                <button
                  onClick={() => { onModuleChange('settings') }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Configurações
                </button>
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
      <OfflineBanner />
      <GlobalSearch />
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  )
}
