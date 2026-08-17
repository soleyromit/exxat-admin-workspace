/**
 * Record-detail shell chrome — hide primary + secondary rails so the record
 * owns the canvas. Breadcrumb keeps way-back (P1); SiteHeader omits SidebarTrigger.
 *
 * Pattern: `docs/record-detail-chrome-pattern.md`
 * Job: `docs/jobs/record-detail.md`
 */

import { isLearningActivitiesCourseDetailPath } from "@/lib/learning-activities-nav"

/** Routes that use record-detail chrome (no app nav rail). Extend per entity. */
export function isRecordDetailChromePath(pathname: string): boolean {
  return isLearningActivitiesCourseDetailPath(pathname)
}
