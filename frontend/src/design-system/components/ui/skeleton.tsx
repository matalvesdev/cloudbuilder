import { cn } from '@/lib/utils'

/**
 * Skeleton loading placeholder.
 * Provides a subtle pulse animation for content that is still loading.
 *
 * Usage:
 *   <Skeleton className="h-4 w-3/4" />
 *   <Skeleton className="h-32 w-full rounded-xl" />
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-slate-200',
        className
      )}
    />
  )
}
