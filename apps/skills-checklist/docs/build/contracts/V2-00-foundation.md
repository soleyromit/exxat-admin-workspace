# V2-00 Foundation: shell, scenario switcher, reset and store

**Status:** Stage 0 contract for the connected prototype v2 (`docs/v2/README.md`). Written against `00-cross-cutting.md`, which it only narrows. Source tags: `[REQ]`, `[OD-n]`, `[PROPOSED]`, `[INFER]`.

```
Surface:              V2 foundation: DS shell, role switcher, Scenario menu (14 steps), Reset demo, shared mock store,
                      scenario overview, role homes and the 14 placeholder step pages          Wave: V2 Stage 0
Persona(s) & role:    Demo presenter acting as Administrator, Student (mobile), Preceptor, Reviewer or Program director.
                      RBAC row cited: 00-cross-cutting.md section 7 (all data is sample data; no real access control).
Scope / data seen:    All seed data in one browser. A presenter sees every role's pages because roles are a demo switch,
                      not authorisation. No real student data, no network calls, nothing leaves the browser.
Job-to-be-done:       Let a presenter move through the 14-step story in any order, see that each page reads the same data,
                      and return to the starting data in one action.
Why -> So what:       Stakeholders judge the story, not isolated screens. Shared state makes a change in step 5 visible in
                      step 10 and step 12, and Reset makes a demo repeatable.      (journeys/01..03, brief in docs/v2)
Requirements:         SL-01, IM-01, IM-09, IM-10, IM-11, IM-14, SC-01, SC-02, SC-08, SC-10, SC-11, SC-12, SC-15, SC-16,
                      SC-17, SC-18, SC-19, CM-01, CM-03, CM-04, CM-05, CM-06, ST-01, ST-04, ST-05, ST-06, ST-08, ST-09,
                      ST-10, ST-11, ST-12, ST-13, EV-01, EV-03, EV-04, EV-05, EV-06, EV-07, EV-02, AR-01, AR-02, AR-03,
                      AR-04, AR-05, AR-06, RV-02, RV-03, RV-04, SH-01, SH-02, SH-03, SH-06, SH-07, RP-01, RP-02, RP-03,
                      RP-05, RP-06, RP-07, RP-10, AE-01, AE-03, AE-04
                      Stage 0 satisfies none of these functionally. It names them per step and seeds the data they need.
Open decisions hit:   OD-19 (batch grid, step 14), OD-17 (evaluator never sees achievement status, kept as the default),
                      OD-18 (no link expiry rule stated in the UI). Seam: all v2 behaviour that goes beyond the
                      requirements is [PROPOSED] and lives in docs only. No OD is treated as decided.
Prototype reference:  Sankalp's prototype is the layout reference for v1 only. v2 has no visual prototype; layout comes from
                      the DS base shell (docs/build/ds-shell-anatomy.md).
Pattern:              Route group (v2) with its own layout. Reference hub: apps/skills-checklist/admin/components/shell/
                      shell-frame.tsx (same composition, v2 wiring).
DS mapping:           SidebarShell, AppSidebar, SidebarInset, SidebarTrigger, Breadcrumb  -> IMPORT (shell)
                      ProductSwitcher, SearchTrigger, NotificationsTrigger, HelpTrigger, AskLeoControl -> reuse v1 shell files
                      Role switcher, Scenario menu -> DropdownMenu (+ RadioGroup items), Button outline sm  -> IMPORT
                      Reset confirmation -> Dialog, Button  -> IMPORT
                      Command menu -> Command, CommandDialog  -> IMPORT
                      Step and overview pages -> PageHeader (via PageFrame), Card, Badge, DataTable (read-only, no query controls), LocalBanner, Button -> IMPORT
                      (a raw Table was tried first and blocked by the pre-commit ds-adoption audit; DataTable is the canonical table)
                      Hand-rolls: none (see docs/v2/new-components-needed.md for later stages)
States:               L  Overview and counters render the seed on the server, then the saved state after mount (no spinner
                         needed; no flash because the seed is the first client render too).
                      E  Not applicable: the seed always has data. After Reset the seed is back.
                      Er Corrupt or blocked localStorage falls back to the seed and keeps working in memory (tested).
                         Unknown role or step route returns the Next 404 page.
                      V  Not applicable (no form input in Stage 0).
                      S  Marking a step reviewed updates the button label, aria-pressed and counters immediately.
                      Su Reset shows a success LocalBanner on the overview ("Demo data reset"), dismissible.
                      D  Not applicable.   P  Not applicable.   Bl  Starting-condition badge shows "Not met" and tells
                         the presenter to use Reset demo.
Edge cases:           Two tabs open: a storage event reloads the other tab's store. Persisted data from an older shape is
                      discarded and replaced by the seed. Reduced-motion browsers: Ask Leo renders after mount to avoid a
                      DS hydration error.
Copy:                 Sentence case, no em dashes. Buttons: "Mark step as reviewed", "Unmark step as reviewed",
                      "Reset demo data", "Keep my changes", menu "Scenario", "Reset demo". Dialog: "Reset the demo data?
                      Every change made in this browser goes back to the starting data for Harbor University BSN. Reviewed
                      steps are cleared." Banner: "Demo data reset. Everything is back to the starting data for the scenario."
A11y:                 One h1 per page, h2 sections. Utility bar is a nav landmark; sidebar and main have labels. Every
                      control reachable by Tab with a visible focus ring (DS). Menus follow Radix keyboard behaviour.
                      Reset dialog opens with focus on "Keep my changes" (safe default). Status badges carry text. Targets
                      meet 24 px minimum on desktop; phone targets in later stages meet 44 px. Reviewed state is exposed
                      with aria-pressed and a visible label, not colour.
Out of scope:         Every real screen of steps 1 to 14 (Stages 1 to 5). Real authorisation. Server persistence. Any
                      requirements section 14 item beyond those named [PROPOSED] in docs/v2/decisions-and-open-questions.md.
Acceptance tests:     1. Store reset equals the seed and clears reviewed steps (tests/v2/store.test.ts).
                      2. Persistence round trip restores state in a new store after hydrate; corrupt, wrong-version and
                         blocked storage fall back without throwing (same file).
                      3. Exactly 14 steps, unique routes, every cited requirement ID exists in the requirements file,
                         every starting condition holds on the seed (tests/v2/scenario.test.ts).
                      4. In the browser: marking a step reviewed raises "Scenario steps reviewed" and the audit count,
                         survives a reload, shows on the overview, and Reset demo returns both to the seed.
                      5. Role switcher opens the chosen role's home; Scenario menu opens any of the 14 steps.
                      6. axe (WCAG 2.0 and 2.1 A and AA) reports no violations on the foundation pages at 1440x900 and
                         390x844, the Tab walk finds a focus indicator on every stop and no keyboard trap.
Risks / unknowns:     (1) Pre-selecting binary and shipping starter libraries conflict with SC-02 and SL-01 as written;
                      recorded as D2. (2) Per-browser localStorage means a hosted copy is not a shared session.
                      (3) Sample names for reviewer, director and eleven students are invented.
Vault notes consulted:Not consulted for this foundation stage (no Obsidian vault access in this run). Source docs read:
                      docs/README.md, build/contracts/00-cross-cutting.md, build/02-design-contract-template.md,
                      build/prototype-parity.md, strategy/05, strategy/07.
```
