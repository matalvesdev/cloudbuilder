export type EphemeralStatus = 'creating' | 'active' | 'destroying' | 'destroyed';

export type ResourceSize = 'small' | 'medium' | 'large';

export interface EphemeralEnv {
  id: string;
  name: string;
  repoId: string;
  branchName: string;
  prNumber: number | null;
  prUrl: string | null;
  sourceEnvId: string;
  baseUrl: string | null;
  status: EphemeralStatus;
  ttl_hours: number;
  createdAt: string;
  expiresAt: string;
  cost: number;
  resources: EphemeralResource[];
}

export interface EphemeralResource {
  type: string;
  size: ResourceSize;
  name: string;
}

export interface EphemeralCreateRequest {
  name: string;
  repoId: string;
  branchName: string;
  prNumber?: number;
  prUrl?: string;
  sourceEnvId: string;
  ttl_hours: number;
  resourceSize: ResourceSize;
}
