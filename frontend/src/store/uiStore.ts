import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type ModuleId = 'design' | 'provision' | 'observe' | 'cost' | 'platform' | 'aiops' | 'audit' | 'iam' | 'dashboard' | 'docs' | 'settings' | 'analytics';
type PanelTab = 'palette' | 'properties' | 'validation';

interface UiState {
  sidebarOpen: boolean;
  propertiesPanelOpen: boolean;
  validationPanelOpen: boolean;
  showVersionPanel: boolean;
  searchOpen: boolean;
  activeTab: PanelTab;
  activeModule: ModuleId;
  toggleSidebar: () => void;
  togglePropertiesPanel: () => void;
  toggleVersionPanel: () => void;
  toggleSearch: () => void;
  setSearchOpen: (open: boolean) => void;
  setActiveTab: (tab: PanelTab) => void;
  setActiveModule: (module: ModuleId) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      propertiesPanelOpen: true,
      validationPanelOpen: false,
      showVersionPanel: false,
      searchOpen: false,
      activeTab: 'palette',
      activeModule: 'design',

      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      togglePropertiesPanel: () => set((state) => ({ propertiesPanelOpen: !state.propertiesPanelOpen })),
      toggleVersionPanel: () => set((state) => ({ showVersionPanel: !state.showVersionPanel })),
      toggleSearch: () => set((state) => ({ searchOpen: !state.searchOpen })),
      setSearchOpen: (open) => set({ searchOpen: open }),
      setActiveTab: (tab) => set({ activeTab: tab }),
      setActiveModule: (module) => set({ activeModule: module }),
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
