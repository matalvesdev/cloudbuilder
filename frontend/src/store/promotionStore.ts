import { create } from 'zustand'
import type { Promotion, Approval, PromotionStatus } from '@/types/promotion.types'

interface PromotionState {
  promotions: Promotion[]
  approvals: Approval[]

  addPromotion: (prom: Omit<Promotion, 'id' | 'requestedAt' | 'status'>) => string
  updatePromotionStatus: (id: string, status: PromotionStatus, completedAt?: string) => void
  addApproval: (app: Omit<Approval, 'id' | 'createdAt'>) => void
  getPromotionsByEnvironment: (envId: string) => Promotion[]
  getApprovalsByPromotion: (promotionId: string) => Approval[]
  getPendingApprovals: () => Promotion[]
  getPipeline: () => Promotion[]
}

export const usePromotionStore = create<PromotionState>()((set, get) => ({
  promotions: [],
  approvals: [],

  addPromotion: (prom) => {
    const id = crypto.randomUUID()
    const newProm: Promotion = {
      ...prom,
      id,
      status: 'pending',
      requestedAt: new Date().toISOString(),
    }
    set((state) => ({ promotions: [...state.promotions, newProm] }))
    return id
  },

  updatePromotionStatus: (id, status, completedAt) => {
    set((state) => ({
      promotions: state.promotions.map((p) =>
        p.id === id
          ? { ...p, status, completedAt: completedAt ?? p.completedAt }
          : p
      ),
    }))
  },

  addApproval: (app) => {
    const newApp: Approval = {
      ...app,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }
    set((state) => ({
      approvals: [...state.approvals, newApp],
      promotions: state.promotions.map((p) =>
        p.id === app.promotionId
          ? {
              ...p,
              status: app.status === 'approved' ? 'approved' : 'rejected',
              approvedBy: app.approver,
              approvedAt: new Date().toISOString(),
            }
          : p
      ),
    }))
  },

  getPromotionsByEnvironment: (envId) => {
    return get().promotions.filter(
      (p) => p.sourceEnvId === envId || p.targetEnvId === envId
    )
  },

  getApprovalsByPromotion: (promotionId) => {
    return get().approvals.filter((a) => a.promotionId === promotionId)
  },

  getPendingApprovals: () => {
    return get().promotions.filter(
      (p) => p.status === 'pending' && p.requiresApproval
    )
  },

  getPipeline: () => {
    return [...get().promotions].sort(
      (a, b) => new Date(a.requestedAt).getTime() - new Date(b.requestedAt).getTime()
    )
  },
}))
