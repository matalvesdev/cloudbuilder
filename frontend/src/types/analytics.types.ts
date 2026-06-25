export interface AnalyticsEvent {
  id: string
  eventType: string
  userId: string
  tenantId: string
  module: string
  action: string
  resourceType?: string
  resourceId?: string
  metadata?: Record<string, unknown>
  timestamp: string
  sessionId?: string
}

export interface ModuleUsage {
  module: string
  events: number
  percentage: number
}

export interface UserActivity {
  email: string
  sessions: number
  lastActivity: string
  actions: number
}

export interface FeatureAdoption {
  feature: string
  adoptionRate: number
  trend: 'up' | 'down' | 'stable'
  users: number
}


