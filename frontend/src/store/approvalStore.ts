import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface TeamMember {
  id: string
  name: string
  email: string
  role: 'admin' | 'approver' | 'developer' | 'viewer'
}

export interface ApprovalRule {
  id: string
  environmentId: string
  environmentName: string
  requiresApproval: boolean
  approverIds: string[]
  approvalMode: 'any' | 'all'
}

export interface ApprovalRequest {
  id: string
  promotionId: string
  sourceEnvId: string
  targetEnvId: string
  sourceEnvName: string
  targetEnvName: string
  sourceEnvType: string
  targetEnvType: string
  requestedBy: string
  requestedByName: string
  requestedAt: string
  resourceCount: number
  diffSummary: { label: string; source: string | number; target: string | number; diff?: number; same?: boolean }[]
  status: 'pending' | 'approved' | 'rejected'
  resolvedBy: string | null
  resolvedByName: string | null
  resolvedAt: string | null
  comment: string | null
}

export interface ApprovalHistoryEntry {
  id: string
  approvalRequestId: string
  promotionId: string
  action: 'requested' | 'approved' | 'rejected' | 'cancelled'
  actor: string
  actorName: string
  role: string
  comment: string
  timestamp: string
}

interface ApprovalState {
  teamMembers: TeamMember[]
  approvalRules: ApprovalRule[]
  approvalRequests: ApprovalRequest[]
  approvalHistory: ApprovalHistoryEntry[]

  addTeamMember: (member: Omit<TeamMember, 'id'>) => void
  removeTeamMember: (id: string) => void
  updateTeamMember: (id: string, updates: Partial<TeamMember>) => void

  setApprovalRule: (rule: Omit<ApprovalRule, 'id'>) => void
  removeApprovalRule: (environmentId: string) => void
  getApprovalRuleForEnv: (environmentId: string) => ApprovalRule | undefined
  getEnvsRequiringApproval: () => string[]

  requestApproval: (req: Omit<ApprovalRequest, 'id' | 'status' | 'resolvedBy' | 'resolvedByName' | 'resolvedAt' | 'comment'>) => string
  approve: (requestId: string, approverId: string, approverName: string, comment?: string) => void
  reject: (requestId: string, approverId: string, approverName: string, comment?: string) => void
  cancelApprovalRequest: (requestId: string) => void
  getPendingRequests: () => ApprovalRequest[]
  getApprovalRequestsForPromotion: (promotionId: string) => ApprovalRequest[]
  getHistoryForPromotion: (promotionId: string) => ApprovalHistoryEntry[]
  canUserApprove: (userId: string, environmentId: string) => boolean
  getApproversForEnv: (environmentId: string) => TeamMember[]
}

const defaultMembers: TeamMember[] = [
  { id: 'admin-1', name: 'Admin CloudBuilder', email: 'admin@cloudbuilder.io', role: 'admin' },
  { id: 'approver-1', name: 'Ana Supervisora', email: 'ana@cloudbuilder.io', role: 'approver' },
  { id: 'approver-2', name: 'Carlos Revisor', email: 'carlos@cloudbuilder.io', role: 'approver' },
  { id: 'dev-1', name: 'Beatriz Dev', email: 'beatriz@cloudbuilder.io', role: 'developer' },
]

export const useApprovalStore = create<ApprovalState>()(
  persist(
    (set, get) => ({
      teamMembers: defaultMembers,
      approvalRules: [],
      approvalRequests: [],
      approvalHistory: [],

      addTeamMember: (member) => {
        const newMember: TeamMember = { ...member, id: crypto.randomUUID() }
        set((state) => ({ teamMembers: [...state.teamMembers, newMember] }))
      },

      removeTeamMember: (id) => {
        set((state) => ({
          teamMembers: state.teamMembers.filter((m) => m.id !== id),
          approvalRules: state.approvalRules.map((r) => ({
            ...r,
            approverIds: r.approverIds.filter((aid) => aid !== id),
          })),
        }))
      },

      updateTeamMember: (id, updates) => {
        set((state) => ({
          teamMembers: state.teamMembers.map((m) => (m.id === id ? { ...m, ...updates } : m)),
        }))
      },

      setApprovalRule: (rule) => {
        const existing = get().approvalRules.find((r) => r.environmentId === rule.environmentId)
        if (existing) {
          set((state) => ({
            approvalRules: state.approvalRules.map((r) =>
              r.environmentId === rule.environmentId ? { ...r, ...rule } : r
            ),
          }))
        } else {
          const newRule: ApprovalRule = { ...rule, id: crypto.randomUUID() }
          set((state) => ({ approvalRules: [...state.approvalRules, newRule] }))
        }
      },

      removeApprovalRule: (environmentId) => {
        set((state) => ({
          approvalRules: state.approvalRules.filter((r) => r.environmentId !== environmentId),
        }))
      },

      getApprovalRuleForEnv: (environmentId) => {
        return get().approvalRules.find((r) => r.environmentId === environmentId)
      },

      getEnvsRequiringApproval: () => {
        return get().approvalRules.filter((r) => r.requiresApproval).map((r) => r.environmentId)
      },

      requestApproval: (req) => {
        const id = crypto.randomUUID()
        const newReq: ApprovalRequest = {
          ...req,
          id,
          status: 'pending',
          resolvedBy: null,
          resolvedByName: null,
          resolvedAt: null,
          comment: null,
        }
        const historyEntry: ApprovalHistoryEntry = {
          id: crypto.randomUUID(),
          approvalRequestId: id,
          promotionId: req.promotionId,
          action: 'requested',
          actor: req.requestedBy,
          actorName: req.requestedByName,
          role: 'developer',
          comment: '',
          timestamp: new Date().toISOString(),
        }
        set((state) => ({
          approvalRequests: [...state.approvalRequests, newReq],
          approvalHistory: [...state.approvalHistory, historyEntry],
        }))
        return id
      },

      approve: (requestId, approverId, approverName, comment) => {
        const now = new Date().toISOString()
        const member = get().teamMembers.find((m) => m.id === approverId)
        set((state) => ({
          approvalRequests: state.approvalRequests.map((r) =>
            r.id === requestId
              ? { ...r, status: 'approved', resolvedBy: approverId, resolvedByName: approverName, resolvedAt: now, comment: comment ?? null }
              : r
          ),
          approvalHistory: [
            ...state.approvalHistory,
            {
              id: crypto.randomUUID(),
              approvalRequestId: requestId,
              promotionId: state.approvalRequests.find((r) => r.id === requestId)?.promotionId ?? '',
              action: 'approved',
              actor: approverId,
              actorName: approverName,
              role: member?.role ?? 'approver',
              comment: comment ?? '',
              timestamp: now,
            },
          ],
        }))
      },

      reject: (requestId, approverId, approverName, comment) => {
        const now = new Date().toISOString()
        const member = get().teamMembers.find((m) => m.id === approverId)
        set((state) => ({
          approvalRequests: state.approvalRequests.map((r) =>
            r.id === requestId
              ? { ...r, status: 'rejected', resolvedBy: approverId, resolvedByName: approverName, resolvedAt: now, comment: comment ?? null }
              : r
          ),
          approvalHistory: [
            ...state.approvalHistory,
            {
              id: crypto.randomUUID(),
              approvalRequestId: requestId,
              promotionId: state.approvalRequests.find((r) => r.id === requestId)?.promotionId ?? '',
              action: 'rejected',
              actor: approverId,
              actorName: approverName,
              role: member?.role ?? 'approver',
              comment: comment ?? '',
              timestamp: now,
            },
          ],
        }))
      },

      cancelApprovalRequest: (requestId) => {
        const now = new Date().toISOString()
        const req = get().approvalRequests.find((r) => r.id === requestId)
        if (!req) return
        set((state) => ({
          approvalRequests: state.approvalRequests.filter((r) => r.id !== requestId),
          approvalHistory: [
            ...state.approvalHistory,
            {
              id: crypto.randomUUID(),
              approvalRequestId: requestId,
              promotionId: req.promotionId,
              action: 'cancelled',
              actor: req.requestedBy,
              actorName: req.requestedByName,
              role: 'developer',
              comment: 'Solicitação cancelada pelo solicitante',
              timestamp: now,
            },
          ],
        }))
      },

      getPendingRequests: () => {
        return get().approvalRequests.filter((r) => r.status === 'pending')
      },

      getApprovalRequestsForPromotion: (promotionId) => {
        return get().approvalRequests.filter((r) => r.promotionId === promotionId)
      },

      getHistoryForPromotion: (promotionId) => {
        return get()
          .approvalHistory.filter((h) => h.promotionId === promotionId)
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      },

      canUserApprove: (userId, environmentId) => {
        const rule = get().approvalRules.find((r) => r.environmentId === environmentId)
        if (!rule || !rule.requiresApproval) return false
        const member = get().teamMembers.find((m) => m.id === userId)
        if (!member) return false
        if (member.role === 'admin') return true
        if (member.role === 'approver' && rule.approverIds.includes(member.id)) return true
        return false
      },

      getApproversForEnv: (environmentId) => {
        const rule = get().approvalRules.find((r) => r.environmentId === environmentId)
        if (!rule) return []
        return get().teamMembers.filter((m) => rule.approverIds.includes(m.id))
      },
    }),
    {
      name: 'cloudbuilder-approvals',
    }
  )
)
