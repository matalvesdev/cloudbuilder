import { History, CheckCircle, X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Incident } from "./aiops.types";
import type { FixHistoryEntry } from "@/store/incidentStore";

interface FixHistoryListProps {
  incident: Incident;
  fixHistory: FixHistoryEntry[];
}

export function FixHistoryList({ incident, fixHistory }: FixHistoryListProps) {
  const fixes = fixHistory.filter((f) => f.incidentId === incident.id);
  if (fixes.length === 0) return null;

  return (
    <div className="mt-3 space-y-1.5">
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
        <History className="w-3 h-3" />
        Histórico de Correções ({fixes.length})
      </p>
      {fixes.map((fix) => (
        <div
          key={fix.id}
          className="flex items-start gap-2 p-2 rounded-lg border text-xs"
        >
          <div
            className={cn(
              "w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5",
              fix.result === "success"
                ? "bg-green-50"
                : fix.result === "failed"
                  ? "bg-red-50"
                  : "bg-amber-50",
            )}
          >
            {fix.result === "success" ? (
              <CheckCircle className="w-3 h-3 text-green-600" />
            ) : fix.result === "failed" ? (
              <X className="w-3 h-3 text-red-600" />
            ) : (
              <AlertTriangle className="w-3 h-3 text-amber-600" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold text-brand-navy truncate">
              {fix.fixDescription}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-slate-400">
                {new Date(fix.appliedAt).toLocaleString("pt-BR")}
              </span>
              {fix.autoFix && (
                <span className="text-[9px] px-1 py-0.5 rounded bg-brand-lime/20 text-brand-navy font-medium">
                  Auto-Fix
                </span>
              )}
              {fix.deployedAt ? (
                <span className="text-[9px] px-1 py-0.5 rounded bg-green-50 text-green-700 font-medium">
                  Deployado
                </span>
              ) : (
                <span className="text-[9px] px-1 py-0.5 rounded bg-amber-50 text-amber-700 font-medium">
                  Não deployado
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
