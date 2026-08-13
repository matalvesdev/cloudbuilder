import { create } from "zustand";
import { api } from "@/api/client";

// ─── API DTOs ─────────────────────────────────────────────────────────────

interface ApprovalRuleDTO {
  id: string;
  environmentId: string;
  environmentName: string;
  requiresApproval: boolean;
  approverIds: string[];
  approvalMode: "any" | "all";
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

interface ApprovalRequestDTO {
  id: string;
  promotionId: string;
  sourceEnvId: string;
  targetEnvId: string;
  sourceEnvName: string;
  targetEnvName: string;
  sourceEnvType: string;
  targetEnvType: string;
  requestedBy: string;
  requestedByName: string;
  requestedAt: string;
  resourceCount: number;
  diffSummary: {
    label: string;
    source: string | number;
    target: string | number;
    diff?: number;
    same?: boolean;
  }[];
  status: "pending" | "approved" | "rejected";
  resolvedBy: string | null;
  resolvedByName: string | null;
  resolvedAt: string | null;
  comment: string | null;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "admin" | "approver" | "developer" | "viewer";
}

export interface ApprovalRule {
  id: string;
  environmentId: string;
  environmentName: string;
  requiresApproval: boolean;
  approverIds: string[];
  approvalMode: "any" | "all";
}

export interface ApprovalRequest {
  id: string;
  promotionId: string;
  sourceEnvId: string;
  targetEnvId: string;
  sourceEnvName: string;
  targetEnvName: string;
  sourceEnvType: string;
  targetEnvType: string;
  requestedBy: string;
  requestedByName: string;
  requestedAt: string;
  resourceCount: number;
  diffSummary: {
    label: string;
    source: string | number;
    target: string | number;
    diff?: number;
    same?: boolean;
  }[];
  status: "pending" | "approved" | "rejected";
  resolvedBy: string | null;
  resolvedByName: string | null;
  resolvedAt: string | null;
  comment: string | null;
}

export interface ApprovalHistoryEntry {
  id: string;
  approvalRequestId: string;
  promotionId: string;
  action: "requested" | "approved" | "rejected" | "cancelled";
  actor: string;
  actorName: string;
  role: string;
  comment: string;
  timestamp: string;
}

interface ApprovalState {
  teamMembers: TeamMember[];
  approvalRules: ApprovalRule[];
  approvalRequests: ApprovalRequest[];
  approvalHistory: ApprovalHistoryEntry[];
  loading: boolean;
  error: string | null;

  // API-backed actions
  fetchApprovalRules: () => Promise<void>;
  addApprovalRule: (
    rule: Omit<ApprovalRule, "id">,
  ) => Promise<ApprovalRule | null>;
  updateApprovalRule: (
    id: string,
    rule: Partial<ApprovalRule>,
  ) => Promise<void>;
  removeApprovalRuleApi: (id: string) => Promise<void>;
  submitApprovalRequest: (
    req: Omit<
      ApprovalRequest,
      | "id"
      | "status"
      | "resolvedBy"
      | "resolvedByName"
      | "resolvedAt"
      | "comment"
    >,
  ) => Promise<ApprovalRequest | null>;
  approveRequest: (id: string, comment?: string) => Promise<void>;
  rejectRequest: (id: string, reason: string) => Promise<void>;

  // Local actions (kept for backward compatibility)
  addTeamMember: (member: Omit<TeamMember, "id">) => void;
  removeTeamMember: (id: string) => void;
  updateTeamMember: (id: string, updates: Partial<TeamMember>) => void;

  setApprovalRule: (rule: Omit<ApprovalRule, "id">) => void;
  removeApprovalRule: (environmentId: string) => void;
  getApprovalRuleForEnv: (environmentId: string) => ApprovalRule | undefined;
  getEnvsRequiringApproval: () => string[];

  requestApproval: (
    req: Omit<
      ApprovalRequest,
      | "id"
      | "status"
      | "resolvedBy"
      | "resolvedByName"
      | "resolvedAt"
      | "comment"
    >,
  ) => string;
  approve: (
    requestId: string,
    approverId: string,
    approverName: string,
    comment?: string,
  ) => void;
  reject: (
    requestId: string,
    approverId: string,
    approverName: string,
    comment?: string,
  ) => void;
  cancelApprovalRequest: (requestId: string) => void;
  getPendingRequests: () => ApprovalRequest[];
  getApprovalRequestsForPromotion: (promotionId: string) => ApprovalRequest[];
  getHistoryForPromotion: (promotionId: string) => ApprovalHistoryEntry[];
  canUserApprove: (userId: string, environmentId: string) => boolean;
  getApproversForEnv: (environmentId: string) => TeamMember[];
}

export const useApprovalStore = create<ApprovalState>()((set, get) => ({
  teamMembers: [],
  approvalRules: [],
  approvalRequests: [],
  approvalHistory: [],
  loading: false,
  error: null,

  // ─── API-backed approval rule actions ─────────────────

  fetchApprovalRules: async () => {
    set({ loading: true, error: null });
    try {
      const data = await api.get<ApprovalRuleDTO[]>("/approval/rules");
      const rules: ApprovalRule[] = data.map((dto) => ({
        id: dto.id,
        environmentId: dto.environmentId,
        environmentName: dto.environmentName,
        requiresApproval: dto.requiresApproval,
        approverIds: dto.approverIds,
        approvalMode: dto.approvalMode,
      }));
      set({ approvalRules: rules, loading: false });
    } catch {
      set({ loading: false, approvalRules: [] });
    }
  },

  addApprovalRule: async (rule) => {
    set({ loading: true, error: null });
    try {
      const dto = await api.post<ApprovalRuleDTO>("/approval/rules", rule);
      const newRule: ApprovalRule = {
        id: dto.id,
        environmentId: dto.environmentId,
        environmentName: dto.environmentName,
        requiresApproval: dto.requiresApproval,
        approverIds: dto.approverIds,
        approvalMode: dto.approvalMode,
      };
      set((state) => ({
        approvalRules: [...state.approvalRules, newRule],
        loading: false,
      }));
      return newRule;
    } catch {
      set({ loading: false });
      return null;
    }
  },

  updateApprovalRule: async (id, rule) => {
    set({ loading: true, error: null });
    try {
      const dto = await api.put<ApprovalRuleDTO>(`/approval/rules/${id}`, rule);
      set((state) => ({
        approvalRules: state.approvalRules.map((r) =>
          r.id === id
            ? {
                ...r,
                environmentId: dto.environmentId,
                environmentName: dto.environmentName,
                requiresApproval: dto.requiresApproval,
                approverIds: dto.approverIds,
                approvalMode: dto.approvalMode,
              }
            : r,
        ),
        loading: false,
      }));
    } catch {
      set({ loading: false });
    }
  },

  removeApprovalRuleApi: async (id) => {
    set({ loading: true, error: null });
    try {
      await api.delete(`/approval/rules/${id}`);
      set((state) => ({
        approvalRules: state.approvalRules.filter((r) => r.id !== id),
        loading: false,
      }));
    } catch {
      set({ loading: false });
    }
  },

  // ─── API-backed approval request actions ──────────────

  submitApprovalRequest: async (req) => {
    set({ loading: true, error: null });
    try {
      const dto = await api.post<ApprovalRequestDTO>("/approval/requests", req);
      const newReq: ApprovalRequest = {
        id: dto.id,
        promotionId: dto.promotionId,
        sourceEnvId: dto.sourceEnvId,
        targetEnvId: dto.targetEnvId,
        sourceEnvName: dto.sourceEnvName,
        targetEnvName: dto.targetEnvName,
        sourceEnvType: dto.sourceEnvType,
        targetEnvType: dto.targetEnvType,
        requestedBy: dto.requestedBy,
        requestedByName: dto.requestedByName,
        requestedAt: dto.requestedAt,
        resourceCount: dto.resourceCount,
        diffSummary: dto.diffSummary,
        status: dto.status,
        resolvedBy: dto.resolvedBy,
        resolvedByName: dto.resolvedByName,
        resolvedAt: dto.resolvedAt,
        comment: dto.comment,
      };
      const historyEntry: ApprovalHistoryEntry = {
        id: crypto.randomUUID(),
        approvalRequestId: dto.id,
        promotionId: req.promotionId,
        action: "requested",
        actor: req.requestedBy,
        actorName: req.requestedByName,
        role: "developer",
        comment: "",
        timestamp: dto.requestedAt,
      };
      set((state) => ({
        approvalRequests: [...state.approvalRequests, newReq],
        approvalHistory: [...state.approvalHistory, historyEntry],
        loading: false,
      }));
      return newReq;
    } catch {
      set({ loading: false });
      return null;
    }
  },

  approveRequest: async (id, comment) => {
    set({ loading: true, error: null });
    try {
      const dto = await api.post<ApprovalRequestDTO>(
        `/approval/requests/${id}/approve`,
        { comment: comment ?? "" },
      );
      set((state) => ({
        approvalRequests: state.approvalRequests.map((r) =>
          r.id === id
            ? {
                ...r,
                status: dto.status,
                resolvedBy: dto.resolvedBy,
                resolvedByName: dto.resolvedByName,
                resolvedAt: dto.resolvedAt,
                comment: dto.comment,
              }
            : r,
        ),
        loading: false,
      }));
    } catch {
      set({ loading: false });
    }
  },

  rejectRequest: async (id, reason) => {
    set({ loading: true, error: null });
    try {
      const dto = await api.post<ApprovalRequestDTO>(
        `/approval/requests/${id}/reject`,
        { comment: reason },
      );
      set((state) => ({
        approvalRequests: state.approvalRequests.map((r) =>
          r.id === id
            ? {
                ...r,
                status: dto.status,
                resolvedBy: dto.resolvedBy,
                resolvedByName: dto.resolvedByName,
                resolvedAt: dto.resolvedAt,
                comment: dto.comment,
              }
            : r,
        ),
        loading: false,
      }));
    } catch {
      set({ loading: false });
    }
  },

  // ─── Local actions (kept for backward compatibility) ──

  addTeamMember: (member) => {
    const newMember: TeamMember = { ...member, id: crypto.randomUUID() };
    set((state) => ({ teamMembers: [...state.teamMembers, newMember] }));
  },

  removeTeamMember: (id) => {
    set((state) => ({
      teamMembers: state.teamMembers.filter((m) => m.id !== id),
      approvalRules: state.approvalRules.map((r) => ({
        ...r,
        approverIds: r.approverIds.filter((aid) => aid !== id),
      })),
    }));
  },

  updateTeamMember: (id, updates) => {
    set((state) => ({
      teamMembers: state.teamMembers.map((m) =>
        m.id === id ? { ...m, ...updates } : m,
      ),
    }));
  },

  setApprovalRule: (rule) => {
    const existing = get().approvalRules.find(
      (r) => r.environmentId === rule.environmentId,
    );
    if (existing) {
      set((state) => ({
        approvalRules: state.approvalRules.map((r) =>
          r.environmentId === rule.environmentId ? { ...r, ...rule } : r,
        ),
      }));
    } else {
      const newRule: ApprovalRule = { ...rule, id: crypto.randomUUID() };
      set((state) => ({ approvalRules: [...state.approvalRules, newRule] }));
    }
  },

  removeApprovalRule: (environmentId) => {
    set((state) => ({
      approvalRules: state.approvalRules.filter(
        (r) => r.environmentId !== environmentId,
      ),
    }));
  },

  getApprovalRuleForEnv: (environmentId) => {
    return get().approvalRules.find((r) => r.environmentId === environmentId);
  },

  getEnvsRequiringApproval: () => {
    return get()
      .approvalRules.filter((r) => r.requiresApproval)
      .map((r) => r.environmentId);
  },

  requestApproval: (req) => {
    const id = crypto.randomUUID();
    const newReq: ApprovalRequest = {
      ...req,
      id,
      status: "pending",
      resolvedBy: null,
      resolvedByName: null,
      resolvedAt: null,
      comment: null,
    };
    const historyEntry: ApprovalHistoryEntry = {
      id: crypto.randomUUID(),
      approvalRequestId: id,
      promotionId: req.promotionId,
      action: "requested",
      actor: req.requestedBy,
      actorName: req.requestedByName,
      role: "developer",
      comment: "",
      timestamp: new Date().toISOString(),
    };
    set((state) => ({
      approvalRequests: [...state.approvalRequests, newReq],
      approvalHistory: [...state.approvalHistory, historyEntry],
    }));
    return id;
  },

  approve: (requestId, approverId, approverName, comment) => {
    const now = new Date().toISOString();
    const member = get().teamMembers.find((m) => m.id === approverId);
    set((state) => ({
      approvalRequests: state.approvalRequests.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: "approved",
              resolvedBy: approverId,
              resolvedByName: approverName,
              resolvedAt: now,
              comment: comment ?? null,
            }
          : r,
      ),
      approvalHistory: [
        ...state.approvalHistory,
        {
          id: crypto.randomUUID(),
          approvalRequestId: requestId,
          promotionId:
            state.approvalRequests.find((r) => r.id === requestId)
              ?.promotionId ?? "",
          action: "approved",
          actor: approverId,
          actorName: approverName,
          role: member?.role ?? "approver",
          comment: comment ?? "",
          timestamp: now,
        },
      ],
    }));
  },

  reject: (requestId, approverId, approverName, comment) => {
    const now = new Date().toISOString();
    const member = get().teamMembers.find((m) => m.id === approverId);
    set((state) => ({
      approvalRequests: state.approvalRequests.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: "rejected",
              resolvedBy: approverId,
              resolvedByName: approverName,
              resolvedAt: now,
              comment: comment ?? null,
            }
          : r,
      ),
      approvalHistory: [
        ...state.approvalHistory,
        {
          id: crypto.randomUUID(),
          approvalRequestId: requestId,
          promotionId:
            state.approvalRequests.find((r) => r.id === requestId)
              ?.promotionId ?? "",
          action: "rejected",
          actor: approverId,
          actorName: approverName,
          role: member?.role ?? "approver",
          comment: comment ?? "",
          timestamp: now,
        },
      ],
    }));
  },

  cancelApprovalRequest: (requestId) => {
    const now = new Date().toISOString();
    const req = get().approvalRequests.find((r) => r.id === requestId);
    if (!req) return;
    set((state) => ({
      approvalRequests: state.approvalRequests.filter(
        (r) => r.id !== requestId,
      ),
      approvalHistory: [
        ...state.approvalHistory,
        {
          id: crypto.randomUUID(),
          approvalRequestId: requestId,
          promotionId: req.promotionId,
          action: "cancelled",
          actor: req.requestedBy,
          actorName: req.requestedByName,
          role: "developer",
          comment: "Solicitação cancelada pelo solicitante",
          timestamp: now,
        },
      ],
    }));
  },

  getPendingRequests: () => {
    return get().approvalRequests.filter((r) => r.status === "pending");
  },

  getApprovalRequestsForPromotion: (promotionId) => {
    return get().approvalRequests.filter((r) => r.promotionId === promotionId);
  },

  getHistoryForPromotion: (promotionId) => {
    return get()
      .approvalHistory.filter((h) => h.promotionId === promotionId)
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
  },

  canUserApprove: (userId, environmentId) => {
    const rule = get().approvalRules.find(
      (r) => r.environmentId === environmentId,
    );
    if (!rule || !rule.requiresApproval) return false;
    const member = get().teamMembers.find((m) => m.id === userId);
    if (!member) return false;
    if (member.role === "admin") return true;
    if (member.role === "approver" && rule.approverIds.includes(member.id))
      return true;
    return false;
  },

  getApproversForEnv: (environmentId) => {
    const rule = get().approvalRules.find(
      (r) => r.environmentId === environmentId,
    );
    if (!rule) return [];
    return get().teamMembers.filter((m) => rule.approverIds.includes(m.id));
  },
}));
