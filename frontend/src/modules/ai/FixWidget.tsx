import { Wrench, FileCheck } from "lucide-react";
import type { Message, Incident, FixSuggestion } from "./aiops.types";

interface FixWidgetProps {
  msg: Message;
  selectedIncident: Incident | null;
  onOpenFixDialog: (
    fix: FixSuggestion,
    incidentId: string,
    incidentTitle: string,
  ) => void;
}

export function FixWidget({
  msg,
  selectedIncident,
  onOpenFixDialog,
}: FixWidgetProps) {
  if (!msg.fixSuggestion || !msg.incidentId) return null;
  const fix = msg.fixSuggestion;
  const incidentTitle = selectedIncident?.title || "Incidente";

  return (
    <div className="mt-4 space-y-3 border border-emerald-200 rounded-xl bg-gradient-to-br from-emerald-50 to-transparent p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
            <Wrench className="w-3 h-3" />
            Correção Disponível
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            {fix.modifications.length} recurso(ns) afetado(s)
          </span>
        </div>
      </div>

      <div className="bg-white rounded-lg p-3 border border-emerald-100">
        <p className="text-xs font-bold text-brand-navy mb-1">
          Correção Sugerida
        </p>
        <p className="text-xs text-slate-600">{fix.description}</p>
      </div>

      {/* Modifications Preview */}
      <div className="space-y-1.5">
        {fix.modifications.map((mod, i) => (
          <div
            key={i}
            className="flex items-start gap-2 text-xs bg-white p-2.5 rounded-lg border border-slate-100"
          >
            <FileCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-brand-navy">{mod.nodeLabel}</p>
              <p className="text-slate-500 mt-0.5">
                <span className="text-red-500 line-through">
                  {String(mod.oldValue)}
                </span>
                <span className="mx-1 text-slate-300">→</span>
                <span className="text-green-600 font-medium">
                  {String(mod.newValue)}
                </span>
                <span className="text-slate-400 ml-1">({mod.property})</span>
              </p>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => onOpenFixDialog(fix, msg.incidentId!, incidentTitle)}
        className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-brand-navy text-white text-xs font-bold hover:bg-brand-navy/90 transition-all shadow-md"
      >
        <Wrench className="w-4 h-4" />
        Aplicar Correção
      </button>
    </div>
  );
}
