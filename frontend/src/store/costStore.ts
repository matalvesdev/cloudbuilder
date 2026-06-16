import { create } from 'zustand'
import type { CostSummary, OptimizationSuggestion, CostHistory, ProviderType } from '@/types/cost.types'
import { dashboardApi } from '@/api/dashboardApi'

const mockHistory: CostHistory[] = [
  { month: 'Jan', total: 11200, breakdown: { aws: 5600, azure: 3360, gcp: 2240 } },
  { month: 'Fev', total: 11580, breakdown: { aws: 5790, azure: 3474, gcp: 2316 } },
  { month: 'Mar', total: 11950, breakdown: { aws: 5975, azure: 3585, gcp: 2390 } },
  { month: 'Abr', total: 12400, breakdown: { aws: 6200, azure: 3720, gcp: 2480 } },
  { month: 'Mai', total: 12650, breakdown: { aws: 6325, azure: 3795, gcp: 2530 } },
  { month: 'Jun', total: 12847, breakdown: { aws: 6423, azure: 3854, gcp: 2570 } },
]

const mockSummary: CostSummary = {
  totalMonthly: 12847,
  byProvider: { aws: 6423, azure: 3854, gcp: 2570 },
  byService: {
    compute: 4625,
    storage: 2826,
    database: 2570,
    network: 1542,
    outros: 1284,
  },
  currency: 'USD',
}

const mockOptimizations: OptimizationSuggestion[] = [
  {
    id: 'opt-1',
    resourceName: 'ec2-webapp',
    resourceType: 'compute',
    provider: 'aws',
    currentCost: 132,
    estimatedCost: 45,
    savings: 87,
    savingsPercent: 66,
    suggestion: 'Reduza de t3.xlarge para t3.medium — utilização atual de 15%',
    severity: 'high',
    applied: false,
  },
  {
    id: 'opt-2',
    resourceName: 'rds-database',
    resourceType: 'database',
    provider: 'aws',
    currentCost: 98,
    estimatedCost: 49,
    savings: 49,
    savingsPercent: 50,
    suggestion: 'Desabilite Multi-AZ — alta disponibilidade não necessária para o ambiente',
    severity: 'high',
    applied: false,
  },
  {
    id: 'opt-3',
    resourceName: 'nat-gateway',
    resourceType: 'network',
    provider: 'aws',
    currentCost: 32,
    estimatedCost: 0,
    savings: 32,
    savingsPercent: 100,
    suggestion: 'Remova o NAT Gateway — sem tráfego nos últimos 30 dias',
    severity: 'high',
    applied: false,
  },
  {
    id: 'opt-4',
    resourceName: 's3-logs',
    resourceType: 'storage',
    provider: 'aws',
    currentCost: 24,
    estimatedCost: 6,
    savings: 18,
    savingsPercent: 75,
    suggestion: 'Aplique política de ciclo de vida para mover para Glacier após 30 dias',
    severity: 'medium',
    applied: false,
  },
  {
    id: 'opt-5',
    resourceName: 'lb-frontend',
    resourceType: 'network',
    provider: 'azure',
    currentCost: 72,
    estimatedCost: 31,
    savings: 41,
    savingsPercent: 57,
    suggestion: 'Reduza de Standard para Basic SKU — throughput atual é de 20 MB/s',
    severity: 'medium',
    applied: false,
  },
]

interface CostState {
  costSummary: CostSummary
  costHistory: CostHistory[]
  optimizations: OptimizationSuggestion[]
  selectedMonth: string
  loading: boolean
  setSelectedMonth: (month: string) => void
  applyOptimization: (id: string) => void
  totalSavings: () => number
  fetchCostData: () => Promise<void>
}

export const useCostStore = create<CostState>((set, get) => ({
  costSummary: mockSummary,
  costHistory: mockHistory,
  optimizations: mockOptimizations,
  selectedMonth: mockHistory[mockHistory.length - 1].month,
  loading: false,

  setSelectedMonth: (month) => set({ selectedMonth: month }),

  applyOptimization: (id) => {
    set({
      optimizations: get().optimizations.map((opt) =>
        opt.id === id ? { ...opt, applied: true } : opt
      ),
    })
  },

  totalSavings: () => {
    return get().optimizations
      .filter((o) => !o.applied)
      .reduce((sum, o) => sum + o.savings, 0)
  },

  fetchCostData: async () => {
    const envId = localStorage.getItem('cloudbuilder-active-environment') || 'default'
    set({ loading: true })
    try {
      const overview = await dashboardApi.getCostOverview(envId)
      if (overview && overview.totalCost !== undefined) {
        set((state) => ({
          costSummary: {
            totalMonthly: overview.totalCost,
            // API n~ao retorna breakdown por provider; mantém o existente
            byProvider: state.costSummary.byProvider,
            byService: overview.topServices
              ? Object.fromEntries(overview.topServices.map((s) => [s.service, s.cost]))
              : state.costSummary.byService,
            currency: state.costSummary.currency,
          },
        }))
      }
    } catch {
      // fallback silencioso — mock data continua sendo exibido
    } finally {
      set({ loading: false })
    }
  },
}))
