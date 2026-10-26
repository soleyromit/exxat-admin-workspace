import { create } from "zustand"

type BuilderOnboardingChromeState = {
  /** True while `/builder/onboarding` is mounted. */
  routeActive: boolean
  /** Zero-based step index from the onboarding wizard. */
  stepIndex: number
  setRouteActive: (active: boolean) => void
  setStepIndex: (stepIndex: number) => void
}

export const useBuilderOnboardingChrome = create<BuilderOnboardingChromeState>(set => ({
  routeActive: false,
  stepIndex: 0,
  setRouteActive: routeActive => set({ routeActive }),
  setStepIndex: stepIndex => set({ stepIndex }),
}))

/** Sidebar live preview is hidden on step 1; shown from step 2 onward. */
export function shouldShowOnboardingSidebarPreview(state: BuilderOnboardingChromeState): boolean {
  return state.routeActive && state.stepIndex >= 1
}
