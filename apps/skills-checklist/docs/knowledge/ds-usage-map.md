# DS Usage Map — Skills Checklist v2

**Product:** Skills Checklist (Prism Skills Tracking)
**DS package:** `@exxatdesignux/ui` v1.6.5 (908 exports)
**Generated:** 2026-10-26 by ds-adoption-reviewer
**Source:** `node tools/ds/source.mjs` + dist/components directory scan + sister-product grep

> Decision anchor: check THIS file before importing or building any component.
> Then verify with `node tools/ds/source.mjs <Component>` for the latest prop API.

---

## 1. Surfaces Reference

| Surface | Route | Key data shown |
|---|---|---|
| **Admin Home** | `/v2/admin` | KPI strip, setup meters, weakest skills, attention rows |
| **Starter Library** | `/v2/admin/starter-library` | Library selection + file import tabs |
| **Configure Wizard** | `/v2/admin/configure-skill` | 7-step skill configuration |
| **Course Mapping** | `/v2/admin/map-courses` | Skill to course assignment |
| **Review Queue** | `/v2/reviewer/review-queue` | Awaiting / Stalled / Returned tabs |
| **Review Item** | `/v2/reviewer/review-queue/[id]` | Submission detail, decision form |
| **Outcomes / Remediation** | `/v2/reviewer/outcomes` | Remediation plan steps |
| **Director Verification** | `/v2/director/verification` | Student verification list |
| **Director Verify Record** | `/v2/director/verification/[id]` | Single-student record + approval |
| **Reports / Attainment** | `/v2/admin/reports` | Cohort heatmap, pace charts, evidence ledger |
| **Student Home** | `/v2/student` | Course skills, mandatory progress |
| **Log Flow** | `/v2/student/log-flow` | Skill picker, self-rating, signoff method |
| **Request Signoff** | `/v2/student/request-signoff` | Method selection, preceptor form, QR |
| **Record** | `/v2/student/verified-record` | Immutable achievement record |
| **Evaluator Form** | `/e/[token]` | Token-gated form, no app chrome |
| **Lab Grid** | `/v2/admin/lab-batch-grid` | Student x skill data-entry matrix |

---

## 2. Component Map

### Shell and Navigation

| DS component | Import path | Key props/variants | Used for (surface) | Used in v2? | Gap |
|---|---|---|---|---|---|
| `SidebarShell` | `@exxatdesignux/ui/components/shell` | `defaultOpen`, `wrapperClassName` | All shell pages | YES — v2-shell-frame.tsx:24 | None |
| `AppSidebar` | `@exxatdesignux/ui/components/shell` | `variant="sidebar"` | All shell pages | YES — v2-shell-frame.tsx:28 | None |
| `SidebarInset` | `@exxatdesignux/ui/components/ui/sidebar` | `aria-label="Main content"` | Content wrapper | YES — v2-shell-frame.tsx:29 | None |
| `Breadcrumb` + parts | `@exxatdesignux/ui/components/ui/breadcrumb` | `BreadcrumbList`, `BreadcrumbItem`, `BreadcrumbLink`, `BreadcrumbPage`, `BreadcrumbSeparator` | Utility bar page path | YES — v2-utility-bar.tsx:104 | None |
| `PageHeader` | `@exxatdesignux/ui/components/ui/page-header` | `title`, `subtitle`, `actionItems: PageHeaderActionItem[]` | Every page h1 | YES — via PageFrame in page-header.tsx:48 | None |
| `CommandDialog` | `@exxatdesignux/ui/components/ui/command` | `open`, `onOpenChange`, `title`, `description` | Command-K palette | YES — v2-command-menu.tsx:34 | None |
| `LeoAmbienceProvider` | `@exxatdesignux/ui/components/ui/leo-ambience-context` | Shell Leo context | Shell Leo context | YES — v2-shell-frame.tsx:22 | None |

### Atoms

| DS component | Import path | Key props/variants | Used for (surface) | Used in v2? | Gap |
|---|---|---|---|---|---|
| `Button` | `@exxatdesignux/ui/components/ui/button` | variants: `default`, `outline`, `ghost`, `destructive`, `link`; sizes: `xs`, `sm`, `default`, `lg`, `icon` | All surfaces | YES — 50+ uses; all explicit variant+size | None |
| `Badge` | `@exxatdesignux/ui/components/ui/badge` | `default`, `secondary`, `outline` | Wizard hint badges | YES — wizard-steps.tsx:4 | None |
| `StatusBadge` | `@exxatdesignux/ui/components/ui/status-badge` | `label`, `tone`, `icon`, `size: sm/md` | All status pills via `StatusPill` wrapper | YES — skill-status-badge.tsx:4, outcome-badge.tsx:1, status-pill.tsx:3 | None; correct |
| `Skeleton` | `@exxatdesignux/ui/components/ui/skeleton` | `className` | Loading states | YES — shared-loading.tsx:9 | None |
| `Avatar` + `AvatarFallback` | `@exxatdesignux/ui/components/ui/avatar` | `AvatarFallback aria-hidden="true"` | User menu avatar | YES — v2-user-menu.tsx:50 | AvatarInitials shorthand exists; current approach also correct |
| `Input` | `@exxatdesignux/ui/components/ui/input` | `type="search"`, `aria-label`, `aria-invalid` | Filter search field | YES — v2-filter-bar.tsx:103 | None |
| `Textarea` | `@exxatdesignux/ui/components/ui/textarea` | `id`, `maxLength`, `aria-describedby` | Review decision notes | YES — review-item-page.tsx:14 | None |
| `Label` | `@exxatdesignux/ui/components/ui/label` | `htmlFor` | Form labels | YES — multiple | None |
| `Checkbox` | `@exxatdesignux/ui/components/ui/checkbox` | `checked`, `onCheckedChange`, `id` | Lab grid row selection | YES — lab-grid-page.tsx:8 | None |
| `RadioGroup` + `RadioGroupItem` | `@exxatdesignux/ui/components/ui/radio-group` | `value`, `onValueChange`, `orientation` | Wizard model selection, review decision | YES — wizard-steps.tsx:10, review-item-page.tsx:12 | None |
| `Select` + parts | `@exxatdesignux/ui/components/ui/select` | `value`, `onValueChange` | Wizard dropdowns, export format | YES — multiple | None |
| `DatePickerField` | `@exxatdesignux/ui/components/ui/date-picker-field` | `value: Date or undefined`, `onChange` | Lab session date | YES — lab-grid-page.tsx:10 | None |
| `Tooltip` + `TooltipProvider` | `@exxatdesignux/ui/components/ui/tooltip` | `delayDuration` | Shell tooltip wrapper | YES — v2-shell-frame.tsx:9,21 | None |
| `Tip` | `@exxatdesignux/ui/components/ui/tip` | `label` | Contextual hints on data fields | YES — outcomes-page.tsx:136, review-queue-page.tsx:195, reports-page.tsx:246 | Could expand to wizard fields with ambiguous labels |
| `ToggleSwitch` | `@exxatdesignux/ui/components/ui/toggle-switch` | `checked`, `onChange`, `id`, `aria-labelledby` | Boolean toggles in wizard | YES — wizard-steps.tsx:58 | Used on light Card; QB exception does not apply |
| `Separator` | `@exxatdesignux/ui/components/ui/separator` | `orientation` | Section dividers | NOT SEEN | Low priority |
| `Kbd` + `KbdGroup` | `@exxatdesignux/ui/components/ui/kbd` | `aria-hidden="true"` | Keyboard shortcut hints | NOT SEEN | Low priority; only ⌘K surface exists |

### Molecules

| DS component | Import path | Key props/variants | Used for (surface) | Used in v2? | Gap |
|---|---|---|---|---|---|
| `Card` + slots | `@exxatdesignux/ui/components/ui/card` | `CardHeader`, `CardTitle`, `CardDescription`, `CardAction`, `CardContent`, `CardFooter` | Dashboard lists, wizard hints, detail sections | YES — admin-home.tsx:49, wizard-steps.tsx:34 | None; correct slot composition |
| `Tabs` + `TabsList` + `TabsTrigger` + `TabsContent` | `@exxatdesignux/ui/components/ui/tabs` | `variant="line"` | Starter Library, Review Queue, Reports, Verification Detail | YES — 4 surfaces | `TabsCountBadge` not used for count badges — see Gap |
| **`TabsCountBadge`** | `@exxatdesignux/ui/components/ui/tabs` | Inline count badge inside a `TabsTrigger` | Review queue per-tab counts | **NO — GAP** | review-queue-page.tsx:153 uses string interpolation; replace with `TabsCountBadge` |
| `Dialog` + parts | `@exxatdesignux/ui/components/ui/dialog` | `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter` | Confirm dialogs, QR dialog, skill edit | YES — 6+ files | None |
| `Sheet` + parts | `@exxatdesignux/ui/components/ui/sheet` | `SheetContent`, `SheetHeader`, `SheetTitle`, `SheetDescription` | Export sheet, evaluation history | YES — export-sheet.tsx:8, reports-page.tsx:9 | Export sheet is hand-rolled; DS `ExportDrawer` covers format selection |
| `Collapsible` + parts | `@exxatdesignux/ui/components/ui/collapsible` | `open`, `onOpenChange` | Expandable sections | YES — evaluation-form.tsx:10, student-home.tsx:8, version-timeline.tsx:4 | None |
| `DropdownMenu` + parts | `@exxatdesignux/ui/components/ui/dropdown-menu` | `DropdownMenuItem`, `DropdownMenuSeparator` | User menu | YES — v2-user-menu.tsx | None |
| `Popover` + parts | `@exxatdesignux/ui/components/ui/popover` | `PopoverContent align="start"` | Filter field picker | YES — v2-filter-bar.tsx:92 | None |
| `FilterBar` + `FilterBarAddButton` + `FilterBarClearButton` | `@exxatdesignux/ui/components/ui/filter-bar` | Applied filters strip | Review Queue, Reports, Verification via `V2FilterBar` | YES — v2-filter-bar.tsx:82 | `FilterPill` not exported; chips are `Button outline sm` — documented hand-roll |
| `Field` + `FieldLabel` + `FieldDescription` + `FieldError` | `@exxatdesignux/ui/components/ui/field` | Accessible field wrapper | Wizard fields, review form | YES — wizard-fields.tsx, review-item-page.tsx:9 | None |
| `SelectionTileGrid` | `@exxatdesignux/ui/components/ui/selection-tile-grid` | `options`, `value`, `onValueChange`, `interaction="radio"`, `columns` | Signoff method selection | YES — request-signoff.tsx:198 | Not used in wizard model picker; RadioGroup used there with justification |
| `LocalBanner` | `@exxatdesignux/ui/components/ui/banner` | `variant: success/warning/error/info`, `title`, `retry` | Feedback banners everywhere | YES — 20+ instances | None; toast never used |
| **`CoachMark`** + `useCoachMark` | `@exxatdesignux/ui/components/ui/coach-mark` | Multi-step walkthroughs | Wizard onboarding, student first-log | **NOT SEEN — 0 adoption workspace-wide** | GAP: high value for wizard step 1 and student first-log |
| `ViewSegmentedControl` | `@exxatdesignux/ui/components/ui/view-segmented-control` | `ViewSegmentOption[]` | Table / card view toggle | NOT SEEN | Low priority for current scope |

### Organisms

| DS component | Import path | Key props/variants | Used for (surface) | Used in v2? | Gap |
|---|---|---|---|---|---|
| `DataTable` | `@exxatdesignux/ui/components/data-table` | `data`, `columns: ColumnDef[]`, `selectable`, `getRowId`, `showQueryControls`, `emptyState`, `bulkActionsSlot` | All list tables via `V2Grid` | YES — v2-grid.tsx:4 (IMPORT; v1.6.5 ships it) | `showQueryControls={false}` globally; see Gap section |
| `KeyMetrics` | `@exxatdesignux/ui/components/ui/key-metrics` | `variant="cards"`, `size="sm"`, `metrics: MetricItem[]`, `showHeader`, `metricsSingleRow` | Dashboard, Review Queue, Reports, Director | YES — 5 surfaces | None |
| `Wizard` + parts | `@exxatdesignux/ui/components/ui/wizard` | `WizardNav`, `WizardContent`, `WizardPanel`, `WizardStepHeading`, `WizardProgress` | Configure Wizard (7 steps) | YES — configure-wizard.tsx:10 | `WizardProgress` not used; see Gap section |
| **`FloatingSheetPanel`** + parts | `@exxatdesignux/ui/components/ui/floating-sheet-panel` | `FloatingSheetPanelHeader`, `FloatingSheetPanelBody`, `FloatingSheetPanelFooter`, `FloatingSheetPanelWorkflowFooter` | Detail panel (split-list pattern) | **NOT USED** | GAP: Review Item and Verification Detail use full-page navigation; split panel would preserve list context |
| **`ListPageTemplate`** | `@exxatdesignux/ui/components/templates` | `header`, `metrics`, `defaultTabs`, `filterOptions`, `renderContent` | Hub list pages | **NOT USED** | GAP: Review Queue and Verification List hand-compose identical chrome; low priority to migrate |
| **`ExportDrawer`** | `@exxatdesignux/ui` | `open`, `onOpenChange`, format picker, async progress | Reports export | **NOT USED** | GAP: export-sheet.tsx is a hand-rolled Sheet; DS ExportDrawer covers format selection and progress |
| `Table` primitives | `@exxatdesignux/ui/components/ui/table` | `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell`, `TableHead` | Cross-tab matrices (heat-grid, lab-grid) | YES — documented cross-tab hand-rolls | Correct approach; documented in ds-adoption.md rows 117-118 |
| `ChartContainer` + `ChartTooltip` | `@exxatdesignux/ui/components/ui/chart` | `config: ChartConfig`, Recharts wrapper | All Recharts charts (BulletMeter, StackedBar, DotStrip, CumulativeLine) | YES — all viz components | None |

### Table Cell Renderers (from DataTable ecosystem)

| DS export | Used for | Used in v2? | Gap |
|---|---|---|---|
| `PersonIdentityCell` | Person name + avatar disc in table rows | NO — student names as plain text/Link in v2col cells | Low priority; v2col cells are intentionally minimal |
| `ProgressCell` | Numeric progress bar in a table cell | NO — SkillProgressViz dots used instead | Custom dots intentional (1-5 circles per skill, not a bar) |
| `StatusCell` | Multi-state icon+label in a table cell | NO — StatusPill (wraps StatusBadge) used instead | StatusPill is functionally equivalent; correct |
| `NumericCell` | Right-aligned tabular number | NOT SEEN | Low; tabular-nums className used directly |

### Vendored and Hand-Rolled Charts

| Component | Location | Base DS component | Gap |
|---|---|---|---|
| `ChartCard` | `components/chart-card/index.tsx` (VENDOR from PCE 2026-10-25) | DS Card + Tabs + Select | None; correctly vendored |
| `BulletMeter` | `components/v2/viz/bullet-meter.tsx` (HAND-ROLL) | `ChartContainer` + Recharts `BarChart` | Not yet in ds-adoption.md skills-checklist section |
| `StackedBar` | `components/v2/viz/stacked-bar.tsx` (HAND-ROLL) | `ChartContainer` + Recharts `BarChart` | Not yet in ds-adoption.md skills-checklist section |
| `DotStrip` | `components/v2/viz/dot-strip.tsx` (HAND-ROLL) | `ChartContainer` + Recharts | Not yet in ds-adoption.md skills-checklist section |
| `CumulativeLine` | `components/v2/viz/cumulative-line.tsx` (HAND-ROLL) | `ChartContainer` + Recharts | Not yet in ds-adoption.md skills-checklist section |
| `HeatGrid` | `components/v2/viz/heat-grid.tsx` (HAND-ROLL) | DS Table primitives + STATE_META tokens | BLOCK: audit flags raw-table; needs allowlist in ds-adoption-audit.py |
| `WaffleChart` | `components/v2/viz/waffle.tsx` (HAND-ROLL) | CSS list + STATE_META | Not yet in ds-adoption.md |
| `SegmentedDots` | `components/v2/viz/segmented-dots.tsx` (HAND-ROLL) | CSS inline SVG | Not yet in ds-adoption.md |

---

## 3. Decision Tree

```
Status indicator (icon + label + color):
  IMPORT StatusBadge via StatusPill wrapper
  NEVER use Badge for a state

KPI strip:
  IMPORT KeyMetrics variant="cards" size="sm"

List of records (students, submissions, evaluations):
  IMPORT DataTable via V2Grid
  Enable showQueryControls only if users need column-level filtering

Cross-tab matrix (student x skill, lab entry):
  HAND-ROLL with DS Table primitives; document in ds-adoption.md

Multi-step configuration:
  IMPORT Wizard + WizardNav + WizardPanel + WizardStepHeading
  Use WizardProgress for the step indicator strip

Detail panel (without leaving the list):
  IMPORT FloatingSheetPanel (not yet adopted; first opportunity is Review Item)

Export dialog (format + scope):
  IMPORT ExportDrawer
  Custom PDF signing remains product-specific

Tabs with counts:
  IMPORT Tabs + TabsTrigger + TabsCountBadge
  NEVER use string interpolation "Tab (N)"

Filter row outside a DataTable:
  REUSE V2FilterBar (v2-filter-bar.tsx) — documented hand-roll; do not build a second one

Page-level feedback:
  IMPORT LocalBanner
  NEVER Sonner/toast

Contextual help tooltip with label:
  IMPORT Tip

Chart container for Recharts:
  IMPORT ChartContainer + ChartTooltip from @exxatdesignux/ui/components/ui/chart

Bespoke viz (bullet-vs-target, heatmap, waffle, pace dots):
  HAND-ROLL using viz/tokens.ts STATE_META + TONE_COLOR (all var(--) DS tokens)
  Use ChartContainer where Recharts applies
  Add each new viz to ds-adoption.md skills-checklist section

Onboarding walkthrough:
  IMPORT CoachMark + useCoachMark (0 adoption; coordinate with PCE/EM for first use)
```

---

## 4. DS Lacks (compose, with reason)

| Intent | DS provides | What is missing | Current approach |
|---|---|---|---|
| Standalone removable filter chip | `FilterBar` shell + Add/Clear buttons; no `FilterPill` | No exported chip-as-button | `Button variant="outline" size="sm"` chips; documented hand-roll in v2-filter-bar.tsx |
| Cross-tab / matrix table | `Table` primitives; `DataTable` has no cross-tab model | No matrix DataTable variant | DS Table primitives; documented hand-roll |
| PDF report export with signing | `ExportDrawer` for format selection | No PDF signing or verification workflow | export-sheet.tsx covers format + PDF ops; DS ExportDrawer covers format step only |
| Skill progress dots (N of M circles) | `ProgressCell` (bar), `WizardProgress` (step dots) | No inline micro-dot viz | `SkillProgressViz` — intentional custom; count is 1-5 circle glyphs per skill, not a bar |
| Evaluator token form (no chrome) | No unauthenticated shell template | No public/token-gated form pattern | `app/(evaluator)/layout.tsx` hand-rolled; correct by design |
| Lab data-entry grid (per-cell cycling) | `DataTable` row/bulk model | No per-cell interaction model | DS Table primitives + custom click handler; documented hand-roll |

---

## 5. Registry vs Package Reality

The `docs/governance/ds-adoption.md` registry (last reviewed 2026-05-11) lists both `DataTable` and `KeyMetrics` as VENDOR.
In `@exxatdesignux/ui` v1.6.5 both are published to `dist/` and are correctly used via IMPORT in this product.
The registry row should be updated to reflect v1.6.5 availability. That is Himanshu's decision.
