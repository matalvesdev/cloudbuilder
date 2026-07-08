import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as fc from 'fast-check'
import { useUiStore } from './uiStore'
import type { FeatureFlagDTO } from '@/api/featureFlags'

// Mock the API module to prevent real HTTP calls
vi.mock('@/api/featureFlags', () => ({
  featureFlagsApi: {
    listFlags: vi.fn().mockResolvedValue([]),
    refreshCache: vi.fn().mockResolvedValue(undefined),
  },
}))

// Helper to build a full FeatureFlagDTO with only the fields we care about
function makeFlag(overrides: Partial<FeatureFlagDTO> & Pick<FeatureFlagDTO, 'flagKey' | 'enabled'>): FeatureFlagDTO {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    flagKey: overrides.flagKey,
    flagType: 'BOOLEAN',
    enabled: overrides.enabled,
    tenantId: overrides.tenantId ?? '',
    valueJson: '{}',
    description: overrides.description ?? '',
    createdAt: overrides.createdAt ?? new Date().toISOString(),
    updatedAt: overrides.updatedAt ?? new Date().toISOString(),
  }
}

const defaultState = {
  sidebarOpen: true,
  propertiesPanelOpen: true,
  validationPanelOpen: false,
  showVersionPanel: false,
  searchOpen: false,
  activeTab: 'palette' as const,
  activeModule: 'canvas' as const,
  featureFlags: {} as Record<string, FeatureFlagDTO>,
  flagsLoaded: false,
  flagsLoading: false,
}

beforeEach(() => {
  useUiStore.setState({ ...defaultState })
})

describe('uiStore.isEnabled() — property-based', () => {
  const moduleKeys = ['finops', 'platform', 'ai', 'security', 'security']
  const featureKeys = ['what-if-cost', 'preview-workflow', 'max-users']

  it('module.iam defaults to true when no flag is set', () => {
    expect(useUiStore.getState().isEnabled('module.iam')).toBe(true)
  })

  it('known module keys without explicit flag default to true', () => {
    for (const key of ['module.cost', 'module.platform', 'module.aiops', 'module.audit', 'module.iam', 'module.dashboard']) {
      expect(useUiStore.getState().isEnabled(key)).toBe(true)
    }
  })

  it('unknown keys default to false', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }).filter((s) => !s.startsWith('module.')),
        (key) => {
          useUiStore.setState({ featureFlags: {} })
          expect(useUiStore.getState().isEnabled(key)).toBe(false)
        },
      ),
      { numRuns: 200 },
    )
  })

  it('explicit enabled=true flag overrides default', () => {
    for (const key of moduleKeys) {
      useUiStore.setState({
        featureFlags: {
          [`module.${key}`]: makeFlag({ flagKey: `module.${key}`, enabled: true }),
        },
      })
      expect(useUiStore.getState().isEnabled(`module.${key}`)).toBe(true)
    }
  })

  it('explicit enabled=false flag overrides default', () => {
    for (const key of moduleKeys) {
      if (key === 'security') continue // already false by default
      useUiStore.setState({
        featureFlags: {
          [`module.${key}`]: makeFlag({ flagKey: `module.${key}`, enabled: false }),
        },
      })
      expect(useUiStore.getState().isEnabled(`module.${key}`)).toBe(false)
    }
  })

  it('feature flags follow same pattern', () => {
    for (const key of featureKeys) {
      useUiStore.setState({
        featureFlags: {
          [`feature.${key}`]: makeFlag({ flagKey: `feature.${key}`, enabled: true }),
        },
      })
      expect(useUiStore.getState().isEnabled(`feature.${key}`)).toBe(true)

      useUiStore.setState({
        featureFlags: {
          [`feature.${key}`]: makeFlag({ flagKey: `feature.${key}`, enabled: false }),
        },
      })
      expect(useUiStore.getState().isEnabled(`feature.${key}`)).toBe(false)
    }
  })

  it('random flag states produce deterministic results', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        fc.boolean(),
        fc.boolean(),
        (e1, e2, e3) => {
          const flags: Record<string, FeatureFlagDTO> = {
            'module.cost': makeFlag({ flagKey: 'module.cost', enabled: e1 }),
            'module.platform': makeFlag({ flagKey: 'module.platform', enabled: e2 }),
            'feature.what-if-cost': makeFlag({ flagKey: 'feature.what-if-cost', enabled: e3 }),
          }
          useUiStore.setState({ featureFlags: flags })
          expect(useUiStore.getState().isEnabled('module.cost')).toBe(e1)
          expect(useUiStore.getState().isEnabled('module.platform')).toBe(e2)
          expect(useUiStore.getState().isEnabled('feature.what-if-cost')).toBe(e3)
        },
      ),
      { numRuns: 500 },
    )
  })
})

describe('uiStore toggle properties — property-based', () => {
  it('toggle is idempotent over 2 calls (returns to original)', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        (initial) => {
          useUiStore.setState({ sidebarOpen: initial })
          useUiStore.getState().toggleSidebar()
          useUiStore.getState().toggleSidebar()
          expect(useUiStore.getState().sidebarOpen).toBe(initial)
        },
      ),
      { numRuns: 200 },
    )
  })

  it('toggleSidebar always flips boolean', () => {
    fc.assert(
      fc.property(fc.boolean(), (val) => {
        useUiStore.setState({ sidebarOpen: val })
        useUiStore.getState().toggleSidebar()
        expect(useUiStore.getState().sidebarOpen).toBe(!val)
      }),
      { numRuns: 200 },
    )
  })

  it('togglePropertiesPanel always flips boolean', () => {
    fc.assert(
      fc.property(fc.boolean(), (val) => {
        useUiStore.setState({ propertiesPanelOpen: val })
        useUiStore.getState().togglePropertiesPanel()
        expect(useUiStore.getState().propertiesPanelOpen).toBe(!val)
      }),
      { numRuns: 200 },
    )
  })

  it('toggleSearch always flips boolean', () => {
    fc.assert(
      fc.property(fc.boolean(), (val) => {
        useUiStore.setState({ searchOpen: val })
        useUiStore.getState().toggleSearch()
        expect(useUiStore.getState().searchOpen).toBe(!val)
      }),
      { numRuns: 200 },
    )
  })

  it('setSearchOpen is set (not toggle)', () => {
    fc.assert(
      fc.property(fc.boolean(), fc.boolean(), (from, to) => {
        useUiStore.setState({ searchOpen: from })
        useUiStore.getState().setSearchOpen(to)
        expect(useUiStore.getState().searchOpen).toBe(to)
      }),
      { numRuns: 200 },
    )
  })
})

describe('uiStore.setActiveTab — property-based', () => {
  it('always sets to the provided tab', () => {
    const tabs = ['palette', 'properties', 'validation'] as const
    fc.assert(
      fc.property(
        fc.constantFrom(...tabs),
        (tab) => {
          useUiStore.getState().setActiveTab(tab)
          expect(useUiStore.getState().activeTab).toBe(tab)
        },
      ),
      { numRuns: 100 },
    )
  })
})
