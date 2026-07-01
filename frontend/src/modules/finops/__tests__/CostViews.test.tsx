import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// Mock cost API
vi.mock('@/api/cost', () => ({
  costApi: {
    getBudgetAlerts: vi.fn(),
    getAnomalies: vi.fn(),
    getProjection: vi.fn(),
  },
}));

// Mock use with all CostState properties needed by components
const mockState = {
  costSummary: {
    totalMonthly: 125000,
    byProvider: { aws: 50000, azure: 45000, gcp: 30000 },
    byService: { EC2: 35000, RDS: 20000, Lambda: 15000, 'Blob Storage': 12000, 'Cloud SQL': 10000 },
    currency: 'BRL',
  },
  costHistory: [
    { month: '2026-04', total: 110000, breakdown: { aws: 48000, azure: 38000, gcp: 24000 } },
    { month: '2026-05', total: 118000, breakdown: { aws: 49000, azure: 42000, gcp: 27000 } },
    { month: '2026-06', total: 125000, breakdown: { aws: 50000, azure: 45000, gcp: 30000 } },
  ],
  optimizations: [
    { id: 'opt1', resourceName: 'web-server-1', resourceType: 'EC2', provider: 'aws', currentCost: 500, estimatedCost: 300, savings: 200, savingsPercent: 40, suggestion: 'Redimensionar', severity: 'high', applied: false },
  ],
  budgetAlerts: [
    { budgetId: 'b1', budgetName: 'Mensal', limitAmount: 5000, spentAmount: 4250, usagePct: 85, severity: 'WARNING', evaluatedAt: '2026-06-20' },
    { budgetId: 'b2', budgetName: 'Anual', limitAmount: 60000, spentAmount: 30000, usagePct: 50, severity: 'OK', evaluatedAt: '2026-06-20' },
  ],
  anomalies: [
    { serviceName: 'EC2', date: '2026-06-19', actualAmount: 3500, expectedAmount: 1520, deviationPct: 130.2, severity: 'HIGH' },
    { serviceName: 'RDS', date: '2026-06-18', actualAmount: 2800, expectedAmount: 1800, deviationPct: 55.5, severity: 'MODERATE' },
  ],
  projection: [
    { date: '2026-07-01', projectedAmount: 5200, lowerBound: 4800, upperBound: 5600 },
    { date: '2026-07-02', projectedAmount: 5250, lowerBound: 4700, upperBound: 5800 },
  ],
  selectedMonth: '2026-06',
  loading: false,
  budgetAlertsLoading: false,
  anomaliesLoading: false,
  projectionLoading: false,
  budgetAlertsError: null,
  anomaliesError: null,
  projectionError: null,
  setSelectedMonth: vi.fn(),
  applyOptimization: vi.fn(),
  totalSavings: () => 200,
  fetchCostData: vi.fn().mockResolvedValue(undefined),
  fetchBudgetAlerts: vi.fn().mockResolvedValue(undefined),
  fetchAnomalies: vi.fn().mockResolvedValue(undefined),
  fetchProjection: vi.fn().mockResolvedValue(undefined),
};

vi.mock('@/store/costStore', () => ({
  useCostStore: vi.fn((selector) => {
    return typeof selector === 'function' ? selector(mockState) : mockState;
  }),
}));

describe('BudgetComparisonView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders budget cards with alert data', async () => {
    const { BudgetComparisonView } = await import('../BudgetComparisonView');
    render(React.createElement(BudgetComparisonView));

    expect(screen.getByText('Mensal')).toBeDefined();
    expect(screen.getByText('Anual')).toBeDefined();
  });

  it('shows usage percentage', async () => {
    const { BudgetComparisonView } = await import('../BudgetComparisonView');
    render(React.createElement(BudgetComparisonView));

    expect(screen.getByText(/85/i)).toBeDefined();
  });
});

describe('CostAnomaliesView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders anomaly list when data exists', async () => {
    const { CostAnomaliesView } = await import('../CostAnomaliesView');
    render(React.createElement(CostAnomaliesView));

    expect(screen.getByText('EC2')).toBeDefined();
    expect(screen.getByText('RDS')).toBeDefined();
  });

  it('shows summary cards', async () => {
    const { CostAnomaliesView } = await import('../CostAnomaliesView');
    render(React.createElement(CostAnomaliesView));

    expect(screen.getByText('Total')).toBeDefined();
    expect(screen.getByText('Críticas')).toBeDefined();
    // "Alta" appears as both a summary label and a severity badge
    expect(screen.getAllByText('Alta').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('Máx. Desvio')).toBeDefined();
  });

  it('shows table header', async () => {
    const { CostAnomaliesView } = await import('../CostAnomaliesView');
    render(React.createElement(CostAnomaliesView));

    expect(screen.getByText('Serviço')).toBeDefined();
    expect(screen.getByText('Severidade')).toBeDefined();
  });
});

describe('CostProjectionChart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', async () => {
    const { CostProjectionChart } = await import('../CostProjectionChart');
    const { container } = render(React.createElement(CostProjectionChart));
    expect(container).toBeDefined();
  });
});

describe('CostModule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', async () => {
    const { CostModule } = await import('../CostModule');
    const { container } = render(React.createElement(CostModule));
    expect(container).toBeDefined();
  });
});
