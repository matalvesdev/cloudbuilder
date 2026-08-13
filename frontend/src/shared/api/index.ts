/**
 * Shared API layer — barrel export.
 *
 * Formalizes the existing api/client.ts as the shared API client.
 * Features should import from '@/shared/api' instead of '@/api/client'.
 *
 * Usage:
 *   import { apiClient, getToken, setToken, isAuthenticated } from '@/shared/api'
 */

// Re-export the existing API client and utilities
export {
  api as apiClient,
  getToken,
  setToken,
  clearTokens,
  isAuthenticated,
  setLogoutFn,
  getLogoutFn,
} from "@/api/client";

// Re-export types
export type { ApiError } from "@/api/types";
