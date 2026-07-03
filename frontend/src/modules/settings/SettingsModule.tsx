import { useState, useMemo, useEffect } from 'react'
import {
  Settings, Plus, Trash2, CheckCircle2, XCircle, Loader2, Cloud,
  Globe, Key, Shield, Eye, EyeOff, Box, RefreshCw, AlertTriangle,
  GitBranch, Building2, User, Sun, Moon, Monitor, Bell, Check,
  Info, Palette, Lock, Save, Copy, ExternalLink, ChevronRight,
  Zap, Database, Server, CreditCard, FileCode, Fingerprint,
  Link, ShieldCheck, Brain, Activity, Search, FileText, Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCredentialStore } from '@/store/credentialStore'
import { useRepoStore } from '@/store/repoStore'
import { useAuthStore } from '@/store/authStore'
import { useSystemSettingsStore } from '@/store/systemSettingsStore'
import { usePermission } from '@/hooks/usePermission'
import { useUiStore, type SettingsTab } from '@/store/uiStore'
import { updateProfile } from '@/api/auth'
import { settingsApi, type ApiTokenDTO, type SshKeyDTO } from '@/api/settings'
import { showSuccess, showApiError } from '@/lib/toast'
import type { ThemeMode, AppLanguage } from '@/store/systemSettingsStore'
import {
  PROVIDER_LABELS, PROVIDER_COLORS, ENVIRONMENT_REGIONS,
  ENVIRONMENT_TYPE_LABELS, ENVIRONMENT_STATUS_LABELS, type Provider,
} from '@/types/settings.types'
import { RepositorySettings } from './RepositorySettings'
import { MultiTenantSettings } from './MultiTenantSettings'

// ─── Sidebar sections per diagram 31 ─────────────────────────────
interface SidebarSection {
  id: string; label: string; icon: typeof User; adminOnly?: boolean
}

const sidebarSections: SidebarSection[] = [
  { id: 'profile', label: 'Meu Perfil', icon: User },
  { id: 'organization', label: 'Organização', icon: Building2, adminOnly: true },
  { id: 'workspaces', label: 'Workspaces', icon: Box, adminOnly: true },
  { id: 'teams', label: 'Times', icon: Users, adminOnly: true },
  { id: 'members', label: 'Usuários', icon: Users, adminOnly: true },
  { id: 'permissions', label: 'Permissões', icon: Shield, adminOnly: true },
  { id: 'credentials', label: 'Cloud Providers', icon: Cloud, adminOnly: true },
  { id: 'git-providers', label: 'Git Providers', icon: GitBranch, adminOnly: true },
  { id: 'integrations', label: 'Integrações', icon: Link, adminOnly: true },
  { id: 'security', label: 'Segurança', icon: ShieldCheck, adminOnly: true },
  { id: 'billing', label: 'Billing', icon: CreditCard, adminOnly: true },
  { id: 'notifications', label: 'Notificações', icon: Bell },
  { id: 'audit', label: 'Auditoria', icon: FileText, adminOnly: true },
  { id: 'api-tokens', label: 'API Tokens', icon: Key },
  { id: 'ssh-keys', label: 'SSH Keys', icon: Fingerprint },
  { id: 'system', label: 'Preferências', icon: Palette },
  { id: 'ai-settings', label: 'IA', icon: Brain, adminOnly: true },
]

// Users icon from lucide-react

// ─── Forms ───────────────────────────────────────────────────────

interface CredentialForm {
  name: string; provider: Provider; keyId: string; secret: string; region: string
}
const emptyCredentialForm: CredentialForm = { name: '', provider: 'aws', keyId: '', secret: '', region: 'us-east-1' }

function CredentialFormModal({ open, onClose, editId }: { open: boolean; onClose: () => void; editId: string | null }) {
  const { credentials, addCredential, updateCredential } = useCredentialStore()
  const existing = editId ? credentials.find((c) => c.id === editId) : null
  const [form, setForm] = useState<CredentialForm>(
    existing ? { name: existing.name, provider: existing.provider, keyId: existing.keyId, secret: '', region: existing.region } : emptyCredentialForm
  )
  const [showSecret, setShowSecret] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (open) {
      setForm(existing ? { name: existing.name, provider: existing.provider, keyId: existing.keyId, secret: '', region: existing.region } : emptyCredentialForm)
      setErrors({})
    }
  }, [open, existing])

  if (!open) return null

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Nome é obrigatório'
    if (!form.keyId.trim()) e.keyId = 'Key ID é obrigatório'
    if (!editId && !form.secret.trim()) e.secret = 'Secret é obrigatório'
    if (form.secret && form.secret.length < 10) e.secret = 'Mínimo 10 caracteres'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    await new Promise((r) => setTimeout(r, 300))
    if (editId && existing) {
      updateCredential(editId, { name: form.name, keyId: form.keyId, ...(form.secret ? { secret: form.secret } : {}), region: form.region })
    } else {
      addCredential({ name: form.name, provider: form.provider, keyId: form.keyId, secret: form.secret, region: form.region })
    }
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold text-brand-navy">{editId ? 'Editar Credencial' : 'Nova Credencial'}</h2>
          <p className="text-xs text-slate-400 mt-0.5">Configure as credenciais de acesso ao provedor de nuvem</p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nome</label>
            <input type="text" value={form.name} onChange={(e) => { setForm({ ...form, name: e.target.value }); setErrors({ ...errors, name: '' }) }}
              className={cn('w-full h-10 px-3 rounded-xl border text-sm focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy bg-white transition-all', errors.name ? 'border-red-300' : 'border-slate-200')}
              placeholder="Ex: AWS Produção" />
            {errors.name && <p className="text-[10px] text-red-500 mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Provedor</label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.entries(PROVIDER_LABELS) as [Provider, string][]).map(([key, label]) => (
                <button key={key} onClick={() => { const regions = ENVIRONMENT_REGIONS[key]; setForm({ ...form, provider: key, region: regions[0] || 'us-east-1' }) }}
                  className={cn('flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-xs font-medium',
                    form.provider === key ? 'border-brand-navy bg-brand-navy/5 text-brand-navy' : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50')}>
                  <Cloud className="w-5 h-5" />{label.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              {form.provider === 'aws' ? 'AWS Access Key ID' : form.provider === 'azure' ? 'Azure Client ID' : 'GCP Service Account Email'}
            </label>
            <input type="text" value={form.keyId} onChange={(e) => { setForm({ ...form, keyId: e.target.value }); setErrors({ ...errors, keyId: '' }) }}
              className={cn('w-full h-10 px-3 rounded-xl border text-sm font-mono focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy bg-white transition-all', errors.keyId ? 'border-red-300' : 'border-slate-200')}
              placeholder={form.provider === 'aws' ? 'AKIAIOSFODNN7EXAMPLE' : ''} />
            {errors.keyId && <p className="text-[10px] text-red-500 mt-1">{errors.keyId}</p>}
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              {form.provider === 'aws' ? 'AWS Secret Access Key' : form.provider === 'azure' ? 'Azure Client Secret' : 'GCP Private Key JSON'}
            </label>
            <div className="relative">
              <input type={showSecret ? 'text' : 'password'} value={form.secret}
                onChange={(e) => { setForm({ ...form, secret: e.target.value }); setErrors({ ...errors, secret: '' }) }}
                className={cn('w-full h-10 px-3 pr-10 rounded-xl border text-sm font-mono focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy bg-white transition-all', errors.secret ? 'border-red-300' : 'border-slate-200')}
                placeholder={editId ? '•••••••• (deixar vazio para manter)' : ''} />
              <button onClick={() => setShowSecret(!showSecret)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.secret && <p className="text-[10px] text-red-500 mt-1">{errors.secret}</p>}
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Região Padrão</label>
            <select value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy bg-white transition-all">
              {ENVIRONMENT_REGIONS[form.provider]?.map((r) => (<option key={r} value={r}>{r}</option>))}
            </select>
          </div>
        </div>
        <div className="p-6 pt-0 flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-4 h-9 rounded-full text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all">Cancelar</button>
          <button onClick={handleSave} disabled={saving}
            className="inline-flex items-center gap-1.5 px-5 h-9 rounded-full text-xs font-bold bg-brand-navy text-white hover:bg-[#0D1B2A] transition-all disabled:opacity-50">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            {saving ? 'Salvando...' : editId ? 'Atualizar' : 'Adicionar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Settings Content Sections ───────────────────────────────────

function ProfileSection() {
  const { user } = useAuthStore()
  const [profileName, setProfileName] = useState(user?.name || '')
  const [profileSaved, setProfileSaved] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)

  useEffect(() => { setProfileName(user?.name || '') }, [user?.name])

  const handleSave = async () => {
    if (!profileName.trim() || profileSaving) return
    setProfileSaving(true)
    try {
      const result = await updateProfile(profileName.trim())
      if (user) useAuthStore.setState({ user: { ...user, name: result.name } })
      setProfileSaved(true)
      showSuccess('Perfil atualizado')
    } catch (err) { showApiError(err, 'Erro ao salvar') } finally { setProfileSaving(false) }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-5 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-brand-navy flex items-center justify-center shadow-md shadow-brand-navy/10">
            <span className="text-2xl font-bold text-brand-lime">{user?.name?.charAt(0)?.toUpperCase() || '?'}</span>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-brand-navy">{user?.name || 'Usuário'}</h3>
            <p className="text-sm text-slate-500">{user?.email}</p>
            {user?.tenantName && <p className="text-xs text-slate-400 flex items-center gap-1 mt-1"><Building2 className="w-3 h-3" />{user.tenantName}</p>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {user?.roles?.map((role) => (
            <span key={role} className={cn('text-[10px] px-2 py-0.5 rounded-full border font-semibold',
              role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-200' :
              role === 'editor' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-50 text-slate-600 border-slate-200')}>
              {role === 'admin' ? 'Administrador' : role === 'editor' ? 'Editor' : 'Visualizador'}
            </span>
          ))}
        </div>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h4 className="text-sm font-bold text-brand-navy mb-4 flex items-center gap-2"><User className="w-4 h-4" /> Informações Pessoais</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nome</label>
            <input type="text" value={profileName} onChange={(e) => { setProfileName(e.target.value); setProfileSaved(false) }}
              className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm text-brand-navy bg-white focus:outline-none focus:ring-2 focus:ring-brand-lime focus:border-transparent" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email</label>
            <input type="email" value={user?.email || ''} disabled className="w-full h-10 px-3 rounded-lg border border-slate-100 text-sm text-slate-400 bg-slate-50 cursor-not-allowed" />
            <p className="text-[10px] text-slate-400 mt-1">O email não pode ser alterado.</p>
          </div>
          <button onClick={handleSave} disabled={!profileName.trim() || profileName === user?.name || profileSaving}
            className="inline-flex items-center gap-1.5 px-5 h-9 rounded-full text-xs font-bold bg-brand-navy text-white hover:bg-[#0D1B2A] transition-all disabled:opacity-50">
            {profileSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : profileSaved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            {profileSaving ? 'Salvando...' : profileSaved ? 'Salvo' : 'Salvar'}
          </button>
        </div>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h4 className="text-sm font-bold text-brand-navy mb-4 flex items-center gap-2"><Lock className="w-4 h-4" /> Alterar Senha</h4>
        <div className="space-y-4">
          <div><label className="block text-xs font-semibold text-slate-600 mb-1.5">Senha Atual</label>
            <input type="password" className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-lime" /></div>
          <div><label className="block text-xs font-semibold text-slate-600 mb-1.5">Nova Senha</label>
            <input type="password" className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-lime" /></div>
          <div><label className="block text-xs font-semibold text-slate-600 mb-1.5">Confirmar</label>
            <input type="password" className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-lime" /></div>
          <button className="inline-flex items-center gap-1.5 px-5 h-9 rounded-full text-xs font-bold bg-brand-navy text-white hover:bg-[#0D1B2A] transition-all">
            <Lock className="w-3.5 h-3.5" /> Alterar Senha
          </button>
        </div>
      </div>
    </div>
  )
}

function SecuritySection() {
  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h4 className="text-sm font-bold text-brand-navy mb-4 flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Autenticação</h4>
        <div className="space-y-4">
          {[
            { label: 'MFA (Autenticação Multifator)', desc: 'Adicione uma camada extra de segurança com TOTP', enabled: false, icon: Shield },
            { label: 'SSO (Single Sign-On)', desc: 'Login com Google, GitHub ou provedor corporativo', enabled: false, icon: Link },
            { label: 'Device Trust', desc: 'Apenas dispositivos aprovados podem acessar', enabled: false, icon: Fingerprint },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center"><item.icon className="w-4 h-4 text-slate-500" /></div>
                <div><p className="text-sm font-semibold text-brand-navy">{item.label}</p><p className="text-xs text-slate-400">{item.desc}</p></div>
              </div>
              <button className={cn('relative w-11 h-6 rounded-full transition-colors', item.enabled ? 'bg-brand-lime' : 'bg-slate-200')}>
                <span className={cn('absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform', item.enabled && 'translate-x-5')} />
              </button>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h4 className="text-sm font-bold text-brand-navy mb-4 flex items-center gap-2"><Key className="w-4 h-4" /> Sessões</h4>
        <p className="text-xs text-slate-400 mb-3">Sessões ativas em seus dispositivos</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
            <div><p className="text-sm font-medium text-brand-navy">Chrome — Windows</p><p className="text-xs text-slate-400">Sessão atual • IP: 192.168.1.1</p></div>
            <span className="text-[10px] text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full">Ativa</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function NotificationsSection() {
  const { settings, updateNotification } = useSystemSettingsStore()
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
      <h4 className="text-sm font-bold text-brand-navy mb-4 flex items-center gap-2"><Bell className="w-4 h-4" /> Notificações</h4>
      <div className="space-y-3">
        {([
          { key: 'email' as const, label: 'Notificações por email', desc: 'Receber notificações no email cadastrado' },
          { key: 'deployComplete' as const, label: 'Deploy concluído', desc: 'Quando um deploy for concluído com sucesso' },
          { key: 'deployFailed' as const, label: 'Falha no deploy', desc: 'Quando um deploy falhar' },
          { key: 'approvalRequested' as const, label: 'Aprovação solicitada', desc: 'Quando alguém solicitar sua aprovação' },
          { key: 'driftDetected' as const, label: 'Drift detectado', desc: 'Divergência entre estado desejado e real' },
        ]).map(({ key, label, desc }) => (
          <div key={key} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
            <div><p className="text-sm font-semibold text-brand-navy">{label}</p><p className="text-xs text-slate-400">{desc}</p></div>
            <button onClick={() => updateNotification(key, !settings.notifications[key])}
              className={cn('relative w-11 h-6 rounded-full transition-colors', settings.notifications[key] ? 'bg-brand-lime' : 'bg-slate-200')}>
              <span className={cn('absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform', settings.notifications[key] && 'translate-x-5')} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function SystemSection() {
  const { settings, updateTheme, updateLanguage } = useSystemSettingsStore()
  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h4 className="text-sm font-bold text-brand-navy mb-4 flex items-center gap-2"><Sun className="w-4 h-4" /> Aparência</h4>
        <div className="flex items-center gap-3">
          {(['light', 'dark', 'system'] as ThemeMode[]).map((mode) => (
            <button key={mode} onClick={() => updateTheme(mode)}
              className={cn('flex items-center gap-2 px-4 h-10 rounded-xl text-xs font-semibold border transition-all',
                settings.theme === mode ? 'bg-brand-navy text-brand-lime border-brand-navy shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300')}>
              {mode === 'light' && <Sun className="w-4 h-4" />}{mode === 'dark' && <Moon className="w-4 h-4" />}{mode === 'system' && <Monitor className="w-4 h-4" />}
              {mode === 'light' ? 'Claro' : mode === 'dark' ? 'Escuro' : 'Sistema'}
            </button>
          ))}
        </div>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h4 className="text-sm font-bold text-brand-navy mb-4 flex items-center gap-2"><Globe className="w-4 h-4" /> Idioma</h4>
        <div className="flex items-center gap-3">
          {(['pt-BR', 'en'] as AppLanguage[]).map((lang) => (
            <button key={lang} onClick={() => updateLanguage(lang)}
              className={cn('flex items-center gap-2 px-4 h-10 rounded-xl text-xs font-semibold border transition-all',
                settings.language === lang ? 'bg-brand-navy text-brand-lime border-brand-navy shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300')}>
              {lang === 'pt-BR' ? '🇧🇷 Português' : '🇺🇸 English'}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function OrganizationSection() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
      <h4 className="text-sm font-bold text-brand-navy mb-4 flex items-center gap-2"><Building2 className="w-4 h-4" /> Organização</h4>
      <div className="space-y-4">
        <div><label className="block text-xs font-semibold text-slate-600 mb-1.5">Nome da Organização</label>
          <input type="text" defaultValue="CloudBuilder" className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-lime" /></div>
        <div><label className="block text-xs font-semibold text-slate-600 mb-1.5">Domínio</label>
          <input type="text" defaultValue="cloudbuilder.io" className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-lime" /></div>
        <button className="inline-flex items-center gap-1.5 px-5 h-9 rounded-full text-xs font-bold bg-brand-navy text-white hover:bg-[#0D1B2A] transition-all">
          <Save className="w-3.5 h-3.5" /> Salvar
        </button>
      </div>
    </div>
  )
}

function APITokensSection() {
  const [tokens, setTokens] = useState<ApiTokenDTO[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [newTokenName, setNewTokenName] = useState('')
  const [createdToken, setCreatedToken] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    setLoading(true)
    settingsApi.listTokens().then(setTokens).catch(() => setTokens([])).finally(() => setLoading(false))
  }, [])

  const handleCreate = async () => {
    if (!newTokenName.trim()) return
    setCreating(true)
    try {
      const result = await settingsApi.createToken(newTokenName.trim())
      setCreatedToken(result.token)
      setTokens((prev) => [{ id: result.id, name: result.name, prefix: result.prefix, scopes: result.scopes, active: true, createdAt: result.createdAt, lastUsedAt: null }, ...prev])
      setNewTokenName('')
      showSuccess('Token criado — guarde ele agora!')
    } catch (err) { showApiError(err, 'Erro ao criar token') } finally { setCreating(false) }
  }

  const handleRevoke = async (id: string) => {
    await settingsApi.revokeToken(id)
    setTokens((prev) => prev.filter((t) => t.id !== id))
    showSuccess('Token revogado')
  }

  return (
    <div className="space-y-4">
      {/* Created Token Alert */}
      {createdToken && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <p className="text-sm font-bold text-green-800">Token criado com sucesso</p>
          </div>
          <p className="text-xs text-green-700 mb-3">Copie e guarde este token. Ele não será exibido novamente.</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 bg-white rounded-lg border border-green-200 text-xs font-mono text-green-800 break-all">{createdToken}</code>
            <button onClick={() => { navigator.clipboard.writeText(createdToken); showSuccess('Copiado!') }}
              className="p-2 rounded-lg bg-green-100 hover:bg-green-200 text-green-700 transition-all">
              <Copy className="w-4 h-4" />
            </button>
          </div>
          <button onClick={() => setCreatedToken(null)} className="mt-2 text-xs text-green-600 hover:text-green-800">Fechar</button>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-sm font-bold text-brand-navy flex items-center gap-2"><Key className="w-4 h-4" /> API Tokens</h4>
            <p className="text-xs text-slate-400 mt-0.5">Tokens para acesso programático à API</p>
          </div>
          <button onClick={() => setShowCreate(!showCreate)}
            className="inline-flex items-center gap-1.5 px-4 h-8 rounded-full text-xs font-bold bg-brand-navy text-white hover:bg-[#0D1B2A] transition-all">
            <Plus className="w-3.5 h-3.5" /> Novo Token
          </button>
        </div>

        {showCreate && (
          <div className="mb-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nome do Token</label>
            <div className="flex gap-2">
              <input type="text" value={newTokenName} onChange={(e) => setNewTokenName(e.target.value)}
                placeholder="Ex: CI/CD Pipeline" className="flex-1 h-9 px-3 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-lime" />
              <button onClick={handleCreate} disabled={creating || !newTokenName.trim()}
                className="px-4 h-9 rounded-full text-xs font-bold bg-brand-navy text-white hover:bg-[#0D1B2A] disabled:opacity-50 transition-all">
                {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Criar'}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
        ) : tokens.length === 0 ? (
          <div className="text-center py-8">
            <Key className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-400">Nenhum token criado</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tokens.map((token) => (
              <div key={token.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center"><Key className="w-4 h-4 text-slate-400" /></div>
                  <div>
                    <p className="text-sm font-semibold text-brand-navy">{token.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{token.prefix}... • {token.scopes}</p>
                  </div>
                  <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-medium',
                    token.active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600')}>
                    {token.active ? 'Ativo' : 'Revogado'}
                  </span>
                </div>
                {token.active && (
                  <button onClick={() => handleRevoke(token.id)}
                    className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function SSHKeysSection() {
  const [keys, setKeys] = useState<SshKeyDTO[]>([])
  const [loading, setLoading] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [keyName, setKeyName] = useState('')
  const [publicKey, setPublicKey] = useState('')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    setLoading(true)
    settingsApi.listSshKeys().then(setKeys).catch(() => setKeys([])).finally(() => setLoading(false))
  }, [])

  const handleAdd = async () => {
    if (!keyName.trim() || !publicKey.trim()) return
    setAdding(true)
    try {
      const result = await settingsApi.addSshKey(keyName.trim(), publicKey.trim())
      setKeys((prev) => [result, ...prev])
      setKeyName(''); setPublicKey(''); setShowAdd(false)
      showSuccess('Chave SSH adicionada')
    } catch (err) { showApiError(err, 'Erro ao adicionar chave') } finally { setAdding(false) }
  }

  const handleDelete = async (id: string) => {
    await settingsApi.deleteSshKey(id)
    setKeys((prev) => prev.filter((k) => k.id !== id))
    showSuccess('Chave removida')
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-bold text-brand-navy flex items-center gap-2"><Fingerprint className="w-4 h-4" /> SSH Keys</h4>
          <p className="text-xs text-slate-400 mt-0.5">Chaves públicas para operações Git e acesso a servidores</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)}
          className="inline-flex items-center gap-1.5 px-4 h-8 rounded-full text-xs font-bold bg-brand-navy text-white hover:bg-[#0D1B2A] transition-all">
          <Plus className="w-3.5 h-3.5" /> Adicionar Chave
        </button>
      </div>

      {showAdd && (
        <div className="mb-4 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nome</label>
            <input type="text" value={keyName} onChange={(e) => setKeyName(e.target.value)}
              placeholder="Ex: MacBook Pro" className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-lime" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Chave Pública</label>
            <textarea value={publicKey} onChange={(e) => setPublicKey(e.target.value)} rows={3}
              placeholder="ssh-rsa AAAA..." className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-brand-lime resize-none" />
          </div>
          <button onClick={handleAdd} disabled={adding || !keyName.trim() || !publicKey.trim()}
            className="px-4 h-9 rounded-full text-xs font-bold bg-brand-navy text-white hover:bg-[#0D1B2A] disabled:opacity-50 transition-all">
            {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Adicionar'}
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
      ) : keys.length === 0 ? (
        <div className="text-center py-8">
          <Fingerprint className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs text-slate-400">Nenhuma chave SSH adicionada</p>
        </div>
      ) : (
        <div className="space-y-2">
          {keys.map((key) => (
            <div key={key.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center"><Fingerprint className="w-4 h-4 text-slate-400" /></div>
                <div>
                  <p className="text-sm font-semibold text-brand-navy">{key.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{key.fingerprint}</p>
                </div>
                <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-medium',
                  key.active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600')}>
                  {key.active ? 'Ativa' : 'Removida'}
                </span>
              </div>
              {key.active && (
                <button onClick={() => handleDelete(key.id)}
                  className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function IntegrationsSection() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
      <h4 className="text-sm font-bold text-brand-navy mb-4 flex items-center gap-2"><Link className="w-4 h-4" /> Integrações</h4>
      <div className="space-y-3">
        {[
          { name: 'GitHub', desc: 'Repositórios e CI/CD', connected: false, icon: GitBranch },
          { name: 'GitLab', desc: 'Repositórios e CI/CD', connected: false, icon: GitBranch },
          { name: 'Slack', desc: 'Notificações', connected: false, icon: Bell },
          { name: 'PagerDuty', desc: 'Incidentes', connected: false, icon: AlertTriangle },
        ].map((item) => (
          <div key={item.name} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center"><item.icon className="w-4 h-4 text-slate-500" /></div>
              <div><p className="text-sm font-semibold text-brand-navy">{item.name}</p><p className="text-xs text-slate-400">{item.desc}</p></div>
            </div>
            <button className={cn('px-4 h-8 rounded-full text-xs font-semibold transition-all',
              item.connected ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}>
              {item.connected ? 'Conectado' : 'Conectar'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function AISettingsSection() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
      <h4 className="text-sm font-bold text-brand-navy mb-4 flex items-center gap-2"><Brain className="w-4 h-4" /> Configurações de IA</h4>
      <div className="space-y-4">
        <div><label className="block text-xs font-semibold text-slate-600 mb-1.5">Provedor LLM</label>
          <select className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm bg-white"><option>OpenAI</option><option>Anthropic</option><option>AWS Bedrock</option></select></div>
        <div><label className="block text-xs font-semibold text-slate-600 mb-1.5">Modelo Padrão</label>
          <select className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm bg-white"><option>GPT-4o</option><option>Claude 3.5 Sonnet</option><option>Gemini Pro</option></select></div>
        <button className="inline-flex items-center gap-1.5 px-5 h-9 rounded-full text-xs font-bold bg-brand-navy text-white hover:bg-[#0D1B2A] transition-all">
          <Save className="w-3.5 h-3.5" /> Salvar
        </button>
      </div>
    </div>
  )
}

// ─── Main Settings Module ────────────────────────────────────────

export function SettingsModule() {
  const { credentials, environments, removeCredential, testCredential, removeEnvironment, deployments } = useCredentialStore()
  const { connectedRepos } = useRepoStore()
  const { hasRole } = usePermission()
  const isAdmin = hasRole('admin')
  const tab = useUiStore((s) => s.settingsTab)
  const setTab = useUiStore((s) => s.setSettingsTab)
  const [showCredForm, setShowCredForm] = useState(false)
  const [editCredId, setEditCredId] = useState<string | null>(null)
  const [testingId, setTestingId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'cred' | 'env'; id: string } | null>(null)

  const visibleSections = useMemo(() => sidebarSections.filter((s) => !s.adminOnly || isAdmin), [isAdmin])

  const getConfiguredCount = () => [credentials.length > 0, environments.length > 0, connectedRepos.length > 0].filter(Boolean).length

  const handleTestConnection = async (id: string) => { setTestingId(id); await testCredential(id); setTestingId(null) }
  const handleDelete = (type: 'cred' | 'env', id: string) => { if (type === 'cred') removeCredential(id); else removeEnvironment(id); setDeleteConfirm(null) }

  // Section title mapping
  const sectionTitle: Record<string, string> = {
    profile: 'Meu Perfil', organization: 'Organização', workspaces: 'Workspaces', teams: 'Times',
    members: 'Usuários', permissions: 'Permissões', credentials: 'Cloud Providers',
    'git-providers': 'Git Providers', integrations: 'Integrações', security: 'Segurança',
    billing: 'Billing', notifications: 'Notificações', audit: 'Auditoria',
    'api-tokens': 'API Tokens', 'ssh-keys': 'SSH Keys', system: 'Preferências', 'ai-settings': 'IA',
  }

  const sectionDescription: Record<string, string> = {
    profile: 'Gerencie suas informações pessoais, senha e preferências',
    organization: 'Configurações da organização, plano e domínio',
    credentials: 'Credenciais de acesso a provedores de nuvem',
    security: 'Autenticação, MFA, SSO e sessões',
    notifications: 'Preferências de notificação',
    system: 'Tema, idioma e preferências do canvas',
    'ai-settings': 'Configurações do assistente de IA',
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Sidebar */}
      <div className="w-56 bg-white border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Configurações</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {visibleSections.map((section) => (
            <button key={section.id} onClick={() => setTab(section.id as SettingsTab)}
              className={cn('w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all',
                tab === section.id ? 'bg-brand-navy text-brand-lime' : 'text-slate-600 hover:bg-slate-50 hover:text-brand-navy')}>
              <section.icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{section.label}</span>
            </button>
          ))}
        </div>
        {/* Setup Progress */}
        {isAdmin && (
          <div className="p-3 border-t border-slate-100">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Setup</span>
              <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                getConfiguredCount() === 3 ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700')}>
                {getConfiguredCount()}/3
              </span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-brand-lime rounded-full transition-all" style={{ width: `${(getConfiguredCount() / 3) * 100}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-7">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-brand-navy">{sectionTitle[tab] || 'Configurações'}</h2>
          <p className="text-xs text-slate-400 mt-0.5">{sectionDescription[tab] || 'Gerencie as configurações da plataforma'}</p>
        </div>

        {tab === 'profile' && <ProfileSection />}
        {tab === 'security' && <SecuritySection />}
        {tab === 'notifications' && <NotificationsSection />}
        {tab === 'system' && <SystemSection />}
        {tab === 'organization' && <OrganizationSection />}
        {tab === 'api-tokens' && <APITokensSection />}
        {tab === 'ssh-keys' && <SSHKeysSection />}
        {tab === 'integrations' && <IntegrationsSection />}
        {tab === 'ai-settings' && <AISettingsSection />}
        {tab === 'credentials' && (
          <div>
            {/* Provider Quick Cards */}
            <div className="mb-6">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Provedores Disponíveis</h4>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'aws' as Provider, label: 'AWS', desc: 'Amazon Web Services', color: 'amber', count: credentials.filter(c => c.provider === 'aws').length },
                  { id: 'azure' as Provider, label: 'Azure', desc: 'Microsoft Azure', color: 'blue', count: credentials.filter(c => c.provider === 'azure').length },
                  { id: 'gcp' as Provider, label: 'GCP', desc: 'Google Cloud Platform', color: 'green', count: credentials.filter(c => c.provider === 'gcp').length },
                ].map((p) => (
                  <button key={p.id} onClick={() => { setEditCredId(null); setShowCredForm(true) }}
                    className={cn('p-4 rounded-xl border-2 text-left transition-all hover:shadow-md',
                      p.count > 0 ? 'border-brand-lime bg-green-50/50' : 'border-slate-200 bg-white hover:border-slate-300')}>
                    <div className="flex items-center justify-between mb-2">
                      <Cloud className={cn('w-6 h-6', p.color === 'amber' ? 'text-amber-500' : p.color === 'blue' ? 'text-blue-500' : 'text-green-500')} />
                      {p.count > 0 ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Plus className="w-4 h-4 text-slate-400" />}
                    </div>
                    <p className="text-sm font-bold text-brand-navy">{p.label}</p>
                    <p className="text-[10px] text-slate-400">{p.desc}</p>
                    {p.count > 0 && <p className="text-[10px] text-green-600 font-medium mt-1">{p.count} credencial(is)</p>}
                  </button>
                ))}
              </div>
            </div>

            {/* Credentials List */}
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Credenciais Configuradas</h4>
              <button onClick={() => { setEditCredId(null); setShowCredForm(true) }}
                className="inline-flex items-center gap-1.5 px-3 h-7 rounded-full text-[10px] font-bold bg-brand-navy text-white hover:bg-[#0D1B2A] transition-all">
                <Plus className="w-3 h-3" /> Adicionar
              </button>
            </div>

            {credentials.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm text-center">
                <Cloud className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-bold text-brand-navy">Nenhuma credencial configurada</p>
                <p className="text-xs text-slate-400 mt-1">Clique em um provedor acima para adicionar</p>
              </div>
            ) : (
              <div className="space-y-2">
                {credentials.map((cred) => (
                  <div key={cred.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center',
                          cred.provider === 'aws' ? 'bg-amber-50' : cred.provider === 'azure' ? 'bg-blue-50' : 'bg-green-50')}>
                          <Cloud className={cn('w-5 h-5', cred.provider === 'aws' ? 'text-amber-500' : cred.provider === 'azure' ? 'text-blue-500' : 'text-green-500')} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-brand-navy">{cred.name}</p>
                            <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full border font-medium', PROVIDER_COLORS[cred.provider])}>{cred.provider.toUpperCase()}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-[10px] text-slate-400 font-mono">{cred.keyId}</p>
                            <span className="text-[10px] text-slate-300">•</span>
                            <p className="text-[10px] text-slate-400">{cred.region}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {cred.status === 'valid' && <span className="text-[10px] text-green-600 flex items-center gap-0.5 font-medium"><CheckCircle2 className="w-3 h-3" />Válida</span>}
                        {cred.status === 'invalid' && <span className="text-[10px] text-red-600 flex items-center gap-0.5 font-medium"><XCircle className="w-3 h-3" />Inválida</span>}
                        {cred.status === 'unknown' && <span className="text-[10px] text-slate-400 font-medium">Não testada</span>}
                        <button onClick={() => handleTestConnection(cred.id)} disabled={testingId === cred.id}
                          className="p-2 rounded-lg text-slate-400 hover:text-brand-navy hover:bg-slate-100 transition-all">
                          {testingId === cred.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={() => { setEditCredId(cred.id); setShowCredForm(true) }}
                          className="p-2 rounded-lg text-slate-400 hover:text-brand-navy hover:bg-slate-100 transition-all"><Shield className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setDeleteConfirm({ type: 'cred', id: cred.id })}
                          className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {tab === 'git-providers' && <RepositorySettings />}
        {tab === 'workspaces' && <MultiTenantSettings />}
        {tab === 'teams' && <MultiTenantSettings />}
        {tab === 'members' && <MultiTenantSettings />}
        {tab === 'permissions' && <MultiTenantSettings />}
        {tab === 'billing' && <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm"><h4 className="text-sm font-bold text-brand-navy mb-2 flex items-center gap-2"><CreditCard className="w-4 h-4" /> Billing</h4><p className="text-xs text-slate-400">Gerencie plano, faturas e métodos de pagamento</p></div>}
        {tab === 'audit' && <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm"><h4 className="text-sm font-bold text-brand-navy mb-2 flex items-center gap-2"><FileText className="w-4 h-4" /> Auditoria</h4><p className="text-xs text-slate-400">Log de todas as ações realizadas na plataforma</p></div>}

        {/* Delete Confirmation */}
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)}>
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm mx-4 p-6" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-sm font-bold text-brand-navy mb-2">Confirmar exclusão</h3>
              <p className="text-xs text-slate-400 mb-4">Esta ação não pode ser desfeita.</p>
              <div className="flex items-center justify-end gap-2">
                <button onClick={() => setDeleteConfirm(null)} className="px-4 h-9 rounded-full text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200">Cancelar</button>
                <button onClick={() => handleDelete(deleteConfirm.type, deleteConfirm.id)}
                  className="px-5 h-9 rounded-full text-xs font-bold bg-red-600 text-white hover:bg-red-700">Excluir</button>
              </div>
            </div>
          </div>
        )}

        <CredentialFormModal open={showCredForm} onClose={() => { setShowCredForm(false); setEditCredId(null) }} editId={editCredId} />
      </div>
    </div>
  )
}
