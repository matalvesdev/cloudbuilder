import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// Mock audit API
vi.mock('@/api/audit', () => ({
  auditApi: {
    queryEvents: vi.fn().mockResolvedValue([]),
    getComplianceScore: vi.fn().mockResolvedValue(null),
    getEvaluations: vi.fn().mockResolvedValue([]),
    exportCsv: vi.fn(),
    exportJson: vi.fn(),
  },
}));

// Mock useAuditStore with correct AuditState property names
const mockState = {
  events: [
    { id: 'e1', tenantId: 'tenant-1', userId: 'joao', action: 'CREATE', resourceType: 'Canvas', resourceId: 'res-1', details: 'Criou design VPC', ipAddress: '10.0.0.1', timestamp: '2026-06-20T10:00:00Z' },
    { id: 'e2', tenantId: 'tenant-1', userId: 'maria', action: 'DEPLOY', resourceType: 'Environment', resourceId: 'res-2', details: 'Fez deploy para staging', ipAddress: '10.0.0.2', timestamp: '2026-06-20T09:00:00Z' },
  ],
  complianceScore: { score: 50, totalRules: 2, passedRules: 1 },
  evaluations: [
    { ruleId: 'r1', ruleName: 'Login monitorado', category: 'SECURITY', severity: 'HIGH', passed: true, message: 'Pattern matched', evaluatedAt: '2026-06-20T10:00:00Z' },
    { ruleId: 'r2', ruleName: 'Deploy auditado', category: 'OPERATIONS', severity: 'MEDIUM', passed: false, message: 'No matching events', evaluatedAt: '2026-06-20T10:00:00Z' },
  ],
  rules: [
    { id: 'r1', name: 'Login monitorado', category: 'SECURITY', severity: 'HIGH', enabled: true, configJson: '{}' },
    { id: 'r2', name: 'Deploy auditado', category: 'OPERATIONS', severity: 'MEDIUM', enabled: true, configJson: '{}' },
  ],
  loadingEvents: false,
  loadingCompliance: false,
  loadingRules: false,
  eventsError: null,
  complianceError: null,
  rulesError: null,
  currentPage: 1,
  totalPages: 1,
  pageSize: 10,
  fetchEvents: vi.fn().mockResolvedValue(undefined),
  fetchCompliance: vi.fn().mockResolvedValue(undefined),
  fetchRules: vi.fn().mockResolvedValue(undefined),
  createRule: vi.fn().mockResolvedValue(true),
  deleteRule: vi.fn().mockResolvedValue(true),
  setPage: vi.fn(),
  setPageSize: vi.fn(),
};

vi.mock('@/store/auditStore', () => ({
  useAuditStore: vi.fn((selector) => {
    return typeof selector === 'function' ? selector(mockState) : mockState;
  }),
}));

describe('AuditTimelineView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders timeline header', async () => {
    const { AuditTimelineView } = await import('../AuditTimelineView');
    render(React.createElement(AuditTimelineView));

    expect(screen.getByText('Timeline de Auditoria')).toBeDefined();
  });

  it('renders export buttons', async () => {
    const { AuditTimelineView } = await import('../AuditTimelineView');
    render(React.createElement(AuditTimelineView));

    expect(screen.getByText('Exportar CSV')).toBeDefined();
    expect(screen.getByText('Exportar JSON')).toBeDefined();
  });
});

describe('ComplianceDashboardView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders compliance view elements', async () => {
    const { ComplianceDashboardView } = await import('../ComplianceDashboardView');
    render(React.createElement(ComplianceDashboardView));

    expect(screen.getByText('Painel de Conformidade')).toBeDefined();

    // Rule names appear in both evaluations and rules tables
    expect(screen.getAllByText('Login monitorado').length).toBe(2);
    expect(screen.getAllByText('Deploy auditado').length).toBe(2);
  });
});

describe('AuditModule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', async () => {
    const { AuditModule } = await import('../AuditModule');
    const { container } = render(React.createElement(AuditModule));
    expect(container).toBeDefined();
  });
});
