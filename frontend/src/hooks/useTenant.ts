import { useAuthStore } from '@/store/authStore'

export function useTenant() {
  const user = useAuthStore((s) => s.user)

  return {
    tenantId: user?.tenantId ?? null,
    tenantName: user?.tenantName ?? null,
    tenantSlug: user?.tenantSlug ?? null,
    hasTenant: !!user?.tenantId,
  }
}
