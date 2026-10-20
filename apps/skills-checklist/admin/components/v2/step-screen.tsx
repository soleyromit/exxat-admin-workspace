"use client"

import * as React from "react"
import { ConfigureWizardPage } from "@/components/v2/admin/configure-wizard"
import { MapCoursesPage } from "@/components/v2/admin/map-courses-page"
import { StarterLibraryPage } from "@/components/v2/admin/starter-library-page"

/** Picks the real screen for a step. Steps whose stage has not been built fall back to the foundation page. */
export function StepScreen({ stepId, fallback }: { stepId: string; fallback: React.ReactNode }) {
  switch (stepId) {
    case "starter-library":
      return <StarterLibraryPage />
    case "configure-skill":
      return <ConfigureWizardPage />
    case "validate-publish":
      return <ConfigureWizardPage startStep={8} />
    case "map-courses":
      return <MapCoursesPage />
    default:
      return <>{fallback}</>
  }
}
