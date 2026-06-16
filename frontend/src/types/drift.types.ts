export type DriftType = 'MODIFIED' | 'ADDED' | 'REMOVED'
export type DriftSeverity = 'CRITICAL' | 'MODERATE' | 'INFO'
export type DriftStatus = 'DETECTED' | 'ACCEPTED' | 'REMEDIATED' | 'IGNORED'
export type ChangeType = 'CREATED' | 'UPDATED' | 'DELETED'

export interface PropertyChange {
  property: string
  expectedValue: string
  actualValue: string
  changeType: ChangeType
}

export interface DriftResource {
  id: string
  resourceName: string
  resourceType: string
  provider: string
  driftType: DriftType
  severity: DriftSeverity
  propertyChanges: PropertyChange[]
  detectedAt: string
  status: DriftStatus
  nodeId?: string
}

export interface DriftSummary {
  add: number
  change: number
  destroy: number
}

export interface DriftReport {
  id: string
  environmentId: string
  canvasId: string
  canvasVersion: number
  resources: DriftResource[]
  summary: DriftSummary
  detectedAt: string
  resolvedAt: string | null
  status: DriftStatus
}

export interface DriftTimelineEvent {
  id: string
  resourceName: string
  driftType: DriftType
  detectedAt: string
  status: DriftStatus
}
