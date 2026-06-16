import { useState, FormEvent } from 'react'
import { Cloud, ArrowLeft, Loader2, AlertCircle, Mail, CheckCircle2 } from 'lucide-react'
import { forgotPassword } from '@/api/auth'

interface ForgotPasswordPageProps {
  onSwitchToLogin: () => void
}

export function ForgotPasswordPage({ onSwitchToLogin }: ForgotPasswordPageProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await forgotPassword(email.trim())
      setSent(true)
    } catch (err: any) {
      setError(err?.message || 'Erro ao solicitar redefinição de senha.')
    } finally {
      setLoading(false)
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
            Redefina sua senha para continuar projetando e provisionando infraestrutura em nuvem.
          </p>
        </div>
      </div>

      {/* Right - Forgot password form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8 lg:hidden">
            <div className="w-12 h-12 rounded-xl bg-brand-navy flex items-center justify-center mx-auto mb-4">
              <Cloud className="h-6 w-6 text-brand-lime" />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            {!sent ? (
              <>
                <div className="mb-6">
                  <button
                    onClick={onSwitchToLogin}
                    className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-brand-navy transition-colors mb-4"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Voltar ao login
                  </button>
                  <h2 className="text-lg font-display font-bold text-brand-navy">Redefinir senha</h2>
                  <p className="text-sm text-slate-400 mt-1">
                    Digite seu email e enviaremos instruções para redefinir sua senha.
                  </p>
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

                  <button
                    type="submit"
                    disabled={loading || !email.trim()}
                    className="w-full h-11 rounded-xl bg-brand-navy text-white font-bold text-sm hover:bg-brand-navy/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4" />
                        Enviar instruções
                      </>
                    )}
                  </button>
                </form>
              </>
            ) : (
              <>
                <div className="text-center py-4">
                  <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-4 ring-1 ring-green-200">
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  </div>
                  <h2 className="text-lg font-display font-bold text-brand-navy">Email enviado!</h2>
                  <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                    Se o email <strong className="text-brand-navy">{email}</strong> estiver cadastrado, 
                    você receberá instruções para redefinir sua senha em alguns minutos.
                  </p>
                  <p className="text-xs text-slate-300 mt-3">
                    Não recebeu? Verifique sua caixa de spam ou tente novamente.
                  </p>
                </div>

                <button
                  onClick={onSwitchToLogin}
                  className="w-full h-11 rounded-xl bg-brand-navy text-white font-bold text-sm hover:bg-brand-navy/90 transition-all flex items-center justify-center gap-2 mt-4"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar ao login
                </button>
              </>
            )}
          </div>

          <p className="text-center text-xs text-slate-400 mt-4">
            CloudBuilder v1.0 — Platform Engineering Platform
          </p>
        </div>
      </div>
    </div>
  )
}
