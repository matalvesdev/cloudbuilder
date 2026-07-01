export type ReplicationResourceType = 'rds' | 's3' | 'route53';

export type AutoTestSchedule = 'weekly' | 'monthly' | 'none';

export type DrStatus = 'active' | 'inactive' | 'degraded';

export type DrTestStatus = 'success' | 'failed';

export interface ReplicationResource {
  type: ReplicationResourceType;
  sourceName: string;
  targetName: string;
  status: DrStatus;
}

export interface DRConfig {
  id: string;
  environmentId: string;
  primaryRegion: string;
  secondaryRegion: string;
  replicationResources: ReplicationResource[];
  rto_seconds: number;
  rpo_seconds: number;
  autoTestSchedule: AutoTestSchedule;
  status: DrStatus;
  lastTestDate: string | null;
  complianceStatus: 'compliant' | 'non_compliant' | 'unknown';
  createdAt: string;
}

export interface DRTestResult {
  id: string;
  configId: string;
  testedAt: string;
  rto_actual: number;
  rpo_actual: number;
  status: DrTestStatus;
  details: string[];
  duration_seconds: number;
}

export interface FailoverSimulationStep {
  step: number;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  duration_seconds: number;
}
