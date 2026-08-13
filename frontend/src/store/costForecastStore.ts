import { create } from "zustand";
import { costApi } from "@/api/cost";
import type { CostForecast, BudgetAlert } from "@/types/cost.types";

interface CostForecastState {
  // Data
  forecasts: CostForecast[];
  budgets: BudgetAlert[];

  // Loading states
  forecastsLoading: boolean;
  budgetsLoading: boolean;

  // Error states
  forecastsError: string | null;
  budgetsError: string | null;

  // Actions
  fetchForecasts: (environmentId: string) => Promise<void>;
  fetchBudgets: (environmentId: string) => Promise<void>;
  addBudget: (budget: {
    name: string;
    budgetAmount: number;
    period: string;
    warningThreshold: number;
    criticalThreshold: number;
  }) => void;
}

export const useCostForecastStore = create<CostForecastState>()((set, get) => ({
  // Initial state
  forecasts: [],
  budgets: [],
  forecastsLoading: false,
  budgetsLoading: false,
  forecastsError: null,
  budgetsError: null,

  fetchForecasts: async (environmentId: string) => {
    set({ forecastsLoading: true, forecastsError: null });
    try {
      const data = await costApi.getProjection(environmentId, 30);
      const forecasts: CostForecast[] = (data ?? []).map((p, i) => ({
        id: `forecast-${i + 1}`,
        predictedAmount: p.projectedAmount,
        lowerBound: p.lowerBound ?? p.projectedAmount * 0.9,
        upperBound: p.upperBound ?? p.projectedAmount * 1.1,
        period: p.date,
        forecastDate: p.date,
      }));
      set({ forecasts, forecastsLoading: false });
    } catch (err) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? (err as { message: string }).message
          : "Erro ao carregar projeções de custo";
      set({ forecastsError: msg, forecastsLoading: false, forecasts: [] });
    }
  },

  fetchBudgets: async (environmentId: string) => {
    set({ budgetsLoading: true, budgetsError: null });
    try {
      const budgets = await costApi.getBudgetAlerts(environmentId);
      set({ budgets: budgets ?? [], budgetsLoading: false });
    } catch (err) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? (err as { message: string }).message
          : "Erro ao carregar alertas de orçamento";
      set({ budgetsError: msg, budgetsLoading: false, budgets: [] });
    }
  },

  addBudget: (budget) => {
    const budgetAlert: BudgetAlert = {
      budgetId: `budget-${crypto.randomUUID()}`,
      budgetName: budget.name,
      limitAmount: budget.budgetAmount,
      spentAmount: 0,
      usagePct: 0,
      severity: "WARNING",
      evaluatedAt: new Date().toISOString(),
    };
    set({ budgets: [...get().budgets, budgetAlert] });
  },
}));
