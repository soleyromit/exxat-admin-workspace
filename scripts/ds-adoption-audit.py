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
    """Flag hex / rgb literals. Theme files are exempt."""
    if rel.endswith(".css"):
        return []
    if "theme" in rel.lower():
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
        if rel_str.endswith(".d.ts"):
            continue
        yield path, rel_str

def audit_product(product: str, role: str, root: Path) -> ProductReport:
    report = ProductReport(product=product, role=role)
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
    args = ap.parse_args()

    products = discover_products()
    if args.product:
        products = [p for p in products if p[0] == args.product]

    reports = [audit_product(prod, role, root) for prod, role, root in products]

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
