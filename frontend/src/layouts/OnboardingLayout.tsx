import { OnboardingWelcome } from "@/app/onboarding/OnboardingWelcome";
import { OnboardingTour } from "@/app/onboarding/OnboardingTour";
import { GatewaySetup } from "@/app/onboarding/GatewaySetup";
import { useOnboardingStore } from "@/store/onboardingStore";

type OnboardingView = "welcome" | "tour" | "gateway" | "done";

interface OnboardingLayoutProps {
  view: OnboardingView;
  onViewChange: (view: OnboardingView) => void;
}

export function OnboardingLayout({
  view,
  onViewChange,
}: OnboardingLayoutProps) {
  const { setStage, skipOnboarding, markTourCompleted } = useOnboardingStore();

  if (view === "welcome") {
    return (
      <OnboardingWelcome
        onStartTour={() => onViewChange("tour")}
        onStartSetup={() => {
          setStage("gateway-setup");
          onViewChange("gateway");
        }}
        onSkip={() => {
          skipOnboarding();
          onViewChange("done");
        }}
      />
    );
  }

  if (view === "tour") {
    return (
      <OnboardingTour
        onComplete={() => {
          markTourCompleted();
          onViewChange("done");
        }}
        onSkip={() => onViewChange("done")}
      />
    );
  }

  if (view === "gateway") {
    return (
      <GatewaySetup
        onComplete={() => onViewChange("done")}
        onSkip={() => {
          skipOnboarding();
          onViewChange("done");
        }}
      />
    );
  }

  return null;
}
