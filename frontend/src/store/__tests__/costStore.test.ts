import { describe, it, expect, beforeEach, vi } from "vitest";
import { useCostStore } from "../costStore";

beforeEach(() => {
  useCostStore.setState({
    costSummary: {
      totalMonthly: 0,
      byProvider: {
        aws: 0,
        azure: 0,
        gcp: 0,
        vercel: 0,
        supabase: 0,
        render: 0,
      },
      byService: {},
      currency: "USD",
    },
    costHistory: [],
    optimizations: [],
    selectedMonth: "",
    loading: false,
  });
});

describe("costStore", () => {
  describe("setSelectedMonth", () => {
    it("atualiza o mês selecionado", () => {
      useCostStore.getState().setSelectedMonth("Jun");
      expect(useCostStore.getState().selectedMonth).toBe("Jun");
    });
  });

  describe("applyOptimization", () => {
    it("marca otimização como aplicada", () => {
      useCostStore.setState({
        optimizations: [
          {
            id: "opt-1",
            resourceName: "test",
            resourceType: "compute",
            provider: "aws",
            currentCost: 100,
            estimatedCost: 50,
            savings: 50,
            savingsPercent: 50,
            suggestion: "Reduza",
            severity: "high",
            applied: false,
          },
        ],
      });

      useCostStore.getState().applyOptimization("opt-1");
      expect(useCostStore.getState().optimizations[0].applied).toBe(true);
    });

    it("não altera otimizações com id diferente", () => {
      useCostStore.setState({
        optimizations: [
          {
            id: "opt-1",
            resourceName: "a",
            resourceType: "compute",
            provider: "aws",
            currentCost: 100,
            estimatedCost: 50,
            savings: 50,
            savingsPercent: 50,
            suggestion: "x",
            severity: "high",
            applied: false,
          },
          {
            id: "opt-2",
            resourceName: "b",
            resourceType: "compute",
            provider: "aws",
            currentCost: 200,
            estimatedCost: 100,
            savings: 100,
            savingsPercent: 50,
            suggestion: "y",
            severity: "high",
            applied: false,
          },
        ],
      });

      useCostStore.getState().applyOptimization("opt-1");
      const optimizations = useCostStore.getState().optimizations;
      expect(optimizations[0].applied).toBe(true);
      expect(optimizations[1].applied).toBe(false);
    });
  });

  describe("totalSavings", () => {
    it("soma savings de otimizações não aplicadas", () => {
      useCostStore.setState({
        optimizations: [
          {
            id: "opt-1",
            resourceName: "a",
            resourceType: "compute",
            provider: "aws",
            currentCost: 100,
            estimatedCost: 50,
            savings: 50,
            savingsPercent: 50,
            suggestion: "x",
            severity: "high",
            applied: false,
          },
          {
            id: "opt-2",
            resourceName: "b",
            resourceType: "compute",
            provider: "aws",
            currentCost: 200,
            estimatedCost: 100,
            savings: 100,
            savingsPercent: 50,
            suggestion: "y",
            severity: "high",
            applied: true,
          },
        ],
      });

      expect(useCostStore.getState().totalSavings()).toBe(50);
    });

    it("retorna 0 se todas aplicadas", () => {
      useCostStore.setState({
        optimizations: [
          {
            id: "opt-1",
            resourceName: "a",
            resourceType: "compute",
            provider: "aws",
            currentCost: 100,
            estimatedCost: 50,
            savings: 50,
            savingsPercent: 50,
            suggestion: "x",
            severity: "high",
            applied: true,
          },
        ],
      });

      expect(useCostStore.getState().totalSavings()).toBe(0);
    });
  });

  describe("fetchCostData (API integration)", () => {
    beforeEach(() => {
      localStorage.setItem("cloudbuilder-active-environment", "env-test");
    });

    it("atualiza costSummary quando API retorna dados", async () => {
      const mockDashboardApi = await import("@/api/dashboardApi");
      vi.spyOn(
        mockDashboardApi.dashboardApi,
        "getCostOverview",
      ).mockResolvedValue({
        totalCost: 5000,
        forecast: 5500,
        periodStart: "2026-01-01",
        periodEnd: "2026-01-31",
        topServices: [{ service: "compute", cost: 3000 }],
        budgets: [],
      });

      await useCostStore.getState().fetchCostData();
      const state = useCostStore.getState();
      expect(state.costSummary.totalMonthly).toBe(5000);
      expect(state.costSummary.byService.compute).toBe(3000);
    });

    it("mantém mock data quando API falha", async () => {
      const mockDashboardApi = await import("@/api/dashboardApi");
      vi.spyOn(
        mockDashboardApi.dashboardApi,
        "getCostOverview",
      ).mockRejectedValue(new Error("Network error"));

      useCostStore.setState({
        costSummary: {
          totalMonthly: 12847,
          byProvider: {
            aws: 6423,
            azure: 3854,
            gcp: 2570,
            vercel: 0,
            supabase: 0,
            render: 0,
          },
          byService: { compute: 3000 },
          currency: "USD",
        },
      });

      await useCostStore.getState().fetchCostData();
      expect(useCostStore.getState().costSummary.totalMonthly).toBe(12847);
    });

    it("atualiza loading state durante e após fetch", async () => {
      const mockDashboardApi = await import("@/api/dashboardApi");
      vi.spyOn(
        mockDashboardApi.dashboardApi,
        "getCostOverview",
      ).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  totalCost: 5000,
                  forecast: 5500,
                  periodStart: "",
                  periodEnd: "",
                  topServices: [],
                  budgets: [],
                }),
              10,
            ),
          ),
      );

      const fetchPromise = useCostStore.getState().fetchCostData();
      expect(useCostStore.getState().loading).toBe(true);
      await fetchPromise;
      expect(useCostStore.getState().loading).toBe(false);
    });

    it("usa environment do localStorage", async () => {
      localStorage.setItem("cloudbuilder-active-environment", "env-custom");
      const mockDashboardApi = await import("@/api/dashboardApi");
      const spy = vi
        .spyOn(mockDashboardApi.dashboardApi, "getCostOverview")
        .mockResolvedValue({
          totalCost: 100,
          forecast: 110,
          periodStart: "",
          periodEnd: "",
          topServices: [],
          budgets: [],
        });

      await useCostStore.getState().fetchCostData();
      expect(spy).toHaveBeenCalledWith("env-custom");
    });
  });
});
