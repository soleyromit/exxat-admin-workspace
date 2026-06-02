#!/usr/bin/env python3
"""DS Adoption Audit — catches hand-roll patterns that mirror DS organisms.

Single source of truth: docs/governance/ds-adoption.md.

What this audit looks for in product code (apps/<product>/<role>/):

  1. Raw <Table> usage outside vendored DataTable. If a page imports Table
     primitives from @exxat/ds and renders <Table>, it should be using the
     canonical DataTable composite at @/components/data-table instead.
     Exception: the vendored data-table source itself.

  2. <Card> used as bare container — Card with no slot children (CardHeader,
     CardTitle, CardDescription, CardContent, CardAction, CardFooter) inside
     the JSX tree at all. This means the Card is being treated as a styled div.

  3. Custom files named like DS organisms. If apps/*/admin/components/<name>.tsx
     exists where <name> matches a DS organism the registry knows about
     (data-table, key-metrics, section-cards, export-drawer, coach-mark,
     command-menu, etc.) and the file isn't in the registry's "Documented
     hand-rolls" allowlist or under a "components/data-table/" vendored dir,
     flag it.

  4. Raw <button> elements outside known wrappers. Use DS Button.

  5. Hex / rgb literals in className or style. Already covered by ds-globals
     audit + DS-014; we re-check here as a safety net so DS adoption shows
     a single "DS hygiene" panel.

  6. State-coverage gaps. Catches default-only rendering — when a file
     touches async data, form input, or list rendering but skips loading /
     empty / error / validation / disabled affordances.

     Rules (severity reflects 2026-05-11 promotion per architect-runs/
     2026-05-11-baseline.md):
       - datatable-no-empty-state   : <DataTable> invocation without an
                                       emptyState prop AND without a
                                       data.length===0 guard near the call.
                                       [BLOCK]
       - dialog-no-error-feedback    : <DialogContent>...<form>... renders
                                       <Input> with no aria-invalid AND no
                                       FieldError AND no LocalBanner error.
                                       [BLOCK]
       - opacity-60-on-text-parent   : opacity-60 on an element whose
                                       descendants render text-muted-foreground
                                       (drops contrast below WCAG 4.5:1).
                                       [BLOCK]
       - clickable-without-focus-ring: onClick + cursor-pointer on a non-DS
                                       element that lacks focus-visible:ring.
                                       [WARN — promotion deferred]
       - async-fetch-no-skeleton     : file with useEffect+fetch / useSWR /
                                       useQuery / isLoading that does NOT
                                       import or render Skeleton.
                                       [WARN — false-positive-prone]

  7. Card-shape masquerade (consolidated 2026-05-11). Single rule with two
     facets — replaces former card-imposter-div + eyebrow-paragraph-outside-
     card. Both emit rule="card-shape-masquerade" with a facet-specific
     message.

     See docs/governance/component-state-catalog.md for the canonical state
     matrix and docs/patterns/admin/state-coverage.md for prescriptions.

  8. DS migration coverage (added 2026-05-29). Detects vendored or hand-rolled
     components whose canonical DS equivalents are now available from
     @exxatdesignux/ui. All WARN — migration targets, not blocking violations.

       - vendored-datatable           : components/data-table/ dir exists and
                                        content goes beyond index.tsx importing
                                        from the DS package. Migrate to DS.
       - vendored-keymetrics          : components/key-metrics/ dir exists
                                        without a DS-import-only index.tsx.
       - vendored-table-properties    : components/table-properties/ dir exists.
       - hand-rolled-status-badge     : custom component whose name contains
                                        StatusBadge / SurveyStatusBadge /
                                        AssessmentStatusBadge / StatusDot with
                                        rounded+text-xs+status-word className
                                        and no StatusBadge import from DS.
       - missing-list-page-template   : page.tsx imports local DataTable but
                                        not ListPageTemplate from DS.
       - hand-rolled-export-drawer    : Sheet/Dialog/Drawer with export-related
                                        names and no ExportDrawer DS import.

  9. FERPA data-flow (added 2026-05-17). Flags files that handle both a
     student identifier AND response/answer text in the same component.

Run from repo root:

    python3 scripts/ds-adoption-audit.py
    python3 scripts/ds-adoption-audit.py --strict       # exit 1 on any gap
    python3 scripts/ds-adoption-audit.py --product pce  # one app
    python3 scripts/ds-adoption-audit.py --json         # machine readable

Output: by product, by gap class, with file:line citations.

What this audit does NOT check:
  - Whether a component LOOKS like its DS equivalent (visual diff).
  - Whether vendored copies are still in sync with upstream submodule.
  - Whether a hand-roll listed in the registry's "Documented hand-rolls" is
    still justified.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
APPS_DIR = REPO_ROOT / "apps"
REGISTRY_PATH = REPO_ROOT / "docs" / "governance" / "ds-adoption.md"

# ── DS organism filename patterns (matches the registry) ────────────────────
# If a file under apps/<product>/<role>/components/ has one of these stems,
# audit flags it unless the path also contains "data-table" (the vendored dir).
DS_ORGANISM_NAMES = {
    "data-table", "data-list-table", "key-metrics", "section-cards",
    "export-drawer", "table-properties-drawer", "coach-mark", "command-menu",
    "placements-list-view", "data-list-table-cells",
}

# Files explicitly allowed to mirror DS organism names (the vendored dirs).
ALLOWED_ORGANISM_PATHS = {
    "components/data-table/index.tsx",
    "components/data-table/types.ts",
    "components/data-table/use-table-state.ts",
    "components/data-table/filter-date-calendar.tsx",
    "components/data-table/pagination.tsx",
    "components/table-properties/types.ts",
    "components/table-properties/drawer.tsx",
}

# Files explicitly documented as intentional hand-rolls in the registry.
# Keep in sync with docs/governance/ds-adoption.md "Documented hand-rolls".
DOCUMENTED_HAND_ROLLS = {
    "components/pce/trend-sparkline.tsx",
    "components/pce/response-gauge.tsx",
    "components/pce/ai-insight-card.tsx",
    # Chart depth audit 2026-05-11 — three viz functions inside larger files
    # are documented as intentional hand-rolls. Note: scan_filename_for_ds_organism
    # only matches on filename stems so these aren't actually flagged by it; entries
    # remain here for documentation parity with the registry.
    "app/(app)/analytics/page.tsx",  # ScoreLandscape l.29
    "components/curricular-loop-diagram.tsx",  # PerformanceHeatmap l.267, TrendRow l.797
    # exam-management: assessment-builder question picker — tightly coupled
    # picker grid (full-row click toggles selection, custom selected-row tint,
    # embedded sub-widget of a larger builder shell with smart-view chips +
    # footer chart). Migrating to canonical DataTable would lose key affordances.
    # Documented as a legitimate hand-roll in docs/governance/ds-adoption.md →
    # DataTable row.
    "app/(app)/assessment-builder/assessment-builder-client.tsx",
    # exam-management: access and private pages use local DataTable — ListPageTemplate migration
    # deferred until the DataTable vendoring (exam-management uses local vendored copy) is resolved.
    "app/(app)/access/page.tsx",
    "app/(app)/private/page.tsx",
    # exam-management: assessment-landing uses Sheet/Dialog for "Send to Chair" review workflow
    # and the download window is exam-download UX (not data-export). ExportDrawer doesn't apply.
    "app/(app)/assessments/[id]/assessment-landing-client.tsx",
    # exam-management: students-tab Sheet is for "Enroll Student" (roster management),
    # not a CSV/data export. The "download" keyword refers to exam download UX.
    "app/(app)/courses/[id]/tabs/students-tab.tsx",
    # exam-management: QBToggle — custom toggle switch replacing DS ToggleSwitch.
    # DS ToggleSwitch renders `border-2 border-input` which produces a large gray
    # ring on white/brand-tinted surfaces. This component uses DS tokens directly
    # (--brand-color track, neutral OFF, --background thumb) with no border ring.
    # Documented in docs/governance/ds-adoption.md → QB ToggleSwitch exception.
    "components/qb/toggle.tsx",
    # pce: distribute-wizard — three Sheet-embedded tables where the full DataTable
    # organism would conflict with the sheet layout / pinned footer.
    # email-list-sheet: editable roster (add/remove rows inline); DataTable's
    #   sort/resize chrome conflicts with the fixed-width sheet layout.
    # exxat-prism-sheet: student picker; DataTable's bulk-actions bar conflicts
    #   with the Sheet's pinned footer CTA ("Add N students").
    # step-report-access: role × student access matrix (cross-tab); DataTable
    #   has no matrix-column model.
    # All three documented in docs/governance/ds-adoption.md → PCE section.
    "components/pce/distribute-wizard/email-list-sheet.tsx",
    "components/pce/distribute-wizard/exxat-prism-sheet.tsx",
    "components/pce/distribute-wizard/step-report-access.tsx",
    # pce: vendored DataTable has PCE-specific extensions (defaultGroupBy,
    # groupLabels, groupOrder) not yet in the DS export. Intentional until
    # the DS DataTable supports grouped row presets.
    "components/data-table",
    # pce admin: list pages use vendored DataTable (see above). ListPageTemplate
    # migration deferred until DataTable vendoring is resolved.
    "app/(app)/admin/faculty/page.tsx",
    "app/(app)/admin/offerings/page.tsx",
    "app/(app)/admin/terms/page.tsx",
    "app/(app)/admin/accommodations/page.tsx",
    "app/(app)/admin/students/page.tsx",
    "app/(app)/admin/courses/page.tsx",
    "app/(app)/admin/competencies/page.tsx",
    "app/(app)/admin/content-areas/page.tsx",
    "app/(app)/admin/assessment-types/page.tsx",
    "app/(app)/admin/standards/page.tsx",
    "app/(app)/admin/permissions/page.tsx",
    "app/(app)/my-surveys/page.tsx",
    # pce: SurveyStatusBadge — workflow status badges (draft/active/collecting/
    # closed/released) with product-specific CSS variables (--pce-status-*) and
    # dot indicators. DS StatusBadge covers only product-lifecycle states
    # (beta/new/alpha/preview/deprecated) — no overlap with survey workflow states.
    # Documented as intentional hand-roll in docs/governance/ds-adoption.md.
    "components/pce/pce-badges.tsx",
    # pce: table-properties directory — PCE's stripped vendor (~340 LoC) retains
    # only columns/sort/filter panels; canonical (1041 LoC) includes
    # conditional-formatting, group-by, view-type switcher, row-density that PCE
    # doesn't need yet. Intentional until those sections are needed.
    "components/table-properties",
    # pce: step-communication.tsx — hex values are SVG linearGradient stopColor
    # attributes in an aria-hidden decorative icon (PrismIconMark). Cannot be
    # replaced with var(--token); SVG gradients require literal color values.
    "components/pce/distribute-wizard/step-communication.tsx",
    # pce: settings-appearance-card.tsx — hex values are CHROME_LIGHT/CHROME_DARK
    # object literals used as theme-preview swatch data (macOS traffic-light dot
    # colors rendered inside a static browser-chrome illustration). Not applied
    # as UI colors on any interactive element; intentional product design fidelity.
    "components/settings-appearance-card.tsx",
}

# Pre-existing organism-name-collision files we're grandfathering as of
# 2026-05-11 so phase-1 strict mode can ship without blocking commits on
# their stable pages. These are REAL violations to migrate, not blessed
# hand-rolls. Remove from this list once each file is migrated to the
# canonical (vendor / import / rename + add to DOCUMENTED_HAND_ROLLS).
#
# Tracked: docs/governance/ds-adoption.md → "Grandfathered hand-rolls".
# Files where the card-imposter regex hits on legitimate non-Card divs —
# sidebar status pills, floating tooltips, fieldset wrappers, etc. Each entry
# must be justified in docs/governance/ds-adoption.md → "Legitimate non-Card
# divs" with the exact rationale. The audit will skip card-imposter scanning
# for these files.
#
# IMPORTANT: this is a WHOLE-FILE skip. If the same file later grows a real
# imposter div, remove it from this set and convert the legitimate site to a
# className that doesn't match the regex (e.g. swap `p-3` → `pl-3 pr-3 py-2.5`
# or change `<div>` to `<aside role="status">`).
LEGITIMATE_NON_CARD_DIVS = {
    # exam-management: sidebar FacultyModeChip — status indicator inside
    # the Sidebar (not a content panel). Per card.md depth audit 2026-05-11.
    "components/app-sidebar.tsx",
    # pce: Checkbox-group wrapper inside CreateSurveySheet body. Fieldset-style
    # container around a list of <Checkbox> rows — not Card chrome. DS gap S4
    # (no FieldGroup primitive) tracked in ds-escalations-2026-05-11.md:160;
    # allowlist accepted by architect-runs/2026-05-11-baseline.md open-Q #2.
    "components/pce/pce-modals.tsx",
    # pce: ai-thinking-surface.tsx — line 14 is inside a JSDoc comment code
    # example (`<div className="relative rounded-xl border p-6">`), not real JSX.
    # The actual component wraps children with `relative overflow-hidden` for
    # dot-pattern overlay positioning — no card chrome.
    "components/ui/ai-thinking-surface.tsx",
    # pce: survey-preview-dialog.tsx — line 79 is a `h-8 px-3` input-field
    # placeholder visually representing a "Written response" answer blank inside
    # a preview dialog. `h-8` constrains height to 32px — not card content chrome.
    "components/pce/distribute-wizard/survey-preview-dialog.tsx",
}

GRANDFATHERED_ORGANISM_COLLISIONS: set[str] = set()
# (empty as of 2026-05-11)
# Previously listed:
#   "components/key-metrics.tsx" — MIGRATED 2026-05-11. File deleted;
#     vendored canonical lives at components/key-metrics/index.tsx. The two
#     consumer pages (competency, live-monitor) now import canonical.
#     KpiTile in faculty-ui-kit.tsx retained as documented hand-roll —
#     see docs/governance/ds-adoption.md.
#   "components/data-table.tsx" — MIGRATED 2026-05-11. File deleted;
#     vendored canonical lives at components/data-table/{index,types,
#     use-table-state,filter-date-calendar,pagination,row-actions}.tsx
#     mirroring PCE's vendor (incl. defaultGroupBy/groupLabels/groupOrder
#     extensions). The two consumer pages (access, private) now import
#     canonical. assessment-builder picker grid retained as documented
#     hand-roll — see docs/governance/ds-adoption.md.

# ── Regex patterns ──────────────────────────────────────────────────────────
TABLE_IMPORT_RE = re.compile(
    r"^\s*(?:import\s*\{[^}]*\b(?:Table|TableHeader|TableBody|TableRow|TableHead|TableCell)\b[^}]*\}|"
    r"\s*(?:Table|TableHeader|TableBody|TableRow|TableHead|TableCell)[\s,])",
    re.MULTILINE,
)
TABLE_JSX_RE = re.compile(r"<\s*Table\b")
CARD_IMPORT_RE = re.compile(r"\bCard\b[\s,}]")
CARD_OPEN_RE = re.compile(r"<\s*Card\b")
CARD_SLOT_RE = re.compile(r"<\s*Card(?:Header|Title|Description|Content|Action|Footer)\b")
CARD_BARE_DIV_RE = re.compile(r"<\s*Card\b[^>]*>\s*<\s*div\b")
# Card-imposter: a <div> whose className has Card-shape chrome — rounded + border + padding —
# strongly suggests this should be `Card` from DS. Heuristic; warn-only.
CARD_IMPOSTER_DIV_RE = re.compile(
    r'<\s*div\s+className=["\'`][^"\'`]*'
    r'(?=.*\brounded(?:-(?:sm|md|lg|xl|2xl|full))?\b)'
    r'(?=.*\bborder(?:-(?:border|input))?\b)'
    r'(?=.*\bp(?:y|x)?-(?:3|4|5|6|8)\b)'
    r'[^"\'`]*["\'`]'
)
# Uppercase + tracking-wide eyebrow paragraph — strongly suggests CardDescription
# slot. Heuristic; warn-only.
EYEBROW_PARAGRAPH_RE = re.compile(
    r'<\s*p\s+className=["\'`][^"\'`]*'
    r'(?=.*\buppercase\b)'
    r'(?=.*\btracking-wide\b)'
    r'[^"\'`]*["\'`]'
)
# Case-sensitive — DS `<Button>` is fine; only lowercase `<button>` is the
# raw HTML element we want to flag.
RAW_BUTTON_RE = re.compile(r"<\s*button\b[^>]*>")
HEX_COLOR_RE = re.compile(r"['\"]\#[0-9a-fA-F]{3,8}\b['\"]?")
RGB_COLOR_RE = re.compile(r"\brgb\s*\(")

# ── State-coverage regexes (added 2026-05-11; phase-0 warn) ────────────────
# DataTable JSX open (multi-line). Just locates the start position; we
# extract the props block via custom bracket-balancing in the scanner.
DATATABLE_OPEN_RE = re.compile(r"<\s*DataTable\b")
EMPTY_STATE_PROP_RE = re.compile(r"\bemptyState\s*[=:]")
# Common in-file guards: `data.length === 0`, `rows.length === 0`,
# `items.length === 0`, generic `Array.isArray(x) && x.length === 0`.
EMPTY_GUARD_RE = re.compile(
    r"\b(?:data|rows|items|results|records|list|entries)\.length\s*===?\s*0"
    r"|\.length\s*===?\s*0\s*\?"
    r"|\bisEmpty\b"
)

# DialogContent containing a <form> + Input → must show some validation
# affordance (aria-invalid, FieldError, or LocalBanner variant="error").
DIALOG_FORM_RE = re.compile(
    r"<\s*DialogContent\b[^>]*>(?:.|\n)*?<\s*form\b(?:.|\n)*?</\s*DialogContent\s*>",
    re.MULTILINE,
)
INPUT_TAG_RE = re.compile(r"<\s*Input\b")
ARIA_INVALID_RE = re.compile(r"\baria-invalid\b")
FIELD_ERROR_RE = re.compile(r"<\s*FieldError\b")
LOCAL_BANNER_ERROR_RE = re.compile(
    r"<\s*LocalBanner\b[^>]*\bvariant\s*=\s*[\"']error[\"']"
)

# opacity-60 anywhere in a className that ALSO contains anything implying
# a descendant text element. We deliberately use a two-stage scan:
#   1. find className strings containing "opacity-60"
#   2. for each hit, scan the next ~600 chars of the file for
#      "text-muted-foreground" — if present, flag.
OPACITY_60_CLASS_RE = re.compile(r'className=["\'`][^"\'`]*\bopacity-60\b[^"\'`]*["\'`]')
TEXT_MUTED_FG_RE = re.compile(r"\btext-muted-foreground\b")

# onClick + cursor-pointer on an element that is not <Button (uppercase = DS),
# missing focus-visible:ring. We scan element opening tags that have
# className containing "cursor-pointer" and at least one onClick={...}
# in the same element block. False positives possible on divs that delegate
# focus to a child; warn-only.
CLICKABLE_DIV_RE = re.compile(
    r"<\s*(?P<tag>div|span|li|article|section|tr|td|a)\b"
    r"(?P<attrs>[^>]*?\bonClick\s*=\s*\{[^>]*?)>",
    re.DOTALL,
)
CURSOR_POINTER_RE = re.compile(r"\bcursor-pointer\b")
FOCUS_RING_RE = re.compile(r"\bfocus(?:-visible)?:ring\b|\bfocus-visible:outline\b")
ROLE_BUTTON_RE = re.compile(r'\brole\s*=\s*["\']button["\']')

# Async-fetch signals — any of: useEffect with fetch( inside, useSWR(,
# useQuery(, an explicit `isLoading` state variable.
ASYNC_FETCH_RE = re.compile(
    r"useEffect\s*\([^)]*\bfetch\s*\(|\buseSWR\s*\(|\buseQuery\s*\(|\bisLoading\b"
)
SKELETON_RE = re.compile(r"\bSkeleton\b")

# ── FERPA data-flow regexes (added 2026-05-17) ───────────────────────────────
# Flag files that handle BOTH a student identifier AND response/answer text
# in the same component, risking linkage of student identity to survey response
# in violation of FERPA §99.31. The fix is server-side: strip the student ID
# before the component receives data — this cannot be solved in the UI layer.
FERPA_STUDENT_ID_RE = re.compile(r"\bstudentId\b|\bstudentName\b|\bstudentEmail\b")
FERPA_RESPONSE_TEXT_RE = re.compile(r"\bresponseText\b|\bresponseBody\b|\banswerText\b")

# ── WCAG ARIA regexes (added 2026-05-22) ─────────────────────────────────────
#
# Rule: aria-combobox-required
# aria-expanded / aria-haspopup / aria-autocomplete are only valid on elements
# that carry role="combobox" (or a handful of others — button, listbox, etc.).
# On a bare <input> or <InputGroupInput> without role="combobox" these are
# disallowed (ARIA 1.2 §6.6 aria-expanded / §6.23 aria-haspopup).
# Source of incident: search-input.tsx shipped without role="combobox"; caught
# as aria-allowed-attr (critical) in axe-core scan 2026-05-22.
ARIA_COMBOBOX_ATTRS_RE = re.compile(
    r"<\s*(?:InputGroupInput|input)\b(?P<attrs>[^>]{0,600}?)"
    r"(?P<trigger>aria-expanded|aria-haspopup|aria-autocomplete)"
    r"(?:[^>]{0,600}?)>",
    re.DOTALL,
)
ROLE_COMBOBOX_RE = re.compile(r'\brole\s*=\s*["\']combobox["\']')

# Rule: nested-main-landmark
# DS SidebarInset renders as <main data-slot="sidebar-inset">. Adding a
# second <main> inside it violates landmark uniqueness (WCAG 1.3.6 / ARIA
# 4.3.2). Source of incident: layout.tsx fix added <main> inside SidebarInset,
# creating landmark-no-duplicate-main (moderate) across all PCE admin pages.
SIDEBAR_INSET_IMPORT_RE = re.compile(r"\bSidebarInset\b")
MAIN_ELEMENT_OPEN_RE = re.compile(r"<\s*main\b")

# Rule: color-mix-contrast-risk
# color-mix() with oklch or hsl produces colors whose contrast ratio cannot
# be computed at static-analysis time. When used as backgroundColor / background
# in an inline style on a non-decorative element, flag it so the author verifies
# contrast manually or in the visual-check run. Does NOT flag :root / theme files.
# Source of incident: badge on PCE root page produced 2.46:1 from color-mix.
COLOR_MIX_INLINE_BG_RE = re.compile(
    r"style\s*=\s*\{\s*\{[^}]{0,800}"
    r"(?:backgroundColor|background)\s*:\s*['\"`]?color-mix\s*\("
    r"|(?:backgroundColor|background)[^}]{0,400}color-mix\s*\(",
    re.DOTALL,
)

# ── Models ──────────────────────────────────────────────────────────────────
@dataclass
class Gap:
    severity: str         # "block" | "warn"
    rule: str             # short slug
    file: str             # repo-relative
    line: int | None
    message: str

@dataclass
class ProductReport:
    product: str          # "pce" | "exam-management" | ...
    role: str             # "admin" | "student"
    gaps: list[Gap] = field(default_factory=list)
    pages_scanned: int = 0

    @property
    def block_count(self) -> int:
        return sum(1 for g in self.gaps if g.severity == "block")

    @property
    def warn_count(self) -> int:
        return sum(1 for g in self.gaps if g.severity == "warn")

# ── Scanners ────────────────────────────────────────────────────────────────
def scan_file_for_raw_table(rel: str, text: str) -> list[Gap]:
    """Flag pages that import Table primitives AND use <Table> JSX in the
    same file. Vendored data-table dir is exempt."""
    if "components/data-table/" in rel:
        return []
    if rel in ALLOWED_ORGANISM_PATHS:
        return []
    if rel in DOCUMENTED_HAND_ROLLS:
        return []
    if not TABLE_IMPORT_RE.search(text):
        return []
    if not TABLE_JSX_RE.search(text):
        return []
    # Find the first <Table line for the citation
    line_no = None
    for i, line in enumerate(text.split("\n"), start=1):
        if TABLE_JSX_RE.search(line):
            line_no = i
            break
    return [Gap(
        severity="block",
        rule="raw-table-in-product-code",
        file=rel,
        line=line_no,
        message=(
            "Raw <Table> from @exxat/ds in product code. Use canonical DataTable "
            "from `@/components/data-table` (vendored) instead. See "
            "docs/governance/ds-adoption.md → DataTable row."
        ),
    )]

def scan_file_for_card_imposter_div(rel: str, text: str) -> list[Gap]:
    """A <div> with Card-shape chrome (rounded + border + padding) is most
    likely a Card pretending to be a div. Heuristic — emits warn, not block.

    Skipped:
      - vendored DataTable (uses its own wrapper conventions)
      - files already importing Card (the author chose to opt out for a reason)
    """
    if "components/data-table/" in rel:
        return []
    if "components/table-properties/" in rel:
        return []
    if rel in DOCUMENTED_HAND_ROLLS:
        return []
    if rel in LEGITIMATE_NON_CARD_DIVS:
        return []
    gaps: list[Gap] = []
    for m in CARD_IMPOSTER_DIV_RE.finditer(text):
        line_no = text[: m.start()].count("\n") + 1
        gaps.append(Gap(
            severity="warn",
            rule="card-shape-masquerade",
            file=rel,
            line=line_no,
            message=(
                "Card-shape masquerade (div facet): <div> with rounded + border + "
                "padding looks like Card chrome. Use DS Card (or Card size=\"sm\") "
                "with CardHeader / CardTitle / CardDescription / CardContent slots "
                "— see docs/governance/ds-adoption.md → Card row."
            ),
        ))
        if len(gaps) >= 5:  # cap noise per file
            break
    return gaps

def scan_file_for_eyebrow_paragraph(rel: str, text: str) -> list[Gap]:
    """`<p className="...uppercase tracking-wide...">` is the canonical
    DS CardDescription eyebrow style. If used outside a Card slot it
    should probably BE a CardDescription. Heuristic — emits warn."""
    if "components/data-table/" in rel:
        return []
    if rel in DOCUMENTED_HAND_ROLLS:
        return []
    gaps: list[Gap] = []
    for m in EYEBROW_PARAGRAPH_RE.finditer(text):
        line_no = text[: m.start()].count("\n") + 1
        gaps.append(Gap(
            severity="warn",
            rule="card-shape-masquerade",
            file=rel,
            line=line_no,
            message=(
                "Card-shape masquerade (eyebrow facet): `<p>` with `uppercase "
                "tracking-wide` is the DS CardDescription eyebrow pattern. If this "
                "is a section header, use CardDescription inside a Card; otherwise "
                "consider Badge. Bare `<p>` will drift from DS treatments over time."
            ),
        ))
        if len(gaps) >= 5:
            break
    return gaps

def scan_file_for_bare_card(rel: str, text: str) -> list[Gap]:
    """Flag <Card> opens whose immediate child is <div> (no slot children
    anywhere in the file at all = bare-container usage)."""
    if not CARD_OPEN_RE.search(text):
        return []
    # If the file uses ANY Card slot, it's at least partially compositional.
    if CARD_SLOT_RE.search(text):
        return []
    # No slots used + raw <div> child = bare container
    if not CARD_BARE_DIV_RE.search(text):
        return []
    line_no = None
    for i, line in enumerate(text.split("\n"), start=1):
        if CARD_BARE_DIV_RE.search(line):
            line_no = i
            break
    return [Gap(
        severity="block",
        rule="card-bare-container",
        file=rel,
        line=line_no,
        message=(
            "<Card> used as bare container with raw <div> children. Use Card slot "
            "composition: CardHeader > CardTitle + CardDescription, CardContent, "
            "CardFooter. See docs/governance/ds-adoption.md → Card row."
        ),
    )]

def scan_file_for_raw_button(rel: str, text: str) -> list[Gap]:
    """Flag raw <button> elements in product code. Allow inside vendored DS
    organisms (DataTable: resize handles; KeyMetrics: MetricCell interactive
    cells)."""
    if "components/data-table/" in rel:
        return []
    if "components/key-metrics/" in rel:
        return []
    if rel in DOCUMENTED_HAND_ROLLS:
        return []
    m = RAW_BUTTON_RE.search(text)
    if not m:
        return []
    line_no = text[: m.start()].count("\n") + 1
    return [Gap(
        severity="warn",
        rule="raw-html-button",
        file=rel,
        line=line_no,
        message="Raw <button> element. Use DS Button with explicit variant + size.",
    )]

def scan_file_for_color_literals(rel: str, text: str) -> list[Gap]:
    """Flag hex / rgb literals. Theme files are exempt.
    Files in DOCUMENTED_HAND_ROLLS are also exempt (rationale recorded there)."""
    if rel.endswith(".css"):
        return []
    if "theme" in rel.lower():
        return []
    if rel in DOCUMENTED_HAND_ROLLS:
        return []
    gaps: list[Gap] = []
    for m in HEX_COLOR_RE.finditer(text):
        line_no = text[: m.start()].count("\n") + 1
        # Skip if inside a comment line
        line_text = text.split("\n")[line_no - 1] if line_no <= len(text.split("\n")) else ""
        if line_text.lstrip().startswith("//") or line_text.lstrip().startswith("*"):
            continue
        gaps.append(Gap(
            severity="warn",
            rule="hex-color-literal",
            file=rel,
            line=line_no,
            message=f"Hex color literal {m.group(0)} — use var(--token).",
        ))
        if len(gaps) >= 3:  # cap noise per file
            break
    return gaps

# ── State-coverage scanners ────────────────────────────────────────────────
# All phase-0 WARN. Bind: docs/governance/component-state-catalog.md,
# docs/patterns/admin/state-coverage.md.

def _extract_jsx_props_block(text: str, start: int) -> str:
    """Given the offset of `<DataTable` (or any JSX tag) start, walk forward
    until the matching `>` that closes the open tag — respecting `{...}`
    expression braces and string literals. Returns the substring including
    the opening `<` and the closing `>` / `/>` of the open tag (props only,
    not children)."""
    n = len(text)
    i = start
    # Find the first `<` then walk char by char.
    depth_curly = 0           # { } JSX expression
    depth_paren = 0           # ( ) — rare in tag attrs but possible
    depth_angle = 0           # nested < > inside type generics (only valid before any prop)
    in_str: str | None = None  # active quote char if inside a string
    saw_first_lt = False
    while i < n:
        ch = text[i]
        if in_str is not None:
            if ch == in_str and text[i - 1] != "\\":
                in_str = None
            i += 1
            continue
        if ch in ("'", '"', "`"):
            in_str = ch
            i += 1
            continue
        if ch == "{":
            depth_curly += 1
            i += 1
            continue
        if ch == "}":
            depth_curly = max(0, depth_curly - 1)
            i += 1
            continue
        if ch == "(":
            depth_paren += 1
            i += 1
            continue
        if ch == ")":
            depth_paren = max(0, depth_paren - 1)
            i += 1
            continue
        if ch == "<":
            if not saw_first_lt:
                saw_first_lt = True
            else:
                # Only treat `<` as a nested tag/generic when not inside braces.
                if depth_curly == 0:
                    depth_angle += 1
            i += 1
            continue
        if ch == ">":
            if depth_curly == 0 and depth_paren == 0:
                if depth_angle > 0:
                    depth_angle -= 1
                    i += 1
                    continue
                # Found the closing `>` of the open tag.
                return text[start: i + 1]
            i += 1
            continue
        i += 1
    return text[start: min(start + 2000, n)]


def scan_file_for_datatable_no_empty_state(rel: str, text: str) -> list[Gap]:
    """A <DataTable> invocation that supplies neither `emptyState` prop nor
    a `data.length === 0` guard rendering a fallback in the same file."""
    if "components/data-table/" in rel:
        return []
    if rel in DOCUMENTED_HAND_ROLLS:
        return []
    gaps: list[Gap] = []
    for m in DATATABLE_OPEN_RE.finditer(text):
        block = _extract_jsx_props_block(text, m.start())
        if EMPTY_STATE_PROP_RE.search(block):
            continue
        # Allow a same-file empty-guard render-fork as an alternative.
        if EMPTY_GUARD_RE.search(text):
            continue
        line_no = text[: m.start()].count("\n") + 1
        gaps.append(Gap(
            severity="block",
            rule="datatable-no-empty-state",
            file=rel,
            line=line_no,
            message=(
                "<DataTable> rendered without `emptyState` prop and no "
                "`data.length === 0` guard in the file. Empty render falls "
                "back to DataTable's default 'No results match your filters' "
                "string, which is wrong when the source has 0 rows (vs. a "
                "filter that returned 0). Supply `emptyState={...}` with "
                "icon + heading + 1-line explanation + optional CTA. See "
                "docs/patterns/admin/state-coverage.md → empty-state."
            ),
        ))
        if len(gaps) >= 5:
            break
    return gaps

def scan_file_for_dialog_no_error_feedback(rel: str, text: str) -> list[Gap]:
    """A DialogContent containing a <form> with <Input>, no aria-invalid,
    no FieldError, and no LocalBanner variant=\"error\"."""
    if "components/data-table/" in rel:
        return []
    if rel in DOCUMENTED_HAND_ROLLS:
        return []
    gaps: list[Gap] = []
    for m in DIALOG_FORM_RE.finditer(text):
        block = m.group(0)
        if not INPUT_TAG_RE.search(block):
            continue
        if ARIA_INVALID_RE.search(block):
            continue
        if FIELD_ERROR_RE.search(block):
            continue
        # LocalBanner error can live anywhere in the file (top-level state).
        if LOCAL_BANNER_ERROR_RE.search(text):
            continue
        line_no = text[: m.start()].count("\n") + 1
        gaps.append(Gap(
            severity="block",
            rule="dialog-no-error-feedback",
            file=rel,
            line=line_no,
            message=(
                "<DialogContent> contains a <form> with <Input> but no "
                "aria-invalid, no <FieldError>, and no <LocalBanner "
                "variant=\"error\">. Validation gaps silently swallow user "
                "input. Add aria-invalid + FieldError per field, plus a "
                "multi-error LocalBanner summary at the top of the form. "
                "Canonical example: apps/exam-management/admin/app/(app)/"
                "access/page.tsx:293-321. See docs/patterns/admin/"
                "state-coverage.md → validation."
            ),
        ))
        if len(gaps) >= 5:
            break
    return gaps

def scan_file_for_opacity_60_on_text_parent(rel: str, text: str) -> list[Gap]:
    """An element with className containing opacity-60 whose descendants
    render text-muted-foreground. Drops contrast below WCAG 4.5:1."""
    if "components/data-table/" in rel:
        return []
    if rel in DOCUMENTED_HAND_ROLLS:
        return []
    gaps: list[Gap] = []
    for m in OPACITY_60_CLASS_RE.finditer(text):
        # Look ahead ~600 chars for a text-muted-foreground descendant.
        # If the parent element closes before that, we'd still flag — heuristic.
        tail = text[m.end(): m.end() + 600]
        if not TEXT_MUTED_FG_RE.search(tail):
            continue
        line_no = text[: m.start()].count("\n") + 1
        gaps.append(Gap(
            severity="block",
            rule="opacity-60-on-text-parent",
            file=rel,
            line=line_no,
            message=(
                "`opacity-60` applied to an element whose descendants render "
                "`text-muted-foreground`. Compounding opacity drops contrast "
                "below WCAG 4.5:1. Use the DS disabled state (aria-disabled "
                "+ pointer-events-none + the component's own disabled prop) "
                "instead of dimming the whole subtree. See "
                "docs/patterns/admin/state-coverage.md → disabled."
            ),
        ))
        if len(gaps) >= 5:
            break
    return gaps

def scan_file_for_clickable_without_focus_ring(rel: str, text: str) -> list[Gap]:
    """An element with onClick + cursor-pointer that lacks focus-visible:ring
    and isn't a DS Button (PascalCase tags scanned)."""
    if "components/data-table/" in rel:
        return []
    if rel in DOCUMENTED_HAND_ROLLS:
        return []
    gaps: list[Gap] = []
    for m in CLICKABLE_DIV_RE.finditer(text):
        attrs = m.group("attrs")
        if not CURSOR_POINTER_RE.search(attrs):
            continue
        if FOCUS_RING_RE.search(attrs):
            continue
        # If author opted in to role="button" semantics WITHOUT focus ring,
        # that's the worst case — flag harder. We still warn.
        line_no = text[: m.start()].count("\n") + 1
        is_button_role = bool(ROLE_BUTTON_RE.search(attrs))
        suffix = (
            " AND `role=\"button\"` — keyboard users get no focus indicator."
            if is_button_role else ""
        )
        msg = (
            f"<{m.group('tag')}> with `onClick` + `cursor-pointer` lacks "
            f"`focus-visible:ring`{suffix} Either use DS `<Button>` "
            "(which ships focus ring + keyboard semantics) or add "
            "`focus-visible:ring-2 focus-visible:ring-ring focus-visible:"
            "ring-offset-2` + `tabIndex={0}` + `onKeyDown` (Enter/Space) "
            "+ `role=\"button\"`. See docs/patterns/admin/"
            "state-coverage.md → focus."
        )
        # When suffix is empty, no terminal punctuation follows — patch it.
        if not suffix:
            msg = msg.replace("`focus-visible:ring` Either", "`focus-visible:ring`. Either")
        gaps.append(Gap(
            severity="warn",
            rule="clickable-without-focus-ring",
            file=rel,
            line=line_no,
            message=msg,
        ))
        if len(gaps) >= 5:
            break
    return gaps

def scan_file_for_async_fetch_no_skeleton(rel: str, text: str) -> list[Gap]:
    """A file with async-fetch signals that does NOT import or render Skeleton.
    Heuristic — some files compose loading state into a child component;
    warn-only."""
    if "components/data-table/" in rel:
        return []
    if rel in DOCUMENTED_HAND_ROLLS:
        return []
    if not ASYNC_FETCH_RE.search(text):
        return []
    if SKELETON_RE.search(text):
        return []
    # Locate the first signal for the citation.
    m = ASYNC_FETCH_RE.search(text)
    line_no = text[: m.start()].count("\n") + 1 if m else 1
    return [Gap(
        severity="warn",
        rule="async-fetch-no-skeleton",
        file=rel,
        line=line_no,
        message=(
            "File has async-fetch signals (useEffect+fetch / useSWR / "
            "useQuery / isLoading) but does not import or render `Skeleton`. "
            "Without a Skeleton placement, users see a blank flash or layout "
            "shift while data loads. Add `<Skeleton className=\"...\" />` "
            "matching the post-load shape, gated on the loading flag. "
            "Canonical: apps/pce/admin/app/(app)/my-surveys/page.tsx:187-198. "
            "See docs/patterns/admin/state-coverage.md → loading."
        ),
    )]

def scan_file_for_aria_combobox_required(rel: str, text: str) -> list[Gap]:
    """Flag aria-expanded / aria-haspopup / aria-autocomplete on <input> or
    <InputGroupInput> without role="combobox" in the same element opening tag.

    WCAG 4.1.2 (ARIA 1.2 §6.6 aria-expanded): these attributes are only
    allowed on roles that explicitly list them as supported — combobox is the
    relevant one for search inputs with a popup list. Without role="combobox"
    axe-core raises aria-allowed-attr (critical).
    """
    if "components/data-table/" in rel:
        return []
    gaps: list[Gap] = []
    for m in ARIA_COMBOBOX_ATTRS_RE.finditer(text):
        attrs = m.group("attrs") + m.group("trigger")
        # If role="combobox" is already in the same opening tag, it's fine.
        if ROLE_COMBOBOX_RE.search(attrs):
            continue
        line_no = text[: m.start()].count("\n") + 1
        trigger = m.group("trigger")
        gaps.append(Gap(
            severity="block",
            rule="aria-combobox-required",
            file=rel,
            line=line_no,
            message=(
                f"`{trigger}` on `<input>` / `<InputGroupInput>` requires "
                "`role=\"combobox\"` on the same element — without it axe-core "
                "raises aria-allowed-attr (critical). Add `role=\"combobox\"` "
                "to the input and `id` + `role=\"listbox\"` to the popup. "
                "Canonical: apps/exam-management/admin/components/search-input.tsx"
            ),
        ))
        if len(gaps) >= 3:
            break
    return gaps


def scan_file_for_nested_main_landmark(rel: str, text: str) -> list[Gap]:
    """Flag <main> inside a file that also imports SidebarInset.

    DS SidebarInset renders as <main data-slot="sidebar-inset"> in the DOM.
    Adding a second <main> creates landmark-no-duplicate-main (moderate) and
    landmark-main-is-top-level (moderate) across every page in the product.
    Source: PCE layout.tsx fix 2026-05-22 introduced nested <main>.

    Exemption: the DS source itself (exxat-ds/, studentUX/).
    """
    if "exxat-ds/" in rel or "studentUX/" in rel:
        return []
    if not SIDEBAR_INSET_IMPORT_RE.search(text):
        return []
    for m in MAIN_ELEMENT_OPEN_RE.finditer(text):
        # Skip matches inside comments: // ... or {/* ... */}
        line_start = text.rfind("\n", 0, m.start()) + 1
        line_text = text[line_start: text.find("\n", m.start())]
        stripped = line_text.lstrip()
        if stripped.startswith("//") or stripped.startswith("*") or "{/*" in line_text:
            continue
        line_no = text[: m.start()].count("\n") + 1
        return [Gap(
            severity="block",
            rule="nested-main-landmark",
            file=rel,
            line=line_no,
            message=(
                "`<main>` element found in a file that imports `SidebarInset`. "
                "DS `SidebarInset` already renders as `<main data-slot=\"sidebar-inset\">` "
                "— adding a second `<main>` creates a nested landmark violation "
                "(WCAG 4.1.1 / aria-landmark-no-duplicate-main). "
                "Remove the `<main>` wrapper; use a `<div>` instead. "
                "To support skip-link focus, add `id=\"main-content\" tabIndex={-1}` "
                "to the `SidebarInset` prop (if it passes unknown props to its element)."
            ),
        )]
    return []


def scan_file_for_color_mix_contrast_risk(rel: str, text: str) -> list[Gap]:
    """Flag color-mix() used as backgroundColor / background in inline styles
    on non-decorative elements.

    color-mix() with oklch or hsl tokens produces computed colors whose
    contrast ratio cannot be verified at static-analysis time. This is warn-only;
    the author must verify in the visual-check browser run (axe measures contrast
    against the actual rendered color).

    Source: PCE root page badge used color-mix() → 2.46:1 contrast (needs 4.5:1).
    Exempts: CSS files, theme files, decorative containers.
    """
    if rel.endswith(".css") or "theme" in rel.lower():
        return []
    gaps: list[Gap] = []
    for m in COLOR_MIX_INLINE_BG_RE.finditer(text):
        line_no = text[: m.start()].count("\n") + 1
        gaps.append(Gap(
            severity="warn",
            rule="color-mix-contrast-risk",
            file=rel,
            line=line_no,
            message=(
                "`color-mix()` used as `backgroundColor`/`background` in an "
                "inline style. The resulting contrast ratio cannot be verified "
                "statically — must be confirmed in the visual-check axe run "
                "(WCAG 1.4.3: text ≥4.5:1, UI ≥3:1). "
                "If the element contains text, verify contrast using the browser "
                "DevTools color picker. Prefer DS token pairs with known contrast."
            ),
        ))
        if len(gaps) >= 3:
            break
    return gaps


def scan_file_for_ferpa_data_coexistence(rel: str, text: str) -> list[Gap]:
    """FERPA §99.31 data-flow check.

    A component that receives BOTH a student identifier (studentId,
    studentName, studentEmail) AND response/answer text (responseText,
    responseBody, answerText) in the same file risks linking a student's
    identity to their survey or exam response.

    This is a manual-review flag — the correct fix is server-side data
    separation (strip the student ID before this component receives data),
    not a UI-only change.
    """
    if rel in DOCUMENTED_HAND_ROLLS:
        return []
    has_student_id = bool(FERPA_STUDENT_ID_RE.search(text))
    has_response = bool(FERPA_RESPONSE_TEXT_RE.search(text))
    if not (has_student_id and has_response):
        return []
    # Cite the first student-ID hit for a concrete line number.
    m = FERPA_STUDENT_ID_RE.search(text)
    line_no = text[: m.start()].count("\n") + 1 if m else None
    return [Gap(
        severity="block",
        rule="ferpa-student-id-with-response",
        file=rel,
        line=line_no,
        message=(
            "FERPA DATA-FLOW: component renders both a student identifier "
            "(studentId / studentName / studentEmail) and response text "
            "(responseText / responseBody / answerText). This risks linking "
            "a student's identity to their survey or exam response — "
            "FERPA §99.31 violation. Fix: strip the student identifier "
            "server-side before this component receives data. "
            "Flag requires manual review — the UI layer cannot fix this alone."
        ),
    )]

# ── DS migration coverage scanners (added 2026-05-29) ───────────────────────
# These are WARN-only: they identify vendored / hand-rolled components that
# can now be replaced by canonical exports from @exxatdesignux/ui. They are
# migration guides, not blocking violations.

# Signals used by scanner B (hand-rolled status badge).
_HAND_ROLLED_BADGE_NAME_RE = re.compile(
    r"(?:function|const|class)\s+\w*(?:StatusBadge|SurveyStatusBadge|"
    r"AssessmentStatusBadge|StatusDot)\w*\s*(?:[=(:<]|=>)",
    re.IGNORECASE,
)
_BADGE_CLASS_SIGNAL_RE = re.compile(
    r'className=["\'\`][^"\'\`]*'
    r'(?=.*\brounded(?:-(?:sm|md|lg|xl|2xl|full))?\b)'
    r'(?=.*\btext-xs\b)'
    r'(?=.*\b(?:draft|active|published|closed|pending|released)\b)'
    r'[^"\'\`]*["\'\`]',
    re.IGNORECASE,
)
_STATUS_BADGE_IMPORT_RE = re.compile(
    r"import\s*\{[^}]*\bStatusBadge\b[^}]*\}\s*from\s*['\"]@exxatdesignux/ui['\"]"
)

# Signals used by scanner D (hand-rolled export drawer).
_EXPORT_DRAWER_IMPORT_RE = re.compile(
    r"import\s*\{[^}]*\bExportDrawer\b[^}]*\}\s*from\s*['\"]@exxatdesignux/ui['\"]"
)
_EXPORT_KEYWORD_RE = re.compile(
    # lowercase `export` omitted — matches ES module `export default/function` syntax
    # and produces false positives on every TSX file that has a Sheet/Dialog.
    # Only uppercase `Export` (the UI label) and file-format keywords are checked.
    r"\b(?:download|csv|xlsx|Export|Download|CSV|XLSX)\b"
)
_SHEET_DIALOG_DRAWER_RE = re.compile(r"<\s*(?:Sheet|Dialog|Drawer)\b")

# Signals used by scanner C (missing ListPageTemplate).
_LOCAL_DATATABLE_IMPORT_RE = re.compile(
    r"import\s*\{[^}]*\bDataTable\b[^}]*\}\s*from\s*['\"]@/components/data-table['\"]"
)
_LIST_PAGE_TEMPLATE_IMPORT_RE = re.compile(
    r"import\s*\{[^}]*\bListPageTemplate\b[^}]*\}\s*from\s*['\"]@exxatdesignux/ui['\"]"
)


def scan_dir_for_vendored_ds_component(
    product: str, role: str, root: Path
) -> list[Gap]:
    """Directory-level check — detects vendored copies of components that
    @exxatdesignux/ui now exports directly.

    Called once per product (outside the per-file loop). Checks three well-known
    vendored component directories. Emits WARN rather than BLOCK — these are
    migration targets, not new violations.
    """
    def _is_vendored(comp_dir: Path) -> bool:
        """Return True if the directory looks like a vendored component rather
        than a thin re-export wrapper."""
        if not comp_dir.is_dir():
            return False
        tsx_files = list(comp_dir.glob("*.tsx")) + list(comp_dir.glob("*.ts"))
        if not tsx_files:
            return False
        # If there is more than one *.tsx / *.ts file, it's definitely vendored.
        if len(tsx_files) > 1:
            return True
        # Single index.tsx — check whether it imports from @exxatdesignux/ui
        index = comp_dir / "index.tsx"
        if not index.exists():
            index = comp_dir / "index.ts"
        if not index.exists():
            return True  # Single non-index file = vendored
        try:
            text = index.read_text(encoding="utf-8")
        except Exception:
            return True
        # If the single file re-exports from the DS package, it's a thin wrapper
        # (i.e., already migrated). Otherwise it's still vendored.
        if re.search(r"from\s*['\"]@exxatdesignux/ui['\"]", text):
            return False
        return True

    gaps: list[Gap] = []
    prefix = f"apps/{product}/{role}/"

    checks = [
        (
            root / "components" / "data-table",
            "vendored-datatable",
            "DataTable is vendored locally; @exxatdesignux/ui now exports DataTable "
            "directly — migrate to reduce drift. "
            "See docs/governance/ds-adoption.md → DataTable row.",
        ),
        (
            root / "components" / "key-metrics",
            "vendored-keymetrics",
            "KeyMetrics is vendored locally; @exxatdesignux/ui now exports KeyMetrics "
            "directly — migrate to reduce drift. "
            "See docs/governance/ds-adoption.md → KeyMetrics row.",
        ),
        (
            root / "components" / "table-properties",
            "vendored-table-properties",
            "table-properties is vendored locally; @exxatdesignux/ui now exports "
            "TablePropertiesDrawer directly — migrate to reduce drift. "
            "See docs/governance/ds-adoption.md → TablePropertiesDrawer row.",
        ),
    ]

    for comp_dir, rule, message in checks:
        if not _is_vendored(comp_dir):
            continue
        short_comp_rel = str(comp_dir.relative_to(root))
        if short_comp_rel in DOCUMENTED_HAND_ROLLS:
            continue
        rel = prefix + short_comp_rel
        gaps.append(Gap(
            severity="warn",
            rule=rule,
            file=rel,
            line=None,
            message=message,
        ))

    return gaps


def scan_file_for_hand_rolled_status_badge(rel: str, text: str) -> list[Gap]:
    """Detect custom status badge components that should use StatusBadge from DS.

    Signals (any of these triggers the check):
      - Component/function name contains StatusBadge, SurveyStatusBadge,
        AssessmentStatusBadge, or StatusDot
      - className with rounded + text-xs + a status word (draft, active, etc.)

    Only flagged when StatusBadge is NOT already imported from @exxatdesignux/ui.
    Severity: WARN — migration guide.
    """
    if rel in DOCUMENTED_HAND_ROLLS:
        return []
    # Check if StatusBadge is already imported from DS
    if _STATUS_BADGE_IMPORT_RE.search(text):
        return []
    # Look for either signal
    name_match = _HAND_ROLLED_BADGE_NAME_RE.search(text)
    class_match = _BADGE_CLASS_SIGNAL_RE.search(text)
    m = name_match or class_match
    if not m:
        return []
    line_no = text[: m.start()].count("\n") + 1
    return [Gap(
        severity="warn",
        rule="hand-rolled-status-badge",
        file=rel,
        line=line_no,
        message=(
            "Custom status badge detected; StatusBadge from @exxatdesignux/ui "
            "covers this pattern (variants: pill / dot, sizes: xs / sm / md). "
            "Replace with: import { StatusBadge } from '@exxatdesignux/ui'. "
            "See docs/governance/ds-adoption.md → StatusBadge row."
        ),
    )]


def scan_file_for_missing_list_page_template(rel: str, text: str) -> list[Gap]:
    """Detect list pages that use a local DataTable without ListPageTemplate.

    Signals (all must be true):
      - File is a Next.js page file (has 'app/' in path, ends with page.tsx)
      - Imports DataTable from @/components/data-table
      - Does NOT import ListPageTemplate from @exxatdesignux/ui
      - File has at least 50 lines

    Severity: WARN — ListPageTemplate provides toolbar + view-switching and
    reduces boilerplate, but existing pages can migrate incrementally.
    """
    if rel in DOCUMENTED_HAND_ROLLS:
        return []
    # Only page files
    if "app/" not in rel or not rel.endswith("page.tsx"):
        return []
    # Only files that use local DataTable
    if not _LOCAL_DATATABLE_IMPORT_RE.search(text):
        return []
    # Already using ListPageTemplate
    if _LIST_PAGE_TEMPLATE_IMPORT_RE.search(text):
        return []
    # Minimum size — very short pages are probably not list pages
    if text.count("\n") < 49:
        return []
    # Cite the DataTable import line
    m = _LOCAL_DATATABLE_IMPORT_RE.search(text)
    line_no = text[: m.start()].count("\n") + 1 if m else 1
    return [Gap(
        severity="warn",
        rule="missing-list-page-template",
        file=rel,
        line=line_no,
        message=(
            "Page imports local DataTable without ListPageTemplate; "
            "consider @exxatdesignux/ui ListPageTemplate for built-in toolbar, "
            "view-switching, and URL-synced filter/sort state. "
            "import { ListPageTemplate } from '@exxatdesignux/ui'. "
            "See docs/governance/ds-adoption.md → ListPageTemplate row."
        ),
    )]


def scan_file_for_hand_rolled_export_drawer(rel: str, text: str) -> list[Gap]:
    """Detect hand-rolled export/download UI that should use ExportDrawer from DS.

    Signals (all must be true):
      - File contains <Sheet, <Dialog, or <Drawer JSX
      - File references export/download/csv/xlsx keywords in component or JSX context
      - ExportDrawer is NOT already imported from @exxatdesignux/ui

    Severity: WARN — migration guide.
    """
    if rel in DOCUMENTED_HAND_ROLLS:
        return []
    # Already using DS ExportDrawer
    if _EXPORT_DRAWER_IMPORT_RE.search(text):
        return []
    # Must have a sheet/dialog/drawer
    sheet_match = _SHEET_DIALOG_DRAWER_RE.search(text)
    if not sheet_match:
        return []
    # Must have export/download/csv/xlsx keywords
    if not _EXPORT_KEYWORD_RE.search(text):
        return []
    line_no = text[: sheet_match.start()].count("\n") + 1
    return [Gap(
        severity="warn",
        rule="hand-rolled-export-drawer",
        file=rel,
        line=line_no,
        message=(
            "Custom export/download sheet detected; ExportDrawer from "
            "@exxatdesignux/ui covers this pattern (file format selector, "
            "column picker, async progress). "
            "import { ExportDrawer } from '@exxatdesignux/ui'. "
            "See docs/governance/ds-adoption.md → ExportDrawer row."
        ),
    )]


_OVERFLOW_HIDDEN_RE = re.compile(r'\boverflow-hidden\b|["\']\s*overflow\s*:\s*hidden', re.IGNORECASE)
_POPOVER_TOOLTIP_TRIGGER_RE = re.compile(
    r'data-slot=["\'](?:popover|tooltip|select|combobox)-trigger["\']'
    r'|<PopoverTrigger|<TooltipTrigger|<SelectTrigger',
    re.IGNORECASE,
)
_GLOBALS_CSS_IMPORT_RE = re.compile(
    r'@import\s+["\'].*(?:globals|@exxatdesignux/ui).*\.css["\']'
    r'|import\s+["\'].*globals\.css["\']',
    re.IGNORECASE,
)


_OVERFLOW_PORTAL_SAFE_RE = re.compile(
    r"overflow-hidden\s+safe\s*[—-]\s*(?:floating\s+uses\s+)?Radix\s+Portal",
    re.IGNORECASE,
)

def scan_file_for_overflow_hidden_with_floating(rel: str, text: str) -> list[Gap]:
    """WARN: detect overflow-hidden on a container that also contains a popover
    / tooltip / select trigger in the same file.

    Popovers using Radix Portal are safe (content portals to body), but custom
    or non-portal variants get clipped. This rule flags co-presence to prompt
    manual review — a false positive rate is expected.

    Suppression: add a comment containing "overflow-hidden safe — Radix Portal"
    anywhere in the file to acknowledge that all floats use Radix Portal.

    Added 2026-06-01 after Romit reported popovers being cut off in produced UI.
    """
    if rel in DOCUMENTED_HAND_ROLLS:
        return []
    if not _OVERFLOW_HIDDEN_RE.search(text):
        return []
    if not _POPOVER_TOOLTIP_TRIGGER_RE.search(text):
        return []
    # If the file has been audited and all floats confirmed to use Radix Portal,
    # a suppression comment silences this rule.
    if _OVERFLOW_PORTAL_SAFE_RE.search(text):
        return []
    # Only flag if the overflow-hidden and trigger appear on different lines
    # (same-line = inline style on the trigger itself, unlikely to clip)
    overflow_lines = {i + 1 for i, ln in enumerate(text.splitlines()) if _OVERFLOW_HIDDEN_RE.search(ln)}
    trigger_lines  = {i + 1 for i, ln in enumerate(text.splitlines()) if _POPOVER_TOOLTIP_TRIGGER_RE.search(ln)}
    if overflow_lines == trigger_lines:
        return []
    first_overflow = min(overflow_lines)
    return [Gap(
        severity="warn",
        rule="overflow-hidden-with-floating",
        file=rel,
        line=first_overflow,
        message=(
            "overflow-hidden detected in same file as a popover/tooltip/select trigger. "
            "If the trigger is inside the overflow container AND not using Radix Portal, "
            "the floating content will be clipped. Verify: open the floating element in the "
            "browser and check getBoundingClientRect() is fully inside the viewport. "
            "Radix Portal components (PopoverContent, TooltipContent, DropdownMenuContent) "
            "are safe; custom absolute-positioned floats are not."
        ),
    )]


def scan_file_for_missing_globals_css(rel: str, text: str) -> list[Gap]:
    """WARN: admin layout.tsx / globals.css files that don't import DS globals.

    If globals.css is not imported, CSS tokens (--background, --primary, etc.)
    are undefined → all DS component colors fall back to browser defaults →
    color mismatch. This is the #1 cause of "wrong color" bugs.

    Added 2026-06-01 after Romit reported color mismatches in produced UI.
    """
    # Only check layout files and global CSS entry points
    basename = Path(rel).name
    if basename not in {"layout.tsx", "globals.css", "layout.ts"}:
        return []
    # layout.tsx must import globals.css — only check ROOT layout (app/layout.tsx),
    # not nested group layouts like app/(app)/layout.tsx which inherit from root.
    if basename in {"layout.tsx", "layout.ts"}:
        # Skip nested route-group layouts (path contains a segment like (app), (admin), etc.)
        # Root layout path: apps/<product>/<role>/app/layout.tsx
        # Nested layout path: apps/<product>/<role>/app/(group)/layout.tsx
        parts = Path(rel).parts
        app_idx = next((i for i, p in enumerate(parts) if p == "app"), None)
        if app_idx is None:
            return []
        segments_after_app = parts[app_idx + 1 :]
        # If there's a route-group segment (surrounded by parens) before layout.tsx, skip
        if any(s.startswith("(") and s.endswith(")") for s in segments_after_app[:-1]):
            return []
        has_css_import = bool(re.search(r'import\s+["\']\..*globals\.css["\']', text))
        if not has_css_import:
            return [Gap(
                severity="warn",
                rule="layout-missing-globals-css",
                file=rel,
                line=1,
                message=(
                    "layout.tsx does not import globals.css. "
                    "Without this, @exxatdesignux/ui CSS tokens (--background, --primary, "
                    "--card, --border, etc.) are undefined — all DS colors fall back to "
                    "browser defaults, causing color mismatch across the entire app. "
                    "Add: import './globals.css' (or the correct relative path)."
                ),
            )]
    # globals.css must @import the DS package CSS
    if basename == "globals.css":
        if not _GLOBALS_CSS_IMPORT_RE.search(text):
            return [Gap(
                severity="warn",
                rule="globals-css-missing-ds-import",
                file=rel,
                line=1,
                message=(
                    "globals.css does not @import '@exxatdesignux/ui/globals.css' "
                    "(or equivalent). DS tokens will not be defined. "
                    "Add: @import '@exxatdesignux/ui/globals.css'; as the first line."
                ),
            )]
    return []


def scan_filename_for_ds_organism(rel: str) -> list[Gap]:
    """Flag a custom file whose stem matches a DS organism in the registry."""
    if rel in ALLOWED_ORGANISM_PATHS:
        return []
    if rel in DOCUMENTED_HAND_ROLLS:
        return []
    if "components/data-table/" in rel:
        return []
    if "components/table-properties/" in rel:
        return []
    stem = Path(rel).stem.lower()
    if stem not in DS_ORGANISM_NAMES:
        return []
    # Grandfathered pre-existing violations downgrade to warn so phase-1 strict
    # mode can ship without blocking commits on their stable pages.
    if rel in GRANDFATHERED_ORGANISM_COLLISIONS:
        return [Gap(
            severity="warn",
            rule="organism-name-collision-grandfathered",
            file=rel,
            line=None,
            message=(
                f"GRANDFATHERED — file `{rel}` is named like DS organism `{stem}` "
                "and predates the registry. Tracked for migration in "
                "docs/governance/ds-adoption.md → Grandfathered hand-rolls. "
                "Removing this from GRANDFATHERED_ORGANISM_COLLISIONS in the "
                "audit script after migration restores block-on-new behavior."
            ),
        )]
    return [Gap(
        severity="block",
        rule="organism-name-collision",
        file=rel,
        line=None,
        message=(
            f"File `{rel}` is named like DS organism `{stem}`. Either import the "
            "canonical (see docs/governance/ds-adoption.md), vendor it into a "
            "components/<organism>/ directory, or rename + add to 'Documented "
            "hand-rolls' in the registry."
        ),
    )]

# ── Orchestration ───────────────────────────────────────────────────────────
def discover_products() -> list[tuple[str, str, Path]]:
    """Return list of (product, role, dir) tuples for every app/<product>/<role>/."""
    out: list[tuple[str, str, Path]] = []
    if not APPS_DIR.exists():
        return out
    for product_dir in sorted(APPS_DIR.iterdir()):
        if not product_dir.is_dir():
            continue
        for role_dir in sorted(product_dir.iterdir()):
            if not role_dir.is_dir():
                continue
            if role_dir.name not in {"admin", "student"}:
                continue
            out.append((product_dir.name, role_dir.name, role_dir))
    return out

def iter_source_files(root: Path):
    for path in root.rglob("*"):
        if not path.is_file():
            continue
        if path.suffix not in {".tsx", ".ts"}:
            continue
        rel = path.relative_to(REPO_ROOT)
        rel_str = str(rel)
        if "node_modules" in rel.parts or ".next" in rel.parts:
            continue
        # Skip auto-generated backup snapshots (not product code)
        if ".exxat-ui" in rel.parts:
            continue
        if rel_str.endswith(".d.ts"):
            continue
        yield path, rel_str

def audit_product(product: str, role: str, root: Path) -> ProductReport:
    report = ProductReport(product=product, role=role)

    # Scanner A — directory-level vendored-component check (once per product).
    for g in scan_dir_for_vendored_ds_component(product, role, root):
        report.gaps.append(g)

    for path, rel in iter_source_files(root):
        report.pages_scanned += 1
        try:
            text = path.read_text(encoding="utf-8")
        except Exception:
            continue
        # Strip the apps/<product>/<role>/ prefix for cleaner messages
        prefix = f"apps/{product}/{role}/"
        short_rel = rel.removeprefix(prefix) if rel.startswith(prefix) else rel
        # Each scanner takes the SHORT path (e.g., "components/foo.tsx") so
        # allowlist checks line up.
        for fn in (
            scan_file_for_raw_table,
            scan_file_for_bare_card,
            scan_file_for_card_imposter_div,
            scan_file_for_eyebrow_paragraph,
            scan_file_for_raw_button,
            # State-coverage scanners (phase-0 warn) — added 2026-05-11.
            scan_file_for_datatable_no_empty_state,
            scan_file_for_dialog_no_error_feedback,
            scan_file_for_opacity_60_on_text_parent,
            scan_file_for_clickable_without_focus_ring,
            scan_file_for_async_fetch_no_skeleton,
            # FERPA data-flow check — added 2026-05-17.
            scan_file_for_ferpa_data_coexistence,
            # WCAG ARIA + landmark checks — added 2026-05-22.
            scan_file_for_aria_combobox_required,
            scan_file_for_nested_main_landmark,
            scan_file_for_color_mix_contrast_risk,
            # DS migration coverage (WARN) — added 2026-05-29.
            scan_file_for_hand_rolled_status_badge,
            scan_file_for_missing_list_page_template,
            scan_file_for_hand_rolled_export_drawer,
            # Visual rendering safety (WARN) — added 2026-06-01.
            # Catches overflow-clipped popovers + missing globals.css (color mismatch).
            scan_file_for_overflow_hidden_with_floating,
            scan_file_for_missing_globals_css,
        ):
            for g in fn(short_rel, text):
                g.file = rel
                report.gaps.append(g)
        for g in scan_filename_for_ds_organism(short_rel):
            g.file = rel
            report.gaps.append(g)
        for g in scan_file_for_color_literals(short_rel, text):
            g.file = rel
            report.gaps.append(g)
    return report

def render_text(reports: list[ProductReport]) -> str:
    lines: list[str] = []
    lines.append("# DS Adoption Audit\n")
    lines.append(f"Registry: docs/governance/ds-adoption.md\n")
    total_block = sum(r.block_count for r in reports)
    total_warn = sum(r.warn_count for r in reports)
    total_pages = sum(r.pages_scanned for r in reports)
    lines.append(f"Scanned {total_pages} source files across {len(reports)} apps.\n")
    lines.append(f"**{total_block} blocking** + **{total_warn} warning** gaps found.\n")
    for r in reports:
        lines.append(f"\n## {r.product} · {r.role}  ({r.block_count} block, {r.warn_count} warn)\n")
        if not r.gaps:
            lines.append("_clean_\n")
            continue
        # group by rule
        by_rule: dict[str, list[Gap]] = {}
        for g in r.gaps:
            by_rule.setdefault(g.rule, []).append(g)
        for rule, gaps in sorted(by_rule.items(), key=lambda kv: (-len(kv[1]), kv[0])):
            sev = gaps[0].severity.upper()
            lines.append(f"\n### {sev} · {rule}  ({len(gaps)})\n")
            for g in gaps[:25]:  # cap each rule's list for readability
                loc = f":{g.line}" if g.line else ""
                lines.append(f"- `{g.file}{loc}`")
                if rule == "organism-name-collision":
                    lines.append(f"  {g.message}")
            if len(gaps) > 25:
                lines.append(f"  … and {len(gaps) - 25} more")
            # Single message per rule
            if rule != "organism-name-collision":
                lines.append(f"\n  → {gaps[0].message}")
    lines.append("")
    return "\n".join(lines)

def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--strict", action="store_true", help="Exit 1 if any blocking gap.")
    ap.add_argument(
        "--strict-rules",
        help=(
            "Comma-separated rule slugs to block on (others stay warn). "
            "Default: all blocking rules. "
            "State-coverage rules (phase-0 warn, candidate promotion to block): "
            "datatable-no-empty-state, dialog-no-error-feedback, "
            "opacity-60-on-text-parent, clickable-without-focus-ring, "
            "async-fetch-no-skeleton. Promote each to block once the audit "
            "shows 0 hits across all products."
        ),
    )
    ap.add_argument("--product", help="Scope to one product (e.g., pce, exam-management).")
    ap.add_argument("--json", action="store_true", help="Machine-readable JSON output.")
    ap.add_argument(
        "--touched-files",
        metavar="FILES",
        help=(
            "Newline-or-space-separated list of repo-relative paths staged for commit. "
            "Restricts output to only these files and promotes migration WARN rules "
            "(raw-html-button, hand-rolled-export-drawer, color-mix-contrast-risk, "
            "vendored-datatable, missing-list-page-template, card-shape-masquerade, "
            "hand-rolled-status-badge) to BLOCK — the touch-gate. "
            "Combine with --strict to exit 1 on any promoted violation."
        ),
    )
    args = ap.parse_args()

    products = discover_products()
    if args.product:
        products = [p for p in products if p[0] == args.product]

    reports = [audit_product(prod, role, root) for prod, role, root in products]

    # ── Touch-gate filter ────────────────────────────────────────────────────
    # When --touched-files is given (called from pre-commit with staged paths),
    # restrict the report to those files and promote migration WARNs to BLOCK.
    if args.touched_files:
        raw_paths = args.touched_files.replace("\n", " ").split()
        touched_abs: set[Path] = {
            (REPO_ROOT / p.strip()).resolve() for p in raw_paths if p.strip()
        }

        # Rules promoted WARN → BLOCK when the containing file is staged.
        # These are "migration targets" — the touch forces the migration.
        TOUCH_PROMOTE_RULES = {
            "raw-html-button",
            "hand-rolled-export-drawer",
            "color-mix-contrast-risk",
            "vendored-datatable",
            "missing-list-page-template",
            "card-shape-masquerade",
            "hand-rolled-status-badge",
        }

        filtered: list[ProductReport] = []
        for r in reports:
            promoted_gaps: list[Gap] = []
            for g in r.gaps:
                gap_abs = (REPO_ROOT / g.file).resolve()
                # Directory-level gaps (vendored-datatable) hit if any staged file
                # lives inside the flagged directory.
                in_touched = gap_abs in touched_abs or any(
                    str(t).startswith(str(gap_abs)) or gap_abs == t
                    for t in touched_abs
                )
                if not in_touched:
                    continue
                if g.severity == "warn" and g.rule in TOUCH_PROMOTE_RULES:
                    g = Gap(
                        severity="block",
                        rule=g.rule,
                        file=g.file,
                        line=g.line,
                        message=g.message + " [promoted: touch-gate]",
                    )
                promoted_gaps.append(g)
            if promoted_gaps:
                rpt = ProductReport(
                    product=r.product,
                    role=r.role,
                    pages_scanned=r.pages_scanned,
                )
                rpt.gaps = promoted_gaps
                filtered.append(rpt)
        reports = filtered

        if not reports:
            if not args.json:
                print("DS touch-gate: clean — no DS violations in staged files.")
            sys.exit(0)

    if args.json:
        data = [
            {
                "product": r.product,
                "role": r.role,
                "pages_scanned": r.pages_scanned,
                "blocks": r.block_count,
                "warns": r.warn_count,
                "gaps": [g.__dict__ for g in r.gaps],
            }
            for r in reports
        ]
        print(json.dumps(data, indent=2))
    else:
        print(render_text(reports))

    if args.strict:
        strict_rules: set[str] | None = None
        if args.strict_rules:
            strict_rules = {r.strip() for r in args.strict_rules.split(",") if r.strip()}
        blocking_gaps = [
            g for r in reports for g in r.gaps
            if g.severity == "block"
            and (strict_rules is None or g.rule in strict_rules)
        ]
        if blocking_gaps:
            sys.exit(1)

if __name__ == "__main__":
    main()
