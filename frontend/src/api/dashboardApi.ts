import { api, getToken } from "./client";
import type { ActivityEvent } from "@/types/activity.types";

// ─── Types matching backend DTOs ───────────────────────────────────────

export interface SystemHealth {
  status: "UP" | "DOWN" | "DEGRADED";
  components?: Record<string, { status: string }>;
}

export interface ResourceUsage {
  cpu: number;
  memory: number;
  storage: number;
  activeConnections: number;
}

export interface ObserveDashboard {
  totalServices: number;
  degradedCount: number;
  downCount: number;
  averageLatency: number;
  averageUptime: number;
  services: ServiceHealthItem[];
  alerts: AlertItem[];
}

export interface ServiceHealthItem {
  serviceName: string;
  status: string;
  latencyMs: number;
  uptimePercent: number;
  lastChecked: string;
}

export interface AlertItem {
  id: string;
  severity: string;
  message: string;
  serviceName: string;
  timestamp: string;
  resolved: boolean;
}

export interface CostOverview {
  totalCost: number;
  forecast: number;
  periodStart: string;
  periodEnd: string;
  topServices: Array<{ service: string; cost: number }>;
  budgets: Array<{ name: string; limit: number; spent: number }>;
}

export interface CanvasSummary {
  id: string;
  name: string;
  nodeCount: number;
  edgeCount: number;
  updatedAt: string;
}

// ─── Dashboard API service ──────────────────────────────────────────────

class DashboardApiService {

  /**
   * Fetch system health from Spring Boot Actuator (public endpoint, no tenant needed).
   */
  async getHealth(): Promise<SystemHealth | null> {
    try {
      const baseUrl =
        import.meta.env.VITE_API_URL?.replace("/api/v1", "") ||
        "http://localhost:8080";
      const response = await fetch(`${baseUrl}/actuator/health`, {
        headers: { Accept: "application/json" },
      });
      if (!response.ok) return null;
      return await response.json();
    } catch {
      return null;
    }
  }

  /**
   * Fetch observe dashboard for an environment (tenant-aware).
   */
  async getObserveDashboard(
    environmentId: string,
  ): Promise<ObserveDashboard | null> {
    try {
      return await api.get<ObserveDashboard>(
        `/observe/dashboard/${environmentId}`,
      );
    } catch {
      return null;
    }
  }

  /**
   * Fetch cost overview for an environment (tenant-aware).
   */
  async getCostOverview(environmentId: string): Promise<CostOverview | null> {
    try {
      return await api.get<CostOverview>(`/cost/overview/${environmentId}`);
    } catch {
      return null;
    }
  }

  /**
   * List all canvases for the current tenant.
   */
  async getCanvases(): Promise<CanvasSummary[] | null> {
    try {
      const data = await api.get<{ content: CanvasSummary[] }>("/canvases");
      return data.content ?? null;
    } catch {
      return null;
    }
  }
}

export const dashboardApi = new DashboardApiService();
