import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { showSuccess } from "@/lib/toast";
import {
  BookOpen,
  Search,
  ChevronDown,
  ChevronRight,
  Play,
  CheckCircle2,
  Loader2,
  Clock,
  User,
  Calendar,
  Tag,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────

export interface RunbookStep {
  id: string;
  title: string;
  command: string;
  description: string;
  expectedResult: string;
  danger: "low" | "medium" | "high";
}

export interface Runbook {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  severity: "critical" | "high" | "medium" | "low";
  steps: RunbookStep[];
  author: string;
  updatedAt: string;
  version: string;
  estimatedDuration: string;
  applicableServices: string[];
}

// ─── Sub-components ──────────────────────────────────────────

function DangerBadge({ level }: { level: RunbookStep["danger"] }) {
  const config = {
    low: { bg: "bg-green-50 text-green-700 border-green-200", label: "Baixo" },
    medium: {
      bg: "bg-amber-50 text-amber-700 border-amber-200",
      label: "Médio",
    },
    high: { bg: "bg-red-50 text-red-700 border-red-200", label: "Alto" },
  }[level];

  return (
    <span
      className={cn(
        "text-[9px] px-1.5 py-0.5 rounded-full border font-medium",
        config.bg,
      )}
    >
      {config.label}
    </span>
  );
}

// ─── Main Component ──────────────────────────────────────────

interface RunbooksPanelProps {
  className?: string;
  runbooks?: Runbook[];
  onApplyRunbook?: (runbookId: string) => Promise<void>;
}

export function RunbooksPanel({
  className,
  runbooks = [],
  onApplyRunbook,
}: RunbooksPanelProps) {
  const [search, setSearch] = useState("");
  const [expandedRunbook, setExpandedRunbook] = useState<string | null>(null);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [applyingRunbook, setApplyingRunbook] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("all");

  const categories = useMemo(() => {
    const cats = new Set(runbooks.map((r) => r.category));
    return ["all", ...Array.from(cats)];
  }, [runbooks]);

  const filteredRunbooks = useMemo(() => {
    return runbooks.filter((r) => {
      const matchesSearch =
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        r.description.toLowerCase().includes(search.toLowerCase()) ||
        r.tags.some((t) => t.includes(search.toLowerCase()));
      const matchesCategory = activeTab === "all" || r.category === activeTab;
      return matchesSearch && matchesCategory;
    });
  }, [runbooks, search, activeTab]);

  const toggleStep = (stepId: string) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(stepId)) next.delete(stepId);
      else next.add(stepId);
      return next;
    });
  };

  const handleApplyRunbook = async (runbookId: string) => {
    if (!onApplyRunbook) return;
    setApplyingRunbook(runbookId);
    try {
      await onApplyRunbook(runbookId);
      showSuccess(`Runbook aplicado com sucesso!`);
    } catch {
      // error handled by caller
    } finally {
      setApplyingRunbook(null);
    }
  };

  if (runbooks.length === 0) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="py-12 text-center">
          <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-400">Nenhum runbook disponível</p>
          <p className="text-xs text-slate-300 mt-1">
            Runbooks serão carregados automaticamente quando disponíveis
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveTab(cat)}
            className={cn(
              "whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border",
              activeTab === cat
                ? "bg-brand-navy text-white border-brand-navy"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50",
            )}
          >
            {cat === "all" ? "Todos" : cat}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar runbooks..."
          className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-lime"
        />
      </div>

      {/* Runbook List */}
      <div className="space-y-3">
        {filteredRunbooks.length === 0 ? (
          <div className="py-12 text-center">
            <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-400">Nenhum runbook encontrado</p>
          </div>
        ) : (
          filteredRunbooks.map((runbook) => {
            const isExpanded = expandedRunbook === runbook.id;
            return (
              <div
                key={runbook.id}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden"
              >
                {/* Header */}
                <button
                  onClick={() =>
                    setExpandedRunbook(isExpanded ? null : runbook.id)
                  }
                  className="w-full flex items-start justify-between p-4 hover:bg-slate-50 transition-colors text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-8 h-8 rounded-lg bg-ice-blue flex items-center justify-center shrink-0">
                        <BookOpen className="w-4 h-4 text-brand-navy" />
                      </div>
                      <p className="text-sm font-bold text-brand-navy">
                        {runbook.title}
                      </p>
                      <span
                        className={cn(
                          "text-[10px] px-1.5 py-0.5 rounded-full border font-medium whitespace-nowrap",
                          runbook.severity === "critical"
                            ? "bg-red-50 text-red-700 border-red-200"
                            : runbook.severity === "high"
                              ? "bg-orange-50 text-orange-700 border-orange-200"
                              : "bg-slate-50 text-slate-600 border-slate-200",
                        )}
                      >
                        {runbook.severity === "critical"
                          ? "Crítico"
                          : runbook.severity === "high"
                            ? "Alto"
                            : "Médio"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2">
                      {runbook.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400">
                      <span className="font-medium text-brand-navy">
                        {runbook.category}
                      </span>
                      <span className="text-slate-300">|</span>
                      <Clock className="w-3 h-3" />
                      <span>{runbook.estimatedDuration}</span>
                      <span className="text-slate-300">|</span>
                      <span>v{runbook.version}</span>
                      <span className="text-slate-300">|</span>
                      <span>{runbook.steps.length} passos</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      {runbook.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full bg-ice-blue/40 text-brand-navy font-medium"
                        >
                          <Tag className="w-2 h-2" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-3 shrink-0">
                    {onApplyRunbook && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApplyRunbook(runbook.id);
                        }}
                        disabled={applyingRunbook === runbook.id}
                        className={cn(
                          "inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                          "bg-brand-navy text-white hover:bg-brand-navy/90",
                          applyingRunbook === runbook.id &&
                            "opacity-50 cursor-not-allowed",
                        )}
                      >
                        {applyingRunbook === runbook.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Play className="w-3 h-3" />
                        )}
                        Aplicar Runbook
                      </button>
                    )}
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Expanded Steps */}
                {isExpanded && (
                  <div className="border-t border-slate-100 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-brand-navy uppercase tracking-wide">
                        Passos do Runbook
                      </span>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400">
                        <User className="w-3 h-3" />
                        <span>{runbook.author}</span>
                        <span className="text-slate-300">|</span>
                        <Calendar className="w-3 h-3" />
                        <span>
                          {new Date(runbook.updatedAt).toLocaleDateString(
                            "pt-BR",
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {runbook.steps.map((step, idx) => {
                        const isStepExpanded = expandedSteps.has(step.id);
                        return (
                          <div
                            key={step.id}
                            className="border border-slate-100 rounded-lg overflow-hidden"
                          >
                            <button
                              onClick={() => toggleStep(step.id)}
                              className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors text-left"
                            >
                              <span className="w-6 h-6 rounded-full bg-ice-blue flex items-center justify-center text-[10px] font-bold text-brand-navy shrink-0">
                                {idx + 1}
                              </span>
                              <span className="flex-1 text-xs font-semibold text-brand-navy">
                                {step.title}
                              </span>
                              <DangerBadge level={step.danger} />
                              {isStepExpanded ? (
                                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                              )}
                            </button>
                            {isStepExpanded && (
                              <div className="px-3 pb-3 space-y-2">
                                <p className="text-xs text-slate-600">
                                  {step.description}
                                </p>
                                <div className="bg-[#0D1B2A] rounded-lg p-3">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                                      Comando
                                    </span>
                                  </div>
                                  <pre className="text-[10px] font-mono text-green-400 whitespace-pre-wrap">
                                    {step.command}
                                  </pre>
                                </div>
                                <div className="flex items-start gap-2 text-xs">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                                  <span className="text-slate-600">
                                    <span className="font-semibold text-brand-navy">
                                      Resultado esperado:
                                    </span>{" "}
                                    {step.expectedResult}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
