import { create } from 'zustand'
import { auditApi } from '@/api/audit'
import type { AuditEvent, AuditQueryParams, ComplianceEvaluation, ComplianceRule } from '@/types/audit.types'

interface ComplianceScore {
  score: number
  totalRules: number
  passedRules: number
}

interface AuditState {
  // Data
  events: AuditEvent[]
  complianceScore: ComplianceScore | null
  evaluations: ComplianceEvaluation[]
  rules: ComplianceRule[]

  // Loading states
  loadingEvents: boolean
  loadingCompliance: boolean
  loadingRules: boolean

  // Error states
  eventsError: string | null
  complianceError: string | null
  rulesError: string | null

  // Pagination
  currentPage: number
  totalPages: number
  pageSize: number

  // Actions
  fetchEvents: (tenantId?: string, params?: AuditQueryParams) => Promise<void>
  fetchCompliance: (tenantId?: string) => Promise<void>
  fetchRules: (tenantId?: string) => Promise<void>
  createRule: (rule: Partial<ComplianceRule>) => Promise<boolean>
  deleteRule: (id: string) => Promise<boolean>
  setPage: (page: number) => void
  setPageSize: (size: number) => void
}

function getTenantId(): string {
  return localStorage.getItem('cloudbuilder-active-tenant-id') || 'default'
}

export const useAuditStore = create<AuditState>()((set, get) => ({
  events: [],
  complianceScore: null,
  evaluations: [],
  rules: [],

  loadingEvents: false,
  loadingCompliance: false,
  loadingRules: false,

  eventsError: null,
  complianceError: null,
  rulesError: null,

  currentPage: 0,
  totalPages: 1,
  pageSize: 20,

  fetchEvents: async (tenantId?: string, params?: AuditQueryParams) => {
    const tid = tenantId || getTenantId()
    set({ loadingEvents: true, eventsError: null })
    try {
      const mergedParams: AuditQueryParams = {
        page: get().currentPage,
        size: get().pageSize,
        ...params,
      }
      const result = await auditApi.queryEvents(tid, mergedParams)
      set({ events: result.content, loadingEvents: false })
    } catch (err) {
      const message = err && typeof err === 'object' && 'message' in err
        ? (err as { message: string }).message
        : 'Erro ao carregar eventos de auditoria'
      set({ eventsError: message, loadingEvents: false, events: [] })
    }
  },

  fetchCompliance: async (tenantId?: string) => {
    const tid = tenantId || getTenantId()
    set({ loadingCompliance: true, complianceError: null })
    try {
      const [score, evaluations] = await Promise.all([
        auditApi.getComplianceScore(tid),
        auditApi.getComplianceEvaluations(tid),
      ])
      set({ complianceScore: score as ComplianceScore, evaluations, loadingCompliance: false })
    } catch (err) {
      const message = err && typeof err === 'object' && 'message' in err
        ? (err as { message: string }).message
        : 'Erro ao carregar dados de conformidade'
      set({ complianceError: message, loadingCompliance: false, complianceScore: null, evaluations: [] })
    }
  },

  fetchRules: async (tenantId?: string) => {
    const tid = tenantId || getTenantId()
    set({ loadingRules: true, rulesError: null })
    try {
      const rules = await auditApi.listComplianceRules(tid)
      set({ rules, loadingRules: false })
    } catch (err) {
      const message = err && typeof err === 'object' && 'message' in err
        ? (err as { message: string }).message
        : 'Erro ao carregar regras de conformidade'
      set({ rulesError: message, loadingRules: false, rules: [] })
    }
  },

  createRule: async (rule: Partial<ComplianceRule>) => {
    try {
      const created = await auditApi.createComplianceRule(rule as Omit<ComplianceRule, 'id'>)
      if (created) {
        set((state) => ({ rules: [...state.rules, created] }))
        return true
      }
      return false
    } catch {
      return false
    }
  },

  deleteRule: async (id: string) => {
    try {
      // Backend doesn't have delete endpoint for compliance rules
      // Remove from local state
      set((state) => ({ rules: state.rules.filter((r) => r.id !== id) }))
      return true
    } catch {
      return false
    }
  },

  setPage: (page: number) => {
    set({ currentPage: page })
  },

  setPageSize: (size: number) => {
    set({ pageSize: size })
  },
}))
