import { useState, useEffect } from 'react'
import {
  AlertTriangle,
  Plus,
  Trash2,
  Loader2,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { observabilityApi } from '@/api/observability'
import type { AlertRuleDTO, CreateAlertRuleDTO } from '@/types/observability.types'

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'bg-red-100 text-red-700 border-red-200',
  warning: 'bg-amber-100 text-amber-700 border-amber-200',
  info: 'bg-blue-100 text-blue-700 border-blue-200',
}

const CONDITIONS = [
  { value: 'gt', label: '> (maior que)' },
  { value: 'lt', label: '< (menor que)' },
  { value: 'gte', label: '>= (maior ou igual)' },
  { value: 'lte', label: '<= (menor ou igual)' },
]

export function AlertRulesView() {
  const [rules, setRules] = useState<AlertRuleDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState<CreateAlertRuleDTO>({
    name: '',
    metricName: '',
    condition: 'gt',
    threshold: 0,
    durationSec: 60,
    severity: 'warning',
    enabled: true,
  })

  useEffect(() => { loadRules() }, [])

  const loadRules = async () => {
    setLoading(true)
    try {
      const result = await observabilityApi.getAlertRules()
      setRules(result)
    } catch {
      setRules([])
    } finally {
      setLoading(false)
    }
  }

  const createRule = async () => {
    try {
      await observabilityApi.createAlertRule(form)
      setDialogOpen(false)
      setForm({ name: '', metricName: '', condition: 'gt', threshold: 0, durationSec: 60, severity: 'warning', enabled: true })
      loadRules()
    } catch {}
  }

  const toggleRule = async (rule: AlertRuleDTO) => {
    try {
      await observabilityApi.updateAlertRule(rule.id, {
        name: rule.name,
        metricName: rule.metricName,
        condition: rule.condition,
        threshold: rule.threshold,
        durationSec: rule.durationSec,
        severity: rule.severity,
        enabled: !rule.enabled,
        description: rule.description || undefined,
        notifyChannels: rule.notifyChannels || undefined,
      })
      loadRules()
    } catch {}
  }

  const deleteRule = async (id: string) => {
    try {
      await observabilityApi.deleteAlertRule(id)
      loadRules()
    } catch {}
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-brand-navy" />
          <h2 className="text-lg font-bold text-brand-navy font-display">Regras de Alerta</h2>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-brand-navy text-white">
              <Plus className="h-4 w-4 mr-1" />
              Nova Regra
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Regra de Alerta</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-500">Nome</label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">Métrica</label>
                <Input value={form.metricName} onChange={(e) => setForm({ ...form, metricName: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-500">Condição</label>
                  <Select value={form.condition} onValueChange={(v) => setForm({ ...form, condition: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CONDITIONS.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500">Limiar</label>
                  <Input type="number" value={form.threshold} onChange={(e) => setForm({ ...form, threshold: Number(e.target.value) })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-500">Duração (s)</label>
                  <Input type="number" value={form.durationSec} onChange={(e) => setForm({ ...form, durationSec: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500">Severidade</label>
                  <Select value={form.severity} onValueChange={(v) => setForm({ ...form, severity: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={createRule} className="w-full bg-brand-navy text-white">
                Criar Regra
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-brand-navy" />
        </div>
      ) : rules.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Nenhuma regra de alerta configurada</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 card-shadow divide-y divide-slate-100">
          {rules.map((rule) => (
            <div key={rule.id} className="flex items-center gap-4 p-4">
              <button onClick={() => toggleRule(rule)} className="text-slate-400 hover:text-brand-navy">
                {rule.enabled ? <ToggleRight className="h-5 w-5 text-green-500" /> : <ToggleLeft className="h-5 w-5" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-brand-navy">{rule.name}</p>
                <p className="text-xs text-slate-400">
                  {rule.metricName} {rule.condition} {rule.threshold} por {rule.durationSec}s
                </p>
              </div>
              <Badge variant="outline" className={cn('text-xs', SEVERITY_COLORS[rule.severity] || SEVERITY_COLORS.info)}>
                {rule.severity}
              </Badge>
              <button onClick={() => deleteRule(rule.id)} className="text-slate-400 hover:text-red-500">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
