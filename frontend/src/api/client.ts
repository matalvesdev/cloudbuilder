import type { ApiError } from "./types";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api/v1";
const TOKEN_KEY = "cloudbuilder-auth-token";
const REFRESH_KEY = "cloudbuilder-refresh-token";
const TENANT_KEY = "cloudbuilder-active-tenant-id";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string, refreshToken?: string): void {
  localStorage.setItem(TOKEN_KEY, token);
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearTokens(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(TENANT_KEY);
}

export function setActiveTenantId(tenantId?: string): void {
  if (tenantId) {
    localStorage.setItem(TENANT_KEY, tenantId);
  } else {
    localStorage.removeItem(TENANT_KEY);
  }
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

// Import dinâmico para evitar circular dependency
let _logoutFn: (() => void) | null = null;
let _refreshPromise: Promise<boolean> | null = null;
export function setLogoutFn(fn: () => void): void {
  _logoutFn = fn;
}
export function getLogoutFn(): (() => void) | null {
  return _logoutFn;
}

async function refreshAccessToken(baseUrl: string): Promise<boolean> {
  if (_refreshPromise) return _refreshPromise;
  _refreshPromise = (async () => {
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    if (!refreshToken) return false;
    try {
      const response = await fetch(`${baseUrl}/auth/refresh`, {
        method: "POST",
        headers: {
          Accept: "application/vnd.cloudbuilder.v1+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      });
      if (!response.ok) return false;
      const refreshed = (await response.json()) as {
        token: string;
        refreshToken?: string;
        tenantId?: string;
      };
      if (!refreshed.token) return false;
      setToken(refreshed.token, refreshed.refreshToken);
      if (refreshed.tenantId) setActiveTenantId(refreshed.tenantId);
      return true;
    } catch {
      return false;
    }
  })();
  try {
    return await _refreshPromise;
  } finally {
    _refreshPromise = null;
  }
}

class HttpClient {
  private baseUrl: string;

  constructor(baseUrl: string = BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    options?: { skipAuth?: boolean },
    canRetryAuth = true,
  ): Promise<T> {
    const isFormData = body instanceof FormData;
    const headers: Record<string, string> = {
      Accept: "application/vnd.cloudbuilder.v1+json",
    };

    if (!isFormData) {
      headers["Content-Type"] = "application/json";
    }

    if (!options?.skipAuth) {
      const token = getToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }

    const tenantId = localStorage.getItem(TENANT_KEY);
    if (tenantId) {
      headers["X-Tenant-Id"] = tenantId;
    }

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers,
        body: isFormData
          ? (body as FormData)
          : body === undefined
            ? undefined
            : JSON.stringify(body),
      });

      if (response.status === 401) {
        if (!options?.skipAuth && canRetryAuth) {
          const refreshed = await refreshAccessToken(this.baseUrl);
          if (refreshed) {
            return this.request<T>(method, path, body, options, false);
          }
        }
        clearTokens();
        // Usa função de logout registrada em vez de window.location (SPA sem router)
        if (_logoutFn) _logoutFn();
        throw new Error("Sessão expirada. Faça login novamente.");
      }

      if (response.status === 204) {
        return undefined as T;
      }

      const contentType = response.headers.get("content-type") ?? "";
      const data = contentType.includes("json")
        ? await response.json()
        : await response.blob();

      if (!response.ok) {
        const error = data as ApiError;
        throw error;
      }

      return data as T;
    } catch (err) {
      if (
        err &&
        typeof err === "object" &&
        "status" in err &&
        "message" in err
      ) {
        throw err;
      }
      throw {
        status: 0,
        message:
          err instanceof Error ? err.message : "Erro de conexão com o servidor",
        timestamp: new Date().toISOString(),
      } as ApiError;
    }
  }

  get<T>(path: string, options?: { skipAuth?: boolean }): Promise<T> {
    return this.request<T>("GET", path, undefined, options);
  }

  post<T>(
    path: string,
    body?: unknown,
    options?: { skipAuth?: boolean },
  ): Promise<T> {
    return this.request<T>("POST", path, body, options);
  }

  put<T>(
    path: string,
    body?: unknown,
    options?: { skipAuth?: boolean },
  ): Promise<T> {
    return this.request<T>("PUT", path, body, options);
  }

  delete<T = void>(path: string, options?: { skipAuth?: boolean }): Promise<T> {
    return this.request<T>("DELETE", path, undefined, options);
  }
}

export const api = new HttpClient();
export default HttpClient;
