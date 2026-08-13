import { create } from "zustand";
import type {
  RegionDto,
  DrPlan,
  RegionHealth,
  ReplicationConfig,
} from "@/api/multiregion";
import { multiregionApi } from "@/api/multiregion";

interface MultiRegionState {
  regions: RegionDto[];
  drPlans: DrPlan[];
  regionHealth: Record<string, RegionHealth>;
  replicationConfigs: ReplicationConfig[];
  loading: boolean;
  error: string | null;

  fetchRegions: () => Promise<void>;
  createRegion: (region: Omit<RegionDto, "id">) => Promise<void>;
  fetchDrPlans: () => Promise<void>;
  createDrPlan: (plan: Omit<DrPlan, "id">) => Promise<void>;
  fetchRegionHealth: (regionId: string) => Promise<void>;
  fetchAllHealth: () => Promise<void>;
  fetchReplicationConfigs: () => Promise<void>;
}

export const useMultiRegionStore = create<MultiRegionState>((set) => ({
  regions: [],
  drPlans: [],
  regionHealth: {},
  replicationConfigs: [],
  loading: false,
  error: null,

  fetchRegions: async () => {
    set({ loading: true, error: null });
    try {
      const regions = await multiregionApi.listRegions();
      set({ regions, loading: false });
    } catch {
      set({ error: "Falha ao carregar regiões", loading: false });
    }
  },

  createRegion: async (region) => {
    set({ loading: true, error: null });
    try {
      const created = await multiregionApi.createRegion(region);
      set((s) => ({ regions: [...s.regions, created], loading: false }));
    } catch {
      set({ error: "Falha ao criar região", loading: false });
    }
  },

  fetchDrPlans: async () => {
    set({ loading: true, error: null });
    try {
      const plans = await multiregionApi.listDrPlans();
      set({ drPlans: plans, loading: false });
    } catch {
      set({ error: "Falha ao carregar DR plans", loading: false });
    }
  },

  createDrPlan: async (plan) => {
    set({ loading: true, error: null });
    try {
      const created = await multiregionApi.createDrPlan(plan);
      set((s) => ({ drPlans: [...s.drPlans, created], loading: false }));
    } catch {
      set({ error: "Falha ao criar DR plan", loading: false });
    }
  },

  fetchRegionHealth: async (regionId) => {
    try {
      const health = await multiregionApi.getRegionHealth(regionId);
      set((s) => ({ regionHealth: { ...s.regionHealth, [regionId]: health } }));
    } catch {
      /* silent */
    }
  },

  fetchAllHealth: async () => {
    const { regions } = get();
    for (const region of regions) {
      try {
        const health = await multiregionApi.getRegionHealth(region.id);
        set((s) => ({
          regionHealth: { ...s.regionHealth, [region.id]: health },
        }));
      } catch {
        /* silent */
      }
    }
  },

  fetchReplicationConfigs: async () => {
    try {
      const configs = await multiregionApi.listReplicationConfigs();
      set({ replicationConfigs: configs });
    } catch {
      /* silent */
    }
  },
}));

function get() {
  return useMultiRegionStore.getState();
}
