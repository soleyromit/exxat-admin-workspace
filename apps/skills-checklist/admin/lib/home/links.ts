import { ROUTES } from "@/lib/skills-routes"

/** Library tabs are addressed with ?tab= (components/library/library-page.tsx TAB_PARAM). Literals here so Home does not import the page module. */
export const HOME_LINKS = {
  labInstructors: `${ROUTES.skills}?tab=lab-instructors`,
  unconfigured: `${ROUTES.skills}?status=unconfigured`,
} as const
