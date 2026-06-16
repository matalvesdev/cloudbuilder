export type ProviderType = 'aws' | 'azure' | 'gcp'

export interface CostSummary {
  totalMonthly: number
  byProvider: Record<ProviderType, number>
  byService: Record<string, number>
  currency: string
}

export interface OptimizationSuggestion {
  id: string
  resourceName: string
  resourceType: string
  provider: ProviderType
  currentCost: number
  estimatedCost: number
  savings: number
  savingsPercent: number
  suggestion: string
  severity: 'high' | 'medium' | 'low'
  applied: boolean
}

export interface CostHistory {
  month: string
  total: number
  breakdown: Record<string, number>
}
