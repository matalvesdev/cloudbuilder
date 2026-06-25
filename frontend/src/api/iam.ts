import { api } from './client'

// ─── Types ──────────────────────────────────────────────────────

export interface Role {
  id: string
  name: string
  description: string
  tenantId: string
  createdAt: string
  updatedAt?: string
}

export interface User {
  id: string
  name: string
  email: string
  enabled: boolean
  createdAt: string
  updatedAt?: string
}

export interface TenantUser {
  id: string
  tenantId: string
  userId: string
  roleId: string
  roleName: string
  userName: string
  userEmail: string
  createdAt: string
}

export interface Permission {
  id: string
  action: string
  resource: string
  description: string
  roleId?: string
}

export interface CreateRoleRequest {
  name: string
  description: string
  tenantId: string
}

export interface CreateUserRequest {
  name: string
  email: string
  passwordHash: string
}

// ─── MFA Types ──────────────────────────────────────────────────

export interface MfaConfig {
  id: string
  userId: string
  enabled: boolean
  method: 'totp' | 'sms' | 'email' | 'none'
  secret: string | null
  verified: boolean
  createdAt: string
  updatedAt: string
}

export interface MfaSetupResponse {
  config: MfaConfig
  qrCode: string
  secretKey: string
}

export interface MfaVerifyRequest {
  userId: string
  code: string
}

// ─── Session Types ──────────────────────────────────────────────

export interface UserSession {
  id: string
  userId: string
  userName: string
  userEmail: string
  ipAddress: string
  userAgent: string
  deviceName: string
  location: string
  lastActivity: string
  createdAt: string
  expiresAt: string
  isCurrent: boolean
  status: 'active' | 'expired' | 'revoked'
}

// ─── Permission Matrix Types ────────────────────────────────────

export interface PermissionMatrixEntry {
  roleId: string
  roleName: string
  permissions: Permission[]
}

// ─── IAM API Service ────────────────────────────────────────────

class IamApiService {
  // ── Roles ──

  async listRoles(tenantId: string): Promise<Role[]> {
    return api.get<Role[]>(`/iam/tenants/${tenantId}/roles`)
  }

  async createRole(req: CreateRoleRequest): Promise<Role> {
    return api.post<Role>('/iam/roles', req)
  }

  async updateRole(id: string, name: string, description: string): Promise<Role> {
    return api.put<Role>(`/iam/roles/${id}`, { name, description })
  }

  async deleteRole(id: string): Promise<void> {
    return api.delete(`/iam/roles/${id}`)
  }

  // ── Permissions ──

  async listPermissions(roleId: string): Promise<Permission[]> {
    return api.get<Permission[]>(`/iam/roles/${roleId}/permissions`)
  }

  async createPermission(roleId: string, action: string, resource: string): Promise<Permission> {
    return api.post<Permission>(`/iam/roles/${roleId}/permissions`, { action, resource })
  }

  async deletePermission(id: string): Promise<void> {
    return api.delete(`/iam/permissions/${id}`)
  }

  // ── Users ──

  async getUser(id: string): Promise<User> {
    return api.get<User>(`/iam/users/${id}`)
  }

  async createUser(req: CreateUserRequest): Promise<User> {
    return api.post<User>('/iam/users', req)
  }

  async enableUser(id: string): Promise<User> {
    return api.post<User>(`/iam/users/${id}/enable`)
  }

  async disableUser(id: string): Promise<User> {
    return api.post<User>(`/iam/users/${id}/disable`)
  }

  // ── Tenant Users ──

  async listUsersByTenant(tenantId: string): Promise<TenantUser[]> {
    return api.get<TenantUser[]>(`/iam/tenants/${tenantId}/users`)
  }

  async assignRole(tenantId: string, userId: string, roleId: string): Promise<void> {
    return api.post(`/iam/tenants/${tenantId}/users/${userId}/roles/${roleId}`)
  }

  // ── Tenants ──

  async listTenants(): Promise<Tenant[]> {
    return api.get<Tenant[]>('/iam/tenants')
  }

  async getTenant(id: string): Promise<Tenant> {
    return api.get<Tenant>(`/iam/tenants/${id}`)
  }

  async activateTenant(id: string): Promise<void> {
    return api.post(`/iam/tenants/${id}/activate`)
  }

  async deactivateTenant(id: string): Promise<void> {
    return api.post(`/iam/tenants/${id}/deactivate`)
  }

  // ── MFA ──

  async getMfaConfig(userId: string): Promise<MfaConfig> {
    return api.get<MfaConfig>(`/iam/users/${userId}/mfa`)
  }

  async setupMfa(userId: string): Promise<MfaSetupResponse> {
    return api.post<MfaSetupResponse>(`/iam/users/${userId}/mfa/setup`)
  }

  async verifyMfa(userId: string, code: string): Promise<MfaConfig> {
    return api.post<MfaConfig>(`/iam/users/${userId}/mfa/verify`, { code })
  }

  async disableMfa(userId: string): Promise<void> {
    return api.post(`/iam/users/${userId}/mfa/disable`)
  }

  // ── Sessions ──

  async listSessions(userId: string): Promise<UserSession[]> {
    return api.get<UserSession[]>(`/iam/users/${userId}/sessions`)
  }

  async revokeSession(userId: string, sessionId: string): Promise<void> {
    return api.post(`/iam/users/${userId}/sessions/${sessionId}/revoke`)
  }

  async revokeAllSessions(userId: string): Promise<void> {
    return api.post(`/iam/users/${userId}/sessions/revoke-all`)
  }

  // ── Permission Matrix ──

  async getPermissionMatrix(tenantId: string): Promise<PermissionMatrixEntry[]> {
    return api.get<PermissionMatrixEntry[]>(`/iam/tenants/${tenantId}/permission-matrix`)
  }

  // ── Validation ──

  async validateTenantAccess(tenantId: string, userId: string): Promise<boolean> {
    return api.post<boolean>('/iam/validate/tenant-access', { tenantId, userId })
  }

  async hasPermission(tenantId: string, userId: string, action: string, resource: string): Promise<boolean> {
    return api.post<boolean>('/iam/validate/permission', { tenantId, userId, action, resource })
  }
}

export interface Tenant {
  id: string
  name: string
  slug: string
  active: boolean
  createdAt: string
}

export const iamApi = new IamApiService()
