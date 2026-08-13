import { useMemo } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  XCircle,
  Clock,
  AlertTriangle,
  ArrowUpFromLine,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCredentialStore } from "@/store/credentialStore";
import { usePromotionStore } from "@/store/promotionStore";
import { useCanvasStore } from "@/store/canvasStore";
import { ENVIRONMENT_TYPE_LABELS } from "@/types/settings.types";
import type { Environment } from "@/types/settings.types";

interface EnvironmentPipelineProps {
  onPromote: (sourceId: string, targetId: string) => void;
  environments: Environment[];
}

const ENV_ORDER: Record<string, number> = {
  development: 0,
  staging: 1,
  production: 2,
};

function getNextEnvType(currentType: string): string | null {
  if (currentType === "development") return "staging";
  if (currentType === "staging") return "production";
  return null;
}

export function EnvironmentPipeline({
  onPromote,
  environments,
}: EnvironmentPipelineProps) {
  const deployments = useCredentialStore((s) => s.deployments);
  const promotions = usePromotionStore((s) => s.promotions);
  const nodes = useCanvasStore((s) => s.nodes);

  const sorted = useMemo(
    () =>
      [...environments].sort(
        (a, b) => (ENV_ORDER[a.type] ?? 99) - (ENV_ORDER[b.type] ?? 99),
      ),
    [environments],
  );

  if (sorted.length < 2) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[12px] font-bold uppercase tracking-wide text-slate-400">
          Pipeline de Ambientes
        </h3>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-ice-blue text-brand-navy font-semibold">
          {sorted.length} ambientes
        </span>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {sorted.map((env, idx) => {
          const envDeployments = deployments.filter(
            (d) => d.environmentId === env.id,
          );
          const latestDeploy = envDeployments[envDeployments.length - 1];
          const envPromotions = promotions.filter(
            (p) => p.sourceEnvId === env.id || p.targetEnvId === env.id,
          );
          const pendingPromotions = envPromotions.filter(
            (p) => p.status === "pending",
          );
          const failedPromotions = envPromotions.filter(
            (p) => p.status === "failed",
          );

          const nextType = getNextEnvType(env.type);
          const nextEnv = nextType
            ? sorted.find((e) => e.type === nextType)
            : null;

          return (
            <div key={env.id} className="flex items-center gap-2 shrink-0">
              <div
                className={cn(
                  "relative p-4 rounded-xl border-2 min-w-[200px] transition-all",
                  env.status === "ACTIVE"
                    ? "border-green-300 bg-green-50/50"
                    : env.status === "FAILED"
                      ? "border-red-300 bg-red-50/50"
                      : "border-slate-200 bg-white",
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-brand-navy">
                    {env.name}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-full font-semibold border",
                      env.type === "production"
                        ? "bg-purple-50 text-purple-700 border-purple-200"
                        : env.type === "staging"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-blue-50 text-blue-700 border-blue-200",
                    )}
                  >
                    {ENVIRONMENT_TYPE_LABELS[env.type]}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                  <span className="font-mono font-bold text-brand-navy">
                    v{env.canvasVersion}
                  </span>
                  {latestDeploy && (
                    <span
                      className={cn(
                        "inline-flex items-center gap-0.5 text-[10px] font-semibold",
                        latestDeploy.status === "success"
                          ? "text-green-600"
                          : latestDeploy.status === "failed"
                            ? "text-red-600"
                            : "text-amber-600",
                      )}
                    >
                      {latestDeploy.status === "success" ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : latestDeploy.status === "failed" ? (
                        <XCircle className="w-3 h-3" />
                      ) : (
                        <Clock className="w-3 h-3" />
                      )}
                      {latestDeploy.status === "success"
                        ? "Deploy OK"
                        : latestDeploy.status === "failed"
                          ? "Falhou"
                          : "Em andamento"}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex -space-x-1">
                    {[1, 2, 3]
                      .slice(0, Math.min(env.canvasVersion, 3))
                      .map((v) => (
                        <div
                          key={v}
                          className="w-5 h-5 rounded-full bg-brand-navy text-white flex items-center justify-center text-[8px] font-bold border-2 border-white"
                        >
                          {v}
                        </div>
                      ))}
                    {env.canvasVersion > 3 && (
                      <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[8px] font-bold border-2 border-white">
                        +{env.canvasVersion - 3}
                      </div>
                    )}
                  </div>

                  {nextEnv && (
                    <button
                      onClick={() => onPromote(env.id, nextEnv.id)}
                      disabled={
                        !latestDeploy || latestDeploy.status !== "success"
                      }
                      className={cn(
                        "ml-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all",
                        latestDeploy?.status === "success"
                          ? "bg-brand-navy text-white hover:bg-brand-navy/90"
                          : "bg-slate-100 text-slate-400 cursor-not-allowed",
                      )}
                    >
                      <ArrowUpFromLine className="w-3 h-3" />
                      Promover
                    </button>
                  )}

                  {!nextEnv && env.type === "production" && (
                    <span className="ml-auto text-[10px] text-slate-400 italic">
                      Fim da pipeline
                    </span>
                  )}
                </div>

                {pendingPromotions.length > 0 && (
                  <div className="mt-2 flex items-center gap-1 text-[10px] text-amber-600 bg-amber-50 rounded-lg px-2 py-1">
                    <Clock className="w-3 h-3" />
                    <span>{pendingPromotions.length} promoção pendente</span>
                  </div>
                )}

                {failedPromotions.length > 0 && (
                  <div className="mt-2 flex items-center gap-1 text-[10px] text-red-600 bg-red-50 rounded-lg px-2 py-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>{failedPromotions.length} promoção falhou</span>
                  </div>
                )}
              </div>

              {idx < sorted.length - 1 && (
                <div className="flex items-center shrink-0">
                  <div className="w-8 h-px bg-slate-300" />
                  <ArrowRight className="w-4 h-4 text-slate-400 -ml-1" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
