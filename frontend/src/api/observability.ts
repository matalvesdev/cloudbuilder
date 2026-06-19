import { api } from './client'
import type {
  MetricQueryResult,
  TraceDTO,
  LogEntryDTO,
  AlertRuleDTO,
  IncidentDTO,
  SloDTO,
  MetricQueryParams,
  TraceFilterParams,
  LogSearchParams,
  CreateAlertRuleDTO,
  UpdateAlertRuleDTO,
} from '@/types/observability.types'

const BASE = '/observability'

export const observabilityApi = {
  // Metrics
  queryMetrics: (params: MetricQueryParams) => {
    const searchParams = new URLSearchParams()
    searchParams.set('metricName', params.metricName)
    if (params.startTime) searchParams.set('startTime', String(params.startTime))
    if (params.endTime) searchParams.set('endTime', String(params.endTime))
    if (params.aggregation) searchParams.set('aggregation', params.aggregation)
    return api.get<MetricQueryResult[]>(`${BASE}/metrics/query?${searchParams}`)
  },

  // Traces
  getTraces: (params?: TraceFilterParams) => {
    const searchParams = new URLSearchParams()
    if (params?.startTime) searchParams.set('startTime', String(params.startTime))
    if (params?.endTime) searchParams.set('endTime', String(params.endTime))
    if (params?.onlyErrors) searchParams.set('onlyErrors', 'true')
    const qs = searchParams.toString()
    return api.get<TraceDTO[]>(`${BASE}/traces${qs ? '?' + qs : ''}`)
  },

  getTraceDetail: (traceId: string) =>
    api.get<TraceDTO>(`${BASE}/traces/${traceId}`),

  getErrorTraces: () =>
    api.get<TraceDTO[]>(`${BASE}/traces/errors`),

  // Logs
  searchLogs: (params: LogSearchParams) => {
    const searchParams = new URLSearchParams()
    if (params.query) searchParams.set('query', params.query)
    if (params.level) searchParams.set('level', params.level)
    if (params.startTime) searchParams.set('startTime', String(params.startTime))
    if (params.endTime) searchParams.set('endTime', String(params.endTime))
    if (params.page !== undefined) searchParams.set('page', String(params.page))
    if (params.size !== undefined) searchParams.set('size', String(params.size))
    return api.get<{ content: LogEntryDTO[] }>(`${BASE}/logs?${searchParams}`)
  },

  // Alert Rules
  getAlertRules: () =>
    api.get<AlertRuleDTO[]>(`${BASE}/alert-rules`),

  createAlertRule: (rule: CreateAlertRuleDTO) =>
    api.post<AlertRuleDTO>(`${BASE}/alert-rules`, rule),

  updateAlertRule: (id: string, rule: UpdateAlertRuleDTO) =>
    api.put<AlertRuleDTO>(`${BASE}/alert-rules/${id}`, rule),

  deleteAlertRule: (id: string) =>
    api.delete<void>(`${BASE}/alert-rules/${id}`),

  // Incidents
  getActiveIncidents: () =>
    api.get<IncidentDTO[]>(`${BASE}/incidents?status=OPEN`),

  getIncidentHistory: () =>
    api.get<IncidentDTO[]>(`${BASE}/incidents?status=RESOLVED`),

  acknowledgeIncident: (id: string) =>
    api.post<IncidentDTO>(`${BASE}/incidents/${id}/acknowledge`),

  resolveIncident: (id: string) =>
    api.post<IncidentDTO>(`${BASE}/incidents/${id}/resolve`),

  // SLO
  getSloStatus: () =>
    api.get<SloDTO[]>(`${BASE}/slo`),
}
