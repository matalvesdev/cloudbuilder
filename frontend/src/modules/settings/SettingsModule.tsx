import { useState, useMemo } from 'react'
import {
  Settings,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  Cloud,
  Globe,
  Key,
  Shield,
  Eye,
  EyeOff,
  Box,
  RefreshCw,
  AlertTriangle,
  GitBranch,
  Building2,
  User,
  Sun,
  Moon,
  Monitor,
  Bell,
  Check,
  Info,
  Palette,
  Lock,
  Save,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCredentialStore } from '@/store/credentialStore'
import { useRepoStore } from '@/store/repoStore'
import { useAuthStore } from '@/store/authStore'
import { useSystemSettingsStore } from '@/store/systemSettingsStore'
import { usePermission } from '@/hooks/usePermission'
import { useUiStore, type SettingsTab } from '@/store/uiStore'
import { updateProfile } from '@/api/auth'
import { showSuccess, showApiError } from '@/lib/toast'
import type { ThemeMode, AppLanguage } from '@/store/systemSettingsStore'
import {
  PROVIDER_LABELS,
  PROVIDER_COLORS,
  ENVIRONMENT_REGIONS,
  ENVIRONMENT_TYPE_LABELS,
  ENVIRONMENT_STATUS_LABELS,
  type Provider,
} from '@/types/settings.types'
import { RepositorySettings } from './RepositorySettings'
import { MultiTenantSettings } from './MultiTenantSettings'


interface CredentialForm {
  name: string
  provider: Provider
  keyId: string
  secret: string
  region: string
}

const emptyCredentialForm: CredentialForm = {
  name: '',
  provider: 'aws',
  keyId: '',
  secret: '',
  region: 'us-east-1',
}

interface EnvironmentForm {
  name: string
  type: 'development' | 'staging' | 'production'
  provider: Provider
  region: string
  credentialId: string
  stateBackendType: 's3' | 'local' | 'remote'
}

const emptyEnvironmentForm: EnvironmentForm = {
  name: '',
  type: 'development',
  provider: 'aws',
  region: 'us-east-1',
  credentialId: '',
  stateBackendType: 'local',
}

function CredentialFormModal({
  open,
  onClose,
  editId,
}: {
  open: boolean
  onClose: () => void
  editId: string | null
}) {
  const { credentials, addCredential, updateCredential } = useCredentialStore()
  const existing = editId ? credentials.find((c) => c.id === editId) : null

  const [form, setForm] = useState<CredentialForm>(
    existing
      ? { name: existing.name, provider: existing.provider, keyId: existing.keyId, secret: '', region: existing.region }
      : emptyCredentialForm
  )
  const [showSecret, setShowSecret] = useState(false)
  const [saving, setSaving] = useState(false)

  if (!open) return null

  const handleSave = async () => {
    if (!form.name.trim() || !form.keyId.trim() || (!editId && !form.secret.trim())) return
    setSaving(true)
    // Simulate save delay
    await new Promise((r) => setTimeout(r, 300))
    if (editId && existing) {
      updateCredential(editId, {
        name: form.name,
        keyId: form.keyId,
        ...(form.secret ? { secret: form.secret } : {}),
        region: form.region,
      })
    } else {
      addCredential({
        name: form.name,
        provider: form.provider,
        keyId: form.keyId,
        secret: form.secret,
        region: form.region,
      })
    }
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold text-brand-navy font-display">
            {editId ? 'Editar Credencial' : 'Nova Credencial'}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure as credenciais de acesso ao seu provedor de nuvem
          </p>
        </div>
        <div className="p-6 space-y-4">
          {/* Nome */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Nome da credencial
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy bg-white transition-all"
              placeholder="Ex: AWS Produção"
            />
          </div>

          {/* Provedor */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Provedor
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.entries(PROVIDER_LABELS) as [Provider, string][]).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => {
                    const regions = ENVIRONMENT_REGIONS[key]
                    setForm({ ...form, provider: key, region: regions[0] || 'us-east-1' })
                  }}
                  className={cn(
                    'flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-xs font-medium',
                    form.provider === key
                      ? 'border-brand-navy bg-brand-navy/5 text-brand-navy'
                      : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                  )}
                >
                  <Cloud className="w-5 h-5" />
                  {label.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Key ID */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              {form.provider === 'aws' ? 'AWS Access Key ID' : form.provider === 'azure' ? 'Azure Client ID' : 'GCP Service Account Email'}
            </label>
            <input
              type="text"
              value={form.keyId}
              onChange={(e) => setForm({ ...form, keyId: e.target.value })}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm font-mono focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy bg-white transition-all"
              placeholder={form.provider === 'aws' ? 'AKIAIOSFODNN7EXAMPLE' : ''}
            />
          </div>

          {/* Secret */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              {form.provider === 'aws' ? 'AWS Secret Access Key' : form.provider === 'azure' ? 'Azure Client Secret' : 'GCP Private Key JSON'}
            </label>
            <div className="relative">
              <input
                type={showSecret ? 'text' : 'password'}
                value={form.secret}
                onChange={(e) => setForm({ ...form, secret: e.target.value })}
                className="w-full h-10 px-3 pr-10 rounded-xl border border-slate-200 text-sm font-mono focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy bg-white transition-all"
                placeholder={editId ? '•••••••• (deixar vazio para manter)' : ''}
              />
              <button
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Região padrão */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Região Padrão
            </label>
            <select
              value={form.region}
              onChange={(e) => setForm({ ...form, region: e.target.value })}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy bg-white transition-all"
            >
              {ENVIRONMENT_REGIONS[form.provider]?.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="p-6 pt-0 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 h-9 rounded-full text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form.name.trim() || !form.keyId.trim() || (!editId && !form.secret.trim())}
            className="inline-flex items-center gap-1.5 px-5 h-9 rounded-full text-xs font-bold bg-brand-navy text-white hover:bg-[#0D1B2A] transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            {saving ? 'Salvando...' : editId ? 'Atualizar' : 'Adicionar'}
          </button>
        </div>
      </div>
    </div>
  )
}

function EnvironmentFormModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { credentials, environments, addEnvironment } = useCredentialStore()
  const [form, setForm] = useState<EnvironmentForm>(emptyEnvironmentForm)

  if (!open) return null

  const handleSave = () => {
    if (!form.name.trim() || !form.credentialId) return
    const cred = credentials.find((c) => c.id === form.credentialId)
    addEnvironment({
      name: form.name,
      type: form.type,
      provider: cred?.provider || form.provider,
      region: form.region,
      credentialId: form.credentialId,
      stateBackendType: form.stateBackendType,
      stateBackendConfig: {},
      canvasId: null,
    })
    setForm(emptyEnvironmentForm)
    onClose()
  }

  const filteredCreds = credentials.filter((c) => c.status === 'valid' || c.status === 'unknown')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold text-brand-navy font-display">Novo Ambiente</h2>
          <p className="text-xs text-slate-400 mt-0.5">Configure um ambiente para deploy da sua infraestrutura</p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nome</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy bg-white transition-all"
              placeholder="Ex: dev, staging, producao"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tipo</label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.entries(ENVIRONMENT_TYPE_LABELS) as [string, string][]).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setForm({ ...form, type: key as EnvironmentForm['type'] })}
                  className={cn(
                    'p-3 rounded-xl border-2 transition-all text-xs font-medium',
                    form.type === key
                      ? 'border-brand-navy bg-brand-navy/5 text-brand-navy'
                      : 'border-slate-200 text-slate-500 hover:border-slate-300'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Credencial
            </label>
            {filteredCreds.length === 0 ? (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-700">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                Nenhuma credencial configurada. Crie uma credencial primeiro.
              </div>
            ) : (
              <select
                value={form.credentialId}
                onChange={(e) => {
                  const cred = credentials.find((c) => c.id === e.target.value)
                  setForm({
                    ...form,
                    credentialId: e.target.value,
                    provider: cred?.provider || form.provider,
                    region: cred?.region || form.region,
                  })
                }}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm bg-white transition-all"
              >
                <option value="">Selecione uma credencial</option>
                {filteredCreds.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.provider.toUpperCase()}) — {c.maskedSecret}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Região</label>
            <select
              value={form.region}
              onChange={(e) => setForm({ ...form, region: e.target.value })}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm bg-white transition-all"
            >
              {ENVIRONMENT_REGIONS[form.provider]?.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">State Backend</label>
            <select
              value={form.stateBackendType}
              onChange={(e) => setForm({ ...form, stateBackendType: e.target.value as EnvironmentForm['stateBackendType'] })}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm bg-white transition-all"
            >
              <option value="local">Local</option>
              <option value="s3">S3 (AWS)</option>
              <option value="remote">Remoto (Terraform Cloud)</option>
            </select>
          </div>
        </div>
        <div className="p-6 pt-0 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 h-9 rounded-full text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!form.name.trim() || !form.credentialId}
            className="inline-flex items-center gap-1.5 px-5 h-9 rounded-full text-xs font-bold bg-brand-navy text-white hover:bg-[#0D1B2A] transition-all disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
            Criar Ambiente
          </button>
        </div>
      </div>
    </div>
  )
}

export function SettingsModule() {
  const { credentials, environments, removeCredential, testCredential, removeEnvironment, deployments } = useCredentialStore()
  const { connectedRepos } = useRepoStore()
  const { user, logout } = useAuthStore()
  const { settings, updateTheme, updateLanguage, updateNotification } = useSystemSettingsStore()
  const { hasRole } = usePermission()
  const isAdmin = hasRole('admin')

  const adminTabs: SettingsTab[] = useMemo(() => ['credentials', 'environments', 'repositories', 'multitenant'], [])
  const publicTabs: SettingsTab[] = useMemo(() => ['profile', 'system'], [])
  const allTabs: SettingsTab[] = useMemo(() => isAdmin ? [...adminTabs, ...publicTabs] : publicTabs, [isAdmin, adminTabs, publicTabs])

  const tab = useUiStore((s) => s.settingsTab)
  const setTab = useUiStore((s) => s.setSettingsTab)
  const [showCredForm, setShowCredForm] = useState(false)
  const [editCredId, setEditCredId] = useState<string | null>(null)
  const [showEnvForm, setShowEnvForm] = useState(false)
  const [testingId, setTestingId] = useState<string | null>(null)
  const [profileName, setProfileName] = useState(user?.name || '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [profileSaved, setProfileSaved] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)
  const [passwordChanged, setPasswordChanged] = useState(false)

  const handleSaveProfile = async () => {
    if (!profileName.trim() || profileSaving) return
    setProfileSaving(true)
    try {
      const result = await updateProfile(profileName.trim())
      if (user) useAuthStore.setState({ user: { ...user, name: result.name } })
      setProfileSaved(true)
      showSuccess('Perfil atualizado com sucesso')
    } catch (err) {
      showApiError(err, 'Erro ao salvar perfil')
    } finally {
      setProfileSaving(false)
    }
  }

  const handleTestConnection = async (id: string) => {
    setTestingId(id)
    await testCredential(id)
    setTestingId(null)
  }

  return (
    <div className="p-7 overflow-y-auto flex-1">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-[28px] font-bold tracking-tight text-brand-navy">Configurações</h1>
          {(credentials.length === 0 || environments.length === 0) && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
              <AlertTriangle className="w-3 h-3" />
              Setup incompleto
            </span>
          )}
        </div>
        <p className="text-sm text-slate-500 mt-0.5">
          Gerencie seu perfil, preferências do sistema, credenciais e ambientes de deploy
        </p>
      </div>

      {/* Setup Progress — admin only */}
      {isAdmin && (
        <div className="mb-6 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Progresso da Configuração</p>
            <span className={cn(
              'text-[10px] font-bold px-2 py-0.5 rounded-full',
              credentials.length > 0 && environments.length > 0 && connectedRepos.length > 0
                ? 'bg-green-50 text-green-700'
                : 'bg-amber-50 text-amber-700'
            )}>
              {[credentials.length > 0, environments.length > 0, connectedRepos.length > 0].filter(Boolean).length}/3
            </span>
          </div>
          <div className="flex items-center gap-2">
            {[
              { label: 'Credenciais', done: credentials.length > 0, count: credentials.length },
              { label: 'Ambientes', done: environments.length > 0, count: environments.length },
              { label: 'Repositórios', done: connectedRepos.length > 0, count: connectedRepos.length },
            ].map((item) => (
              <div key={item.label} className="flex-1">
                <div className={cn(
                  'h-2 rounded-full transition-all',
                  item.done ? 'bg-brand-lime' : 'bg-slate-200'
                )} />
                <div className="flex items-center justify-between mt-1">
                  <span className={cn(
                    'text-[10px] font-medium',
                    item.done ? 'text-brand-navy' : 'text-slate-400'
                  )}>{item.label}</span>
                  <span className="text-[9px] text-slate-400">{item.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Section: Administração */}
      <div className="mb-6">
        {isAdmin && (
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-brand-navy/30" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Administração</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>
        )}
        <div className="flex items-center gap-1 bg-slate-100/80 rounded-full p-0.5 w-fit">
          {isAdmin && (
            <>
              <button
                onClick={() => setTab('credentials')}
                className={cn(
                  'flex items-center gap-1.5 px-4 h-8 rounded-full text-xs font-semibold transition-all',
                  tab === 'credentials' ? 'bg-brand-navy text-brand-lime shadow-sm' : 'text-slate-500 hover:text-brand-navy'
                )}
              >
                <Key className="w-3.5 h-3.5" />
                Credenciais
              </button>
              <button
                onClick={() => setTab('environments')}
                className={cn(
                  'flex items-center gap-1.5 px-4 h-8 rounded-full text-xs font-semibold transition-all',
                  tab === 'environments' ? 'bg-brand-navy text-brand-lime shadow-sm' : 'text-slate-500 hover:text-brand-navy'
                )}
              >
                <Globe className="w-3.5 h-3.5" />
                Ambientes
              </button>
              <button
                onClick={() => setTab('repositories')}
                className={cn(
                  'flex items-center gap-1.5 px-4 h-8 rounded-full text-xs font-semibold transition-all',
                  tab === 'repositories' ? 'bg-brand-navy text-brand-lime shadow-sm' : 'text-slate-500 hover:text-brand-navy'
                )}
              >
                <GitBranch className="w-3.5 h-3.5" />
                Repositórios
              </button>
              <button
                onClick={() => setTab('multitenant')}
                className={cn(
                  'flex items-center gap-1.5 px-4 h-8 rounded-full text-xs font-semibold transition-all',
                  tab === 'multitenant' ? 'bg-brand-navy text-brand-lime shadow-sm' : 'text-slate-500 hover:text-brand-navy'
                )}
              >
                <Building2 className="w-3.5 h-3.5" />
                Multitenancy
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tab Section: Pessoal */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-brand-navy/30" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Pessoal</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>
        <div className="flex items-center gap-1 bg-slate-100/80 rounded-full p-0.5 w-fit">
          <button
            onClick={() => setTab('profile')}
            className={cn(
              'flex items-center gap-1.5 px-4 h-8 rounded-full text-xs font-semibold transition-all',
              tab === 'profile' ? 'bg-brand-navy text-brand-lime shadow-sm' : 'text-slate-500 hover:text-brand-navy'
            )}
          >
            <User className="w-3.5 h-3.5" />
            Perfil
          </button>
          <button
            onClick={() => setTab('system')}
            className={cn(
              'flex items-center gap-1.5 px-4 h-8 rounded-full text-xs font-semibold transition-all',
              tab === 'system' ? 'bg-brand-navy text-brand-lime shadow-sm' : 'text-slate-500 hover:text-brand-navy'
            )}
          >
            <Palette className="w-3.5 h-3.5" />
            Sistema
          </button>
        </div>
      </div>

      {tab === 'credentials' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-slate-400">{credentials.length} credenciais configuradas</p>
            <button
              onClick={() => { setEditCredId(null); setShowCredForm(true) }}
              className="inline-flex items-center gap-1.5 px-4 h-8 rounded-full text-xs font-bold bg-brand-navy text-white hover:bg-[#0D1B2A] transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Nova Credencial
            </button>
          </div>

          {credentials.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
              <div className="flex flex-col items-center text-center max-w-sm mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mb-4 border border-amber-200">
                  <Cloud className="w-8 h-8 text-amber-500" />
                </div>
                <p className="text-base font-bold text-brand-navy mb-1">Nenhuma credencial configurada</p>
                <p className="text-xs text-slate-400 mb-5 max-w-xs leading-relaxed">
                  Você precisa de ao menos uma credencial (AWS, Azure ou GCP) para provisionar infraestrutura.
                  Configure agora ou use o assistente de configuração rápida.
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => { setEditCredId(null); setShowCredForm(true) }}
                    className="inline-flex items-center gap-1.5 px-5 h-9 rounded-full text-xs font-bold bg-brand-navy text-white hover:bg-[#0D1B2A] transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Adicionar Manualmente
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-3">
              {credentials.map((cred) => (
                <div
                  key={cred.id}
                  className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center',
                        cred.provider === 'aws' ? 'bg-amber-50' : cred.provider === 'azure' ? 'bg-blue-50' : 'bg-green-50'
                      )}>
                        <Cloud className={cn(
                          'w-5 h-5',
                          cred.provider === 'aws' ? 'text-amber-500' : cred.provider === 'azure' ? 'text-blue-500' : 'text-green-500'
                        )} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-brand-navy">{cred.name}</p>
                          <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full border font-medium', PROVIDER_COLORS[cred.provider])}>
                            {cred.provider.toUpperCase()}
                          </span>
                          {cred.status === 'valid' && (
                            <span className="flex items-center gap-1 text-[10px] text-green-600 font-medium">
                              <CheckCircle2 className="w-3 h-3" /> Válida
                            </span>
                          )}
                          {cred.status === 'invalid' && (
                            <span className="flex items-center gap-1 text-[10px] text-red-600 font-medium">
                              <XCircle className="w-3 h-3" /> Inválida
                            </span>
                          )}
                          {cred.status === 'unknown' && (
                            <span className="text-[10px] text-slate-400 font-medium">Não testada</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <p className="text-xs text-slate-400 font-mono">{cred.keyId}</p>
                          <span className="text-xs text-slate-300">•</span>
                          <p className="text-xs text-slate-400">{cred.maskedSecret}</p>
                          <span className="text-xs text-slate-300">•</span>
                          <p className="text-xs text-slate-400">{cred.region}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleTestConnection(cred.id)}
                        disabled={testingId === cred.id}
                        className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all disabled:opacity-50"
                      >
                        {testingId === cred.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <RefreshCw className="w-3 h-3" />
                        )}
                        Testar
                      </button>
                      <button
                        onClick={() => { setEditCredId(cred.id); setShowCredForm(true) }}
                        className="p-2 rounded-lg text-slate-400 hover:text-brand-navy hover:bg-slate-100 transition-all"
                      >
                        <Shield className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeCredential(cred.id)}
                        className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'repositories' && (
        <RepositorySettings />
      )}

      {tab === 'environments' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-slate-400">{environments.length} ambientes configurados</p>
            <button
              onClick={() => setShowEnvForm(true)}
              className="inline-flex items-center gap-1.5 px-4 h-8 rounded-full text-xs font-bold bg-brand-navy text-white hover:bg-[#0D1B2A] transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Novo Ambiente
            </button>
          </div>

          {environments.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
              <div className="flex flex-col items-center text-center max-w-sm mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mb-4 border border-amber-200">
                  <Box className="w-8 h-8 text-amber-500" />
                </div>
                <p className="text-base font-bold text-brand-navy mb-1">Nenhum ambiente configurado</p>
                <p className="text-xs text-slate-400 mb-2 max-w-xs leading-relaxed">
                  Ambientes definem onde sua infraestrutura será provisionada (desenvolvimento, staging, produção).
                </p>
                {credentials.length > 0 ? (
                  <p className="text-[11px] text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5 mb-4">
                    {credentials.length} credencial(is) disponível(is) para usar
                  </p>
                ) : (
                  <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 mb-4">
                    Crie uma credencial primeiro para poder criar ambientes
                  </p>
                )}
                <button
                  onClick={() => setShowEnvForm(true)}
                  disabled={credentials.length === 0}
                  className="inline-flex items-center gap-1.5 px-5 h-9 rounded-full text-xs font-bold bg-brand-navy text-white hover:bg-[#0D1B2A] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Novo Ambiente
                </button>
              </div>
            </div>
          ) : (
            <div className="grid gap-3">
              {environments.map((env) => {
                const cred = credentials.find((c) => c.id === env.credentialId)
                const envDeployments = deployments.filter((d) => d.environmentId === env.id)
                const lastDeploy = envDeployments[envDeployments.length - 1]

                return (
                  <div
                    key={env.id}
                    className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-ice-blue flex items-center justify-center">
                          <Box className="w-5 h-5 text-brand-navy" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-brand-navy">{env.name}</p>
                            <span className={cn(
                              'text-[10px] px-1.5 py-0.5 rounded-full border font-medium',
                              env.type === 'production'
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : env.type === 'staging'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-blue-50 text-blue-700 border-blue-200'
                            )}>
                              {ENVIRONMENT_TYPE_LABELS[env.type]}
                            </span>
                            <span className={cn(
                              'text-[10px] px-1.5 py-0.5 rounded-full border font-medium',
                              env.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border-green-200' :
                              env.status === 'FAILED' ? 'bg-red-50 text-red-700 border-red-200' :
                              'bg-slate-50 text-slate-600 border-slate-200'
                            )}>
                              {ENVIRONMENT_STATUS_LABELS[env.status]}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-0.5">
                            <p className="text-xs text-slate-400">{env.provider.toUpperCase()} / {env.region}</p>
                            <span className="text-xs text-slate-300">•</span>
                            <p className="text-xs text-slate-400">
                              Credencial: {cred?.name || 'Não vinculada'}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {lastDeploy && (
                          <div className="text-right text-xs text-slate-400">
                            <p>Último deploy: {lastDeploy.version}</p>
                            <p className={cn(
                              lastDeploy.status === 'success' ? 'text-green-600' : 'text-red-600'
                            )}>{lastDeploy.status}</p>
                          </div>
                        )}
                        <button
                          onClick={() => removeEnvironment(env.id)}
                          className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'multitenant' && (
        <MultiTenantSettings />
      )}

      {tab === 'profile' && (
        <div className="max-w-2xl">
          {/* Informações do usuário */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-6">
            <div className="flex items-center gap-5 mb-6">
              <div className="relative group">
                <div className="w-16 h-16 rounded-2xl bg-brand-navy flex items-center justify-center shadow-md shadow-brand-navy/10">
                  <span className="text-2xl font-bold text-brand-lime">
                    {user?.name?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-brand-navy">{user?.name || 'Usuário'}</h3>
                <p className="text-sm text-slate-500">{user?.email}</p>
                <div className="flex items-center gap-3 mt-1">
                  {user?.tenantName && (
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      {user.tenantName}
                    </p>
                  )}
                  <p className="text-xs text-slate-400">
                    Membro desde junho de 2026
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {user?.roles?.map((role) => (
                <span
                  key={role}
                  className={cn(
                    'text-[10px] px-2 py-0.5 rounded-full border font-semibold',
                    role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                    role === 'editor' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    'bg-slate-50 text-slate-600 border-slate-200'
                  )}
                >
                  {role === 'admin' ? 'Administrador' : role === 'editor' ? 'Editor' : 'Visualizador'}
                </span>
              ))}
            </div>

            {/* Team callout if no tenant */}
            {!user?.tenantName && (
              <div className="flex items-start gap-3 p-3 rounded-xl bg-ice-blue/30 border border-ice-blue">
                <Building2 className="w-4 h-4 text-brand-navy shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-brand-navy">Você não está vinculado a um time</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Convidar membros para seu projeto ou criar um time na aba Multitenancy.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Editar nome */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-6">
            <h4 className="text-sm font-bold text-brand-navy mb-4 flex items-center gap-2">
              <User className="w-4 h-4" />
              Informações do Perfil
            </h4>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nome</label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => { setProfileName(e.target.value); setProfileSaved(false) }}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm text-brand-navy bg-white focus:outline-none focus:ring-2 focus:ring-brand-lime focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full h-10 px-3 rounded-lg border border-slate-100 text-sm text-slate-400 bg-slate-50 cursor-not-allowed"
                />
                <p className="text-[10px] text-slate-400 mt-1">O email não pode ser alterado.</p>
              </div>
              <button
                onClick={handleSaveProfile}
                disabled={!profileName.trim() || profileName === user?.name || profileSaving}
                className="inline-flex items-center gap-1.5 px-5 h-9 rounded-full text-xs font-bold bg-brand-navy text-white hover:bg-[#0D1B2A] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {profileSaving ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Salvando</>
                ) : profileSaved ? (
                  <><Check className="w-3.5 h-3.5" /> Salvo</>
                ) : (
                  <><Save className="w-3.5 h-3.5" /> Salvar</>
                )}
              </button>
            </div>
          </div>

          {/* Alterar senha */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h4 className="text-sm font-bold text-brand-navy mb-4 flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Alterar Senha
            </h4>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Senha Atual</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm text-brand-navy bg-white focus:outline-none focus:ring-2 focus:ring-brand-lime focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nova Senha</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm text-brand-navy bg-white focus:outline-none focus:ring-2 focus:ring-brand-lime focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Confirmar Nova Senha</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm text-brand-navy bg-white focus:outline-none focus:ring-2 focus:ring-brand-lime focus:border-transparent"
                />
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPasswordChanged(true)}
                  disabled={!currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                  className="inline-flex items-center gap-1.5 px-5 h-9 rounded-full text-xs font-bold bg-brand-navy text-white hover:bg-[#0D1B2A] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {passwordChanged ? (
                    <><Check className="w-3.5 h-3.5" /> Senha Alterada</>
                  ) : (
                    <><Lock className="w-3.5 h-3.5" /> Alterar Senha</>
                  )}
                </button>
                {newPassword && confirmPassword && newPassword !== confirmPassword && (
                  <span className="text-[10px] text-red-500 font-medium">As senhas não coincidem</span>
                )}
                {newPassword && newPassword.length > 0 && newPassword.length < 6 && (
                  <span className="text-[10px] text-amber-500 font-medium">Mínimo de 6 caracteres</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'system' && (
        <div className="max-w-2xl space-y-6">
          {/* Tema */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h4 className="text-sm font-bold text-brand-navy mb-4 flex items-center gap-2">
              <Sun className="w-4 h-4" />
              Aparência
            </h4>
            <div className="flex items-center gap-3">
              {(['light', 'dark', 'system'] as ThemeMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => updateTheme(mode)}
                  className={cn(
                    'flex items-center gap-2 px-4 h-10 rounded-xl text-xs font-semibold border transition-all',
                    settings.theme === mode
                      ? 'bg-brand-navy text-brand-lime border-brand-navy shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  )}
                >
                  {mode === 'light' && <Sun className="w-4 h-4" />}
                  {mode === 'dark' && <Moon className="w-4 h-4" />}
                  {mode === 'system' && <Monitor className="w-4 h-4" />}
                  {mode === 'light' ? 'Claro' : mode === 'dark' ? 'Escuro' : 'Sistema'}
                </button>
              ))}
            </div>
          </div>

          {/* Idioma */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h4 className="text-sm font-bold text-brand-navy mb-4 flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Idioma
            </h4>
            <div className="flex items-center gap-3">
              {(['pt-BR', 'en'] as AppLanguage[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => updateLanguage(lang)}
                  className={cn(
                    'flex items-center gap-2 px-4 h-10 rounded-xl text-xs font-semibold border transition-all',
                    settings.language === lang
                      ? 'bg-brand-navy text-brand-lime border-brand-navy shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  )}
                >
                  {lang === 'pt-BR' ? '🇧🇷 Português (Brasil)' : '🇺🇸 English (US)'}
                </button>
              ))}
            </div>
          </div>

          {/* Notificações */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h4 className="text-sm font-bold text-brand-navy mb-4 flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notificações
            </h4>
            <div className="space-y-3">
              {[
                { key: 'email' as const, label: 'Receber notificações por email', desc: 'Todas as notificações serão enviadas para seu email cadastrado' },
                { key: 'deployComplete' as const, label: 'Deploy concluído', desc: 'Quando um deploy for concluído com sucesso' },
                { key: 'deployFailed' as const, label: 'Falha no deploy', desc: 'Quando um deploy falhar' },
                { key: 'approvalRequested' as const, label: 'Aprovação solicitada', desc: 'Quando alguém solicitar sua aprovação para um deploy' },
                { key: 'driftDetected' as const, label: 'Drift detectado', desc: 'Quando houver divergência entre o estado desejado e o real' },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-semibold text-brand-navy">{label}</p>
                    <p className="text-xs text-slate-400">{desc}</p>
                  </div>
                  <button
                    onClick={() => updateNotification(key, !settings.notifications[key])}
                    className={cn(
                      'relative w-11 h-6 rounded-full transition-colors',
                      settings.notifications[key] ? 'bg-brand-lime' : 'bg-slate-200'
                    )}
                  >
                    <span
                      className={cn(
                        'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform',
                        settings.notifications[key] && 'translate-x-5'
                      )}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <CredentialFormModal
        open={showCredForm}
        onClose={() => { setShowCredForm(false); setEditCredId(null) }}
        editId={editCredId}
      />
      <EnvironmentFormModal
        open={showEnvForm}
        onClose={() => setShowEnvForm(false)}
      />
    </div>
  )
}
