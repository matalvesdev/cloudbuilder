import { api } from "./client";

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  createdAt?: string;
  tenantId?: string;
}

export interface TenantUser {
  id: string;
  userId: string;
  tenantId: string;
  roles: string[];
}

export interface Permission {
  id: string;
  name?: string;
  resource: string;
  action: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: string;
  createdAt?: string;
  active?: boolean;
}

export interface MfaConfig {
  enabled: boolean;
  method: string;
  backupCodes: string[];
  verified?: boolean;
  secret?: string;
  qrCode?: string;
  secretKey?: string;
}

export interface UserSession {
  id: string;
  userId: string;
  ipAddress: string;
  userAgent: string;
  expiresAt: string;
  createdAt: string;
  status?: string;
  active?: boolean;
  terminatedAt?: string;
  deviceName?: string;
  isCurrent?: boolean;
  location?: string;
  lastActivity?: string;
}

export interface PermissionMatrixEntry {
  id?: string;
  role: string;
  roleId?: string;
  roleName?: string;
  resource: string;
  action?: string;
  description?: string;
  permissions: any[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  roles: string[];
  tenantId?: string;
  createdAt: string;
}

export function listUsers(): Promise<User[]> {
  const tenantId = localStorage.getItem("cloudbuilder-active-tenant-id");
  if (!tenantId) return Promise.resolve([]);
  return listUsersByTenant(tenantId).then((users) =>
    users.map((user) => ({
      id: user.userId,
      name: user.name ?? user.userName ?? "",
      email: user.email ?? user.userEmail ?? "",
      roles: user.roleName ? [user.roleName] : [],
      tenantId,
      createdAt: user.joinedAt ?? "",
    })),
  );
}

export interface TenantUserInfo {
  id: string;
  userId: string;
  tenantId: string;
  roles: string[];
  userName?: string;
  userEmail?: string;
  name?: string;
  email?: string;
  enabled?: boolean;
  roleId?: string;
  roleName?: string;
  status?: string;
  joinedAt?: string;
}

export function listUsersByTenant(tenantId: string): Promise<TenantUserInfo[]> {
  return api.get(`/iam/tenants/${tenantId}/users`);
}

export function getUser(id: string): Promise<User> {
  return api.get(`/iam/users/${id}`);
}

export function createUser(user: {
  name: string;
  email: string;
  password: string;
  tenantId: string;
  roleId: string;
}): Promise<TenantUser> {
  const { tenantId, ...body } = user;
  return api.post(`/iam/tenants/${tenantId}/users`, body);
}

export function listRoles(tenantId?: string): Promise<Role[]> {
  return api.get(tenantId ? `/iam/tenants/${tenantId}/roles` : "/iam/roles");
}

export function createRole(role: { name: string; description?: string; permissions?: string[]; tenantId?: string }): Promise<Role> {
  return api.post("/iam/roles", {
    name: role.name,
    description: role.description,
    tenantId: role.tenantId,
  });
}

export function updateRole(id: string, ...args: any[]): Promise<Role> {
  const roleData = args.length === 1 ? args[0] : { name: args[0], description: args[1] };
  return api.put(`/iam/roles/${id}`, roleData);
}

export function deleteRole(id: string): Promise<void> {
  return api.delete(`/iam/roles/${id}`);
}

export function listPermissions(roleId: string): Promise<Permission[]> {
  return api.get(`/iam/roles/${roleId}/permissions`);
}

export function createPermission(
  roleId: string,
  action: string,
  resource: string,
): Promise<Permission> {
  return api.post(`/iam/roles/${roleId}/permissions`, { action, resource });
}

export function deletePermission(id: string): Promise<void> {
  return api.delete(`/iam/permissions/${id}`);
}

export function listTenants(): Promise<Tenant[]> {
  return api.get("/iam/tenants");
}

export function disableUser(userId: string): Promise<void> {
  return api.post(`/iam/users/${userId}/disable`);
}

export function enableUser(userId: string): Promise<void> {
  return api.post(`/iam/users/${userId}/enable`);
}

export function deactivateTenant(tenantId: string): Promise<void> {
  return api.post(`/iam/tenants/${tenantId}/deactivate`);
}

export function activateTenant(tenantId: string): Promise<void> {
  return api.post(`/iam/tenants/${tenantId}/activate`);
}

export function assignRole(tenantId: string, userId: string, roleId: string): Promise<void> {
  return api.post(`/iam/tenants/${tenantId}/users/${userId}/roles/${roleId}`);
}

export function setupMfa(userId: string): Promise<MfaConfig> {
  return api.post(`/iam/mfa/setup/${userId}`);
}

export function verifyMfa(userId: string, code: string): Promise<MfaConfig> {
  return api.post(`/iam/mfa/verify-and-enable/${userId}`, { code });
}

export function getMfaConfig(userId: string): Promise<MfaConfig> {
  return api.get(`/iam/mfa/status/${userId}`);
}

export function disableMfa(userId: string): Promise<void> {
  return api.post(`/iam/mfa/disable/${userId}`);
}

export async function listSessions(userId: string): Promise<UserSession[]> {
  const sessions = await api.get<UserSession[]>(`/iam/sessions/user/${userId}`);
  return sessions.map((session) => ({
    ...session,
    status: session.active
      ? "active"
      : session.terminatedAt
        ? "revoked"
        : "expired",
  }));
}

export function revokeSession(userIdOrId: string, sessionId?: string): Promise<void> {
  const id = sessionId || userIdOrId;
  return api.post(`/iam/sessions/${id}/terminate`);
}

export function revokeAllSessions(userId: string): Promise<void> {
  return api.post(`/iam/sessions/user/${userId}/terminate-all`);
}

export async function getPermissionMatrix(
  tenantId: string,
): Promise<PermissionMatrixEntry[]> {
  const roles = await listRoles(tenantId);
  return Promise.all(
    roles.map(async (role) => ({
      id: role.id,
      role: role.name,
      roleId: role.id,
      roleName: role.name,
      resource: "*",
      description: role.description,
      permissions: await listPermissions(role.id),
    })),
  );
}

export interface UserPermissionsDTO {
  tenantId: string;
  roleId: string;
  roleName: string;
  permissions: string[];
}

export function getUserPermissions(
  userId: string,
): Promise<UserPermissionsDTO[]> {
  return api.get(`/iam/users/${userId}/permissions`);
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
  disableMfa,
  listSessions,
  revokeSession,
  getPermissionMatrix,
  disableUser,
  enableUser,
  deactivateTenant,
  activateTenant,
  assignRole,
  setupMfa,
  verifyMfa,
  revokeAllSessions,
};
