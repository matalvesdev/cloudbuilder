import { useState, FormEvent } from 'react'
import { Cloud, ArrowLeft, Loader2, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react'
import { resetPassword } from '@/api/auth'

interface ResetPasswordPageProps {
  token: string
  onSwitchToLogin: () => void
}

export function ResetPasswordPage({ token, onSwitchToLogin }: ResetPasswordPageProps) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!password.trim() || !confirmPassword.trim()) return

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const res = await resetPassword(token, password)
      setSuccess(true)
    } catch (err: any) {
      setError(err?.message || 'Erro ao redefinir senha. O token pode ter expirado.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
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
              Sua senha foi redefinida com sucesso!
            </p>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-sm">
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center">
              <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-4 ring-1 ring-green-200">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-lg font-display font-bold text-brand-navy mb-2">Senha redefinida!</h2>
              <p className="text-sm text-slate-400 mb-6">
                Sua senha foi alterada com sucesso. Faça login com sua nova senha.
              </p>
              <button
                onClick={onSwitchToLogin}
                className="w-full h-11 rounded-xl bg-brand-navy text-white font-bold text-sm hover:bg-brand-navy/90 transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Ir para o login
              </button>
            </div>
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
            Escolha uma nova senha para sua conta.
          </p>
        </div>
      </div>

      {/* Right - Reset form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-display font-bold text-brand-navy">Nova senha</h2>
              <p className="text-sm text-slate-400 mt-1">Escolha uma senha segura para sua conta.</p>
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
                  Nova senha
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-10 px-3.5 pr-10 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy outline-none transition-all placeholder:text-slate-300"
                    required
                    minLength={6}
                    autoFocus
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
                  Confirmar senha
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy outline-none transition-all placeholder:text-slate-300"
                  required
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                disabled={loading || !password.trim() || !confirmPassword.trim()}
                className="w-full h-11 rounded-xl bg-brand-navy text-white font-bold text-sm hover:bg-brand-navy/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Redefinindo...
                  </>
                ) : (
                  'Redefinir senha'
                )}
              </button>
            </form>

            <div className="mt-4 text-center">
              <button
                onClick={onSwitchToLogin}
                className="text-xs text-slate-400 hover:text-brand-navy transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5 inline mr-1" />
                Voltar ao login
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
