import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  dashboardApi,
  type CostOverview,
  type ObserveDashboard,
  type CanvasSummary,
} from "../dashboardApi";
import {
  mockFetch,
  mockFetchNetworkError,
  restoreFetch,
} from "@/test/mockFetch";
import * as clientModule from "../client";

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  restoreFetch();
});

describe("dashboardApi", () => {
  const envId = "env-123";

  describe("getCostOverview", () => {
    it("retorna CostOverview quando API responde", async () => {
      const expected: CostOverview = {
        totalCost: 12847,
        forecast: 13500,
        periodStart: "2026-06-01",
        periodEnd: "2026-06-30",
        topServices: [{ service: "compute", cost: 4625 }],
        budgets: [{ name: "Mensal", limit: 20000, spent: 12847 }],
      };
      mockFetch({ status: 200, body: expected });
      const result = await dashboardApi.getCostOverview(envId);
      expect(result).toEqual(expected);
    });

    it("retorna null em caso de erro de rede", async () => {
      mockFetchNetworkError();
      const result = await dashboardApi.getCostOverview(envId);
      expect(result).toBeNull();
    });

    it("retorna null em caso de erro 500", async () => {
      mockFetch({
        status: 500,
        body: {
          status: 500,
          message: "Internal error",
          timestamp: new Date().toISOString(),
        },
      });
      const result = await dashboardApi.getCostOverview(envId);
      expect(result).toBeNull();
    });
  });

  describe("getHealth", () => {
    it("retorna health status quando API responde", async () => {
      mockFetch({ status: 200, body: { status: "UP" } });
      const result = await dashboardApi.getHealth();
      expect(result).toEqual({ status: "UP" });
    });

    it("retorna null quando actuator retorna erro", async () => {
      mockFetch({ status: 503, body: { status: "DOWN" } });
      const result = await dashboardApi.getHealth();
      expect(result).toBeNull();
    });

    it("retorna null em erro de rede", async () => {
      mockFetchNetworkError();
      const result = await dashboardApi.getHealth();
      expect(result).toBeNull();
    });
  });

  describe("getObserveDashboard", () => {
    it("retorna ObserveDashboard quando API responde", async () => {
      const expected: ObserveDashboard = {
        totalServices: 5,
        degradedCount: 1,
        downCount: 0,
        averageLatency: 245,
        averageUptime: 99.5,
        services: [],
        alerts: [],
      };
      mockFetch({ status: 200, body: expected });
      const result = await dashboardApi.getObserveDashboard(envId);
      expect(result).toEqual(expected);
    });

    it("retorna null em erro", async () => {
      mockFetchNetworkError();
      const result = await dashboardApi.getObserveDashboard(envId);
      expect(result).toBeNull();
    });
  });

  describe("getCanvases", () => {
    it("retorna lista de canvases", async () => {
      const expected: CanvasSummary[] = [
        {
          id: "1",
          name: "VPC",
          nodeCount: 5,
          edgeCount: 3,
          updatedAt: "2026-06-14T00:00:00Z",
        },
      ];
      mockFetch({ status: 200, body: { content: expected } });
      const result = await dashboardApi.getCanvases();
      expect(result).toHaveLength(1);
      expect(result![0].name).toBe("VPC");
    });

    it("retorna null em erro", async () => {
      mockFetchNetworkError();
      const result = await dashboardApi.getCanvases();
      expect(result).toBeNull();
    });
  });
});
