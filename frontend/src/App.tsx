import {
  useEffect,
  useState,
  useMemo,
  Suspense,
  lazy,
  ComponentType,
} from "react";
import {
  LayoutDashboard,
  Box,
  Eye,
  DollarSign,
  Cpu,
  BrainCircuit,
  Cloud,
  LogOut,
  ScrollText,
  Shield,
  Activity,
  ChevronRight,
  ChevronDown,
  Settings,
  Building2,
  Check,
  BookOpen,
  Search,
  X,
  ArrowRight,
  BarChart3,
  Flag,
  Wrench,
} from "lucide-react";
import { useUiStore } from "@/store/uiStore";
import { useAuthStore } from "@/store/authStore";
import { useEventStream } from "@/hooks/useEventStream";
import { useTenantStore } from "@/store/tenantStore";
import { useOnboardingStore } from "@/store/onboardingStore";
import { useCredentialStore } from "@/store/credentialStore";
import { useRepoStore } from "@/store/repoStore";
import { setToken } from "@/api/client";
import { LoginPage } from "@/shared/auth/LoginPage";
import { RegisterPage } from "@/shared/auth/RegisterPage";
import { ForgotPasswordPage } from "@/shared/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "@/shared/auth/ResetPasswordPage";
import { OnboardingWelcome } from "@/app/onboarding/OnboardingWelcome";
import { OnboardingTour } from "@/app/onboarding/OnboardingTour";
import { GatewaySetup } from "@/app/onboarding/GatewaySetup";
import { ToastProvider } from "@/lib/toast";
import { TenantSelector } from "@/components/TenantSelector";
import LandingPage from "@/pages/LandingPage";
import { ProtectedContent } from "@/components/ProtectedContent";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OfflineBanner } from "@/components/OfflineBanner";
import GlobalSearch from "@/components/GlobalSearch";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Helper for named-export modules: lazy(() => import('./Foo')) needs default export,
// but our modules use named exports. This bridges the gap.
function lazyImport<
  T extends Record<string, ComponentType<any>>,
  K extends keyof T,
>(factory: () => Promise<T>, name: K) {
  return lazy(() => factory().then((mod) => ({ default: mod[name] })));
}

// Lazy-loaded modules (code-split into separate chunks)
const DashboardModule = lazyImport(
  () => import("@/modules/dashboard/DashboardModule"),
  "DashboardModule",
);
const CanvasModule = lazyImport(
  () => import("@/modules/canvas/DesignModule"),
  "DesignModule",
);
const ProvisioningModule = lazyImport(
  () => import("@/modules/provisioning/ProvisionModule"),
  "ProvisionModule",
);
const ObservabilityModule = lazyImport(
  () => import("@/modules/observability/ObserveModule"),
  "ObserveModule",
);
const FinOpsModule = lazyImport(
  () => import("@/modules/finops/CostModule"),
  "CostModule",
);
const PlatformModule = lazyImport(
  () => import("@/modules/platform/PlatformModule"),
  "PlatformModule",
);
const AIModule = lazyImport(
  () => import("@/modules/ai/AIOpsModule"),
  "AIOpsModule",
);
const SecurityModule = lazyImport(
  () => import("@/modules/security/AuditModule"),
  "AuditModule",
);
const SettingsModule = lazyImport(
  () => import("@/modules/settings/SettingsModule"),
  "SettingsModule",
);
const DocsModule = lazyImport(
  () => import("@/modules/settings/DocsModule"),
  "DocsModule",
);
const FeatureFlagsPage = lazyImport(
  () => import("@/modules/settings/FeatureFlagsPage"),
  "FeatureFlagsPage",
);
const BlogModule = lazyImport(
  () => import("@/modules/blog/BlogModule"),
  "BlogModule",
);

function ModuleFallback() {
  return (
    <div className="flex items-center justify-center h-full py-24">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-brand-navy flex items-center justify-center">
          <Cloud className="h-4 w-4 text-brand-lime animate-pulse" />
        </div>
        <div className="w-5 h-5 border-2 border-brand-navy border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );
}

const moduleHierarchy: Record<string, { section: string; path: string[] }> = {
  dashboard: { section: "Visão Geral", path: ["Dashboard"] },
  design: { section: "Infraestrutura", path: ["Infraestrutura", "Design"] },
  provision: {
    section: "Infraestrutura",
    path: ["Infraestrutura", "Provisionamento"],
  },
  observe: { section: "Operações", path: ["Operações", "Observabilidade"] },
  cost: { section: "Operações", path: ["Operações", "Custos"] },
  platform: { section: "Plataforma", path: ["Plataforma", "Catálogo"] },
  aiops: { section: "Operações", path: ["Operações", "AIOps"] },
  audit: { section: "Governança", path: ["Governança", "Auditoria"] },
  iam: { section: "Governança", path: ["Governança", "IAM"] },
  settings: { section: "Governança", path: ["Governança", "Configurações"] },
  docs: { section: "Governança", path: ["Governança", "Docs"] },
  analytics: { section: "Visão Geral", path: ["Visão Geral", "Análises"] },
  flags: { section: "Governança", path: ["Governança", "Feature Flags"] },
  workspace: { section: "Organização", path: ["Organização", "Workspace"] },
  projects: { section: "Organização", path: ["Organização", "Projetos"] },
  notifications: {
    section: "Organização",
    path: ["Organização", "Notificações"],
  },
  billing: { section: "Organização", path: ["Organização", "Billing"] },
  blog: { section: "Marketing", path: ["Marketing", "Blog"] },
};

const navGroups = [
  {
    label: "Visão Geral",
    items: [
      { id: "dashboard" as const, label: "Dashboard", icon: Activity },
      { id: "dashboard" as const, label: "Análises", icon: BarChart3 },
    ],
  },
  {
    label: "Infraestrutura",
    items: [
      { id: "canvas" as const, label: "Design", icon: LayoutDashboard },
      { id: "provisioning" as const, label: "Provisionar", icon: Box },
    ],
  },
  {
    label: "Operações",
    items: [
      { id: "observability" as const, label: "Observar", icon: Eye },
      { id: "finops" as const, label: "Custos", icon: DollarSign },
      { id: "ai" as const, label: "AIOps", icon: BrainCircuit },
    ],
  },
  {
    label: "Plataforma",
    items: [{ id: "platform" as const, label: "Plataforma", icon: Cpu }],
  },
  {
    label: "Governança",
    items: [
      { id: "security" as const, label: "Auditoria", icon: ScrollText },
      { id: "security" as const, label: "IAM", icon: Shield },
      { id: "settings" as const, label: "Configurações", icon: Settings },
      { id: "flags" as const, label: "Flags", icon: Flag },
      { id: "docs" as const, label: "Docs", icon: BookOpen },
    ],
  },
  {
    label: "Marketing",
    items: [
      { id: "blog" as const, label: "Blog", icon: BookOpen },
    ],
  },
];

const moduleLabels: Record<string, string> = {
  dashboard: "Dashboard",
  canvas: "Canvas",
  provisioning: "Provisionamento",
  observability: "Observabilidade",
  finops: "Custos",
  platform: "Plataforma",
  ai: "AI",
  security: "Segurança",
  settings: "Configurações",
  docs: "Documentação",
};

const moduleRoles: Record<string, string[]> = {
  security: ["admin"],
  flags: ["admin"],
  settings: undefined as unknown as string[],
};

const moduleComponents: Record<string, React.ReactNode> = {
  dashboard: (
    <ErrorBoundary moduleName="Dashboard">
      <Suspense fallback={<ModuleFallback />}>
        <DashboardModule />
      </Suspense>
    </ErrorBoundary>
  ),
  canvas: (
    <ErrorBoundary moduleName="Canvas">
      <Suspense fallback={<ModuleFallback />}>
        <CanvasModule />
      </Suspense>
    </ErrorBoundary>
  ),
  provisioning: (
    <ErrorBoundary moduleName="Provisionamento">
      <Suspense fallback={<ModuleFallback />}>
        <ProvisioningModule />
      </Suspense>
    </ErrorBoundary>
  ),
  observability: (
    <ErrorBoundary moduleName="Observabilidade">
      <Suspense fallback={<ModuleFallback />}>
        <ObservabilityModule />
      </Suspense>
    </ErrorBoundary>
  ),
  finops: (
    <ErrorBoundary moduleName="Custos">
      <Suspense fallback={<ModuleFallback />}>
        <FinOpsModule />
      </Suspense>
    </ErrorBoundary>
  ),
  platform: (
    <ErrorBoundary moduleName="Plataforma">
      <Suspense fallback={<ModuleFallback />}>
        <PlatformModule />
      </Suspense>
    </ErrorBoundary>
  ),
  ai: (
    <ErrorBoundary moduleName="AI">
      <Suspense fallback={<ModuleFallback />}>
        <AIModule />
      </Suspense>
    </ErrorBoundary>
  ),
  security: (
    <ProtectedContent roles={["admin"]}>
      <ErrorBoundary moduleName="Segurança">
        <Suspense fallback={<ModuleFallback />}>
          <SecurityModule />
        </Suspense>
      </ErrorBoundary>
    </ProtectedContent>
  ),
  docs: (
    <ErrorBoundary moduleName="Documentação">
      <Suspense fallback={<ModuleFallback />}>
        <DocsModule />
      </Suspense>
    </ErrorBoundary>
  ),
  settings: (
    <ErrorBoundary moduleName="Configurações">
      <Suspense fallback={<ModuleFallback />}>
        <SettingsModule />
      </Suspense>
    </ErrorBoundary>
  ),
  blog: (
    <ErrorBoundary moduleName="Blog">
      <Suspense fallback={<ModuleFallback />}>
        <BlogModule />
      </Suspense>
    </ErrorBoundary>
  ),
  flags: (
    <ProtectedContent roles={["admin"]}>
      <ErrorBoundary moduleName="Flags">
        <Suspense fallback={<ModuleFallback />}>
          <FeatureFlagsPage />
        </Suspense>
      </ErrorBoundary>
    </ProtectedContent>
  ),
};

function App() {
  const { activeModule, setActiveModule, toggleSearch, fetchFlags, isEnabled } =
    useUiStore();
  const { isAuthenticated, isLoading, checkAuth, logout, user } =
    useAuthStore();
  // Connect to SSE event stream for real-time cross-module updates
  useEventStream();

  const { projects, activeProjectId, switchProject, getActiveProject } =
    useTenantStore();
  const {
    progress,
    hasSeenWelcome,
    setStage,
    skipOnboarding,
    markTourCompleted,
    resetToWelcome,
  } = useOnboardingStore();
  const { credentials, environments, fetchCredentials } = useCredentialStore();
  const { connectedRepos } = useRepoStore();
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const [showSetupPopover, setShowSetupPopover] = useState(false);
  const [query, setQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  interface NavItem {
    id: string;
    label: string;
    icon: React.ElementType;
  }
  // Flatten nav items for search
  const allNavItems = useMemo<NavItem[]>(
    () => navGroups.flatMap((g) => g.items as unknown as NavItem[]),
    [],
  );
  const searchResults = useMemo<NavItem[]>(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return allNavItems.filter(
      (item) => item.label.toLowerCase().includes(q) || item.id.includes(q),
    );
  }, [query, allNavItems]);

  const hasCredentials = credentials.length > 0;
  const hasEnvironments = environments.length > 0;
  const hasRepos = connectedRepos.length > 0;
  const configuredCount = [hasCredentials, hasEnvironments, hasRepos].filter(
    Boolean,
  ).length;
  const totalConfigItems = 3;
  const [authMode, setAuthMode] = useState<
    "login" | "register" | "forgot-password" | "reset-password"
  >("login");
  const [resetToken, setResetToken] = useState<string | null>(null);

  // Onboarding routing: only applies when authenticated and not yet completed
  type OnboardingView = "welcome" | "tour" | "gateway" | "done";
  const [onboardingView, setOnboardingView] = useState<OnboardingView>(() => {
    if (progress.stage === "complete" || progress.stage === "skipped")
      return "done";
    if (progress.stage === "gateway-setup") return "gateway";
    return "welcome";
  });

  useEffect(() => {
    // Check for URL params (SSO callback or reset-password)
    // Backend redirects with URL fragment (#token=...) per ADR-025,
    // so fall back to window.location.hash if search is empty
    const searchParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(
      window.location.hash.replace(/^#/, ""),
    );
    const params = searchParams.size > 0 ? searchParams : hashParams;
    const mode = params.get("authMode");
    const token = params.get("token");
    const refreshToken = params.get("refreshToken");

    if (mode === "reset-password" && token) {
      setResetToken(token);
      setAuthMode("reset-password");
      window.history.replaceState({}, "", window.location.pathname);
    } else if (token && mode !== "reset-password") {
      // SSO callback: store token and let checkAuth() load user data
      setToken(token, refreshToken || undefined);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Fetch feature flags and credentials after authentication
  useEffect(() => {
    if (isAuthenticated) {
      fetchFlags();
      fetchCredentials();
    }
  }, [isAuthenticated, fetchFlags, fetchCredentials]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        toggleSearch();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSearch]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-brand-navy flex items-center justify-center">
            <Cloud className="h-5 w-5 text-brand-lime animate-pulse" />
          </div>
          <div className="w-6 h-6 border-2 border-brand-navy border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (authMode === "register") {
      return <RegisterPage onSwitchToLogin={() => setAuthMode("login")} />;
    }
    if (authMode === "forgot-password") {
      return (
        <ForgotPasswordPage onSwitchToLogin={() => setAuthMode("login")} />
      );
    }
    if (authMode === "reset-password" && resetToken) {
      return (
        <ResetPasswordPage
          token={resetToken}
          onSwitchToLogin={() => setAuthMode("login")}
        />
      );
    }
    // Default: show login page
    return (
      <LoginPage
        onSwitchToRegister={() => setAuthMode("register")}
        onSwitchToForgotPassword={() => setAuthMode("forgot-password")}
      />
    );
  }

  // Onboarding flow — after auth, before main app
  if (onboardingView !== "done") {
    if (onboardingView === "welcome") {
      return (
        <OnboardingWelcome
          onStartTour={() => setOnboardingView("tour")}
          onStartSetup={() => {
            setStage("gateway-setup");
            setOnboardingView("gateway");
          }}
          onSkip={() => {
            skipOnboarding();
            setOnboardingView("done");
          }}
        />
      );
    }
    if (onboardingView === "tour") {
      return (
        <OnboardingTour
          onComplete={() => {
            markTourCompleted();
            setOnboardingView("done");
          }}
          onSkip={() => setOnboardingView("done")}
        />
      );
    }
    if (onboardingView === "gateway") {
      return (
        <GatewaySetup
          onComplete={() => setOnboardingView("done")}
          onSkip={() => {
            skipOnboarding();
            setOnboardingView("done");
          }}
        />
      );
    }
  }

  return (
    <ToastProvider>
      <ErrorBoundary moduleName="Geral">
        <div className="h-screen w-screen flex flex-col overflow-hidden bg-slate-50 relative">
          {/* Dot grid background */}
          <div className="fixed inset-0 dot-grid pointer-events-none z-0 opacity-60" />
          <header className="h-14 bg-white/90 backdrop-blur-sm border-b border-slate-200 flex items-center px-5 gap-1 shrink-0 z-30">
            <div className="flex items-center gap-3 group cursor-pointer shrink-0">
              <div className="w-8 h-8 rounded-lg bg-brand-navy flex items-center justify-center transition-transform group-hover:scale-105">
                <Cloud className="h-5 w-5 text-brand-lime" />
              </div>
              <span className="font-display font-bold text-base text-brand-navy">
                CloudBuilder
              </span>
            </div>

            {/* Tenant Selector */}
            <TenantSelector />

            {/* Project Switcher */}
            {isAuthenticated && projects.length > 0 && (
              <div className="relative mx-2 shrink-0">
                <button
                  onClick={() => setShowProjectMenu(!showProjectMenu)}
                  className="inline-flex items-center gap-1.5 px-2.5 h-7 rounded-lg text-[11px] font-semibold bg-ice-blue/60 text-brand-navy hover:bg-ice-blue border border-brand-navy/10 transition-all"
                >
                  <Building2 className="w-3 h-3" />
                  <span className="max-w-[100px] truncate">
                    {getActiveProject()?.name || "Projeto"}
                  </span>
                  <ChevronRight
                    className={cn(
                      "w-3 h-3 transition-transform",
                      showProjectMenu && "rotate-90",
                    )}
                  />
                </button>
                {showProjectMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowProjectMenu(false)}
                    />
                    <div className="absolute left-0 top-full mt-1 w-56 bg-white rounded-xl border border-slate-200 shadow-lg z-50 py-1 max-h-64 overflow-y-auto">
                      {projects.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => {
                            switchProject(p.id);
                            setShowProjectMenu(false);
                          }}
                          className={cn(
                            "w-full flex items-center gap-2 px-3 py-2 text-xs transition-all text-left",
                            p.id === activeProjectId
                              ? "bg-brand-navy/5 text-brand-navy font-bold"
                              : "text-slate-600 hover:bg-slate-50",
                          )}
                        >
                          <Building2
                            className={cn(
                              "w-3.5 h-3.5 shrink-0",
                              p.id === activeProjectId
                                ? "text-brand-navy"
                                : "text-slate-400",
                            )}
                          />
                          <span className="truncate flex-1">{p.name}</span>
                          {p.id === activeProjectId && (
                            <Check className="w-3 h-3 text-brand-navy shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 mx-4 shrink-0">
              {moduleHierarchy[activeModule]?.path.map((item, idx, arr) => (
                <div key={item} className="flex items-center gap-1.5">
                  {idx > 0 && (
                    <ChevronRight className="w-3 h-3 text-slate-300" />
                  )}
                  {idx === 0 ? (
                    <span className="text-[11px] font-medium text-slate-400">
                      {item}
                    </span>
                  ) : idx === arr.length - 1 ? (
                    <span className="text-[11px] font-bold text-brand-navy">
                      {item}
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium text-slate-500">
                      {item}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Visual separator */}
            <div className="w-px h-6 bg-slate-200 mx-1 shrink-0" />

            <nav className="flex items-center gap-0.5 shrink-0">
              {navGroups.map((group) => {
                const visibleItems = group.items.filter((item) => {
                  // RBAC check
                  const reqRoles = moduleRoles[item.id];
                  const hasRole =
                    !reqRoles ||
                    !user?.roles ||
                    reqRoles.some((r) => user.roles.includes(r));
                  if (!hasRole) return false;
                  // Feature flag check (AND com RBAC per ADR-032)
                  if (item.id === "finops") return isEnabled("module.cost");
                  if (item.id === "platform")
                    return isEnabled("module.platform");
                  if (item.id === "ai") return isEnabled("module.aiops");
                  if (item.id === "security") return isEnabled("module.audit");
                  return true;
                });
                if (visibleItems.length === 0) return null;

                if (visibleItems.length === 1) {
                  const item = visibleItems[0];
                  const isActive = activeModule === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveModule(item.id)}
                      className={`
                    relative h-8 px-3 text-xs font-semibold transition-all flex items-center gap-1.5 rounded-lg shrink-0
                    ${
                      isActive
                        ? "text-brand-navy bg-brand-navy/5"
                        : "text-slate-500 hover:text-brand-navy hover:bg-slate-100"
                    }
                  `}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                      {isActive && (
                        <span className="absolute bottom-0.5 left-1.5 right-1.5 h-0.5 bg-brand-lime rounded-full" />
                      )}
                    </button>
                  );
                }

                const isGroupActive = visibleItems.some(
                  (item) => activeModule === item.id,
                );
                return (
                  <div key={group.label} className="relative group shrink-0">
                    <button
                      className={`
                    relative h-8 px-3 text-xs font-semibold transition-all flex items-center gap-1.5 rounded-lg cursor-default
                    ${
                      isGroupActive
                        ? "text-brand-navy bg-brand-navy/5"
                        : "text-slate-500 hover:text-brand-navy hover:bg-slate-100"
                    }
                  `}
                    >
                      <span>{group.label}</span>
                      <ChevronDown className="h-3 w-3 opacity-50 group-hover:opacity-80 transition-opacity" />
                      {isGroupActive && (
                        <span className="absolute bottom-0.5 left-1.5 right-1.5 h-0.5 bg-brand-lime rounded-full" />
                      )}
                    </button>
                    <div className="absolute left-0 top-full mt-1 min-w-[11rem] bg-white rounded-xl border border-slate-200 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 py-1 overflow-hidden">
                      <div className="py-0.5">
                        {visibleItems.map((item) => {
                          const isItemActive = activeModule === item.id;
                          return (
                            <button
                              key={item.id}
                              onClick={() => setActiveModule(item.id)}
                              className={`
                            w-full flex items-center gap-3 px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap
                            ${
                              isItemActive
                                ? "text-brand-navy bg-brand-navy/5 font-semibold"
                                : "text-slate-600 hover:bg-slate-50 hover:text-brand-navy"
                            }
                          `}
                            >
                              <span
                                className={cn(
                                  "flex items-center justify-center w-6 h-6 rounded-lg shrink-0",
                                  isItemActive
                                    ? "bg-brand-navy/10"
                                    : "bg-slate-100",
                                )}
                              >
                                <item.icon className="h-3.5 w-3.5" />
                              </span>
                              <span className="flex-1 text-left">
                                {item.label}
                              </span>
                              {isItemActive && (
                                <span className="w-1.5 h-1.5 rounded-full bg-brand-lime shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </nav>

            {/* Global Search Bar */}
            <div className="relative flex-1 max-w-xs mx-3 shrink-0">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setShowSearch(true)}
                onBlur={() => setTimeout(() => setShowSearch(false), 200)}
                placeholder="Pesquisar módulos, recursos..."
                className="w-full h-8 pl-8 pr-3 rounded-lg bg-slate-100 border border-transparent text-xs text-brand-navy placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-slate-200 focus:shadow-sm transition-all"
              />
              {query.length > 0 && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              {showSearch && query.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl border border-slate-200 shadow-lg z-50 py-2 max-h-72 overflow-y-auto">
                  {searchResults.length === 0 ? (
                    <div className="px-3.5 py-3 text-xs text-slate-400 text-center">
                      Nenhum resultado encontrado
                    </div>
                  ) : (
                    searchResults.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => {
                          setActiveModule(
                            r.id as
                              | "canvas"
                              | "provisioning"
                              | "observability"
                              | "finops"
                              | "platform"
                              | "ai"
                              | "security"
                              | "security"
                              | "dashboard"
                              | "docs"
                              | "settings"
                              | "dashboard",
                          );
                          setQuery("");
                          setShowSearch(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-left hover:bg-slate-50 transition-colors"
                      >
                        <r.icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-medium text-brand-navy">
                          {r.label}
                        </span>
                        <ArrowRight className="w-3 h-3 text-slate-300 ml-auto shrink-0" />
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="ml-auto flex items-center gap-3">
              {/* Setup Status Indicator */}
              <div className="relative hidden sm:block">
                <button
                  onClick={() => setShowSetupPopover(!showSetupPopover)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 h-7 rounded-full text-[10px] font-semibold border transition-all",
                    configuredCount === totalConfigItems
                      ? "bg-green-50 border-green-200 text-green-700"
                      : configuredCount > 0
                        ? "bg-amber-50 border-amber-200 text-amber-700"
                        : "bg-red-50 border-red-200 text-red-700",
                  )}
                >
                  <span
                    className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      configuredCount === totalConfigItems
                        ? "bg-green-500"
                        : configuredCount > 0
                          ? "bg-amber-500"
                          : "bg-red-500",
                    )}
                  />
                  {configuredCount}/{totalConfigItems}
                </button>
                {showSetupPopover && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowSetupPopover(false)}
                    />
                    <div className="absolute right-0 top-full mt-1.5 w-56 bg-white rounded-xl border border-slate-200 shadow-lg z-50 p-3 space-y-2">
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Configuração
                      </p>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-xs">
                          <span
                            className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              hasCredentials ? "bg-green-500" : "bg-slate-300",
                            )}
                          />
                          <span
                            className={
                              hasCredentials
                                ? "text-brand-navy font-medium"
                                : "text-slate-400"
                            }
                          >
                            Credenciais
                          </span>
                          <span className="ml-auto text-slate-400">
                            {credentials.length}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span
                            className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              hasEnvironments ? "bg-green-500" : "bg-slate-300",
                            )}
                          />
                          <span
                            className={
                              hasEnvironments
                                ? "text-brand-navy font-medium"
                                : "text-slate-400"
                            }
                          >
                            Ambientes
                          </span>
                          <span className="ml-auto text-slate-400">
                            {environments.length}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span
                            className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              hasRepos ? "bg-green-500" : "bg-slate-300",
                            )}
                          />
                          <span
                            className={
                              hasRepos
                                ? "text-brand-navy font-medium"
                                : "text-slate-400"
                            }
                          >
                            Repositórios
                          </span>
                          <span className="ml-auto text-slate-400">
                            {connectedRepos.length}
                          </span>
                        </div>
                      </div>
                      {configuredCount < totalConfigItems && (
                        <button
                          onClick={() => {
                            setShowSetupPopover(false);
                            resetToWelcome();
                            setOnboardingView("welcome");
                          }}
                          className="w-full mt-1 inline-flex items-center justify-center gap-1.5 px-3 h-8 rounded-lg text-[11px] font-bold bg-brand-navy text-white hover:bg-[#0D1B2A] transition-all"
                        >
                          Continuar Configuração
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>

              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 border border-green-200">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
                </span>
                <span className="text-[10px] font-semibold text-green-700">
                  Online
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500 group relative">
                <div className="w-7 h-7 rounded-full bg-brand-navy flex items-center justify-center ring-2 ring-transparent hover:ring-brand-lime/50 transition-all">
                  <span className="text-[10px] font-bold text-brand-lime">
                    {user?.name?.substring(0, 2).toUpperCase() || "?"}
                  </span>
                </div>
                <span className="text-xs font-medium hidden sm:inline text-slate-600">
                  {user?.name || "Usuário"}
                </span>
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl border border-slate-200 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  <div className="p-3 border-b border-slate-100">
                    <p className="text-sm font-medium text-brand-navy">
                      {user?.name}
                    </p>
                    <p className="text-xs text-slate-400">{user?.email}</p>
                  </div>
                  <div className="p-1">
                    {(configuredCount < totalConfigItems ||
                      progress.stage === "skipped") && (
                      <button
                        onClick={() => {
                          resetToWelcome();
                          setOnboardingView("welcome");
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-brand-navy hover:bg-ice-blue/50 rounded-lg transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        Reabrir Configuração
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setActiveModule("settings");
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      Configurações
                    </button>
                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sair
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </header>
          <OfflineBanner />
          <GlobalSearch />
          <main className="flex-1 overflow-hidden">
            {moduleComponents[activeModule]}
          </main>
        </div>
      </ErrorBoundary>
    </ToastProvider>
  );
}

export default App;
