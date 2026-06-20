import { api } from './client'
import type { BudgetAlert, CostAnomaly, CostProjectionPoint } from '@/types/cost.types'

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
}
