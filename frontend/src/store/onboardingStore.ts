import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface RepoConfig {
  url: string;
  branch: string;
  provider: "github" | "gitlab" | "bitbucket" | "other";
  detectedIaC: string[]; // terraform, cloudformation, etc.
}

export interface OnboardingProgress {
  stage: "welcome" | "gateway-setup" | "complete" | "skipped";
  completedSteps: string[];
}

interface OnboardingState {
  progress: OnboardingProgress;
  repoConfig: RepoConfig | null;
  tourCompleted: boolean;
  hasSeenWelcome: boolean;

  // Actions
  setStage: (stage: OnboardingProgress["stage"]) => void;
  completeStep: (step: string) => void;
  setRepoConfig: (config: RepoConfig) => void;
  markTourCompleted: () => void;
  markWelcomeSeen: () => void;
  skipOnboarding: () => void;
  resetOnboarding: () => void;
  resetToWelcome: () => void;
  isFullyConfigured: () => boolean;
}

const initialState: OnboardingProgress = {
  stage: "welcome",
  completedSteps: [],
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      progress: initialState,
      repoConfig: null,
      tourCompleted: false,
      hasSeenWelcome: false,

      setStage: (stage) => {
        set({ progress: { ...get().progress, stage } });
      },

      completeStep: (step) => {
        const { completedSteps } = get().progress;
        if (completedSteps.includes(step)) return;
        set({
          progress: {
            ...get().progress,
            completedSteps: [...completedSteps, step],
          },
        });
      },

      setRepoConfig: (config) => {
        set({ repoConfig: config });
      },

      markTourCompleted: () => {
        set({ tourCompleted: true });
      },

      markWelcomeSeen: () => {
        set({ hasSeenWelcome: true });
      },

      skipOnboarding: () => {
        set({
          progress: { stage: "skipped", completedSteps: [] },
          tourCompleted: false,
          hasSeenWelcome: true,
        });
      },

      resetToWelcome: () => {
        set({
          progress: { stage: "welcome", completedSteps: [] },
          repoConfig: null,
          tourCompleted: false,
          hasSeenWelcome: false,
        });
      },

      resetOnboarding: () => {
        set({
          progress: initialState,
          repoConfig: null,
          tourCompleted: false,
          hasSeenWelcome: false,
        });
      },

      isFullyConfigured: () => {
        const state = get();
        return (
          state.progress.stage === "complete" ||
          state.progress.stage === "skipped"
        );
      },
    }),
    {
      name: "cloudbuilder-onboarding-storage",
      partialize: (state) => ({
        progress: state.progress,
        repoConfig: state.repoConfig,
        tourCompleted: state.tourCompleted,
        hasSeenWelcome: state.hasSeenWelcome,
      }),
    },
  ),
);
