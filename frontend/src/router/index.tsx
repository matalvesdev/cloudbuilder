import { lazy, type ComponentType } from "react";

/**
 * Helper for named-export modules: lazy(() => import('./Foo')) needs default export,
 * but our modules use named exports. This bridges the gap.
 */
function lazyImport<
  T extends Record<string, ComponentType<any>>,
  K extends keyof T,
>(factory: () => Promise<T>, name: K) {
  return lazy(() => factory().then((mod) => ({ default: mod[name] })));
}

// Lazy-loaded modules (code-split into separate chunks)
export const DashboardModule = lazyImport(
  () => import("@/modules/dashboard/DashboardModule"),
  "DashboardModule",
);
export const CanvasModule = lazyImport(
  () => import("@/modules/canvas/DesignModule"),
  "DesignModule",
);
export const ProvisioningModule = lazyImport(
  () => import("@/modules/provisioning/ProvisionModule"),
  "ProvisionModule",
);
export const ObservabilityModule = lazyImport(
  () => import("@/modules/observability/ObserveModule"),
  "ObserveModule",
);
export const FinOpsModule = lazyImport(
  () => import("@/modules/finops/CostModule"),
  "CostModule",
);
export const PlatformModule = lazyImport(
  () => import("@/modules/platform/PlatformModule"),
  "PlatformModule",
);
export const AIModule = lazyImport(
  () => import("@/modules/ai/AIOpsModule"),
  "AIOpsModule",
);
export const SecurityModule = lazyImport(
  () => import("@/modules/security/AuditModule"),
  "AuditModule",
);
export const SettingsModule = lazyImport(
  () => import("@/modules/settings/SettingsModule"),
  "SettingsModule",
);
export const DocsModule = lazyImport(
  () => import("@/modules/settings/DocsModule"),
  "DocsModule",
);

/**
 * Module hierarchy for breadcrumb navigation
 */
export const moduleHierarchy: Record<
  string,
  { section: string; path: string[] }
> = {
  dashboard: { section: "Visão Geral", path: ["Dashboard"] },
  canvas: { section: "Infraestrutura", path: ["Infraestrutura", "Canvas"] },
  provisioning: {
    section: "Infraestrutura",
    path: ["Infraestrutura", "Provisionamento"],
  },
  observability: {
    section: "Operações",
    path: ["Operações", "Observabilidade"],
  },
  finops: { section: "Operações", path: ["Operações", "Custos"] },
  platform: { section: "Plataforma", path: ["Plataforma", "Catálogo"] },
  ai: { section: "Operações", path: ["Operações", "AI"] },
  security: { section: "Governança", path: ["Governança", "Segurança"] },
  settings: { section: "Governança", path: ["Governança", "Configurações"] },
  docs: { section: "Governança", path: ["Governança", "Docs"] },
  workspace: { section: "Organização", path: ["Organização", "Workspace"] },
  projects: { section: "Organização", path: ["Organização", "Projetos"] },
  notifications: {
    section: "Organização",
    path: ["Organização", "Notificações"],
  },
  billing: { section: "Organização", path: ["Organização", "Billing"] },
};

/**
 * Navigation groups for sidebar/header
 */
export const navGroups = [
  {
    label: "Visão Geral",
    items: [{ id: "dashboard" as const, label: "Dashboard", icon: "Activity" }],
  },
  {
    label: "Infraestrutura",
    items: [
      { id: "canvas" as const, label: "Canvas", icon: "LayoutDashboard" },
      { id: "provisioning" as const, label: "Provisionar", icon: "Box" },
    ],
  },
  {
    label: "Operações",
    items: [
      { id: "observability" as const, label: "Observar", icon: "Eye" },
      { id: "finops" as const, label: "Custos", icon: "DollarSign" },
      { id: "ai" as const, label: "AI", icon: "BrainCircuit" },
    ],
  },
  {
    label: "Plataforma",
    items: [{ id: "platform" as const, label: "Plataforma", icon: "Cpu" }],
  },
  {
    label: "Governança",
    items: [
      { id: "security" as const, label: "Segurança", icon: "Shield" },
      { id: "docs" as const, label: "Docs", icon: "BookOpen" },
    ],
  },
];

/**
 * Module display labels
 */
export const moduleLabels: Record<string, string> = {
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
  workspace: "Workspace",
  projects: "Projetos",
  notifications: "Notificações",
  billing: "Billing",
};

/**
 * Module role requirements (RBAC)
 */
export const moduleRoles: Record<string, string[]> = {
  security: ["admin"],
  settings: undefined as unknown as string[],
};

/**
 * Module type for navigation
 */
export type ModuleId = keyof typeof moduleLabels;
