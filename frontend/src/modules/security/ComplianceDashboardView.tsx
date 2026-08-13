import { useEffect, useState, useCallback } from "react";
import {
  ShieldCheck,
  AlertTriangle,
  Plus,
  Trash2,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Gavel,
  DollarSign,
  Cog,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { useAuditStore } from "@/store/auditStore";
import type { ComplianceEvaluation, ComplianceRule } from "@/types/audit.types";

// ─── Category config ──────────────────────────────────────────

const CATEGORY_CONFIG: Record<
  string,
  { icon: React.ElementType; label: string; color: string }
> = {
  SECURITY: { icon: ShieldCheck, label: "Segurança", color: "text-red-500" },
  COST: { icon: DollarSign, label: "Custo", color: "text-amber-500" },
  OPERATIONS: { icon: Cog, label: "Operações", color: "text-blue-500" },
  GOVERNANCE: {
    icon: Building2,
    label: "Governança",
    color: "text-purple-500",
  },
};

function getCategoryConfig(cat: string) {
  const upper = cat.toUpperCase();
  return (
    CATEGORY_CONFIG[upper] || {
      icon: Gavel,
      label: cat,
      color: "text-slate-500",
    }
  );
}

const SEVERITY_STYLES: Record<string, string> = {
  CRITICAL: "bg-red-50 text-red-700 border-red-200",
  HIGH: "bg-orange-50 text-orange-700 border-orange-200",
  MEDIUM: "bg-amber-50 text-amber-700 border-amber-200",
  LOW: "bg-green-50 text-green-700 border-green-200",
};

const CATEGORY_OPTIONS = ["SECURITY", "COST", "OPERATIONS", "GOVERNANCE"];
const SEVERITY_OPTIONS = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
const RULE_TYPE_OPTIONS = [
  "terraform",
  "opentofu",
  "cloudformation",
  "kubernetes",
  "custom",
];

// ─── Score Circle ─────────────────────────────────────────────

function ScoreCircle({ score }: { score: number }) {
  const color =
    score >= 80
      ? "text-green-500"
      : score >= 60
        ? "text-amber-500"
        : "text-red-500";
  const barColor =
    score >= 80 ? "bg-green-500" : score >= 60 ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-28 h-28">
        {/* Background ring */}
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="#f1f5f9"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 42}`}
            strokeDashoffset={`${2 * Math.PI * 42 * (1 - score / 100)}`}
            className={barColor}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("text-3xl font-bold font-display", color)}>
            {Math.round(score)}%
          </span>
        </div>
      </div>
      <p className="text-sm font-semibold text-brand-navy">Conformidade</p>
    </div>
  );
}

// ─── New Rule Dialog ──────────────────────────────────────────

function NewRuleDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("SECURITY");
  const [severity, setSeverity] = useState("MEDIUM");
  const [ruleType, setRuleType] = useState("terraform");
  const [configJson, setConfigJson] = useState("{}");
  const [saving, setSaving] = useState(false);
  const createRule = useAuditStore((s) => s.createRule);

  const handleSave = useCallback(async () => {
    if (!name.trim()) return;
    setSaving(true);
    const success = await createRule({
      name: name.trim(),
      description: description.trim(),
      category,
      severity,
      ruleType,
      configJson,
      enabled: true,
    });
    setSaving(false);
    if (success) {
      setOpen(false);
      setName("");
      setDescription("");
      setConfigJson("{}");
      onCreated();
    }
  }, [
    name,
    description,
    category,
    severity,
    ruleType,
    configJson,
    createRule,
    onCreated,
  ]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="gap-1.5 bg-brand-navy text-white hover:bg-brand-navy/90"
        >
          <Plus className="h-3.5 w-3.5" />
          Nova Regra
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gavel className="h-5 w-5 text-brand-navy" />
            Nova Regra de Conformidade
          </DialogTitle>
          <DialogDescription>
            Defina uma nova regra para avaliar a conformidade da sua
            infraestrutura.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Nome
            </label>
            <Input
              placeholder="Ex: S3 com criptografia habilitada"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Descrição
            </label>
            <textarea
              placeholder="Descreva o objetivo da regra…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="flex w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition-colors focus:border-brand-navy focus:ring-1 focus:ring-brand-navy/20 resize-none"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Categoria
              </label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Severidade
              </label>
              <Select value={severity} onValueChange={setSeverity}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SEVERITY_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Tipo
              </label>
              <Select value={ruleType} onValueChange={setRuleType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RULE_TYPE_OPTIONS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Config (JSON)
            </label>
            <textarea
              value={configJson}
              onChange={(e) => setConfigJson(e.target.value)}
              rows={4}
              className="flex w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono shadow-sm outline-none transition-colors focus:border-brand-navy focus:ring-1 focus:ring-brand-navy/20 resize-none"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <DialogClose asChild>
            <Button variant="outline" size="sm">
              Cancelar
            </Button>
          </DialogClose>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!name.trim() || saving}
            className="bg-brand-navy text-white hover:bg-brand-navy/90"
          >
            {saving ? "Salvando…" : "Salvar Regra"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Delete Confirmation Dialog ───────────────────────────────

function DeleteRuleDialog({
  rule,
  onDeleted,
}: {
  rule: ComplianceRule;
  onDeleted: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const deleteRule = useAuditStore((s) => s.deleteRule);

  const handleDelete = useCallback(async () => {
    setDeleting(true);
    const success = await deleteRule(rule.id);
    setDeleting(false);
    if (success) {
      setOpen(false);
      onDeleted();
    }
  }, [rule.id, deleteRule, onDeleted]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Excluir Regra
          </DialogTitle>
          <DialogDescription>
            Tem certeza que deseja excluir a regra <strong>{rule.name}</strong>?
            Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 pt-2">
          <DialogClose asChild>
            <Button variant="outline" size="sm">
              Cancelar
            </Button>
          </DialogClose>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={deleting}
            className="gap-1.5"
          >
            {deleting ? "Excluindo…" : "Excluir Regra"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main View ─────────────────────────────────────────────────

export function ComplianceDashboardView() {
  const {
    complianceScore,
    evaluations,
    rules,
    loadingCompliance,
    loadingRules,
    complianceError,
    rulesError,
    fetchCompliance,
    fetchRules,
  } = useAuditStore();

  useEffect(() => {
    fetchCompliance();
    fetchRules();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRefresh = useCallback(() => {
    fetchCompliance();
    fetchRules();
  }, [fetchCompliance, fetchRules]);

  const score = complianceScore?.score ?? 0;
  const totalRules = complianceScore?.totalRules ?? 0;
  const passedRules = complianceScore?.passedRules ?? 0;

  const progressColor =
    score >= 80 ? "bg-green-500" : score >= 60 ? "bg-amber-500" : "bg-red-500";

  // Group evaluations by category
  const evalByCategory = evaluations.reduce<
    Record<string, { total: number; passed: number }>
  >((acc, ev) => {
    const cat = ev.category || "OUTROS";
    if (!acc[cat]) acc[cat] = { total: 0, passed: 0 };
    acc[cat].total++;
    if (ev.passed) acc[cat].passed++;
    return acc;
  }, {});

  // Loading state
  if (loadingCompliance && loadingRules) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-brand-navy" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-brand-navy font-display">
            Painel de Conformidade
          </h2>
          <p className="text-sm text-slate-400">
            Regras, avaliações e score geral de conformidade
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Avaliar Novamente
          </Button>
          <NewRuleDialog onCreated={handleRefresh} />
        </div>
      </div>

      {/* Error banner */}
      {complianceError && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {complianceError}
        </div>
      )}
      {rulesError && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {rulesError}
        </div>
      )}

      {/* Score + Stats row */}
      <div className="grid grid-cols-4 gap-6">
        {/* Score circle */}
        <div className="bg-white rounded-3xl card-shadow border border-slate-100 p-6 flex items-center justify-center">
          <ScoreCircle score={score} />
        </div>

        {/* Summary stats */}
        <div className="bg-white rounded-3xl card-shadow border border-slate-100 p-6 flex flex-col justify-center space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-brand-navy">
                {passedRules}
              </p>
              <p className="text-xs text-slate-400">Regras Aprovadas</p>
            </div>
          </div>
          <Progress
            value={score}
            className="h-2"
            indicatorClassName={progressColor}
          />
        </div>

        <div className="bg-white rounded-3xl card-shadow border border-slate-100 p-6 flex flex-col justify-center space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-brand-navy">
                {totalRules - passedRules}
              </p>
              <p className="text-xs text-slate-400">Regras Reprovadas</p>
            </div>
          </div>
          <Progress
            value={
              totalRules > 0
                ? ((totalRules - passedRules) / totalRules) * 100
                : 0
            }
            className="h-2"
            indicatorClassName="bg-red-500"
          />
        </div>

        <div className="bg-white rounded-3xl card-shadow border border-slate-100 p-6 flex flex-col justify-center space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-ice-blue flex items-center justify-center">
              <Gavel className="h-5 w-5 text-brand-navy" />
            </div>
            <div>
              <p className="text-2xl font-bold text-brand-navy">{totalRules}</p>
              <p className="text-xs text-slate-400">Total de Regras</p>
            </div>
          </div>
          <Progress
            value={100}
            className="h-2"
            indicatorClassName="bg-brand-navy"
          />
        </div>
      </div>

      {/* Category cards */}
      <div className="grid grid-cols-4 gap-4">
        {Object.entries(evalByCategory).map(([cat, data]) => {
          const cfg = getCategoryConfig(cat);
          const Icon = cfg.icon;
          const catScore =
            data.total > 0 ? Math.round((data.passed / data.total) * 100) : 0;
          return (
            <div
              key={cat}
              className="bg-white rounded-2xl card-shadow border border-slate-100 p-5 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={cn("h-4 w-4", cfg.color)} />
                  <span className="text-sm font-bold text-brand-navy">
                    {cfg.label}
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs",
                    catScore >= 80
                      ? "text-green-600 border-green-200"
                      : catScore >= 60
                        ? "text-amber-600 border-amber-200"
                        : "text-red-600 border-red-200",
                  )}
                >
                  {catScore}%
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-green-600 font-medium">
                  {data.passed} aprovadas
                </span>
                <span className="text-slate-300">·</span>
                <span className="text-red-600 font-medium">
                  {data.total - data.passed} falhas
                </span>
              </div>
              <Progress
                value={catScore}
                className="h-1.5"
                indicatorClassName={
                  catScore >= 80
                    ? "bg-green-500"
                    : catScore >= 60
                      ? "bg-amber-500"
                      : "bg-red-500"
                }
              />
            </div>
          );
        })}
      </div>

      {/* Evaluations table */}
      <div className="bg-white rounded-3xl card-shadow border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-brand-navy" />
            <h3 className="text-xs font-bold tracking-widest text-slate-400 uppercase">
              Avaliações
            </h3>
          </div>
        </div>
        {evaluations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ShieldCheck className="w-8 h-8 text-slate-300 mb-3" />
            <p className="text-sm font-medium text-slate-400">
              Nenhuma avaliação disponível
            </p>
            <p className="text-xs text-slate-300 mt-1">
              Clique em "Avaliar Novamente" para executar as regras.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left p-3 text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                    Regra
                  </th>
                  <th className="text-left p-3 text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                    Categoria
                  </th>
                  <th className="text-left p-3 text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                    Severidade
                  </th>
                  <th className="text-left p-3 text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                    Status
                  </th>
                  <th className="text-left p-3 text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                    Mensagem
                  </th>
                  <th className="text-right p-3 text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                    Data
                  </th>
                </tr>
              </thead>
              <tbody>
                {evaluations.map((ev, idx) => {
                  const catCfg = getCategoryConfig(ev.category);
                  const CatIcon = catCfg.icon;
                  return (
                    <tr
                      key={`${ev.ruleId}-${idx}`}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="p-3 text-sm font-medium text-brand-navy">
                        {ev.ruleName}
                      </td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-50 text-slate-600">
                          <CatIcon className="h-3 w-3" />
                          {catCfg.label}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded text-[11px] font-semibold border",
                            SEVERITY_STYLES[ev.severity] ||
                              SEVERITY_STYLES.MEDIUM,
                          )}
                        >
                          {ev.severity}
                        </span>
                      </td>
                      <td className="p-3">
                        {ev.passed ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-600">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Aprovado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600">
                            <XCircle className="h-3.5 w-3.5" />
                            Reprovado
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-sm text-slate-500 max-w-[200px] truncate">
                        {ev.message}
                      </td>
                      <td className="p-3 text-sm text-slate-400 text-right whitespace-nowrap">
                        {new Date(ev.evaluatedAt).toLocaleDateString("pt-BR")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Rules table */}
      <div className="bg-white rounded-3xl card-shadow border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gavel className="w-4 h-4 text-brand-navy" />
            <h3 className="text-xs font-bold tracking-widest text-slate-400 uppercase">
              Regras de Conformidade
            </h3>
          </div>
          {loadingRules && (
            <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
          )}
        </div>
        {rules.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Gavel className="w-8 h-8 text-slate-300 mb-3" />
            <p className="text-sm font-medium text-slate-400">
              Nenhuma regra cadastrada
            </p>
            <p className="text-xs text-slate-300 mt-1">
              Clique em "Nova Regra" para criar a primeira regra.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left p-3 text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                    Nome
                  </th>
                  <th className="text-left p-3 text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                    Categoria
                  </th>
                  <th className="text-left p-3 text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                    Severidade
                  </th>
                  <th className="text-left p-3 text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                    Tipo
                  </th>
                  <th className="text-left p-3 text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                    Ativo
                  </th>
                  <th className="text-right p-3 text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule) => {
                  const catCfg = getCategoryConfig(rule.category);
                  const CatIcon = catCfg.icon;
                  return (
                    <tr
                      key={rule.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="p-3">
                        <p className="text-sm font-medium text-brand-navy">
                          {rule.name}
                        </p>
                        {rule.description && (
                          <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[200px]">
                            {rule.description}
                          </p>
                        )}
                      </td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-50 text-slate-600">
                          <CatIcon className="h-3 w-3" />
                          {catCfg.label}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded text-[11px] font-semibold border",
                            SEVERITY_STYLES[rule.severity] ||
                              SEVERITY_STYLES.MEDIUM,
                          )}
                        >
                          {rule.severity}
                        </span>
                      </td>
                      <td className="p-3 text-sm text-slate-600 font-mono text-xs">
                        {rule.ruleType}
                      </td>
                      <td className="p-3">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 text-[11px] font-semibold",
                            rule.enabled ? "text-green-600" : "text-slate-400",
                          )}
                        >
                          <div
                            className={cn(
                              "w-2 h-2 rounded-full",
                              rule.enabled ? "bg-green-500" : "bg-slate-300",
                            )}
                          />
                          {rule.enabled ? "Sim" : "Não"}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <DeleteRuleDialog
                          rule={rule}
                          onDeleted={handleRefresh}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
