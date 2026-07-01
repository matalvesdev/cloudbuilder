import { api } from './client'
import type { BudgetAlert, CostAnomaly, CostProjectionPoint, CostHistory } from '@/types/cost.types'

// ─── Cost Record DTO from backend ────────────────────────────────────────

interface CostRecordDTO {
  id?: string
  month: string
  total: number
  breakdown: Record<string, number>
  tenantId?: string
  environmentId?: string
  createdAt?: string
}

const BASE = '/cost'

export const costApi = {
  /**
   * Fetch budget alerts for an environment.
   */
  getBudgetAlerts: (environmentId: string) =>
    api.get<BudgetAlert[]>(`${BASE}/budget-alerts/${environmentId}`),

  /**
   * Fetch cost anomalies for an environment within a lookback window.
   */
  getAnomalies: (environmentId: string, lookbackDays: number = 30) =>
    api.get<CostAnomaly[]>(`${BASE}/anomalies/${environmentId}?lookbackDays=${lookbackDays}`),

  /**
   * Fetch cost projection for an environment over a number of days.
   */
  getProjection: (environmentId: string, projectionDays: number = 30) =>
    api.get<CostProjectionPoint[]>(`${BASE}/projection/${environmentId}?projectionDays=${projectionDays}`),

  /**
   * Fetch cost history records for an environment.
   * Maps backend CostRecordDTO to frontend CostHistory type.
   */
  getCostHistory: async (environmentId: string): Promise<CostHistory[]> => {
    try {
      const data = await api.get<CostRecordDTO[] | CostRecordDTO>(
        `${BASE}/records/${environmentId}`
      )
      if (Array.isArray(data)) {
        return data.map((r) => ({
          month: r.month,
          total: r.total,
          breakdown: r.breakdown ?? {},
        }))
      }
      // Single object response (e.g., paginated wrapper)
      if (data && typeof data === 'object') {
        const records = (data as unknown as Record<string, unknown>).content ?? (data as unknown as Record<string, unknown>).records ?? []
        if (Array.isArray(records)) {
          return records.map((r: CostRecordDTO) => ({
            month: r.month,
            total: r.total,
            breakdown: r.breakdown ?? {},
          }))
        }
      }
      return []
    } catch {
      return []
    }
  },
}
