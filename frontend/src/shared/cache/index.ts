/**
 * Query Cache — TTL-based cache with stale-while-revalidate.
 *
 * Provides a lightweight cache layer for API responses, replacing
 * scattered localStorage/sessionStorage patterns with a unified
 * in-memory cache that supports:
 *
 * - TTL (time-to-live) expiration
 * - Stale-while-revalidate (serve stale, refresh in background)
 * - Pattern-based invalidation
 * - Cache tags for bulk invalidation
 * - Size limits with LRU eviction
 *
 * Architecture:
 *   Feature → useQuery() → Cache.get() → hit? return : fetch + Cache.set()
 *
 * Usage:
 *   import { queryCache } from '@/shared/cache'
 *
 *   // Set with TTL
 *   queryCache.set('canvases:list', data, { ttl: 30_000, tags: ['canvas'] })
 *
 *   // Get (returns null if expired)
 *   const data = queryCache.get('canvases:list')
 *
 *   // Invalidate by key or tag
 *   queryCache.invalidate('canvases:list')
 *   queryCache.invalidateByTag('canvas')
 */

/* ─── Types ────────────────────────────────────────────────── */

export interface CacheEntry<T = unknown> {
  data: T
  timestamp: number
  ttl: number
  tags: string[]
  staleWhileRevalidate: boolean
}

export interface CacheOptions {
  /** Time-to-live in milliseconds (default: 30s) */
  ttl?: number
  /** Tags for bulk invalidation */
  tags?: string[]
  /** Serve stale data while revalidating in background (default: true) */
  staleWhileRevalidate?: boolean
}

export interface CacheStats {
  hits: number
  misses: number
  sets: number
  invalidations: number
  size: number
}

/* ─── Cache Implementation ─────────────────────────────────── */

const DEFAULT_TTL = 30_000 // 30 seconds
const MAX_ENTRIES = 500

class QueryCache {
  private cache = new Map<string, CacheEntry>()
  private stats: CacheStats = { hits: 0, misses: 0, sets: 0, invalidations: 0, size: 0 }
  private revalidating = new Set<string>()

  /**
   * Get a value from cache. Returns null if expired or missing.
   * If stale-while-revalidate is enabled and entry is stale,
   * returns the stale data AND triggers background revalidation.
   */
  get<T = unknown>(key: string): T | null {
    const entry = this.cache.get(key)

    if (!entry) {
      this.stats.misses++
      return null
    }

    const isExpired = Date.now() - entry.timestamp > entry.ttl

    if (!isExpired) {
      this.stats.hits++
      return entry.data as T
    }

    // Entry is stale
    if (entry.staleWhileRevalidate) {
      this.stats.hits++
      // Signal to caller that data is stale (they should revalidate)
      return entry.data as T
    }

    // Entry is expired and no stale-while-revalidate
    this.cache.delete(key)
    this.stats.misses++
    this.stats.size = this.cache.size
    return null
  }

  /**
   * Check if a key exists and is fresh (not stale).
   */
  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false
    return Date.now() - entry.timestamp <= entry.ttl
  }

  /**
   * Check if a key exists but is stale.
   */
  isStale(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false
    return Date.now() - entry.timestamp > entry.ttl
  }

  /**
   * Set a value in cache.
   */
  set<T>(key: string, data: T, options?: CacheOptions): void {
    // LRU eviction if at capacity
    if (this.cache.size >= MAX_ENTRIES && !this.cache.has(key)) {
      const oldestKey = this.cache.keys().next().value
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey)
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: options?.ttl ?? DEFAULT_TTL,
      tags: options?.tags ?? [],
      staleWhileRevalidate: options?.staleWhileRevalidate ?? true,
    })

    this.stats.sets++
    this.stats.size = this.cache.size
  }

  /**
   * Delete a specific key.
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key)
    if (deleted) {
      this.stats.invalidations++
      this.stats.size = this.cache.size
    }
    return deleted
  }

  /**
   * Invalidate all entries matching a key pattern (regex or string prefix).
   */
  invalidate(pattern: string | RegExp): number {
    let count = 0
    const regex = typeof pattern === 'string' ? new RegExp(`^${pattern}`) : pattern

    for (const key of Array.from(this.cache.keys())) {
      if (regex.test(key)) {
        this.cache.delete(key)
        count++
      }
    }

    this.stats.invalidations += count
    this.stats.size = this.cache.size
    return count
  }

  /**
   * Invalidate all entries with a specific tag.
   */
  invalidateByTag(tag: string): number {
    let count = 0

    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (entry.tags.includes(tag)) {
        this.cache.delete(key)
        count++
      }
    }

    this.stats.invalidations += count
    this.stats.size = this.cache.size
    return count
  }

  /**
   * Clear all cache entries.
   */
  clear(): void {
    this.cache.clear()
    this.stats.size = 0
  }

  /**
   * Get cache statistics.
   */
  getStats(): CacheStats {
    return { ...this.stats }
  }

  /**
   * Mark a key as currently revalidating (prevents duplicate revalidation).
   * Returns true if this is the first call (caller should revalidate).
   */
  startRevalidation(key: string): boolean {
    if (this.revalidating.has(key)) return false
    this.revalidating.add(key)
    return true
  }

  /**
   * Mark revalidation as complete for a key.
   */
  endRevalidation(key: string): void {
    this.revalidating.delete(key)
  }

  /**
   * Cleanup expired entries (call periodically).
   */
  cleanup(): number {
    let count = 0
    const now = Date.now()

    for (const [key, entry] of Array.from(this.cache.entries())) {
      // Also remove stale entries that aren't stale-while-revalidate
      const isExpired = now - entry.timestamp > entry.ttl
      const isStale = isExpired && !entry.staleWhileRevalidate

      // Remove very old entries (10x TTL) even with stale-while-revalidate
      const isVeryOld = now - entry.timestamp > entry.ttl * 10

      if (isStale || isVeryOld) {
        this.cache.delete(key)
        count++
      }
    }

    this.stats.size = this.cache.size
    return count
  }
}

/** Singleton QueryCache instance */
export const queryCache = new QueryCache()

// Auto-cleanup every 60 seconds
if (typeof setInterval !== 'undefined') {
  setInterval(() => queryCache.cleanup(), 60_000)
}

/* ─── React Hook: useQuery ─────────────────────────────────── */

import { useState, useCallback, useRef, useEffect } from 'react'

export interface UseQueryOptions<T> {
  /** Cache key */
  key: string
  /** Fetch function */
  fetcher: () => Promise<T>
  /** Cache TTL in ms (default: 30s) */
  ttl?: number
  /** Cache tags */
  tags?: string[]
  /** Enable/disable the query */
  enabled?: boolean
  /** Refetch interval in ms */
  refetchInterval?: number
  /** Callback on success */
  onSuccess?: (data: T) => void
  /** Callback on error */
  onError?: (error: Error) => void
}

export interface UseQueryResult<T> {
  data: T | null
  error: Error | null
  isLoading: boolean
  isStale: boolean
  refetch: () => Promise<void>
}

/**
 * React hook for cached data fetching with stale-while-revalidate.
 *
 * Usage:
 *   const { data, isLoading, refetch } = useQuery({
 *     key: 'canvases:list',
 *     fetcher: () => canvasApi.list(),
 *     ttl: 60_000,
 *     tags: ['canvas'],
 *   })
 */
export function useQuery<T>(options: UseQueryOptions<T>): UseQueryResult<T> {
  const { key, fetcher, ttl, tags, enabled = true, refetchInterval, onSuccess, onError } = options

  const [data, setData] = useState<T | null>(() => queryCache.get<T>(key))
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(!queryCache.has(key) && enabled)
  const mountedRef = useRef(true)

  const executeFetch = useCallback(async () => {
    if (!enabled) return

    // Check if data is fresh
    if (queryCache.has(key)) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await fetcher()
      if (mountedRef.current) {
        queryCache.set(key, result, { ttl, tags })
        setData(result)
        onSuccess?.(result)
      }
    } catch (err) {
      if (mountedRef.current) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error)
        onError?.(error)
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [key, fetcher, ttl, tags, enabled, onSuccess, onError])

  // Initial fetch
  useEffect(() => {
    mountedRef.current = true
    executeFetch()
    return () => { mountedRef.current = false }
  }, [executeFetch])

  // Refetch interval
  useEffect(() => {
    if (!refetchInterval || !enabled) return
    const timer = setInterval(executeFetch, refetchInterval)
    return () => clearInterval(timer)
  }, [refetchInterval, enabled, executeFetch])

  const refetch = useCallback(async () => {
    queryCache.delete(key)
    await executeFetch()
  }, [key, executeFetch])

  const isStale = queryCache.isStale(key)

  return { data, error, isLoading, isStale, refetch }
}
