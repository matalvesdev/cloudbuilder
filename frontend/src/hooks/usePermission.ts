import { useAuthStore } from '@/store/authStore'

// Fallback for known system roles when backend permissions aren't loaded yet
const SYSTEM_ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'DEPLOY', 'MANAGE'],
  editor: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'DEPLOY'],
  viewer: ['READ'],
}

export function usePermission() {
  const user = useAuthStore((s) => s.user)
  const roles = user?.roles ?? []
  const tenantPermissions = user?.tenantPermissions ?? []

  function hasRole(role: string): boolean {
    return roles.includes(role)
  }

  function hasPermission(action: string, resource?: string): boolean {
    // 1. Check real backend permissions first
    if (tenantPermissions.length > 0) {
      const allPerms = tenantPermissions.flatMap((tp) => tp.permissions)
      if (resource) {
        return allPerms.some((p) => p === `${action}:${resource}`)
      }
      return allPerms.some((p) => p.startsWith(`${action}:`))
    }

    // 2. Fallback to system role permissions
    return roles.some((role) => {
      const allowed = SYSTEM_ROLE_PERMISSIONS[role]
      return allowed?.includes(action) ?? false
    })
  }

  function canCreate(): boolean {
    return hasPermission('CREATE')
  }

  function canRead(): boolean {
    return hasPermission('READ')
  }

  function canUpdate(): boolean {
    return hasPermission('UPDATE')
  }

  function canDelete(): boolean {
    return hasPermission('DELETE')
  }

  function canDeploy(): boolean {
    return hasPermission('DEPLOY')
  }

  function canManage(): boolean {
    return hasPermission('MANAGE')
  }

  return { hasRole, hasPermission, canCreate, canRead, canUpdate, canDelete, canDeploy, canManage, roles }
}
