/**
 * Shared Feature Flags layer — barrel export.
 *
 * Formalizes featureFlags API and uiStore flag logic as the shared feature flags layer.
 * Features should import from '@/shared/feature-flags' instead of scattered imports.
 *
 * Usage:
 *   import { useFeatureFlags, isEnabled, featureFlagsApi } from '@/shared/feature-flags'
 */

// Re-export feature flags API
export {
  featureFlagsApi,
  type FeatureFlagDTO,
  type CreateFlagRequest,
  type UpdateFlagRequest,
} from '@/api/featureFlags'

// Re-export uiStore flag logic
import { useUiStore as _useUiStore } from '@/store/uiStore'
export const useUiStore = _useUiStore

// Convenience hook for checking if a flag is enabled
export function useFeatureFlags() {
  const { isEnabled, fetchFlags, refreshFlags, featureFlags, flagsLoaded, flagsLoading } = useUiStore()

  return {
    isEnabled,
    fetchFlags,
    refreshFlags,
    featureFlags,
    flagsLoaded,
    flagsLoading,
  }
}
