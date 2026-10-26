"use client"

import * as React from "react"
import { ConfigureWizardPage } from "@/components/v2/admin/configure-wizard"
import { MapCoursesPage } from "@/components/v2/admin/map-courses-page"
import { StarterLibraryPage } from "@/components/v2/admin/starter-library-page"
import { VerificationListPage } from "@/components/v2/director/verification-pages"
import { ReviewQueuePage } from "@/components/v2/review/review-queue-page"
import { OutcomesPage } from "@/components/v2/outcomes/outcomes-page"
import { PreceptorEvaluation } from "@/components/v2/preceptor/evaluation-form"
import { LabGridPage } from "@/components/v2/preceptor/lab-grid-page"
import { ReportsPage } from "@/components/v2/reports/reports-page"
import { RecordPage } from "@/components/v2/student/record-page"
import { LogFlow } from "@/components/v2/student/log-flow"
import { RequestSignoff } from "@/components/v2/student/request-signoff"
import { SyncPage } from "@/components/v2/student/sync-page"

/** Picks the real screen for a route slug. */
export function StepScreen({ stepId }: { stepId: string }) {
  switch (stepId) {
    case "starter-library":
      return <StarterLibraryPage />
    case "configure-skill":
      return <ConfigureWizardPage />
    case "validate-publish":
      return <ConfigureWizardPage startStep={7} />
    case "map-courses":
      return <MapCoursesPage />
    case "pick-and-rate":
      return <LogFlow />
    case "request-signoff":
      return <RequestSignoff />
    case "offline-sync":
      return <SyncPage />
    case "preceptor-evaluation":
      return <PreceptorEvaluation />
    case "outcome-remediation":
      return <OutcomesPage role="reviewer" />
    case "review-queue":
      return <ReviewQueuePage role="reviewer" />
    case "director-verification":
      return <VerificationListPage role="director" />
    case "reports":
      return <ReportsPage role="admin" />
    case "verified-record":
      return <RecordPage />
    case "lab-batch-grid":
      return <LabGridPage />
    default:
      return null
  }
}
