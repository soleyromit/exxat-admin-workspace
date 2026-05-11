# Card — Depth audit (2026-05-11)

## Library reality
- Slots: `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardAction`, `CardContent`, `CardFooter`
- Variants: default size, `size="sm"` (gap-3 / py-3 / px-3)
- Library demo: http://localhost:4000/library/card
- Source: `exxat-ds/packages/ui/src/components/ui/card.tsx` (137 lines) — owns its own vertical rhythm (py-4, gap-4); doc-block at top forbids overrides (`pb-X`, `h-full`, `flex-1` on CardContent, etc.)
- Card chrome: `rounded-xl bg-card ring-1 ring-foreground/10 overflow-hidden` — note `ring-1`, not `border` (imposter divs use `border`, which is already a visual giveaway)

## Adoption snapshot
| Workspace | Files importing Card | Files using slots | Hand-roll count (imposters + substitutes) |
|---|---|---|---|
| PCE admin | 2 | 2 (`analytics/page.tsx`, `pce-modals.tsx`) | 4 imposters + 3 substitutes (FolderCard, EntityCard, AiInsightCard) |
| PCE student | 0 | 0 | 2 imposters + 1 substitute (SurveyCard) |
| exam-mgmt admin | 10 | 7 | 22 imposters + ~6 substitutes |

> Audit cross-check: `python3 scripts/ds-adoption-audit.py` → 22 exam-mgmt imposters, 4 PCE-admin imposters, 2 PCE-student imposters, 1 PCE-student eyebrow-paragraph. Zero `card-bare-container` blocks workspace-wide.

## Where Card is used well (reference patterns)

- `apps/pce/admin/app/(app)/analytics/page.tsx:111-140` — **KpiButton** composes `Card size="sm"` → `CardHeader` (eyebrow `CardDescription` + tabular `CardTitle`) → `CardContent` (meta + chevron). This is the canonical KPI tile. **PCE's FolderCard / EntityCard / SurveyCard / TypeTile / KpiTile should mirror this.**
- `apps/pce/admin/components/pce/pce-modals.tsx:460-502` — share-with-faculty sheet uses `Card size="sm"` with eyebrow `CardDescription` (`uppercase tracking-wide`) → `CardTitle` → `CardContent` (gauge + section averages). Fix from the recent ds-adoption pass.
- `apps/pce/admin/app/(app)/analytics/page.tsx:641-687` — at-risk panel uses `CardHeader className="border-b border-border"` legitimately (the `[.border-b]:pb-4` selector in card.tsx is designed for this divider pattern). Good model for "header + scrollable list" composition.
- `apps/exam-management/admin/app/(app)/assessments/[id]/assessment-landing-client.tsx:186-` (Lifecycle, Details) and `analytics-client.tsx:383, 399, 428, 799, 823, 864` — five consistent `CardHeader` → `CardTitle font-heading text-base font-semibold` → `CardContent` blocks. **PCE should copy this heading convention.**
- `apps/exam-management/admin/app/(app)/courses/[id]/tabs/overview-tab.tsx:155-207` — two stacked Cards with proper slots; good "what does a tab body look like" exemplar.

## Card-imposter divs (caught by audit)

### PCE admin (4)
- `apps/pce/admin/app/(app)/surveys/[id]/page.tsx:94` — **Overview panel** (`border border-border rounded-lg p-5`) wrapping ResponseGauge + deadline + template + action buttons. Maps directly to `Card` → `CardHeader>CardTitle="Overview"` → `CardContent` (3-col grid) → `Separator` → trailing actions belong in `CardFooter` (border-t + bg-muted/50 is built-in). **Migrate.**
- `apps/pce/admin/app/(app)/surveys/[id]/responses/page.tsx:83` — **Overall summary panel** with response gauge + per-section averages. Same shape as Overview: `Card` → `CardHeader>CardTitle="Overall"` + `CardAction` (the gauge fits the `col-start-2` action slot cleanly) → `CardContent` (flex row of section avgs). **Migrate.**
- `apps/pce/admin/app/(app)/surveys/[id]/responses/page.tsx:106` — **Moderation info note** (`rounded-lg border px-4 py-3` with muted bg + circle-info icon). Not Card-shaped — this is a `Banner` / `Tip`, not a Card. **Use DS `Banner` instead.**
- `apps/pce/admin/components/pce/pce-modals.tsx:71` — **Sections checklist** inside the New Template sheet (`rounded-lg border border-border p-3`). Functions as a grouping container for `Checkbox` rows. Marginal — could become `Card size="sm"` with `CardContent` only, but it lives inside a Sheet body where DS Card may visually compete with sheet chrome. **Leave as div; document as form-fieldset pattern.** Alternatively introduce a `Fieldset` wrapper if the pattern recurs.

### PCE student (2)
- `apps/pce/student/app/surveys/page.tsx:127` — **SurveyCard list item** (Card-substitute, see §Substitutes below). Imposter regex catches the outer div.
- `apps/pce/student/app/surveys/[id]/submitted/page.tsx:68` — **"What happens next" info panel** (`rounded-xl border px-5 py-4`) with eyebrow paragraph + 3 icon-row items. **Migrate to `Card`** → `CardHeader>CardDescription` (the audit's `eyebrow-paragraph-outside-card` rule fires on line 72 for the same reason) → `CardContent` (icon rows). Note PCE student imports go through `@exxat/student/components/ui/card` — verify the Student DS Card has equivalent slots before committing the migration.

### exam-mgmt admin (22)
Three categories explain all 22 hits:

1. **Empty-state / zero-data panels** (8 of 22): `qb-table.tsx:1072, 1227, 1383`, `add-accommodation-modal.tsx:194, 331`, `assessment-builder-client.tsx:1067`, `assessment-landing-client.tsx:501` (QuickLink disabled), `live-monitor-client.tsx:99` (unauthorized state). Pattern: `rounded-xl border border-border bg-muted/40 p-4` with icon-square + headline + description. These should standardize on `Card size="sm"` with `CardHeader>CardTitle` + `CardDescription` + `CardContent` of steps — OR be promoted to a shared `EmptyState` / `ZeroDataPanel` molecule (recommend the latter, since the pattern repeats verbatim 4× inside qb-table alone).

2. **Status / preview tiles** (9 of 22): `accommodations-tab.tsx:146` (TypeTile), `competency/competency-client.tsx:157` (Weakest-area callout), `curricular-loop-diagram.tsx:231` (Untested strip), `access/page.tsx:204` (RoleLegend), `app-sidebar.tsx:121` (Faculty mode chip), `question-scatter-plot.tsx:82` (chart container) and `:241` (hover tooltip), `question-editor/question-editor.tsx:795` (Student-facing preview), `assessment-review-client.tsx:219` (Existing chair notes). These are mixed: chart wrappers (`question-scatter-plot.tsx:82`) are legitimate Card candidates; tooltips and sidebar chips are NOT (they're floating UI / sidebar internals). **Audit per file before bulk migration.**

3. **Modal info strips with custom semantics** (5 of 22): `create-assessment-modal.tsx:139, 368`, `assign-practice-dialog.tsx:226`, `assessment-landing-client.tsx:378` (Previous reviewer note), `analytics-client.tsx:889` (Curve applied state). These carry colored tinted backgrounds (`brand-color 5%`, `chart-4 6%`, `chart-2/10`) and left-border accents — they're closer to `Banner` than `Card`. **Use DS `Banner` with `tone` prop**, not Card.

## Bare-Card-with-divs (caught by audit)
- Zero blocks workspace-wide. Every file importing `Card` from DS also uses at least one slot. (Slot adoption among Card users is solid; the gap is in NOT-importing-Card.)

## Card-substitute hand-rolls (not regex-caught)

These are named components that internally build Card-shaped chrome from raw divs. The audit's `card-imposter-div` rule only catches the inner `rounded + border + p-X` line — it cannot see that the surrounding function IS a Card.

- `apps/pce/admin/components/pce/ai-insight-card.tsx:37-75` — **AiInsightCard**. `<section role="region" class="rounded-lg border border-border p-4 bg-background">` with eyebrow + body + source caption + actions. **Listed in `DOCUMENTED_HAND_ROLLS` (scripts/ds-adoption-audit.py:83) → do not migrate.** Rationale per the file header: Card + AI affordance + source citation isn't covered by either DS Card or Banner alone. Leave as-is. But consider whether the inner chrome should switch from `border` to `ring-1 ring-foreground/10` to match real DS Card visually.

- `apps/pce/admin/app/(app)/page.tsx:36-91` — **FolderCard**. `<article class="rounded-lg border border-border bg-background p-5">` with icon-square + hover/focus states + title + description + metric. **NOT in DOCUMENTED_HAND_ROLLS.** This is a textbook Card substitute. Should be: `Card` (default size) → `CardHeader>CardTitle + CardDescription` + `CardAction` (the icon-square OR the arrow chevron) → `CardContent` for metric. The hover-bg + focus-ring belongs on `<Link>` wrapping the Card, not on the article.

- `apps/pce/admin/app/(app)/admin/page.tsx:76-128` — **EntityCard**. Same shape as FolderCard, smaller padding (p-4) — i.e., this is `Card size="sm"`. **NOT in DOCUMENTED_HAND_ROLLS.** Migrate to `Card size="sm"` slot composition.

- `apps/pce/student/app/surveys/page.tsx:121` — **SurveyCard**. `rounded-xl border` row-style card with conditional brand-tinted bg for open state. Lives in Student DS, so the substitute should target `@exxat/student/components/ui/card` (verify the Student Card supports a `size` or tone variant — if not, this is a legitimate student-product wrapper).

- `apps/exam-management/admin/components/faculty-ui-kit.tsx:60-200` — **KpiTile + KpiCard**. `KpiCard` (line 195) DOES wrap DS Card but adds `px-0 py-0 border-border` (overriding the doc-block-forbidden card padding), then nests `CardContent className="px-4 py-3.5"`. This violates the spacing-system contract in `card.tsx` lines 9-15. `KpiTile` (line 60) is a separate raw-div KPI variant. **Refactor `KpiCard` to drop the `px-0 py-0` overrides and let Card own its rhythm; merge or distinguish `KpiTile` vs `KpiCard` clearly.**

- `apps/exam-management/admin/app/(app)/courses/[id]/tabs/accommodations-tab.tsx:143 TypeTile`, `students-tab.tsx:165 RosterTile`, `courses-client.tsx:361 CourseCard`, `assessments-tab.tsx:277 AssessmentCard`, `competency/competency-client.tsx:99 CourseCompetencyCard`, `question-bank/qb-table.tsx:676 QBFilterCard`, `components/curricular-loop-diagram.tsx:36 MatrixHoverCard`, `components/ai-generate-modal.tsx:368 DraftQuestionCard`, `components/question-editor/question-editor.tsx:1021 MetadataPanel`, `:1151 WorkflowPanel`, `:1207 ValidationPanel`, `:1239 AiSuggestionCard`, `components/app-sidebar.tsx:65 InstitutionCard` — substitute components named like Cards. **Worth a per-component audit in a follow-on session** — characterize each as (a) Card slot composition candidate, (b) Banner candidate, or (c) genuinely not-Card-shaped.

## Migration cost
| Category | Files | Effort | Priority |
|---|---|---|---|
| PCE admin imposters → Card slots | 3 (skip pce-modals.tsx:71) | ~1.5h | **high** — small surface, two of three are Overview panels users see immediately |
| PCE admin Card substitutes (FolderCard, EntityCard) → Card slots | 2 | ~1h | **high** — these are the entry-page tiles; visual drift cost is high |
| PCE student imposters + SurveyCard | 3 | ~1.5h | **med** — gated by verifying Student DS Card slot parity |
| AiInsightCard internal-chrome alignment (border → ring) | 1 | ~15min | **low** — purely visual; substitute is sanctioned |
| exam-mgmt empty-state pattern → shared `EmptyState` molecule | 8 sites | ~3h (build molecule + migrate) | **med** — single shared component pays off |
| exam-mgmt modal info-strips → DS Banner | 5 | ~1.5h | **med** — wrong primitive (Banner, not Card) |
| exam-mgmt status/preview tiles audit | 9 | ~2h (audit) + N for migration | **low** — needs case-by-case judgment |
| exam-mgmt named substitutes (KpiCard fix + 12 others) | 13 | ~4h | **low** (separate product session per the brief) |
| Bare Cards | 0 | — | — |

## What audit can't see
- **Spacing-contract violations**: `KpiCard` overriding Card's `py-4` with `px-0 py-0` (faculty-ui-kit.tsx:197). The doc-block in `card.tsx:9-15` calls this out as banned, but the regex can't detect className overrides.
- **`border` vs `ring-1` mismatch**: DS Card uses `ring-1 ring-foreground/10`; every imposter uses `border border-border`. Visually similar at 1px, but borders affect layout (they reserve space) while rings don't. Imposters will misalign on dense grids when compared to real Cards.
- **Wrong primitive choice**: 5 exam-mgmt imposters are Banner candidates (colored tinted bg + left border), not Card candidates. The audit can't tell the difference; the regex sees `rounded + border + p-X` and flags both.
- **Card-as-row vs Card-as-tile**: SurveyCard at line 127 is a horizontal row; FolderCard is a vertical tile. Both could use Card, but only the tile gets the headed-tile visual pattern. Audit treats them identically.
- **Slot ordering**: Audit verifies slot presence, not order. CardDescription can render before or after CardTitle visually because of CSS grid, but conventional reading order matters for screen readers (`aria-describedby` patterns assume Title precedes Description).

## Recommended next 3 fixes
1. **PCE module home tiles** — Migrate `FolderCard` (`apps/pce/admin/app/(app)/page.tsx:36`) and `EntityCard` (`apps/pce/admin/app/(app)/admin/page.tsx:76`) to `Card` / `Card size="sm"` slot composition. Use `CardAction` for the chevron icon (it gets the right grid-position via `col-start-2 row-span-2`). Move hover/focus to the wrapping `<Link>`. **Impact:** every user lands on these tiles; switching brings them into the same visual family as the analytics KpiButton at line 111.
2. **PCE surveys/[id] Overview + responses Overall** — Migrate `surveys/[id]/page.tsx:94` and `surveys/[id]/responses/page.tsx:83` to Card slot composition with `CardHeader>CardTitle` + `CardAction` (gauge) + `CardContent` + `CardFooter` (action buttons). **Impact:** aligns the two highest-traffic survey detail surfaces with the just-fixed share-with-faculty sheet (`pce-modals.tsx:460`).
3. **Fix `KpiCard` spacing violation** — `apps/exam-management/admin/components/faculty-ui-kit.tsx:195-201`. Drop `px-0 py-0` from the `Card` wrapper and let Card own its rhythm; remove the `px-4 py-3.5` from `CardContent`. **Impact:** small but eliminates the only documented spacing-contract violation in the workspace, restores the doc-block invariants from `card.tsx`.
