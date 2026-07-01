/**
 * Dashboard Store — barrel export.
 * Re-exports from centralized store for backward compatibility.
 * Implementation lives in src/store/activityStore.ts and src/store/analyticsStore.ts (centralized).
 */
export { useActivityStore } from '@/store/activityStore'
export { useAnalyticsStore } from '@/store/analyticsStore'
