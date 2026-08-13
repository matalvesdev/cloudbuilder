import { api } from "./client";

export interface AnalyticsEvent {
  id: string;
  tenantId: string;
  userId: string;
  action: string;
  resource: string;
  timestamp: string;
  metadata: Record<string, any>;
}

export interface AnalyticsSummary {
  totalEvents: number;
  uniqueUsers: number;
  topActions: Array<{ action: string; count: number }>;
  topResources: Array<{ resource: string; count: number }>;
  period: string;
}

export interface AnalyticsMetrics {
  resourceType: string;
  period: string;
  totalCount: number;
  uniqueUsers: number;
  timeline: Array<{ date: string; count: number }>;
}

export interface UsageStats {
  totalUsers: number;
  activeUsers: number;
  totalSessions: number;
  averageSessionDuration: number;
  topFeatures: Array<{ feature: string; usage: number }>;
}

export function getSummary(period: string): Promise<AnalyticsSummary> {
  return api.get(`/analytics/summary?period=${period}`);
}

export function listEvents(): Promise<{
  content: AnalyticsEvent[];
  totalElements: number;
}> {
  return api.get("/analytics/events");
}

export function getMetrics(
  resourceType: string,
  period: string,
): Promise<AnalyticsMetrics> {
  return api.get(`/analytics/metrics/${resourceType}?period=${period}`);
}

export function getUsageStats(): Promise<UsageStats> {
  return api.get("/analytics/usage");
}

export const analyticsApi = {
  getSummary,
  listEvents,
  getMetrics,
  getUsageStats,
};
