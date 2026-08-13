import { create } from "zustand";
import type {
  CostSummary,
  OptimizationSuggestion,
  CostHistory,
  ProviderType,
  BudgetAlert,
  CostAnomaly,
  CostProjectionPoint,
} from "@/types/cost.types";
import { dashboardApi } from "@/api/dashboardApi";
import { costApi } from "@/api/cost";

interface CostState {
  costSummary: CostSummary;
  costHistory: CostHistory[];
  optimizations: OptimizationSuggestion[];
  selectedMonth: string;
  loading: boolean;
  error: string | null;
  budgetAlerts: BudgetAlert[];
  anomalies: CostAnomaly[];
  projection: CostProjectionPoint[];
  budgetAlertsLoading: boolean;
  anomaliesLoading: boolean;
  projectionLoading: boolean;
  budgetAlertsError: string | null;
  anomaliesError: string | null;
  projectionError: string | null;
  setSelectedMonth: (month: string) => void;
  applyOptimization: (id: string) => void;
  totalSavings: () => number;
  fetchCostData: () => Promise<void>;
  fetchCostHistory: (environmentId: string) => Promise<void>;
  fetchBudgetAlerts: (environmentId: string) => Promise<void>;
  fetchAnomalies: (
    environmentId: string,
    lookbackDays?: number,
  ) => Promise<void>;
  fetchProjection: (
    environmentId: string,
    projectionDays?: number,
  ) => Promise<void>;
}

export const useCostStore = create<CostState>((set, get) => ({
  costSummary: {
    totalMonthly: 0,
    byProvider: {} as Record<ProviderType, number>,
    byService: {},
    currency: "USD",
  },
  costHistory: [],
  optimizations: [],
  selectedMonth: "",
  loading: false,
  error: null,
  budgetAlerts: [],
  anomalies: [],
  projection: [],
  budgetAlertsLoading: false,
  anomaliesLoading: false,
  projectionLoading: false,
  budgetAlertsError: null,
  anomaliesError: null,
  projectionError: null,

  setSelectedMonth: (month) => set({ selectedMonth: month }),

  applyOptimization: (id) => {
    set({
      optimizations: get().optimizations.map((opt) =>
        opt.id === id ? { ...opt, applied: true } : opt,
      ),
    });
  },

  totalSavings: () => {
    return get()
      .optimizations.filter((o) => !o.applied)
      .reduce((sum, o) => sum + o.savings, 0);
  },

  fetchCostHistory: async (environmentId: string) => {
    set({ loading: true, error: null });
    try {
      const records = await costApi.getCostHistory(environmentId);
      set({ costHistory: records, loading: false });
    } catch (err) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? (err as { message: string }).message
          : "Erro ao carregar histórico de custos";
      set({ error: msg, costHistory: [], loading: false });
    }
  },

  fetchCostData: async () => {
    const envId =
      localStorage.getItem("cloudbuilder-active-environment") || "default";
    set({ loading: true, error: null });
    try {
      const overview = await dashboardApi.getCostOverview(envId);
      if (overview && overview.totalCost !== undefined) {
        set({
          costSummary: {
            totalMonthly: overview.totalCost,
            byProvider: {} as Record<ProviderType, number>,
            byService: overview.topServices
              ? Object.fromEntries(
                  overview.topServices.map((s) => [s.service, s.cost]),
                )
              : {},
            currency: "USD",
          },
        });
      } else {
        set({ error: "Nenhum dado de custo disponível para este ambiente" });
      }
    } catch (err) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? (err as { message: string }).message
          : "Erro ao carregar dados de custo";
      set({ error: msg });
    } finally {
      set({ loading: false });
    }
  },

  fetchBudgetAlerts: async (environmentId: string) => {
    set({ budgetAlertsLoading: true, budgetAlertsError: null });
    try {
      const data = await costApi.getBudgetAlerts(environmentId);
      set({ budgetAlerts: data ?? [] });
    } catch (err) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? (err as { message: string }).message
          : "Erro ao carregar alertas de orçamento";
      set({ budgetAlertsError: msg, budgetAlerts: [] });
    } finally {
      set({ budgetAlertsLoading: false });
    }
  },

  fetchAnomalies: async (environmentId: string, lookbackDays = 30) => {
    set({ anomaliesLoading: true, anomaliesError: null });
    try {
      const data = await costApi.getAnomalies(environmentId, lookbackDays);
      set({ anomalies: data ?? [] });
    } catch (err) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? (err as { message: string }).message
          : "Erro ao carregar anomalias de custo";
      set({ anomaliesError: msg, anomalies: [] });
    } finally {
      set({ anomaliesLoading: false });
    }
  },

  fetchProjection: async (environmentId: string, projectionDays = 30) => {
    set({ projectionLoading: true, projectionError: null });
    try {
      const data = await costApi.getProjection(environmentId, projectionDays);
      set({ projection: data ?? [] });
    } catch (err) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? (err as { message: string }).message
          : "Erro ao carregar projeção de custos";
      set({ projectionError: msg, projection: [] });
    } finally {
      set({ projectionLoading: false });
    }
  },
}));
