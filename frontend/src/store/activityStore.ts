import { create } from "zustand";
import { persist } from "zustand/middleware";
import { dashboardApi } from "@/api/dashboardApi";
import type {
  ActivityEvent,
  ActivityType,
  ActivitySeverity,
} from "@/types/activity.types";

export interface ActivityState {
  events: ActivityEvent[];
  maxEvents: number;
  loading: boolean;
  error: string | null;

  addEvent: (event: Omit<ActivityEvent, "id" | "timestamp">) => void;
  getRecent: (limit?: number) => ActivityEvent[];
  getByType: (type: ActivityType) => ActivityEvent[];
  getByModule: (module: string) => ActivityEvent[];
  getAlerts: () => ActivityEvent[];
  clearAll: () => void;
  fetchActivityEvents: () => Promise<void>;
}

export const useActivityStore = create<ActivityState>()(
  persist(
    (set, get) => ({
      events: [],
      maxEvents: 100,
      loading: false,
      error: null,

      addEvent: (event) => {
        const newEvent: ActivityEvent = {
          ...event,
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
        };
        set((state) => {
          const updated = [newEvent, ...state.events];
          if (updated.length > state.maxEvents)
            updated.length = state.maxEvents;
          return { events: updated };
        });
      },

      getRecent: (limit = 10) => {
        return get().events.slice(0, limit);
      },

      getByType: (type) => {
        return get().events.filter((e) => e.type === type);
      },

      getByModule: (module) => {
        return get().events.filter((e) => e.module === module);
      },

      getAlerts: () => {
        return get().events.filter(
          (e) => e.severity === "error" || e.severity === "warning",
        );
      },

      clearAll: () => set({ events: [] }),

      fetchActivityEvents: async () => {
        set({ loading: true, error: null });
        try {
          const envId =
            localStorage.getItem("cloudbuilder-active-environment") ||
            "default";
          const observeData = await dashboardApi.getObserveDashboard(envId);
          if (observeData && observeData.alerts.length > 0) {
            const apiEvents: ActivityEvent[] = observeData.alerts.map((a) => ({
              id: crypto.randomUUID(),
              type:
                a.severity === "critical"
                  ? ("compliance_violation" as ActivityType)
                  : ("drift_detected" as ActivityType),
              title: a.message,
              description: a.serviceName,
              module: "observe",
              severity:
                a.severity === "critical"
                  ? ("error" as ActivitySeverity)
                  : ("warning" as ActivitySeverity),
              timestamp: a.timestamp,
            }));
            set({ events: apiEvents, loading: false });
          } else {
            set({ loading: false });
          }
        } catch (err) {
          const msg =
            err && typeof err === "object" && "message" in err
              ? (err as { message: string }).message
              : "Erro ao carregar eventos de atividade";
          set({ error: msg, loading: false });
        }
      },
    }),
    {
      name: "cloudbuilder-activity",
    },
  ),
);
