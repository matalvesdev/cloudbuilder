import { type ReactNode, useState, useMemo, useRef, useEffect } from 'react'
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
  User,
  Zap,
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
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const profileDropdownRef = useRef<HTMLDivElement>(null)
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
  
  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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

          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 border border-green-200">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
            </span>
            <span className="text-[10px] font-semibold text-green-700">Online</span>
          </div>

          {/* User Profile Dropdown */}
          <div className="relative" ref={profileDropdownRef}>
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-100 transition-all"
            >
              <div className="w-8 h-8 rounded-full bg-brand-navy flex items-center justify-center ring-2 ring-transparent hover:ring-brand-lime/50 transition-all">
                <span className="text-[10px] font-bold text-brand-lime">
                  {user?.name?.substring(0, 2).toUpperCase() || '?'}
                </span>
              </div>
              <ChevronDown className={cn('w-3.5 h-3.5 text-slate-400 transition-transform', showProfileDropdown && 'rotate-180')} />
            </button>

            {showProfileDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowProfileDropdown(false)} />
                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl border border-slate-200 shadow-xl z-50 overflow-hidden">
                  {/* User Info Header */}
                  <div className="p-4 bg-gradient-to-br from-brand-navy to-[#0D1B2A] text-white">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                        <span className="text-sm font-bold">{user?.name?.substring(0, 2).toUpperCase() || '?'}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{user?.name || 'Usuário'}</p>
                        <p className="text-[11px] text-white/60 truncate">{user?.email}</p>
                      </div>
                    </div>
                    {user?.roles && user.roles.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-3">
                        {user.roles.map((role) => (
                          <span key={role} className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/15 font-medium">
                            {role === 'admin' ? 'Admin' : role === 'editor' ? 'Editor' : 'Viewer'}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Menu Items */}
                  <div className="p-1.5">
                    <button
                      onClick={() => { setShowProfileDropdown(false); onModuleChange('settings') }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      Meu Perfil
                    </button>
                    <button
                      onClick={() => { setShowProfileDropdown(false); onModuleChange('settings') }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <Settings className="w-4 h-4 text-slate-400" />
                      Configurações
                    </button>
                    {(configuredCount < totalConfigItems || progress.stage === 'skipped') && (
                      <button
                        onClick={() => { setShowProfileDropdown(false); resetToWelcome() }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-brand-navy hover:bg-ice-blue/50 transition-colors"
                      >
                        <Zap className="w-4 h-4" />
                        Configuração Inicial
                      </button>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-slate-100 mx-1.5" />

                  {/* Logout */}
                  <div className="p-1.5">
                    <button
                      onClick={() => { setShowProfileDropdown(false); logout() }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sair da conta
                    </button>
                  </div>
                </div>
              </>
            )}
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
