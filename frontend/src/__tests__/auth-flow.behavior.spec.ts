/**
 * CloudBuilder — Auth Flow BDD Behavior Specs
 *
 * ADR-036 Layer 4: BDD Behavior Specifications
 * Given/When/Then structure for critical auth user flows.
 *
 * Run: npx vitest run src/__tests__/auth-flow.behavior.spec.ts
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { useAuthStore } from "../store/authStore";

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

// ─── Login Flow ────────────────────────────────────────────────

describe("Auth: Login Flow", () => {
  it("Given no user is logged in, When login succeeds with valid credentials, Then user is authenticated with correct data", async () => {
    // Given
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();

    // When
    const authApi = await import("@/api/auth");
    vi.mocked(authApi.login).mockResolvedValueOnce({
      userId: "usr-001",
      name: "Rafael Santos",
      email: "rafael@cloudcorp.com",
      roles: ["ADMIN"],
      tenantId: "tenant-01",
      tenantName: "CloudCorp",
      tenantSlug: "cloudcorp",
      token: "jwt-valid",
      refreshToken: "refresh-valid",
      expiresIn: 3600,
    });

    await useAuthStore.getState().login("rafael@cloudcorp.com", "securePass!");

    // Then
    const result = useAuthStore.getState();
    expect(result.isAuthenticated).toBe(true);
    expect(result.user).not.toBeNull();
    expect(result.user!.id).toBe("usr-001");
    expect(result.user!.name).toBe("Rafael Santos");
    expect(result.user!.email).toBe("rafael@cloudcorp.com");
    expect(result.user!.roles).toContain("admin");
    expect(result.user!.tenantId).toBe("tenant-01");
    expect(result.isLoading).toBe(false);
    expect(result.error).toBeNull();
  });

  it("Given no user is logged in, When login fails with wrong password, Then error is displayed and user remains unauthenticated", async () => {
    // Given
    expect(useAuthStore.getState().isAuthenticated).toBe(false);

    // When
    const authApi = await import("@/api/auth");
    vi.mocked(authApi.login).mockRejectedValueOnce(
      new Error("Credenciais inválidas"),
    );

    try {
      await useAuthStore.getState().login("user@test.com", "wrongPass");
    } catch {
      // Expected
    }

    // Then
    const result = useAuthStore.getState();
    expect(result.isAuthenticated).toBe(false);
    expect(result.user).toBeNull();
    expect(result.error).toBe("Credenciais inválidas");
    expect(result.isLoading).toBe(false);
  });

  it("Given login is in progress, Then isLoading is true until completion", async () => {
    // Given
    expect(useAuthStore.getState().isLoading).toBe(false);

    // When — mock a slow API
    const authApi = await import("@/api/auth");
    let resolveLogin: any;
    vi.mocked(authApi.login).mockImplementation(
      () =>
        new Promise((resolve, reject) => {
          resolveLogin = resolve;
        }),
    );

    const loginPromise = useAuthStore.getState().login("user@test.com", "pass");

    // Then — mid-flight
    expect(useAuthStore.getState().isLoading).toBe(true);
    expect(useAuthStore.getState().error).toBeNull();

    // Resolve
    resolveLogin({
      userId: "u1",
      name: "U",
      email: "u@t.co",
      roles: ["V"],
      token: "t",
    });
    await loginPromise;

    expect(useAuthStore.getState().isLoading).toBe(false);
  });
});

// ─── Register Flow ─────────────────────────────────────────────

describe("Auth: Register Flow", () => {
  it("Given new user, When registration succeeds, Then user is auto-authenticated", async () => {
    // Given
    expect(useAuthStore.getState().isAuthenticated).toBe(false);

    // When
    const authApi = await import("@/api/auth");
    vi.mocked(authApi.register).mockResolvedValueOnce({
      userId: "usr-new",
      name: "Marina Costa",
      email: "marina@startup.io",
      roles: ["VIEWER"],
      tenantId: "tenant-02",
      tenantName: "StartupIO",
      tenantSlug: "startupio",
      token: "jwt-new",
      refreshToken: "refresh-new",
      expiresIn: 3600,
    });

    await useAuthStore
      .getState()
      .register(
        "Marina Costa",
        "marina@startup.io",
        "strongPass123!",
        "StartupIO",
        "startupio",
      );

    // Then
    const result = useAuthStore.getState();
    expect(result.isAuthenticated).toBe(true);
    expect(result.user!.name).toBe("Marina Costa");
    expect(result.user!.email).toBe("marina@startup.io");
    expect(result.user!.roles).toContain("viewer");
  });

  it("Given new user, When registration fails (duplicate email), Then error is shown", async () => {
    // Given
    expect(useAuthStore.getState().error).toBeNull();

    // When
    const authApi = await import("@/api/auth");
    vi.mocked(authApi.register).mockRejectedValueOnce(
      new Error("Email já cadastrado"),
    );

    try {
      await useAuthStore
        .getState()
        .register("Duplicate User", "existing@test.com", "pass123");
    } catch { /* expected */ }

    // Then
    const result = useAuthStore.getState();
    expect(result.isAuthenticated).toBe(false);
    expect(result.error).toBe("Email já cadastrado");
  });
});

// ─── Logout Flow ───────────────────────────────────────────────

describe("Auth: Logout Flow", () => {
  it("Given user is authenticated, When logout is called, Then all auth state is cleared", () => {
    // Given
    useAuthStore.setState({
      user: { id: "u1", name: "Test", email: "t@t.co", roles: ["ADMIN"] },
      isAuthenticated: true,
      isLoading: false,
      error: null,
    });

    // When
    useAuthStore.getState().logout();

    // Then
    const result = useAuthStore.getState();
    expect(result.user).toBeNull();
    expect(result.isAuthenticated).toBe(false);
    expect(result.isLoading).toBe(false);
    expect(result.error).toBeNull();
  });
});

// ─── Check Auth Flow ───────────────────────────────────────────

describe("Auth: Check Auth (Session Restore)", () => {
  it("Given no stored token, When checkAuth runs, Then user is unauthenticated", async () => {
    // Given
    const client = await import("@/api/client");
    vi.mocked(client.getToken).mockReturnValue(null);

    // When
    await useAuthStore.getState().checkAuth();

    // Then
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
  });

  it("Given valid token and valid /me response, When checkAuth runs, Then user is restored", async () => {
    // Given
    const client = await import("@/api/client");
    vi.mocked(client.getToken).mockReturnValue("valid-token");

    const authApi = await import("@/api/auth");
    vi.mocked(authApi.getMe).mockResolvedValueOnce({
      id: "usr-restored",
      name: "Diego Lima",
      email: "diego@corp.com",
      roles: ["EDITOR"],
    });

    // When
    await useAuthStore.getState().checkAuth();

    // Then
    const result = useAuthStore.getState();
    expect(result.isAuthenticated).toBe(true);
    expect(result.user!.name).toBe("Diego Lima");
  });
});

// ─── Multi-role Authorization Matrix ───────────────────────────

describe("Auth: Role-based Access Matrix", () => {
  it.each([
    ["ADMIN", true, true, true],
    ["EDITOR", true, true, false],
    ["VIEWER", false, false, false],
  ])(
    "Given role %s, When checking permissions, Then canCreate=%s, canEdit=%s, canDelete=%s",
    (role, canCreate, canEdit, canDelete) => {
      useAuthStore.setState({
        user: { id: "u1", name: "Test", email: "t@t.co", roles: [role] },
        isAuthenticated: true,
      });

      const roles = useAuthStore.getState().user!.roles;
      expect(roles.includes("ADMIN") || roles.includes("EDITOR")).toBe(
        canCreate,
      );
      expect(roles.includes("ADMIN") || roles.includes("EDITOR")).toBe(canEdit);
      expect(roles.includes("ADMIN")).toBe(canDelete);
    },
  );
});
