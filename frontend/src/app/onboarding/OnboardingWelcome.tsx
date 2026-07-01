import { useState } from 'react'
import { Cloud, Sparkles, ArrowRight, Compass, X, Eye } from 'lucide-react'
import { useOnboardingStore } from '@/store/onboardingStore'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface OnboardingWelcomeProps {
  onStartTour: () => void
  onStartSetup: () => void
  onSkip: () => void
}

const highlights = [
  {
    title: 'Design Visual de Infraestrutura',
    description: 'Arraste e conecte blocos de recursos AWS, Azure, GCP e Kubernetes para desenhar sua arquitetura.',
    color: 'bg-brand-navy',
    icon: '🎨',
  },
  {
    title: 'Provisionamento Automático',
    description: 'Gere código Terraform/OpenTofu pronto para deploy a partir do seu design visual.',
    color: 'bg-brand-lime',
    icon: '⚡',
  },
  {
    title: 'Observabilidade Nativa',
    description: 'Métricas, traces, logs, alertas e SLOs sem ferramentas externas — tudo integrado na plataforma.',
    color: 'bg-ice-blue',
    icon: '👁️',
  },
  {
    title: 'Detecção de Drift',
    description: 'Compare o estado desejado com o real e corrija desvios automaticamente.',
    color: 'bg-amber-500',
    icon: '🔄',
  },
]

export function OnboardingWelcome({ onStartTour, onStartSetup, onSkip }: OnboardingWelcomeProps) {
  const [showDetails, setShowDetails] = useState(false)
  const { markWelcomeSeen } = useOnboardingStore()

  const handleSkip = () => {
    markWelcomeSeen()
    onSkip()
  }

  const handleStartSetup = () => {
    markWelcomeSeen()
    onStartSetup()
  }

  const handleStartTour = () => {
    markWelcomeSeen()
    onStartTour()
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-50 overflow-auto">
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-brand-lime/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-ice-blue/20 blur-3xl" />
      </div>

      {/* Skip button */}
      <div className="relative z-10 flex justify-end p-6">
        <button
          onClick={handleSkip}
          className="inline-flex items-center gap-2 px-4 h-9 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-600 hover:bg-white border border-transparent hover:border-slate-200 transition-all"
        >
          <X className="w-4 h-4" />
          Pular onboarding
        </button>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pb-12">
        {/* Brand */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-brand-navy flex items-center justify-center shadow-lg shadow-brand-navy/20">
            <Cloud className="h-7 w-7 text-brand-lime" />
          </div>
          <span className="font-display font-bold text-2xl text-brand-navy">CloudBuilder</span>
        </div>

        {/* Welcome message */}
        <div className="text-center max-w-lg mb-10">
          <h1 className="text-3xl font-display font-bold text-brand-navy mb-3 leading-tight">
            Bem-vindo à sua{' '}
            <span className="text-brand-lime bg-brand-navy px-2 py-0.5 rounded-lg inline-block">
              Plataforma de Engenharia
            </span>
          </h1>
          <p className="text-base text-slate-500 leading-relaxed">
            Projete, provisione e observe sua infraestrutura em nuvem com design visual.
            Tudo nativo, sem ferramentas externas.
          </p>
        </div>

        {/* Value highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl w-full mb-10">
          {highlights.map((h) => (
            <div
              key={h.title}
              className="flex items-start gap-3 p-4 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all"
            >
              <span className="text-xl mt-0.5">{h.icon}</span>
              <div>
                <h3 className="text-sm font-bold text-brand-navy">{h.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{h.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={handleStartSetup}
            className="inline-flex items-center gap-2.5 px-6 h-12 rounded-2xl bg-brand-navy text-white font-bold text-sm hover:bg-brand-navy/90 transition-all shadow-lg shadow-brand-navy/20 hover:shadow-xl"
          >
            <Sparkles className="w-4 h-4" />
            Configurar minha plataforma
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={handleStartTour}
            className="inline-flex items-center gap-2.5 px-6 h-12 rounded-2xl border-2 border-slate-200 bg-white text-brand-navy font-bold text-sm hover:border-brand-navy/30 hover:bg-slate-50 transition-all"
          >
            <Compass className="w-4 h-4" />
            Fazer tour guiado
          </button>
        </div>

        {/* Skip link */}
        <button
          onClick={handleSkip}
          className="mt-6 text-xs text-slate-400 hover:text-slate-600 transition-colors underline underline-offset-2"
        >
          Ir direto para o dashboard
        </button>

        {/* Collapsible details */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="mt-6 inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors"
        >
          <Eye className="w-3 h-3" />
          {showDetails ? 'Mostrar menos' : 'Ver mais sobre o CloudBuilder'}
        </button>

        {showDetails && (
          <div className="mt-4 max-w-xl text-center animate-in fade-in slide-in-from-top-2 duration-200">
            <p className="text-xs text-slate-400 leading-relaxed">
              CloudBuilder é uma plataforma de engenharia de plataforma (Platform Engineering)
              completa e nativa. Diferente de soluções que dependem de ferramentas externas
              (Grafana, Prometheus, Datadog), tudo é implementado diretamente na plataforma —
              desde o design visual de infraestrutura até observabilidade, custos e AIOps.
              Suporta AWS, Azure, GCP e Kubernetes com geração automática de Terraform e OpenTofu.
            </p>
          </div>
        )}

        {/* Persona hints */}
        <div className="mt-8 pt-8 border-t border-slate-200 max-w-lg w-full">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 text-center mb-3">
            Perfil rápido — quanto tempo você tem?
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { label: '⚡ 2 min (configurar)', action: handleStartSetup },
              { label: '🗺️ 5 min (tour guiado)', action: handleStartTour },
              { label: '🏃 Já conheço (dashboard)', action: handleSkip },
            ].map((opt) => (
              <button
                key={opt.label}
                onClick={opt.action}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-slate-200 text-slate-500 hover:border-brand-navy hover:text-brand-navy transition-all"
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
