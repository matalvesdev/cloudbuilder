import { api } from './client'

export interface Role {
  id: string
  name: string
  description?: string
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

export interface User {
  id: string
  name: string
  email: string
  roles: string[]
  tenantId?: string
  createdAt: string
}

export function listUsers(): Promise<User[]> {
  return api.get('/iam/users')
}

export function listUsersByTenant(tenantId: string): Promise<User[]> {
  return api.get(`/iam/users?tenantId=${tenantId}`)
}

export function getUser(id: string): Promise<User> {
  return api.get(`/iam/users/${id}`)
}

export function createUser(user: { name: string; email: string; password: string; roles?: string[] }): Promise<User> {
  return api.post('/iam/users', user)
}

export function listRoles(): Promise<Role[]> {
  return api.get('/iam/roles')
}

export function createRole(role: Omit<Role, 'id'>): Promise<Role> {
  return api.post('/iam/roles', role)
}

export function updateRole(id: string, role: Partial<Role>): Promise<Role> {
  return api.put(`/iam/roles/${id}`, role)
}

export function deleteRole(id: string): Promise<void> {
  return api.delete(`/iam/roles/${id}`)
}

export function listPermissions(): Promise<Permission[]> {
  return api.get('/iam/permissions')
}

export function createPermission(permission: Omit<Permission, 'id'>): Promise<Permission> {
  return api.post('/iam/permissions', permission)
}

export function deletePermission(id: string): Promise<void> {
  return api.delete(`/iam/permissions/${id}`)
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
  listUsersByTenant,
  getUser,
  createUser,
  listRoles,
  createRole,
  updateRole,
  deleteRole,
  listPermissions,
  createPermission,
  deletePermission,
  listTenants,
  getMfaConfig,
  enableMfa,
  disableMfa,
  listSessions,
  revokeSession,
  getPermissionMatrix,
}
