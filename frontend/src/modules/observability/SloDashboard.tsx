import { useState, useEffect } from "react";
import { Award, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { observabilityApi } from "@/api/observability";
import type { SloDTO } from "@/types/observability.types";

export function SloDashboard() {
  const [slos, setSlos] = useState<SloDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSloStatus();
  }, []);

  const loadSloStatus = async () => {
    setLoading(true);
    try {
      const result = await observabilityApi.listSloDefinitions();
      setSlos(result as any[]);
    } catch {
      setSlos([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "BREACHED":
        return "text-red-600 bg-red-50 border-red-200";
      case "WITHIN":
        return "text-green-600 bg-green-50 border-green-200";
      default:
        return "text-slate-500 bg-slate-50 border-slate-200";
    }
  };

  const getBudgetColor = (pct: number) => {
    if (pct < 50) return "text-red-600";
    if (pct < 80) return "text-amber-600";
    return "text-green-600";
  };

  const getProgressColor = (pct: number) => {
    if (pct < 50) return "bg-red-500";
    if (pct < 80) return "bg-amber-500";
    return "bg-green-500";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Award className="h-5 w-5 text-brand-navy" />
        <h2 className="text-lg font-bold text-brand-navy font-display">
          SLO — Service Level Objectives
        </h2>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-brand-navy" />
        </div>
      ) : slos.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Award className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum SLO configurado</p>
          <p className="text-xs mt-1">
            Configure definições de SLO no backend para começar
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {slos.map((slo) => (
            <div
              key={slo.id}
              className={cn(
                "bg-white rounded-3xl card-shadow border p-6 space-y-4",
                slo.status === "BREACHED"
                  ? "border-red-200"
                  : "border-slate-100",
              )}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-brand-navy font-display">
                  {slo.name}
                </h3>
                <span
                  className={cn(
                    "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border",
                    getStatusColor(slo.status),
                  )}
                >
                  {slo.status === "BREACHED" ? "Violado" : "OK"}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">SLI Atual</span>
                  <span
                    className={cn(
                      "font-mono font-medium",
                      getBudgetColor(slo.currentSliPct),
                    )}
                  >
                    {slo.currentSliPct.toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Target</span>
                  <span className="font-mono text-slate-600">
                    {slo.targetPct}%
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Error Budget</span>
                  <span
                    className={cn(
                      "font-mono font-medium",
                      getBudgetColor(slo.errorBudgetPct),
                    )}
                  >
                    {slo.errorBudgetPct.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    getProgressColor(slo.errorBudgetPct),
                  )}
                  style={{ width: `${Math.min(slo.errorBudgetPct, 100)}%` }}
                />
              </div>

              <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                Tipo: {slo.sliType}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
