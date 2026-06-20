export interface AuditEvent {
  id: string
  tenantId: string
  userId: string
  action: string
  resourceType: string
  resourceId: string
  details: string
  ipAddress: string
  timestamp: string
}

export interface ComplianceEvaluation {
  ruleId: string
  ruleName: string
  category: string
  severity: string
  passed: boolean
  message: string
  evaluatedAt: string
}

export interface ComplianceScore {
  score: number
  totalRules: number
  passedRules: number
}

export interface ComplianceRule {
  id: string
  tenantId: string
  name: string
  description: string
  category: string
  severity: string
  ruleType: string
  configJson: string
  enabled: boolean
}

export interface AuditQueryParams {
  userId?: string
  action?: string
  resourceType?: string
  startDate?: string
  endDate?: string
  page?: number
  size?: number
}
