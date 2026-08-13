import { useState } from "react";
import {
  Plus,
  Minus,
  Pencil,
  Eye,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowRight,
  DiffIcon,
  AlertTriangle,
  Clock,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

/* ─── Types ────────────────────────────────────────────────────────── */

interface PlanResource {
  resourceType: string;
  name: string;
  action: "add" | "change" | "destroy";
  details?: string;
}

interface PlanResult {
  add: number;
  change: number;
  destroy: number;
  resources: PlanResource[];
}

interface Deployment {
  id: string;
  version: string;
  status: "success" | "failed" | "running";
  resourceCount: number;
  duration: string;
  startedAt: string;
  completedAt?: string;
  planSummary?: { add: number; change: number; destroy: number };
}

interface PreviewWorkflowProps {
  planResult: PlanResult | null;
  planning: boolean;
  onPlan: () => void;
  onApply: () => void;
  hasCanvas: boolean;
  hasEnvironment: boolean;
  isDeployed: boolean;
  deployments?: Deployment[];
}

/* ─── Action Icon ──────────────────────────────────────────────────── */

const actionConfig = {
  add: {
    icon: Plus,
    color: "text-green-600",
    bg: "bg-green-50 border-green-200",
    label: "Adicionar",
  },
  change: {
    icon: Pencil,
    color: "text-blue-600",
    bg: "bg-blue-50 border-blue-200",
    label: "Modificar",
  },
  destroy: {
    icon: Minus,
    color: "text-red-600",
    bg: "bg-red-50 border-red-200",
    label: "Destruir",
  },
};

/* ─── Timeline Component ───────────────────────────────────────────── */

function DeploymentTimeline({ deployments }: { deployments: Deployment[] }) {
  if (deployments.length === 0) return null;

  return (
    <div className="mt-4 pt-4 border-t border-slate-100">
      <div className="flex items-center gap-2 mb-3">
        <History className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Histórico de Deployments ({deployments.length})
        </span>
      </div>
      <div className="space-y-2">
        {deployments.slice(0, 10).map((d, idx) => {
          const isLatest = idx === 0;
          return (
            <div key={d.id} className="flex items-start gap-3">
              {/* Timeline node */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-2.5 h-2.5 rounded-full border-2 mt-1.5",
                    d.status === "success"
                      ? "bg-green-500 border-green-300"
                      : d.status === "failed"
                        ? "bg-red-500 border-red-300"
                        : "bg-slate-300 border-slate-200",
                  )}
                />
                {idx < deployments.length - 1 && (
                  <div className="w-px h-full min-h-[24px] bg-slate-200" />
                )}
              </div>
              {/* Content */}
              <div
                className={cn(
                  "flex-1 p-2.5 rounded-xl border text-xs",
                  isLatest
                    ? "bg-slate-50 border-slate-200"
                    : "bg-white border-transparent",
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-brand-navy">
                      {d.version}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold",
                        d.status === "success"
                          ? "bg-green-50 text-green-700"
                          : d.status === "failed"
                            ? "bg-red-50 text-red-700"
                            : "bg-slate-100 text-slate-500",
                      )}
                    >
                      {d.status === "success"
                        ? "Sucesso"
                        : d.status === "failed"
                          ? "Falha"
                          : "Em execução"}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {d.duration}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-slate-400">
                    {d.resourceCount} recursos
                  </span>
                  {d.planSummary && (
                    <span className="flex items-center gap-1 text-[10px] text-slate-400">
                      <Plus className="w-2.5 h-2.5 text-green-500" />
                      {d.planSummary.add}
                      <Pencil className="w-2.5 h-2.5 text-blue-500 ml-1" />
                      {d.planSummary.change}
                      <Minus className="w-2.5 h-2.5 text-red-500 ml-1" />
                      {d.planSummary.destroy}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {new Date(d.startedAt).toLocaleString("pt-BR")}
                </p>
              </div>
            </div>
          );
        })}
        {deployments.length > 10 && (
          <p className="text-[10px] text-slate-400 text-center pt-1">
            + {deployments.length - 10} deployments anteriores
          </p>
        )}
      </div>
    </div>
  );
}

/* ─── Main Component ───────────────────────────────────────────────── */

export function PreviewWorkflow({
  planResult,
  planning,
  onPlan,
  onApply,
  hasCanvas,
  hasEnvironment,
  isDeployed,
  deployments = [],
}: PreviewWorkflowProps) {
  const [showDetails, setShowDetails] = useState(false);

  const totalChanges =
    (planResult?.add || 0) +
    (planResult?.change || 0) +
    (planResult?.destroy || 0);
  const hasBreakdown =
    planResult && planResult.resources && planResult.resources.length > 0;
  const hasChanges = totalChanges > 0;

  if (!hasCanvas || !hasEnvironment) {
    return (
      <div className="bg-white rounded-3xl card-shadow border border-slate-100 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl p-2.5 bg-ice-blue">
            <DiffIcon className="w-5 h-5 text-brand-navy" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-brand-navy">
              Preview do Deploy
            </h3>
            <p className="text-xs text-slate-400">
              Visualize as mudanças antes de aplicar
            </p>
          </div>
        </div>
        {!hasCanvas && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-700">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            Crie um design no módulo Design para gerar o preview
          </div>
        )}
        {!hasEnvironment && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-500">
            <Eye className="w-4 h-4 shrink-0" />
            Selecione um ambiente para ver o preview
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl card-shadow border border-slate-100 p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-xl p-2.5 bg-ice-blue">
          <DiffIcon className="w-5 h-5 text-brand-navy" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-brand-navy">
            Preview do Deploy
          </h3>
          <p className="text-xs text-slate-400">
            Revise as mudanças antes de aplicar
          </p>
        </div>
        {planResult && (
          <div className="flex items-center gap-2">
            {planResult.add > 0 && (
              <Badge
                variant="default"
                className="bg-green-100 text-green-700 hover:bg-green-100 border-0 gap-1"
              >
                <Plus className="w-3 h-3" />
                {planResult.add}
              </Badge>
            )}
            {planResult.change > 0 && (
              <Badge
                variant="default"
                className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-0 gap-1"
              >
                <Pencil className="w-3 h-3" />
                {planResult.change}
              </Badge>
            )}
            {planResult.destroy > 0 && (
              <Badge variant="destructive" className="gap-1">
                <Minus className="w-3 h-3" />
                {planResult.destroy}
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Plan action */}
      {!planResult && (
        <button
          onClick={onPlan}
          disabled={planning}
          className="w-full py-3 px-4 rounded-2xl bg-brand-navy text-sm font-bold text-white hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {planning ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Gerando plano...
            </>
          ) : (
            <>
              <Eye className="w-4 h-4" /> Gerar Preview
            </>
          )}
        </button>
      )}

      {/* Plan result */}
      {planResult && (
        <div className="space-y-3">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-green-50 border border-green-200 p-3 text-center">
              <Plus className="w-4 h-4 text-green-600 mx-auto mb-1" />
              <p className="text-lg font-bold text-green-700">
                {planResult.add}
              </p>
              <p className="text-[10px] text-green-600 font-medium">
                Adicionar
              </p>
            </div>
            <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 text-center">
              <Pencil className="w-4 h-4 text-blue-600 mx-auto mb-1" />
              <p className="text-lg font-bold text-blue-700">
                {planResult.change}
              </p>
              <p className="text-[10px] text-blue-600 font-medium">Modificar</p>
            </div>
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-center">
              <Minus className="w-4 h-4 text-red-600 mx-auto mb-1" />
              <p className="text-lg font-bold text-red-700">
                {planResult.destroy}
              </p>
              <p className="text-[10px] text-red-600 font-medium">Destruir</p>
            </div>
          </div>

          {/* Resources list */}
          {hasBreakdown && (
            <div>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="w-full flex items-center justify-between py-2 text-xs font-semibold text-slate-500 hover:text-brand-navy transition-colors"
              >
                <span>Recursos ({planResult.resources.length})</span>
                <ArrowRight
                  className={cn(
                    "w-3.5 h-3.5 transition-transform",
                    showDetails && "rotate-90",
                  )}
                />
              </button>
              {showDetails && (
                <div className="space-y-1 mt-2 max-h-[200px] overflow-y-auto">
                  {planResult.resources.map((r, i) => {
                    const cfg = actionConfig[r.action];
                    const Icon = cfg.icon;
                    return (
                      <div
                        key={i}
                        className={cn(
                          "flex items-center gap-3 rounded-xl border p-3",
                          cfg.bg,
                        )}
                      >
                        <Icon className={cn("w-4 h-4 shrink-0", cfg.color)} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-brand-navy truncate">
                            {r.name}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {r.resourceType}
                          </p>
                        </div>
                        <span
                          className={cn("text-[10px] font-bold", cfg.color)}
                        >
                          {cfg.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={onPlan}
              disabled={planning}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5"
            >
              <Loader2
                className={cn("w-3.5 h-3.5", planning && "animate-spin")}
              />
              Regenerar
            </button>
            <button
              onClick={onApply}
              disabled={!hasChanges || planning}
              className={cn(
                "flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                hasChanges
                  ? "bg-brand-navy text-white hover:opacity-90"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed",
              )}
            >
              {planResult.destroy > 0 && !isDeployed ? (
                <>
                  <XCircle className="w-3.5 h-3.5" /> Aplicar
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Aplicar Mudanças
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Deployment Timeline */}
      <DeploymentTimeline deployments={deployments} />
    </div>
  );
}
