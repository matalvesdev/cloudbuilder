import { describe, it, expect, beforeEach } from "vitest";
import * as fc from "fast-check";
import { useCostStore } from "./costStore";

beforeEach(() => {
  useCostStore.setState({
    costSummary: {
      totalMonthly: 0,
      byProvider: {} as Record<string, number>,
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
  });
});

describe("costStore — property-based", () => {
  it("setSelectedMonth always sets the month", () => {
    fc.assert(
      fc.property(
        fc.constantFrom("2026-01", "2026-06", "2026-12", "2025-03"),
        (month) => {
          useCostStore.getState().setSelectedMonth(month);
          expect(useCostStore.getState().selectedMonth).toBe(month);
        },
      ),
      { numRuns: 200 },
    );
  });

  it("costSummary default has correct shape", () => {
    const summary = useCostStore.getState().costSummary;
    expect(summary).toHaveProperty("totalMonthly");
    expect(summary).toHaveProperty("byProvider");
    expect(summary).toHaveProperty("byService");
    expect(summary).toHaveProperty("currency");
    expect(summary.totalMonthly).toBe(0);
    expect(summary.currency).toBe("USD");
  });

  it("loading toggles via setState", () => {
    fc.assert(
      fc.property(fc.boolean(), (loading) => {
        useCostStore.setState({ loading });
        expect(useCostStore.getState().loading).toBe(loading);
      }),
      { numRuns: 200 },
    );
  });

  it("error string via setState", () => {
    fc.assert(
      fc.property(
        fc.option(fc.string({ minLength: 1, maxLength: 100 })),
        (error) => {
          useCostStore.setState({ error });
          expect(useCostStore.getState().error).toBe(error);
        },
      ),
      { numRuns: 200 },
    );
  });

  it("costHistory replaces the array", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            month: fc.constantFrom("2026-01", "2026-02", "2026-03"),
            total: fc.float({ min: 0, max: 100000, noNaN: true }),
            breakdown: fc.constant({ ec2: 100, s3: 50 }),
          }),
        ),
        (history) => {
          useCostStore.setState({ costHistory: history });
          expect(useCostStore.getState().costHistory).toHaveLength(
            history.length,
          );
        },
      ),
      { numRuns: 200 },
    );
  });

  it("optimizations replaces the array", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            resourceName: fc.string({ minLength: 1, maxLength: 30 }),
            resourceType: fc.string({ minLength: 1, maxLength: 30 }),
            provider: fc.constantFrom("aws", "azure", "gcp"),
            currentCost: fc.float({ min: 0, max: 10000, noNaN: true }),
            estimatedCost: fc.float({ min: 0, max: 10000, noNaN: true }),
            savings: fc.float({ min: 0, max: 50000, noNaN: true }),
            savingsPercent: fc.float({ min: 0, max: 100, noNaN: true }),
            suggestion: fc.string({ minLength: 1, maxLength: 100 }),
            severity: fc.constantFrom("high", "medium", "low"),
            applied: fc.boolean(),
          }),
        ),
        (opts) => {
          useCostStore.setState({ optimizations: opts });
          expect(useCostStore.getState().optimizations).toHaveLength(
            opts.length,
          );
        },
      ),
      { numRuns: 200 },
    );
  });

  it("applyOptimization marks matching id as applied", () => {
    const id = crypto.randomUUID();
    useCostStore.setState({
      optimizations: [
        {
          id,
          resourceName: "i-123",
          resourceType: "ec2",
          provider: "aws",
          currentCost: 200,
          estimatedCost: 100,
          savings: 100,
          savingsPercent: 50,
          suggestion: "downsize",
          severity: "high",
          applied: false,
        },
      ],
    });
    useCostStore.getState().applyOptimization(id);
    const opt = useCostStore.getState().optimizations.find((o) => o.id === id);
    expect(opt?.applied).toBe(true);
  });

  it("totalSavings sums unapplied optimization savings", () => {
    useCostStore.setState({
      optimizations: [
        {
          id: "1",
          resourceName: "a",
          resourceType: "ec2",
          provider: "aws",
          currentCost: 200,
          estimatedCost: 100,
          savings: 100,
          savingsPercent: 50,
          suggestion: "a",
          severity: "high",
          applied: false,
        },
        {
          id: "2",
          resourceName: "b",
          resourceType: "s3",
          provider: "aws",
          currentCost: 300,
          estimatedCost: 100,
          savings: 200,
          savingsPercent: 66,
          suggestion: "b",
          severity: "medium",
          applied: true,
        },
        {
          id: "3",
          resourceName: "c",
          resourceType: "rds",
          provider: "aws",
          currentCost: 100,
          estimatedCost: 50,
          savings: 50,
          savingsPercent: 50,
          suggestion: "c",
          severity: "low",
          applied: false,
        },
      ],
    });
    // Only unapplied: 100 + 50 = 150
    expect(useCostStore.getState().totalSavings()).toBe(150);
  });

  it("budgetAlerts array via setState", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            budgetId: fc.uuid(),
            budgetName: fc.string({ minLength: 1, maxLength: 30 }),
            limitAmount: fc.float({ min: 1, max: 500000, noNaN: true }),
            spentAmount: fc.float({ min: 0, max: 500000, noNaN: true }),
            usagePct: fc.float({ min: 0, max: 200, noNaN: true }),
            severity: fc.constantFrom("WARNING", "CRITICAL", "EXCEEDED"),
            evaluatedAt: fc.constant(new Date().toISOString()),
          }),
        ),
        (alerts) => {
          useCostStore.setState({ budgetAlerts: alerts });
          expect(useCostStore.getState().budgetAlerts).toHaveLength(
            alerts.length,
          );
        },
      ),
      { numRuns: 200 },
    );
  });
});
