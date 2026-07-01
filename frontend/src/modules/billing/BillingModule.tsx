import { useState } from 'react'
import {
  CreditCard, Download, Receipt, CheckCircle, Clock, AlertTriangle,
  Loader2, ExternalLink, ArrowUpRight, ArrowDownRight, Plus, Settings,
  FileText, Calendar, DollarSign, TrendingUp, Package,
} from 'lucide-react'
import { showSuccess } from '@/lib/toast'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

// Local types — no backend billing endpoint yet
interface Invoice {
  id: string
  description: string
  amount: number
  currency: string
  status: 'paid' | 'pending' | 'overdue'
  dueDate: string
  paidAt: string | null
  items: { description: string; amount: number }[]
}

interface Plan {
  id: string
  name: string
  price: number
  currency: string
  interval: 'monthly' | 'yearly'
  features: string[]
  current: boolean
}

const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 0,
    currency: 'BRL',
    interval: 'monthly',
    features: ['3 ambientes', '1 usuário', 'Design + Provision', 'Community support'],
    current: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 299,
    currency: 'BRL',
    interval: 'monthly',
    features: ['10 ambientes', '5 usuários', 'Todos os módulos', 'Drift detection', 'Priority support'],
    current: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 999,
    currency: 'BRL',
    interval: 'monthly',
    features: ['Ilimitado', 'Ilimitado', 'Multi-region', 'SSO/SAML', 'SLA 99.9%', 'Dedicated support'],
    current: false,
  },
]

const SEED_INVOICES: Invoice[] = [
  {
    id: 'INV-2026-006',
    description: 'CloudBuilder Pro — Junho 2026',
    amount: 299,
    currency: 'BRL',
    status: 'paid',
    dueDate: '2026-06-10',
    paidAt: '2026-06-08',
    items: [
      { description: 'Plano Pro (mensal)', amount: 299 },
      { description: 'Ambientes extras (0)', amount: 0 },
    ],
  },
  {
    id: 'INV-2026-005',
    description: 'CloudBuilder Pro — Maio 2026',
    amount: 299,
    currency: 'BRL',
    status: 'paid',
    dueDate: '2026-05-10',
    paidAt: '2026-05-09',
    items: [
      { description: 'Plano Pro (mensal)', amount: 299 },
    ],
  },
  {
    id: 'INV-2026-004',
    description: 'CloudBuilder Pro — Abril 2026',
    amount: 299,
    currency: 'BRL',
    status: 'paid',
    dueDate: '2026-04-10',
    paidAt: '2026-04-10',
    items: [
      { description: 'Plano Pro (mensal)', amount: 299 },
    ],
  },
  {
    id: 'INV-2026-007',
    description: 'CloudBuilder Pro — Julho 2026',
    amount: 299,
    currency: 'BRL',
    status: 'pending',
    dueDate: '2026-07-10',
    paidAt: null,
    items: [
      { description: 'Plano Pro (mensal)', amount: 299 },
    ],
  },
]

const fmtCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

export function BillingModule() {
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null)
  const [upgrading, setUpgrading] = useState<string | null>(null)

  const currentPlan = PLANS.find(p => p.current)
  const invoices = SEED_INVOICES
  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0)
  const pendingAmount = invoices.filter(i => i.status === 'pending').reduce((s, i) => s + i.amount, 0)

  const selectedInv = invoices.find(i => i.id === selectedInvoice) || null
  const cellCls = 'px-4 py-3 text-sm'

  // ─── Handlers ──────────────────────────────────────────────

  const handleUpgrade = async (planId: string) => {
    setUpgrading(planId)
    // Simulate API call
    await new Promise(r => setTimeout(r, 1500))
    showSuccess('Plano atualizado com sucesso (simulado)')
    setUpgrading(null)
  }

  const handleDownload = (invoiceId: string) => {
    showSuccess(`Download da fatura ${invoiceId} iniciado`)
  }

  // ─── Detail View ───────────────────────────────────────────

  if (selectedInv) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-brand-navy"
            onClick={() => setSelectedInvoice(null)}
          >
            ← Voltar
          </Button>
        </div>

        <div className="bg-white rounded-2xl card-shadow border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-ice-blue flex items-center justify-center">
                <Receipt className="w-5 h-5 text-brand-navy" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-brand-navy font-display">{selectedInv.id}</h2>
                <p className="text-xs text-slate-400">{selectedInv.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                selectedInv.status === 'paid' ? 'bg-green-50 text-green-700' :
                selectedInv.status === 'pending' ? 'bg-yellow-50 text-yellow-700' :
                'bg-red-50 text-red-700'
              }`}>
                {selectedInv.status === 'paid' ? 'Pago' :
                 selectedInv.status === 'pending' ? 'Pendente' : 'Atrasado'}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl text-xs"
                onClick={() => handleDownload(selectedInv.id)}
              >
                <Download className="w-3.5 h-3.5 mr-1" />
                Download
              </Button>
            </div>
          </div>

          {/* Items */}
          <div className="rounded-xl border border-slate-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className={`${cellCls} text-left text-[11px] font-bold tracking-widest text-slate-400 uppercase`}>Descrição</th>
                  <th className={`${cellCls} text-right text-[11px] font-bold tracking-widest text-slate-400 uppercase`}>Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {selectedInv.items.map((item, i) => (
                  <tr key={i}>
                    <td className={`${cellCls} text-slate-600`}>{item.description}</td>
                    <td className={`${cellCls} text-right font-medium text-brand-navy`}>{fmtCurrency(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-200 bg-slate-50">
                  <td className={`${cellCls} font-bold text-brand-navy`}>Total</td>
                  <td className={`${cellCls} text-right font-bold text-brand-navy text-lg`}>{fmtCurrency(selectedInv.amount)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-1">Vencimento</p>
              <p className="text-sm text-slate-600">{new Date(selectedInv.dueDate).toLocaleDateString('pt-BR')}</p>
            </div>
            {selectedInv.paidAt && (
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-1">Pago em</p>
                <p className="text-sm text-slate-600">{new Date(selectedInv.paidAt).toLocaleDateString('pt-BR')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ─── Main View ─────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy font-display">Billing</h1>
          <p className="text-sm text-slate-400">Gerenciamento de assinatura, faturas e pagamentos</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 card-shadow border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-ice-blue p-3">
              <Package className="h-5 w-5 text-brand-navy" />
            </div>
            <div>
              <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">Plano Atual</p>
              <p className="text-2xl font-bold text-brand-navy">{currentPlan?.name || '-'}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 card-shadow border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-green-50 p-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">Total Pago</p>
              <p className="text-2xl font-bold text-green-600">{fmtCurrency(totalPaid)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 card-shadow border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-yellow-50 p-3">
              <Clock className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">Pendente</p>
              <p className="text-2xl font-bold text-yellow-600">{fmtCurrency(pendingAmount)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 card-shadow border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-ice-blue p-3">
              <Receipt className="h-5 w-5 text-brand-navy" />
            </div>
            <div>
              <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">Faturas</p>
              <p className="text-2xl font-bold text-brand-navy">{invoices.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white border border-slate-200 rounded-xl p-1">
          <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-brand-navy data-[state=active]:text-white">
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="invoices" className="rounded-lg data-[state=active]:bg-brand-navy data-[state=active]:text-white">
            Faturas
          </TabsTrigger>
          <TabsTrigger value="plans" className="rounded-lg data-[state=active]:bg-brand-navy data-[state=active]:text-white">
            Planos
          </TabsTrigger>
        </TabsList>

        {/* ═══ Overview Tab ═══ */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="bg-white rounded-2xl card-shadow border border-slate-100 p-6">
            <h3 className="text-sm font-bold text-brand-navy mb-4">Plano Atual</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-brand-navy">{currentPlan?.name}</p>
                <p className="text-sm text-slate-400 mt-1">
                  {currentPlan ? fmtCurrency(currentPlan.price) : '-'}/{currentPlan?.interval === 'monthly' ? 'mês' : 'ano'}
                </p>
              </div>
              <Button
                variant="outline"
                className="rounded-xl text-xs"
                onClick={() => setActiveTab('plans')}
              >
                <ArrowUpRight className="w-3.5 h-3.5 mr-1" />
                Alterar Plano
              </Button>
            </div>
            {currentPlan && (
              <div className="mt-4 flex flex-wrap gap-2">
                {currentPlan.features.map((f, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-ice-blue/50 text-xs font-medium text-brand-navy border border-ice-blue">
                    <CheckCircle className="w-3 h-3" />
                    {f}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Recent Invoices */}
          <div className="bg-white rounded-2xl card-shadow border border-slate-100 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-brand-navy">Faturas Recentes</h3>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-slate-400 hover:text-brand-navy"
                onClick={() => setActiveTab('invoices')}
              >
                Ver todas
              </Button>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className={`${cellCls} text-left text-[11px] font-bold tracking-widest text-slate-400 uppercase`}>Fatura</th>
                  <th className={`${cellCls} text-left text-[11px] font-bold tracking-widest text-slate-400 uppercase`}>Descrição</th>
                  <th className={`${cellCls} text-left text-[11px] font-bold tracking-widest text-slate-400 uppercase`}>Status</th>
                  <th className={`${cellCls} text-right text-[11px] font-bold tracking-widest text-slate-400 uppercase`}>Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {invoices.slice(0, 3).map(inv => (
                  <tr
                    key={inv.id}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    onClick={() => setSelectedInvoice(inv.id)}
                  >
                    <td className={`${cellCls} font-medium text-brand-navy font-mono text-xs`}>{inv.id}</td>
                    <td className={`${cellCls} text-slate-500`}>{inv.description}</td>
                    <td className={`${cellCls}`}>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        inv.status === 'paid' ? 'bg-green-50 text-green-700' :
                        inv.status === 'pending' ? 'bg-yellow-50 text-yellow-700' :
                        'bg-red-50 text-red-700'
                      }`}>
                        {inv.status === 'paid' ? 'Pago' : inv.status === 'pending' ? 'Pendente' : 'Atrasado'}
                      </span>
                    </td>
                    <td className={`${cellCls} text-right font-medium text-brand-navy`}>{fmtCurrency(inv.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* ═══ Invoices Tab ═══ */}
        <TabsContent value="invoices" className="mt-4">
          <div className="bg-white rounded-2xl card-shadow border border-slate-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className={`${cellCls} text-left text-[11px] font-bold tracking-widest text-slate-400 uppercase`}>Fatura</th>
                  <th className={`${cellCls} text-left text-[11px] font-bold tracking-widest text-slate-400 uppercase`}>Descrição</th>
                  <th className={`${cellCls} text-left text-[11px] font-bold tracking-widest text-slate-400 uppercase`}>Vencimento</th>
                  <th className={`${cellCls} text-left text-[11px] font-bold tracking-widest text-slate-400 uppercase`}>Status</th>
                  <th className={`${cellCls} text-right text-[11px] font-bold tracking-widest text-slate-400 uppercase`}>Valor</th>
                  <th className={`${cellCls} text-right text-[11px] font-bold tracking-widest text-slate-400 uppercase`}>Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {invoices.map(inv => (
                  <tr
                    key={inv.id}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    onClick={() => setSelectedInvoice(inv.id)}
                  >
                    <td className={`${cellCls} font-medium text-brand-navy font-mono text-xs`}>{inv.id}</td>
                    <td className={`${cellCls} text-slate-500`}>{inv.description}</td>
                    <td className={`${cellCls} text-slate-400 text-xs`}>
                      {new Date(inv.dueDate).toLocaleDateString('pt-BR')}
                    </td>
                    <td className={`${cellCls}`}>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        inv.status === 'paid' ? 'bg-green-50 text-green-700' :
                        inv.status === 'pending' ? 'bg-yellow-50 text-yellow-700' :
                        'bg-red-50 text-red-700'
                      }`}>
                        {inv.status === 'paid' ? 'Pago' : inv.status === 'pending' ? 'Pendente' : 'Atrasado'}
                      </span>
                    </td>
                    <td className={`${cellCls} text-right font-medium text-brand-navy`}>{fmtCurrency(inv.amount)}</td>
                    <td className={`${cellCls} text-right`} onClick={e => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-slate-400 hover:text-brand-navy"
                        onClick={() => handleDownload(inv.id)}
                      >
                        <Download className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* ═══ Plans Tab ═══ */}
        <TabsContent value="plans" className="mt-4">
          <div className="grid grid-cols-3 gap-6">
            {PLANS.map(plan => (
              <div
                key={plan.id}
                className={`bg-white rounded-2xl card-shadow border p-6 flex flex-col ${
                  plan.current ? 'border-brand-lime ring-2 ring-brand-lime/20' : 'border-slate-100'
                }`}
              >
                {plan.current && (
                  <span className="self-start inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase bg-brand-lime text-brand-navy mb-3">
                    Plano Atual
                  </span>
                )}
                <h3 className="text-lg font-bold text-brand-navy font-display">{plan.name}</h3>
                <p className="text-3xl font-bold text-brand-navy mt-2">
                  {plan.price === 0 ? 'Grátis' : fmtCurrency(plan.price)}
                </p>
                {plan.price > 0 && (
                  <p className="text-xs text-slate-400">/{plan.interval === 'monthly' ? 'mês' : 'ano'}</p>
                )}
                <ul className="mt-4 space-y-2 flex-1">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-slate-500">
                      <CheckCircle className="w-4 h-4 text-brand-lime flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={plan.current ? 'outline' : 'default'}
                  className={`mt-6 rounded-xl w-full ${
                    plan.current
                      ? 'border-slate-200 text-slate-400'
                      : 'bg-brand-navy text-white hover:bg-brand-navy/90'
                  }`}
                  disabled={plan.current || upgrading === plan.id}
                  onClick={() => handleUpgrade(plan.id)}
                >
                  {upgrading === plan.id ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  {plan.current ? 'Plano Atual' : 'Escolher Plano'}
                </Button>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
