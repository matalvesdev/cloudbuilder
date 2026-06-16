import { useState, useCallback } from 'react'
import {
  Sparkles, ArrowRight, ArrowLeft, Check, Eye, EyeOff,
  Cloud, Database, Server,
  Loader2, X, Globe, Key, Box, Layout,
} from 'lucide-react'
import { useCredentialStore } from '@/store/credentialStore'
import { useUiStore } from '@/store/uiStore'
import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import type { Provider, StateBackendType } from '@/types/settings.types'
import { ENVIRONMENT_REGIONS, ENVIRONMENT_TYPE_LABELS } from '@/types/settings.types'

const providerData: { id: Provider; label: string; description: string; color: string; bg: string; icon: typeof Cloud }[] = [
  {
    id: 'aws', label: 'Amazon Web Services', description: 'Maturidade, escalabilidade e o ecossistema de serviços mais completo do mercado.',
    color: 'text-amber-500', bg: 'bg-amber-50 border-amber-200 hover:border-amber-400', icon: Cloud,
  },
  {
    id: 'azure', label: 'Microsoft Azure', description: 'Integração nativa com o ecossistema Microsoft e suporte enterprise corporativo.',
    color: 'text-blue-500', bg: 'bg-blue-50 border-blue-200 hover:border-blue-400', icon: Database,
  },
  {
    id: 'gcp', label: 'Google Cloud Platform', description: 'Inovação em dados, machine learning e infraestrutura global de alto desempenho.',
    color: 'text-green-500', bg: 'bg-green-50 border-green-200 hover:border-green-400', icon: Server,
  },
]

const stateBackendOptions: { value: StateBackendType; label: string }[] = [
  { value: 's3', label: 'S3 (recomendado)' },
  { value: 'local', label: 'Local' },
  { value: 'remote', label: 'Remoto' },
]

const stepLabels = ['Provedor', 'Credencial', 'Ambiente', 'Começar']

export function SetupWizard({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0)
  const [showSecret, setShowSecret] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<'idle' | 'success' | 'fail'>('idle')

  const [provider, setProvider] = useState<Provider | null>(null)
  const [credName, setCredName] = useState('')
  const [keyId, setKeyId] = useState('')
  const [secret, setSecret] = useState('')
  const [region, setRegion] = useState('')
  const [envName, setEnvName] = useState('')
  const [envType, setEnvType] = useState<'development' | 'staging' | 'production'>('development')
  const [stateBackendType, setStateBackendType] = useState<StateBackendType>('s3')

  const { addCredential, addEnvironment, testCredential, credentials } = useCredentialStore()
  const { setActiveModule } = useUiStore()

  const steps = stepLabels.length

  const canGoNext = useCallback(() => {
    switch (step) {
      case 0: return provider !== null
      case 1: return keyId.trim().length > 0 && secret.trim().length > 0 && region.length > 0
      case 2: return envName.trim().length > 0
      default: return true
    }
  }, [step, provider, keyId, secret, region, envName])

  const handleNext = useCallback(() => {
    if (step === 1 && canGoNext()) {
      addCredential({
        name: credName || `Credencial ${provider}`,
        provider: provider!,
        keyId,
        secret,
        region,
      })
      setTimeout(() => {
        const allCreds = useCredentialStore.getState().credentials
        const last = allCreds[allCreds.length - 1]
        if (last) {
          testCredential(last.id).then((ok) => {
            setTestResult(ok ? 'success' : 'fail')
          })
        }
      }, 0)
    }
    if (step < steps - 1) {
      setStep((s) => s + 1)
      setTestResult('idle')
    }
  }, [step, canGoNext, provider, credName, keyId, secret, region, addCredential, testCredential, steps])

  const handleBack = useCallback(() => {
    if (step > 0) setStep((s) => s - 1)
  }, [step])

  const handleTestConnection = useCallback(async () => {
    if (credentials.length === 0) return
    setTesting(true)
    setTestResult('idle')
    const last = credentials[credentials.length - 1]
    const ok = await testCredential(last.id)
    setTestResult(ok ? 'success' : 'fail')
    setTesting(false)
  }, [credentials, testCredential])

  const handleFinish = useCallback(() => {
    if (step === 2) {
      addEnvironment({
        name: envName,
        type: envType,
        provider: provider!,
        region,
        credentialId: credentials[credentials.length - 1]?.id ?? '',
        stateBackendType,
        stateBackendConfig: {},
        canvasId: null,
      })
    }
    localStorage.setItem('cloudbuilder-wizard-done', 'true')
  }, [step, envName, envType, provider, region, credentials, stateBackendType, addEnvironment])

  const handleTemplate = useCallback(() => {
    handleFinish()
    setActiveModule('platform')
    onClose()
  }, [handleFinish, setActiveModule, onClose])

  const handleScratch = useCallback(() => {
    handleFinish()
    setActiveModule('design')
    onClose()
  }, [handleFinish, setActiveModule, onClose])

  const activeCred = credentials.length > 0 ? credentials[credentials.length - 1] : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl mx-4 bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-navy flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-brand-lime" />
            </div>
            <div>
              <h2 className="text-base font-bold text-brand-navy">Configuração Inicial</h2>
              <p className="text-xs text-slate-400">
                Bem-vindo ao CloudBuilder! Vamos configurar sua plataforma em poucos passos.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress */}
        <div className="px-6 py-4 bg-slate-50/50">
          <div className="flex items-center justify-between mb-3">
            {stepLabels.map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <div
                  className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300',
                    i < step
                      ? 'bg-brand-lime text-brand-navy'
                      : i === step
                        ? 'bg-brand-navy text-white ring-2 ring-brand-lime/40'
                        : 'bg-slate-200 text-slate-400'
                  )}
                >
                  {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
                </div>
                <span className={cn('text-xs font-medium hidden sm:inline', i === step ? 'text-brand-navy' : 'text-slate-400')}>
                  {label}
                </span>
              </div>
            ))}
          </div>
          <Progress value={((step + 1) / steps) * 100} className="h-1.5" />
        </div>

        {/* Content */}
        <div className="px-6 py-6 min-h-[320px]">
          {/* Step 1: Provider Selection */}
          {step === 0 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
              <div>
                <h3 className="text-lg font-bold text-brand-navy">Escolha seu Provedor de Nuvem</h3>
                <p className="text-sm text-slate-400 mt-1">
                  Selecione o provedor onde sua infraestrutura será provisionada.
                </p>
              </div>
              <div className="grid gap-3">
                {providerData.map((p) => {
                  const selected = provider === p.id
                  return (
                    <button
                      key={p.id}
                      onClick={() => { setProvider(p.id); setRegion('') }}
                      className={cn(
                        'flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all duration-200',
                        selected
                          ? 'border-brand-navy bg-slate-50 shadow-md'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                      )}
                    >
                      <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center shrink-0', p.bg.split(' ')[0])}>
                        <p.icon className={cn('w-6 h-6', p.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-brand-navy">{p.label}</span>
                          {selected && (
                            <span className="w-5 h-5 rounded-full bg-brand-lime flex items-center justify-center">
                              <Check className="w-3 h-3 text-brand-navy" />
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{p.description}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Step 2: Credential Form */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
              <div>
                <h3 className="text-lg font-bold text-brand-navy">Configurar Credencial</h3>
                <p className="text-sm text-slate-400 mt-1">
                  Informe as credenciais de acesso para o provedor selecionado.
                </p>
              </div>

              {provider && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm">
                  <Globe className="w-4 h-4 text-slate-500" />
                  <span className="text-slate-500">Provedor:</span>
                  <span className="font-semibold text-brand-navy">
                    {provider === 'aws' ? 'AWS' : provider === 'azure' ? 'Azure' : 'GCP'}
                  </span>
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cred-name">Nome da Credencial</Label>
                  <Input
                    id="cred-name"
                    placeholder="Ex: AWS Produção"
                    value={credName}
                    onChange={(e) => setCredName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="key-id">
                    {provider === 'aws' ? 'Access Key ID' : provider === 'azure' ? 'Client ID' : 'Service Account Email'}
                  </Label>
                  <Input
                    id="key-id"
                    placeholder={
                      provider === 'aws'
                        ? 'AKIAIOSFODNN7EXAMPLE'
                        : provider === 'azure'
                          ? '00000000-0000-0000-0000-000000000000'
                          : 'service-account@project.iam.gserviceaccount.com'
                    }
                    value={keyId}
                    onChange={(e) => setKeyId(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secret">
                    {provider === 'aws' ? 'Secret Access Key' : provider === 'azure' ? 'Client Secret' : 'Private Key'}
                  </Label>
                  <div className="relative">
                    <Input
                      id="secret"
                      type={showSecret ? 'text' : 'password'}
                      placeholder="••••••••••••••••"
                      value={secret}
                      onChange={(e) => setSecret(e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecret(!showSecret)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="region">Região Padrão</Label>
                  <Select value={region} onValueChange={setRegion}>
                    <SelectTrigger id="region">
                      <SelectValue placeholder="Selecione uma região" />
                    </SelectTrigger>
                    <SelectContent>
                      {provider && ENVIRONMENT_REGIONS[provider]?.map((r) => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {keyId && secret && region && (
                <div className="pt-1">
                  <button
                    onClick={handleTestConnection}
                    disabled={testing}
                    className={cn(
                      'inline-flex items-center gap-2 px-5 h-10 rounded-xl text-sm font-bold transition-all border',
                      testResult === 'success'
                        ? 'bg-green-50 text-green-700 border-green-300'
                        : testResult === 'fail'
                          ? 'bg-red-50 text-red-700 border-red-300'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-100'
                    )}
                  >
                    {testing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : testResult === 'success' ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Key className="w-4 h-4" />
                    )}
                    {testing
                      ? 'Testando conexão...'
                      : testResult === 'success'
                        ? 'Conexão bem-sucedida'
                        : testResult === 'fail'
                          ? 'Falha na conexão'
                          : 'Testar Conexão'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Environment Form */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
              <div>
                <h3 className="text-lg font-bold text-brand-navy">Criar Ambiente</h3>
                <p className="text-sm text-slate-400 mt-1">
                  Configure o primeiro ambiente onde sua infraestrutura será implantada.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="env-name">Nome do Ambiente</Label>
                  <Input
                    id="env-name"
                    placeholder="Ex: desenvolvimento, staging, producao"
                    value={envName}
                    onChange={(e) => setEnvName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="env-type">Tipo de Ambiente</Label>
                  <Select value={envType} onValueChange={(v) => setEnvType(v as 'development' | 'staging' | 'production')}>
                    <SelectTrigger id="env-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ENVIRONMENT_TYPE_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="env-region">Região</Label>
                  <Select value={region} onValueChange={setRegion}>
                    <SelectTrigger id="env-region">
                      <SelectValue placeholder="Selecione uma região" />
                    </SelectTrigger>
                    <SelectContent>
                      {provider && ENVIRONMENT_REGIONS[provider]?.map((r) => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state-backend">State Backend</Label>
                  <Select value={stateBackendType} onValueChange={(v) => setStateBackendType(v as StateBackendType)}>
                    <SelectTrigger id="state-backend">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {stateBackendOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Summary */}
              <div className="rounded-xl bg-ice-blue/30 border border-slate-200 p-4 space-y-2">
                <h4 className="text-xs font-bold tracking-widest text-slate-500 uppercase">Resumo</h4>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Provedor</span>
                    <span className="font-semibold text-brand-navy">
                      {provider === 'aws' ? 'Amazon Web Services' : provider === 'azure' ? 'Microsoft Azure' : 'Google Cloud Platform'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Ambiente</span>
                    <span className="font-semibold text-brand-navy">{envName || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tipo</span>
                    <span className="font-semibold text-brand-navy">{ENVIRONMENT_TYPE_LABELS[envType]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Região</span>
                    <span className="font-semibold text-brand-navy">{region || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">State Backend</span>
                    <span className="font-semibold text-brand-navy">
                      {stateBackendOptions.find((o) => o.value === stateBackendType)?.label}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Choose Path */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-brand-lime/20 flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="w-7 h-7 text-brand-lime" />
                </div>
                <h3 className="text-lg font-bold text-brand-navy">Tudo Pronto!</h3>
                <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
                  Suas credenciais e ambiente estão configurados. Como deseja começar?
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <button
                  onClick={handleTemplate}
                  className="flex flex-col items-center text-center gap-3 p-6 rounded-2xl border-2 border-slate-200 bg-white hover:border-brand-navy hover:shadow-lg transition-all group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-brand-navy/5 flex items-center justify-center group-hover:bg-brand-lime/20 transition-colors">
                    <Layout className="w-7 h-7 text-brand-navy" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-brand-navy">Usar Template</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Escolha um modelo pré-construído de infraestrutura para começar rapidamente.
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-navy group-hover:gap-2 transition-all">
                    Ver Templates <ArrowRight className="w-3 h-3" />
                  </span>
                </button>

                <button
                  onClick={handleScratch}
                  className="flex flex-col items-center text-center gap-3 p-6 rounded-2xl border-2 border-slate-200 bg-white hover:border-brand-lime hover:shadow-lg transition-all group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-brand-lime/15 flex items-center justify-center group-hover:bg-brand-lime/30 transition-colors">
                    <Box className="w-7 h-7 text-brand-navy" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-brand-navy">Começar do Zero</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Abra o canvas em branco e projete sua infraestrutura do zero com nossa ferramenta visual.
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-lime group-hover:gap-2 transition-all">
                    Ir para Design <ArrowRight className="w-3 h-3" />
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <button
            onClick={step === 0 ? onClose : handleBack}
            className={cn(
              'inline-flex items-center gap-2 px-4 h-9 rounded-xl text-sm font-medium transition-all',
              step === 0
                ? 'text-slate-400 hover:text-slate-600'
                : 'text-slate-600 hover:text-brand-navy hover:bg-white border border-transparent hover:border-slate-200'
            )}
          >
            <ArrowLeft className="w-4 h-4" />
            {step === 0 ? 'Cancelar' : 'Voltar'}
          </button>

          <div className="flex items-center gap-3">
            {step === 0 && (
              <p className="text-xs text-slate-400">Selecione um provedor para continuar</p>
            )}
            {step < steps - 1 ? (
              <button
                onClick={handleNext}
                disabled={!canGoNext()}
                className="inline-flex items-center gap-2 px-5 h-9 rounded-xl text-sm font-bold bg-brand-navy text-white hover:bg-brand-navy/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
              >
                Próximo
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : step === steps - 1 && (
              <div className="flex gap-2">
                <button
                  onClick={handleTemplate}
                  className="inline-flex items-center gap-2 px-5 h-9 rounded-xl text-sm font-bold border-2 border-brand-navy text-brand-navy hover:bg-brand-navy/5 transition-all"
                >
                  <Layout className="w-4 h-4" />
                  Templates
                </button>
                <button
                  onClick={handleScratch}
                  className="inline-flex items-center gap-2 px-5 h-9 rounded-xl text-sm font-bold bg-brand-lime text-brand-navy hover:bg-brand-lime/90 transition-all shadow-sm"
                >
                  <Box className="w-4 h-4" />
                  Ir para o Design
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
