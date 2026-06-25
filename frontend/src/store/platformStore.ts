import { create } from 'zustand'
import { platformApi } from '@/api/platform'
import type { CatalogTemplate, CatalogItemVersion } from '@/types/platform.types'

interface PlatformState {
  // Catalog
  catalog: CatalogTemplate[]
  catalogLoading: boolean

  // Selected item details
  selectedItem: CatalogTemplate | null
  versionHistory: CatalogItemVersion[]
  versionHistoryLoading: boolean

  // Filters
  filterType: string

  // Actions
  loadCatalog: () => Promise<void>
  selectItem: (item: CatalogTemplate | null) => void
  loadVersionHistory: (itemId: string) => Promise<void>
  publishItem: (itemId: string) => Promise<boolean>
  unpublishItem: (itemId: string) => Promise<boolean>
  setFilterType: (type: string) => void
}

export const usePlatformStore = create<PlatformState>((set, get) => ({
  catalog: [],
  catalogLoading: false,
  selectedItem: null,
  versionHistory: [],
  versionHistoryLoading: false,
  filterType: 'all',

  loadCatalog: async () => {
    set({ catalogLoading: true })
    try {
      const items = await platformApi.getCatalog()
      set({ catalog: items, catalogLoading: false })
    } catch {
      set({ catalogLoading: false })
    }
  },

  selectItem: (item) => {
    set({ selectedItem: item, versionHistory: [] })
    if (item) {
      get().loadVersionHistory(item.id)
    }
  },

  loadVersionHistory: async (itemId: string) => {
    set({ versionHistoryLoading: true })
    try {
      const versions = await platformApi.getVersionHistory(itemId)
      set({ versionHistory: versions, versionHistoryLoading: false })
    } catch {
      set({ versionHistoryLoading: false })
    }
  },

  publishItem: async (itemId: string) => {
    try {
      await platformApi.publishItem(itemId)
      await get().loadCatalog()
      return true
    } catch {
      return false
    }
  },

  unpublishItem: async (itemId: string) => {
    try {
      await platformApi.unpublishItem(itemId)
      await get().loadCatalog()
      return true
    } catch {
      return false
    }
  },

  setFilterType: (type) => set({ filterType: type }),
}))
