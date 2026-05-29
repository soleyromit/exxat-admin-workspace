#!/usr/bin/env python3
"""Regenerate docs/watch/ds-snapshot.json from the installed @exxatdesignux/ui package.

Reads dist/index.d.ts from the first app that has the package installed, extracts
all exported component/hook names, categorises them, then merges with any existing
per-component metadata (variants, sizes, keyProps) from the current snapshot.

"Component/hook names" means:
  - PascalCase exports  (Button, DataTable, ListPageTemplate, ...)
  - use* hook exports   (useTableState, useSidebar, ...)
  - SCREAMING_SNAKE constants that are part of the public API surface

Lower-camelCase utility functions (cn, devLog, columnsToFieldDefinitions, ...)
and standalone TypeScript type exports are excluded.

Usage:
    python3 scripts/regen-ds-snapshot.py            # regenerate snapshot in-place
    python3 scripts/regen-ds-snapshot.py --dry-run  # print what would be written

The script is also called from scripts/git-hooks/pre-commit as step [0/6].
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from collections import Counter
from datetime import date
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
OUT_PATH  = REPO_ROOT / "docs" / "watch" / "ds-snapshot.json"

# Ordered list of candidate node_modules locations to search.
CANDIDATE_ROOTS = [
    REPO_ROOT / "apps" / "pce" / "admin" / "node_modules" / "@exxatdesignux" / "ui",
    REPO_ROOT / "apps" / "exam-management" / "admin" / "node_modules" / "@exxatdesignux" / "ui",
    REPO_ROOT / "apps" / "portal" / "admin" / "node_modules" / "@exxatdesignux" / "ui",
]

IMPORT_PATH = "@exxatdesignux/ui"

# ── Name filtering ────────────────────────────────────────────────────────────

def _is_component_or_hook(name: str) -> bool:
    """Return True if the name is a UI component, hook, or notable constant.

    Included:
      - PascalCase names: Button, DataTable, HubTable, ListPageTemplate, ...
      - use* hooks: useTableState, useSidebar, useCoachMark, ...
      - ALL_CAPS_SNAKE constants: LIST_PAGE_SPLIT_HUB_HEIGHT_STYLE, etc.

    Excluded:
      - lowerCamelCase utilities: cn, devLog, columnsToFieldDefinitions, ...
      - Props/Variants TypeScript types (filtered at export level as type-only)
    """
    if not name:
        return False
    first = name[0]
    # PascalCase: starts with uppercase letter
    if first.isupper() and name[1:2] != "_":
        return True
    # use* hooks: starts with lowercase 'use' + uppercase
    if re.match(r"^use[A-Z]", name):
        return True
    # ALL_CAPS_SNAKE constants
    if re.match(r"^[A-Z][A-Z0-9_]+$", name):
        return True
    return False


# ── Categorisation rules ──────────────────────────────────────────────────────
# Rules are checked in order; first match wins.

def _categorise(name: str) -> str:
    """Return the category bucket for an exported name."""

    # hooks — use* lowercase-start
    if re.match(r"^use[A-Z]", name):
        return "hooks"

    # framework — product registry / tenant / brand infra
    # Matches PascalCase framework components and constants.
    if re.search(
        r"(?:^Product|^Tenant|^Brand|^ExxatPalette|^CustomProduct|"
        r"^BRAND_|^EXXAT_ONE|^EXXAT_PRISM|^TENANT_|^BUILDER_|^DEFAULT_SHIPPED|"
        r"^RESERVED_PRODUCT|^SHIPPED_CATALOG|^TENANT_STORE|^TENANT_PRODUCT|"
        r"defineProduct|defineProductBrand|registerProduct|listRegistered|"
        r"getRegistered|resolveProduct|asBuiltInProduct|isBuiltIn|isReserved|"
        r"productRoute|validateCustom|isProductAuth|getRuntimeProduct|"
        r"isPlatformCreator|setRuntime|primaryNavLinks|productBrand|"
        r"getProductBrand|listProductBrands|buildNavHash|collectNavUrls|"
        r"isNavHref|navUrl|normalizePathname|normalizedLocation|resolveActive)",
        name,
    ):
        return "framework"

    # templates — page-level shells / layout templates
    if re.search(
        r"(?:Template$|Shell$|^ListPageLoadingFallback|^DedicatedSearch|"
        r"^NestedSecondary)",
        name,
    ):
        return "templates"
    # ListPage* — most are templates, but Board/Tree/Split/Connected/View are data_views
    if re.match(r"^ListPage(?!Board|Tree|Split|Connected|View)", name):
        return "templates"

    # data_views — hub tables, board cards, finder/folder views, outline trees
    if re.search(
        r"(?:^HubTable|^HubRecord|^DataRowList|^FinderPanel|^FinderGroup|"
        r"^FolderGrid|^ListPageBoard|^ListPageTree|^ListPageSplit|"
        r"^ListPageConnected|^ListPageView|^OutlineTree|^BoardCard|"
        r"^BoardLine|^BoardNew|^OsFolder|^FolderGlyph|"
        r"^LIST_PAGE_SPLIT|^OUTLINE_TREE|^LIST_PAGE_SPLIT_HUB|"
        r"^LIST_PAGE_SPLIT_MILLER|^DATA_LIST_SURFACE|^DATA_LIST_VIEW|"
        r"^FULL_HUB|^PRIMARY_HUB|"
        r"columnsToField|columnsToFilter|BulkAction|CreatedViewSpec|"
        r"HubTableHandle|HubTableProps|HubTableRender|HubDrawer|"
        r"PersistedLifecycle|PersistedPage|SeedTable|TableStatePersist|"
        r"UseTableStateLifecycle|lifecycleStorage|loadLifecycle|loadPage|"
        r"pageStorage|parsePersistedLifecycle|parsePersistedPage|"
        r"readLifecycle|scheduleLifecycle|schedulePage|seedTableState|"
        r"serializeLifecycle|DataListView|dataListView|getDataListView|"
        r"isDataList|showsList|usesDashboard|usesData|usesToolbar|"
        r"BoardLineCount|DEFAULT_DATA_LIST|DataListDisplay)",
        name,
    ):
        return "data_views"

    # organisms — composite DS-level page components
    if re.search(
        r"(?:^DataTable$|^DataTableExtended|^DataTableToolbar|^DataTablePaginated|"
        r"^CountSyncer|^PaginationBar|^FilterDateCalendar|^FilterTextValue|"
        r"^KeyMetrics|^TableProperties|^ExportDrawer|"
        r"^PageHeader|^StatusBadge|^CoachMark|^DataListView|"
        r"^ListPageViewFrame|^LIST_PAGE_VIEW_FRAME|"
        r"OpenTableProperties|createListPage|DrawerFilter|DrawerSort|"
        r"ColumnRow|useDraggable|"
        r"ConditionalColumn|conditionalRule|getConditional|"
        r"^DROPDOWN_MENU_CONTENT|^KeyMetricsContext|^KeyMetricsProvider|"
        r"useKeyMetricsContext|^CellContext|^ColumnDef|^DataTableProps|"
        r"^PaginationConfig|^SortDir|^useTableState)",
        name,
    ):
        return "organisms"

    # primitives — everything else (core UI building blocks)
    return "primitives"


# ── Parser ────────────────────────────────────────────────────────────────────

def extract_exports(dts_text: str) -> list[str]:
    """Extract component/hook names from a dist/index.d.ts file.

    Handles lines like:
        export { Foo, Bar, Baz as Qux } from './...';
    Returns the exported (local alias) names, filtering to PascalCase,
    use* hooks, and SCREAMING_SNAKE constants. Skips type-only entries.
    """
    names: list[str] = []
    brace_re = re.compile(r"export\s*\{([^}]+)\}", re.MULTILINE)
    for m in brace_re.finditer(dts_text):
        block = m.group(1)
        for raw in block.split(","):
            raw = raw.strip()
            if not raw:
                continue
            # Skip type-only: `type Foo` or `type Foo as Bar`
            if raw.startswith("type "):
                continue
            # `Foo as Bar` — the exported name is `Bar`
            if " as " in raw:
                exported = raw.split(" as ")[1].strip()
            else:
                exported = raw.strip()
            if exported and _is_component_or_hook(exported):
                names.append(exported)
    return names


def find_package(candidates: list[Path]) -> Path | None:
    """Return the first candidate directory that contains dist/index.d.ts."""
    for root in candidates:
        dts = root / "dist" / "index.d.ts"
        if dts.exists():
            return root
    return None


def read_version(pkg_root: Path) -> str:
    """Read version from package.json, fallback to 'unknown'."""
    pkg_json = pkg_root / "package.json"
    if not pkg_json.exists():
        return "unknown"
    try:
        data = json.loads(pkg_json.read_text(encoding="utf-8"))
        return data.get("version", "unknown")
    except Exception:
        return "unknown"


def load_existing_snapshot() -> dict:
    """Load the current snapshot for metadata preservation, or return {}."""
    if not OUT_PATH.exists():
        return {}
    try:
        return json.loads(OUT_PATH.read_text(encoding="utf-8"))
    except Exception:
        return {}


# ── Main ──────────────────────────────────────────────────────────────────────

def build_snapshot(dry_run: bool = False) -> int:
    """Build and optionally write the snapshot. Returns exit code (0=ok, 2=skip)."""
    pkg_root = find_package(CANDIDATE_ROOTS)
    if pkg_root is None:
        checked = "\n  ".join(str(c) for c in CANDIDATE_ROOTS)
        print(
            f"SKIP: @exxatdesignux/ui not found in any candidate location:\n  {checked}",
            file=sys.stderr,
        )
        return 2  # 2 = package not installed; caller should skip, not fail

    dts_path = pkg_root / "dist" / "index.d.ts"
    version  = read_version(pkg_root)
    dts_text = dts_path.read_text(encoding="utf-8")

    # Extract + deduplicate
    raw_names = extract_exports(dts_text)
    seen: set[str] = set()
    names: list[str] = []
    for n in raw_names:
        if n not in seen:
            seen.add(n)
            names.append(n)

    # Load existing snapshot to preserve per-component metadata
    existing = load_existing_snapshot()
    existing_components: dict = existing.get("components", {})

    # Build component map (sorted for stable diffs)
    components: dict[str, dict] = {}
    for name in sorted(names):
        category = _categorise(name)
        entry: dict = {
            "importPath": IMPORT_PATH,
            "category": category,
        }
        # Preserve rich metadata from existing snapshot if known
        if name in existing_components:
            prev = existing_components[name]
            for preserve_key in ("variants", "sizes", "keyProps", "note"):
                if preserve_key in prev:
                    entry[preserve_key] = prev[preserve_key]

        components[name] = entry

    snapshot = {
        "generated": date.today().isoformat(),
        "source": IMPORT_PATH,
        "version": version,
        "componentCount": len(components),
        "components": components,
    }

    output_text = json.dumps(snapshot, indent=2)

    if dry_run:
        print(f"-- dry-run: would write {OUT_PATH.relative_to(REPO_ROOT)}")
        print(f"   source:  {dts_path.relative_to(REPO_ROOT)}")
        print(f"   version: {version}")
        print(f"   exports: {len(components)} component/hook names")
        counts = Counter(e["category"] for e in components.values())
        for cat, cnt in sorted(counts.items()):
            print(f"   {cat:15s}: {cnt}")
        return 0

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(output_text, encoding="utf-8")

    counts = Counter(e["category"] for e in components.values())
    breakdown = ", ".join(f"{cnt} {cat}" for cat, cnt in sorted(counts.items()))
    print(f"ds-snapshot: {len(components)} exports from {IMPORT_PATH} v{version}")
    print(f"  categories: {breakdown}")
    print(f"  written → {OUT_PATH.relative_to(REPO_ROOT)}")
    return 0


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument(
        "--dry-run",
        action="store_true",
        help="Print what would be written without modifying the file.",
    )
    args = ap.parse_args()
    sys.exit(build_snapshot(dry_run=args.dry_run))


if __name__ == "__main__":
    main()
