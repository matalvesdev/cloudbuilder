import { useState, FormEvent, useCallback } from 'react'
import { Cloud, Eye, EyeOff, Loader2, AlertCircle, Compass, Github, Globe, Shield, ExternalLink, X, ArrowRight } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useTenantStore } from '@/store/tenantStore'
import { cn } from '@/lib/utils'

interface LoginPageProps {
  onSwitchToRegister?: () => void
  onSwitchToForgotPassword?: () => void
}

export function LoginPage({ onSwitchToRegister, onSwitchToForgotPassword }: LoginPageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [genericSSOpen, setGenericSSOpen] = useState(false)
  const [customProvider, setCustomProvider] = useState('')
  const { login, isLoading, error, user } = useAuthStore()
  const activeProject = useTenantStore((s) => s.getActiveProject())

  const handleGoogleSSO = useCallback(() => {
    const tenantId = user?.tenantId || activeProject?.id || ''
    window.location.href = `/api/v1/auth/oauth2/${encodeURIComponent(tenantId)}/google`
  }, [user, activeProject])

  const handleGitHubSSO = useCallback(() => {
    const tenantId = user?.tenantId || activeProject?.id || ''
    window.location.href = `/api/v1/auth/oauth2/${encodeURIComponent(tenantId)}/github`
  }, [user, activeProject])

  const handleSamlSSO = useCallback(() => {
    const tenantId = user?.tenantId || activeProject?.id || ''
    window.location.href = `/api/v1/auth/oauth2/${encodeURIComponent(tenantId)}/saml`
  }, [user, activeProject])

  const handleGenericSSO = useCallback(() => {
    if (!customProvider.trim()) return
    const tenantId = user?.tenantId || activeProject?.id || ''
    window.location.href = `/api/v1/auth/oauth2/${encodeURIComponent(tenantId)}/${encodeURIComponent(customProvider.trim())}`
  }, [customProvider, user, activeProject])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) return
    try {
      await login(email.trim(), password.trim())
    } catch {
      // error is set in store
    }
  }

  return (
    <div className="h-screen w-screen flex bg-slate-50">
      {/* Left - Brand panel */}
      <div className="hidden lg:flex w-1/2 bg-brand-navy relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-brand-lime blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-ice-blue blur-3xl" />
        </div>
        <div className="relative z-10 text-center max-w-md px-8">
          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-6 ring-1 ring-white/20">
            <Cloud className="h-8 w-8 text-brand-lime" />
          </div>
          <h1 className="text-3xl font-display font-bold text-white mb-3">CloudBuilder</h1>
          <p className="text-base text-slate-300 leading-relaxed">
            Plataforma de engenharia de plataforma — projete, provisione e observe sua infraestrutura em nuvem com design visual.
          </p>
          <div className="mt-8 flex items-center justify-center gap-6 text-sm text-slate-400">
            <span>Design Visual</span>
            <span className="w-1 h-1 rounded-full bg-slate-600" />
            <span>Provisionamento</span>
            <span className="w-1 h-1 rounded-full bg-slate-600" />
            <span>Observabilidade</span>
          </div>
        </div>
      </div>

      {/* Right - Login form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8 lg:hidden">
            <div className="w-12 h-12 rounded-xl bg-brand-navy flex items-center justify-center mx-auto mb-4">
              <Cloud className="h-6 w-6 text-brand-lime" />
            </div>
            <h1 className="text-xl font-display font-bold text-brand-navy">CloudBuilder</h1>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-display font-bold text-brand-navy">Acessar plataforma</h2>
              <p className="text-sm text-slate-400 mt-1">Faça login para continuar</p>
            </div>

            {error && (
              <div className="mb-4 flex items-start gap-2.5 p-3 rounded-lg bg-red-50 border border-red-100 text-sm">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span className="text-red-700">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy outline-none transition-all placeholder:text-slate-300"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                  Senha
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-10 px-3.5 pr-10 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy outline-none transition-all placeholder:text-slate-300"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <button
                    type="button"
                    onClick={onSwitchToForgotPassword}
                    className="text-xs text-slate-400 hover:text-brand-navy transition-colors"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !email.trim() || !password.trim()}
                className="w-full h-11 rounded-xl bg-brand-navy text-white font-bold text-sm hover:bg-brand-navy/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </button>

              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-slate-400 font-medium">Ou continuar com</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleGitHubSSO}
                  className={cn(
                    "flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-medium transition-all",
                    "border border-brand-navy/20 text-brand-navy bg-brand-lime/10 hover:bg-brand-lime/30 hover:border-brand-navy/40"
                  )}
                >
                  <Github className="w-4 h-4" />
                  GitHub
                </button>
                <button
                  type="button"
                  onClick={handleGoogleSSO}
                  className={cn(
                    "flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-medium transition-all",
                    "border border-brand-navy/20 text-brand-navy bg-brand-lime/10 hover:bg-brand-lime/30 hover:border-brand-navy/40"
                  )}
                >
                  <Globe className="w-4 h-4" />
                  Google
                </button>
              </div>
              <button
                type="button"
                onClick={handleSamlSSO}
                className={cn(
                  "w-full flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-medium transition-all",
                  "border border-dashed border-brand-navy/20 text-brand-navy bg-brand-lime/10 hover:bg-brand-lime/30 hover:border-brand-navy/40"
                )}
              >
                <Shield className="w-4 h-4" />
                SSO Corporativo (SAML)
              </button>

              {/* Generic SSO button */}
              <div className="relative">
                {genericSSOpen ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={customProvider}
                      onChange={(e) => setCustomProvider(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleGenericSSO() }}
                      placeholder="Nome do provedor (ex: okta, azure)"
                      className="flex-1 h-10 px-3.5 rounded-xl border border-brand-navy/30 text-sm focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy outline-none transition-all placeholder:text-slate-300"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleGenericSSO}
                      disabled={!customProvider.trim()}
                      className="flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl text-sm font-bold bg-brand-navy text-white hover:bg-brand-navy/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => { setGenericSSOpen(false); setCustomProvider('') }}
                      className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setGenericSSOpen(true)}
                    className={cn(
                      "w-full flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-medium transition-all",
                      "border border-dashed border-brand-navy/20 text-slate-500 bg-transparent hover:bg-slate-50 hover:border-brand-navy/40"
                    )}
                  >
                    <ExternalLink className="w-4 h-4" />
                    Entrar com SSO
                  </button>
                )}
              </div>
            </form>

            <div className="mt-4 text-center">
              <span className="text-xs text-slate-400">
                Não tem uma conta?{' '}
                <button
                  type="button"
                  onClick={onSwitchToRegister}
                  className="text-brand-navy font-semibold hover:underline"
                >
                  Criar conta
                </button>
              </span>
            </div>
          </div>

          {/* Tour highlight - first time hint */}
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => {
                localStorage.setItem('cloudbuilder-tour-seen', 'false')
                alert('Tour guiado será iniciado após o login!')
              }}
              className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-brand-navy transition-colors"
              aria-label="Iniciar tour guiado pela plataforma"
            >
              <Compass className="w-3.5 h-3.5" />
              Primeira vez? Veja um tour rápido
            </button>
          </div>

          <p className="text-center text-xs text-slate-400 mt-4">
            CloudBuilder v1.0 — Platform Engineering Platform
          </p>
        </div>
      </div>
    </div>
  )
}
