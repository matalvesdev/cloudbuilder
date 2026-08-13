import { useAuthStore } from "@/store/authStore";
import { usePermission } from "@/hooks/usePermission";
import type { ReactNode } from "react";

interface ProtectedContentProps {
  roles?: string[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function ProtectedContent({
  roles,
  children,
  fallback,
}: ProtectedContentProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { hasRole } = usePermission();

  if (!isAuthenticated) {
    return fallback ?? null;
  }

  if (roles && roles.length > 0) {
    const allowed = roles.some((r) => hasRole(r));
    if (!allowed) {
      return fallback ?? null;
    }
  }

  return <>{children}</>;
}

export function ProtectedAction({
  roles,
  children,
}: {
  roles?: string[];
  children: ReactNode;
}) {
  const { hasRole } = usePermission();

  if (roles && roles.length > 0) {
    const allowed = roles.some((r) => hasRole(r));
    if (!allowed) return null;
  }

  return <>{children}</>;
}
