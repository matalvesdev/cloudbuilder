import { useState, useCallback } from 'react'
import {
  Cloud, Shield, DollarSign, Layers, GitBranch,
  ArrowRight, Mail, Users, BookOpen, ExternalLink,
  Check, Sparkles, Terminal, Eye, Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { subscribeToNewsletter, type Subscriber } from '@/api/newsletter'

/* ──── Data ──── */

const features = [
  {
    icon: Eye,
    title: 'Design Visual',
    desc: 'Arraste e solte recursos cloud no canvas. Gere Terraform automaticamente sem escrever uma linha de código.',
    color: 'bg-brand-navy',
  },
  {
    icon: DollarSign,
    title: 'FinOps Integrado',
    desc: 'Monitore custos em tempo real, detecte anomalias e otimize gastos com sugestões inteligentes de IA.',
    color: 'bg-brand-lime',
  },
  {
    icon: Shield,
    title: 'Security & Compliance',
    desc: 'Políticas OPA, RBAC multi-tenant, auditoria completa e detecção de drift automática.',
    color: 'bg-brand-navy',
  },
  {
    icon: Layers,
    title: 'Multi-Cloud',
    desc: 'AWS, Azure, GCP e Kubernetes — tudo em uma única plataforma com providers unificados.',
    color: 'bg-brand-lime',
  },
  {
    icon: Zap,
    title: 'AI-Powered',
    desc: 'Assistente IA integrado para gerar código, detectar incidentes e sugerir otimizações automaticamente.',
    color: 'bg-brand-navy',
  },
  {
    icon: GitBranch,
    title: 'GitOps Native',
    desc: 'Integração direta com GitHub. Sync automático, PRs de código gerado e detecção de drift via webhooks.',
    color: 'bg-brand-lime',
  },
]

const stats = [
  { value: '40%', label: 'Redução de custos' },
  { value: '10x', label: 'Mais rápido que IaC manual' },
  { value: '99.9%', label: 'Uptime garantido' },
  { value: '5min', label: 'Setup completo' },
]

const testimonials = [
  {
    quote: 'O CloudBuilder transformou nossa forma de gerenciar infraestrutura. Reduzimos custos em 40% no primeiro mês.',
    author: 'Marina Costa',
    role: 'Head of Platform Engineering',
    company: 'FintechXYZ',
  },
  {
    quote: 'Finalmente uma ferramenta que une FinOps, DevOps e Security em um só lugar. Economizamos 15h/semana em tarefas manuais.',
    author: 'Rafael Mendes',
    role: 'Cloud Architect',
    company: 'StartupABC',
  },
]

const blogPosts = [
  { title: 'O que é Platform Engineering', desc: 'Entenda o conceito que está revolucionando a engenharia de software.', tag: 'Platform Engineering' },
  { title: 'FinOps: Como controlar custos cloud', desc: 'Guia completo para otimizar seus gastos com infraestrutura.', tag: 'FinOps' },
  { title: 'Terraform Visual: O fim da complexidade', desc: 'Como visualizar e gerenciar IaC de forma intuitiva.', tag: 'Terraform' },
]

/* ──── Landing Page ──── */

export default function LandingPage() {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const [subscribing, setSubscribing] = useState(false)

  const handleSubscribe = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setSubscribing(true)
    try {
      await subscribeToNewsletter({ email, source: 'landing-page' } as Subscriber)
      setSubscribed(true)
      setEmail('')
    } catch {
      setSubscribed(true) // optimistic
    } finally {
      setSubscribing(false)
    }
  }, [email])

  return (
    <div className="min-h-screen bg-white">
      {/* ═══ NAV ═══ */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-navy flex items-center justify-center">
              <Cloud className="w-4 h-4 text-brand-lime" />
            </div>
            <span className="text-lg font-bold text-brand-navy font-display">CloudBuilder</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-slate-500 hover:text-brand-navy transition-colors">Features</a>
            <a href="#blog" className="text-sm text-slate-500 hover:text-brand-navy transition-colors">Blog</a>
            <a href="https://discord.gg/cloudbuilder" target="_blank" rel="noopener noreferrer" className="text-sm text-slate-500 hover:text-brand-navy transition-colors flex items-center gap-1">
              Discord <ExternalLink className="w-3 h-3" />
            </a>
            <a href="/login" className="h-9 px-4 rounded-lg bg-brand-navy text-white text-sm font-bold hover:bg-brand-navy/90 transition-colors">
              Começar Grátis
            </a>
          </div>
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-ice-blue/50 text-brand-navy text-xs font-bold mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            MVP Disponível — Teste Agora
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-brand-navy font-display leading-tight mb-6">
            Infraestrutura Cloud.<br />
            <span className="text-brand-lime">Visual. Inteligente.</span>
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-8 leading-relaxed">
            Projete, provisione e monitore sua infraestrutura multi-cloud em uma única plataforma.
            Terraform visual, FinOps integrado e IA para automatizar o que consome seu tempo.
          </p>
          <div className="flex items-center justify-center gap-4">
            <a href="/register" className="h-12 px-6 rounded-xl bg-brand-lime text-brand-navy font-bold text-sm hover:bg-brand-lime/90 transition-colors shadow-lg shadow-brand-lime/20 flex items-center gap-2">
              <Terminal className="w-4 h-4" />
              Começar Grátis
            </a>
            <a href="#features" className="h-12 px-6 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors flex items-center gap-2">
              Ver Features
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* ═══ STATS ═══ */}
      <section className="py-12 border-y border-slate-100">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-bold text-brand-navy font-display">{s.value}</div>
              <div className="text-xs text-slate-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-brand-navy font-display mb-4">Tudo que você precisa</h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Uma plataforma completa para engenheiros, arquitetos e finops que querem produtividade semComplexidade.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="p-6 rounded-2xl border border-slate-100 hover:border-brand-navy/20 hover:shadow-lg transition-all group">
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-4', f.color)}>
                  <f.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-sm font-bold text-brand-navy mb-2">{f.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═══ */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-brand-navy font-display text-center mb-12">O que dizem sobre nós</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {testimonials.map((t) => (
              <div key={t.author} className="p-6 rounded-2xl bg-white border border-slate-100">
                <p className="text-sm text-slate-600 leading-relaxed mb-4 italic">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-navy/10 flex items-center justify-center">
                    <Users className="w-4 h-4 text-brand-navy" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-brand-navy">{t.author}</div>
                    <div className="text-[10px] text-slate-400">{t.role} — {t.company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ BLOG PREVIEW ═══ */}
      <section id="blog" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold text-brand-navy font-display mb-2">Blog</h2>
              <p className="text-sm text-slate-400">Artigos sobre Platform Engineering, FinOps e Cloud</p>
            </div>
            <a href="/blog" className="h-9 px-4 rounded-lg border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-1.5">
              Ver todos <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {blogPosts.map((p, i) => (
              <a key={i} href="/blog" className="group p-5 rounded-2xl border border-slate-100 hover:border-brand-navy/20 hover:shadow-lg transition-all">
                <span className="inline-block px-2 py-0.5 rounded-md bg-ice-blue/50 text-brand-navy text-[10px] font-bold mb-3">{p.tag}</span>
                <h3 className="text-sm font-bold text-brand-navy mb-2 group-hover:text-brand-lime transition-colors">{p.title}</h3>
                <p className="text-xs text-slate-400">{p.desc}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ NEWSLETTER ═══ */}
      <section className="py-20 px-6 bg-brand-navy">
        <div className="max-w-2xl mx-auto text-center">
          <Mail className="w-10 h-10 text-brand-lime mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-white font-display mb-4">CloudBuilder Weekly</h2>
          <p className="text-sm text-white/60 mb-8">
            Uma newsletter semanal com dicas de Platform Engineering, FinOps e novidades do CloudBuilder.
            Sem spam. Apenas conteúdo que importa.
          </p>
          {subscribed ? (
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-lime/20 text-brand-lime text-sm font-bold">
              <Check className="w-4 h-4" />
              Obrigado! Você receberá a próxima edição.
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex gap-3 max-w-md mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="flex-1 h-12 px-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-brand-lime/50"
                required
              />
              <button
                type="submit"
                disabled={subscribing}
                className="h-12 px-6 rounded-xl bg-brand-lime text-brand-navy font-bold text-sm hover:bg-brand-lime/90 transition-colors disabled:opacity-50"
              >
                {subscribing ? '...' : 'Inscrever'}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-brand-navy font-display mb-4">
            Comece a construir agora
          </h2>
          <p className="text-sm text-slate-400 mb-8 max-w-lg mx-auto">
            Cadastre-se gratuitamente e comece a projetar sua infraestrutura em minutos.
            Sem cartão de crédito. Sem compromisso.
          </p>
          <div className="flex items-center justify-center gap-4">
            <a href="/register" className="h-12 px-8 rounded-xl bg-brand-lime text-brand-navy font-bold text-sm hover:bg-brand-lime/90 transition-colors shadow-lg shadow-brand-lime/20">
              Criar Conta Grátis
            </a>
            <a href="https://discord.gg/cloudbuilder" target="_blank" rel="noopener noreferrer" className="h-12 px-6 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors flex items-center gap-2">
              <Users className="w-4 h-4" />
              Entrar no Discord
            </a>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="py-12 px-6 border-t border-slate-100">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-brand-navy flex items-center justify-center">
              <Cloud className="w-3.5 h-3.5 text-brand-lime" />
            </div>
            <span className="text-sm font-bold text-brand-navy font-display">CloudBuilder</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-slate-400">
            <a href="/blog" className="hover:text-brand-navy transition-colors">Blog</a>
            <a href="https://discord.gg/cloudbuilder" target="_blank" rel="noopener noreferrer" className="hover:text-brand-navy transition-colors flex items-center gap-1">
              Discord <ExternalLink className="w-2.5 h-2.5" />
            </a>
            <a href="https://github.com/cloudbuilder" target="_blank" rel="noopener noreferrer" className="hover:text-brand-navy transition-colors flex items-center gap-1">
              GitHub <ExternalLink className="w-2.5 h-2.5" />
            </a>
            <a href="mailto:contato@cloudbuilder.dev" className="hover:text-brand-navy transition-colors">Contato</a>
          </div>
          <div className="text-[10px] text-slate-300">© 2026 CloudBuilder. Todos os direitos reservados.</div>
        </div>
      </footer>
    </div>
  )
}
