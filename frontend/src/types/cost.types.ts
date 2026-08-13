export type ProviderType =
  "aws" | "azure" | "gcp" | "vercel" | "supabase" | "render";

export interface CostSummary {
  totalMonthly: number;
  byProvider: Record<ProviderType, number>;
  byService: Record<string, number>;
  currency: string;
}

export interface OptimizationSuggestion {
  id: string;
  resourceName: string;
  resourceType: string;
  provider: ProviderType;
  currentCost: number;
  estimatedCost: number;
  savings: number;
  savingsPercent: number;
  suggestion: string;
  severity: "high" | "medium" | "low";
  applied: boolean;
}

export interface CostHistory {
  month: string;
  total: number;
  breakdown: Record<string, number>;
}

export interface CostAnomaly {
  serviceName: string;
  date: string;
  actualAmount: number;
  expectedAmount: number;
  deviationPct: number;
  severity: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
}

export interface CostProjectionPoint {
  date: string;
  projectedAmount: number;
  lowerBound: number;
  upperBound: number;
}

export interface BudgetAlert {
  budgetId: string;
  budgetName: string;
  limitAmount: number;
  spentAmount: number;
  usagePct: number;
  severity: "WARNING" | "CRITICAL" | "EXCEEDED";
  evaluatedAt: string;
}

export interface CostForecast {
  id: string;
  predictedAmount: number;
  lowerBound: number;
  upperBound: number;
  period: string;
  forecastDate: string;
}
