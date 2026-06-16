import { create } from 'zustand'
import { getToken, setToken, clearTokens, isAuthenticated, setLogoutFn } from '@/api/client'
import * as authApi from '@/api/auth'

interface AuthUser {
  id: string
  name: string
  email: string
  roles: string[]
  tenantId?: string
  tenantName?: string
  tenantSlug?: string
}

interface AuthState {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string, tenantName?: string, tenantSlug?: string) => Promise<void>
  logout: () => void
  checkAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => {
  // Registra a função de logout para o HttpClient (401 handler)
  setLogoutFn(() => {
    clearTokens()
    set({ user: null, isAuthenticated: false, isLoading: false, error: null })
  })

  return {
  user: null,
  isLoading: true,
  isAuthenticated: isAuthenticated(),
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null })
    try {
      const res = await authApi.login(email, password)
      set({
        user: { id: res.userId, name: res.name, email: res.email, roles: res.roles, tenantId: res.tenantId, tenantName: res.tenantName, tenantSlug: res.tenantSlug },
        isAuthenticated: true,
        isLoading: false,
        error: null,
      })
    } catch (err: any) {
      set({
        isLoading: false,
        error: err?.message || 'Falha ao autenticar. Verifique suas credenciais.',
        isAuthenticated: false,
      })
      throw err
    }
  },

  register: async (name: string, email: string, password: string, tenantName?: string, tenantSlug?: string) => {
    set({ isLoading: true, error: null })
    try {
      const res = await authApi.register(name, email, password, tenantName, tenantSlug)
      set({
        user: { id: res.userId, name: res.name, email: res.email, roles: res.roles, tenantId: res.tenantId, tenantName: res.tenantName, tenantSlug: res.tenantSlug },
        isAuthenticated: true,
        isLoading: false,
        error: null,
      })
    } catch (err: any) {
      set({
        isLoading: false,
        error: err?.message || 'Falha ao registrar. Verifique os dados informados.',
        isAuthenticated: false,
      })
      throw err
    }
  },

  logout: () => {
    clearTokens()
    set({ user: null, isAuthenticated: false, isLoading: false, error: null })
  },

  checkAuth: async () => {
    const token = getToken()
    if (!token) {
      set({ isAuthenticated: false, isLoading: false, user: null })
      return
    }
    try {
      const me = await authApi.getMe()
      set({ user: me, isAuthenticated: true, isLoading: false })
    } catch {
      const refreshed = await authApi.refreshToken()
      if (refreshed) {
        set({
          user: { id: refreshed.userId, name: refreshed.name, email: refreshed.email, roles: refreshed.roles, tenantId: refreshed.tenantId, tenantName: refreshed.tenantName, tenantSlug: refreshed.tenantSlug },
          isAuthenticated: true,
          isLoading: false,
        })
      } else {
        clearTokens()
        set({ user: null, isAuthenticated: false, isLoading: false })
      }
    }
  },
  }
})
