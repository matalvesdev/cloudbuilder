import { useState, useEffect, useCallback } from 'react'
import {
  Link, Cloud, GitBranch, Box, Zap, Database, Bell, Shield, Lock,
  Activity, Brain, Settings, CheckCircle2, XCircle, AlertTriangle,
  Loader2, Plus, Trash2, RefreshCw, ChevronRight, Eye, ExternalLink,
  Copy, Key, Fingerprint, Server, Globe, ChevronLeft, Search, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { integrationApi, type IntegrationDTO, type ProviderInfo } from '@/api/integrations'
import { showSuccess, showApiError } from '@/lib/toast'

// ─── Types ─────────────────────────────────────────────────────

interface Category {
  id: string
  label: string
  icon: typeof Cloud
  color: string
  bg: string
  providers: string[]
  description: string
}

interface WizardStep {
  id: string
  title: string
  description: string
}

// ─── Constants ─────────────────────────────────────────────────

const CATEGORIES: Category[] = [
  { id: 'source-control', label: 'Source Control', icon: GitBranch, color: 'text-purple-500', bg: 'bg-purple-50', providers: ['github', 'gitlab', 'bitbucket', 'azure-devops'], description: 'Repositórios e controle de versão' },
  { id: 'cloud', label: 'Cloud Providers', icon: Cloud, color: 'text-amber-500', bg: 'bg-amber-50', providers: ['aws', 'azure', 'gcp'], description: 'Provedores de nuvem IaaS' },
  { id: 'kubernetes', label: 'Kubernetes', icon: Box, color: 'text-blue-500', bg: 'bg-blue-50', providers: ['eks', 'aks', 'gke'], description: 'Clusters Kubernetes gerenciados' },
  { id: 'cicd', label: 'CI/CD', icon: Zap, color: 'text-orange-500', bg: 'bg-orange-50', providers: ['github-actions', 'gitlab-ci'], description: 'Pipelines de integração contínua' },
  { id: 'databases', label: 'Databases', icon: Database, color: 'text-cyan-500', bg: 'bg-cyan-50', providers: ['supabase', 'neon'], description: 'Bancos de dados e data services' },
  { id: 'notifications', label: 'Notificações', icon: Bell, color: 'text-yellow-500', bg: 'bg-yellow-50', providers: ['slack', 'teams'], description: 'Canais de notificação' },
  { id: 'identity', label: 'Identity', icon: Shield, color: 'text-indigo-500', bg: 'bg-indigo-50', providers: ['auth0', 'keycloak', 'okta'], description: 'Provedores de identidade SSO' },
  { id: 'secrets', label: 'Secrets', icon: Lock, color: 'text-red-500', bg: 'bg-red-50', providers: ['vault'], description: 'Gerenciamento de segredos' },
  { id: 'monitoring', label: 'Monitoring', icon: Activity, color: 'text-teal-500', bg: 'bg-teal-50', providers: ['datadog', 'grafana'], description: 'Observabilidade e monitoramento' },
  { id: 'messaging', label: 'Messaging', icon: Bell, color: 'text-pink-500', bg: 'bg-pink-50', providers: ['kafka', 'rabbitmq'], description: 'Filas e mensageria' },
  { id: 'ai', label: 'AI Providers', icon: Brain, color: 'text-violet-500', bg: 'bg-violet-50', providers: ['openai', 'anthropic'], description: 'Provedores de IA/LLM' },
  { id: 'custom', label: 'Custom', icon: Settings, color: 'text-slate-500', bg: 'bg-slate-50', providers: [], description: 'Integrações personalizadas' },
]

const PROVIDER_NAMES: Record<string, string> = {
  github: 'GitHub', gitlab: 'GitLab', bitbucket: 'Bitbucket', 'azure-devops': 'Azure DevOps',
  aws: 'AWS', azure: 'Azure', gcp: 'GCP',
  eks: 'EKS', aks: 'AKS', gke: 'GKE',
  'github-actions': 'GitHub Actions', 'gitlab-ci': 'GitLab CI',
  supabase: 'Supabase', neon: 'Neon',
  slack: 'Slack', teams: 'MS Teams',
  auth0: 'Auth0', keycloak: 'Keycloak', okta: 'Okta',
  vault: 'Vault', datadog: 'Datadog', grafana: 'Grafana',
  kafka: 'Kafka', rabbitmq: 'RabbitMQ',
  openai: 'OpenAI', anthropic: 'Anthropic',
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  CONNECTED: { label: 'Conectado', color: 'text-green-600 bg-green-50', icon: CheckCircle2 },
  PENDING: { label: 'Pendente', color: 'text-amber-600 bg-amber-50', icon: Loader2 },
  ERROR: { label: 'Erro', color: 'text-red-600 bg-red-50', icon: XCircle },
  DISCONNECTED: { label: 'Desconectado', color: 'text-slate-500 bg-slate-50', icon: AlertTriangle },
}

const HEALTH_CONFIG: Record<string, { label: string; color: string }> = {
  HEALTHY: { label: 'Saudável', color: 'text-green-600' },
  DEGRADED: { label: 'Degradado', color: 'text-amber-600' },
  UNHEALTHY: { label: 'Instável', color: 'text-red-600' },
  UNKNOWN: { label: 'Desconhecido', color: 'text-slate-400' },
}

const WIZARD_STEPS: WizardStep[] = [
  { id: 'select', title: 'Selecionar Provedor', description: 'Escolha o serviço para conectar' },
  { id: 'authenticate', title: 'Autenticar', description: 'Forneça as credenciais de acesso' },
  { id: 'configure', title: 'Configurar', description: 'Ajuste as opções de integração' },
  { id: 'test', title: 'Testar', description: 'Valide a conexão' },
]

// ─── IntegrationHub Component ──────────────────────────────────

export function IntegrationHub() {
  const [integrations, setIntegrations] = useState<IntegrationDTO[]>([])
  const [providers, setProviders] = useState<ProviderInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null)
  const [wizardStep, setWizardStep] = useState(0)
  const [showWizard, setShowWizard] = useState(false)
  const [connecting, setConnecting] = useState<string | null>(null)
  const [showDetail, setShowDetail] = useState<string | null>(null)
  const [healthChecking, setHealthChecking] = useState<string | null>(null)
  const [providerPage, setProviderPage] = useState(1)
  const [providerSearch, setProviderSearch] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'date'>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [statusFilter, setStatusFilter] = useState<'all' | 'connected' | 'disconnected'>('all')
  const PROVIDERS_PER_PAGE = 8

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [ints, provs] = await Promise.all([
        integrationApi.list(),
        integrationApi.listProviders(),
      ])
      setIntegrations(ints)
      setProviders(provs)
    } catch { /* silent */ } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleConnect = async (providerId: string) => {
    setSelectedProvider(providerId)
    setWizardStep(0)
    setShowWizard(true)
  }

  const handleWizardComplete = async () => {
    if (!selectedProvider) return
    setConnecting(selectedProvider)
    try {
      const cat = CATEGORIES.find(c => c.providers.includes(selectedProvider))
      await integrationApi.create({ name: PROVIDER_NAMES[selectedProvider] || selectedProvider, providerId: selectedProvider, category: cat?.id || 'custom' })
      await fetchData()
      showSuccess(`${PROVIDER_NAMES[selectedProvider] || selectedProvider} conectado com sucesso`)
    } catch (err) { showApiError(err, 'Erro ao conectar') } finally {
      setConnecting(null)
      setShowWizard(false)
      setSelectedProvider(null)
      setWizardStep(0)
    }
  }

  const handleDisconnect = async (id: string) => {
    await integrationApi.disconnect(id)
    await fetchData()
    showSuccess('Integração desconectada')
  }

  const handleDelete = async (id: string) => {
    await integrationApi.delete(id)
    await fetchData()
    showSuccess('Integração removida')
  }

  const handleHealthCheck = async (id: string) => {
    setHealthChecking(id)
    try {
      await integrationApi.getHealth(id)
      await fetchData()
    } catch { /* silent */ } finally { setHealthChecking(null) }
  }

  const getConnectedCount = (categoryId: string) =>
    integrations.filter(i => i.category === categoryId && i.status === 'CONNECTED').length

  const stats = {
    total: integrations.length,
    connected: integrations.filter(i => i.status === 'CONNECTED').length,
    pending: integrations.filter(i => i.status === 'PENDING').length,
    error: integrations.filter(i => i.status === 'ERROR').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-brand-navy">Hub de Integrações</h2>
        <p className="text-xs text-slate-400 mt-0.5">Conecte provedores, serviços e ferramentas ao CloudBuilder</p>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats.total, color: 'text-brand-navy' },
          { label: 'Conectados', value: stats.connected, color: 'text-green-600' },
          { label: 'Pendentes', value: stats.pending, color: 'text-amber-600' },
          { label: 'Com Erro', value: stats.error, color: 'text-red-600' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm text-center">
            <p className={cn('text-lg font-bold', s.color)}>{s.value}</p>
            <p className="text-[10px] text-slate-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Category Grid */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <Link className="w-5 h-5 text-brand-navy" />
          <h4 className="text-sm font-bold text-brand-navy">Categorias</h4>
        </div>
        <p className="text-xs text-slate-400 mb-5">Selecione uma categoria para ver os provedores disponíveis</p>

        <div className="grid grid-cols-3 gap-3">
          {CATEGORIES.map((cat) => {
            const connected = getConnectedCount(cat.id)
            return (
              <button key={cat.id} onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                className={cn('p-4 rounded-xl border-2 text-left transition-all hover:shadow-md',
                  activeCategory === cat.id ? 'border-brand-navy bg-brand-navy/5 shadow-md' : 'border-slate-200 bg-white hover:border-slate-300')}>
                <div className="flex items-center justify-between mb-2">
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', cat.bg)}>
                    <cat.icon className={cn('w-5 h-5', cat.color)} />
                  </div>
                  {connected > 0 && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                </div>
                <p className="text-xs font-bold text-brand-navy">{cat.label}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {connected > 0 ? `${connected} conectado(s)` : `${cat.providers.length} provedores`}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Provider List */}
      {activeCategory && (() => {
        const catProviders = CATEGORIES.find(c => c.id === activeCategory)?.providers || []
        let filtered = catProviders.filter(p => {
          // Search filter
          if (providerSearch && !(PROVIDER_NAMES[p] || p).toLowerCase().includes(providerSearch.toLowerCase()) && !p.toLowerCase().includes(providerSearch.toLowerCase())) return false
          // Status filter
          if (statusFilter !== 'all') {
            const isConnected = integrations.some(i => i.providerId === p && i.status === 'CONNECTED')
            if (statusFilter === 'connected' && !isConnected) return false
            if (statusFilter === 'disconnected' && isConnected) return false
          }
          return true
        })

        // Sort by name
        filtered.sort((a, b) => {
          const nameA = (PROVIDER_NAMES[a] || a).toLowerCase()
          const nameB = (PROVIDER_NAMES[b] || b).toLowerCase()
          return sortDir === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA)
        })

        // Sort by date (connected first, then by creation date)
        if (sortBy === 'date') {
          filtered.sort((a, b) => {
            const intA = integrations.find(i => i.providerId === a)
            const intB = integrations.find(i => i.providerId === b)
            const dateA = intA ? new Date(intA.createdAt).getTime() : 0
            const dateB = intB ? new Date(intB.createdAt).getTime() : 0
            return sortDir === 'asc' ? dateA - dateB : dateB - dateA
          })
        }

        const totalPages = Math.ceil(filtered.length / PROVIDERS_PER_PAGE)
        const paginatedProviders = filtered.slice((providerPage - 1) * PROVIDERS_PER_PAGE, providerPage * PROVIDERS_PER_PAGE)

        return (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h5 className="text-sm font-bold text-brand-navy">
              {CATEGORIES.find(c => c.id === activeCategory)?.label}
              <span className="ml-2 text-[10px] text-slate-400 font-normal">({filtered.length} provedores)</span>
            </h5>
            <button onClick={() => { setActiveCategory(null); setProviderPage(1); setProviderSearch('') }} className="text-xs text-slate-400 hover:text-slate-600">Fechar</button>
          </div>

          {/* Search + Filter + Sort Controls */}
          <div className="flex items-center gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input type="text" value={providerSearch} onChange={(e) => { setProviderSearch(e.target.value); setProviderPage(1) }}
                placeholder="Buscar provedor..."
                aria-label="Buscar provedor"
                className="w-full h-8 pl-8 pr-3 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-lime/20 focus:border-brand-navy transition-all" />
              {providerSearch && (
                <button onClick={() => { setProviderSearch(''); setProviderPage(1) }}
                  aria-label="Limpar busca"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            {/* Status Filter */}
            <div className="flex items-center gap-1 shrink-0">
              {([
                { value: 'all' as const, label: 'Todos' },
                { value: 'connected' as const, label: 'Ativos' },
                { value: 'disconnected' as const, label: 'Inativos' },
              ]).map((f) => (
                <button key={f.value} onClick={() => { setStatusFilter(f.value); setProviderPage(1) }}
                  className={cn('px-2 h-8 rounded-lg text-[10px] font-semibold border transition-all',
                    statusFilter === f.value ? 'bg-brand-navy text-white border-brand-navy' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300')}>
                  {f.label}
                </button>
              ))}
            </div>
            {/* Sort Controls */}
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => { setSortBy('name'); setSortDir(sortBy === 'name' && sortDir === 'asc' ? 'desc' : 'asc') }}
                aria-label={`Ordenar por nome ${sortBy === 'name' ? (sortDir === 'asc' ? 'decrescente' : 'crescente') : ''}`}
                className={cn('px-2 h-8 rounded-lg text-[10px] font-semibold border transition-all flex items-center gap-1',
                  sortBy === 'name' ? 'bg-brand-navy text-white border-brand-navy' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300')}>
                A-Z {sortBy === 'name' && (sortDir === 'asc' ? '↑' : '↓')}
              </button>
              <button onClick={() => { setSortBy('date'); setSortDir(sortBy === 'date' && sortDir === 'asc' ? 'desc' : 'asc') }}
                aria-label={`Ordenar por data ${sortBy === 'date' ? (sortDir === 'asc' ? 'decrescente' : 'crescente') : ''}`}
                className={cn('px-2 h-8 rounded-lg text-[10px] font-semibold border transition-all flex items-center gap-1',
                  sortBy === 'date' ? 'bg-brand-navy text-white border-brand-navy' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300')}>
                Data {sortBy === 'date' && (sortDir === 'asc' ? '↑' : '↓')}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {paginatedProviders.length === 0 ? (
              <div className="text-center py-6">
                <Search className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-400">Nenhum provedor encontrado</p>
              </div>
            ) : paginatedProviders.map((providerId) => {
              const connected = integrations.find(i => i.providerId === providerId && i.status === 'CONNECTED')
              const health = connected ? HEALTH_CONFIG[connected.healthStatus] || HEALTH_CONFIG.UNKNOWN : null
              return (
                <div key={providerId} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-all">
                  <div className="flex items-center gap-3">
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center',
                      CATEGORIES.find(c => c.id === activeCategory)?.bg)}>
                      {(() => {
                        const CatIcon = CATEGORIES.find(c => c.id === activeCategory)?.icon
                        return CatIcon ? <CatIcon className={cn('w-4 h-4', CATEGORIES.find(c => c.id === activeCategory)?.color)} /> : null
                      })()}
                    </div>
                    <div>
                      <span className="text-sm font-medium text-brand-navy">{PROVIDER_NAMES[providerId] || providerId}</span>
                      {connected && (
                        <span className={cn('ml-2 text-[10px] font-medium', health?.color || 'text-slate-400')}>
                          {health?.label || connected.status}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {connected ? (
                      <>
                        <button onClick={() => handleHealthCheck(connected.id)} disabled={healthChecking === connected.id}
                          aria-label="Verificar saúde"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-brand-navy hover:bg-slate-100 transition-all">
                          {healthChecking === connected.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={() => setShowDetail(connected.id)}
                          aria-label="Ver detalhes"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-brand-navy hover:bg-slate-100 transition-all">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDisconnect(connected.id)}
                          aria-label={`Desconectar ${PROVIDER_NAMES[providerId] || providerId}`}
                          className="px-3 h-7 rounded-full text-[10px] font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition-all">
                          Desconectar
                        </button>
                      </>
                    ) : (
                      <button onClick={() => handleConnect(providerId)}
                        className="px-3 h-7 rounded-full text-[10px] font-semibold bg-brand-navy text-white hover:bg-[#0D1B2A] transition-all">
                        Conectar
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
              <p className="text-[10px] text-slate-400" aria-live="polite">
                Mostrando {(providerPage - 1) * PROVIDERS_PER_PAGE + 1}–{Math.min(providerPage * PROVIDERS_PER_PAGE, filtered.length)} de {filtered.length}
              </p>
              <div className="flex items-center gap-1" role="navigation" aria-label="Paginação">
                <button onClick={() => setProviderPage(p => Math.max(1, p - 1))} disabled={providerPage === 1}
                  aria-label="Página anterior"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-brand-navy hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button key={page} onClick={() => setProviderPage(page)}
                    aria-label={`Página ${page}`}
                    aria-current={page === providerPage ? 'page' : undefined}
                    className={cn('w-7 h-7 rounded-lg text-[10px] font-bold transition-all',
                      page === providerPage ? 'bg-brand-navy text-white' : 'text-slate-500 hover:bg-slate-100')}>
                    {page}
                  </button>
                ))}
                <button onClick={() => setProviderPage(p => Math.min(totalPages, p + 1))} disabled={providerPage === totalPages}
                  aria-label="Próxima página"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-brand-navy hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
        )
      })()}

      {/* Connected Integrations List */}
      {integrations.length > 0 && !activeCategory && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h5 className="text-sm font-bold text-brand-navy mb-4">Integrações Ativas</h5>
          <div className="space-y-2">
            {integrations.map((int) => {
              const statusCfg = STATUS_CONFIG[int.status] || STATUS_CONFIG.DISCONNECTED
              const StatusIcon = statusCfg.icon
              return (
                <div key={int.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-all">
                  <div className="flex items-center gap-3">
                    <StatusIcon className={cn('w-4 h-4', statusCfg.color.split(' ')[0])} />
                    <div>
                      <p className="text-sm font-medium text-brand-navy">{int.name}</p>
                      <p className="text-[10px] text-slate-400">{PROVIDER_NAMES[int.providerId] || int.providerId} • {int.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', statusCfg.color)}>
                      {statusCfg.label}
                    </span>
                    <button onClick={() => handleDelete(int.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Connection Wizard Modal */}
      {showWizard && selectedProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowWizard(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-brand-navy">Conectar {PROVIDER_NAMES[selectedProvider]}</h3>
              <p className="text-xs text-slate-400 mt-0.5">Passo {wizardStep + 1} de {WIZARD_STEPS.length}</p>
              {/* Progress bar */}
              <div className="flex gap-1 mt-3">
                {WIZARD_STEPS.map((_, i) => (
                  <div key={i} className={cn('h-1 flex-1 rounded-full transition-all',
                    i <= wizardStep ? 'bg-brand-navy' : 'bg-slate-200')} />
                ))}
              </div>
            </div>
            <div className="p-6">
              <p className="text-sm font-medium text-brand-navy mb-2">{WIZARD_STEPS[wizardStep].title}</p>
              <p className="text-xs text-slate-400 mb-4">{WIZARD_STEPS[wizardStep].description}</p>

              {wizardStep === 0 && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500">Provedor selecionado: <strong>{PROVIDER_NAMES[selectedProvider]}</strong></p>
                  <p className="text-xs text-slate-400">Este provedor será conectado ao CloudBuilder.</p>
                </div>
              )}
              {wizardStep === 1 && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Token / API Key</label>
                    <input type="password" placeholder="Cole seu token de acesso"
                      className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-lime" />
                  </div>
                </div>
              )}
              {wizardStep === 2 && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nome da Integração</label>
                    <input type="text" defaultValue={PROVIDER_NAMES[selectedProvider]}
                      className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-lime" />
                  </div>
                </div>
              )}
              {wizardStep === 3 && (
                <div className="text-center py-4">
                  <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="text-sm font-medium text-brand-navy">Pronto para conectar!</p>
                  <p className="text-xs text-slate-400 mt-1">Clique em "Conectar" para finalizar</p>
                </div>
              )}
            </div>
            <div className="p-6 pt-0 flex items-center justify-end gap-2">
              <button onClick={() => setShowWizard(false)}
                className="px-4 h-9 rounded-full text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all">
                Cancelar
              </button>
              {wizardStep < WIZARD_STEPS.length - 1 ? (
                <button onClick={() => setWizardStep(wizardStep + 1)}
                  className="px-5 h-9 rounded-full text-xs font-bold bg-brand-navy text-white hover:bg-[#0D1B2A] transition-all">
                  Próximo
                </button>
              ) : (
                <button onClick={handleWizardComplete} disabled={connecting === selectedProvider}
                  className="px-5 h-9 rounded-full text-xs font-bold bg-brand-navy text-white hover:bg-[#0D1B2A] disabled:opacity-50 transition-all">
                  {connecting === selectedProvider ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Conectar'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && (() => {
        const int = integrations.find(i => i.id === showDetail)
        if (!int) return null
        const statusCfg = STATUS_CONFIG[int.status] || STATUS_CONFIG.DISCONNECTED
        const health = HEALTH_CONFIG[int.healthStatus] || HEALTH_CONFIG.UNKNOWN
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowDetail(null)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-slate-100">
                <h3 className="text-lg font-bold text-brand-navy">{int.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{PROVIDER_NAMES[int.providerId] || int.providerId}</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Status</p>
                    <p className={cn('text-sm font-medium', statusCfg.color.split(' ')[0])}>{statusCfg.label}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Saúde</p>
                    <p className={cn('text-sm font-medium', health.color)}>{health.label}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Categoria</p>
                    <p className="text-sm text-slate-600">{int.category}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Criado em</p>
                    <p className="text-sm text-slate-600">{new Date(int.createdAt).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
                {int.errorMessage && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                    <p className="text-xs text-red-700">{int.errorMessage}</p>
                  </div>
                )}
              </div>
              <div className="p-6 pt-0 flex items-center justify-end gap-2">
                <button onClick={() => setShowDetail(null)}
                  className="px-4 h-9 rounded-full text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all">
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
