import { api } from './client'

export interface Role {
  id: string
  name: string
  permissions: string[]
}

export interface TenantUser {
  id: string
  userId: string
  tenantId: string
  roles: string[]
}

export interface Permission {
  id: string
  name: string
  resource: string
  action: string
}

export interface Tenant {
  id: string
  name: string
  slug: string
  plan: string
}

export interface MfaConfig {
  enabled: boolean
  method: string
  backupCodes: string[]
}

export interface UserSession {
  id: string
  userId: string
  token: string
  ipAddress: string
  userAgent: string
  expiresAt: string
  createdAt: string
}

export interface PermissionMatrixEntry {
  role: string
  resource: string
  permissions: string[]
}

export function listUsers(): Promise<any[]> {
  return api.get('/iam/users')
}

export function getUser(id: string): Promise<any> {
  return api.get(`/iam/users/${id}`)
}

export function listRoles(): Promise<Role[]> {
  return api.get('/iam/roles')
}

export function listPermissions(): Promise<Permission[]> {
  return api.get('/iam/permissions')
}

export function listTenants(): Promise<Tenant[]> {
  return api.get('/iam/tenants')
}

export function getMfaConfig(): Promise<MfaConfig> {
  return api.get('/iam/mfa')
}

export function enableMfa(): Promise<MfaConfig> {
  return api.post('/iam/mfa/enable')
}

export function disableMfa(): Promise<void> {
  return api.post('/iam/mfa/disable')
}

export function listSessions(): Promise<UserSession[]> {
  return api.get('/iam/sessions')
}

export function revokeSession(id: string): Promise<void> {
  return api.delete(`/iam/sessions/${id}`)
}

export function getPermissionMatrix(): Promise<PermissionMatrixEntry[]> {
  return api.get('/iam/permission-matrix')
}

export const iamApi = {
  listUsers,
  getUser,
  listRoles,
  listPermissions,
  listTenants,
  getMfaConfig,
  enableMfa,
  disableMfa,
  listSessions,
  revokeSession,
  getPermissionMatrix,
}
