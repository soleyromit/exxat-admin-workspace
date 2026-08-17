/**
 * Trust content for the product marketing pages (`/home/:productSlug`).
 *
 * Kept apart from `product-catalog.ts` because it answers a different question.
 * The catalog says what a product *is*; this says why a reader should believe
 * it works — who already uses it, at what scale, and in whose words.
 *
 * **Institutions here are real names used as mock data**, same precedent as
 * the school/site switcher (`lib/mock/navigation.tsx`) — a real university's
 * name and logo standing in for "a customer" in a design-system prototype,
 * not a claim this workspace is making to a real audience. The quotes,
 * people, and numbers attached to them stay invented; only the institution
 * itself is real, which is what lets the logo rail show an actual mark
 * instead of a bare letter or — worse — a made-up domain that happens to
 * collide with an unrelated real company's real logo.
 *
 * Numbers are illustrative too. They are shaped to be plausible rather than
 * impressive — a page that claims a million placements reads as marketing
 * noise, and the reader we care about knows what their own scale looks like.
 *
 * ## Every product has proof, in the shape its stage allows
 *
 * A generally available product cites adoption: how many programs run it, at
 * what volume. A beta cites its beta — a smaller cohort, and numbers about what
 * the cohort has done rather than what the whole market has. Both are true
 * claims; the difference is who is being counted.
 *
 * The stage is **derived from the catalog** (`ProductCatalogEntry.stage`), not
 * stored here. Write the copy in this file to match, or the band will introduce
 * a beta cohort as the customer base.
 */

import type { Product } from "@/contexts/product-context"

/**
 * One entry in the logo rail.
 *
 * `domain` is optional on purpose: the design-os product's own proof band
 * names internal products ("Clinical Education", "Exxat One"), not
 * institutions, and those stay plain text — there is no brand to fetch a mark
 * for. Every real institution below gets one via `program()`.
 */
export interface ProductProofProgram {
  name: string
  /** Fed to `logoDevUrl()`. Omitted for entries that aren't institutions. */
  domain?: string
  /** `AvatarFallback` while the image loads, or if logo.dev has nothing. */
  initials?: string
}

export interface ProductProofStat {
  /** Short numeral — read as a headline, so keep it under six characters. */
  value: string
  label: string
}

export interface ProductTestimonial {
  quote: string
  name: string
  /** Role first, institution second — the role is what a reader matches on. */
  role: string
  institution: string
}

export interface ProductPromo {
  eyebrow: string
  title: string
  body: string
  /**
   * No action label here. The banner's one action is "Book a demo", and it has
   * to read identically to the hero button it scrolls to — a per-product
   * override would let those two drift apart.
   */
}

export interface ProductSocialProof {
  /**
   * Logo rail. Customers for a GA product; the cohort for one still in beta.
   * Build with `program()` so a name that repeats across products always
   * gets the same mark instead of drifting per file edit.
   */
  programs: ProductProofProgram[]
  stats: ProductProofStat[]
  testimonial: ProductTestimonial
  /** Omitted for products with nothing to announce. */
  promo?: ProductPromo
}

/**
 * Real institutions, once, here — each domain verified to resolve to that
 * institution's own real logo.dev mark (not a generated letter, not an
 * unrelated business that happens to own the domain). Ten distinct names
 * cover every product's proof band without repeating the four already used
 * as school/site switcher mock data (Johns Hopkins, Mayo Clinic, Mass
 * General Brigham, Cleveland Clinic), so the two surfaces don't echo.
 *
 * Picked for the *shape* of the mark logo.dev actually returns, not just
 * name recognition. Most university and health-system domains resolve to a
 * square crest/seal on a solid brand-colour fill (Duke, Michigan, Ohio
 * State, Pittsburgh, Washington all do — verified directly against the
 * API) — that shape reads as a cropped avatar chip no matter how the `img`
 * around it is styled, because the fill *is* the asset, not a container
 * choice. These ten instead resolve to a wide wordmark, or an icon on a
 * transparent field, both of which sit flat in a logo rail the way
 * exxat.com's own "Trusted by" strip does.
 */
const INSTITUTIONS: Record<string, { domain: string; initials: string }> = {
  "Rutgers University": { domain: "rutgers.edu", initials: "RU" },
  "George Washington University": { domain: "gwu.edu", initials: "GW" },
  "University of Miami": { domain: "miami.edu", initials: "UM" },
  "University of Alabama at Birmingham": { domain: "uab.edu", initials: "UAB" },
  "University of Florida": { domain: "ufl.edu", initials: "UF" },
  "Texas A&M University": { domain: "tamu.edu", initials: "TAMU" },
  "HCA Healthcare": { domain: "hcahealthcare.com", initials: "HC" },
  "Mercy": { domain: "mercy.net", initials: "MC" },
  "VCU Health": { domain: "vcuhealth.org", initials: "VCU" },
  "Trinity Health": { domain: "trinity-health.org", initials: "TH" },
}

function program(name: string): ProductProofProgram {
  const info = INSTITUTIONS[name]
  return info ? { name, domain: info.domain, initials: info.initials } : { name }
}

const ONE_LAUNCH_PROMO: ProductPromo = {
  eyebrow: "Launch offer",
  title: "Exxat One is new",
  body: "First year at 30% off for workspaces already running Clinical Education.",
}

const SOCIAL_PROOF: Partial<Record<Product, ProductSocialProof>> = {
  "exxat-prism": {
    programs: [
      program("Rutgers University"),
      program("George Washington University"),
      program("University of Miami"),
      program("University of Alabama at Birmingham"),
    ],
    stats: [
      { value: "310+", label: "Programs running placements" },
      { value: "94k", label: "Students placed each year" },
      { value: "12h", label: "Median time to fill a slot" },
      { value: "99.9%", label: "Uptime across placement season" },
    ],
    testimonial: {
      quote:
        "We used to find out a student was non-compliant the week they started. Now it surfaces the month before, and the fix is one message instead of four phone calls.",
      name: "Dr. Nadine Okonkwo",
      role: "Director of Clinical Education",
      institution: "Rutgers University",
    },
  },
  // Exxat One, school side: the customers are programs, and what they count is
  // availability found and applications answered. The site-side block below counts
  // locations and rotations, because it is sold to the other half of the handshake.
  "exxat-one-schools": {
    programs: [
      program("Rutgers University"),
      program("University of Florida"),
      program("Emory University"),
      program("Creighton University"),
    ],
    stats: [
      { value: "1,800+", label: "Sites publishing availability" },
      { value: "9 days", label: "Median time to a confirmed seat" },
      { value: "3x", label: "Applications filed per coordinator hour" },
    ],
    testimonial: {
      quote:
        "I used to email nineteen sites in August and wait. Now I can see what is actually open, apply the same afternoon, and tell a student where they are going before the term starts.",
      name: "Priya Raghavan",
      role: "Director of Clinical Education",
      institution: "Emory University",
    },
    promo: ONE_LAUNCH_PROMO,
  },
  "exxat-one-sites": {
    programs: [
      program("HCA Healthcare"),
      program("Mercy"),
      program("VCU Health"),
      program("Trinity Health"),
    ],
    stats: [
      { value: "1,800+", label: "Locations onboarded" },
      { value: "40k", label: "Rotations coordinated a year" },
      { value: "6", label: "Schools per site, on average" },
      { value: "1", label: "Login, no matter how many programs" },
    ],
    testimonial: {
      quote:
        "Eleven programs send us students and every one of them had its own spreadsheet. One roster replaced all of it, and my coordinators stopped chasing paperwork on Sunday nights.",
      name: "Marcus Ellery",
      role: "System Director of Clinical Partnerships",
      institution: "Mercy",
    },
    promo: ONE_LAUNCH_PROMO,
  },
  // ── Generally available, sold separately ───────────────────────────────────
  "exxat-curriculum-mapping": {
    programs: [
      program("Rutgers University"),
      program("University of Florida"),
      program("Texas A&M University"),
      program("University of Miami"),
    ],
    stats: [
      { value: "90+", label: "Programs mapping in Exxat" },
      { value: "6", label: "Accreditor frameworks built in" },
      { value: "1 day", label: "To answer a coverage question" },
      { value: "100%", label: "Of courses tied to a competency" },
    ],
    testimonial: {
      quote:
        "Our map lived in a spreadsheet nobody trusted after the second revision. Now a curriculum change updates the coverage view, so the answer we give the accreditor is the same one we work from.",
      name: "Dr. Elena Vasquez",
      role: "Curriculum Chair",
      institution: "University of Florida",
    },
  },
  "exxat-compliance": {
    programs: [
      program("George Washington University"),
      program("HCA Healthcare"),
      program("University of Alabama at Birmingham"),
      program("VCU Health"),
    ],
    stats: [
      { value: "150+", label: "Programs tracking clearance" },
      { value: "620k", label: "Documents verified to date" },
      { value: "21 d", label: "Median warning before a lapse" },
      { value: "3.4k", label: "Sites with their own requirement set" },
    ],
    testimonial: {
      quote:
        "Every site wants something slightly different, and we used to find the gap on the student's first morning. The warning now arrives three weeks out, which is enough time to actually fix it.",
      name: "Yusuf Karim",
      role: "Compliance Coordinator",
      institution: "George Washington University",
    },
  },

  "exxat-surveys": {
    programs: [
      program("Rutgers University"),
      program("University of Miami"),
      program("Mercy"),
    ],
    stats: [
      { value: "70+", label: "Programs collecting feedback" },
      { value: "180k", label: "Responses returned a year" },
      { value: "68%", label: "Median response rate" },
      { value: "0", label: "Extra logins for students" },
    ],
    testimonial: {
      quote:
        "Our response rate collapsed the moment feedback moved to a separate tool. Asking inside the placement the student is already in put it back — we are at two-thirds, from a fifth.",
      name: "Dr. Amara Chen",
      role: "Program Director",
      institution: "University of Miami",
    },
  },
  "exxat-accreditation": {
    programs: [
      program("University of Alabama at Birmingham"),
      program("University of Florida"),
      program("University of Miami"),
    ],
    stats: [
      { value: "60+", label: "Programs assembling self-studies" },
      { value: "5", label: "Standard sets built in" },
      { value: "6 wks", label: "Median self-study prep, not a year" },
      { value: "0", label: "Evidence re-entered by hand" },
    ],
    testimonial: {
      quote:
        "The last self-study cost us a year of reconstruction for evidence we had already produced. This one was a review — we opened the file and the trail was already in it.",
      name: "Dr. Halima Bright",
      role: "Accreditation Lead",
      institution: "University of Alabama at Birmingham",
    },
  },

  // ── In beta. Count the cohort, not the market ──────────────────────────────
  "exxat-exam-management": {
    programs: [
      program("Texas A&M University"),
      program("George Washington University"),
      program("Rutgers University"),
    ],
    stats: [
      { value: "24", label: "Programs in the beta" },
      { value: "3.1k", label: "Practical exams scored so far" },
      { value: "4 pts", label: "Median spread between examiners" },
      { value: "1", label: "Rubric every examiner scores against" },
    ],
    testimonial: {
      quote:
        "Two examiners, same student, ten points apart — that is the problem we brought them. One shared rubric later the spread is inside four, and the disagreements left are worth having.",
      name: "Dr. Tobias Renner",
      role: "Course Coordinator",
      institution: "Texas A&M University",
    },
  },
  "exxat-student-success": {
    programs: [
      program("Rutgers University"),
      program("Mercy"),
      program("George Washington University"),
    ],
    stats: [
      { value: "18", label: "Programs in the beta" },
      { value: "4", label: "Modules read as one signal" },
      { value: "12", label: "Signals behind each flag" },
      { value: "9 wks", label: "Median warning before a student stalls" },
    ],
    testimonial: {
      quote:
        "I could already see the student was struggling — in four places, none of which agreed. One view now tells me who to call this week, and we are still arguing about the threshold, which is the point of a beta.",
      name: "Dr. Nadine Okonkwo",
      role: "Director of Clinical Education",
      institution: "Rutgers University",
    },
  },

  "exxat-design-os": {
    // Internal products, not institutions — no domain, so these stay text.
    programs: [program("Clinical Education"), program("Exxat One"), program("Tenant custom products")],
    stats: [
      { value: "400+", label: "Components and patterns" },
      { value: "4", label: "Products on one system" },
      { value: "AA", label: "WCAG 2.1 floor, enforced in CI" },
      { value: "1", label: "Source of truth for tokens" },
    ],
    testimonial: {
      quote:
        "Every screen we ship starts from a pattern that already passed the accessibility gate. The review conversation moved from pixels to whether the job is right.",
      name: "Priya Raman",
      role: "Principal Product Designer",
      institution: "Exxat",
    },
  },
}

export function socialProofFor(product: Product): ProductSocialProof | undefined {
  return SOCIAL_PROOF[product]
}
