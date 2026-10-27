# 04 UI and visual strategy (Prism Skills Tracking)
**Purpose.** So Romit never re-explains visual goals. Every rule is written as: decision, WHY (evidence), what we rejected and why, how to check it in review.
**Written:** 2026-10-26. **Siblings (not repeated here):** `01-*.md`, `02-*.md`, `03-*.md`, `05-*.md` in this folder. **Inputs:** `../00-design-brief.md`, `../01-competitive-digest.md`, `../02-decisions-ledger.md`, `../glossary.md`, `docs/v2/audit/T1..T4`, `docs/build/ds-shell-anatomy.md`, `docs/v2/new-components-needed.md`, `/tmp/sc-audit/build-prompt.md`, workspace governance, DS source (`node tools/ds/source.mjs`, installed `@exxatdesignux/ui` 1.6.5 `globals.css`).
**Tags:** [REQ id] [CALL] [COMP name] [DS component] [BUILD-PROMPT §n] [AUDIT Tn] [LEDGER] [MEMORY name] [INFER] [PENDING-ROMIT]. Precedence REQ > CALL > PROTO > INFER. v2 is a reference, not final [LEDGER D-F]. No `OD-*` is decided. Untagged means unverified.
---
## 0. How to read this doc
```
Decision  ->  WHY (evidence tag)  ->  Rejected (and why)  ->  Review check (how a reviewer proves it)
```

Where two sources disagree the conflict is named (section 17) rather than silently resolved.
---
## 1. UI thesis
**Calm, dense but scannable, DS-native, evidence not decoration.**

| Part | Decision | WHY | Rejected | Review check |
|---|---|---|---|---|
| Calm | One primary action per surface, one sentence per idea, no repeated banners | Audit found one conflict stated three times on Student Home and sentences repeated 2 to 3 times per page [AUDIT T2, T4]; Romit principle "say it once" [BRIEF §5.2] | Reassuring helper text under every control | Count the places one fact is stated; more than one fails |
| Dense but scannable | Real scale is 123 students, 153 skills, 8,879 evidence records [BUILD-PROMPT §6; LEDGER D-D]. Rows are compact and aligned, groups scroll inside their own panel | A 7-skill demo hides the real problem [LEDGER D-D]. Coordinators scan, not read [INFER] | Generous card-per-row layouts that need 40 screens of scroll | Screenshot at 100+ rows; the page stays scannable with no horizontal page scroll |
| DS-native | Compose `@exxatdesignux/ui` only; no re-skin of Card, Button, Badge [CLAUDE.md; MEMORY never_override_ds_card_button_shape, no_visual_polish] | Past "editorial skin" and inset-shadow attempts read as "not DS" and were rejected by Romit | Rounded-none cards, glows, custom hover states | `visual-diff.mjs` DS-MATCH plus grep for `boxShadow`, `rounded-none` |
| Evidence, not decoration | Every chart or indicator answers a question that someone acts on, and every figure traces to evidence records [BRIEF §1; REQ RP-05, RP-06; MEMORY viz_first] | The product's promise is traceability; a count is a floor, not proof of competence [COMP Dawson 2021] | Ornamental rings and gradients; progress bars as the default [MEMORY progress_bars_last_resort] | For each visual ask "which decision does this change?" and "can I click from the number to the evidence?" |
---
## 2. Visual identity (what this product should feel like among Exxat products)
Prism Skills Tracking is the **tracking and evidence** module inside Prism (Exxat's clinical education platform) [BUILD-PROMPT §0]. It should feel like a quiet ledger: serious, legible and fast to scan, closer to a clinical logbook than to a dashboard toy.
- **Theme.** The app runs `className="theme-prism"` on `<html>` (`app/layout.tsx`). Prism is rose/pink at OKLCH hue 342: `--brand-color: oklch(0.57 0.24 342)` in `.theme-prism` of the DS `globals.css`; Exxat One (`.theme-one`) is lavender at hue 286.1 [DS globals.css; MEMORY prism_theme_is_pink]. WHY: Prism is the platform brand for this product line. REJECTED: violet or indigo, which is Exxat One and has been mistaken for Prism repeatedly. CHECK: the rail tint and primary accents resolve to hue 342, never 286.
- **Feel versus siblings.** Same shell, serif page titles (`--font-heading`, ivypresto-text) and Inter body as PCE and Exam Management [DS globals.css; ds-shell-anatomy]. It is quieter than PCE analytics: no AI glow surfaces on core screens, because Leo is not connected [ds-shell-anatomy §5] and hand-rolled glows break DS conformance [MEMORY no_visual_polish].
- **Colour restraint.** Brand colour is for the one primary CTA and the brand tint of the rail. State colour comes from the DS status tokens (section 7). Charts use a neutral-to-brand sequential scale (section 6.5), not rainbow palettes.
- **Voice.** Plain, active, sentence case, no em dashes, "skills" not "items" [BRIEF §10; LEDGER D-B].
---
## 3. Shell per audience
Three audiences, three shells. The shell must match who the person is and whether they have an account [REQ EV-01; BUILD-PROMPT §3.3].

| Shell | Who | Should carry | Must NOT carry | WHY | Rejected |
|---|---|---|---|---|---|
| **Staff shell** (DS compact shell: utility bar + flat rail + page header) | Admin, reviewer, director, coordinator | Sidebar toggle, product switcher, page title, Search (only if it indexes students, skills, evaluators), scope switcher (program), profile menu with "Switch view", nav badges for work counts | Demo walkthrough menu, six device toggles, inert Notifications and Help, second role switcher in the bar | Design OS compact shell is the target for all products [MEMORY all_products_follow_design_os; ds-shell-anatomy §1]. Audit: three controls do the same role switching, Search only finds the 2 to 7 nav rows [AUDIT T4] | Classic shell with in-sidebar brand header [ds-shell-anatomy §1]; persona groups as sibling rail sections [ds-shell-anatomy §3] |
| **Student shell** | Student | Same DS shell chrome, 3 rows (Home, Log, Record) [AUDIT T4 proposal, not approved], a sync status strip, sticky device banners (offline, signed out, update pending) | Staff vocabulary, demo fault toggles in production chrome, a heavy utility bar on a phone | Student sits in the DS shell on desktop today, with a 28 rem phone column below 768 px [AUDIT T2]. Mobile reliability is the main risk in public reviews [COMP: Exxat Student iOS 1.4 of 5] | A separate phone-only design; an app-store-style tab bar on desktop |
| **Evaluator shell** (no account) | Preceptor, lab instructor, faculty opening a link | Light header ("Secure evaluation link, no account needed" plus program name), one centred column, student switcher chips when the evaluator has several students, sticky submit bar on mobile [BUILD-PROMPT §3.3] | Sidebar, product switcher, role switcher, Demo menu, Search, profile, links out to staff pages | Preceptors have no login [REQ EV-01]. Audit: the v2 preceptor page sits in the full admin shell and "reads as an admin app, not a link a nurse opens from email" [AUDIT T4 P1-3]. The v1 route group `app/(evaluator)/e/[token]` already does this right (wordmark only, `no-referrer`, `noindex`) | Wrapping the preceptor in staff chrome with a 2-row sidebar |

Specifics for the evaluator shell:
- Column max width: BUILD-PROMPT says 820 px; the v1 layout uses `max-w-3xl` (768 px). Pick 820 px [BUILD-PROMPT §3.3] and update v1 to match (open question Q-U3).
- After submit: show the outcome ("Counted now" or "Waits for approval", [REQ EV-07]) and a "Back to requests" link when the evaluator has more. Audit found a dead end [AUDIT T4 handoff 4].
- A role switcher for the demo is not part of the evaluator surface. Demo controls live outside the product chrome (section 14).

**Review check.** Open the evaluator route: no landmarks other than `main`, no `nav`, no sidebar, no link whose href leaves the evaluation. Open a staff page: exactly one role-switching mechanism.
---
## 4. Layout system
### 4.1 Page header

| Decision | WHY | Rejected |
|---|---|---|
| Use the DS `PageHeader` through the product `PageFrame` (serif h1, one purpose line, optional actions). Never `h2` or `h3` as page title | One place sets title font, inset and spacing, so all pages match [PageFrame comment in `components/skills/page-header.tsx`; component-consistency §1] | Per-page hand-built headers |
| Commands live in `actionItems`: at most one filled primary, at most two `row` items, the rest `overflow` [PageFrame] | A page with three equal buttons has no primary action [INFER] | Row of outline buttons like the Admin Home rows in the audit screenshot |
| Content width: `reading` (48 rem) for forms and detail, `wide` (64 rem) side by side, `full` for lists and dashboards. Left aligned, never centred | Title and body share one left edge [PageFrame] | Centred columns on staff pages |
| Page title only in the utility bar breadcrumb slot on top-level pages; no product or program text there [ds-shell-anatomy §3] | Program lives in the scope switcher | "Skills & Competencies / Nursing / Overview" trail |

### 4.2 KPI strip

| Rule | WHY | Rejected | Check |
|---|---|---|---|
| **Maximum 4 metrics** in one `KeyMetrics` strip [MEMORY exxat-kpi-max-four skill; DS KeyMetrics] | A fifth number is never read; four is the scan limit [INFER] | 6 to 8 tile walls | Count cells |
| Use `variant="flat"` for a page-level strip (hairline cells, no per-tile Card) or `variant="compact"` for Card chrome without the "Key Metrics" header [DS KeyMetrics `variant`: card, cards, flat, compact; MEMORY key_metrics_variant_compact] | `variant="card"` always renders a header and period selector that this product does not want | `variant="card"` with `showHeader={false}` (ignored by the DS) | No "Key Metrics" or "vs last week" text unless a real comparison exists |
| A KPI must not repeat a count already on a tab label directly below it | Audit: reviewer queue shows "Awaiting 9" in KPI and "Awaiting (9)" in the tab [AUDIT T4 screenshot] | Both | Compare KPI labels to tab labels |
| Empty trend: pass an empty delta so the trend chip is hidden; put prose in `description` [DS MetricItem docs] | Avoids a fake "0" trend | `"vs last week"` in the delta slot | No dash placeholders |
| Polarity set per metric (`higher_is_better`, `lower_is_better`, `informational`) [DS KeyMetrics `MetricTrendPolarity`] | "Waiting 12 days" going up is unfavourable; wrong polarity tints it as good | Default polarity everywhere | Look at each trend chip colour against meaning |
| Large empty vertical space under the strip is a bug, not whitespace | Seen at 1440 on the reviewer queue [AUDIT T4] | | Screenshot at 1440 |

### 4.3 Grid and spacing
- 12-column grid in the staff shell for KPIs and charts [BUILD-PROMPT §3.3]. Content area renders about 1144 px at a 1440 viewport [AUDIT T4].
- 8 px scale: `gap-2` inside an element, `gap-4` between elements, `gap-6` between sections, `gap-8` between groups [design-anti-patterns "Spacing"]. Page rhythm is 16 px between blocks and 20 px vertical padding [PageFrame].
- List row padding `px-4 py-3`; dense rows `px-3 py-2`; card content `p-4` or `p-5`. No half-values [design-anti-patterns].
- WHY: Uniform padding gives no density signal. REJECTED: arbitrary inline `style={{ padding }}`.

### 4.4 Tables vs cards vs lists (100+ rows)

| Surface type | Use | WHY | Rejected |
|---|---|---|---|
| Records to compare, sort, filter or bulk act on (library 153 skills, queue, outcomes, evaluators, students) | **DS `DataTable`** (through `V2Grid` for read-only lists) with `getRowId`, `emptyState`, count in `toolbarSlot`, `selectable` only when bulk actions exist [component-consistency §2; AUDIT T1] | Scale: 2,141 sites and 403 evaluators need search plus virtualisation [BUILD-PROMPT §6]; DataTable gives sort, filter, selection | Raw `<table>`; cards for 100+ rows [MEMORY exxat-card-vs-list-rows skill] |
| Matrices (heat-grid, lab batch grid, coverage matrix) | DS `Table` primitive (bordered, keyboard-reachable scroll region), not raw `<table>` [new-components-needed Stage 5] | They are grids, not data lists | `DataTable` with fake columns for 43 rows by N sections |
| One skill, one student, mobile | `Card size="sm"` mobile skill card [new-components #20] | A table row cannot carry status, what is left and one action on 375 px | Horizontal-scrolling table on a phone |
| Short list of 3 to 7 related things (steps, versions, evaluators on one record) | Semantic `ol` or `ul` with row dividers, not a box per row | A box per row is the "same card for everything" ban [design-anti-patterns "Cards"] | `rounded-lg border bg-card` per item |
| Whole-list overview of 153 skills | Mosaic plus hierarchy with roll-up [BRIEF §8; BUILD-PROMPT §10] | Open question how to show 140 skills and nested levels [CALL Oct 9] | A flat 153-row scroll as the only view |

Scrolling: grouped lists scroll inside their own panel and keep the page header and context visible. Every ancestor in the flex chain is `flex:1; min-height:0` or the inner scroll fails [MEMORY project_flex_scroll_chain]. A table sizes to its content, it does not stretch to fill height [MEMORY feedback_table_empty_space].
Known defect to fix: reviewer queue Status column clipped at 1440 [AUDIT T4 P2-7]. Rule: the primary status and the primary action columns are never the ones that clip; set widths on identity columns instead.

### 4.5 Sticky actions

| Where | Rule | WHY |
|---|---|---|
| Evaluator form, student log flow, mobile | Sticky bottom bar with the single primary action and an error summary link | Long forms on a phone push Submit off screen [BUILD-PROMPT §3.3] |
| Wizard (configure skill) | Sticky footer with Back and Continue; success banner must be in view after Publish, otherwise scroll it into view and move focus to it | Audit: publish banner was out of view after confirm [AUDIT T4 P2-4] |
| Bulk selection in a table | A visible, touch-sized selection bar (the DS DataTable bar is a hover-revealed dark slab with placeholder actions) [new-components #34] | Selection must be visible without hover |

### 4.6 Empty states
- Content-specific, matched to the density of what they replace; no centred icon plus "No X yet" plus button [design-anti-patterns "Empty & Success"].
- DataTable `emptyState` is required, never omitted [component-consistency §2].
- An impossible filter or role combination is **explained**, not shown as empty [REQ RP-09, ST-08; BRIEF §7].
- Unconfigured skill: show "Not configured" with the reason and the link to configure [REQ IM-09].
- Example copy shape: "No skills match Cohort 2027 and Emergency. Skills in Emergency are mapped to Cohort 2026 only." (names the cause).

### 4.7 Loading and skeletons
- Use DS `Skeleton` that mimics the final layout: table skeleton rows with real column widths, KPI skeleton with four cells, card skeleton at the real card height. Never a lone centred spinner [state-review catalog; `components/v2/shared-loading.tsx`].
- WHY: layout shift on 100+ row pages is the first thing a reviewer notices; the build target is first render under 300 ms on the full dataset [BUILD-PROMPT §13.4].
- Optimistic and offline entries show a state chip (Queued, Synced, Conflict), not a skeleton [new-components #21].
- Check: throttle to slow 3G in the browser, screenshot loading, confirm no layout jump when data arrives.
---
## 5. Component map (surface type to exact DS component)
Run `node tools/ds/source.mjs <Component>` before JSX. Table values below were read from it on 2026-10-26 (CLI prints 1.5.1 types; installed package is 1.6.5 [new-components-needed]).

### 5.1 Button (variant plus size always explicit) [DS Button]
DS variants: `default | outline | secondary | ghost | link | destructive | destructive-solid | destructive-outline | destructive-ghost | destructive-link`. Sizes: `default | xs | sm | lg | icon | icon-xs | icon-sm | icon-lg`.

| Use | Variant and size | WHY |
|---|---|---|
| The page's one primary action ("Publish skill", "Approve", "Submit evaluation", "Ask for sign-off") | `default` + `sm` in a header, `default` + `default` in a form or sticky bar | Primary is the only place brand or dark fill appears [MEMORY neutral_colors_active_states] |
| Secondary actions beside a primary | `outline` + `sm` | Clear hierarchy |
| Row actions in tables | `ghost` + `sm`, or `outline` + `xs` | Dense rows |
| Icon-only | `icon-sm` or `icon`, with `aria-label` | [CLAUDE.md] |
| Destructive that really destroys ("Delete skill", only while no evidence [BUILD-PROMPT admchange]) | `destructive-outline` or `destructive-solid` inside a Dialog | Reserved for irreversible actions, not for "did not meet" |
| Mobile primary | `default` + `lg` (44 px+) [`--control-height-touch: 44px`] | Touch target |

Rules: no raw `<button>`; **no icons on text CTAs**, leading or trailing [MEMORY no_icons_action_buttons]; at most one filled primary per page [PageFrame]; "Open Courses" style outline buttons on every row of a list are a smell (Admin Home screenshot): make the row itself a link and keep one button [AUDIT T4]. REJECTED: custom button shapes or glows [MEMORY never_override_ds_card_button_shape]. CHECK: grep `<button` and `fa-` inside `Button` children.

### 5.2 Status: `StatusBadge`, not `Badge`

| Need | Component | Allowed |
|---|---|---|
| A state (Counted, Waiting for review, Returned, Not configured, Verified) | **`StatusBadge`** via the product `StatusPill` that reads `lib/v2/status-pill.ts` (word, tone, icon from one table) | `tone`: success, info, warning, neutral. `size`: sm (tables, lists) or md (cards, headers). Always `label` + `icon` |
| Danger tone | Not used for student shortfall (section 7.3) | Reserved for hard blocking errors only |
| A count on a nav row | `BadgeCount` is a red count-only chip in the DS | See open question Q-U5: red conflicts with Aarti's no-red stance if read as failure |
| Neutral metadata tag (rule type, level) | `Badge variant="outline"` or `secondary` | Never for a state |
| AI | `BadgeAi` | Not used while Leo is not connected |

WHY: one renderer means "Waiting" looks identical on 12 screens [status-pill.tsx; V2-CONSISTENCY §5]. REJECTED: `Badge` for states, ad hoc coloured spans. CHECK: grep `Badge` where the text is a state word.

### 5.3 Card [DS Card: `size` default|sm, `interactive`]

| Use | Rule |
|---|---|
| A real object with its own actions (a skill card, a conflict version, a compare side) | `Card`; `size="sm"` on mobile skill cards [new-components #20] |
| A group of rows (Admin Home "Set up") | One `Card` with `CardSection` bands, not one card per row |
| Clickable object | `interactive` with a single `Link` or focusable child |
| Chart | Not `CardMedia`. Use the vendored `ChartCard` pattern with a table fallback [DS Card docs; MEMORY use_vendored_chartcard_pce] |

Never override radius, ring or shadow [MEMORY never_override_ds_card_button_shape]. Do not use one card style for item rows, summaries and form sections [design-anti-patterns "Cards"].

### 5.4 Sheet vs Dialog vs route [DS Sheet `size` sm 20rem, md 24rem, lg 32rem, xl 40rem, full; Dialog]

| Task | Surface | WHY |
|---|---|---|
| Confirm an irreversible or consequential act (Publish, Reopen, Return with reason, Delete) | `Dialog` with `DialogTitle`, `DialogDescription`, footer buttons | Short, decision-sized; focus trapped [exxat-drawer-vs-dialog skill] |
| Inspect or edit one record without losing the list (evaluation detail, skill edit, export options, handover mode) | `Sheet side="right"` `size="md"` or `lg`; handover uses `size="full"` | Keeps list context; past `xl` promote to a route [DS Sheet docs] |
| Anything that needs its own URL, deep link or more than a sheet can hold (student record, review item, wizard) | Route | Records carry context in the URL [BUILD-PROMPT §8] |
| Phone | A Dialog becomes a Sheet from the bottom where appropriate [new-components QR code] | Reachability |

For app sheets in other Exxat products "FloatingSheetPanel" is the convention [MEMORY ds_sheet_convention]; confirm whether it applies here before building a new sheet (Q-U7). REJECTED: Vaul/Drawer (not in this DS), hand-composed sheets. CHECK: Escape and outside click close a Sheet; focus returns to the trigger.

### 5.5 Tabs [DS Tabs: `variant` default|line; `rememberScroll`]
- Page-level peer views (Review: Awaiting, Stalled, Returned; Reports sections) use `Tabs`; set `rememberScroll` only when the row is the page's navigation [DS Tabs docs].
- Labels carry the count once, in the label, and the KPI strip does not repeat it (section 4.2).
- Wizard steps up to 5: underline tab stepper; 6 or more steps: a left step list [design-anti-patterns "Step Indicators"]. The configure wizard has 7 steps: left step list.
- REJECTED: numbered dot circles for steps.

### 5.6 LocalBanner, not toast [DS LocalBanner: `variant` error|success|warning|info|promo, `emphasis`, `action`, `dismissible`]

| Case | Variant |
|---|---|
| Publish succeeded, evaluation submitted | `success`, with the next action ("Map it to NURS 350") |
| Offline, signed out, update pending, sync conflict | `warning` or `info` (never `error`) |
| Configuration cannot be saved, hard block | `error`, with the field links |
| Anything informational | `info`, `emphasis="subtle"` |

WHY: product feedback is a banner, never a toast [CLAUDE.md; MEMORY]. A toast disappears before a nurse on a phone can read it. A banner that is out of view must be scrolled into view and announced (`role="status"` or `alert`). CHECK: grep `toast`, `Sonner`; banner count per screen at most 2.

### 5.7 Tooltip and helper copy
- Tooltip is for an explanation of a label that is already self-explanatory (the 15 helper-text cuts in [AUDIT T4]): "Require administrator approval", credentials, supervision rating. It is not the only place a rule or a failed-rule reason appears [REQ SH-03], and never the only way to read a status (touch has no hover).
- One helper line per control group; destructive warnings stay inline.

### 5.8 Others

| Need | Component |
|---|---|
| Form fields | `Field`, `FieldLabel`, `FieldDescription`, `FieldError`, `Input`, `Textarea`, `Select`, `Checkbox`, `RadioGroup`, `SelectionTileGrid` |
| Multi-select, combobox, file upload | The DS has none: compose `Popover` + `Command`; file chooser is a native input behind a `Button` [MEMORY ds_multiselect_gap; new-components #18] |
| Search | DataTable built-in `searchable` (PCE style) or the app command menu; not both on one page [component-consistency §3] |
| Version history, long explanations | `Collapsible` / `Accordion` |
| Person | DS `Avatar` / `AvatarInitials size="sm"` minimum 24 px [MEMORY avatar_initials_disc_floor] |

### 5.9 Must be vendored or composed (the DS lacks it), with reason
All composed from DS primitives on DS tokens, never ad hoc [new-components-needed rule].

| Component | Why the DS cannot do it | Constraint |
|---|---|---|
| Heat-grid (students by sections), dot-strip, segmented dots, waffle, bullet meter, cumulative line (`components/v2/viz`) | The DS has charts but not the indicator layer this product needs [BUILD-PROMPT §1] | Sequential scale from tokens; table fallback; text summary; keyboard; 43 rows hold |
| Mobile skill card, offline sync chip, conflict panel, handover sheet | Student offline and sign-off flows are product specific | 44 px targets; text plus icon |
| Version-history timeline | No DS timeline | Semantic `ol`, newest first, earlier versions read-only |
| Side-by-side compare | Self versus evaluator answers [REQ AR-02] | Two cards, stack under 768 px; agreement is word plus icon |
| Editable ordered list, number field (empty is null), checkbox group with focusable fieldset | DS lacks them | Fieldset `tabIndex=-1` so an issue link can focus it |
| QR display | No DS QR; generator hand-rolled | Always show the link as text |

Each new file goes through `ds-adoption-reviewer` (IMPORT, VENDOR or HAND-ROLL) before it is written [CLAUDE.md Gate 1].
---
## 6. Charts and indicators (visual layer)
6.1 **Rule.** Viz first, text annotates [MEMORY viz_first]. Each chart answers one question and ships with a table version and a one-sentence text summary [BUILD-PROMPT §2.7, §10]. The question-to-visual table is in `../00-design-brief.md` section 8 and is not repeated.
6.2 **Progress bars are a last resort** [MEMORY progress_bars_last_resort; design-anti-patterns "Progress"]. The Admin Home "In use 12 of 31" meter is a plain bar [AUDIT T4]; replace with a count plus a bullet or dot-strip.
6.3 **No stacked bars as a default.** Use bullet plus target or dot-strip [design-anti-patterns]. The Admin Home weakest-skills stacked bar uses brown for "Not met yet": amber family but too dark (section 7.3 check).
6.4 **Radar only for groups of 5 or more**; below that hide it (privacy and meaning) [BRIEF §8].
6.5 **Sequential scale.** Heat-grid cells use a scale derived from the Prism hue, 3:1 against the cell background, 4.5:1 for cell text, always with a text value or glyph in the cell [new-components #2]. Do not use the DS `--chart-1..5` set for state meaning (it is blue, teal, navy, yellow; not the Prism hue) [DS globals.css]. Check: the Student Home squares and Admin Home bars render in saturated blue, which is not a Prism or neutral token; confirm it comes from a token (Q-U6).
6.6 **Counts are a floor, not proof of competence.** Never label a ring "competent" [COMP Dawson 2021].
6.7 **Leo spotting and AI overlays: off.** Leo is not connected [ds-shell-anatomy §5].
---
## 7. Tokens and colour semantics
### 7.1 Token roles (always `var(--token)`, no hex, no raw oklch)

| Role | Token | Use | Never |
|---|---|---|---|
| Surface | `--background`, `--card`, `--muted` | Page, card, hover or zebra | Inner panels on `--sidebar` (pink) [MEMORY inner_panel_background] |
| Text | `--foreground`, `--muted-foreground` (oklch 0.40 on light, at least 4.5:1) | Body, helper | `opacity-*` on text [A11Y-020] |
| Brand | `--brand-color`, `--brand-tint`, `--brand-tint-subtle`, `--brand-ink` | Primary CTA, rail tint, **selected row** background (`--brand-tint`) | Hover and active and selected all in brand [design-anti-patterns "Selection"] |
| Active control | `--muted` fill + `--border-control-3` border + `--foreground` text | Active filter chips, toggles | Brand fill on every active state [MEMORY neutral_colors_active_states] |
| Border | `--border` decorative, `--border-control-3` / `--border-control-35` form fields, `--ring` focus | | `--border` as the only indicator of a state (about 1.2:1) [A11Y-021] |
| Status | `--status-badge-{success,info,warning,danger,neutral}-{fill,fg}` through `StatusBadge` | All state chips | Hand-built tints, `color-mix(in oklch, ...)` |
| Danger | `--destructive`, `--destructive-ink` | Hard blocks, destructive actions | Student shortfall, ratings |
| Sizes | `--control-height` 40, `--control-height-sm` 32, `--control-height-touch` 44 | | |

### 7.2 Brand versus state
Brand pink says "this is the action" or "this is the selected one". It never says "good" or "bad". State is carried by the status tokens plus a glyph and a word [BRIEF §6; MEMORY ds_typography_color_discipline "no brand for states"]. REJECTED: a pink "achieved" or a green primary button.

### 7.3 Status colour table (status colour + glyph + label, never colour alone [BUILD-PROMPT §2.7])

| Meaning | Tone | Glyph (FA, `aria-hidden`) | Word on screen | Source |
|---|---|---|---|---|
| Achieved, counted, approved, verified | success | `fa-circle-check` | Achieved / Counted / Verified | status-pill.ts |
| In progress, not yet (feedback only), queued | info | `fa-circle-half-stroke` | In progress / Not yet | status-pill.ts |
| Needs attention: did not meet, returned, conflict, changed since verified, shortfall | **warning (amber)** | `fa-triangle-exclamation` | Did not meet / Returned / Conflict | status-pill.ts |
| Waiting, not started, none | neutral | `fa-clock` / `fa-minus` | Waiting for review / Not started | status-pill.ts |
| Hard block (cannot save, cannot publish, destructive) | error (red) | `fa-circle-xmark` | Cannot publish: ... | DS LocalBanner `error` |

**Amber, not red, for shortfall.** WHY: Aarti dislikes red in score, rating and performance visualisation [MEMORY aarti_no_red], a student below the bar is a coaching state, not an error, and v2 already shipped "there is no red (`danger` is not used)" [status-pill.ts]. REJECTED: the reviewer-suggested danger tone for Conflict [new-components Stage 2 note]. CHECK: grep `--destructive` and `tone="danger"` in non-block contexts: zero.

**Severity visibly distinct.** A hard block (Publish disabled, "unconfigured skill cannot be submitted" [REQ IM-09]) must never share a pill or banner style with a soft warning (a rule that is "a strong rule", 12 students behind pace) [MEMORY severity_must_be_visually_distinct]. Hard block: `LocalBanner variant="error"` at the top of the action area, the disabled control states its reason beside it. Soft warning: `warning` pill or `info` banner, action still available. CHECK: put one hard block and one soft warning on the same screen, they differ in colour, icon and placement.

**Pending never reads as counted.** Waiting and awaiting-approval are overlays, shown with the neutral clock tone and the words "Waiting for X" [REQ AE-01, AE-06; BRIEF §7].
---
## 8. Typography, density, spacing, touch targets

| Item | Decision | WHY |
|---|---|---|
| Fonts | Headings `--font-heading` (ivypresto-text, serif), body `--font-sans` (Inter Variable) | DS identity [globals.css] |
| Scale | `--text-xs` 12 px minimum (`max(12px, 0.75rem)`), `--text-sm` 14, `--text-base` 16, `--text-md` 15 | Installed 1.6.5 `globals.css` sets a 12 px floor; an older memory note recorded 11 px (see section 17 conflict C-3) |
| No sub-12 px text | Visual-diff flags it; badges and avatars keep DS defaults | [MEMORY ds_typography_color_discipline; visual-diff.mjs] |
| Weight hierarchy | Page title serif; section `font-semibold`; label `font-medium`; metadata `font-normal text-muted-foreground`. `uppercase tracking-wide` at most once per screen | [design-anti-patterns "Typography"] |
| IDs and codes | `font-mono tabular-nums` for record IDs and counts in columns [exxat-mono-ids skill] | Alignment, copyability |
| Numbers in tables | Right-align, tabular | Scan |
| Density | Staff tables: 40 px controls, rows about 44 to 56 px with two-line cells allowed. Dense rows `px-3 py-2` only in the heat-grid and lab grid | Scale needs [BUILD-PROMPT §6] |
| Touch targets | At least 44 px on student and evaluator surfaces (`--control-height-touch`), 56 px in handover mode [new-components #24]; WCAG 2.5.8 minimum 24 px for staff desktop | Gloved or one-handed use on a clinical floor [INFER] |
| Avatar disc | DS `AvatarInitials size="sm"` (24 px) or larger; below that drop initials | [MEMORY avatar_initials_disc_floor] |

### 8.1 Type scale (2026-10-27)

Romit, on a Configure screenshot: "this hierarchy looks bad, with different text sizes used, too many text again", and "this is the problem I am seeing in each page that Sankalp's talking about". One scale, read from the DS, spelled out once in `admin/components/lab/type-scale.ts` (`TYPE`); nothing else in `components/lab` writes a size above `text-base`.

| Step | Use | Class (rendered at 1440) | DS source |
|---|---|---|---|
| Page title | The H1, one per page | DS `PageHeader` via `PageFrame` (`PAGE_TITLE_TYPE_CLASS`: serif, `text-lg sm:text-xl`, semibold; 20 px) | `page-header.tsx` |
| Section title | Every h2: section, card, chart (`ChartCard`), pane, wizard aside, field legend used as a heading | `TYPE.section` = `text-base font-semibold` (16 px) | `CardTitle` size, made bold |
| Group or label | h3 inside a section (`TYPE.group`, semibold) and field labels (`TYPE.label`, medium) | `text-sm` (14 px) | DS `Label` |
| Body | Rows, values, sentences | `text-sm` (14 px) | DS `Card` body |
| Helper | One line at most under a field or block | `TYPE.helper` = `text-sm text-muted-foreground` (14 px) | DS `FieldDescription` |
| Meta | Data labels in rows, charts and legends only, never a sentence | `TYPE.meta` = `text-xs text-muted-foreground` (12 px floor) | `--text-xs` |
| Figure | Every KPI and hero number, one size, sans (never the serif) | `TYPE.figure` = `text-2xl font-semibold leading-none tabular-nums` (24 px) | `KeyMetrics` md strip value |

Rules: the serif is the page title's face only; no sentence is larger than body; every section title on a page is the same size; a number and its label never mix the serif and the sans. Enforced by `admin/tests/lab/typography.test.ts` (fails on raw `text-lg` to `text-6xl` outside an icon `<i>`, on `font-heading` outside a heading, and on the rendered strings "Proposed" or "Decision pending" outside lab chrome). Measured after the sweep: the walkthrough pages render only 12, 14, 16, 20 (serif, H1) and 24 px text.

---
## 9. Iconography
- Font Awesome (Pro kit), `fa-light` default, `fa-solid` for filled states (check, selected) [exxat-fontawesome-icons skill; ds-shell-anatomy]. No Lucide.
- Decorative icons: `aria-hidden="true"`. Icon-only buttons: `aria-label`. An icon never carries meaning alone; a word is always adjacent [BUILD-PROMPT §2.7].
- **No icons on action or CTA buttons**, leading or trailing [MEMORY no_icons_action_buttons]. Icons are for status chips, nav rows, menu items and icon-only buttons.
- Subset audit before adding a new glyph (the kit is subsetted): run `fa:subset-audit` [skill].
---
## 10. Responsive stance
**Decision: web-first.** Design 1440 px, 1280 px minimum comfortable, adapt to 1024 and 375. Mobile is the same screen adapted, not a separate design [BUILD-PROMPT §2.1; BRIEF §5.5]. WHY: the build contract says so, directors and coordinators work on desktop [COMP: praise for Prism web]. **[PENDING-ROMIT] for student and evaluator surfaces** (ledger Q2): v2 is phone-first (28 rem column), the competitive research says mobile reliability is the main risk, and nurses sign on phones [COMP: 22 s to 2.7 min]. Until confirmed: build student and evaluator layouts so that the 375 px layout is complete and tested, and the 1440 layout is a deliberate two-column adaptation, so either answer is cheap [INFER].

| Element | 1440 / 1280 | 1024 | 375 |
|---|---|---|---|
| Staff shell rail | Expanded with labels (starter default) [ds-shell-anatomy §3] | Icon rail or expanded | Sheet menu; utility bar folds Search, Help into More; Notifications stays |
| Student nav | Left rail rows | Left rail | Bottom nav, 4 destinations at most, 44 px, safe-area padding [new-components #19] |
| KPI strip | 4 across | 4 across or 2x2 | 2 columns |
| Tables | Full columns | Hide tertiary columns | Table becomes cards (mobile skill card) or the DS responsive pattern; heat-grid scrolls inside its own region |
| Charts | Full | Full | Charts switch to their table version under 600 px [BUILD-PROMPT §3.3] |
| Sheets | Right side | Right side | Full width or bottom |
| Evaluator form | Centred column 820 px | Same | Single column, sticky submit |

Rules: no horizontal **page** scroll at 1440, 1280, 1024, 375 (tables and the heat-grid scroll inside their own panel) [BUILD-PROMPT §13.1]. Never override DS border or shadow for responsive; use CSS class and media query, not JS [MEMORY ds_compliance_responsive, css_class_responsive].
---
## 11. Dark mode and themes
- Support the DS light and `.dark` themes for every viz and indicator; each viz needs light and dark [BUILD-PROMPT §10].
- Use only tokens; they re-map in `.theme-prism.dark`. Dark `--muted-foreground` is derived from `--muted`; verify 4.5:1 in dark for helper text.
- The Prism brand mid step is under 3:1 on dark surfaces (DS comment in `.theme-prism.dark`); use `--brand-ink` for brand-coloured text and icons on dark.
- Do not ship a theme toggle that the profile menu does not expose; Appearance lives in the profile menu [ds-shell-anatomy §2].
- Check: run axe in light and dark on one dense screen per audience.
---
## 12. Accessibility (WCAG 2.1 AA)

| Area | Specific rule | WHY / source | Check |
|---|---|---|---|
| Focus | Visible focus on every control (`--ring`), logical order, focus moves into a Dialog or Sheet and returns to the trigger; after a route change focus goes to `main` (`id="main-content"`, `tabIndex={-1}`) | [component-consistency §1; BUILD-PROMPT §2.7] | Tab through the page |
| Skip link | Staff shell has a skip link | | |
| Contrast | Text 4.5:1, large text and non-text 3:1 (SC 1.4.11). Status chips use DS fill/fg pairs that were designed for it. `--border` alone is not a state indicator | [A11Y-020, A11Y-021] | axe `color-contrast`; freeze transitions first to avoid phantom results [MEMORY axe_phantom_midtransition] |
| Not by colour alone | Glyph + word on every state; heat-grid cells carry a value or glyph | [BUILD-PROMPT §2.7] | Grayscale screenshot still readable |
| Charts | Table version + one-sentence summary; keyboard-reachable data; `role="img"` with text alternative where decorative | [BUILD-PROMPT §10] | Keyboard through a chart |
| Forms | Error summary with links that focus the field or fieldset; `aria-describedby` for helper and error; labels visible, no placeholder-as-label | [new-components #13, #29] | Submit empty form |
| Live regions | Sync chip changes announce politely; banners use `role="status"` or `alert` by severity | [new-components #6] | Screen reader or DOM check |
| Targets | 44 px on touch surfaces (SC 2.5.5 is AAA; we adopt it for clinical use [INFER]); 24 px minimum desktop (2.5.8) | | Measure |
| Reduced motion | No animation that carries meaning; honour `prefers-reduced-motion` | | |
| Forced colors and high contrast | The DS ships `[data-contrast="high"]`, `[data-contrast="windows"]` and `@media (forced-colors: active)` blocks. Do not build state with background-only fills: add a border or glyph that survives forced colors. SVG viz use `currentColor` or system colours in forced mode | DS globals.css lines about 1454 to 1704; SC 1.4.11 | Toggle Windows high contrast or emulate `forced-colors: active` |
| Text size | The DS has `data-text-size`; layouts must not clip at larger sizes; no fixed-height text containers | [globals.css ShellLayoutProvider] | 200 percent zoom, 320 CSS px reflow |
| Names | Icon-only buttons and heat-grid cells have accessible names that include student, skill and value | [new-components #9] | |
| FERPA | Student data is role-scoped: evaluators see only what the request names; groups under n=5 are hidden in comparisons | [REQ; BRIEF §8] | Open evaluator link: no other student's data |

Hidden per-dot text on Outcomes renders 914 words; confirm it is screen-reader-only (`sr-only`), not visible [AUDIT T4 Unverified].
---
## 13. Banned patterns (from governance) and why

| Banned | Instead | WHY |
|---|---|---|
| Raw `<button>`, raw `<table>`, rebuilt DataTable, KeyMetrics, Button, Badge, Dialog | DS imports | Hooks block commits; consistency across products [CLAUDE.md] |
| Hex or rgb, raw `oklch()`, `color-mix(in oklch, ...)` | `var(--token)` | Ad-hoc colour breaks theming and dark mode [design-anti-patterns "Color"] |
| Toast for product feedback | `LocalBanner` | [CLAUDE.md] |
| `text-xs font-semibold uppercase tracking-wide` repeatedly | Once per screen at most | Claude tell #1 [design-anti-patterns] |
| `rounded-lg border bg-card px-3 py-2.5` as the default card; `bg-muted border rounded-lg p-4` info box | DS `Card`, `LocalBanner`, or plain inline text | One look for everything = no hierarchy |
| `py-20 text-center` icon + "No X yet" empty state | Content-specific empty state | [design-anti-patterns] |
| Numbered dot step circles | Underline tabs (5 or fewer) or left step list | |
| Progress bar for completion % across many entities; stacked bars | Bullet, dot-strip, heat-grid | [MEMORY progress_bars_last_resort] |
| Red for below-threshold in scores | Amber (warning tone) | [MEMORY aarti_no_red] |
| `opacity-*` on text; `--border` as state indicator | Another token; `--muted-foreground` minimum | A11Y-020, A11Y-021 |
| Brand colour on hover and active and selected at once | `--muted` hover, `--brand-tint` selected, brand only on primary CTA | [design-anti-patterns "Selection"] |
| Icons on CTA buttons | Text-only | [MEMORY no_icons_action_buttons] |
| Overriding DS Card or Button shape, adding inset shadows or glows | Compose real subcomponents | [MEMORY never_override_ds_card_button_shape, no_visual_polish] |
| "items" in UI copy; requirement IDs, ODs or stakeholder names in UI | "skills" / `{itemNoun}`; none | [LEDGER D-B; MEMORY no_internal_notes_in_ui] |
| Em dashes anywhere | Comma, colon or period | [BUILD-PROMPT §2.8] |

Grep gate before "done": `uppercase tracking-wide`, `py-20 text-center`, `color-mix(in oklch`, `<button`, `<table`, `toast`, `#[0-9a-f]{3,6}`, the character em dash [CLAUDE.md Gate 2].
---
## 14. Chrome budget (what each shell may show)

| Control | Staff | Student | Evaluator | WHY |
|---|---|---|---|---|
| Sidebar toggle, page title | yes | yes | no | Rail exists only in app shells |
| Product switcher | yes (others disabled with reason while OD-P1 is open) [ds-shell-anatomy §5] | yes | **no** | Preceptor has no product context |
| Role switcher | Profile menu "Switch view" only [ds-shell-anatomy §3] | same | **no** | One mechanism, not three [AUDIT T4] |
| Search | Only if it indexes students, skills, evaluators; otherwise remove | no | no | Audit: searches nav rows only |
| Notifications, Help | Only when functional; Notifications has no feed (REQ section 14), so remove or keep honest empty state | no | no | Rule: render a control only if it does something true [ds-shell-anatomy §5] |
| Ask Leo | Decide (Q-U4); today a "not connected" panel | no | no | Dead control |
| Demo menu (walkthrough, device toggles, reset) | Outside product chrome: a single "Start story" player bar or a docked demo panel, visibly labelled "Demo, not part of the product" | Fault toggles on the student sync page only | no | [AUDIT T4; new-components #28] |
---
## 15. Visual-review protocol (this product)
Run before any "done" claim; paste literal output. Server ports: admin 3007, student 3008 [apps CLAUDE.md]; DS reference `localhost:4000`.
1. **Pre-task declaration**: File, DS violations, hand-rolled with DS equivalent, WCAG issues from a static read [CLAUDE.md].
2. **Before JSX**: surface contract in `docs/build/contracts/` (hook-enforced); `node tools/ds/source.mjs <Component>`; `ds-adoption-reviewer` for any new component file.
3. **What to screenshot** (one batch per surface, both themes where a viz exists):

| Surface | Viewports | States |
|---|---|---|
| Admin: Home, Skills (library with 153 rows), Configure (each step), Review queue, Reports | 1440, 1280, 1024, 375 | default, empty, loading, error, blocked, dialog open |
| Student: Home, Log, Record | 375 first, then 1440 | default, offline, signed out, conflict, returned |
| Evaluator link | 375 and 820 column at 1440 | default, corrected request, expired, submitted |
| Reviewer and director record | 1440, 1024 | with 100+ rows |

   Use the Playwright scripts in `tools/visual-check/` and the v2 shots in `docs/v2/screenshots/`; view the images, do not rely on `tsc`. A hidden Chrome tab has no rAF and produces phantom bugs [MEMORY hidden_chrome_tab].
4. **DS match**: `cd /Users/romitsoley/Work && BASE_URL=http://localhost:3007 node tools/visual-check/visual-diff.mjs "/v2/admin"` (repeat per route). Exit 0 = within DS vocabulary. Colour is deliberately not diffed (Prism versus neutral DS). If `:4000` is down, say `GREENLIGHT (static)` only [CLAUDE.md Pattern L]. Also `tools/visual-check/ds-conformance.mjs` flags rendered text under 10 px.
5. **Axe**: run on default plus each open overlay; freeze transitions first; record path or "not run". Known DS-inherent findings with open product, scope and profile menus (`aria-hidden-focus`, `region`) are shared with shipped PCE [ds-shell-anatomy §7].
6. **Spawn** `ds-conformance-reviewer`, `state-review`, `verification-reviewer`; paste each literal verdict. Spawn `Explore` to grep-verify every claimed change (Pattern G).
7. **Full subtree diff, not one-element spot checks** on any visual-match task [MEMORY full_subtree_diff_not_spot_check].
8. **After a DS bump**: `rm -rf .next` before validating [MEMORY ds_upgrade_clear_next_cache].
9. **Verdict**: `GREENLIGHT (static)` or `GREENLIGHT (runtime)` plus a list of what was NOT verified. Runtime needs a fresh visual-diff DS-MATCH (30 min) [CLAUDE.md].
---
## 16. Evidence from current v2 screenshots (what this doc reacts to)

| Observation | Source | Rule it triggers |
|---|---|---|
| Preceptor Requests shows full sidebar with Clinical Education switcher and a role dropdown | `preceptor-requests.jpg` | Evaluator shell (section 3) |
| Student Home opens with a conflict banner then a conflict card, "what is left" below the fold | `student-home.jpg` | Say once; lead with what is left (section 1) |
| Reviewer queue: 4 KPI cards with empty space, tab counts repeat KPI counts, Status column clipped | `reviewer-queue.jpg` | KPI rules, table width (sections 4.2, 4.4) |
| Admin Home: plain progress bar, outline button on every row, text-heavy rows with example lists | `a3-viz-home.png` | Progress last resort; one primary; cut example lists (sections 5.1, 6.2) |
| Nav count chip in red | all shots | Q-U5 |
| Rail tinted with `--brand-tint` (Prism pink) | all shots | Correct for the rail only (section 7.1) |
---
## 17. Conflicts between sources (named, not hidden)

| # | Conflict | Resolution used here |
|---|---|---|
| C-1 | Governance says "no amber until DS defines one, use muted" [design-anti-patterns "Color"] versus VIZ-004 and Aarti say amber [MEMORY aarti_no_red]. | The DS now ships `--status-badge-warning-*` (amber), so amber via `StatusBadge tone="warning"` is DS-native. Raw amber oklch stays banned. Update the governance note (Q-U9). |
| C-2 | Build prompt: evaluator column 820 px; v1 layout 768 px. | 820 px. |
| C-3 | A 2026-06 memory note says DS `text-xs` renders 11 px and 10 px tags exist; installed 1.6.5 `globals.css` defines `--text-xs: max(12px, 0.75rem)`. | Treat 12 px as the floor (current DS source wins). Re-measure on the live catalogue (`:4000/library/typography`) before enforcing. |
| C-4 | Student phone-first (v2) versus web-first (BUILD-PROMPT). | Web-first default, PENDING-ROMIT. |
| C-5 | Chart blue on Student Home and Admin Home versus Prism pink brand. | Unresolved; see Q-U6. |
---
## 18. Open questions for Romit

| # | Question | Why it matters |
|---|---|---|
| Q-U1 | Web-first or phone-first for student and evaluator? (ledger Q2) | Decides shells, nav, how much the desktop layout is designed |
| Q-U2 | Approve the 12-row nav (admin 4, reviewer 2, director 2, preceptor 0 or 1, student 3)? (ledger D-A, Q8) | Staff shell scope |
| Q-U3 | Evaluator column 820 px (build prompt) or keep 768 px? | Minor, but consistency |
| Q-U4 | Ask Leo and Notifications in the utility bar: remove or keep as honest placeholders? (ds-shell-anatomy decision 3) | Dead controls vs DS-bar fidelity |
| Q-U5 | The DS nav count chip (`BadgeCount`) is red. Accept for work counts (not a score), or request a neutral variant from the DS team? | Aarti no-red stance applies to scores and ratings; a red chip may still read as an alarm |
| Q-U6 | State and chart colours today are saturated blue (Student Home squares, Admin Home bars). Move state viz onto a Prism-derived sequential scale, or keep blue as the neutral "progress" hue? | Brand coherence versus DS `--chart-*` tokens |
| Q-U7 | Is `FloatingSheetPanel` the sheet convention for this product (it is in other Exxat apps)? | Sheet consistency |
| Q-U8 | Rail default: expanded (starter) or icon-only (PCE)? Four rows read poorly as bare icons. | First impression |
| Q-U9 | Update governance `design-anti-patterns.md` to allow DS warning tone (amber)? | Removes C-1 |
| Q-U10 | Director "verify with unmet mandatory skills": what does the hard-block versus soft-warning treatment look like? (ledger Q3) | Severity visual |
---
## 19. Review a screen against this doc (checklist)
Mark each pass, fail or n/a with evidence.
```
SHELL
[ ] Correct shell for the audience (staff / student / evaluator no-chrome)
[ ] Evaluator page: no sidebar, no switchers, no links out, no-referrer
[ ] One role-switching mechanism; no dead controls in the bar
LAYOUT
[ ] PageFrame header: serif h1, one purpose line, at most one filled primary
[ ] KPI strip: 4 or fewer, flat or compact, no tab-count repeat, polarity set
[ ] 100+ rows: DataTable (or DS Table for a matrix), count in toolbar, no clipped status or action column
[ ] Empty, loading (skeleton), error and impossible-filter states exist and are specific
[ ] Sticky action present on long forms and mobile; banner in view after a save
COMPONENTS
[ ] Every button: explicit variant + size; no raw button; no icon on a CTA
[ ] States use StatusPill/StatusBadge with word + icon + tone; no Badge for a state
[ ] Sheet vs Dialog vs route chosen per section 5.4
[ ] LocalBanner for feedback; no toast
[ ] No hand-rolled card, table, banner or step circles
COLOUR AND TYPE
[ ] Only var(--token); grep shows no hex, no oklch(, no color-mix(in oklch
[ ] Shortfall is amber; red only on a hard block; hard block and soft warning look different
[ ] Brand only on primary CTA, rail tint and selected row (brand-tint); active filters neutral
[ ] No text under 12 px, no opacity on text, serif only for headings
VIZ
[ ] Chart answers one named question; table fallback; text summary; no default progress bar
[ ] Radar hidden under n = 5; counts not labelled as competence
RESPONSIVE
[ ] No horizontal page scroll at 1440, 1280, 1024, 375
[ ] Touch targets 44 px on student and evaluator; charts become tables under 600 px
A11Y
[ ] Visible focus, logical order, focus returns after overlays
[ ] Glyph + word for every state; grayscale readable; forced-colors emulation does not lose state
[ ] axe clean in light and dark (path or "not run")
[ ] Icon-only buttons have aria-label; decorative icons aria-hidden
COPY AND CONNECTION
[ ] Say it once; "skills" not "items"; no IDs, ODs or names; no em dashes
[ ] Every student, skill, evaluator, site and count that names a record is a link carrying context
[ ] The screen says what the previous role did and what the next role will see
EVIDENCE
[ ] visual-diff.mjs DS-MATCH pasted (or GREENLIGHT (static) with the not-verified list)
[ ] ds-conformance-reviewer, state-review, verification-reviewer verdicts pasted
```
