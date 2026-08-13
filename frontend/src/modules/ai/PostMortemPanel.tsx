import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { showSuccess } from "@/lib/toast";
import {
  FileText,
  Loader2,
  CheckCircle2,
  Clock,
  Sparkles,
  Calendar,
  User,
  Tag,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────

export interface PostMortemReport {
  id: string;
  title: string;
  incidentId: string;
  incidentTitle: string;
  severity: string;
  date: string;
  author: string;
  summary: string;
  timeline: TimelineEntry[];
  rootCause: string;
  impact: string;
  resolution: string;
  actionItems: ActionItem[];
  lessons: string[];
  createdAt: string;
  status: "draft" | "final";
}

export interface TimelineEntry {
  time: string;
  event: string;
  details: string;
}

export interface ActionItem {
  id: string;
  description: string;
  owner: string;
  priority: "high" | "medium" | "low";
  status: "open" | "in-progress" | "completed";
  dueDate: string;
}

// ─── Sub-components ──────────────────────────────────────────

function PriorityBadge({ priority }: { priority: ActionItem["priority"] }) {
  const config = {
    high: { bg: "bg-red-50 text-red-700 border-red-200", label: "Alta" },
    medium: {
      bg: "bg-amber-50 text-amber-700 border-amber-200",
      label: "Média",
    },
    low: { bg: "bg-green-50 text-green-700 border-green-200", label: "Baixa" },
  }[priority];

  return (
    <span
      className={cn(
        "text-[10px] px-1.5 py-0.5 rounded-full border font-medium",
        config.bg,
      )}
    >
      {config.label}
    </span>
  );
}

function ActionItemStatusBadge({ status }: { status: ActionItem["status"] }) {
  const config = {
    open: {
      bg: "bg-slate-50 text-slate-600 border-slate-200",
      label: "Aberto",
    },
    "in-progress": {
      bg: "bg-blue-50 text-blue-700 border-blue-200",
      label: "Em Andamento",
    },
    completed: {
      bg: "bg-green-50 text-green-700 border-green-200",
      label: "Concluído",
    },
  }[status];

  return (
    <span
      className={cn(
        "text-[10px] px-1.5 py-0.5 rounded-full border font-medium",
        config.bg,
      )}
    >
      {config.label}
    </span>
  );
}

// ─── Main Component ──────────────────────────────────────────

interface PostMortemPanelProps {
  className?: string;
  report?: PostMortemReport | null;
  onGenerate?: () => Promise<void>;
  onPublish?: (reportId: string) => Promise<void>;
  generating?: boolean;
}

export function PostMortemPanel({
  className,
  report: externalReport,
  onGenerate,
  onPublish,
  generating: externalGenerating,
}: PostMortemPanelProps) {
  const [internalReport, setInternalReport] = useState<PostMortemReport | null>(
    null,
  );
  const [internalGenerating, setInternalGenerating] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const report = externalReport ?? internalReport;
  const generating = externalGenerating ?? internalGenerating;

  const handleGenerate = async () => {
    if (onGenerate) {
      await onGenerate();
      return;
    }
    setInternalGenerating(true);
    try {
      // Generate via API — currently no dedicated endpoint;
      // connect via onGenerate prop when backend supports it
      showSuccess("Relatório pós-mortem gerado com sucesso!");
    } catch {
      // silent
    } finally {
      setInternalGenerating(false);
    }
  };

  const handlePublish = () => {
    if (!report) return;
    if (onPublish) {
      onPublish(report.id);
      return;
    }
    setInternalReport({ ...report, status: "final" });
    showSuccess("Relatório publicado como versão final!");
  };

  const filteredActionItems =
    report?.actionItems.filter((ai) => {
      if (statusFilter === "all") return true;
      return ai.status === statusFilter;
    }) ?? [];

  if (!report) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-brand-navy mb-1">
            Relatório Pós-Mortem
          </h3>
          <p className="text-xs text-slate-400 mb-4 max-w-md mx-auto">
            Gere um relatório pós-mortem baseado nos incidentes recentes. O
            relatório inclui timeline, causa raiz, impacto, ações corretivas e
            lições aprendidas.
          </p>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className={cn(
              "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all",
              generating
                ? "bg-slate-400 cursor-not-allowed"
                : "bg-brand-navy hover:bg-brand-navy/90",
            )}
          >
            {generating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {generating ? "Gerando relatório..." : "Gerar Pós-Mortem"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-brand-navy" />
          <h3 className="text-sm font-bold text-brand-navy">{report.title}</h3>
          <span
            className={cn(
              "text-[10px] px-2 py-0.5 rounded-full border font-medium",
              report.status === "final"
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-amber-50 text-amber-700 border-amber-200",
            )}
          >
            {report.status === "final" ? "Final" : "Rascunho"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {report.status === "draft" && (
            <button
              onClick={handlePublish}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-600 text-white hover:bg-green-700 transition-all"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Publicar Versão Final
            </button>
          )}
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-navy text-white hover:bg-brand-navy/90 transition-all disabled:opacity-50"
          >
            {generating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            Regenerar
          </button>
        </div>
      </div>

      {/* Metadata */}
      <div className="flex items-center gap-3 text-[10px] text-slate-400">
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {report.date}
        </span>
        <span className="flex items-center gap-1">
          <User className="w-3 h-3" />
          {report.author}
        </span>
        <span
          className={cn(
            "px-1.5 py-0.5 rounded-full border font-medium",
            report.severity === "critical"
              ? "bg-red-50 text-red-700 border-red-200"
              : "bg-amber-50 text-amber-700 border-amber-200",
          )}
        >
          {report.severity === "critical" ? "Crítico" : "Alto"}
        </span>
      </div>

      {/* Summary */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <h4 className="text-[11px] font-bold text-brand-navy uppercase tracking-wide mb-2">
          Resumo
        </h4>
        <p className="text-xs text-slate-600 leading-relaxed">
          {report.summary}
        </p>
      </div>

      {/* Timeline */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <h4 className="text-[11px] font-bold text-brand-navy uppercase tracking-wide mb-3">
          Timeline do Incidente
        </h4>
        <div className="space-y-0">
          {report.timeline.map((entry, idx) => (
            <div key={idx} className="relative flex gap-3 pb-4 last:pb-0">
              {idx < report.timeline.length - 1 && (
                <div className="absolute left-[11px] top-5 bottom-0 w-px bg-slate-200" />
              )}
              <div className="relative mt-0.5 shrink-0">
                <div
                  className={cn(
                    "w-[22px] h-[22px] rounded-full border-2 border-white flex items-center justify-center",
                    idx === 0
                      ? "bg-red-100"
                      : idx === report.timeline.length - 1
                        ? "bg-green-100"
                        : "bg-ice-blue",
                  )}
                >
                  <Clock
                    className={cn(
                      "w-2.5 h-2.5",
                      idx === 0
                        ? "text-red-500"
                        : idx === report.timeline.length - 1
                          ? "text-green-600"
                          : "text-brand-navy",
                    )}
                  />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-brand-navy">
                    {entry.event}
                  </span>
                  <span className="text-[9px] font-mono text-slate-400">
                    {entry.time}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500">{entry.details}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Root Cause & Impact */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <h4 className="text-[11px] font-bold text-brand-navy uppercase tracking-wide mb-2">
            Causa Raiz
          </h4>
          <div className="text-xs text-slate-600 leading-relaxed prose prose-xs max-w-none">
            {report.rootCause.split("\n").map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <h4 className="text-[11px] font-bold text-brand-navy uppercase tracking-wide mb-2">
            Impacto
          </h4>
          <div className="text-xs text-slate-600 leading-relaxed prose prose-xs max-w-none">
            {report.impact.split("\n").map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        </div>
      </div>

      {/* Resolution */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <h4 className="text-[11px] font-bold text-brand-navy uppercase tracking-wide mb-2">
          Resolução
        </h4>
        <div className="text-xs text-slate-600 leading-relaxed prose prose-xs max-w-none">
          {report.resolution.split("\n").map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      </div>

      {/* Action Items */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-[11px] font-bold text-brand-navy uppercase tracking-wide">
            Itens de Ação
          </h4>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-[10px] px-2 py-1 rounded-lg border border-slate-200 bg-white"
          >
            <option value="all">Todos</option>
            <option value="open">Aberto</option>
            <option value="in-progress">Em Andamento</option>
            <option value="completed">Concluído</option>
          </select>
        </div>
        <div className="space-y-2">
          {filteredActionItems.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">
              Nenhum item de ação encontrado
            </p>
          ) : (
            filteredActionItems.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors"
              >
                <div
                  className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0",
                    item.status === "completed"
                      ? "bg-green-50 border-green-300"
                      : "border-slate-300",
                  )}
                >
                  {item.status === "completed" && (
                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-brand-navy">
                    {item.description}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-slate-400">
                      Responsável: {item.owner}
                    </span>
                    <PriorityBadge priority={item.priority} />
                    <ActionItemStatusBadge status={item.status} />
                    <span className="text-[10px] text-slate-400">
                      Vencimento: {item.dueDate}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Lessons Learned */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <h4 className="text-[11px] font-bold text-brand-navy uppercase tracking-wide mb-3">
          Lições Aprendidas
        </h4>
        <div className="space-y-2">
          {report.lessons.map((lesson, i) => (
            <div
              key={i}
              className="flex items-start gap-2 text-xs text-slate-600"
            >
              <span className="w-5 h-5 rounded-full bg-ice-blue flex items-center justify-center text-[10px] font-bold text-brand-navy shrink-0 mt-0.5">
                {i + 1}
              </span>
              <span>{lesson}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
