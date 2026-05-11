# Tabs — Depth audit (2026-05-11)

## Library reality

- **Exports:** `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`, `tabsListVariants`
- **Primitive:** Radix Tabs — keyboard nav, roving tabindex, `aria-orientation` inherited
- **Variants (TabsList):** `default` (pills on `--brand-color/12` tint, `rounded-lg p-[3px] h-8`) · `line` (underline via `after:` pseudo on active trigger; transparent track)
- **Orientation:** `horizontal` / `vertical` — `TabsList` switches to column via `group-data-vertical/tabs:flex-col`, underline moves to right edge
- **Trigger:** `flex-1 h-[calc(100%-1px)]` — equal width by default; use `TabsList className="gap-0"` to drop the 4-px line-variant gap (exam-mgmt does this in 2/4 usages). No first-class badge slot — count chips inlined as plain spans
- **Source:** `/Users/romitsoley/Work/exxat-ds/packages/ui/src/components/ui/tabs.tsx` (90 lines)
- **Library demo:** `PrimitiveTabsPreview` at `/Users/romitsoley/Work/Admin/apps/web/components/component-catalog/component-preview.tsx:461-505` — shows default pills, `variant="line"`, vertical

## Adoption snapshot

| Workspace | Files importing Tabs | Variant breakdown |
|---|---|---|
| PCE admin | 0 | n/a |
| PCE student | 0 | n/a |
| exam-mgmt admin | 4 | 4× `variant="line"` · 0× default · 0× vertical |
| exam-mgmt student | 0 | n/a |

Single shape in production: `variant="line"`. Default pills and vertical are demo-only.

## exam-mgmt: reference patterns

### 1. Settings — top-level destination switcher
`apps/exam-management/admin/app/(app)/settings/page.tsx:92-308` — `defaultValue="communication"` · `TabsList variant="line"` · 4 triggers: Communication / Assessment defaults / Question bank / Branding. Icon-prefixed labels (`fa-light` + `me-1.5`), uncontrolled, panels are siblings inside page main. *Why Tabs:* four independent settings surfaces, no deep-link need.

### 2. Course detail — entity sub-views
`apps/exam-management/admin/app/(app)/courses/[id]/course-detail-client.tsx:177-248` — controlled (`value={activeTab}`) · `variant="line" className="gap-0"` · 4 triggers: Assessments / Students / Accommodations / Mapping, each with `fa-light` icon and a muted count chip (`<span className="text-muted-foreground text-xs font-normal">{n}</span>`). Wraps `PageHeader` and a `flex-1 overflow-auto p-6` content region. **Canonical entity-detail shell.**

### 3. Assessment analytics — analysis-mode switcher
`apps/exam-management/admin/app/(app)/assessments/[id]/analytics/analytics-client.tsx:159-209` — 4 triggers Overview / Per-question / Curving / Content-areas. "Per-question" carries an attention badge (red chip) when `negativeDiscCount > 0` — precedent for surfacing counts inside a trigger.

### 4. Curricular loop diagram — viz-mode switcher
`apps/exam-management/admin/components/curricular-loop-diagram.tsx:189-227` — uncontrolled · 3 triggers Performance / Coverage / Trend, swapping viz against shared data. An "untested strip" sits outside `TabsContent` — useful pattern when one detail is invariant across tabs.

**Consensus:** always `variant="line"`. PCE should mirror this default.

## PCE: where Tabs would fit

### `apps/pce/admin/app/(app)/surveys/[id]/page.tsx` — survey detail (HIGH)
- **Current:** `surveys/[id]/page.tsx:73-218` — single scrolling `max-w-2xl` column; 4 stacked card sections (AI insight, Overview, Sections, Instructors). Responses live at a *separate route* `surveys/[id]/responses/page.tsx`, reachable only via a breadcrumb link.
- **Proposed:** `Tabs variant="line"` in the same `<main>` — **Overview** · **Responses** (collapse `/responses/page.tsx` into a `TabsContent`) · **Instructors** (lift from card) · **Settings/Sharing** (close, share-with-faculty, reminders — currently inline buttons).
- **Lines saved:** ~30 (eliminates duplicate header/breadcrumbs on `/responses`); one fewer route.
- **UX win:** Responses discoverable without a route hop; keyboard nav free; mirrors exam-mgmt pattern #2.
- **Priority:** **high**.

### `apps/pce/admin/app/(app)/templates/[id]/page.tsx` — template detail (MED)
- **Current:** `templates/[id]/page.tsx:73-147` — meta block + flat `template.sections.map` (3 sections × 3-5 questions each → ~15-item scroll).
- **Proposed:** `Tabs variant="line"` where each `TemplateSection` is a trigger; question-count chip per trigger (precedent: exam-mgmt analytics #3). Meta block stays above.
- **Lines saved:** ~10.
- **UX win:** one section visible at a time; faculty land on the section they care about faster.
- **Priority:** **med** — depends on how long real templates get; today's mock keeps it borderline.

### `apps/pce/admin/app/(app)/surveys/[id]/responses/page.tsx` (HIGH — but as part of the survey-detail merge)
Folded into the survey-detail recommendation above. Its `sectionScores.map` (line 126) is correct as cards *inside* a Responses tab — don't nest tabs inside tabs.

### Forward-looking — `apps/pce/admin/app/(app)/admin/<entity>/[id]/` (NOT YET BUILT)
PCE admin entity pages (`admin/courses`, `admin/faculty`, etc.) are list-only — no `[id]` siblings exist (`admin/courses/page.tsx` is the only file). When detail routes ship, they should adopt the exam-mgmt course-detail shell. Codify before the first admin detail page lands.

## PCE: where ToggleGroup is the RIGHT choice (do NOT migrate)

- `analytics/page.tsx:432-441` — Term ↔ Cohort axis. **Mode filter** that re-scopes *every* panel; lives in page chrome. Tabs would break the toolbar grouping. **Keep.**
- `analytics/page.tsx:504-513` — All/Didactic/Clinical course-type filter. Filters the data set inside the axis, doesn't switch panels. **Keep.**

**Rule of thumb:** if the control changes *which data flows through every panel* → ToggleGroup. If it changes *which panel you're looking at* → Tabs.

## PCE: where Select is the right choice (do NOT migrate to Tabs)

- `analytics/page.tsx:444-461` — Term/cohort selectors (6+ options) inside header. Tabs would overflow. **Keep.**
- All `Select` inside `components/pce/pce-modals.tsx` (lines 101, 223, 237, 251, 274, 333) — form inputs, not navigation. **Keep.**

**Rule of thumb:** ≤5 panel-switching options → Tabs `variant="line"`. Otherwise Select.

## PCE: where Tabs would be WRONG

- `analytics/page.tsx` overall — single dashboard answering one question per scope. AI insight → KPI tiles → By Course is meant to be *seen together* (Aarti D14: AI before metrics, all visible at once). Drill-down is route-level, not tab-level. **No tabs.** If a "By Section" panel ships later, tabs between `By Course` (line 697) and `By Section` would be justified.

## Adoption plan

| Page | Current | Migrate to | Effort |
|---|---|---|---|
| `surveys/[id]/page.tsx` + `responses/page.tsx` | Two routes, stacked cards | One route, 4 `variant="line"` tabs | ~3 h (refactor, route merge, header de-dup) |
| `templates/[id]/page.tsx` | Flat section map | `variant="line"` per `TemplateSection` + count chips | ~1 h |
| `admin/<entity>/[id]/` (future) | does not exist | scaffold with `variant="line"` from day one | included in detail build |
| `analytics/page.tsx` | ToggleGroup + Select + scroll | no change | 0 |

## What this audit can't see

- Whether "Settings/Sharing" on survey detail is distinct enough from Overview to earn its own tab, or whether close/share should stay inline (needs Aarti call)
- Whether collapsing `/responses` into a tab breaks any email deep-link flow (faculty email reminders may link directly to `/responses`)
- A11y: trigger labels are short and distinct in all candidates, but activation shifts focus — survey detail Responses is data-heavy and should be tested with NVDA/VoiceOver
- Whether `variant="line"` reads correctly inside survey-detail's `max-w-2xl` column (narrower than exam-mgmt's full-width course-detail) — underline may feel cramped next to count chips

## Recommended next 2 fixes

1. **Merge `surveys/[id]/responses` into `surveys/[id]` as a `variant="line"` Tabs view.** Highest user impact: removes a route hop, makes responses visible from the landing surface, aligns with exam-mgmt's proven course-detail shell. Ship first; it establishes the variant="line" + count-chip pattern PCE will need everywhere.

2. **Write `docs/patterns/admin/entity-detail.md` codifying `PageHeader + Tabs variant="line"`** before PCE admin's first `[id]` detail route ships. Reference `course-detail-client.tsx:170-248`. Without it, the first PCE admin detail page will reinvent the layout — and that reinvention will get copy-pasted across 11 admin entities.
