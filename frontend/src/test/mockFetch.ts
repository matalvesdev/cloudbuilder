/**
 * Mock fetch utility for API client tests.
 *
 * Wraps globalThis.fetch with a mock that returns controlled responses.
 * Usage:
 *   import { mockFetch, mockFetchError, restoreFetch } from '@/test/mockFetch'
 *
 *   beforeEach(() => { mockFetch({ status: 200, body: { data: 'ok' } }) })
 *   afterEach(() => { restoreFetch() })
 */

type FetchResponse = {
  status: number
  body?: unknown
  headers?: Record<string, string>
}

type FetchSequence = Array<FetchResponse | ((url: string, init?: RequestInit) => FetchResponse | Promise<FetchResponse>)>

let originalFetch: typeof globalThis.fetch | null = null

function normalizeToResponse(resp: FetchResponse): Response {
  return new Response(JSON.stringify(resp.body), {
    status: resp.status,
    headers: { 'Content-Type': 'application/json', ...resp.headers },
  })
}

/**
 * Mock fetch to always return the given response.
 */
export function mockFetch(response: FetchResponse): void {
  if (!originalFetch) originalFetch = globalThis.fetch
  globalThis.fetch = async () => normalizeToResponse(response)
}

/**
 * Mock fetch with a sequence of responses (one per call, then repeats the last).
 */
export function mockFetchSequence(sequence: FetchSequence): void {
  if (!originalFetch) originalFetch = globalThis.fetch
  let callIndex = 0
  globalThis.fetch = async (url: string | URL | Request, init?: RequestInit) => {
    const idx = Math.min(callIndex, sequence.length - 1)
    callIndex++
    const entry = sequence[idx]
    if (typeof entry === 'function') {
      const result = entry(url.toString(), init)
      return result instanceof Promise
        ? normalizeToResponse(await result)
        : normalizeToResponse(result)
    }
    return normalizeToResponse(entry)
  }
}

/**
 * Mock fetch to return a 204 No Content response.
 */
export function mockFetchNoContent(): void {
  if (!originalFetch) originalFetch = globalThis.fetch
  globalThis.fetch = async () => new Response(null, { status: 204 })
}

/**
 * Mock fetch to throw a network error.
 */
export function mockFetchNetworkError(): void {
  if (!originalFetch) originalFetch = globalThis.fetch
  globalThis.fetch = async () => { throw new TypeError('Failed to fetch') }
}

/**
 * Restore the original fetch implementation.
 */
export function restoreFetch(): void {
  if (originalFetch) {
    globalThis.fetch = originalFetch
    originalFetch = null
  }
}
