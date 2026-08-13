import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeMode = "light" | "dark" | "system";
export type AppLanguage = "pt-BR" | "en";

export interface SystemSettings {
  theme: ThemeMode;
  language: AppLanguage;
  notifications: {
    email: boolean;
    deployComplete: boolean;
    deployFailed: boolean;
    approvalRequested: boolean;
    driftDetected: boolean;
  };
}

interface SystemSettingsState {
  settings: SystemSettings;
  updateTheme: (theme: ThemeMode) => void;
  updateLanguage: (language: AppLanguage) => void;
  updateNotification: (
    key: keyof SystemSettings["notifications"],
    value: boolean,
  ) => void;
  resetSettings: () => void;
}

const defaultSettings: SystemSettings = {
  theme: "light",
  language: "pt-BR",
  notifications: {
    email: true,
    deployComplete: true,
    deployFailed: true,
    approvalRequested: true,
    driftDetected: true,
  },
};

export const useSystemSettingsStore = create<SystemSettingsState>()(
  persist(
    (set) => ({
      settings: defaultSettings,

      updateTheme: (theme) =>
        set((s) => ({ settings: { ...s.settings, theme } })),

      updateLanguage: (language) =>
        set((s) => ({ settings: { ...s.settings, language } })),

      updateNotification: (key, value) =>
        set((s) => ({
          settings: {
            ...s.settings,
            notifications: { ...s.settings.notifications, [key]: value },
          },
        })),

      resetSettings: () => set({ settings: defaultSettings }),
    }),
    {
      name: "cloudbuilder-system-settings",
      partialize: (state) => ({ settings: state.settings }),
    },
  ),
);
