# Component Depth Audits

> Same-shape, file-cited audits per DS component, modeled on the DataTable
> analysis Romit got 2026-05-11. Each report covers: library reality, current
> adoption (with file:line citations), bug-class diagnosis, migration paths
> with effort estimates, what the audit can't see.
>
> These are diagnostic deliverables — they prescribe action but don't perform
> it. Use them to prioritize migration sessions.
>
> Maintained by: `ds-adoption-reviewer` subagent + parent (Claude Code).
> Last updated: 2026-05-11.

## Read order (by impact for active PCE build)

| # | Component | Bug class | Workspace state | Read first if you're about to … |
|---|---|---|---|---|
| 1 | [DataTable](../../ds-adoption.md#datatable) (in registry) | Hand-rolled subset → vendored canonical | PCE clean. exam-mgmt has 1 hand-roll grandfathered. | …add a list page or migrate exam-mgmt's data-table.tsx |
| 2 | [Card](card.md) | 28 Card-imposter divs + 3 named substitutes (FolderCard, EntityCard, KpiCard) | PCE: 3 imposters fixed, 1 substitute pending. exam-mgmt: 22 imposters + 13 substitutes. | …touch any page that uses bordered content panels |
| 3 | [KeyMetrics](key-metrics.md) | 5 concurrent hand-rolls (KpiButton, key-metrics.tsx, KpiTile, dead KpiCard, StatCard) | Zero canonical adoption workspace-wide. PCE KpiButton at analytics/page.tsx:95-152. | …build any dashboard with KPIs |
| 4 | [Chart / Viz](chart.md) | Zero ChartContainer adoption, but mostly justified (bespoke viz) | 1 genuine migration miss (exam-mgmt QuestionScatterPlot). 3 new DOCUMENTED_HAND_ROLLS added. | …build any visualization (default to bespoke unless 2D Cartesian) |
| 5 | [Tabs](tabs.md) | PCE 0 / exam-mgmt 4. Clear gap for survey-detail + entity-detail pages. | exam-mgmt has the proven `variant="line"` pattern. PCE could merge 2 routes via tabs. | …design any detail page with multiple panels |
| 6 | [CoachMark + Command](coach-mark-and-command.md) (in flight) | Both zero adoption — first-time onboarding + ⌘K palette unbuilt | TBD — agent running | …think about first-time UX or power-user navigation |
| 7 | [Dialog + Banner + Badge](dialog-banner-badge.md) (in flight) | Shallow use — Dialog without validation, Badge always secondary, Banner usage incomplete | TBD — agent running | …build any modal form, status messaging, or pill |

## Skipped (lower priority for active PCE build)

- **Sheet** — covered in earlier conversation (Path A discussion 2026-05-11). PCE uses Sheet correctly in pce-modals.tsx; share-with-faculty fix shipped 2026-05-11.
- **Calendar / DatePickerField** — zero PCE adoption today, no date-picker UX in scope. Audit when first date picker is needed.
- **ExportDrawer** — zero adoption. Audit when first export feature is planned.
- **TablePropertiesDrawer** — wired-via-toolbarSlot pattern. Audit when first PCE page wants column-visibility UI.
- **Kbd / Tip / ViewSegmentedControl** — atoms with thin API surface; adoption gap is low-impact.
- **Sidebar** — already correctly adopted at app-shell layer.
- **Input / InputGroup / Field** — atoms used correctly; no Form-pattern gap large enough yet (Form gap may surface from Dialog audit).

## How to use these audits

1. **Before opening a new feature page**, scan the table above for components your feature will likely touch. Read those reports first — they list reference patterns to copy and traps to avoid.

2. **Before promoting the DS-adoption audit** (`scripts/ds-adoption-audit.py`) from phase-1 to phase-2 strict, work the recommended migrations out of these reports. The audit will then enforce on the cleaned baseline.

3. **When a new bug class surfaces** (something the audit + these depth reports missed), update `docs/governance/blind-spots.md` row #12 with the gap class, then either: refine an audit rule (regex) or commission a new depth audit.

## Audit-can't-see gaps (collected across reports)

- **Visual hierarchy + whitespace density** — needs Playwright + screenshot diff.
- **Semantic data conflicts** (e.g., gauge showing 22/30 while label says "No responses") — needs runtime asserts or visual review. Caught by Romit on 2026-05-11 (NURS 210 ReleaseSheet).
- **Color-token misuse** (e.g., exam-mgmt's key-metrics using `text-primary` for trends, wrong on Lavender brand) — partial regex coverage at best.
- **Whether component choice matches user mental model** — needs usability check (e.g., Tabs vs Toggle vs Select rule of thumb is in tabs.md but enforcement is judgment).
- **Performance trade-offs** for bespoke viz (e.g., 20 ResponsiveContainers per matrix row would regress; can't measure from source).

Tracked as blind-spot #12.

## Files in this directory

```
docs/governance/component-depth-audits/
├── INDEX.md                       (this file)
├── card.md                        ✅ 28 imposter divs + 3 named substitutes
├── key-metrics.md                 ✅ 5 concurrent hand-rolls, dead KpiCard found
├── chart.md                       ✅ viz mostly bespoke; QuestionScatterPlot is 1 migration miss
├── tabs.md                        ✅ survey-detail merge is HIGH priority
├── sheet.md                       ✅ retroactive from share-with-faculty fix
├── coach-mark-and-command.md      ✅ products reject tours; Command has Vishaka backing
├── dialog-banner-badge.md         ✅ 0 aria-invalid across 26 dialogs; 0 destructive badges
├── forms-input.md                 ✅ 0% validation; Field adoption higher than expected
├── actions-overlays.md            ✅ Button used well; Tip has 36 collapse candidates in exam-mgmt
├── display-navigation-atoms.md    ✅ 1 P1 ViewSegmentedControl target; Sidebar grade A
└── organisms-templates.md         ✅ RowActions extraction is the highest micro-win
```

All 30 DS components covered.

## Cross-cutting findings (synthesis)

Patterns that surfaced across multiple audits — worth tracking as workspace-wide initiatives:

| Theme | Where | Owed |
|---|---|---|
| **Validation completely unwired** | Dialog, Forms, Badge audits all flag it | 0 of 26 dialogs have `aria-invalid` / `FieldError`. PCE entity Add dialogs are the entry point. |
| **Color tokens used wrong despite right import** | KeyMetrics (`text-primary` for trends), Badge (`destructive` never used), Banner | Audit can't catch right-token-wrong-context. Needs visual review. |
| **Sister product has the proven pattern, other product reinvents** | DropdownMenu (PCE has 11/11 locked, exam-mgmt shallow), Tabs (exam-mgmt 4, PCE 0), KeyMetrics (both have parallel hand-rolls) | Cross-product knowledge transfer is the gap. |
| **DS exports a component but it's not in `/library` catalog** | DatePickerField (in `index.ts`, not in catalog) | Discoverability gap. Update `Admin/apps/web/lib/library-catalog.ts`. |
| **Vendoring + extraction candidates for shared use** | RowActions, TablePropertiesDrawer, ExportDrawer, ListHubStatusBadge (organisms audit), MicroTrend (chart audit) | Workspace-level extraction reduces duplicated hand-rolls. |
| **Single hand-rolled file mirrors DS organism name** | exam-mgmt `data-table.tsx`, `key-metrics.tsx` (grandfathered) | Tracked in registry. Migration sessions queued. |

## Top 10 actions across all audits (ranked by leverage / effort)

1. **Extract `RowActions<TData>` from data-list-table-cells canonical** — 30 min, saves 90 lines across 6 PCE pages. Organisms audit.
2. **Migrate `courses-client.tsx:204` to ViewSegmentedControl** — 30 min, 34 → 7 LoC. Display-nav audit.
3. **Delete dead `KpiCard` in `faculty-ui-kit.tsx:195-219`** — 5 min, 25 lines dead code. KeyMetrics audit.
4. **Rework `SurveyStatusBadge` to use variant semantics** — 1 h, replaces inline-style overrides. Dialog-banner-badge audit.
5. **Wire `Field` + `FieldError` into 8 PCE Add dialogs** — 4 h, validation patterns finally land. Forms audit.
6. **Convert 4 inline strips to `<LocalBanner>`** — 1 h, includes my own miss at `responses/page.tsx:109`. Dialog-banner-badge audit.
7. **Vendor canonical KeyMetrics into PCE, replace KpiButton** — 5-6 h, cross-product KPI consistency. KeyMetrics audit.
8. **Replace `FolderCard` + `EntityCard` with Card slot composition** — 2-3 h. Card audit.
9. **Merge `surveys/[id]` + `responses` routes into one tabbed route** — 3 h. Tabs audit.
10. **Build PCE admin ⌘K palette using DS `CommandDialog`** — 6-8 h, mock data already shaped. Command audit.

The 3 pattern docs (`pattern-reference`, `pattern-banners`, `pattern-form-layouts`) are reference pages, not components — not audited here.
