import { Outlet, useLocation } from "react-router-dom"

import { SecondaryPanelHubActivator } from "@/components/templates/secondary-panel-hub-template"
import { isLearningActivitiesHubPath } from "@/lib/learning-activities-nav"

/**
 * Learning activities layout — scope secondary panel on the list hub only.
 * Course offering detail (`/courses/:id`) is full-width; no scope rail.
 */
export default function LearningActivitiesLayout() {
  const { pathname } = useLocation()
  const hubListRoute = isLearningActivitiesHubPath(pathname)

  return (
    <>
      {hubListRoute ? <SecondaryPanelHubActivator panelId="learning-activities" /> : null}
      <Outlet />
    </>
  )
}
