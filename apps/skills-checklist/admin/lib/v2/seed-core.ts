/** Shared by the hand-written hero layer (seed.ts) and the cohort generator (generate.ts). No imports from either, so there is no cycle. */

/** Fixed demo clock so the seed is identical on every load and in tests. */
export const DEMO_TODAY = "2026-10-26"

export function daysBefore(n: number): string {
  const d = new Date(`${DEMO_TODAY}T09:00:00Z`)
  d.setUTCDate(d.getUTCDate() - n)
  return d.toISOString()
}

/** Small deterministic PRNG (mulberry32) so history is stable. */
export function prng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const IDS = {
  maya: "stu-maya",
  delgado: "pre-delgado",
  whitmore: "lab-whitmore",
  ross: "adm-ross",
  reviewer: "rev-haddad",
  director: "dir-brennan",
  course: "crs-nurs350",
  ivCath: "sk-iv-cath",
  urinaryCath: "sk-urinary-cath",
} as const

/** Hero skills whose configuration asks for approval before evidence counts (SC-15): the hero queue's rule holds sit on them. */
export const HERO_APPROVAL: ReadonlySet<string> = new Set(["sk-med-admin", "sk-blood-glucose"])
