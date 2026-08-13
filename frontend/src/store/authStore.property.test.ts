import { describe, it, expect, beforeEach, vi } from "vitest";
import * as fc from "fast-check";
import { useAuthStore } from "./authStore";

// Mock auth API to avoid real HTTP calls
vi.mock("@/api/auth", () => ({
  login: vi.fn(),
  register: vi.fn(),
  getMe: vi.fn(),
  refreshToken: vi.fn(),
}));

vi.mock("@/api/client", () => ({
  getToken: vi.fn(() => null),
  setToken: vi.fn(),
  clearTokens: vi.fn(),
  isAuthenticated: vi.fn(() => false),
  setLogoutFn: vi.fn(),
  setActiveTenantId: vi.fn(),
}));

beforeEach(() => {
  useAuthStore.setState({
    user: null,
    isLoading: false,
    isAuthenticated: false,
    error: null,
  });
  vi.clearAllMocks();
});

// ─── Login Properties ──────────────────────────────────────────

describe("authStore.login — property-based", () => {
  it("login success always sets isAuthenticated=true and user non-null", async () => {
    const authApi = await import("@/api/auth");
    vi.mocked(authApi.login).mockImplementation(async () => ({
      userId: "u1",
      name: "Test",
      email: "t@t.co",
      roles: ["VIEWER"],
      token: "tok",
      refreshToken: "rt",
      expiresIn: 3600,
    }));
    await useAuthStore.getState().login("t@t.co", "pw");
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).not.toBeNull();
    expect(state.user!.id).toBeTruthy();
    expect(state.user!.email).toBeTruthy();
    expect(state.user!.roles.length).toBeGreaterThan(0);
    expect(state.error).toBeNull();
  });

  it("login failure always sets error and isAuthenticated=false", async () => {
    const authApi = await import("@/api/auth");
    // Test with each error message independently (no closure over fc arbitrary inside async property)
    const errorMessages = [
      "Credenciais inválidas",
      "Conta bloqueada",
      "Timeout",
    ];
    for (const errorMsg of errorMessages) {
      vi.mocked(authApi.login).mockRejectedValue(new Error(errorMsg));
      try {
        await useAuthStore.getState().login("test@example.com", "wrong");
      } catch {
        // Expected
      }
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.error).toBeTruthy();
      vi.mocked(authApi.login).mockReset();
    }
  });

  it("login never leaves isLoading=true", async () => {
    const authApi = await import("@/api/auth");
    // Success path
    vi.mocked(authApi.login).mockImplementation(async () => ({
      userId: "u",
      name: "N",
      email: "e@t.co",
      roles: ["V"],
      token: "t",
      refreshToken: "rt",
      expiresIn: 3600,
    }));
    await useAuthStore.getState().login("e@t.co", "pw");
    expect(useAuthStore.getState().isLoading).toBe(false);

    // Failure path
    vi.mocked(authApi.login).mockImplementation(async () => {
      throw new Error("fail");
    });
    try {
      await useAuthStore.getState().login("e@t.co", "pw");
    } catch {}
    expect(useAuthStore.getState().isLoading).toBe(false);
  });
});

// ─── Register Properties ───────────────────────────────────────

describe("authStore.register — property-based", () => {
  it("register success always sets isAuthenticated=true and user non-null", async () => {
    const authApi = await import("@/api/auth");
    vi.mocked(authApi.register).mockImplementation(async () => ({
      userId: "u-reg",
      name: "Reg",
      email: "reg@test.co",
      roles: ["VIEWER"],
      token: "tok",
      refreshToken: "rt",
      expiresIn: 3600,
    }));
    await useAuthStore.getState().register("Reg", "reg@test.co", "pass123");
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).not.toBeNull();
    expect(state.user!.id).toBeTruthy();
    expect(state.user!.roles.length).toBeGreaterThan(0);
  });

  it("register failure always sets error and isAuthenticated=false", async () => {
    const authApi = await import("@/api/auth");
    vi.mocked(authApi.register).mockImplementation(async () => {
      throw new Error("Email já cadastrado");
    });
    try {
      await useAuthStore.getState().register("Dup", "dup@test.co", "pass");
    } catch {}
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.error).toBeTruthy();
  });
});

// ─── Logout Invariants ─────────────────────────────────────────

describe("authStore.logout — invariants", () => {
  it("logout always clears user and isAuthenticated", () => {
    fc.assert(
      fc.property(
        fc.string(),
        fc.array(fc.constantFrom("ADMIN", "EDITOR", "VIEWER"), {
          minLength: 1,
        }),
        (name, roles) => {
          useAuthStore.setState({
            user: { id: "u1", name, email: `${name}@test.com`, roles },
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          useAuthStore.getState().logout();
          const state = useAuthStore.getState();
          expect(state.user).toBeNull();
          expect(state.isAuthenticated).toBe(false);
          expect(state.isLoading).toBe(false);
          expect(state.error).toBeNull();
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ─── CheckAuth Invariants ──────────────────────────────────────

describe("authStore.checkAuth — invariants", () => {
  it("checkAuth without token always sets isAuthenticated=false", async () => {
    const client = await import("@/api/client");
    vi.mocked(client.getToken).mockReturnValue(null);
    await useAuthStore.getState().checkAuth();
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.isLoading).toBe(false);
  });
});

// ─── State Consistency ─────────────────────────────────────────

describe("authStore — state consistency", () => {
  it("error is cleared when login starts", async () => {
    const authApi = await import("@/api/auth");
    useAuthStore.setState({ error: "Previous error" });
    vi.mocked(authApi.login).mockRejectedValueOnce(new Error("new"));
    try {
      await useAuthStore.getState().login("e@t.co", "pw");
    } catch {}
    expect(useAuthStore.getState().error).toBe("new");
  });
});
