import { useState, FormEvent, useMemo } from 'react'
import { Cloud, Eye, EyeOff, Loader2, AlertCircle, Check, CheckCircle2, XCircle } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

interface RegisterPageProps {
  onSwitchToLogin: () => void
}

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password)) score++
  if (/[a-z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(password)) score++

  if (score <= 2) return { score, label: 'Fraca', color: 'bg-red-500' }
  if (score <= 4) return { score, label: 'Média', color: 'bg-amber-500' }
  return { score, label: 'Forte', color: 'bg-green-500' }
}

function PasswordRequirement({ met, label }: { met: boolean; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      {met ? (
        <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" />
      ) : (
        <XCircle className="w-3 h-3 text-slate-300 shrink-0" />
      )}
      <span className={`text-[10px] ${met ? 'text-green-600' : 'text-slate-400'}`}>{label}</span>
    </div>
  )
}

export function RegisterPage({ onSwitchToLogin }: RegisterPageProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [orgName, setOrgName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const { register, error: authError } = useAuthStore()

  const passwordStrength = useMemo(() => getPasswordStrength(password), [password])

  const passwordChecks = useMemo(() => ({
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(password),
  }), [password])

  const displayError = validationError || authError

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setValidationError(null)

    if (!name.trim() || !email.trim() || !password.trim()) {
      setValidationError('Preencha todos os campos obrigatórios.')
      return
    }

    if (name.trim().length < 2) {
      setValidationError('O nome deve ter pelo menos 2 caracteres.')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setValidationError('Digite um e-mail válido.')
      return
    }

    if (password.length < 8) {
      setValidationError('A senha deve ter pelo menos 8 caracteres.')
      return
    }

    if (!passwordChecks.uppercase || !passwordChecks.lowercase || !passwordChecks.number || !passwordChecks.special) {
      setValidationError('A senha deve conter maiúscula, minúscula, número e caractere especial.')
      return
    }

    if (password !== confirmPassword) {
      setValidationError('As senhas não coincidem.')
      return
    }

    if (!acceptedTerms) {
      setValidationError('Você precisa aceitar os Termos de Uso e a Política de Privacidade.')
      return
    }

    setIsLoading(true)
    try {
      await register(
        name.trim(),
        email.trim(),
        password,
        orgName.trim() || undefined,
        email.trim().split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-')
      )
      // After successful registration, authStore sets isAuthenticated=true
      // The app will redirect to onboarding automatically
    } catch {
      // Error is already set in authStore
    } finally {
      setIsLoading(false)
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
                  Nome completo <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome completo"
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy outline-none transition-all placeholder:text-slate-300"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                  Email <span className="text-red-400">*</span>
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

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                  Senha <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    className="w-full h-10 px-3.5 pr-10 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy outline-none transition-all placeholder:text-slate-300"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password strength bar */}
                {password.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${passwordStrength.color}`}
                          style={{ width: `${(passwordStrength.score / 6) * 100}%` }}
                        />
                      </div>
                      <span className={`text-[10px] font-bold ${
                        passwordStrength.score <= 2 ? 'text-red-500' :
                        passwordStrength.score <= 4 ? 'text-amber-500' : 'text-green-500'
                      }`}>
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                      <PasswordRequirement met={passwordChecks.length} label="8+ caracteres" />
                      <PasswordRequirement met={passwordChecks.uppercase} label="Letra maiúscula" />
                      <PasswordRequirement met={passwordChecks.lowercase} label="Letra minúscula" />
                      <PasswordRequirement met={passwordChecks.number} label="Número" />
                      <PasswordRequirement met={passwordChecks.special} label="Caractere especial" />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                  Confirmar senha <span className="text-red-400">*</span>
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a senha"
                  className={`w-full h-10 px-3.5 rounded-xl border text-sm focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy outline-none transition-all placeholder:text-slate-300 ${
                    confirmPassword && password !== confirmPassword
                      ? 'border-red-300 bg-red-50/50'
                      : confirmPassword && password === confirmPassword
                        ? 'border-green-300 bg-green-50/50'
                        : 'border-slate-200'
                  }`}
                  required
                  minLength={8}
                />
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-[10px] text-red-500 mt-1">As senhas não coincidem</p>
                )}
                {confirmPassword && password === confirmPassword && confirmPassword.length >= 8 && (
                  <p className="text-[10px] text-green-600 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Senhas coincidem
                  </p>
                )}
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

              {/* Terms of Service */}
              <div className="flex items-start gap-2.5 pt-1">
                <input
                  type="checkbox"
                  id="terms"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-slate-300 text-brand-navy focus:ring-brand-navy/20 cursor-pointer"
                />
                <label htmlFor="terms" className="text-xs text-slate-500 leading-relaxed cursor-pointer">
                  Li e aceito os{' '}
                  <span className="text-brand-navy font-semibold hover:underline">Termos de Uso</span>
                  {' '}e a{' '}
                  <span className="text-brand-navy font-semibold hover:underline">Política de Privacidade</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading || !name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim() || !acceptedTerms}
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
