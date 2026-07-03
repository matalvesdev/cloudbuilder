import { api } from './client'

export interface MarketplaceListing {
  id: string
  name: string
  description: string
  provider: string
  category: string
  version: string
  rating: number
  installs: number
  cloudProvider?: string
  listingType?: string
  status?: string
}

export interface PartnerIntegration {
  id: string
  name: string
  type: string
  status: string
  config: Record<string, any>
  partnerName?: string
  description?: string
  integrationType?: string
  apiEndpoint?: string
  configuration?: string
}

export interface CatalogItem {
  id: string
  name: string
  description: string
  provider: string
  category: string
  version: string
  template: string
}

export function listCatalog(): Promise<CatalogItem[]> {
  return api.get('/platform/catalog')
}

export function getCatalogItem(id: string): Promise<CatalogItem> {
  return api.get(`/platform/catalog/${id}`)
}

export function createCatalogItem(item: Omit<CatalogItem, 'id'>): Promise<CatalogItem> {
  return api.post('/platform/catalog', item)
}

export function updateCatalogItem(id: string, item: Partial<CatalogItem>): Promise<CatalogItem> {
  return api.put(`/platform/catalog/${id}`, item)
}

export function deleteCatalogItem(id: string): Promise<void> {
  return api.delete(`/platform/catalog/${id}`)
}

export function listMarketplace(): Promise<MarketplaceListing[]> {
  return api.get('/platform/marketplace')
}

export function publishToMarketplace(catalogId: string): Promise<MarketplaceListing> {
  return api.post(`/platform/marketplace/${catalogId}/publish`)
}

export function listPartners(): Promise<PartnerIntegration[]> {
  return api.get('/platform/partners')
}

export function createPartner(partner: Omit<PartnerIntegration, 'id'>): Promise<PartnerIntegration> {
  return api.post('/platform/partners', partner)
}

export function activatePartner(id: string): Promise<PartnerIntegration> {
  return api.post(`/platform/partners/${id}/activate`)
}

export function updatePartnerConfig(id: string, config: Record<string, any>): Promise<PartnerIntegration> {
  return api.put(`/platform/partners/${id}`, { config })
}

export const platformApi = {
  listCatalog,
  getCatalogItem,
  createCatalogItem,
  updateCatalogItem,
  deleteCatalogItem,
  listMarketplace,
  publishToMarketplace,
  listPartners,
  createPartner,
  activatePartner,
  updatePartnerConfig,
  // Aliases for backward compatibility
  fetchMarketplaceListings: listMarketplace,
  fetchPartners: listPartners,
}
