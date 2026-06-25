import { api } from './client'
import type { CatalogTemplate, CatalogItemVersion } from '@/types/platform.types'

// ─── Marketplace & Partner Types ──────────────────────────────

export interface MarketplaceListing {
  id: string
  name: string
  description: string
  cloudProvider: string
  marketplaceUrl?: string
  listingType: string
  version: string
  status: 'DRAFT' | 'PUBLISHED' | 'UNPUBLISHED'
  publisherName: string
  tags?: string
  pricing?: string
  createdAt: string
  updatedAt: string
}

export interface PartnerIntegration {
  id: string
  partnerName: string
  description: string
  integrationType: string
  apiEndpoint?: string
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING'
  configuration?: string | null
  createdAt: string
  updatedAt: string
}

// ─── Platform API Service ────────────────────────────────────

class PlatformApiService {
  async getCatalog(): Promise<CatalogTemplate[]> {
    try {
      const data = await api.get<CatalogTemplate[]>('/platform/catalog')
      return Array.isArray(data) ? data : []
    } catch {
      return []
    }
  }

  async getMarketplace(): Promise<CatalogTemplate[]> {
    try {
      const data = await api.get<CatalogTemplate[]>('/platform/marketplace')
      if (Array.isArray(data) && data.length > 0) return data
      return []
    } catch {
      return []
    }
  }

  async getVersionHistory(itemId: string): Promise<CatalogItemVersion[]> {
    try {
      const data = await api.get<CatalogItemVersion[]>(`/platform/catalog/${itemId}/versions`)
      if (Array.isArray(data)) return data
      return []
    } catch {
      return []
    }
  }

  async publishItem(itemId: string): Promise<void> {
    await api.post(`/platform/catalog/${itemId}/publish`, {})
  }

  async unpublishItem(itemId: string): Promise<void> {
    await api.post(`/platform/catalog/${itemId}/unpublish`, {})
  }

  // ─── Marketplace API ────────────────────────────────────────

  async fetchMarketplaceListings(cloudProvider?: string): Promise<MarketplaceListing[]> {
    try {
      const path = cloudProvider
        ? `/platform/marketplace?cloudProvider=${encodeURIComponent(cloudProvider)}`
        : '/platform/marketplace'
      const data = await api.get<MarketplaceListing[]>(path)
      return Array.isArray(data) ? data : []
    } catch {
      return []
    }
  }

  async createListing(listing: Partial<MarketplaceListing>): Promise<MarketplaceListing | null> {
    try {
      const data = await api.post<MarketplaceListing>('/platform/marketplace', listing)
      return data
    } catch {
      return null
    }
  }

  async publishListing(listingId: string): Promise<boolean> {
    try {
      await api.post(`/platform/marketplace/${listingId}/publish`, {})
      return true
    } catch {
      return false
    }
  }

  async unpublishListing(listingId: string): Promise<boolean> {
    try {
      await api.post(`/platform/marketplace/${listingId}/unpublish`, {})
      return true
    } catch {
      return false
    }
  }

  // ─── Partner Integration API ────────────────────────────────

  async fetchPartners(): Promise<PartnerIntegration[]> {
    try {
      const data = await api.get<PartnerIntegration[]>('/platform/partners')
      return Array.isArray(data) ? data : []
    } catch {
      return []
    }
  }

  async registerPartner(partner: Partial<PartnerIntegration>): Promise<PartnerIntegration | null> {
    try {
      const data = await api.post<PartnerIntegration>('/platform/partners', partner)
      return data
    } catch {
      return null
    }
  }

  async activatePartner(partnerId: string): Promise<boolean> {
    try {
      await api.post(`/platform/partners/${partnerId}/activate`, {})
      return true
    } catch {
      return false
    }
  }

  async updatePartnerConfig(partnerId: string, apiEndpoint?: string, configuration?: string): Promise<boolean> {
    try {
      await api.put(`/platform/partners/${partnerId}/config`, { apiEndpoint, configuration })
      return true
    } catch {
      return false
    }
  }
}

export const platformApi = new PlatformApiService()
