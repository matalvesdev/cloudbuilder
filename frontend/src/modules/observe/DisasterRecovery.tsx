import { useState, useCallback } from 'react'
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Globe,
  Server,
  Database,
  Siren,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  Activity,
  AlertTriangle,
  Calendar,
  Plus,
  Trash2,
  Play,
  StepForward,
  RefreshCw,
  ArrowLeftRight,
  MapPin,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { nanoid } from 'nanoid'
import type {
  DRConfig,
  DRTestResult,
  FailoverSimulationStep,
  ReplicationResource,
  ReplicationResourceType,
  AutoTestSchedule,
  DrStatus,
} from '@/types/dr.types'

const AVAILABLE_REGIONS = [
  { value: 'us-east-1', label: 'US East (N. Virginia)' },
  { value: 'us-west-2', label: 'US West (Oregon)' },
  { value: 'eu-west-1', label: 'EU (Ireland)' },
  { value: 'eu-central-1', label: 'EU (Frankfurt)' },
  { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
  { value: 'sa-east-1', label: 'South America (São Paulo)' },
]

const RESOURCE_REPLICATION_LABELS: Record<ReplicationResourceType, { label: string; icon: typeof Server; desc: string }> = {
  rds: { label: 'RDS Read Replica', icon: Database, desc: 'Réplica de leitura entre regiões' },
  s3: { label: 'S3 Cross-Region', icon: Server, desc: 'Replicação entre regiões' },
  route53: { label: 'Route53 Failover', icon: Globe, desc: 'Roteamento de failover DNS' },
}

const STATUS_CONFIG: Record<DrStatus, { label: string; bg: string; text: string; border: string; icon: typeof Shield }> = {
  active: { label: 'DR Ativo', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: ShieldCheck },
  inactive: { label: 'DR Inativo', bg: 'bg-slate-50', text: 'text-slate-500', border: 'border-slate-200', icon: Shield },
  degraded: { label: 'DR Degradado', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: ShieldAlert },
}

function generateMockDrConfig(): DRConfig {
  return {
    id: nanoid(),
    environmentId: 'default',
    primaryRegion: 'us-east-1',
    secondaryRegion: 'us-west-2',
    replicationResources: [
      { type: 'rds', sourceName: 'app-db', targetName: 'app-db-replica', status: 'active' },
      { type: 's3', sourceName: 'app-storage', targetName: 'app-storage-dr', status: 'active' },
      { type: 'route53', sourceName: 'app.example.com', targetName: 'app-dr.example.com', status: 'active' },
    ],
    rto_seconds: 300,
    rpo_seconds: 60,
    autoTestSchedule: 'monthly',
    status: 'active',
    lastTestDate: new Date(Date.now() - 7 * 86400000).toISOString(),
    complianceStatus: 'compliant',
    createdAt: new Date(Date.now() - 90 * 86400000).toISOString(),
  }
}

function generateMockTestResults(configId: string): DRTestResult[] {
  return [
    {
      id: nanoid(),
      configId,
      testedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
      rto_actual: 47,
      rpo_actual: 32,
      status: 'success',
      details: [
        'DNS propagation completed in 12s',
        'RDS read replica promoted in 23s',
        'Application health check passed in 12s',
      ],
      duration_seconds: 47,
    },
    {
      id: nanoid(),
      configId,
      testedAt: new Date(Date.now() - 37 * 86400000).toISOString(),
      rto_actual: 52,
      rpo_actual: 45,
      status: 'success',
      details: [
        'DNS propagation completed in 14s',
        'RDS read replica promoted in 28s',
        'Application health check passed in 10s',
      ],
      duration_seconds: 52,
    },
  ]
}

const FAILOVER_STEPS: FailoverSimulationStep[] = [
  { step: 1, name: 'Verificando saúde da região primária', status: 'pending', duration_seconds: 3 },
  { step: 2, name: 'Promovendo réplica de leitura RDS', status: 'pending', duration_seconds: 8 },
  { step: 3, name: 'Ativando bucket S3 de DR', status: 'pending', duration_seconds: 5 },
  { step: 4, name: 'Redirecionando DNS Route53', status: 'pending', duration_seconds: 12 },
  { step: 5, name: 'Verificando health check da aplicação', status: 'pending', duration_seconds: 10 },
  { step: 6, name: 'Validando integridade dos dados', status: 'pending', duration_seconds: 9 },
]

function ConfigSection({ config, onRunTest, isSimulating }: {
  config: DRConfig | null
  onRunTest: () => void
  isSimulating: boolean
}) {
  const cfg = config ? STATUS_CONFIG[config.status] : STATUS_CONFIG.inactive
  const StatusIcon = cfg.icon

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', cfg.bg)}>
            <StatusIcon className={cn('w-5 h-5', cfg.text)} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-[12px] font-bold uppercase tracking-wide text-slate-400">Configuração DR</h3>
              <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border', cfg.bg, cfg.text, cfg.border)}>
                {cfg.label}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Disaster Recovery entre regiões</p>
          </div>
        </div>
        <button
          onClick={onRunTest}
          disabled={isSimulating || !config}
          className="inline-flex items-center gap-1.5 px-4 h-9 rounded-full text-[11px] font-bold bg-brand-navy text-white hover:bg-[#0D1B2A] transition-all disabled:opacity-50"
        >
          {isSimulating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Play className="w-3.5 h-3.5" />
          )}
          {isSimulating ? 'Simulando...' : 'Simular Failover'}
        </button>
      </div>

      {config ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4 text-brand-navy" />
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Regiões</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">
                  {config.primaryRegion}
                </span>
                <ArrowLeftRight className="w-3 h-3 text-slate-300" />
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  {config.secondaryRegion}
                </span>
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-4 h-4 text-brand-navy" />
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Objetivos</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400">RTO</span>
                  <p className="text-sm font-bold text-brand-navy">{config.rto_seconds}s</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">RPO</span>
                  <p className="text-sm font-bold text-brand-navy">{config.rpo_seconds}s</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Recursos Replicados</span>
            <div className="space-y-2">
              {config.replicationResources.map((res, i) => {
                const resCfg = RESOURCE_REPLICATION_LABELS[res.type]
                const ResIcon = resCfg.icon
                return (
                  <div key={i} className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-3">
                    <div className="flex items-center gap-3">
                      <ResIcon className="w-4 h-4 text-brand-navy" />
                      <div>
                        <p className="text-xs font-semibold text-brand-navy">{resCfg.label}</p>
                        <p className="text-[10px] text-slate-400">{res.sourceName} → {res.targetName}</p>
                      </div>
                    </div>
                    <span className={cn(
                      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border',
                      res.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' :
                      res.status === 'degraded' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      'bg-slate-50 text-slate-500 border-slate-200'
                    )}>
                      {res.status === 'active' ? 'Replicando' : res.status === 'degraded' ? 'Degradado' : 'Inativo'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Último teste: {config.lastTestDate ? new Date(config.lastTestDate).toLocaleDateString('pt-BR') : 'Nunca'}
            </span>
            <span className={cn(
              'inline-flex items-center gap-1 font-semibold',
              config.complianceStatus === 'compliant' ? 'text-green-600' : 'text-amber-600'
            )}>
              {config.complianceStatus === 'compliant' ? 'Em conformidade' : 'Não conforme'}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Teste automático: {config.autoTestSchedule === 'weekly' ? 'Semanal' : config.autoTestSchedule === 'monthly' ? 'Mensal' : 'Desligado'}
            </span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Shield className="w-8 h-8 text-slate-300 mb-2" />
          <p className="text-xs text-slate-400">Nenhuma configuração DR ativa. Configure o DR para começar.</p>
        </div>
      )}
    </div>
  )
}

function FailoverSimulation({ steps, onClose }: {
  steps: FailoverSimulationStep[]
  onClose: () => void
}) {
  const [simSteps, setSimSteps] = useState(steps)
  const [isRunning, setIsRunning] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [totalDuration, setTotalDuration] = useState(0)

  const runSimulation = useCallback(async () => {
    setIsRunning(true)
    setSimSteps(steps.map((s) => ({ ...s, status: 'pending' as const })))

    for (let i = 0; i < steps.length; i++) {
      setSimSteps((prev) => prev.map((s, idx) =>
        idx === i ? { ...s, status: 'running' as const } : s
      ))
      await new Promise((r) => setTimeout(r, steps[i].duration_seconds * 120))
      setSimSteps((prev) => prev.map((s, idx) =>
        idx === i ? { ...s, status: 'completed' as const } : s
      ))
      setTotalDuration((prev) => prev + steps[i].duration_seconds)
    }

    setCompleted(true)
    setIsRunning(false)
  }, [steps])

  const allCompleted = simSteps.every((s) => s.status === 'completed')
  const totalRto = simSteps.reduce((acc, s) => acc + s.duration_seconds, 0)

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[12px] font-bold uppercase tracking-wide text-slate-400">
          Simulação de Failover
        </h3>
        {!isRunning && !completed && (
          <button
            onClick={runSimulation}
            className="inline-flex items-center gap-1.5 px-4 h-8 rounded-full text-[11px] font-bold bg-brand-navy text-white hover:bg-[#0D1B2A] transition-all"
          >
            <Play className="w-3.5 h-3.5" />
            Iniciar Simulação
          </button>
        )}
      </div>

      <div className="space-y-2 mb-4">
        {simSteps.map((step) => (
          <div
            key={step.step}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-xl border transition-all',
              step.status === 'running' ? 'border-blue-200 bg-blue-50' :
              step.status === 'completed' ? 'border-green-200 bg-green-50' :
              step.status === 'failed' ? 'border-red-200 bg-red-50' :
              'border-slate-100 bg-slate-50'
            )}
          >
            <div className={cn(
              'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold',
              step.status === 'completed' ? 'bg-green-500 text-white' :
              step.status === 'running' ? 'bg-blue-500 text-white' :
              step.status === 'failed' ? 'bg-red-500 text-white' :
              'bg-slate-200 text-slate-500'
            )}>
              {step.status === 'completed' ? <CheckCircle2 className="w-3.5 h-3.5" /> :
               step.status === 'running' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
               step.status === 'failed' ? <XCircle className="w-3.5 h-3.5" /> :
               step.step}
            </div>
            <div className="flex-1">
              <p className={cn(
                'text-xs font-semibold',
                step.status === 'completed' ? 'text-green-800' :
                step.status === 'running' ? 'text-blue-800' :
                'text-slate-600'
              )}>
                {step.name}
              </p>
              {step.status === 'completed' && (
                <p className="text-[10px] text-green-600">Concluído em {step.duration_seconds}s</p>
              )}
            </div>
            {step.status === 'pending' && (
              <span className="text-[10px] text-slate-400">{step.duration_seconds}s</span>
            )}
          </div>
        ))}
      </div>

      {allCompleted && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <p className="text-sm font-bold text-green-800">
            Failover concluído em {totalDuration}s
          </p>
          <p className="text-[11px] text-green-600 mt-1">
            RTO real: {totalDuration}s | RPO real: ~32s — dentro dos objetivos configurados
          </p>
        </div>
      )}

      {completed && (
        <button
          onClick={onClose}
          className="mt-3 w-full px-4 h-9 rounded-full text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
        >
          Fechar
        </button>
      )}
    </div>
  )
}

function TestHistory({ results }: { results: DRTestResult[] }) {
  if (results.length === 0) {
    return (
      <div className="text-center py-8">
        <Activity className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <p className="text-xs text-slate-400">Nenhum teste realizado</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {results.map((test) => (
        <div key={test.id} className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center',
              test.status === 'success' ? 'bg-green-50' : 'bg-red-50'
            )}>
              {test.status === 'success'
                ? <CheckCircle2 className="w-4 h-4 text-green-600" />
                : <XCircle className="w-4 h-4 text-red-600" />
              }
            </div>
            <div>
              <p className="text-xs font-semibold text-brand-navy">
                {new Date(test.testedAt).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
              <p className="text-[10px] text-slate-400">
                RTO: {test.rto_actual}s · RPO: {test.rpo_actual}s · Duração: {test.duration_seconds}s
              </p>
            </div>
          </div>
          <span className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border',
            test.status === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
          )}>
            {test.status === 'success' ? 'Sucesso' : 'Falha'}
          </span>
        </div>
      ))}
    </div>
  )
}

function DrSetupForm({ onSave }: { onSave: (config: DRConfig) => void }) {
  const [primaryRegion, setPrimaryRegion] = useState('us-east-1')
  const [secondaryRegion, setSecondaryRegion] = useState('us-west-2')
  const [rto, setRto] = useState(300)
  const [rpo, setRpo] = useState(60)
  const [schedule, setSchedule] = useState<AutoTestSchedule>('monthly')
  const [selectedResources, setSelectedResources] = useState<ReplicationResourceType[]>(['rds', 's3', 'route53'])

  const toggleResource = (type: ReplicationResourceType) => {
    setSelectedResources((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
  }

  const handleSave = () => {
    const resources: ReplicationResource[] = selectedResources.map((type) => ({
      type,
      sourceName: type === 'rds' ? 'app-db' : type === 's3' ? 'app-storage' : 'app.example.com',
      targetName: type === 'rds' ? 'app-db-dr' : type === 's3' ? 'app-storage-dr' : 'app-dr.example.com',
      status: 'active',
    }))

    const config: DRConfig = {
      id: nanoid(),
      environmentId: 'default',
      primaryRegion,
      secondaryRegion,
      replicationResources: resources,
      rto_seconds: rto,
      rpo_seconds: rpo,
      autoTestSchedule: schedule,
      status: 'active',
      lastTestDate: null,
      complianceStatus: 'unknown',
      createdAt: new Date().toISOString(),
    }
    onSave(config)
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card">
      <h3 className="text-[12px] font-bold uppercase tracking-wide text-slate-400 mb-4">
        Configurar DR
      </h3>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Região Primária
            </label>
            <select
              value={primaryRegion}
              onChange={(e) => setPrimaryRegion(e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-slate-200 text-sm bg-white transition-all"
            >
              {AVAILABLE_REGIONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Região Secundária
            </label>
            <select
              value={secondaryRegion}
              onChange={(e) => setSecondaryRegion(e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-slate-200 text-sm bg-white transition-all"
            >
              {AVAILABLE_REGIONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Recursos para Replicar
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(Object.entries(RESOURCE_REPLICATION_LABELS) as [ReplicationResourceType, typeof RESOURCE_REPLICATION_LABELS['rds']][]).map(([key, cfg]) => {
              const Icon = cfg.icon
              return (
                <button
                  key={key}
                  onClick={() => toggleResource(key)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-[11px] font-medium',
                    selectedResources.includes(key)
                      ? 'border-brand-navy bg-brand-navy/5 text-brand-navy'
                      : 'border-slate-200 text-slate-500 hover:border-slate-300'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span>{cfg.label}</span>
                  <span className="text-[8px] text-slate-400">{cfg.desc}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              RTO (segundos)
            </label>
            <input
              type="number"
              value={rto}
              onChange={(e) => setRto(Number(e.target.value))}
              min={30}
              max={3600}
              className="w-full h-9 px-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy bg-white transition-all"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              RPO (segundos)
            </label>
            <input
              type="number"
              value={rpo}
              onChange={(e) => setRpo(Number(e.target.value))}
              min={0}
              max={3600}
              className="w-full h-9 px-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy bg-white transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Teste Automático
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'weekly' as AutoTestSchedule, label: 'Semanal' },
              { value: 'monthly' as AutoTestSchedule, label: 'Mensal' },
              { value: 'none' as AutoTestSchedule, label: 'Desligado' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSchedule(opt.value)}
                className={cn(
                  'py-2 rounded-lg text-[11px] font-semibold border transition-all',
                  schedule === opt.value
                    ? 'bg-brand-navy text-white border-brand-navy'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-brand-navy'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            onClick={handleSave}
            disabled={selectedResources.length === 0 || primaryRegion === secondaryRegion}
            className="inline-flex items-center gap-1.5 px-5 h-9 rounded-full text-[11px] font-bold bg-brand-navy text-white hover:bg-[#0D1B2A] transition-all disabled:opacity-50"
          >
            <ShieldCheck className="w-4 h-4" />
            Ativar DR
          </button>
        </div>
        {primaryRegion === secondaryRegion && (
          <p className="text-[10px] text-amber-600 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            As regiões primária e secundária devem ser diferentes
          </p>
        )}
      </div>
    </div>
  )
}

export function DisasterRecovery() {
  const [config, setConfig] = useState<DRConfig | null>(() => {
    const stored = localStorage.getItem('cloudbuilder-dr-config')
    return stored ? JSON.parse(stored) : null
  })
  const [testResults, setTestResults] = useState<DRTestResult[]>(() => {
    if (!config) return []
    const stored = localStorage.getItem('cloudbuilder-dr-tests')
    return stored ? JSON.parse(stored) : generateMockTestResults(config.id)
  })
  const [showSetup, setShowSetup] = useState(!config)
  const [isSimulating, setIsSimulating] = useState(false)
  const [showSimulation, setShowSimulation] = useState(false)

  const handleSaveConfig = (newConfig: DRConfig) => {
    setConfig(newConfig)
    setShowSetup(false)
    localStorage.setItem('cloudbuilder-dr-config', JSON.stringify(newConfig))
  }

  const handleRunTest = () => {
    setIsSimulating(true)
    setShowSimulation(true)
  }

  const handleSimulationClose = () => {
    setShowSimulation(false)
    setIsSimulating(false)
    if (config) {
      const result: DRTestResult = {
        id: nanoid(),
        configId: config.id,
        testedAt: new Date().toISOString(),
        rto_actual: 47,
        rpo_actual: 32,
        status: 'success',
        details: ['Test completed successfully'],
        duration_seconds: 47,
      }
      const updated = [result, ...testResults].slice(0, 10)
      setTestResults(updated)
      localStorage.setItem('cloudbuilder-dr-tests', JSON.stringify(updated))
      setConfig({ ...config, lastTestDate: result.testedAt })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
            <Siren className="w-4 h-4 text-red-500" />
          </div>
          <div>
            <h3 className="text-[12px] font-bold uppercase tracking-wide text-slate-400">Disaster Recovery</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Failover entre regiões e continuidade de negócio</p>
          </div>
        </div>
        <button
          onClick={() => setShowSetup(!showSetup)}
          className={cn(
            'inline-flex items-center gap-1.5 px-4 h-8 rounded-full text-[11px] font-bold transition-all',
            showSetup ? 'bg-slate-100 text-slate-600' : 'bg-brand-navy text-white hover:bg-[#0D1B2A]'
          )}
        >
          {showSetup ? <XCircle className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showSetup ? 'Fechar' : config ? 'Reconfigurar' : 'Configurar DR'}
        </button>
      </div>

      {showSetup && (
        <DrSetupForm onSave={handleSaveConfig} />
      )}

      <ConfigSection
        config={config}
        onRunTest={handleRunTest}
        isSimulating={isSimulating}
      />

      {showSimulation && (
        <FailoverSimulation
          steps={FAILOVER_STEPS}
          onClose={handleSimulationClose}
        />
      )}

      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-ice-blue flex items-center justify-center">
              <Activity className="w-4 h-4 text-brand-navy" />
            </div>
            <div>
              <h3 className="text-[12px] font-bold uppercase tracking-wide text-slate-400">Histórico de Testes</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">{testResults.length} testes realizados</p>
            </div>
          </div>
          {config && testResults.length > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] text-green-600 font-semibold">
              <CheckCircle2 className="w-3 h-3" />
              {testResults.filter((t) => t.status === 'success').length}/{testResults.length} sucesso
            </span>
          )}
        </div>
        <TestHistory results={testResults} />
      </div>
    </div>
  )
}
