import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  getToken,
  setToken,
  clearTokens,
  isAuthenticated,
  setLogoutFn,
  setActiveTenantId,
} from "@/api/client";
import * as authApi from "@/api/auth";
import { getUserPermissions, type UserPermissionsDTO } from "@/api/iam";

async function fetchPermissions(userId: string): Promise<UserPermissionsDTO[]> {
  try {
    return await getUserPermissions(userId);
  } catch {
    return [];
  }
}

function normalizeRoles(roles: string[]): string[] {
  return [...new Set(roles.map((role) => role.toLowerCase()))];
}

interface AuthUser {
  id: string;
  name: string;
  email: string;
  roles: string[];
  tenantId?: string;
  tenantName?: string;
  tenantSlug?: string;
  tenantPermissions?: UserPermissionsDTO[];
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    tenantName?: string,
    tenantSlug?: string,
    role?: string,
  ) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => {
      // Registra a função de logout para o HttpClient (401 handler)
      setLogoutFn(() => {
        clearTokens();
        setActiveTenantId();
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      });

      return {
        user: null,
        isLoading: true,
        isAuthenticated: isAuthenticated(),
        error: null,

        login: async (email: string, password: string) => {
          set({ isLoading: true, error: null });
          try {
            const res = await authApi.login(email, password);
            const tenantPermissions = await fetchPermissions(res.userId).catch(
              () => undefined,
            );
            setActiveTenantId(res.tenantId);
            set({
              user: {
                id: res.userId,
                name: res.name,
                email: res.email,
                roles: normalizeRoles(res.roles),
                tenantId: res.tenantId,
                tenantName: res.tenantName,
                tenantSlug: res.tenantSlug,
                tenantPermissions,
              },
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } catch (err: any) {
            set({
              isLoading: false,
              error:
                err?.message ||
                "Falha ao autenticar. Verifique suas credenciais.",
              isAuthenticated: false,
            });
            throw err;
          }
        },

        register: async (
          name: string,
          email: string,
          password: string,
          tenantName?: string,
          tenantSlug?: string,
          role?: string,
        ) => {
          set({ isLoading: true, error: null });
          try {
            const res = await authApi.register(
              name,
              email,
              password,
              tenantName,
              tenantSlug,
              role,
            );
            const tenantPermissions = await fetchPermissions(res.userId).catch(
              () => undefined,
            );
            setActiveTenantId(res.tenantId);
            set({
              user: {
                id: res.userId,
                name: res.name,
                email: res.email,
                roles: normalizeRoles(res.roles),
                tenantId: res.tenantId,
                tenantName: res.tenantName,
                tenantSlug: res.tenantSlug,
                tenantPermissions,
              },
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } catch (err: any) {
            set({
              isLoading: false,
              error:
                err?.message ||
                "Falha ao registrar. Verifique os dados informados.",
              isAuthenticated: false,
            });
            throw err;
          }
        },

        logout: () => {
          clearTokens();
          setActiveTenantId();
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        },

        checkAuth: async () => {
          const token = getToken();
          if (!token) {
            set({ isAuthenticated: false, isLoading: false, user: null });
            return;
          }
          try {
            const me = await authApi.getMe();
            const tenantPermissions = await fetchPermissions(me.id).catch(
              () => undefined,
            );
            setActiveTenantId(me.tenantId);
            set({
              user: {
                ...me,
                roles: normalizeRoles(me.roles),
                tenantPermissions,
              },
              isAuthenticated: true,
              isLoading: false,
            });
          } catch {
            const refreshed = await authApi.refreshToken();
            if (refreshed) {
              const tenantPermissions = await fetchPermissions(
                refreshed.userId,
              ).catch(() => undefined);
              setActiveTenantId(refreshed.tenantId);
              set({
                user: {
                  id: refreshed.userId,
                  name: refreshed.name,
                  email: refreshed.email,
                  roles: normalizeRoles(refreshed.roles),
                  tenantId: refreshed.tenantId,
                  tenantName: refreshed.tenantName,
                  tenantSlug: refreshed.tenantSlug,
                  tenantPermissions,
                },
                isAuthenticated: true,
                isLoading: false,
              });
            } else {
              clearTokens();
              set({ user: null, isAuthenticated: false, isLoading: false });
            }
          }
        },
      };
    },
    {
      name: "cloudbuilder-auth-storage",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
