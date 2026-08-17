/**
 * Product catalog content for the products home (`/home`).
 *
 * Two things the shell has never modelled live here, both deliberately as mock
 * data rather than framework changes:
 *
 * 1. **Entitlement.** Nothing in `stores/app-store` knows which products a user
 *    is licensed for. `hiddenProducts` looks close but is not the same thing —
 *    it is a builder-side visibility toggle, and overloading it would make
 *    Settings → Organization report something false. Entitlement is its own
 *    axis here, and the home respects both (hidden stays hidden either way).
 *
 * 2. **Marketing copy.** Taglines and feature bullets are tenant-facing content,
 *    so they do not belong in `@exxatdesignux/product-framework` — that package
 *    ships to every consumer app and would carry Exxat's own sales copy with it.
 *
 * Replace both with real API data when the backend exists; the components read
 * only through the helpers at the bottom of this file.
 */

import type { Product } from "@/contexts/product-context"
import { grantedProducts } from "@/lib/login-session"

export interface ProductScreen {
  src: string
  caption: string
  alt: string
  /**
   * True when the frame is a real Exxat surface standing in for a product that
   * has not shipped its own screens yet. The gallery labels these, because a
   * screenshot on a marketing page reads as a promise about what you will get,
   * and an unlabelled stand-in makes a promise nobody agreed to.
   */
  representative?: boolean
}

/**
 * How finished a product is, for the one badge a card is allowed to wear.
 *
 * - **`new`** — generally available, shipped recently enough that a returning
 *   workspace has not seen it. Says "look at this", nothing more.
 * - **`beta`** — usable and supported, still changing under the people using
 *   it. Carries an opt-in ("Try the beta") rather than a sales conversation,
 *   because the ask is feedback, not a purchase order.
 */
export type ProductStage = "new" | "beta"

export interface ProductCatalogEntry {
  product: Product
  /** One line, sentence case, no trailing period — sits under the wordmark. */
  tagline: string
  /** Two sentences max. Leads the marketing page. */
  summary: string
  /** Scope hierarchy this product operates in, in the user's words. */
  scopeLabel: string
  /**
   * Whether the product runs inside a school/program (or brand/site) scope.
   * Design OS is workspace-wide, so offering it a school picker would invent a
   * choice that does not exist.
   */
  scoped: boolean
  /** Primary persona, matching the archetypes in exxat-domain-context. */
  persona: string
  /** Three or four capabilities. Each one names a job, not a feature. */
  highlights: { icon: string; title: string; body: string }[]
  /**
   * Three steps, in order — the shape of the work, for the marketing page's
   * "How it works" band.
   *
   * Highlights say what the product is good at; these say what a program
   * actually does with it, start to finish. A reader deciding whether to book a
   * demo needs both, and a capability list alone leaves them guessing at the
   * commitment.
   */
  steps: { title: string; body: string }[]
  /**
   * Release stage, for the products that are not simply generally available.
   *
   * Replaced an `availability` ship quarter: every product in the catalog now
   * exists, so the interesting distinction is no longer "shipped or not" but
   * "how finished is it". Omit for a product that needs no qualifier — most of
   * them — because a badge on every card is a badge on none.
   */
  stage?: ProductStage
  /**
   * Gallery frames for the marketing page, in story order.
   *
   * App-store guidance is consistent that a bare screenshot underperforms a
   * captioned one, so every frame names the moment it shows rather than the
   * screen it came from. Sources live in `public/product-marketing` as WebP;
   * `alt` carries the same information for anyone not seeing the image.
   *
   * `kind` keeps the two honest. A "screenshot" is a real capture of shipping
   * software and gets window framing. "keyart" is brand illustration for a
   * product that has not shipped a screen yet — it is presented as artwork, so
   * nobody reads it as a promise about what the UI looks like.
   */
  screens: ProductScreen[]
  /**
   * Recent changes worth surfacing on the card a workspace that already owns
   * this product opens every day, not just in the marketing page's own copy
   * three sections down. Different question from `stage`: `stage` says
   * whether the *product* is new or still beta, this says whether *this
   * workspace's own install of it* changed recently.
   *
   * Newest first — `WhatsNewBadge` (the product tile's own flag) reads only
   * `[0]`, so that is the one release it is allowed to interrupt someone
   * about. Every entry still reaches the `/home` digest (`WhatsNewSection`),
   * which is built for more than one at a time. Drop an entry once the
   * change stops being news; `WhatsNewBadge` and the digest both drop it the
   * moment someone reads it anyway, so this is a short list of what is
   * actually recent, not a running changelog.
   */
  whatsNew?: ProductWhatsNewItem[]
  /**
   * Products that pair with this one on the marketing page's "Works well with"
   * band. Ordered; show at most three. Omit or leave empty when there is no
   * honest cross-sell (e.g. Design OS).
   */
  pairsWith?: Product[]
}

/**
 * `visual` picks which of the digest's two card treatments this update gets
 * (`WhatsNewSection`'s `mediaFit`):
 *
 * `"cover"` — the screenshot *is* the update (a whole search result, a whole
 * dashboard) and fills the card as a background behind a scrim.
 * `"component"` (default) — the update is one piece of the screen (a
 * floating Leo window, one KPI card), shown contained beside the copy
 * rather than stretched to stand in for the whole product.
 */
/**
 * Who a release note is for.
 *
 * Students and staff sign into the same products and do not do the same job in
 * them, so a shared list announced bulk cohort overrides to the student whose
 * cohort was being overridden. `staff` covers both administrators and members:
 * the split that matters to a release note is coordinator work versus a student's
 * own submissions, not who holds the console.
 *
 * Absent means everyone, so an untagged note is never silently hidden from the
 * people it was written for. Cross-product surfaces stay untagged on purpose,
 * Ask Leo first among them.
 */
export type WhatsNewAudience = "staff" | "student"

export interface ProductWhatsNewItem {
  title: string
  body: string
  /** Narrows this note to one audience. Absent means everyone. */
  audience?: WhatsNewAudience
  visual?: "cover" | "component"
  /**
   * Overrides the product's own marketing screenshot (`entry.screens[0]`,
   * `WhatsNewSection`'s default) for this one card. An update to a
   * cross-product surface — Leo's own window, not anything belonging to
   * *this* product — should show that surface, not a screenshot of
   * whichever hub happens to render first in this product's marketing
   * gallery.
   */
  image?: string
}

/** The Ask Leo panel itself, captured once and reused on every Leo-branded
 * `whatsNew` entry across every product — Leo is one surface with one look
 * regardless of which product's workspace it opens in, so a Clinical
 * Education card announcing a Leo feature should show the same window as
 * a Site Coordinator card announcing a different Leo feature, not each
 * product's own unrelated screenshot standing in for it. Framed by the
 * "Ask Leo" wordmark, so it only reads right beside the copy — `"component"`
 * cards (`mediaFit="fill"`). */
export const LEO_WINDOW_PREVIEW_IMAGE = "/product-marketing/leo-window-preview.webp"
/**
 * Same capture with the header row cropped out — a `"cover"` card puts this
 * behind the *whole* banner, and the source screenshot's own "Ask Leo BETA"
 * title sits at the same top-left corner our headline does. Full frame:
 * legible text fighting legible text. Headerless: just the mark on its
 * ambient wash, which reads as texture behind the copy instead of a second
 * caption.
 */
export const LEO_WINDOW_COVER_IMAGE = "/product-marketing/leo-window-cover.webp"

/**
 * Ordered — this is the order products appear on the home and drives which
 * card the eye lands on first.
 */
export const PRODUCT_CATALOG: ProductCatalogEntry[] = [
  {
    product: "exxat-prism",
    tagline: "Clinical placements, compliance, and accreditation evidence",
    summary:
      "Clinical Education runs the placement lifecycle for health-science programs — ingesting clinical rotation slots, holding students to a compliance baseline before they reach the clinical floor, and keeping the evidence trail an accreditor will ask for. It is the system of record for the DCE.",
    scopeLabel: "School > Program",
    scoped: true,
    persona: "DCE / Placement Coordinator",
    highlights: [
      {
        icon: "fa-light fa-calendar-check",
        title: "Slot ingestion and optimization",
        body: "Take in clinical rotation slots from partner sites and match them against cohort demand, travel limits, and prior site relationships.",
      },
      {
        icon: "fa-light fa-shield-check",
        title: "Compliance before the floor",
        body: "Track immunization series, quantitative titers, drug screens, and federal background clearance. Students who cannot rotate are blocked, not warned.",
      },
      {
        icon: "fa-light fa-file-certificate",
        title: "Audit-ready by default",
        body: "Every export is built for a CAPTE, CCNE, or ARC-PA site visit rather than assembled by hand the week before one.",
      },
    ],
    steps: [
      {
        title: "Bring in the slots",
        body: "Partner sites send what they have, so the term is planned against real availability instead of last year's assumptions.",
      },
      {
        title: "Clear the cohort",
        body: "Every student is checked against the requirements of the site they are actually going to, well before the start date.",
      },
      {
        title: "Hand over the evidence",
        body: "The trail a site visit asks for is already assembled, because it was built as the term ran.",
      },
    ],
    screens: [
      {
        src: "/product-marketing/prism-dashboard.webp",
        caption: "Land on what needs attention today, not a wall of charts",
        alt: "Clinical Education dashboard showing a setup checklist and a prioritised task list",
      },
      {
        src: "/product-marketing/prism-library.webp",
        caption: "Every record in one hub you can filter, sort, and save as a view",
        alt: "Clinical Education library hub listing records in a sortable table with saved views and filters",
      },
      {
        src: "/product-marketing/prism-library-hub.webp",
        caption: "Search in plain language, or pick up exactly where you left off",
        alt: "Clinical Education question hub with a natural-language search field and recently opened records",
      },
    ],
    whatsNew: [
      {
        title: "New Ask Leo",
        body: "Ask from any screen. Leo opens straight into the record that answers it.",
        visual: "cover",
        image: LEO_WINDOW_COVER_IMAGE,
      },
      // The student's half of Learning activities: the forms a student initiates
      // and the logs and hours a rotation asks them for. Same module the
      // coordinator reviews, named from the side that fills it in.
      {
        title: "Your forms in one list",
        body: "Every form assigned to you shows whether it is not started, in progress, or submitted.",
        audience: "student",
      },
      {
        title: "Log hours as you go",
        body: "Add patient encounters and timesheet hours during a rotation, then send them for approval.",
        audience: "student",
      },
      {
        title: "Leo smart import",
        body: "Drop in a slot sheet. Leo maps the columns and flags cohorts that do not match.",
        audience: "staff",
        image: LEO_WINDOW_PREVIEW_IMAGE,
      },
      {
        title: "Bulk clearance overrides",
        body: "Clear a whole cohort against one exception in a single action.",
        audience: "staff",
      },
    ],
    pairsWith: ["exxat-one-schools", "exxat-compliance", "exxat-curriculum-mapping"],
  },
  /**
   * Exxat One, school side. The entry in the switcher.
   *
   * Its sibling below is the same partnership seen from the site's desk, and is
   * kept off every listing surface by `PRODUCTS_OFF_HOME`. Two cards both called
   * "Exxat One" is the failure to avoid.
   */
  {
    product: "exxat-one-schools",
    tagline: "Find clinical availability, and secure it before someone else does",
    summary:
      "Exxat One shows a program every site that has published availability, what it takes to qualify, and where its own applications stand. Coordinators apply, track responses, and confirm schedules without emailing each partner to ask what is open.",
    scopeLabel: "School > Program",
    scoped: true,
    persona: "Director of Clinical Education / Placement Coordinator",
    highlights: [
      {
        icon: "fa-light fa-magnifying-glass-location",
        title: "Availability you can search",
        body: "Published openings across every partner site, filtered to the discipline, term, and distance the program can actually staff.",
      },
      {
        icon: "fa-light fa-heart",
        title: "Wishlists that answer back",
        body: "Rank the sites the program wants and watch responses land in one queue rather than five inboxes.",
      },
      {
        icon: "fa-light fa-calendar-days",
        title: "Confirmed schedules in one place",
        body: "What was requested, what came back, and who is going where, without a spreadsheet in between.",
      },
    ],
    steps: [
      {
        title: "Explore what is open",
        body: "Browse availability every partner has published, in the terms the program is staffing.",
      },
      {
        title: "Apply and rank",
        body: "Submit applications and wishlists, then track each site's response in one queue.",
      },
      {
        title: "Confirm the rotation",
        body: "Turn accepted requests into schedules the program and the student both see.",
      },
    ],
    screens: [
      {
        src: "/product-marketing/one-sites-slot-requests.webp",
        caption: "Every application the program filed, and where each one stands",
        alt: "Exxat One requests queue listing placement applications by site with seat counts, start dates, and accepted or pending status",
      },
    ],
    whatsNew: [
      {
        title: "Leo assessment agent",
        body: "Leo drafts a first pass on each evaluation from the hours and notes on file.",
        audience: "staff",
        image: LEO_WINDOW_PREVIEW_IMAGE,
      },
      {
        title: "Your clearance for each site",
        body: "See whether a location has you cleared, in review, or needing action before your first day.",
        audience: "student",
      },
    ],
    pairsWith: ["exxat-prism", "exxat-compliance", "exxat-surveys"],
  },
  {
    product: "exxat-one-sites",
    tagline: "One place for clinical partners to manage incoming students",
    summary:
      "Exxat One gives hospital and clinic partners a single view of every student rotating through their locations, no matter which school sent them. Site coordinators confirm clearance, verify hours, and route evaluations without another login for each program.",
    scopeLabel: "Brand > Site > Location",
    scoped: true,
    persona: "Site Coordinator / Clinical Partner Ops",
    highlights: [
      {
        icon: "fa-light fa-hospital",
        title: "Every location in one roster",
        body: "Roll up incoming students across a brand's sites and locations instead of tracking each program in a separate spreadsheet.",
      },
      {
        icon: "fa-light fa-clipboard-check",
        title: "Clearance at a glance",
        body: "See which students have met the site's requirements before their first shift, and send back what is missing.",
      },
      {
        icon: "fa-light fa-clock",
        title: "Hours and evaluations",
        body: "Preceptors verify hours and submit evaluations from a tokenized email link, with no password wall to get through.",
      },
    ],
    steps: [
      {
        title: "Claim your locations",
        body: "One login covers every site and location in the brand, whichever school sent the student.",
      },
      {
        title: "Clear who is coming",
        body: "Confirm each incoming student meets the site's requirements, and send back exactly what is missing.",
      },
      {
        title: "Sign off the rotation",
        body: "Preceptors verify hours and file evaluations from an emailed link — no account to create, no password to reset.",
      },
    ],
    screens: [
      {
        src: "/product-marketing/one-sites-locations.webp",
        caption: "Every location in the brand, and how full each one already is",
        alt: "Exxat One Locations hub listing sites with seats-filled progress bars, clearance status, and the coordinator for each",
      },
      {
        src: "/product-marketing/one-sites-slot-requests.webp",
        caption: "Requests from every school partner in one queue, not five inboxes",
        alt: "Slot Requests hub showing incoming placement requests from four schools with seat counts, start dates, and accepted or pending status",
      },
    ],
    whatsNew: [
      {
        title: "Leo assessment agent",
        body: "Leo drafts a first pass on each evaluation from the hours and notes on file.",
        audience: "staff",
        image: LEO_WINDOW_PREVIEW_IMAGE,
      },
      // The one thing a rotating student needs from the site's app, and the one
      // thing this product already tracks about them: whether the location has
      // cleared them. Everything else here is the coordinator's queue.
      {
        title: "Your clearance for each site",
        body: "See whether a location has you cleared, in review, or needing action before your first day.",
        audience: "student",
      },
      {
        title: "Preceptor evaluations on mobile",
        body: "Preceptors sign off hours and file evaluations from a phone browser.",
        audience: "staff",
      },
    ],
    pairsWith: ["exxat-prism", "exxat-compliance", "exxat-surveys"],
  },
  {
    product: "exxat-curriculum-mapping",
    tagline: "See where every competency is actually taught and assessed",
    summary:
      "Curriculum Mapping connects each course to the competencies it teaches and the assessments that prove it, so a program can answer an accreditor's coverage question from the map instead of reconstructing it from syllabi.",
    scopeLabel: "School > Program",
    scoped: true,
    persona: "Curriculum Chair / Program Director",
    highlights: [
      {
        icon: "fa-light fa-sitemap",
        title: "Coverage you can see",
        body: "Competencies mapped across the course sequence, with the gaps and the duplicated coverage both visible.",
      },
      {
        icon: "fa-light fa-clipboard-check",
        title: "Assessment evidence attached",
        body: "Every mapped competency points at the assessment that measures it, not just the course that mentions it.",
      },
      {
        icon: "fa-light fa-arrows-rotate",
        title: "Survives a curriculum revision",
        body: "Move a course and the map moves with it, so last year's mapping does not quietly become fiction.",
      },
    ],
    steps: [
      {
        title: "Load the sequence",
        body: "Courses, terms, and cohorts come from the program you already run — nothing is retyped.",
      },
      {
        title: "Map competency to course",
        body: "Say where each competency is taught, and attach the assessment that proves a student met it.",
      },
      {
        title: "Read the coverage",
        body: "Gaps and duplication show up on the map, months before a reviewer asks about them.",
      },
    ],
    screens: [
      {
        src: "/product-marketing/ds-courses.webp",
        caption: "Your course sequence in one sortable hub, cohort and year on every row",
        alt: "Course hub listing courses with academic year, term, cohort, and professional year columns",
        representative: true,
      },
    ],
    pairsWith: ["exxat-accreditation", "exxat-exam-management", "exxat-student-success"],
  },
  {
    product: "exxat-compliance",
    tagline: "Every student cleared before they reach the clinical floor",
    summary:
      "Compliance tracks immunisations, background checks, certifications, and site-specific requirements against each student's placement, and surfaces who is short of what while there is still time to fix it.",
    scopeLabel: "School > Program",
    scoped: true,
    persona: "Compliance Coordinator / DCE",
    highlights: [
      {
        icon: "fa-light fa-shield-check",
        title: "Requirements per site, not per school",
        body: "Sites ask for different things. Each placement checks against what that site actually requires.",
      },
      {
        icon: "fa-light fa-calendar-exclamation",
        title: "Expiry before it bites",
        body: "Certifications that lapse mid-rotation surface ahead of the start date rather than on the first day.",
      },
      {
        icon: "fa-light fa-file-shield",
        title: "An audit trail that holds up",
        body: "Documents, verification dates, and who signed off, kept where an accreditor can follow them.",
      },
    ],
    steps: [
      {
        title: "Set the requirements",
        body: "Per program and per site — whatever that clinical floor actually asks for, not a single school-wide list.",
      },
      {
        title: "Collect and verify",
        body: "Students upload once, a coordinator verifies once, and it stays verified until the day it expires.",
      },
      {
        title: "Act before the start date",
        body: "Who is short of what, ordered by how soon they rotate, while it can still be fixed.",
      },
    ],
    screens: [
      {
        src: "/product-marketing/one-sites-locations.webp",
        caption: "Clearance state on every row, so you can see who is short of what",
        alt: "Hub table showing rows with cleared, action needed, and in review clearance states alongside seats filled",
        representative: true,
      },
    ],
    pairsWith: ["exxat-prism", "exxat-one-schools", "exxat-student-success"],
  },
  {
    product: "exxat-surveys",
    stage: "new",
    tagline: "Course and site feedback collected where the placement already lives",
    summary:
      "Surveys & Course Evaluations asks students about a rotation while they are still in it, and routes the answers back to the course and the site it is about, so feedback lands somewhere it can change something.",
    scopeLabel: "School > Program",
    scoped: true,
    persona: "Program Director / Curriculum Chair",
    highlights: [
      {
        icon: "fa-light fa-paper-plane",
        title: "Sent from the placement, not a spreadsheet",
        body: "The roster already knows who was where and when, so the right students get the right survey without a mail merge.",
      },
      {
        icon: "fa-light fa-chart-simple",
        title: "Results attached to the site",
        body: "Feedback about a clinical site sits on that site's record, where the next placement decision is made.",
      },
      {
        icon: "fa-light fa-user-secret",
        title: "Anonymity that holds",
        body: "Small cohorts are the hard case. Responses aggregate before anyone can read them back to a student.",
      },
    ],
    steps: [
      {
        title: "Ask while they remember",
        body: "The roster already knows who was where and when, so the survey goes out from the placement itself.",
      },
      {
        title: "Route the answers",
        body: "Feedback about a site lands on that site's record; feedback about a course lands on the course.",
      },
      {
        title: "Close the loop",
        body: "The next placement decision opens with the last cohort's evidence sitting next to it.",
      },
    ],
    screens: [
      {
        src: "/product-marketing/prism-library.webp",
        caption: "A reusable question bank behind every evaluation you send",
        alt: "Question library listing reusable items in a sortable table with filters and saved views",
        representative: true,
      },
    ],
    pairsWith: ["exxat-prism", "exxat-one-schools", "exxat-curriculum-mapping"],
  },
  {
    product: "exxat-exam-management",
    stage: "beta",
    tagline: "Author, schedule, and score practical exams",
    summary:
      "Exam Management covers the practical exam end to end — building the rubric, scheduling the stations, capturing scores at the bedside, and returning a result the student can actually learn from.",
    scopeLabel: "School > Program",
    scoped: true,
    persona: "Course Coordinator / Faculty",
    highlights: [
      {
        icon: "fa-light fa-list-check",
        title: "One rubric, every examiner",
        body: "Scores come back on the same scale regardless of who was holding the tablet.",
      },
      {
        icon: "fa-light fa-calendar-days",
        title: "Stations and rotations scheduled together",
        body: "Examiners, rooms, and students resolved in one pass instead of three spreadsheets.",
      },
      {
        icon: "fa-light fa-clipboard-list-check",
        title: "Results that feed the record",
        body: "A practical result becomes competency evidence rather than a grade in a separate system.",
      },
    ],
    steps: [
      {
        title: "Author the rubric",
        body: "One scale, written once, so a station scored by two examiners means the same thing twice.",
      },
      {
        title: "Schedule the stations",
        body: "Students, examiners, and rooms resolved in a single pass instead of three spreadsheets and a phone call.",
      },
      {
        title: "Score and return",
        body: "Capture at the bedside, and the result lands on the student record as competency evidence.",
      },
    ],
    screens: [
      {
        src: "/product-marketing/one-sites-slot-requests.webp",
        caption: "Sittings and stations in one queue instead of three spreadsheets",
        alt: "Request queue showing scheduled items with counts, dates, and accepted or pending status",
        representative: true,
      },
    ],
    pairsWith: ["exxat-curriculum-mapping", "exxat-student-success", "exxat-surveys"],
  },
  {
    product: "exxat-accreditation",
    tagline: "Self-study evidence assembled from the work you already did",
    summary:
      "Accreditation maps standards to the evidence your program generates day to day, so preparing a self-study becomes a review of what is already there rather than a year of reconstruction.",
    scopeLabel: "School > Program",
    scoped: true,
    persona: "Program Director / Accreditation Lead",
    highlights: [
      {
        icon: "fa-light fa-link",
        title: "Standards mapped to real records",
        body: "Each standard points at the placements, assessments, and documents that satisfy it.",
      },
      {
        icon: "fa-light fa-magnifying-glass-chart",
        title: "Gaps visible early",
        body: "See which standards are thin now, while there is still a cohort left to fix them with.",
      },
      {
        icon: "fa-light fa-file-export",
        title: "Export in the reviewer's shape",
        body: "Produce the narrative and the appendix in the format the accreditor asked for.",
      },
    ],
    steps: [
      {
        title: "Load the standards",
        body: "Your accreditor's framework as written, so nobody is translating it into a spreadsheet first.",
      },
      {
        title: "Point them at evidence",
        body: "Each standard links to the placements, assessments, and documents already sitting in Exxat.",
      },
      {
        title: "Export the self-study",
        body: "Narrative and appendix in the shape the reviewer asked for, generated from what the program actually did.",
      },
    ],
    screens: [
      {
        src: "/product-marketing/prism-dashboard.webp",
        caption: "A standing checklist of what is still outstanding, not a wall of charts",
        alt: "Dashboard with a completion checklist and a prioritised task list showing what remains outstanding",
        representative: true,
      },
    ],
    pairsWith: ["exxat-curriculum-mapping", "exxat-prism", "exxat-student-success"],
  },
  {
    product: "exxat-student-success",
    stage: "beta",
    tagline: "AI insights as one picture of the student",
    summary:
      "Student & Program Success reads across placements, compliance, curriculum, and assessment to surface who is at risk and why — recommendations you can act on, rather than four dashboards you have to reconcile yourself.",
    scopeLabel: "School > Program",
    scoped: true,
    persona: "Program Director / DCE",
    highlights: [
      {
        icon: "fa-light fa-medal",
        title: "Competency and skills tracking",
        body: "Progress toward each competency assembled from the assessments that actually measured it.",
      },
      {
        icon: "fa-light fa-bell-exclamation",
        title: "Early-risk alerts",
        body: "A student trending toward trouble surfaces while there is still a term left to intervene.",
      },
      {
        icon: "fa-light fa-chart-line",
        title: "Program quality analytics",
        body: "Cohort outcomes over time, so a curriculum change can be judged by what happened next.",
      },
      {
        icon: "fa-light fa-lightbulb",
        title: "Recommendations, not just charts",
        body: "The more modules a program runs, the more the platform has to reason over — and the more specific the advice gets.",
      },
    ],
    steps: [
      {
        title: "Read across the modules",
        body: "Placements, compliance, curriculum, and assessment assembled into one picture per student.",
      },
      {
        title: "Surface who is slipping",
        body: "Risk arrives with the signals behind it, while there is still a term left to do something about it.",
      },
      {
        title: "Act on the recommendation",
        body: "Advice specific enough to assign to someone, then measured against what happened next.",
      },
    ],
    screens: [
      {
        src: "/product-marketing/ds-analytics.webp",
        caption: "AI-generated insights on what moved, what is slipping, and what to do",
        alt: "Insights panel listing AI-generated findings such as a rising placement rate, a growing review backlog, and a compliance milestone",
        representative: true,
      },
    ],
    pairsWith: ["exxat-prism", "exxat-curriculum-mapping", "exxat-compliance"],
  },
  {
    product: "exxat-design-os",
    tagline: "The design system behind every Exxat product",
    summary:
      "Design OS is the working catalog of Exxat's primitives, patterns, and tokens. Designers and engineers browse live components, read the pattern guidance behind them, and copy the implementation straight into a product.",
    scopeLabel: "Workspace",
    scoped: false,
    persona: "Designer / Engineer",
    highlights: [
      {
        icon: "fa-light fa-shapes",
        title: "Live component catalog",
        body: "Every primitive rendered in its real states, with the API and the reasoning next to it.",
      },
      {
        icon: "fa-light fa-palette",
        title: "Tokens and themes",
        body: "The colour, type, and spacing scales each product inherits, plus what happens when a tenant rebrands.",
      },
      {
        icon: "fa-light fa-book-open",
        title: "Patterns, not just parts",
        body: "Guidance for whole surfaces — hubs, wizards, overlays — so screens stay consistent across products.",
      },
    ],
    steps: [
      {
        title: "Browse the catalog",
        body: "Every primitive, pattern, and token rendered live, in the states it actually ships in.",
      },
      {
        title: "Copy the implementation",
        body: "Take the code as it ships in production, not a screenshot of it and a guess at the props.",
      },
      {
        title: "Stay in sync",
        body: "Upgrade the package and the changes arrive with the guidance that explains them attached.",
      },
    ],
    screens: [
      {
        src: "/product-marketing/design-os-catalog.webp",
        caption: "One catalog for tokens, primitives, patterns, and templates",
        alt: "Design OS catalog home with categories for tokens, UI primitives, patterns, and templates",
      },
      {
        src: "/product-marketing/design-os-tokens.webp",
        caption: "Every token with its live value, namespace, and preview",
        alt: "Token browser listing design tokens with colour previews, namespaces, and resolved values",
      },
      {
        src: "/product-marketing/design-os-columns.webp",
        caption: "Table cell patterns rendered in their real states, ready to copy",
        alt: "Column type reference showing avatar groups, status chips, ratings, and toggles in a table",
      },
    ],
    // No `whatsNew` here: Design OS never reaches the home, so an entry on it
    // would be dead data (see `PRODUCTS_OFF_HOME` in `product-home.ts`).
  },
]

/**
 * Mock entitlement. Clinical Education, Exxat One, and Design OS are licensed
 * for this workspace; the rest are not, which is what gives the home something
 * real to market. Swap for the entitlement API when it lands.
 */
const ENTITLED_PRODUCTS: readonly Product[] = [
  "exxat-prism",
  "exxat-one-schools",
  "exxat-design-os",
]

/**
 * Custom tenant products are always entitled — the workspace created them, so
 * they can never be something to market back to it.
 *
 * A sign-in flow that grants apps narrows this to that list, whether it names one
 * app or two. That is the whole mechanism behind "the app you did not get moves to
 * More from Exxat": the switcher and the products home both split their lists on
 * this answer, so overriding it here is enough and neither surface needs to know
 * a login flow exists. Design OS stays entitled regardless, since it is the way
 * back into the catalogue and is hidden from the switcher anyway.
 */
export function isProductEntitled(product: Product): boolean {
  if (product === "exxat-custom") return true

  const granted = grantedProducts()
  if (granted) return granted.includes(product) || product === "exxat-design-os"

  return ENTITLED_PRODUCTS.includes(product)
}

export function findCatalogEntry(product: Product): ProductCatalogEntry | undefined {
  return PRODUCT_CATALOG.find(entry => entry.product === product)
}

/**
 * Where a product sits in the half of a list this workspace does not own yet.
 * Lower comes first, so a beta leads.
 *
 * A beta is the one entry in that list with something to do today. Everything
 * else there is a sales conversation, and the ask on a beta is feedback: an opt-in
 * this workspace can take now, from a product that is still being shaped by the
 * people who take it. Buried sixth in a shelf it may as well not carry the badge.
 *
 * Only beta is promoted. `new` says "look at this" about a product that is already
 * generally available, which is a reason to badge it and not a reason to reorder
 * around it, and promoting both would leave the catalog sorted by badge rather
 * than by what it offers.
 *
 * Ties keep catalog order, which is the curated one, because `Array#sort` is
 * stable. So this reorders the two betas to the front and changes nothing else.
 *
 * Read by both surfaces that draw the list — the products home's More from Exxat
 * and the product switcher's group of the same name — so the two cannot disagree
 * about what leads.
 */
export function catalogStageRank(stage: ProductStage | undefined): number {
  return stage === "beta" ? 0 : 1
}
