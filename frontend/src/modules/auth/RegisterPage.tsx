import { useState, FormEvent } from 'react'
import { Cloud, Eye, EyeOff, Loader2, AlertCircle, Check, Mail } from 'lucide-react'
import * as authApi from '@/api/auth'
import { clearTokens } from '@/api/client'

interface RegisterPageProps {
  onSwitchToLogin: () => void
}

export function RegisterPage({ onSwitchToLogin }: RegisterPageProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [orgName, setOrgName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [registered, setRegistered] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setValidationError(null)
    setError(null)

    if (!name.trim() || !email.trim() || !password.trim()) return

    if (password !== confirmPassword) {
      setValidationError('As senhas não coincidem.')
      return
    }

    if (password.length < 6) {
      setValidationError('A senha deve ter pelo menos 6 caracteres.')
      return
    }

    setIsLoading(true)
    try {
      await authApi.register(
        name.trim(),
        email.trim(),
        password,
        orgName.trim() || undefined,
        email.trim().split('@')[0]
      )
      // Clear tokens so the user isn't auto-authenticated — email verification required
      clearTokens()
      setRegistered(true)
    } catch (err: any) {
      setError(err?.message || 'Falha ao registrar. Verifique os dados informados.')
    } finally {
      setIsLoading(false)
    }
  }

  const displayError = validationError || error

  if (registered) {
    return (
      <div className="h-screen w-screen flex bg-slate-50">
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
              Sua conta foi criada com sucesso! Verifique seu email para ativar o acesso.
            </p>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-sm text-center">
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-brand-lime/20 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-brand-navy" />
              </div>
              <h2 className="text-lg font-display font-bold text-brand-navy mb-2">
                Verifique seu email
              </h2>
              <p className="text-sm text-slate-500 leading-relaxed mb-1">
                Enviamos um link de ativação para:
              </p>
              <p className="text-sm font-semibold text-brand-navy mb-4">{email}</p>
              <p className="text-xs text-slate-400 mb-6">
                Clique no link enviado para ativar sua conta. Se não encontrar, verifique a caixa de spam.
              </p>
              <button
                onClick={onSwitchToLogin}
                className="w-full h-11 rounded-xl bg-brand-navy text-white font-bold text-sm hover:bg-brand-navy/90 transition-all"
              >
                Ir para o Login
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
            Crie sua conta e comece a projetar, provisionar e observar sua infraestrutura em nuvem.
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

      {/* Right - Register form */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-sm py-8">
          <div className="text-center mb-8 lg:hidden">
            <div className="w-12 h-12 rounded-xl bg-brand-navy flex items-center justify-center mx-auto mb-4">
              <Cloud className="h-6 w-6 text-brand-lime" />
            </div>
            <h1 className="text-xl font-display font-bold text-brand-navy">CloudBuilder</h1>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-display font-bold text-brand-navy">Criar conta</h2>
              <p className="text-sm text-slate-400 mt-1">Cadastre-se para começar</p>
            </div>

            {displayError && (
              <div className="mb-4 flex items-start gap-2.5 p-3 rounded-lg bg-red-50 border border-red-100 text-sm">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span className="text-red-700">{displayError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                  Nome completo
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy outline-none transition-all placeholder:text-slate-300"
                  required
                  autoFocus
                />
              </div>

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
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                    Senha
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••"
                      className="w-full h-10 px-3.5 pr-10 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy outline-none transition-all placeholder:text-slate-300"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                    Confirmar
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••"
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy outline-none transition-all placeholder:text-slate-300"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                  Organização <span className="font-normal normal-case text-slate-300">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Minha Empresa"
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy outline-none transition-all placeholder:text-slate-300"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()}
                className="w-full h-11 rounded-xl bg-brand-navy text-white font-bold text-sm hover:bg-brand-navy/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Criando conta...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Criar conta
                  </>
                )}
              </button>
            </form>

            <div className="mt-4 text-center">
              <span className="text-xs text-slate-400">
                Já tem uma conta?{' '}
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="text-brand-navy font-semibold hover:underline"
                >
                  Fazer login
                </button>
              </span>
            </div>
          </div>

          <p className="text-center text-xs text-slate-400 mt-4">
            CloudBuilder v1.0 — Platform Engineering Platform
          </p>
        </div>
      </div>
    </div>
  )
}
