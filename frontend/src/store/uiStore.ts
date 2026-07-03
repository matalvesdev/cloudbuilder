import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { featureFlagsApi, type FeatureFlagDTO } from '@/api/featureFlags'
import { getToken } from '@/api/client'

type ModuleId = 'canvas' | 'provisioning' | 'observability' | 'finops' | 'platform' | 'ai' | 'security' | 'dashboard' | 'docs' | 'settings' | 'workspace' | 'projects' | 'notifications' | 'billing';
type PanelTab = 'palette' | 'properties' | 'validation';
export type SettingsTab = 'credentials' | 'environments' | 'repositories' | 'multitenant' | 'profile' | 'system' | 'organization' | 'workspaces' | 'teams' | 'members' | 'permissions' | 'git-providers' | 'integrations' | 'security' | 'billing' | 'notifications' | 'audit' | 'api-tokens' | 'ssh-keys' | 'ai-settings';

// Map module IDs to their feature flag keys
const moduleFlagMap: Record<string, string> = {
  finops: 'module.cost',
  platform: 'module.platform',
  ai: 'module.aiops',
  security: 'module.audit',
}

interface UiState {
  sidebarOpen: boolean;
  propertiesPanelOpen: boolean;
  validationPanelOpen: boolean;
  showVersionPanel: boolean;
  searchOpen: boolean;
  activeTab: PanelTab;
  activeModule: ModuleId;
  settingsTab: SettingsTab;
  featureFlags: Record<string, FeatureFlagDTO>;
  flagsLoaded: boolean;
  flagsLoading: boolean;
  toggleSidebar: () => void;
  togglePropertiesPanel: () => void;
  toggleVersionPanel: () => void;
  toggleSearch: () => void;
  setSearchOpen: (open: boolean) => void;
  setActiveTab: (tab: PanelTab) => void;
  setActiveModule: (module: ModuleId) => void;
  setSettingsTab: (tab: SettingsTab) => void;
  fetchFlags: () => Promise<void>;
  refreshFlags: () => Promise<void>;
  isEnabled: (flagKey: string) => boolean;
}

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      sidebarOpen: true,
      propertiesPanelOpen: true,
      validationPanelOpen: false,
      showVersionPanel: false,
      searchOpen: false,
      activeTab: 'palette',
      activeModule: 'canvas',
      settingsTab: 'credentials',
      featureFlags: {},
      flagsLoaded: false,
      flagsLoading: false,

      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      togglePropertiesPanel: () => set((state) => ({ propertiesPanelOpen: !state.propertiesPanelOpen })),
      toggleVersionPanel: () => set((state) => ({ showVersionPanel: !state.showVersionPanel })),
      toggleSearch: () => set((state) => ({ searchOpen: !state.searchOpen })),
      setSearchOpen: (open) => set({ searchOpen: open }),
      setActiveTab: (tab) => set({ activeTab: tab }),
      setActiveModule: (module) => set({ activeModule: module }),
      setSettingsTab: (tab) => set({ settingsTab: tab }),

      fetchFlags: async () => {
        const token = getToken()
        if (!token) return
        set({ flagsLoading: true })
        try {
          const flags = await featureFlagsApi.getFlags()
          const flagMap: Record<string, FeatureFlagDTO> = {}
          for (const flag of flags) {
            flagMap[flag.flagKey] = flag
          }
          set({ featureFlags: flagMap, flagsLoaded: true, flagsLoading: false })
        } catch {
          set({ flagsLoading: false })
        }
      },

      refreshFlags: async () => {
        try {
          await featureFlagsApi.refreshCache()
          await get().fetchFlags()
        } catch {
          // Silently fail on refresh — stale cache is acceptable
        }
      },

      isEnabled: (flagKey: string): boolean => {
        const flags = get().featureFlags
        // Use hasOwnProperty to avoid prototype pollution (e.g. "constructor", "toString")
        const flag = Object.prototype.hasOwnProperty.call(flags, flagKey) ? flags[flagKey] : undefined
        // Check module-level flag if this is a module key
        const moduleFlagKey = moduleFlagMap[flagKey]
        const moduleFlag = flag ?? (moduleFlagKey && Object.prototype.hasOwnProperty.call(flags, moduleFlagKey)
          ? flags[moduleFlagKey]
          : undefined)
        if (moduleFlag !== undefined) {
          return moduleFlag.enabled
        }
        // Default to true for known modules without explicit flags
        if (flagKey.startsWith('module.')) {
          return flagKey === 'module.iam' ? false : true
        }
        return false
      },
    }),
    {
      name: 'cloudbuilder-ui-storage',
      partialize: (state) => ({
        activeModule: state.activeModule,
        sidebarOpen: state.sidebarOpen,
        propertiesPanelOpen: state.propertiesPanelOpen,
      }),
    }
  )
)
