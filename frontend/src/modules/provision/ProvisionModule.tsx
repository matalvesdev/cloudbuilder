import { useState, useMemo, useCallback, useEffect } from 'react'
import toast, { Toaster } from 'react-hot-toast'
import { CheckCircle2, XCircle, Copy, Check, Loader2, LayoutDashboard, Globe, AlertTriangle, Settings, ArrowUpFromLine, Shield, Download, Box, RefreshCw, GitBranch, ExternalLink, UserCheck, Wrench, DiffIcon, ArrowRight, Undo2, Tag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { provisionApi, type DriftReport } from '@/lib/provisionApi'
import { useCanvasStore } from '@/store/canvasStore'
import { useUiStore } from '@/store/uiStore'
import { useCredentialStore } from '@/store/credentialStore'
import { usePromotionStore } from '@/store/promotionStore'
import { useApprovalStore } from '@/store/approvalStore'
import { useAuthStore } from '@/store/authStore'
import { usePermission } from '@/hooks/usePermission'
import { ProtectedAction } from '@/components/ProtectedContent'
import { useRepoStore } from '@/store/repoStore'
import { useDeployStore } from '@/store/deployStore'
import { ENVIRONMENT_TYPE_LABELS, ENVIRONMENT_STATUS_LABELS } from '@/types/settings.types'
import { EnvironmentPipeline } from './EnvironmentPipeline'
import { PromoteDialog } from './PromoteDialog'
import { ApprovalDialog } from './ApprovalDialog'
import { ApprovalGateConfig } from './ApprovalGateConfig'
import { APP_TYPE_LABELS, DEPLOY_TARGET_LABELS, DEPLOY_STATUS_LABELS, CI_PROVIDER_LABELS } from '@/types/deploy.types'
import { AppDeployFlow } from './AppDeployFlow'
import { ImportInfraDialog } from './ImportInfraDialog'
import { EphemeralEnvironments } from './EphemeralEnvironments'

// ─── Skeleton component ───
function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-lg bg-slate-200', className)} />
}

function SkeletonLine({ className }: { className?: string }) {
  return <Skeleton className={cn('h-3', className)} />
}

interface GeneratedFiles {
  id: string
  canvasId: string
  provider: string
  files: Record<string, string>
  resourceCount: number
  generatedAt: string | number
}

const defaultCode = `# Nenhum design encontrado
# Vá para Design → crie componentes → depois gere aqui

# Dica: arraste recursos do painel à esquerda no módulo Design
# Depois volte aqui para gerar o Terraform automaticamente`

function TerraformCode({ code, label }: { code: string; label?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative group">
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 z-10 flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium bg-white/10 text-slate-400 hover:bg-white/20 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
      >
        {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
        {copied ? 'Copiado' : 'Copiar'}
      </button>
      <pre className="bg-[#0D1B2A] rounded-lg p-3 font-mono text-[10px] leading-relaxed max-h-[200px] overflow-y-auto text-slate-400 whitespace-pre scrollbar-thin">
        {code}
      </pre>
    </div>
  )
}

export function ProvisionModule() {
  const [code, setCode] = useState<GeneratedFiles | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedEnvId, setSelectedEnvId] = useState<string>('')
  const [showDeployModal, setShowDeployModal] = useState(false)
  const [deploying, setDeploying] = useState(false)
  const [deployStatus, setDeployStatus] = useState<'idle' | 'planning' | 'applying' | 'done' | 'error'>('idle')
  const [showAppDeployFlow, setShowAppDeployFlow] = useState(false)
  const [appDeployRefreshKey, setAppDeployRefreshKey] = useState(0)
  const [showPromoteDialog, setShowPromoteDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [showApprovalDialog, setShowApprovalDialog] = useState(false)
  const [showApprovalConfig, setShowApprovalConfig] = useState(false)

  // ─── Plan & Drift state ───
  const [planResult, setPlanResult] = useState<{
    add: number
    change: number
    destroy: number
    resources: Array<{ resourceType: string; name: string; action: 'add' | 'change' | 'destroy' }>
  } | null>(null)
  const [planning, setPlanning] = useState(false)
  const [deployStep, setDeployStep] = useState<'idle' | 'plan' | 'review' | 'applying' | 'done' | 'error'>('idle')
  const [driftMap, setDriftMap] = useState<Record<string, DriftReport | null>>({})
  const [driftLoading, setDriftLoading] = useState(false)

  const { nodes, edges, canvasName, canvasId, canvasVersion } = useCanvasStore()
  const { setActiveModule } = useUiStore()
  const { environments, credentials, deployments: storeDeployments, addDeployment, updateDeployment } = useCredentialStore()
  const isDeployed = selectedEnvId && storeDeployments.some((d) => d.environmentId === selectedEnvId && d.status === 'success')
  const lastDeployedVersion = useMemo(() => {
    if (!selectedEnvId) return ''
    const envDeploys = storeDeployments.filter((d) => d.environmentId === selectedEnvId && d.status === 'success')
    return envDeploys.length > 0 ? envDeploys[envDeploys.length - 1].version : ''
  }, [selectedEnvId, storeDeployments])
  const connectedRepos = useRepoStore((s) => s.connectedRepos)
  const detectAppType = useRepoStore((s) => s.detectAppType)
  const scanResults = useRepoStore((s) => s.scanResults)
  const { appDeployments, getAppDeploymentsByEnv } = useDeployStore()
  const promotions = usePromotionStore((s) => s.promotions)
  const pendingApprovals = useMemo(
    () => promotions.filter((p) => p.status === 'pending' && p.requiresApproval),
    [promotions]
  )
  const { getEnvsRequiringApproval } = useApprovalStore()
  const approvalRequests = useApprovalStore((s) => s.approvalRequests)
  const pendingApprovalRequests = useMemo(
    () => approvalRequests.filter((r) => r.status === 'pending'),
    [approvalRequests]
  )
  const user = useAuthStore((s) => s.user)

  const envsRequiringApproval = useMemo(() => getEnvsRequiringApproval(), [getEnvsRequiringApproval])
  const userCanApproveSome = useMemo(() => {
    if (!user) return false
    if (user.roles.includes('admin')) return true
    const approvers = useApprovalStore.getState().teamMembers.filter((m) => m.role === 'approver' || m.role === 'admin')
    return approvers.some((a) => a.email === user.email)
  }, [user])

  const hasCanvasDesign = nodes.length > 0
  const hasCredentials = credentials.length > 0
  const hasEnvironments = environments.length > 0

  const selectedEnvironment = useMemo(
    () => environments.find((e) => e.id === selectedEnvId),
    [environments, selectedEnvId]
  )
  const providers = useMemo(() => {
    const provSet = new Set(nodes.map(n => n.data?.provider).filter(Boolean))
    return Array.from(provSet)
  }, [nodes])

  // Generate Terraform-like code from canvas nodes
  const generatedCode = useMemo(() => {
    if (!hasCanvasDesign) return defaultCode

    const lines: string[] = [
      `# CloudBuilder — Gerado automaticamente do design: "${canvasName}"`,
      `# Recursos: ${nodes.length}  |  Provedores: ${providers.join(', ') || 'N/A'}`,
      `# Conexões: ${edges.length}`,
      '',
    ]

    // Group nodes by provider
    const groups: Record<string, typeof nodes> = {}
    nodes.forEach(n => {
      const p = n.data?.provider || 'unknown'
      if (!groups[p]) groups[p] = []
      groups[p].push(n)
    })

    Object.entries(groups).forEach(([provider, providerNodes]) => {
      lines.push(`# ── Provider: ${provider} ──`)
      providerNodes.forEach(n => {
        const safeId = n.id.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase()
        const resourceType = n.data?.resourceType || 'resource'
        lines.push(`resource "${provider}_${resourceType}" "${safeId}" {`)
        lines.push(`  # ${n.data?.label || 'Sem nome'}`)
        const props = n.data?.properties || {}
        Object.entries(props).forEach(([key, val]) => {
          if (typeof val === 'string') lines.push(`  ${key} = "${val}"`)
          else if (typeof val === 'number') lines.push(`  ${key} = ${val}`)
          else if (typeof val === 'boolean') lines.push(`  ${key} = ${val}`)
        })
        lines.push('}')
        lines.push('')
      })
    })

    return lines.join('\n')
  }, [nodes, edges, canvasName, hasCanvasDesign, providers])

  const [engine, setEngine] = useState<'terraform' | 'opentofu'>('terraform')

  const handleGenerate = async () => {
    if (!hasCanvasDesign || !canvasId) return
    setLoading(true)
    try {
      const res = await provisionApi.generateCode(
        canvasId,
        engine,
        {
          nodes: nodes.map(n => ({
            id: n.id,
            label: n.data?.label,
            provider: n.data?.provider,
            resourceType: n.data?.resourceType,
            properties: n.data?.properties,
          })),
          edges: edges.map(e => ({
            source: e.source,
            target: e.target,
            type: (e.data?.edgeType as string | undefined),
          })),
        }
      )
      setCode(res as GeneratedFiles)
      toast.success(`Código gerado com sucesso — ${res.resourceCount} recursos`)
    } catch (err) {
      setCode(null)
      toast.error('Erro ao gerar código: ' + (err instanceof Error ? err.message : 'falha na comunicação'))
    } finally {
      setLoading(false)
    }
  }

  // ─── Plan ───

  const handlePlan = useCallback(async (envId?: string) => {
    const targetEnvId = envId || selectedEnvId
    const env = environments.find((e) => e.id === targetEnvId)
    if (!env || !hasCanvasDesign || !canvasId) return

    setPlanning(true)
    setDeployStep('plan')
    setShowDeployModal(true)
    try {
      const stateJson = JSON.stringify({
        version: 4,
        resources: nodes.map(n => ({
          type: `${n.data?.provider}_${n.data?.resourceType}`,
          name: n.data?.label?.toLowerCase().replace(/\s+/g, '_') || n.id,
          provider: `registry.terraform.io/hashicorp/${n.data?.provider}`,
          instances: [{ attributes: n.data?.properties || {} }],
        })),
      })
      const drift = await provisionApi.detectDrift(targetEnvId, stateJson)

      const drifted = drift.driftedResources || []
      const add = drifted.filter((r) => r.driftType === 'missing').length
      const change = drifted.filter((r) => r.driftType === 'modified').length
      const destroy = drifted.filter((r) => r.driftType === 'unexpected').length
      // If no drift detected, all resources are additions
      const planAdd = add > 0 || change > 0 || destroy > 0 ? add : nodes.length

      setPlanResult({
        add: planAdd,
        change,
        destroy,
        resources: drifted.map((r) => ({
          resourceType: r.resourceName,
          name: r.resourceName,
          action: r.driftType === 'missing' ? 'add' : r.driftType === 'modified' ? 'change' : 'destroy',
        })),
      })
      setDeployStep('review')
      toast.success('Plano gerado com sucesso')
    } catch (err) {
      toast.error('Erro ao gerar plano: ' + (err instanceof Error ? err.message : 'falha na comunicação'))
      setPlanResult(null)
      setDeployStep('idle')
    } finally {
      setPlanning(false)
    }
  }, [selectedEnvId, environments, hasCanvasDesign, canvasId, nodes])

  // ─── Drift check ───

  const checkDrift = useCallback(async (envId: string) => {
    try {
      const report = await provisionApi.getLatestDrift(envId)
      setDriftMap((prev) => ({ ...prev, [envId]: report }))
    } catch {
      // Silently fail — drift check is best-effort
    }
  }, [])

  useEffect(() => {
    if (!selectedEnvId) return
    checkDrift(selectedEnvId)
  }, [selectedEnvId, checkDrift])

  const handleResolveDrift = useCallback(async (envId: string) => {
    const report = driftMap[envId]
    if (!report) return
    try {
      await provisionApi.resolveDrift(envId, report.id, 'manual')
      toast.success('Drift resolvido com sucesso — recursos sincronizados')
      setDriftMap((prev) => ({ ...prev, [envId]: null }))
    } catch (err) {
      toast.error('Erro ao resolver drift: ' + (err instanceof Error ? err.message : 'falha na comunicação'))
    }
  }, [driftMap])

  const mainTf = code?.files?.['main.tf'] || generatedCode
  const outputsTf = code?.files?.['outputs.tf'] || (() => {
    if (!code?.files) return ''
    const lines = ['# Outputs gerados automaticamente']
    Object.entries(code.files).forEach(([file, content]) => {
      if (file !== 'main.tf' && file !== 'variables.tf' && content) {
        lines.push(`# Arquivo: ${file}`)
        lines.push(content.split('\n').slice(0, 20).join('\n'))
      }
    })
    if (lines.length === 1) {
      lines.push(`# ${nodes.length} recursos de ${providers.join(', ') || 'diversos provedores'}`)
    }
    return lines.join('\n')
  })()

  const realDeployments = selectedEnvId ? storeDeployments.filter((d) => d.environmentId === selectedEnvId) : []

  const reposWithApp = useMemo(() => {
    return connectedRepos.filter((r) => {
      const detection = detectAppType(r.id)
      return detection.appType !== null || detection.hasDockerfile
    })
  }, [connectedRepos, detectAppType])

  const appDeploymentsForEnv = useMemo(() => {
    if (!selectedEnvId) return []
    return getAppDeploymentsByEnv(selectedEnvId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEnvId, appDeployments, appDeployRefreshKey])

  const infraStackId = useMemo(() => {
    if (!selectedEnvId) return ''
    const latestDeploy = getAppDeploymentsByEnv(selectedEnvId)[0]
    return latestDeploy?.infraStackId || selectedEnvId
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEnvId, appDeployRefreshKey])

  const handleDeploy = async () => {
    if (!selectedEnvironment || !hasCanvasDesign || !canvasId) return
    setDeploying(true)
    setDeployStep('applying')
    setDeployStatus('planning')
    const startTime = Date.now()
    try {
      // Gera código Terraform/OpenTofu via backend
      const generated = await provisionApi.generateCode(canvasId, engine, {
        nodes: nodes.map(n => ({
          id: n.id,
          label: n.data?.label,
          provider: n.data?.provider,
          resourceType: n.data?.resourceType,
          properties: n.data?.properties,
        })),
        edges: edges.map(e => ({
          source: e.source,
          target: e.target,
          type: (e.data?.edgeType as string | undefined),
        })),
      })
      setCode(generated as GeneratedFiles)

      setDeployStatus('applying')
      setDeployStep('applying')

      // Sincroniza estado dos recursos no backend
      const stateJson = JSON.stringify({
        version: 4,
        resources: nodes.map(n => ({
          type: `${n.data?.provider}_${n.data?.resourceType}`,
          name: n.data?.label?.toLowerCase().replace(/\s+/g, '_') || n.id,
          provider: `registry.terraform.io/hashicorp/${n.data?.provider}`,
          instances: [{ attributes: n.data?.properties || {} }],
        })),
      })
      await provisionApi.syncResources(selectedEnvironment.id, stateJson)

      const duration = Date.now() - startTime
      const minutes = Math.floor(duration / 60000)
      const seconds = Math.floor((duration % 60000) / 1000)

      addDeployment({
        environmentId: selectedEnvironment.id,
        version: `v1.0.0-${Date.now()}`,
        status: 'success',
        resourceCount: generated.resourceCount || nodes.length,
        duration: `${minutes}m ${seconds}s`,
        startedAt: new Date(startTime).toISOString(),
        completedAt: new Date().toISOString(),
        planSummary: { add: generated.resourceCount || nodes.length, change: 0, destroy: 0 },
      })
      setDeployStatus('done')
      setDeployStep('done')
      toast.success('Deploy concluído com sucesso!')
    } catch (err) {
      addDeployment({
        environmentId: selectedEnvironment.id,
        version: `v1.0.0-${Date.now()}`,
        status: 'failed',
        resourceCount: 0,
        duration: `${Math.floor((Date.now() - startTime) / 1000)}s`,
        startedAt: new Date(startTime).toISOString(),
        completedAt: new Date().toISOString(),
        planSummary: { add: 0, change: 0, destroy: 0 },
      })
      setDeployStatus('error')
      setDeployStep('error')
      toast.error('Erro no deploy: ' + (err instanceof Error ? err.message : 'falha na comunicação'))
    } finally {
      setDeploying(false)
      setShowDeployModal(false)
    }
  }

  return (
    <div className="p-7 overflow-y-auto flex-1">
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: { fontSize: '13px', borderRadius: '12px', padding: '12px 16px' },
          success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-[28px] font-bold tracking-tight text-brand-navy">Provisionar</h1>
            {hasCanvasDesign && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
                </span>
                Conectado ao Design
              </span>
            )}
            {!hasCredentials && (
              <button
                onClick={() => setActiveModule('settings')}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-all"
              >
                <AlertTriangle className="w-3 h-3" />
                Configurar credenciais
              </button>
            )}
            {pendingApprovals.length > 0 && (
              <button
                onClick={() => setShowApprovalDialog(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-all"
              >
                <Shield className="w-3 h-3" />
                {pendingApprovals.length} aprovação{pendingApprovals.length > 1 ? 'ões' : ''} pendente{pendingApprovals.length > 1 ? 's' : ''}
              </button>
            )}
            {userCanApproveSome && pendingApprovalRequests.length > 0 && (
              <button
                onClick={() => setShowApprovalDialog(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-all animate-pulse"
              >
                <UserCheck className="w-3 h-3" />
                Aprovar
              </button>
            )}
            <button
              onClick={() => setShowApprovalConfig(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 transition-all"
            >
              <Shield className="w-3 h-3" />
              Portões
            </button>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            {hasCanvasDesign
              ? `Design "${canvasName}" — ${nodes.length} recursos · ${providers.join(', ')}`
              : 'Gere Terraform e OpenTofu a partir dos seus designs'}
          </p>
          {hasCanvasDesign && (
            <div className="flex items-center gap-2 mt-1.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-ice-blue text-brand-navy border border-ice-blue">
                <Tag className="w-3 h-3" />
                Design v{canvasVersion}
              </span>
              {isDeployed && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">
                  <CheckCircle2 className="w-3 h-3" />
                  Último deploy: v{lastDeployedVersion}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!hasCanvasDesign && (
            <button
              onClick={() => setShowImportDialog(true)}
              className="inline-flex items-center gap-1.5 px-4 h-9 rounded-full text-[13px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-all"
            >
              <Download className="w-4 h-4" />
              Importar Infra
            </button>
          )}
          {!hasCanvasDesign && (
            <button
              onClick={() => setActiveModule('design')}
              className="inline-flex items-center gap-1.5 px-4 h-9 rounded-full text-[13px] font-semibold bg-ice-blue text-brand-navy hover:bg-ice-blue/80 transition-all"
            >
              <LayoutDashboard className="w-4 h-4" />
              Ir para Design
            </button>
          )}
          <ProtectedAction roles={['admin', 'editor']}>
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 h-9 shadow-sm">
              <Wrench className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={engine}
                onChange={(e) => setEngine(e.target.value as 'terraform' | 'opentofu')}
                className="text-xs bg-transparent border-none outline-none text-slate-600 font-medium cursor-pointer"
              >
                <option value="terraform">Terraform</option>
                <option value="opentofu">OpenTofu</option>
              </select>
            </div>
            <button
              onClick={handleGenerate}
              disabled={loading || !hasCanvasDesign}
              className="inline-flex items-center gap-1.5 px-5 h-9 rounded-full text-[13px] font-semibold bg-brand-navy text-white hover:bg-[#0D1B2A] hover:shadow-lg transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? 'Gerando...' : 'Gerar Código'}
            </button>
          </ProtectedAction>
        </div>
      </div>

      {/* Environment selector for deploy */}
      {hasCanvasDesign && (
        <div className="mb-6 flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 h-10 shadow-sm">
            <Globe className="w-4 h-4 text-slate-400" />
            <select
              value={selectedEnvId}
              onChange={(e) => setSelectedEnvId(e.target.value)}
              className="text-sm bg-transparent border-none outline-none text-brand-navy font-medium min-w-[160px] cursor-pointer"
            >
              <option value="">Selecione um ambiente</option>
              {environments.map((env) => {
                const cred = credentials.find((c) => c.id === env.credentialId)
                return (
                  <option key={env.id} value={env.id}>
                    {env.name} ({ENVIRONMENT_TYPE_LABELS[env.type]} — {cred?.name || 'sem credencial'})
                  </option>
                )
              })}
            </select>
          </div>
          {selectedEnvironment && (
            <div className="flex items-center gap-2">
              <span className={cn(
                'text-[10px] px-2 py-0.5 rounded-full border font-medium',
                selectedEnvironment.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border-green-200' :
                selectedEnvironment.status === 'PENDING' ? 'bg-slate-50 text-slate-600 border-slate-200' :
                'bg-amber-50 text-amber-700 border-amber-200'
              )}>
                {ENVIRONMENT_STATUS_LABELS[selectedEnvironment.status]}
              </span>
              <span className="text-xs text-slate-400">{selectedEnvironment.provider.toUpperCase()} / {selectedEnvironment.region}</span>
              {/* Drift detection badge */}
              {selectedEnvId && driftMap[selectedEnvId] && driftMap[selectedEnvId]!.status === 'drifted' && (
                <button
                  onClick={() => handleResolveDrift(selectedEnvId)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-all animate-pulse"
                >
                  <AlertTriangle className="w-3 h-3" />
                  Drift detectado — Resolver
                </button>
              )}
            </div>
          )}
          {!hasEnvironments && (
            <button
              onClick={() => setActiveModule('settings')}
              className="inline-flex items-center gap-1.5 px-3 h-10 rounded-xl text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-all"
            >
              <Settings className="w-3.5 h-3.5" />
              Configurar ambiente
            </button>
          )}
        </div>
      )}

      {/* Pipeline Visualization */}
      {hasEnvironments && (
        <EnvironmentPipeline
          environments={environments}
          onPromote={(sourceId, targetId) => {
            const store = useCredentialStore.getState()
            const src = store.getEnvironmentById(sourceId)
            const tgt = store.getEnvironmentById(targetId)
            if (src && tgt) setShowPromoteDialog(true)
          }}
        />
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card">
          <h3 className="text-[12px] font-bold uppercase tracking-wide text-slate-400 mb-2.5">main.tf</h3>
          {loading ? (
            <div className="space-y-3 py-2">
              <SkeletonLine className="w-3/4" />
              <SkeletonLine className="w-1/2" />
              <SkeletonLine className="w-full" />
              <SkeletonLine className="w-2/3" />
              <Skeleton className="h-20 w-full" />
              <SkeletonLine className="w-4/5" />
              <SkeletonLine className="w-1/3" />
            </div>
          ) : (
            <TerraformCode code={mainTf} />
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card">
          <h3 className="text-[12px] font-bold uppercase tracking-wide text-slate-400 mb-2.5">Resumo do Plano</h3>
          {loading || planning ? (
            <div className="space-y-3 py-2">
              <div className="flex gap-5 mb-3">
                <Skeleton className="h-12 w-16" />
                <Skeleton className="h-12 w-16" />
                <Skeleton className="h-12 w-16" />
              </div>
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-3/4" />
            </div>
          ) : (
          <>
          <div className="flex gap-5 mb-3">
            <div>
              <span className="text-green-600 font-bold text-[22px] leading-none">{code?.resourceCount || nodes.length || 0}</span>
              <span className="text-[11px] text-slate-400 ml-1">recursos</span>
            </div>
            <div>
              <span className="text-yellow-600 font-bold text-[22px] leading-none">0</span>
              <span className="text-[11px] text-slate-400 ml-1">alterar</span>
            </div>
            <div>
              <span className="text-red-600 font-bold text-[22px] leading-none">0</span>
              <span className="text-[11px] text-slate-400 ml-1">destruir</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (!selectedEnvId) return
                handlePlan()
              }}
              disabled={!selectedEnvId || planning}
              className="inline-flex items-center gap-1.5 px-[18px] h-[34px] rounded-full text-[12px] font-semibold bg-brand-navy text-white hover:bg-[#0D1B2A] hover:shadow-lg transition-all disabled:opacity-50"
            >
              {planning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <DiffIcon className="w-3.5 h-3.5" />}
              {planning ? 'Planejando...' : 'Planejar'}
            </button>
            <button
              onClick={() => {
                if (!selectedEnvId || !planResult) return
                setDeployStep('review')
                setShowDeployModal(true)
              }}
              disabled={!selectedEnvId || !planResult || deploying}
              className="inline-flex items-center gap-1.5 px-[18px] h-[34px] rounded-full text-[12px] font-semibold bg-green-600 text-white hover:bg-green-700 hover:shadow-lg transition-all disabled:opacity-50"
            >
              {deploying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              Aplicar Plano
            </button>
            {environments.length > 1 && (
              <button
                onClick={() => setShowPromoteDialog(true)}
                className="inline-flex items-center gap-1.5 px-[18px] h-[34px] rounded-full text-[12px] font-semibold bg-ice-blue text-brand-navy border border-brand-navy/20 hover:bg-ice-blue/80 transition-all"
              >
                <ArrowUpFromLine className="w-3.5 h-3.5" />
                Promover
                {pendingApprovals.length > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-white text-[9px] font-bold">
                    {pendingApprovals.length}
                  </span>
                )}
              </button>
            )}
          </div>
          </>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card">
          <h3 className="text-[12px] font-bold uppercase tracking-wide text-slate-400 mb-2.5">Deployments</h3>
          {realDeployments.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              {selectedEnvId
                ? 'Nenhum deployment realizado neste ambiente'
                : 'Selecione um ambiente para ver deployments'}
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left p-[10px_14px] text-[11px] font-bold text-slate-400 border-b border-slate-200 uppercase tracking-wide">Versão</th>
                  <th className="text-left p-[10px_14px] text-[11px] font-bold text-slate-400 border-b border-slate-200 uppercase tracking-wide">Status</th>
                  <th className="text-left p-[10px_14px] text-[11px] font-bold text-slate-400 border-b border-slate-200 uppercase tracking-wide">Recursos</th>
                  <th className="text-left p-[10px_14px] text-[11px] font-bold text-slate-400 border-b border-slate-200 uppercase tracking-wide">Duração</th>
                  <th className="text-right p-[10px_14px] text-[11px] font-bold text-slate-400 border-b border-slate-200 uppercase tracking-wide">Ações</th>
                </tr>
              </thead>
              <tbody>
                {realDeployments.map((d) => (
                  <tr key={d.id} className="hover:bg-ice-blue transition-colors">
                    <td className="p-[10px_14px] text-[12px] border-b border-slate-200">{d.version}</td>
                    <td className="p-[10px_14px] text-[12px] border-b border-slate-200">
                      <span className={cn(
                        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border',
                        d.status === 'success' ? 'bg-green-50 text-green-600 border-green-200' :
                        d.status === 'running' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                        d.status === 'failed' ? 'bg-red-50 text-red-600 border-red-200' :
                        'bg-slate-50 text-slate-600 border-slate-200'
                      )}>
                        {d.status === 'success' ? <CheckCircle2 className="w-3 h-3" /> : d.status === 'running' ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                        {d.status === 'success' ? 'Sucesso' : d.status === 'running' ? 'Executando' : d.status === 'failed' ? 'Falha' : 'Cancelado'}
                      </span>
                    </td>
                    <td className="p-[10px_14px] text-[12px] border-b border-slate-200">{d.resourceCount}</td>
                    <td className="p-[10px_14px] text-[12px] border-b border-slate-200">{d.duration}</td>
                    <td className="p-[10px_14px] text-right border-b border-slate-200">
                      {d.status === 'success' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedEnvId(d.environmentId)
                            setTimeout(() => handlePlan(d.environmentId), 50)
                          }}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold text-slate-500 bg-slate-100 hover:bg-amber-50 hover:text-amber-700 transition-all"
                          title="Recriar deploy a partir do design atual neste ambiente"
                        >
                          <Undo2 className="w-3.5 h-3.5" />
                          Redeploy
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card">
          <h3 className="text-[12px] font-bold uppercase tracking-wide text-slate-400 mb-2.5">outputs.tf</h3>
          <TerraformCode code={outputsTf} />
        </div>
      </div>

      {/* ─── App Deployment Section ─── */}
      {selectedEnvId && (
        <div className="mt-6 bg-white border border-slate-200 rounded-xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-brand-navy/10 flex items-center justify-center">
                <Box className="w-4 h-4 text-brand-navy" />
              </div>
              <div>
                <h3 className="text-[12px] font-bold uppercase tracking-wide text-slate-400">Deploy de Aplicação</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Implante aplicações dos repositórios conectados na infraestrutura
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {appDeploymentsForEnv.length > 0 && (
                <button
                  onClick={() => setAppDeployRefreshKey((k) => k + 1)}
                  className="inline-flex items-center gap-1 px-3 h-8 rounded-full text-[10px] font-semibold text-slate-500 bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-all"
                >
                  <RefreshCw className="w-3 h-3" />
                  Atualizar
                </button>
              )}
              <button
                onClick={() => setShowAppDeployFlow(true)}
                disabled={reposWithApp.length === 0}
                className="inline-flex items-center gap-1.5 px-4 h-8 rounded-full text-[11px] font-semibold bg-brand-navy text-white hover:bg-[#0D1B2A] transition-all disabled:opacity-50"
              >
                <Box className="w-3.5 h-3.5" />
                Deploy App
              </button>
            </div>
          </div>

          {reposWithApp.length === 0 && appDeploymentsForEnv.length === 0 && (
            <div className="py-6 text-center">
              <Box className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-400">
                Nenhum repositório com aplicação detectada. Conecte um repositório no módulo Platform.
              </p>
            </div>
          )}

          {appDeploymentsForEnv.length === 0 && reposWithApp.length > 0 && (
            <div className="py-6 text-center">
              <p className="text-xs text-slate-400 mb-2">
                {reposWithApp.length} {reposWithApp.length === 1 ? 'repositório disponível' : 'repositórios disponíveis'} com aplicação
              </p>
              <p className="text-[10px] text-slate-400">
                Clique em "Deploy App" para implantar uma aplicação neste ambiente
              </p>
            </div>
          )}

          {appDeploymentsForEnv.length > 0 && (
            <div className="space-y-3">
              {appDeploymentsForEnv.map((dep) => {
                const repo = connectedRepos.find((r) => r.id === dep.repoId)
                return (
                  <div key={dep.id} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold',
                          dep.status === 'success' ? 'bg-green-500' :
                          dep.status === 'deploying' || dep.status === 'running' ? 'bg-blue-500' :
                          dep.status === 'failed' ? 'bg-red-500' :
                          'bg-slate-400'
                        )}>
                          <Box className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-brand-navy">{dep.appName}</span>
                            <span className={cn(
                              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border',
                              dep.status === 'success' ? 'bg-green-50 text-green-600 border-green-200' :
                              dep.status === 'deploying' || dep.status === 'running' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                              dep.status === 'failed' ? 'bg-red-50 text-red-600 border-red-200' :
                              'bg-slate-50 text-slate-600 border-slate-200'
                            )}>
                              {dep.status === 'success' ? <CheckCircle2 className="w-2.5 h-2.5" /> :
                               dep.status === 'deploying' || dep.status === 'running' ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> :
                               <XCircle className="w-2.5 h-2.5" />}
                              {DEPLOY_STATUS_LABELS[dep.status]}
                            </span>
                            {dep.appType && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-ice-blue text-brand-navy border border-ice-blue">
                                {APP_TYPE_LABELS[dep.appType as keyof typeof APP_TYPE_LABELS] || dep.appType}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            {repo && (
                              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                <GitBranch className="w-2.5 h-2.5" />
                                {repo.fullName}
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400">{DEPLOY_TARGET_LABELS[dep.targetType]}</span>
                            <span className="text-[10px] text-slate-400">{dep.version}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {dep.ciProvider && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                            {CI_PROVIDER_LABELS[dep.ciProvider]}
                          </span>
                        )}
                      </div>
                    </div>

                    {dep.url && (
                      <div className="mt-3 flex items-center gap-2">
                        <span className={cn(
                          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border',
                          dep.healthStatus === 'healthy' ? 'bg-green-50 text-green-700 border-green-200' :
                          dep.healthStatus === 'degraded' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          dep.healthStatus === 'down' ? 'bg-red-50 text-red-700 border-red-200' :
                          'bg-slate-50 text-slate-500 border-slate-200'
                        )}>
                          <span className={cn(
                            'relative flex h-1.5 w-1.5',
                          )}>
                            <span className={cn(
                              'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
                              dep.healthStatus === 'healthy' ? 'bg-green-400' :
                              dep.healthStatus === 'degraded' ? 'bg-amber-400' :
                              'bg-red-400'
                            )} />
                            <span className={cn(
                              'relative inline-flex rounded-full h-1.5 w-1.5',
                              dep.healthStatus === 'healthy' ? 'bg-green-500' :
                              dep.healthStatus === 'degraded' ? 'bg-amber-500' :
                              dep.healthStatus === 'down' ? 'bg-red-500' :
                              'bg-slate-400'
                            )} />
                          </span>
                          {dep.healthStatus === 'healthy' ? 'Saudável' :
                           dep.healthStatus === 'degraded' ? 'Degradado' :
                           dep.healthStatus === 'down' ? 'Fora do Ar' :
                           'Desconhecido'}
                        </span>
                        <a
                          href={dep.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium text-brand-navy bg-ice-blue hover:bg-ice-blue/80 transition-all border border-ice-blue"
                        >
                          <ExternalLink className="w-3 h-3" />
                          {dep.url}
                        </a>
                      </div>
                    )}

                    {dep.deployedAt && (
                      <p className="text-[10px] text-slate-400 mt-2">
                        Último deploy: {new Date(dep.deployedAt).toLocaleString('pt-BR')}
                        {dep.lastHealthCheck && ` · Último health check: ${new Date(dep.lastHealthCheck).toLocaleString('pt-BR')}`}
                      </p>
                    )}

                    {dep.pipelineYaml && (
                      <div className="mt-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Pipeline</span>
                          <span className={cn(
                            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-bold border',
                            dep.status === 'success' ? 'bg-green-50 text-green-600 border-green-200' :
                            dep.status === 'running' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                            'bg-slate-50 text-slate-600 border-slate-200'
                          )}>
                            {dep.status === 'success' ? 'Configurado' : dep.status === 'running' ? 'Executando' : 'Pendente'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Ephemeral Environments */}
      <EphemeralEnvironments className="mt-6" />

      {/* Deploy Modal — Plan → Review → Apply */}
      {showDeployModal && selectedEnvironment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg mx-4 animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-lg font-bold text-brand-navy font-display">
                  {deployStep === 'plan' ? 'Gerando Plano...' :
                   deployStep === 'review' ? 'Revisão do Plano' :
                   deployStep === 'applying' ? 'Aplicando Deploy' :
                   deployStep === 'done' ? 'Deploy Concluído' :
                   deployStep === 'error' ? 'Erro no Deploy' :
                   'Confirmar Deploy'}
                </h2>
                {deployStep === 'done' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                {deployStep === 'error' && <XCircle className="w-5 h-5 text-red-500" />}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {deployStep === 'plan' ? 'Analisando recursos e detectando mudanças...' :
                 deployStep === 'review' ? 'Revise as mudanças antes de aplicar no ambiente' :
                 deployStep === 'applying' ? `Provisionando ${nodes.length} recursos na nuvem` :
                 deployStep === 'done' ? `${nodes.length} recursos provisionados com sucesso` :
                 deployStep === 'error' ? 'Ocorreu um erro durante o deploy' :
                 'Ambiente: ' + selectedEnvironment.name}
              </p>
            </div>

            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              {/* Environment info (shown on all steps) */}
              <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Ambiente</span>
                  <span className="font-semibold text-brand-navy">{selectedEnvironment.name}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Tipo</span>
                  <span className="font-semibold text-brand-navy">{ENVIRONMENT_TYPE_LABELS[selectedEnvironment.type]}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Provedor</span>
                  <span className="font-semibold text-brand-navy uppercase">{selectedEnvironment.provider}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Região</span>
                  <span className="font-semibold text-brand-navy">{selectedEnvironment.region}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Design</span>
                  <span className="font-semibold text-brand-navy truncate ml-4">{canvasName}</span>
                </div>
              </div>

              {/* ── Step: Plan in progress ── */}
              {deployStep === 'plan' && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                  <div>
                    <p className="text-sm font-semibold text-blue-700">Analisando infraestrutura...</p>
                    <p className="text-xs text-blue-500">Comparando design com estado atual dos recursos</p>
                  </div>
                </div>
              )}

              {/* ── Step: Plan Review ── */}
              {deployStep === 'review' && planResult && (
                <>
                  {/* Resumo do Plano */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className={cn(
                      'rounded-xl p-3 text-center border',
                      planResult.add > 0 ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'
                    )}>
                      <span className="text-green-600 font-bold text-[22px] leading-none">{planResult.add}</span>
                      <p className="text-[11px] text-slate-500 mt-0.5">criar</p>
                    </div>
                    <div className={cn(
                      'rounded-xl p-3 text-center border',
                      planResult.change > 0 ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'
                    )}>
                      <span className="text-amber-600 font-bold text-[22px] leading-none">{planResult.change}</span>
                      <p className="text-[11px] text-slate-500 mt-0.5">alterar</p>
                    </div>
                    <div className={cn(
                      'rounded-xl p-3 text-center border',
                      planResult.destroy > 0 ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'
                    )}>
                      <span className="text-red-600 font-bold text-[22px] leading-none">{planResult.destroy}</span>
                      <p className="text-[11px] text-slate-500 mt-0.5">destruir</p>
                    </div>
                  </div>

                  {/* Recursos detalhados */}
                  {planResult.resources.length > 0 && (
                    <div className="bg-white border border-slate-200 rounded-xl">
                      <div className="px-4 py-2.5 border-b border-slate-100">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                          Recursos ({planResult.resources.length})
                        </span>
                      </div>
                      <div className="divide-y divide-slate-100 max-h-[200px] overflow-y-auto">
                        {planResult.resources.map((r, i) => (
                          <div key={i} className="flex items-center gap-2 px-4 py-2">
                            <span className={cn(
                              'inline-flex items-center justify-center w-5 h-5 rounded text-[9px] font-bold text-white',
                              r.action === 'add' ? 'bg-green-500' :
                              r.action === 'change' ? 'bg-amber-500' : 'bg-red-500'
                            )}>
                              {r.action === 'add' ? '+' : r.action === 'change' ? '~' : '−'}
                            </span>
                            <span className="text-xs text-slate-600">{r.resourceType}</span>
                            <span className="text-[11px] text-slate-400 truncate">{r.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Aviso destrutivo */}
                  {(planResult.destroy > 0) && (
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
                      <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-red-700">Atenção: recursos serão destruídos</p>
                        <p className="text-xs text-red-500">
                          {planResult.destroy} {planResult.destroy === 1 ? 'recurso será permanentemente removido' : 'recursos serão permanentemente removidos'}.
                          Esta ação não pode ser desfeita.
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* ── Step: Applying ── */}
              {deployStep === 'applying' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
                    <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
                    <div>
                      <p className="text-sm font-semibold text-amber-700">Provisionando recursos...</p>
                      <p className="text-xs text-amber-500">Aplicando {nodes.length} recursos via Terraform</p>
                    </div>
                  </div>
                  <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
                      <span className="text-[11px] font-semibold text-amber-600">terraform apply</span>
                    </div>
                    <div className="text-[10px] text-amber-500 font-mono space-y-0.5">
                      {planResult?.resources.slice(0, 5).map((r, i) => (
                        <div key={i}>
                          {r.action === 'add' ? '+' : r.action === 'change' ? '~' : '-'} {r.resourceType}.{r.name}
                        </div>
                      ))}
                      {planResult && planResult.resources.length > 5 && (
                        <div>...e mais {planResult.resources.length - 5} recursos</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Step: Done ── */}
              {deployStep === 'done' && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-200">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-sm font-semibold text-green-700">Deploy concluído com sucesso!</p>
                    <p className="text-xs text-green-500">
                      {planResult?.add || nodes.length} recursos provisionados
                      {planResult?.change ? `, ${planResult.change} alterados` : ''}
                      {planResult?.destroy ? `, ${planResult.destroy} removidos` : ''}
                    </p>
                  </div>
                </div>
              )}

              {/* ── Step: Error ── */}
              {deployStep === 'error' && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
                  <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-700">Erro no deploy</p>
                    <p className="text-xs text-red-500">
                      Ocorreu um erro ao provisionar os recursos. Verifique as credenciais e tente novamente.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* ── Footer actions ── */}
            <div className="p-6 pt-0 flex items-center justify-end gap-2">
              <button
                onClick={() => { setShowDeployModal(false); setDeployStep('idle'); setDeployStatus('idle') }}
                disabled={deploying}
                className="px-4 h-9 rounded-full text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all disabled:opacity-50"
              >
                {deployStep === 'done' || deployStep === 'error' ? 'Fechar' : 'Cancelar'}
              </button>

              {deployStep === 'review' && (
                <ProtectedAction roles={['admin', 'editor']}>
                  <button
                    onClick={handleDeploy}
                    disabled={deploying}
                    className="inline-flex items-center gap-1.5 px-5 h-9 rounded-full text-xs font-bold bg-brand-navy text-white hover:bg-[#0D1B2A] transition-all disabled:opacity-50"
                  >
                    {deploying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
                    Confirmar e Aplicar
                  </button>
                </ProtectedAction>
              )}

              {deployStep === 'plan' && (
                <div className="flex items-center gap-2 px-4 h-9 rounded-full text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Gerando plano...
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* App Deploy Flow */}
      {showAppDeployFlow && selectedEnvId && (
        <AppDeployFlow
          environmentId={selectedEnvId}
          infraStackId={infraStackId}
          onClose={() => setShowAppDeployFlow(false)}
          onDeployed={() => setAppDeployRefreshKey((k) => k + 1)}
        />
      )}

      {/* Promote Dialog */}
      {showPromoteDialog && (
        <PromoteDialog onClose={() => setShowPromoteDialog(false)} />
      )}

      {/* Approval Dialog */}
      {showApprovalDialog && (
        <ApprovalDialog onClose={() => setShowApprovalDialog(false)} />
      )}

      {/* Approval Gate Config */}
      {showApprovalConfig && (
        <ApprovalGateConfig onClose={() => setShowApprovalConfig(false)} />
      )}

      {/* Import Infra Dialog */}
      <ImportInfraDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
      />
    </div>
  )
}
