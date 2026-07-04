import { create } from 'zustand'
import { platformApi } from '@/api/platform'
import type { CatalogItem } from '@/api/platform'

interface PlatformState {
  // Catalog
  catalog: CatalogItem[]
  catalogLoading: boolean

  // Selected item details
  selectedItem: CatalogItem | null
  versionHistory: any[]
  versionHistoryLoading: boolean

  // Filters
  filterType: string

  // Actions
  loadCatalog: () => Promise<void>
  selectItem: (item: CatalogItem | null) => void
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
      const items = await platformApi.listCatalog()
      set({ catalog: items, catalogLoading: false })
    } catch (err) {
      console.error('[platformStore] loadCatalog failed:', err)
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
      set({ versionHistory: [], versionHistoryLoading: false })
    } catch (err) {
      console.error('[platformStore] loadVersionHistory failed:', err)
      set({ versionHistoryLoading: false })
    }
  },

  publishItem: async (itemId: string) => {
    try {
      await platformApi.publishToMarketplace(itemId)
      await get().loadCatalog()
      return true
    } catch (err) {
      console.error('[platformStore] publishItem failed:', err)
      return false
    }
  },

  unpublishItem: async (itemId: string) => {
    try {
      await get().loadCatalog()
      return true
    } catch (err) {
      console.error('[platformStore] unpublishItem failed:', err)
      return false
    }
  },

  setFilterType: (type) => set({ filterType: type }),
}))
