import { useEffect, useState, useCallback } from 'react'
import {
  ShieldCheck,
  Code2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Loader2,
  ExternalLink,
  FileCode,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { auditApi } from '@/api/audit'

// ─── Policy definitions ───────────────────────────────────

const OPA_POLICIES = [
  {
    id: 'cost',
    name: 'Custo',
    path: 'compliance/cloudbuilder/cost',
    description: 'Políticas de otimização de custos — limites de gasto, instâncias reservadas, spot',
    icon: FileCode,
    color: 'text-amber-500',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
  },
  {
    id: 'security',
    name: 'Segurança',
    path: 'compliance/cloudbuilder/security',
    description: 'Políticas de segurança — criptografia, IAM, firewalls, VPCs',
    icon: ShieldCheck,
    color: 'text-red-500',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
  },
  {
    id: 'governance',
    name: 'Governança',
    path: 'compliance/cloudbuilder/governance',
    description: 'Políticas de governança — tagging, regiões permitidas, compliance organizacional',
    icon: FileCode,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
  },
  {
    id: 'custom',
    name: 'Customizado',
    path: 'compliance/cloudbuilder/custom',
    description: 'Políticas customizadas — regras específicas do tenant',
    icon: FileCode,
    color: 'text-slate-500',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-200',
  },
]

// ─── OPA Status Badge ─────────────────────────────────────

function OpaStatusBadge() {
  const [status, setStatus] = useState<{ reachable: boolean; checking: boolean }>({
    reachable: false,
    checking: true,
  })

  useEffect(() => {
    let mounted = true
    const check = async () => {
      const result = await auditApi.getOpaStatus()
      if (!mounted) return
      setStatus({
        reachable: result?.reachable ?? false,
        checking: false,
      })
    }
    check()
    const interval = setInterval(check, 30000)
    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  if (status.checking) {
    return (
      <Badge variant="outline" className="gap-1.5 text-slate-400 border-slate-200">
        <Loader2 className="h-3 w-3 animate-spin" />
        Verificando OPA…
      </Badge>
    )
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        'gap-1.5',
        status.reachable
          ? 'text-green-600 border-green-200 bg-green-50'
          : 'text-amber-600 border-amber-200 bg-amber-50'
      )}
    >
      <div className={cn('w-2 h-2 rounded-full', status.reachable ? 'bg-green-500' : 'bg-amber-500')} />
      OPA {status.reachable ? 'Conectado' : 'Fallback Java'}
    </Badge>
  )
}

// ─── Policy Card ──────────────────────────────────────────

function PolicyCard({
  policy,
  expanded,
  onToggle,
}: {
  policy: (typeof OPA_POLICIES)[number]
  expanded: boolean
  onToggle: () => void
}) {
  const Icon = policy.icon

  return (
    <div
      className={cn(
        'rounded-2xl border bg-white transition-all duration-200 card-shadow',
        expanded ? 'ring-2 ring-brand-navy/10' : 'hover:border-slate-200',
        policy.borderColor
      )}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 text-left"
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center',
              policy.bgColor
            )}
          >
            <Icon className={cn('h-5 w-5', policy.color)} />
          </div>
          <div>
            <p className="text-sm font-bold text-brand-navy">{policy.name}</p>
            <p className="text-xs text-slate-400 font-mono mt-0.5">{policy.path}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ExternalLink className="h-3.5 w-3.5 text-slate-300" />
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-3 border-t border-slate-100 pt-4">
          <p className="text-xs text-slate-500 leading-relaxed">{policy.description}</p>
          <div className="rounded-xl bg-slate-900 p-4 overflow-x-auto">
            <pre className="text-xs text-green-400 font-mono leading-relaxed whitespace-pre-wrap">
              {`# ${policy.path}
# Política Rego para CloudBuilder
# Gerenciada pelo OPA sidecar

package ${policy.path.replace(/\//g, '.')}

# Regra: allow
# Retorna true se a política for satisfeita
default allow := false

allow {
    # Avaliação de conformidade
    input.resourceType == "${policy.id === 'custom' ? 'custom' : policy.id}"
    # Lógica específica da política...
    true
}`}
            </pre>
          </div>
          <div className="flex items-center justify-between pt-1">
            <p className="text-[10px] text-slate-400">
              Edite o arquivo <span className="font-mono">{policy.id}.rego</span> no diretório{' '}
              <span className="font-mono">opa/policies/compliance/cloudbuilder/</span>
            </p>
            <Button variant="outline" size="sm" className="text-xs gap-1.5 h-7">
              <Code2 className="h-3 w-3" />
              Abrir Arquivo
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Rego Syntax Reference ────────────────────────────────

const REGO_SYNTAX = [
  { token: 'package', desc: 'Declara o pacote (namespace) da política' },
  { token: 'import', desc: 'Importa dados externos ou pacotes' },
  { token: 'default <var> := <value>', desc: 'Valor padrão para uma regra' },
  { token: '<rule> { <conditions> }', desc: 'Regra Rego — true se todas condições forem satisfeitas' },
  { token: 'input.<field>', desc: 'Acessa campo do input enviado na requisição' },
  { token: 'data.<path>', desc: 'Acessa dados externos carregados no OPA' },
  { token: 'some <var>', desc: 'Declara variável de iteração' },
  { token: 'not <condition>', desc: 'Negação lógica' },
  { token: 'every <var> in <collection> { ... }', desc: 'Iteração com verificação universal' },
]

// ─── Main View ────────────────────────────────────────────

export function RegoPolicyView() {
  const [expanded, setExpanded] = useState<string | null>(null)

  const handleToggle = useCallback((id: string) => {
    setExpanded((prev) => (prev === id ? null : id))
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-brand-navy font-display">Políticas Rego (OPA)</h2>
            <OpaStatusBadge />
          </div>
          <p className="text-sm text-slate-400 mt-0.5">
            Visualização das políticas Policy-as-Code gerenciadas pelo OPA sidecar (ADR-020)
          </p>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-ice-blue/30 border border-ice-blue/50 text-sm text-brand-navy">
        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">Políticas somente leitura</p>
          <p className="text-xs text-slate-500 mt-0.5">
            Os arquivos <span className="font-mono">.rego</span> são carregados do diretório{' '}
            <span className="font-mono">opa/policies/</span> no servidor. Para modificar, edite
            os arquivos Rego diretamente no repositório da plataforma ou use o endpoint{' '}
            <span className="font-mono">POST /api/v1/compliance/rules</span> para criar regras
            de conformidade.
          </p>
        </div>
      </div>

      {/* Policy cards */}
      <div className="grid gap-4">
        {OPA_POLICIES.map((policy) => (
          <PolicyCard
            key={policy.id}
            policy={policy}
            expanded={expanded === policy.id}
            onToggle={() => handleToggle(policy.id)}
          />
        ))}
      </div>

      {/* Rego syntax reference */}
      <div className="bg-white rounded-3xl card-shadow border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-brand-navy" />
            <h3 className="text-xs font-bold tracking-widest text-slate-400 uppercase">
              Referência Rápida — Sintaxe Rego
            </h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="text-left p-3 text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                  Sintaxe
                </th>
                <th className="text-left p-3 text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                  Descrição
                </th>
              </tr>
            </thead>
            <tbody>
              {REGO_SYNTAX.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3">
                    <code className="text-xs font-mono bg-slate-100 text-brand-navy px-1.5 py-0.5 rounded">
                      {item.token}
                    </code>
                  </td>
                  <td className="p-3 text-sm text-slate-500">{item.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* OPA docs link */}
      <div className="flex items-center justify-center py-2">
        <a
          href="https://www.openpolicyagent.org/docs/latest/policy-language/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-brand-navy transition-colors"
        >
          <ExternalLink className="h-3 w-3" />
          Documentação oficial do Rego (OPA)
        </a>
      </div>
    </div>
  )
}
