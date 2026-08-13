import {
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ProtectedAction } from "@/components/ProtectedContent";
import { ENVIRONMENT_TYPE_LABELS } from "@/types/settings.types";

interface PlanResult {
  add: number;
  change: number;
  destroy: number;
  resources: Array<{
    resourceType: string;
    name: string;
    action: "add" | "change" | "destroy";
  }>;
}

interface EnvironmentInfo {
  id: string;
  name: string;
  type: string;
  provider: string;
  region: string;
}

interface DeployModalProps {
  open: boolean;
  deployStep: "idle" | "plan" | "review" | "applying" | "done" | "error";
  planResult: PlanResult | null;
  deploying: boolean;
  selectedEnvironment: EnvironmentInfo | null;
  canvasName: string;
  resourceCount: number;
  onClose: () => void;
  onDeploy: () => void;
}

export function DeployModal({
  open,
  deployStep,
  planResult,
  deploying,
  selectedEnvironment,
  canvasName,
  resourceCount,
  onClose,
  onDeploy,
}: DeployModalProps) {
  if (!open || !selectedEnvironment) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg mx-4 animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-lg font-bold text-brand-navy font-display">
              {deployStep === "plan"
                ? "Gerando Plano..."
                : deployStep === "review"
                  ? "Revisão do Plano"
                  : deployStep === "applying"
                    ? "Aplicando Deploy"
                    : deployStep === "done"
                      ? "Deploy Concluído"
                      : deployStep === "error"
                        ? "Erro no Deploy"
                        : "Confirmar Deploy"}
            </h2>
            {deployStep === "done" && (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            )}
            {deployStep === "error" && (
              <XCircle className="w-5 h-5 text-red-500" />
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {deployStep === "plan"
              ? "Analisando recursos e detectando mudanças..."
              : deployStep === "review"
                ? "Revise as mudanças antes de aplicar no ambiente"
                : deployStep === "applying"
                  ? `Provisionando ${resourceCount} recursos na nuvem`
                  : deployStep === "done"
                    ? `${resourceCount} recursos provisionados com sucesso`
                    : deployStep === "error"
                      ? "Ocorreu um erro durante o deploy"
                      : "Ambiente: " + selectedEnvironment.name}
          </p>
        </div>

        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Environment info */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Ambiente</span>
              <span className="font-semibold text-brand-navy">
                {selectedEnvironment.name}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Tipo</span>
              <span className="font-semibold text-brand-navy">
                {
                  ENVIRONMENT_TYPE_LABELS[
                    selectedEnvironment.type as keyof typeof ENVIRONMENT_TYPE_LABELS
                  ]
                }
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Provedor</span>
              <span className="font-semibold text-brand-navy uppercase">
                {selectedEnvironment.provider}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Região</span>
              <span className="font-semibold text-brand-navy">
                {selectedEnvironment.region}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Design</span>
              <span className="font-semibold text-brand-navy truncate ml-4">
                {canvasName}
              </span>
            </div>
          </div>

          {/* Step: Plan in progress */}
          {deployStep === "plan" && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200">
              <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
              <div>
                <p className="text-sm font-semibold text-blue-700">
                  Analisando infraestrutura...
                </p>
                <p className="text-xs text-blue-500">
                  Comparando design com estado atual dos recursos
                </p>
              </div>
            </div>
          )}

          {/* Step: Plan Review */}
          {deployStep === "review" && planResult && (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div
                  className={cn(
                    "rounded-xl p-3 text-center border",
                    planResult.add > 0
                      ? "bg-green-50 border-green-200"
                      : "bg-slate-50 border-slate-200",
                  )}
                >
                  <span className="text-green-600 font-bold text-[22px] leading-none">
                    {planResult.add}
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">criar</p>
                </div>
                <div
                  className={cn(
                    "rounded-xl p-3 text-center border",
                    planResult.change > 0
                      ? "bg-amber-50 border-amber-200"
                      : "bg-slate-50 border-slate-200",
                  )}
                >
                  <span className="text-amber-600 font-bold text-[22px] leading-none">
                    {planResult.change}
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">alterar</p>
                </div>
                <div
                  className={cn(
                    "rounded-xl p-3 text-center border",
                    planResult.destroy > 0
                      ? "bg-red-50 border-red-200"
                      : "bg-slate-50 border-slate-200",
                  )}
                >
                  <span className="text-red-600 font-bold text-[22px] leading-none">
                    {planResult.destroy}
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">destruir</p>
                </div>
              </div>

              {planResult.resources.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-xl">
                  <div className="px-4 py-2.5 border-b border-slate-100">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                      Recursos ({planResult.resources.length})
                    </span>
                  </div>
                  <div className="divide-y divide-slate-100 max-h-[200px] overflow-y-auto">
                    {planResult.resources.map((r, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 px-4 py-2"
                      >
                        <span
                          className={cn(
                            "inline-flex items-center justify-center w-5 h-5 rounded text-[9px] font-bold text-white",
                            r.action === "add"
                              ? "bg-green-500"
                              : r.action === "change"
                                ? "bg-amber-500"
                                : "bg-red-500",
                          )}
                        >
                          {r.action === "add"
                            ? "+"
                            : r.action === "change"
                              ? "~"
                              : "−"}
                        </span>
                        <span className="text-xs text-slate-600">
                          {r.resourceType}
                        </span>
                        <span className="text-[11px] text-slate-400 truncate">
                          {r.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {planResult.destroy > 0 && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
                  <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-700">
                      Atenção: recursos serão destruídos
                    </p>
                    <p className="text-xs text-red-500">
                      {planResult.destroy}{" "}
                      {planResult.destroy === 1
                        ? "recurso será permanentemente removido"
                        : "recursos serão permanentemente removidos"}
                      . Esta ação não pode ser desfeita.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Step: Applying */}
          {deployStep === "applying" && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
                <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
                <div>
                  <p className="text-sm font-semibold text-amber-700">
                    Provisionando recursos...
                  </p>
                  <p className="text-xs text-amber-500">
                    Aplicando {resourceCount} recursos via Terraform
                  </p>
                </div>
              </div>
              <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
                  <span className="text-[11px] font-semibold text-amber-600">
                    terraform apply
                  </span>
                </div>
                <div className="text-[10px] text-amber-500 font-mono space-y-0.5">
                  {planResult?.resources.slice(0, 5).map((r, i) => (
                    <div key={i}>
                      {r.action === "add"
                        ? "+"
                        : r.action === "change"
                          ? "~"
                          : "-"}{" "}
                      {r.resourceType}.{r.name}
                    </div>
                  ))}
                  {planResult && planResult.resources.length > 5 && (
                    <div>
                      ...e mais {planResult.resources.length - 5} recursos
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step: Done */}
          {deployStep === "done" && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-200">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm font-semibold text-green-700">
                  Deploy concluído com sucesso!
                </p>
                <p className="text-xs text-green-500">
                  {planResult?.add || resourceCount} recursos provisionados
                  {planResult?.change ? `, ${planResult.change} alterados` : ""}
                  {planResult?.destroy
                    ? `, ${planResult.destroy} removidos`
                    : ""}
                </p>
              </div>
            </div>
          )}

          {/* Step: Error */}
          {deployStep === "error" && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
              <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-700">
                  Erro no deploy
                </p>
                <p className="text-xs text-red-500">
                  Ocorreu um erro ao provisionar os recursos. Verifique as
                  credenciais e tente novamente.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-6 pt-0 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            disabled={deploying}
            className="px-4 h-9 rounded-full text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all disabled:opacity-50"
          >
            {deployStep === "done" || deployStep === "error"
              ? "Fechar"
              : "Cancelar"}
          </button>

          {deployStep === "review" && (
            <ProtectedAction roles={["admin", "editor"]}>
              <button
                onClick={onDeploy}
                disabled={deploying}
                className="inline-flex items-center gap-1.5 px-5 h-9 rounded-full text-xs font-bold bg-brand-navy text-white hover:bg-[#0D1B2A] transition-all disabled:opacity-50"
              >
                {deploying ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ArrowRight className="w-3.5 h-3.5" />
                )}
                Confirmar e Aplicar
              </button>
            </ProtectedAction>
          )}

          {deployStep === "plan" && (
            <div className="flex items-center gap-2 px-4 h-9 rounded-full text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Gerando plano...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
