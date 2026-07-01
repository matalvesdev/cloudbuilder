import { useState, useCallback } from 'react'
import { Github, X, Loader2, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

interface GitHubConnectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConnected: (token: string) => void
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1'

export function GitHubConnectDialog({ open, onOpenChange, onConnected }: GitHubConnectDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [token, setToken] = useState('')
  const [useToken, setUseToken] = useState(false)

  const handleOAuthConnect = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`${API_BASE}/github/auth`)
      const data = await response.json()
      if (data.authorizeUrl) {
        // Open GitHub OAuth in a popup
        const width = 600
        const height = 800
        const left = window.screenX + (window.innerWidth - width) / 2
        const top = window.screenY + (window.innerHeight - height) / 2
        const popup = window.open(
          data.authorizeUrl,
          'github-oauth',
          `width=${width},height=${height},left=${left},top=${top}`
        )

        // Poll for OAuth completion
        const pollInterval = setInterval(async () => {
          try {
            const statusResp = await fetch(`${API_BASE}/github/repos`, {
              headers: { 'Authorization': `Bearer ${token}` }
            })
            if (statusResp.ok) {
              clearInterval(pollInterval)
              onConnected(token)
              onOpenChange(false)
            }
          } catch { /* wait */ }
        }, 2000)

        // Timeout after 2 minutes
        setTimeout(() => {
          clearInterval(pollInterval)
          popup?.close()
          setError('Tempo limite excedido. Tente novamente.')
          setLoading(false)
        }, 120000)
      } else if (!data.configured) {
        // Fallback to token mode
        setUseToken(true)
        setLoading(false)
      }
    } catch (err: any) {
      setError(err?.message || 'Erro ao conectar com GitHub.')
      setUseToken(true)
    } finally {
      setLoading(false)
    }
  }, [token, onConnected, onOpenChange])

  const handleTokenConnect = useCallback(() => {
    if (!token.trim()) {
      setError('Informe um token de acesso pessoal do GitHub.')
      return
    }
    onConnected(token.trim())
    onOpenChange(false)
  }, [token, onConnected, onOpenChange])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => onOpenChange(false)}>
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center">
              <Github className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-brand-navy font-display">Conectar GitHub</h2>
              <p className="text-xs text-slate-400">Conecte seus repositórios</p>
            </div>
          </div>
          <button onClick={() => onOpenChange(false)} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {!useToken ? (
            <>
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center mx-auto mb-4">
                  <Github className="w-8 h-8 text-white" />
                </div>
                <p className="text-sm text-slate-600 mb-1">
                  Conecte sua conta GitHub para:
                </p>
                <ul className="text-xs text-slate-400 space-y-1 text-left max-w-xs mx-auto">
                  <li>✓ Listar e selecionar repositórios</li>
                  <li>✓ Importar Terraform / config files</li>
                  <li>✓ Analisar stack técnica do projeto</li>
                  <li>✓ Inferir infraestrutura necessária</li>
                </ul>
              </div>

              {error && (
                <div className="flex items-start gap-2 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                onClick={handleOAuthConnect}
                disabled={loading}
                className={cn(
                  'w-full px-4 py-3 text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2',
                  loading ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm'
                )}
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Conectando...</> : <><Github className="w-4 h-4" /> Conectar com GitHub</>}
              </button>

              <button
                onClick={() => setUseToken(true)}
                className="w-full text-xs text-slate-400 hover:text-slate-600 transition-colors"
              >
                Usar token de acesso pessoal
              </button>
            </>
          ) : (
            <>
              <div className="text-center py-2">
                <Github className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-600 mb-1">Token de Acesso Pessoal</p>
                <p className="text-xs text-slate-400">
                  Crie um token em{' '}
                  <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-brand-navy underline inline-flex items-center gap-1">
                    github.com/settings/tokens <ExternalLink className="w-3 h-3" />
                  </a>
                  {' '}com escopo <code className="px-1 py-0.5 bg-slate-100 rounded text-[10px] font-mono">repo</code>
                </p>
              </div>

              <input
                type="password"
                value={token}
                onChange={e => { setToken(e.target.value); setError('') }}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-lime/60 focus:border-brand-navy placeholder:text-slate-300"
              />

              {error && (
                <div className="text-sm text-red-600 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> {error}
                </div>
              )}

              <button
                onClick={handleTokenConnect}
                disabled={!token.trim()}
                className={cn(
                  'w-full px-4 py-3 text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2',
                  !token.trim() ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm'
                )}
              >
                <CheckCircle2 className="w-4 h-4" /> Conectar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
