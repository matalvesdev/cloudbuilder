export type PromotionStatus =
  "pending" | "approved" | "rejected" | "deployed" | "failed";

export interface Promotion {
  id: string;
  sourceEnvId: string;
  targetEnvId: string;
  canvasSnapshot: string;
  sourceVersion: number;
  targetVersion: number;
  status: PromotionStatus;
  resourceCount: number;
  requiresApproval: boolean;
  requestedBy: string;
  approvedBy: string | null;
  requestedAt: string;
  approvedAt: string | null;
  completedAt: string | null;
}

export interface Approval {
  id: string;
  promotionId: string;
  approver: string;
  status: "approved" | "rejected";
  comment: string;
  createdAt: string;
}

export const PROMOTION_STATUS_LABELS: Record<PromotionStatus, string> = {
  pending: "Pendente",
  approved: "Aprovado",
  rejected: "Rejeitado",
  deployed: "Implantado",
  failed: "Falha",
};
