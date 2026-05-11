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
            rule="card-imposter-div",
            file=rel,
            line=line_no,
            message=(
                "<div> with rounded + border + padding looks like Card chrome. "
                "Use DS Card (or Card size=\"sm\") with CardHeader / CardTitle / "
                "CardDescription / CardContent slots — see "
                "docs/governance/ds-adoption.md → Card row."
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
            rule="eyebrow-paragraph-outside-card",
            file=rel,
            line=line_no,
            message=(
                "`<p>` with `uppercase tracking-wide` is the DS CardDescription "
                "eyebrow pattern. If this is a section header, use CardDescription "
                "inside a Card; otherwise consider Badge. Bare `<p>` will drift "
                "from DS treatments over time."
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
        help="Comma-separated rule slugs to block on (others stay warn). Default: all blocking rules.",
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
