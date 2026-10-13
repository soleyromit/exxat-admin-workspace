/**
 * Legacy route redirects (hybrid IA, docs/design/hybrid-build-plan.md). Every URL of the previous build keeps working and
 * keeps its query string (?dialog=, ?tab=, ?status=, ?batch=, ?skill=, ?setting=, ?student=, ?evaluation=): Next passes the
 * incoming query through a redirect and merges the destination's own keys. Used by next.config.ts and tested in tests/redirects.test.ts.
 */
export interface LegacyRedirect {
  source: string
  destination: string
  permanent: false
}

const r = (source: string, destination: string): LegacyRedirect => ({ source, destination, permanent: false })

export const LEGACY_REDIRECTS: LegacyRedirect[] = [
  r("/overview", "/attainment"),
  r("/overview/students/:studentId", "/attainment?student=:studentId"),
  r("/overview/students/:studentId/skills/:skillId", "/attainment?student=:studentId&skill=:skillId"),
  r("/library", "/skills/library"),
  r("/library/skills", "/skills/library"),
  r("/library/categories", "/skills/library?tab=categories"),
  r("/library/tags", "/skills/library?tab=tags"),
  r("/library/settings", "/skills/library?tab=settings"),
  r("/library/lab-instructors", "/skills/library?tab=lab-instructors"),
  // The Skills row's former children are tabs on the Skills page now (?tab= keys: components/library/library-page.tsx TAB_PARAM).
  r("/skills/kits", "/skills/library?tab=kits"),
  r("/skills/categories", "/skills/library?tab=categories"),
  r("/skills/tags", "/skills/library?tab=tags"),
  r("/skills/settings", "/skills/library?tab=settings"),
  r("/skills/lab-instructors", "/skills/library?tab=lab-instructors"),
  r("/library/skills/new", "/skills/library?dialog=add"),
  r("/library/skills/:skillId/configure", "/skills/library?dialog=configure&skill=:skillId"),
  r("/library/import", "/skills/library?dialog=import"),
  r("/library/import/:batchId/review", "/skills/library?dialog=import"),
  r("/course-mapping", "/courses"),
  r("/course-mapping/:offeringId", "/courses/:offeringId"),
  r("/review", "/reviews"),
  r("/review/:submissionId", "/reviews/:submissionId"),
]
