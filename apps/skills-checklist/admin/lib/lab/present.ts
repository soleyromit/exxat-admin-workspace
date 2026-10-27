import { findFlow, flowHref } from "./flows"

/**
 * Present mode (granola 2026-10-26 items 6 and 20): the lab as it is shown to the client. No internal labels (tier, build
 * status, the variant question, the components drawer, the scenario menu, non-recommended variants, the lab bar itself),
 * only the recommended variant of each screen, and a curated list of marquee screens instead of the coverage matrix.
 * Reporting is listed as not ready. Carried in the URL as `present=1` (and in the session, for a hop that loses it).
 */
export const PRESENT_PARAM = "present"
export const PRESENT_STORAGE_KEY = "lab:present"

export interface MarqueeItem {
  label: string
  /** Who uses it, in the client's words. */
  who: string
  flow: string
  step: string
}

/**
 * The curated walk-through, in order (UX critique 2026-10-26): setup; the student lands on My progress, sends for evaluation
 * (Save for later keeps a draft) and finds it in My requests; the
 * evaluator signs and sees the payoff (counts now, or waits for approval); the reviewer clears what waits.
 */
export const MARQUEE: MarqueeItem[] = [
  { label: "Skills library", who: "Program", flow: "set-up-skills", step: "library" },
  { label: "Add a skill", who: "Program", flow: "set-up-skills", step: "add" },
  { label: "Configure a skill", who: "Program", flow: "set-up-skills", step: "configure" },
  { label: "Assign to a cohort or group", who: "Program", flow: "set-up-skills", step: "assign" },
  { label: "Course mapping", who: "Program", flow: "set-up-skills", step: "map" },
  { label: "My progress", who: "Student", flow: "my-progress", step: "home" },
  { label: "Log a skill", who: "Student", flow: "ask-for-evaluation", step: "send" },
  { label: "My requests", who: "Student", flow: "ask-for-evaluation", step: "requests" },
  { label: "Evaluation form", who: "Preceptor", flow: "sign-skills", step: "form" },
  { label: "Evaluation submitted", who: "Preceptor", flow: "sign-skills", step: "submitted" },
  { label: "Approvals", who: "Reviewer", flow: "clear-approvals", step: "queue" },
]

/**
 * Walkthroughs listed above the marquee (Romit 2026-10-27, for Sankalp): one link runs a whole job start to finish in the
 * recommended design, driven by the product's own buttons (lib/lab/walkthrough.ts). The href is the entry route.
 */
export const PRESENT_WALKTHROUGHS: Array<{ label: string; who: string; href: string }> = [
  { label: "Configuration, start to finish", who: "Program", href: "/lab/walkthrough/setup" },
  { label: "Fulfillment, start to finish", who: "Student", href: "/lab/walkthrough/fulfillment" },
]

/** Shown, not linked: reporting is not ready for the client yet. */
export const NOT_READY: Array<{ label: string; who: string }> = [
  { label: "Dashboard", who: "Program" },
  { label: "Reports", who: "Program" },
  { label: "Export", who: "Program" },
  { label: "Readiness and verification", who: "Program director" },
]

/** The marquee item's link: its flow step in the flow's recommended set, in present mode. */
export function marqueeHref(item: MarqueeItem): string {
  const flow = findFlow(item.flow)
  const set = flow?.recommendedSet ?? "1"
  return `${flowHref(item.flow, item.step, set)}&${PRESENT_PARAM}=1`
}

export const isPresent = (value: string | null | undefined): boolean => value === "1"
