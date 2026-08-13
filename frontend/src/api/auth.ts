import { api, setToken, clearTokens } from "./client";
import type { LoginRequest, LoginResponse } from "./types";

export async function login(
  email: string,
  password: string,
): Promise<LoginResponse> {
  const body: LoginRequest = { email, password };
  const res = await api.post<LoginResponse>("/auth/login", body, {
    skipAuth: true,
  });
  setToken(res.token, res.refreshToken);
  return res;
}

export async function refreshToken(): Promise<LoginResponse | null> {
  const stored = localStorage.getItem("cloudbuilder-refresh-token");
  if (!stored) return null;
  try {
    const res = await api.post<LoginResponse>(
      "/auth/refresh",
      { refreshToken: stored },
      { skipAuth: true },
    );
    setToken(res.token, res.refreshToken);
    return res;
  } catch {
    clearTokens();
    return null;
  }
}

export async function getMe(): Promise<{
  id: string;
  name: string;
  email: string;
  roles: string[];
  tenantId?: string;
  tenantName?: string;
  tenantSlug?: string;
}> {
  return api.get("/auth/me");
}

export async function register(
  name: string,
  email: string,
  password: string,
  tenantName?: string,
  tenantSlug?: string,
  role?: string,
): Promise<LoginResponse> {
  const body: Record<string, unknown> = {
    name,
    email,
    password,
    tenantName: tenantName || name,
    tenantSlug: tenantSlug || email.split("@")[0],
  };
  if (role) {
    body.role = role;
  }
  const res = await api.post<LoginResponse>("/auth/register", body, {
    skipAuth: true,
  });
  setToken(res.token, res.refreshToken);
  return res;
}

export function logout(): void {
  clearTokens();
  // Não usa window.location.href - SPA sem router, store gerencia estado
}

export async function updateProfile(
  name: string,
): Promise<{ id: string; name: string; email: string }> {
  return api.put("/auth/profile", { name });
}

export async function forgotPassword(
  email: string,
): Promise<{ message: string }> {
  return api.post("/auth/forgot-password", { email }, { skipAuth: true });
}

export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<{ message: string }> {
  return api.post(
    "/auth/reset-password",
    { token, newPassword },
    { skipAuth: true },
  );
}
