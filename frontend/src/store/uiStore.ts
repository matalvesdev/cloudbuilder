import { create } from 'zustand'

type ModuleId = 'design' | 'provision' | 'observe' | 'cost' | 'platform' | 'aiops' | 'audit' | 'iam' | 'dashboard' | 'settings';
type PanelTab = 'palette' | 'properties' | 'validation';

interface UiState {
  sidebarOpen: boolean;
  propertiesPanelOpen: boolean;
  validationPanelOpen: boolean;
  showVersionPanel: boolean;
  activeTab: PanelTab;
  activeModule: ModuleId;
  toggleSidebar: () => void;
  togglePropertiesPanel: () => void;
  toggleVersionPanel: () => void;
  setActiveTab: (tab: PanelTab) => void;
  setActiveModule: (module: ModuleId) => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: true,
  propertiesPanelOpen: true,
  validationPanelOpen: false,
  showVersionPanel: false,
  activeTab: 'palette',
  activeModule: 'design',

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  togglePropertiesPanel: () => set((state) => ({ propertiesPanelOpen: !state.propertiesPanelOpen })),
  toggleVersionPanel: () => set((state) => ({ showVersionPanel: !state.showVersionPanel })),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setActiveModule: (module) => set({ activeModule: module }),
}))
