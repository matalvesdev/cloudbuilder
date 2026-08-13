import { useState, useMemo } from "react";
import {
  Shield,
  Settings,
  Plus,
  Trash2,
  User,
  UserPlus,
  Mail,
  X,
  CheckCircle2,
  AlertTriangle,
  Users,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useApprovalStore,
  type TeamMember,
  type ApprovalRule,
} from "@/store/approvalStore";
import { useCredentialStore } from "@/store/credentialStore";
import { ENVIRONMENT_TYPE_LABELS } from "@/types/settings.types";

interface ApprovalGateConfigProps {
  onClose: () => void;
}

type Tab = "rules" | "members";

export function ApprovalGateConfig({ onClose }: ApprovalGateConfigProps) {
  const {
    teamMembers,
    approvalRules,
    addTeamMember,
    removeTeamMember,
    updateTeamMember,
    setApprovalRule,
    removeApprovalRule,
  } = useApprovalStore();
  const { environments } = useCredentialStore();

  const [tab, setTab] = useState<Tab>("rules");
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMember, setNewMember] = useState({
    name: "",
    email: "",
    role: "approver" as TeamMember["role"],
  });
  const [memberError, setMemberError] = useState<string | null>(null);

  const sortedEnvs = useMemo(
    () =>
      [...environments].sort((a, b) => {
        const order = { development: 0, staging: 1, production: 2 };
        return (order[a.type] ?? 99) - (order[b.type] ?? 99);
      }),
    [environments],
  );

  const approvers = useMemo(
    () =>
      teamMembers.filter((m) => m.role === "approver" || m.role === "admin"),
    [teamMembers],
  );

  const environmentRules = useMemo(() => {
    return sortedEnvs.map((env) => {
      const rule = approvalRules.find((r) => r.environmentId === env.id);
      return { env, rule: rule ?? null };
    });
  }, [sortedEnvs, approvalRules]);

  const handleAddMember = () => {
    if (!newMember.name.trim() || !newMember.email.trim()) {
      setMemberError("Preencha nome e email");
      return;
    }
    if (!newMember.email.includes("@")) {
      setMemberError("Email inválido");
      return;
    }
    addTeamMember({
      name: newMember.name.trim(),
      email: newMember.email.trim(),
      role: newMember.role,
    });
    setNewMember({ name: "", email: "", role: "approver" });
    setShowAddMember(false);
    setMemberError(null);
  };

  const handleToggleRule = (
    envId: string,
    envName: string,
    current: boolean,
  ) => {
    if (current) {
      removeApprovalRule(envId);
    } else {
      setApprovalRule({
        environmentId: envId,
        environmentName: envName,
        requiresApproval: true,
        approverIds: approvers.map((a) => a.id),
        approvalMode: "any",
      });
    }
  };

  const handleApproverToggle = (
    envId: string,
    envName: string,
    memberId: string,
  ) => {
    const existing = approvalRules.find((r) => r.environmentId === envId);
    if (!existing) return;

    const newApproverIds = existing.approverIds.includes(memberId)
      ? existing.approverIds.filter((id) => id !== memberId)
      : [...existing.approverIds, memberId];

    setApprovalRule({
      environmentId: envId,
      environmentName: envName,
      requiresApproval: existing.requiresApproval,
      approverIds: newApproverIds,
      approvalMode: existing.approvalMode,
    });
  };

  const handleModeChange = (
    envId: string,
    envName: string,
    mode: "any" | "all",
  ) => {
    const existing = approvalRules.find((r) => r.environmentId === envId);
    if (!existing) return;
    setApprovalRule({
      environmentId: envId,
      environmentName: envName,
      requiresApproval: existing.requiresApproval,
      approverIds: existing.approverIds,
      approvalMode: mode,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-100 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <Shield className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-brand-navy font-display">
                  Portões de Aprovação
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configure quem pode aprovar promoções em cada ambiente
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex border-b border-slate-100 shrink-0">
          <button
            onClick={() => setTab("rules")}
            className={cn(
              "flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all",
              tab === "rules"
                ? "text-brand-navy border-brand-navy"
                : "text-slate-400 border-transparent hover:text-slate-600",
            )}
          >
            <Shield className="w-3.5 h-3.5" />
            Regras por Ambiente
          </button>
          <button
            onClick={() => setTab("members")}
            className={cn(
              "flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all",
              tab === "members"
                ? "text-brand-navy border-brand-navy"
                : "text-slate-400 border-transparent hover:text-slate-600",
            )}
          >
            <Users className="w-3.5 h-3.5" />
            Membros do Time ({teamMembers.length})
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          {tab === "rules" && (
            <div className="p-6 space-y-4">
              {environments.length === 0 ? (
                <div className="py-12 text-center">
                  <Settings className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-slate-500">
                    Nenhum ambiente configurado
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Crie ambientes nas configurações para configurar portões de
                    aprovação
                  </p>
                </div>
              ) : (
                environmentRules.map(({ env, rule }) => {
                  const isApprovalEnabled = rule?.requiresApproval ?? false;
                  return (
                    <div
                      key={env.id}
                      className={cn(
                        "rounded-xl border-2 p-5 transition-all",
                        isApprovalEnabled
                          ? "border-amber-200 bg-amber-50/50"
                          : "border-slate-200 bg-white",
                      )}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-brand-navy">
                              {env.name}
                            </span>
                            <span
                              className={cn(
                                "text-[10px] px-1.5 py-0.5 rounded-full font-bold border",
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
                          <p className="text-xs text-slate-400 mt-0.5">
                            v{env.canvasVersion} · {env.provider.toUpperCase()}{" "}
                            · {env.region}
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            handleToggleRule(
                              env.id,
                              env.name,
                              isApprovalEnabled,
                            )
                          }
                          className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all",
                            isApprovalEnabled
                              ? "bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-200"
                              : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100",
                          )}
                        >
                          {isApprovalEnabled ? (
                            <>
                              <ToggleRight className="w-3.5 h-3.5" /> Ativado
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="w-3.5 h-3.5" /> Desativado
                            </>
                          )}
                        </button>
                      </div>

                      {isApprovalEnabled && (
                        <div className="space-y-4">
                          <div>
                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                              Modo de Aprovação
                            </p>
                            <div className="flex gap-2">
                              <button
                                onClick={() =>
                                  handleModeChange(env.id, env.name, "any")
                                }
                                className={cn(
                                  "flex-1 px-3 py-2 rounded-lg text-xs font-semibold border transition-all",
                                  rule?.approvalMode === "any"
                                    ? "bg-brand-navy text-white border-brand-navy"
                                    : "bg-white text-slate-500 border-slate-200 hover:border-slate-300",
                                )}
                              >
                                Qualquer 1 aprovador
                              </button>
                              <button
                                onClick={() =>
                                  handleModeChange(env.id, env.name, "all")
                                }
                                className={cn(
                                  "flex-1 px-3 py-2 rounded-lg text-xs font-semibold border transition-all",
                                  rule?.approvalMode === "all"
                                    ? "bg-brand-navy text-white border-brand-navy"
                                    : "bg-white text-slate-500 border-slate-200 hover:border-slate-300",
                                )}
                              >
                                Todos os aprovadores
                              </button>
                            </div>
                          </div>

                          <div>
                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                              Aprovadores
                            </p>
                            {approvers.length === 0 ? (
                              <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                                <p className="text-xs text-amber-700">
                                  Nenhum aprovador disponível. Adicione membros
                                  com papel de aprovador.
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-1.5">
                                {approvers.map((member) => {
                                  const isSelected =
                                    rule?.approverIds.includes(member.id) ??
                                    false;
                                  return (
                                    <label
                                      key={member.id}
                                      className={cn(
                                        "flex items-center gap-3 px-3 py-2 rounded-lg border cursor-pointer transition-all",
                                        isSelected
                                          ? "bg-white border-brand-navy/30"
                                          : "bg-white border-slate-200 hover:border-slate-300",
                                      )}
                                    >
                                      <div
                                        className={cn(
                                          "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white",
                                          isSelected
                                            ? "bg-brand-navy"
                                            : "bg-slate-300",
                                        )}
                                      >
                                        {member.name.charAt(0).toUpperCase()}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs font-semibold text-brand-navy">
                                            {member.name}
                                          </span>
                                          <span
                                            className={cn(
                                              "text-[9px] px-1.5 py-0.5 rounded-full font-bold border",
                                              member.role === "admin"
                                                ? "bg-purple-50 text-purple-700 border-purple-200"
                                                : "bg-green-50 text-green-700 border-green-200",
                                            )}
                                          >
                                            {member.role === "admin"
                                              ? "Admin"
                                              : "Aprovador"}
                                          </span>
                                        </div>
                                        <p className="text-[10px] text-slate-400">
                                          {member.email}
                                        </p>
                                      </div>
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() =>
                                          handleApproverToggle(
                                            env.id,
                                            env.name,
                                            member.id,
                                          )
                                        }
                                        className="w-4 h-4 rounded border-slate-300 text-brand-navy focus:ring-brand-navy/30"
                                      />
                                    </label>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          {rule && rule.approverIds.length === 0 && (
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                              <p className="text-xs text-amber-700">
                                Selecione ao menos um aprovador para este
                                ambiente
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {!isApprovalEnabled && (
                        <p className="text-xs text-slate-400">
                          Promoções para este ambiente não exigem aprovação.
                          Ative o portão para exigir aprovação.
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {tab === "members" && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {teamMembers.length}{" "}
                  {teamMembers.length === 1 ? "membro" : "membros"}
                </p>
                <button
                  onClick={() => setShowAddMember(!showAddMember)}
                  className="inline-flex items-center gap-1.5 px-3 h-8 rounded-full text-xs font-bold bg-brand-navy text-white hover:bg-brand-navy/90 transition-all"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Adicionar
                </button>
              </div>

              {showAddMember && (
                <div className="mb-4 p-4 rounded-xl bg-ice-blue/30 border border-ice-blue">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold text-brand-navy">
                      Novo Membro
                    </p>
                    <button
                      onClick={() => {
                        setShowAddMember(false);
                        setMemberError(null);
                      }}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Nome
                      </label>
                      <input
                        type="text"
                        value={newMember.name}
                        onChange={(e) =>
                          setNewMember({ ...newMember, name: e.target.value })
                        }
                        placeholder="Nome completo"
                        className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs text-brand-navy bg-white focus:outline-none focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={newMember.email}
                        onChange={(e) =>
                          setNewMember({ ...newMember, email: e.target.value })
                        }
                        placeholder="email@exemplo.com"
                        className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs text-brand-navy bg-white focus:outline-none focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Papel
                      </label>
                      <select
                        value={newMember.role}
                        onChange={(e) =>
                          setNewMember({
                            ...newMember,
                            role: e.target.value as TeamMember["role"],
                          })
                        }
                        className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs text-brand-navy bg-white focus:outline-none focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy"
                      >
                        <option value="approver">Aprovador</option>
                        <option value="admin">Admin</option>
                        <option value="developer">Desenvolvedor</option>
                        <option value="viewer">Visualizador</option>
                      </select>
                    </div>
                    {memberError && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {memberError}
                      </p>
                    )}
                    <button
                      onClick={handleAddMember}
                      className="w-full h-9 rounded-full text-xs font-bold bg-brand-navy text-white hover:bg-brand-navy/90 transition-all"
                    >
                      <UserPlus className="w-3.5 h-3.5 inline mr-1.5" />
                      Adicionar Membro
                    </button>
                  </div>
                </div>
              )}

              {teamMembers.length === 0 ? (
                <div className="py-12 text-center">
                  <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-slate-500">
                    Nenhum membro no time
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Adicione membros para configurar quem pode aprovar promoções
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {teamMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100"
                    >
                      <div
                        className={cn(
                          "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white",
                          member.role === "admin"
                            ? "bg-purple-500"
                            : member.role === "approver"
                              ? "bg-green-500"
                              : member.role === "developer"
                                ? "bg-blue-500"
                                : "bg-slate-400",
                        )}
                      >
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-brand-navy">
                            {member.name}
                          </span>
                          <span
                            className={cn(
                              "text-[9px] px-1.5 py-0.5 rounded-full font-bold border",
                              member.role === "admin"
                                ? "bg-purple-50 text-purple-700 border-purple-200"
                                : member.role === "approver"
                                  ? "bg-green-50 text-green-700 border-green-200"
                                  : member.role === "developer"
                                    ? "bg-blue-50 text-blue-700 border-blue-200"
                                    : "bg-slate-50 text-slate-500 border-slate-200",
                            )}
                          >
                            {member.role === "admin"
                              ? "Admin"
                              : member.role === "approver"
                                ? "Aprovador"
                                : member.role === "developer"
                                  ? "Desenvolvedor"
                                  : "Visualizador"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3" />
                          {member.email}
                        </p>
                      </div>
                      <button
                        onClick={() => removeTeamMember(member.id)}
                        className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 h-9 rounded-full text-xs font-bold bg-brand-navy text-white hover:bg-brand-navy/90 transition-all"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
