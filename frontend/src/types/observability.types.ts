export interface MetricQueryResult {
  timestamp: string
  value: number
  tags: Record<string, string>
}

export interface SpanDTO {
  spanId: string
  operation: string
  serviceName: string
  startTime: number
  durationMs: number
  statusCode: number
  status: string
  parentSpanId?: string
}

export interface TraceDTO {
  traceId: string
  serviceName: string
  operation: string
  startTime: number
  durationMs: number
  statusCode: number
  isError: boolean
  spans: SpanDTO[]
}

export interface LogEntryDTO {
  tenantId: string
  timestamp: string
  level: string
  loggerName: string
  threadName: string
  message: string
  traceId: string | null
  spanId: string | null
  stackTrace: string | null
  structured: string | null
}

export interface AlertRuleDTO {
  id: string
  tenantId: string
  name: string
  description: string | null
  metricName: string
  condition: string
  threshold: number
  durationSec: number
  severity: string
  enabled: boolean
  notifyChannels: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateAlertRuleDTO {
  name: string
  description?: string
  metricName: string
  condition: string
  threshold: number
  durationSec: number
  severity: string
  enabled: boolean
  notifyChannels?: string
}

export interface UpdateAlertRuleDTO {
  name: string
  description?: string
  metricName: string
  condition: string
  threshold: number
  durationSec: number
  severity: string
  enabled: boolean
  notifyChannels?: string
}

export interface IncidentDTO {
  id: string
  alertRuleId: string | null
  tenantId: string
  title: string
  description: string | null
  severity: string
  status: string
  currentValue: number | null
  threshold: number | null
  startedAt: string
  acknowledgedAt: string | null
  resolvedAt: string | null
}

export interface SloDTO {
  id: string
  name: string
  sliType: string
  targetPct: number
  currentSliPct: number
  errorBudgetPct: number
  status: string
}

export interface DashboardDTO {
  id: string
  name: string
  description: string | null
  definition: string | null
  isDefault: boolean
}

export interface MetricQueryParams {
  metricName: string
  startTime?: number
  endTime?: number
  aggregation?: string
}

export interface TraceFilterParams {
  startTime?: number
  endTime?: number
  onlyErrors?: boolean
}

export interface LogSearchParams {
  query?: string
  level?: string
  startTime?: number
  endTime?: number
  page?: number
  size?: number
}
