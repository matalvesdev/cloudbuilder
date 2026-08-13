import { useState, useMemo } from "react";
import {
  ArrowRight,
  CheckCircle2,
  XCircle,
  Loader2,
  Shield,
  Clock,
  User,
  FileCode2,
  GitCompare,
  AlertTriangle,
  ArrowUpFromLine,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCredentialStore } from "@/store/credentialStore";
import { usePromotionStore } from "@/store/promotionStore";
import { useApprovalStore } from "@/store/approvalStore";
import { useCanvasStore } from "@/store/canvasStore";
import { ENVIRONMENT_TYPE_LABELS } from "@/types/settings.types";
import type { Environment, Provider } from "@/types/settings.types";
import type { PromotionStatus } from "@/types/promotion.types";

interface PromoteDialogProps {
  onClose: () => void;
}

type Step = "select" | "review" | "confirm";

const ENV_TYPE_ORDER: Record<string, number> = {
  development: 0,
  staging: 1,
  production: 2,
};

function canPromoteTo(source: Environment, target: Environment): boolean {
  return (
    (ENV_TYPE_ORDER[source.type] ?? 0) < (ENV_TYPE_ORDER[target.type] ?? 0)
  );
}

function getAvailableTargets(
  source: Environment,
  all: Environment[],
): Environment[] {
  return all.filter((e) => e.id !== source.id && canPromoteTo(source, e));
}

export function PromoteDialog({ onClose }: PromoteDialogProps) {
  const { environments, deployments } = useCredentialStore();
  const {
    promotions,
    approvals: storeApprovals,
    addPromotion,
    getPendingApprovals,
  } = usePromotionStore();
  const {
    teamMembers,
    approvalRules,
    requestApproval,
    getEnvsRequiringApproval,
  } = useApprovalStore();
  const { nodes, edges, canvasName, canvasVersion } = useCanvasStore();

  const [step, setStep] = useState<Step>("select");
  const [sourceEnvId, setSourceEnvId] = useState("");
  const [targetEnvId, setTargetEnvId] = useState("");
  const [requiresApproval, setRequiresApproval] = useState(true);
  const [promoting, setPromoting] = useState(false);
  const [promoteDone, setPromoteDone] = useState(false);
  const [promoteError, setPromoteError] = useState<string | null>(null);

  const sourceEnv = useMemo(
    () => environments.find((e) => e.id === sourceEnvId),
    [environments, sourceEnvId],
  );
  const targetEnv = useMemo(
    () => environments.find((e) => e.id === targetEnvId),
    [environments, targetEnvId],
  );

  const availableTargets = useMemo(
    () => (sourceEnv ? getAvailableTargets(sourceEnv, environments) : []),
    [sourceEnv, environments],
  );

  const sourceDeployments = useMemo(
    () => deployments.filter((d) => d.environmentId === sourceEnvId),
    [deployments, sourceEnvId],
  );
  const latestSourceDeploy = sourceDeployments[sourceDeployments.length - 1];

  const targetDeployments = useMemo(
    () => deployments.filter((d) => d.environmentId === targetEnvId),
    [deployments, targetEnvId],
  );
  const latestTargetDeploy = targetDeployments[targetDeployments.length - 1];

  const pendingApprovals = getPendingApprovals();
  const pipelinePromotions = useMemo(
    () =>
      [...promotions].sort(
        (a, b) =>
          new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime(),
      ),
    [promotions],
  );

  const providers = useMemo(() => {
    const provSet = new Set(nodes.map((n) => n.data?.provider).filter(Boolean));
    return Array.from(provSet);
  }, [nodes]);

  const canPromote =
    sourceEnv && targetEnv && latestSourceDeploy?.status === "success";

  const handlePromote = async () => {
    if (!sourceEnv || !targetEnv) return;
    setPromoting(true);
    setPromoteError(null);

    const needsApproval = requiresApproval && targetEnv.type === "production";
    const envRule = approvalRules.find((r) => r.environmentId === targetEnv.id);
    const approvalConfigured =
      needsApproval || (envRule?.requiresApproval ?? false);

    try {
      const canvasSnapshot = JSON.stringify({ nodes, edges });
      const promId = addPromotion({
        sourceEnvId: sourceEnv.id,
        targetEnvId: targetEnv.id,
        canvasSnapshot,
        sourceVersion: sourceEnv.canvasVersion,
        targetVersion: targetEnv.canvasVersion,
        resourceCount: nodes.length,
        requiresApproval: approvalConfigured,
        requestedBy: "admin@cloudbuilder.io",
        approvedBy: null,
        approvedAt: null,
        completedAt: null,
      });

      if (approvalConfigured) {
        requestApproval({
          promotionId: promId,
          sourceEnvId: sourceEnv.id,
          targetEnvId: targetEnv.id,
          sourceEnvName: sourceEnv.name,
          targetEnvName: targetEnv.name,
          sourceEnvType: sourceEnv.type,
          targetEnvType: targetEnv.type,
          requestedBy: "admin@cloudbuilder.io",
          requestedByName: "Admin CloudBuilder",
          requestedAt: new Date().toISOString(),
          resourceCount: nodes.length,
          diffSummary: diffItems,
        });
        await new Promise((r) => setTimeout(r, 1500));
        setStep("confirm");
        setPromoteDone(true);
      } else {
        await new Promise((r) => setTimeout(r, 2000));
        usePromotionStore
          .getState()
          .updatePromotionStatus(promId, "deployed", new Date().toISOString());
        useCredentialStore.getState().addDeployment({
          environmentId: targetEnv.id,
          version: `v${targetEnv.canvasVersion + 1}.0.0`,
          status: "success",
          resourceCount: nodes.length,
          duration: "1m 23s",
          startedAt: new Date(Date.now() - 5000).toISOString(),
          completedAt: new Date().toISOString(),
          planSummary: { add: nodes.length, change: 0, destroy: 0 },
        });
        useCredentialStore.getState().updateEnvironment(targetEnv.id, {
          canvasVersion: targetEnv.canvasVersion + 1,
          status: "ACTIVE",
        });
        setStep("confirm");
        setPromoteDone(true);
      }
    } catch {
      setPromoteError("Erro ao realizar promoção. Tente novamente.");
    } finally {
      setPromoting(false);
    }
  };

  const selectedProviders = useMemo(() => {
    if (!sourceEnv && !targetEnv) return [];
    const provs = new Set<string>();
    if (sourceEnv) provs.add(sourceEnv.provider);
    if (targetEnv) provs.add(targetEnv.provider);
    return Array.from(provs);
  }, [sourceEnv, targetEnv]);

  const diffItems = useMemo(() => {
    if (!sourceEnv || !targetEnv) return [];
    return [
      {
        label: "Recursos",
        source: nodes.length,
        target: latestTargetDeploy?.resourceCount ?? 0,
        diff: nodes.length - (latestTargetDeploy?.resourceCount ?? 0),
      },
      {
        label: "Versão do Design",
        source: sourceEnv.canvasVersion,
        target: targetEnv.canvasVersion,
        diff: sourceEnv.canvasVersion - targetEnv.canvasVersion,
      },
      {
        label: "Provedores",
        source: sourceEnv.provider,
        target: targetEnv.provider,
        same: sourceEnv.provider === targetEnv.provider,
      },
    ];
  }, [sourceEnv, targetEnv, nodes.length, latestTargetDeploy]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-brand-navy font-display">
                Promover Design
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Promova o design entre ambientes para criar um fluxo de deploy
              </p>
            </div>
            <div className="flex items-center gap-1">
              {(["select", "review", "confirm"] as Step[]).map((s, i) => (
                <div key={s} className="flex items-center gap-1">
                  <span
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all",
                      step === s
                        ? "bg-brand-navy text-white"
                        : ["select", "review", "confirm"].indexOf(step) > i
                          ? "bg-green-500 text-white"
                          : "bg-slate-100 text-slate-400",
                    )}
                  >
                    {["select", "review", "confirm"].indexOf(step) > i ? (
                      <CheckCircle2 className="w-3 h-3" />
                    ) : (
                      i + 1
                    )}
                  </span>
                  {i < 2 && (
                    <div
                      className={cn(
                        "w-6 h-px",
                        ["select", "review", "confirm"].indexOf(step) > i
                          ? "bg-green-500"
                          : "bg-slate-200",
                      )}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {step === "select" && (
          <div className="p-6 space-y-5">
            <p className="text-sm font-semibold text-brand-navy">
              Selecione a origem e o destino da promoção
            </p>

            {/* Source Environment */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Ambiente de Origem
              </label>
              <select
                value={sourceEnvId}
                onChange={(e) => {
                  setSourceEnvId(e.target.value);
                  setTargetEnvId("");
                }}
                className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm text-brand-navy font-medium bg-white focus:outline-none focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy"
              >
                <option value="">Selecione...</option>
                {environments.map((env) => {
                  const envDeploys = deployments.filter(
                    (d) => d.environmentId === env.id,
                  );
                  const hasDeploy = envDeploys.some(
                    (d) => d.status === "success",
                  );
                  return (
                    <option key={env.id} value={env.id} disabled={!hasDeploy}>
                      {env.name} ({ENVIRONMENT_TYPE_LABELS[env.type]}){" "}
                      {!hasDeploy ? "— sem deploy" : `— v${env.canvasVersion}`}
                    </option>
                  );
                })}
              </select>
              {sourceEnv && latestSourceDeploy && (
                <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                  Último deploy:{" "}
                  <span className="font-semibold text-brand-navy">
                    {latestSourceDeploy.version}
                  </span>
                  <span className="text-slate-300">|</span>
                  <span>{nodes.length} recursos no design atual</span>
                </div>
              )}
            </div>

            {/* Arrow between */}
            <div className="flex justify-center">
              <div className="w-10 h-10 rounded-full bg-ice-blue flex items-center justify-center">
                <ArrowRight className="w-5 h-5 text-brand-navy" />
              </div>
            </div>

            {/* Target Environment */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Ambiente de Destino
              </label>
              <select
                value={targetEnvId}
                onChange={(e) => setTargetEnvId(e.target.value)}
                disabled={!sourceEnv}
                className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm text-brand-navy font-medium bg-white focus:outline-none focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Selecione...</option>
                {availableTargets.map((env) => (
                  <option key={env.id} value={env.id}>
                    {env.name} ({ENVIRONMENT_TYPE_LABELS[env.type]} — v
                    {env.canvasVersion})
                  </option>
                ))}
              </select>
              {targetEnv && (
                <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                  <FileCode2 className="w-3 h-3 text-slate-400" />
                  Versão atual:{" "}
                  <span className="font-semibold text-brand-navy">
                    v{targetEnv.canvasVersion}
                  </span>
                  {latestTargetDeploy && (
                    <>
                      <span className="text-slate-300">|</span>
                      <span>Último deploy: {latestTargetDeploy.version}</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Production approval toggle */}
            {(targetEnv?.type === "production" ||
              approvalRules.find((r) => r.environmentId === targetEnv?.id)
                ?.requiresApproval) && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-amber-800">
                      {targetEnv?.type === "production"
                        ? "Ambiente de Produção"
                        : "Portão de Aprovação"}
                    </p>
                    <p className="text-xs text-amber-600 mt-0.5">
                      {targetEnv?.type === "production"
                        ? "Promoções para produção exigem aprovação manual de um supervisor"
                        : "Este ambiente tem portão de aprovação configurado"}
                    </p>
                    <label className="mt-3 flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={requiresApproval}
                        onChange={(e) => setRequiresApproval(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-brand-navy focus:ring-brand-navy/30"
                      />
                      <span className="text-xs font-medium text-amber-700">
                        Exigir aprovação para promover para este ambiente
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={onClose}
                className="px-4 h-9 rounded-full text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={() => setStep("review")}
                disabled={!canPromote}
                className="px-5 h-9 rounded-full text-xs font-bold bg-brand-navy text-white hover:bg-brand-navy/90 transition-all disabled:opacity-50"
              >
                Revisar Mudanças
              </button>
            </div>
          </div>
        )}

        {step === "review" && sourceEnv && targetEnv && (
          <div className="p-6 space-y-5">
            <p className="text-sm font-semibold text-brand-navy">
              Revise as diferenças entre os ambientes
            </p>

            {/* Environment Comparison */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Origem
                </p>
                <p className="text-sm font-bold text-brand-navy">
                  {sourceEnv.name}
                </p>
                <p className="text-xs text-slate-500 capitalize">
                  {ENVIRONMENT_TYPE_LABELS[sourceEnv.type]}
                </p>
              </div>
              <div className="flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-ice-blue flex items-center justify-center">
                  <GitCompare className="w-4 h-4 text-brand-navy" />
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Destino
                </p>
                <p className="text-sm font-bold text-brand-navy">
                  {targetEnv.name}
                </p>
                <p className="text-xs text-slate-500 capitalize">
                  {ENVIRONMENT_TYPE_LABELS[targetEnv.type]}
                </p>
              </div>
            </div>

            {/* Diff Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left p-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Item
                    </th>
                    <th className="text-center p-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Origem
                    </th>
                    <th className="text-center p-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Destino
                    </th>
                    <th className="text-center p-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Diferença
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {diffItems.map((item) => (
                    <tr key={item.label} className="border-t border-slate-100">
                      <td className="p-3 text-sm font-medium text-brand-navy">
                        {item.label}
                      </td>
                      <td className="p-3 text-center text-sm text-slate-600">
                        {item.source}
                      </td>
                      <td className="p-3 text-center text-sm text-slate-600">
                        {item.target}
                      </td>
                      <td className="p-3 text-center">
                        {"diff" in item && item.diff !== undefined ? (
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full",
                              item.diff > 0
                                ? "bg-green-50 text-green-700"
                                : item.diff < 0
                                  ? "bg-red-50 text-red-700"
                                  : "bg-slate-50 text-slate-500",
                            )}
                          >
                            {item.diff > 0 ? "+" : ""}
                            {item.diff}
                          </span>
                        ) : "same" in item && item.same ? (
                          <span className="text-xs font-bold text-green-600">
                            Igual
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-amber-600">
                            Diferente
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t border-slate-100">
                    <td className="p-3 text-sm font-medium text-brand-navy">
                      Conexões
                    </td>
                    <td className="p-3 text-center text-sm text-slate-600">
                      {edges.length}
                    </td>
                    <td className="p-3 text-center text-sm text-slate-600">
                      {latestTargetDeploy ? "—" : "—"}
                    </td>
                    <td className="p-3 text-center">
                      <span className="text-xs font-bold text-green-600">
                        Novo
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Snapshot Info */}
            <div className="bg-ice-blue/50 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <FileCode2 className="w-5 h-5 text-brand-navy mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-brand-navy">
                    Snapshot do Design
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    O design atual <strong>"{canvasName}"</strong> (v
                    {canvasVersion}) será copiado para {targetEnv.name}.
                    {(requiresApproval && targetEnv.type === "production") ||
                    approvalRules.find((r) => r.environmentId === targetEnv?.id)
                      ?.requiresApproval ? (
                      <span className="block mt-1 text-amber-600">
                        <Shield className="w-3 h-3 inline mr-1" />
                        Esta promoção requer aprovação antes de ser implantada.
                      </span>
                    ) : null}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setStep("select")}
                className="px-4 h-9 rounded-full text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
              >
                Voltar
              </button>
              <button
                onClick={handlePromote}
                disabled={promoting}
                className="inline-flex items-center gap-1.5 px-5 h-9 rounded-full text-xs font-bold bg-brand-navy text-white hover:bg-brand-navy/90 transition-all disabled:opacity-50"
              >
                {promoting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ArrowUpFromLine className="w-3.5 h-3.5" />
                )}
                {promoting
                  ? "Promovendo..."
                  : (requiresApproval && targetEnv.type === "production") ||
                      approvalRules.find(
                        (r) => r.environmentId === targetEnv?.id,
                      )?.requiresApproval
                    ? "Solicitar Promoção"
                    : "Promover Agora"}
              </button>
            </div>
          </div>
        )}

        {step === "confirm" && (
          <div className="p-6 space-y-5">
            {promoteError ? (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
                <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-red-700">
                    Erro na Promoção
                  </p>
                  <p className="text-xs text-red-500">{promoteError}</p>
                </div>
              </div>
            ) : promoteDone &&
              ((requiresApproval && targetEnv?.type === "production") ||
                approvalRules.find((r) => r.environmentId === targetEnv?.id)
                  ?.requiresApproval) ? (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
                <Clock className="w-5 h-5 text-amber-500 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-amber-700">
                    Aprovação Pendente
                  </p>
                  <p className="text-xs text-amber-500">
                    A solicitação de promoção para produção foi enviada para
                    aprovação. O deploy será realizado após a aprovação de um
                    supervisor.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-200">
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-green-700">
                    {targetEnv?.type === "production"
                      ? "Promovido para Produção!"
                      : "Promoção Concluída!"}
                  </p>
                  <p className="text-xs text-green-500">
                    Design <strong>"{canvasName}"</strong> promovido de{" "}
                    {sourceEnv?.name} para {targetEnv?.name}.{nodes.length}{" "}
                    recursos, versão v
                    {targetEnv ? targetEnv.canvasVersion + 1 : ""}.
                  </p>
                </div>
              </div>
            )}

            {/* Promotion Timeline */}
            {pipelinePromotions.length > 0 && (
              <div>
                <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">
                  Histórico de Promoções
                </h4>
                <div className="space-y-2">
                  {pipelinePromotions.slice(0, 10).map((prom) => {
                    const src = environments.find(
                      (e) => e.id === prom.sourceEnvId,
                    );
                    const tgt = environments.find(
                      (e) => e.id === prom.targetEnvId,
                    );
                    return (
                      <div
                        key={prom.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100"
                      >
                        <div
                          className={cn(
                            "w-7 h-7 rounded-full flex items-center justify-center",
                            prom.status === "deployed"
                              ? "bg-green-100 text-green-600"
                              : prom.status === "approved"
                                ? "bg-blue-100 text-blue-600"
                                : prom.status === "rejected"
                                  ? "bg-red-100 text-red-600"
                                  : prom.status === "failed"
                                    ? "bg-red-100 text-red-600"
                                    : "bg-amber-100 text-amber-600",
                          )}
                        >
                          {prom.status === "deployed" ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : prom.status === "pending" ? (
                            <Clock className="w-3.5 h-3.5" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="font-semibold text-brand-navy">
                              {src?.name ?? "—"}
                            </span>
                            <ArrowRight className="w-3 h-3 text-slate-400" />
                            <span className="font-semibold text-brand-navy">
                              {tgt?.name ?? "—"}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {new Date(prom.requestedAt).toLocaleString("pt-BR")}
                            {prom.completedAt &&
                              ` · ${new Date(prom.completedAt).toLocaleString("pt-BR")}`}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "text-[10px] px-2 py-0.5 rounded-full font-bold border",
                            prom.status === "deployed"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : prom.status === "pending"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : prom.status === "approved"
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : "bg-red-50 text-red-700 border-red-200",
                          )}
                        >
                          {prom.status === "deployed"
                            ? "Implantado"
                            : prom.status === "pending"
                              ? "Pendente"
                              : prom.status === "approved"
                                ? "Aprovado"
                                : prom.status === "rejected"
                                  ? "Rejeitado"
                                  : "Falha"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Pending approvals summary */}
            {pendingApprovals.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3">
                <Shield className="w-4 h-4 text-amber-600 shrink-0" />
                <div className="text-xs text-amber-700">
                  <span className="font-bold">{pendingApprovals.length}</span>{" "}
                  promoção
                  {pendingApprovals.length > 1 ? "ões" : ""} pendente
                  {pendingApprovals.length > 1 ? "s" : ""} de aprovação
                </div>
              </div>
            )}

            <div className="flex items-center justify-end">
              <button
                onClick={onClose}
                className="px-5 h-9 rounded-full text-xs font-bold bg-brand-navy text-white hover:bg-brand-navy/90 transition-all"
              >
                Fechar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
