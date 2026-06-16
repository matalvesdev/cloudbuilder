import { useAuthStore } from '@/store/authStore'

const PERMISSION_MAP: Record<string, string[]> = {
  admin: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'DEPLOY', 'MANAGE'],
  editor: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'DEPLOY'],
  viewer: ['READ'],
}

export function usePermission() {
  const user = useAuthStore((s) => s.user)
  const roles = user?.roles ?? []

  function hasRole(role: string): boolean {
    return roles.includes(role)
  }

  function hasPermission(action: string, _resource?: string): boolean {
    return roles.some((role) => {
      const allowed = PERMISSION_MAP[role]
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
