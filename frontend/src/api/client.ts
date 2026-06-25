import type { ApiError } from './types'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1'
const TOKEN_KEY = 'cloudbuilder-auth-token'
const REFRESH_KEY = 'cloudbuilder-refresh-token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string, refreshToken?: string): void {
  localStorage.setItem(TOKEN_KEY, token)
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken)
}

export function clearTokens(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

export function isAuthenticated(): boolean {
  return !!getToken()
}

// Import dinâmico para evitar circular dependency
let _logoutFn: (() => void) | null = null
export function setLogoutFn(fn: () => void): void {
  _logoutFn = fn
}
export function getLogoutFn(): (() => void) | null {
  return _logoutFn
}

class HttpClient {
  private baseUrl: string

  constructor(baseUrl: string = BASE_URL) {
    this.baseUrl = baseUrl
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    options?: { skipAuth?: boolean }
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.cloudbuilder.v1+json',
    }

    if (!options?.skipAuth) {
      const token = getToken()
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
    }

    const tenantId = localStorage.getItem('cloudbuilder-active-tenant-id')
    if (tenantId) {
      headers['X-Tenant-Id'] = tenantId
    }

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      })

      if (response.status === 401) {
        clearTokens()
        // Usa função de logout registrada em vez de window.location (SPA sem router)
        if (_logoutFn) _logoutFn()
        throw new Error('Sessão expirada. Faça login novamente.')
      }

      if (response.status === 204) {
        return undefined as T
      }

      const data = await response.json()

      if (!response.ok) {
        const error = data as ApiError
        throw error
      }

      return data as T
    } catch (err) {
      if (err && typeof err === 'object' && 'status' in err && 'message' in err) {
        throw err
      }
      throw {
        status: 0,
        message: err instanceof Error ? err.message : 'Erro de conexão com o servidor',
        timestamp: new Date().toISOString(),
      } as ApiError
    }
  }

  get<T>(path: string, options?: { skipAuth?: boolean }): Promise<T> {
    return this.request<T>('GET', path, undefined, options)
  }

  post<T>(path: string, body?: unknown, options?: { skipAuth?: boolean }): Promise<T> {
    return this.request<T>('POST', path, body, options)
  }

  put<T>(path: string, body?: unknown, options?: { skipAuth?: boolean }): Promise<T> {
    return this.request<T>('PUT', path, body, options)
  }

  delete<T = void>(path: string, options?: { skipAuth?: boolean }): Promise<T> {
    return this.request<T>('DELETE', path, undefined, options)
  }
}

export const api = new HttpClient()
export default HttpClient
