import { useState, useCallback } from 'react'
import {
  LayoutDashboard, Box, Eye, DollarSign, Cpu, BrainCircuit,
  ScrollText, Shield, Settings, Cloud, ArrowRight, ArrowLeft, X, Check,
} from 'lucide-react'
import { useOnboardingStore } from '@/store/onboardingStore'
import { cn } from '@/lib/utils'

interface TourStep {
  icon: typeof LayoutDashboard
  title: string
  description: string
  highlight: string
}

const tourSteps: TourStep[] = [
  {
    icon: LayoutDashboard,
    title: 'Dashboard',
    description: 'Visão geral da sua plataforma: saúde dos recursos, custos, atividades recentes e métricas principais. Seu centro de comando diário.',
    highlight: 'Acompanhe tudo em um só lugar',
  },
  {
    icon: Box,
    title: 'Design',
    description: 'Canvas visual para desenhar sua infraestrutura. Arraste recursos AWS, Azure, GCP e K8s, conecte-os e veja a arquitetura tomar forma.',
    highlight: 'Infraestrutura como diagrama',
  },
  {
    icon: Box,
    title: 'Provisionamento',
    description: 'Gere código Terraform ou OpenTofu automaticamente a partir do seu design. Veja o plano antes de aplicar e detecte drift entre real e desejado.',
    highlight: 'Do visual para o deploy',
  },
  {
    icon: Eye,
    title: 'Observabilidade',
    description: 'Métricas em tempo real, tracing distribuído, logs centralizados, alertas inteligentes e SLOs. Tudo nativo, sem Prometheus ou Grafana.',
    highlight: 'Monitore sem ferramentas externas',
  },
  {
    icon: DollarSign,
    title: 'Custos',
    description: 'Acompanhe gastos por ambiente, serviço e recurso. Receba sugestões de otimização e simule o custo antes de provisionar.',
    highlight: 'FinOps sem surpresas',
  },
  {
    icon: Cpu,
    title: 'Plataforma',
    description: 'Catálogo de templates, marketplace de integrações e políticas de governança. Publique componentes para seu time usar.',
    highlight: 'Self-service para seu time',
  },
  {
    icon: BrainCircuit,
    title: 'AIOps',
    description: 'Assistente IA para diagnosticar incidentes, sugerir correções e automatizar respostas. Integrado com toda a telemetria da plataforma.',
    highlight: 'Resposta inteligente a incidentes',
  },
  {
    icon: Shield,
    title: 'Governança',
    description: 'Auditoria completa de todas as ações, gerenciamento de identidade e acesso (IAM), políticas de compliance e relatórios.',
    highlight: 'Controle e compliance',
  },
]

interface OnboardingTourProps {
  onComplete: () => void
  onSkip: () => void
}

export function OnboardingTour({ onComplete, onSkip }: OnboardingTourProps) {
  const [step, setStep] = useState(0)
  const { markTourCompleted } = useOnboardingStore()

  const totalSteps = tourSteps.length
  const current = tourSteps[step]

  const handleNext = useCallback(() => {
    if (step < totalSteps - 1) {
      setStep((s) => s + 1)
    } else {
      markTourCompleted()
      onComplete()
    }
  }, [step, totalSteps, markTourCompleted, onComplete])

  const handleBack = useCallback(() => {
    if (step > 0) setStep((s) => s - 1)
  }, [step])

  const handleSkip = useCallback(() => {
    onSkip()
  }, [onSkip])

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-50 overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-brand-lime/5 blur-3xl" />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-navy flex items-center justify-center">
            <Cloud className="h-5 w-5 text-brand-lime" />
          </div>
          <span className="text-sm font-bold text-brand-navy">Tour Guiado</span>
        </div>
        <button
          onClick={handleSkip}
          className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-600 hover:bg-white border border-transparent hover:border-slate-200 transition-all"
        >
          <X className="w-3.5 h-3.5" />
          Pular tour
        </button>
      </div>

      {/* Progress bar */}
      <div className="relative z-10 px-6">
        <div className="flex gap-1">
          {tourSteps.map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-1 flex-1 rounded-full transition-all duration-300',
                i <= step ? 'bg-brand-lime' : 'bg-slate-200'
              )}
            />
          ))}
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs font-medium text-slate-400">
            Passo {step + 1} de {totalSteps}
          </span>
          <span className="text-[10px] text-slate-300 font-mono">
            {Math.round(((step + 1) / totalSteps) * 100)}%
          </span>
        </div>
      </div>

      {/* Main content - centered card */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-lg">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8">
            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl bg-brand-navy/5 flex items-center justify-center mb-6">
              <current.icon className="w-8 h-8 text-brand-navy" />
            </div>

            {/* Step content */}
            <div className="animate-in fade-in slide-in-from-right-4 duration-200" key={step}>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-lime/20 text-xs font-bold text-brand-navy mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-navy animate-pulse" />
                {current.highlight}
              </div>
              <h2 className="text-2xl font-display font-bold text-brand-navy mb-2">
                {current.title}
              </h2>
              <p className="text-sm text-slate-500 leading-relaxed">
                {current.description}
              </p>
            </div>

            {/* Demo mock preview */}
            <div className="mt-6 rounded-2xl bg-slate-50 border border-slate-100 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
                  <current.icon className="w-5 h-5 text-brand-navy" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="h-3 w-24 rounded bg-slate-200 animate-pulse" />
                  <div className="h-2 w-32 rounded bg-slate-100 mt-1.5 animate-pulse" />
                </div>
                <div className="w-16 h-6 rounded-lg bg-brand-lime/30 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-brand-navy">NOVO</span>
                </div>
              </div>
            </div>

            {/* Tip */}
            <div className="mt-4 p-3 rounded-xl bg-ice-blue/20 border border-ice-blue/30">
              <p className="text-xs text-slate-500">
                <strong className="text-brand-navy">💡 Dica:</strong>{' '}
                {step === 0 && 'Use o dashboard como ponto de partida para navegar entre todos os módulos.'}
                {step === 1 && 'Você pode importar infraestrutura existente via upload de arquivos .tf ou conectar seu repositório Git.'}
                {step === 2 && 'Sempre veja o preview do plano antes de provisionar — economia de tempo e custo.'}
                {step === 3 && 'Métricas, traces e logs são coletados automaticamente — sem configuração adicional.'}
                {step === 4 && 'Ative alerts de orçamento para nunca ser surpreendido por custos inesperados.'}
                {step === 5 && 'Publique seus templates para que o time todo possa provisionar sem abrir ticket.'}
                {step === 6 && 'O AIOps sugere correções baseadas em incidentes anteriores — quanto mais você usa, mais inteligente fica.'}
                {step === 7 && 'Toda ação na plataforma é auditada — perfeito para certificações SOC2, ISO27001.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation footer */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-white/50 backdrop-blur-sm">
        <button
          onClick={handleBack}
          disabled={step === 0}
          className={cn(
            'inline-flex items-center gap-2 px-4 h-9 rounded-xl text-sm font-medium transition-all',
            step === 0
              ? 'text-slate-300 cursor-not-allowed'
              : 'text-slate-600 hover:text-brand-navy hover:bg-white border border-transparent hover:border-slate-200'
          )}
        >
          <ArrowLeft className="w-4 h-4" />
          Anterior
        </button>

        <button
          onClick={handleNext}
          className="inline-flex items-center gap-2 px-6 h-9 rounded-xl text-sm font-bold bg-brand-navy text-white hover:bg-brand-navy/90 transition-all shadow-sm"
        >
          {step < totalSteps - 1 ? (
            <>
              Próximo
              <ArrowRight className="w-4 h-4" />
            </>
          ) : (
            <>
              Finalizar tour
              <Check className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}
