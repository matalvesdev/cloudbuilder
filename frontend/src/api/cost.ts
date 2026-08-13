import { api } from "./client";
import type {
  BudgetAlert,
  CostAnomaly,
  CostProjectionPoint,
  CostHistory,
} from "@/types/cost.types";

// ─── Cost Record DTO from backend ────────────────────────────────────────

interface CostRecordDTO {
  id?: string;
  date: string;
  amount: number;
  provider: string;
  serviceName: string;
  currency: string;
  environmentId: string;
  importedAt?: string;
}

export interface BudgetDTO {
  id?: string;
  environmentId: string;
  name: string;
  monthlyLimit: number;
  alertThreshold: number;
  enabled: boolean;
}

export interface CostScenarioDTO {
  id?: string;
  environmentId: string;
  canvasId?: string;
  name: string;
  description: string;
  estimatedCost: number;
  resourceChanges: string;
}

export interface CostOverview {
  totalCost: number;
  forecast: number;
  periodStart: string;
  periodEnd: string;
  topServices: Array<{ service: string; cost: number }>;
  budgets: BudgetDTO[];
}

const BASE = "/cost";

export const costApi = {
  // ─── Overview ─────────────────────────────────────────────────

  getOverview: (environmentId: string, start?: string, end?: string) => {
    const params = new URLSearchParams();
    if (start) params.set("start", start);
    if (end) params.set("end", end);
    const qs = params.toString();
    return api.get<CostOverview>(
      `${BASE}/overview/${environmentId}${qs ? "?" + qs : ""}`,
    );
  },

  // ─── Cost Records ─────────────────────────────────────────────

  getCostHistory: async (environmentId: string): Promise<CostHistory[]> => {
    const records = await api.get<CostRecordDTO[]>(
      `${BASE}/records/${environmentId}`,
    );
    const byMonth = new Map<string, CostHistory>();

    for (const record of records) {
      const month = record.date?.slice(0, 7);
      if (!month || !Number.isFinite(record.amount)) continue;
      const current = byMonth.get(month) ?? {
        month,
        total: 0,
        breakdown: {},
      };
      current.total += record.amount;
      current.breakdown[record.provider] =
        (current.breakdown[record.provider] ?? 0) + record.amount;
      byMonth.set(month, current);
    }

    return [...byMonth.values()].sort((left, right) =>
      left.month.localeCompare(right.month),
    );
  },

  importRecord: (record: {
    environmentId: string;
    provider: string;
    serviceName: string;
    amount: number;
    currency: string;
    date: string;
  }) => api.post<CostRecordDTO>(`${BASE}/records`, record),

  // ─── Budgets ──────────────────────────────────────────────────

  getBudgets: (environmentId: string) =>
    api.get<BudgetDTO[]>(`${BASE}/budgets/${environmentId}`),

  createBudget: (budget: Omit<BudgetDTO, "id">) =>
    api.post<BudgetDTO>(`${BASE}/budgets`, budget),

  // ─── Budget Alerts ────────────────────────────────────────────

  getBudgetAlerts: (environmentId: string) =>
    api.get<BudgetAlert[]>(`${BASE}/budget-alerts/${environmentId}`),

  // ─── Anomaly Detection ────────────────────────────────────────

  getAnomalies: (environmentId: string, lookbackDays: number = 30) =>
    api.get<CostAnomaly[]>(
      `${BASE}/anomalies/${environmentId}?lookbackDays=${lookbackDays}`,
    ),

  // ─── Cost Projection ──────────────────────────────────────────

  getProjection: (environmentId: string, projectionDays: number = 30) =>
    api.get<CostProjectionPoint[]>(
      `${BASE}/projection/${environmentId}?projectionDays=${projectionDays}`,
    ),

  // ─── What-if Scenarios ────────────────────────────────────────

  getScenarios: (environmentId: string) =>
    api.get<CostScenarioDTO[]>(
      `${BASE}/scenarios/environment/${environmentId}`,
    ),

  getScenario: (id: string) =>
    api.get<CostScenarioDTO>(`${BASE}/scenarios/${id}`),

  createScenario: (scenario: Omit<CostScenarioDTO, "id">) =>
    api.post<CostScenarioDTO>(`${BASE}/scenarios`, scenario),

  deleteScenario: (id: string) => api.delete<void>(`${BASE}/scenarios/${id}`),
};
