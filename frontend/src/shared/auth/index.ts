/**
 * Shared Auth layer — barrel export.
 *
 * Formalizes usePermission, useTenant, and authStore as the shared auth layer.
 * Features should import from '@/shared/auth' instead of scattered imports.
 *
 * Usage:
 *   import { usePermission, useTenant, useAuthStore } from '@/shared/auth'
 */

// Re-export auth hooks
export { usePermission } from "@/hooks/usePermission";
export { useTenant } from "@/hooks/useTenant";

// Re-export auth store
export { useAuthStore } from "@/store/authStore";

// Re-export auth API
export * as authApi from "@/api/auth";

// Re-export token utilities
export { getToken, setToken, clearTokens, isAuthenticated } from "@/api/client";
