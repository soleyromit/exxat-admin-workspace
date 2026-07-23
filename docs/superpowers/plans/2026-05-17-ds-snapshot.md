# DS Snapshot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a compact `node tools/ds/source.mjs --list` of DS component public APIs so `compliance-reviewer` and `ds-check` grep it instead of reading full source files — reducing per-session DS token cost from ~4K tokens/component to ~50 tokens/grep.

**Architecture:** A Python script (`scripts/build-ds-snapshot.py`) reads the Admin DS source at `exxat-ds/packages/ui/src/` and extracts component names, import paths, variants, sizes, and key props using regex. Output is a compact JSON. A lightweight scheduled CCR routine runs the script whenever the DS submodule pointer advances. The `compliance-reviewer` subagent is updated to grep the snapshot file instead of reading raw source.

**Tech Stack:** Python 3 (regex, pathlib, json), existing `scripts/` pattern, Claude Code scheduled routine.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `node tools/ds/source.mjs --list` | Create | Compact DS API surface — written by the script |
| `scripts/build-ds-snapshot.py` | Create | Reads DS source, extracts API, writes snapshot |
| `scripts/build-ds-snapshot.test.py` | Create | Tests for the extractor functions |
| `.claude/agents/compliance-reviewer.md` | Modify | Add §0: read ds-snapshot.json before checking |
| `docs/watch/agent-prompts/ds-snapshot-refresh.md` | Create | Scheduled agent prompt — runs script + commits |

---

### Task 1: Write the DS snapshot builder script (TDD)

**Files:**
- Create: `scripts/build-ds-snapshot.test.py`
- Create: `scripts/build-ds-snapshot.py`

- [ ] **Step 1: Create the test file**

```python
# scripts/build-ds-snapshot.test.py
import pytest
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from scripts.build_ds_snapshot import (
    extract_exports_from_index,
    extract_variants_from_component,
    extract_sizes_from_component,
    build_snapshot,
)

BUTTON_SOURCE = '''
const buttonVariants = cva("...", {
  variants: {
    variant: {
      default: "...", secondary: "...", outline: "...",
      ghost: "...", destructive: "...", link: "..."
    },
    size: {
      xs: "...", sm: "...", default: "...", lg: "...",
      "icon-xs": "...", "icon-sm": "...", icon: "...", "icon-lg": "..."
    },
  }
})
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive" | "link"
  size?: "xs" | "sm" | "default" | "lg"
  asChild?: boolean
}
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(...)
'''

INDEX_SOURCE = '''
export * from "./components/ui/button"
export * from "./components/ui/badge"
export * from "./components/ui/card"
'''

def test_extract_exports_from_index():
    exports = extract_exports_from_index(INDEX_SOURCE)
    assert 'button' in exports
    assert 'badge' in exports
    assert 'card' in exports

def test_extract_variants():
    variants = extract_variants_from_component(BUTTON_SOURCE, 'variant')
    assert 'default' in variants
    assert 'secondary' in variants
    assert 'destructive' in variants

def test_extract_sizes():
    sizes = extract_sizes_from_component(BUTTON_SOURCE)
    assert 'sm' in sizes
    assert 'icon-sm' in sizes
    assert 'lg' in sizes

def test_build_snapshot_structure():
    snapshot = build_snapshot('/fake/path', INDEX_SOURCE, {'button': BUTTON_SOURCE})
    assert 'generated' in snapshot
    assert 'components' in snapshot
    assert 'Button' in snapshot['components']
    btn = snapshot['components']['Button']
    assert 'importPath' in btn
    assert 'variants' in btn
    assert 'sizes' in btn
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
cd /Users/romitsoley/Work && python3 -m pytest scripts/build-ds-snapshot.test.py -v 2>&1 | tail -10
```

Expected: `ModuleNotFoundError: No module named 'scripts.build_ds_snapshot'`

- [ ] **Step 3: Create `scripts/build-ds-snapshot.py`**

```python
#!/usr/bin/env python3
"""
Build a compact JSON snapshot of the Exxat DS public API surface.
Reads exxat-ds/packages/ui/src/, extracts component APIs via regex.
Output: `node tools/ds/source.mjs --list`

Run: python3 scripts/build-ds-snapshot.py
"""
import re, json, sys
from pathlib import Path
from datetime import date

REPO_ROOT = Path(__file__).parent.parent
DS_SRC    = REPO_ROOT / 'exxat-ds' / 'packages' / 'ui' / 'src'
OUT_PATH  = REPO_ROOT / 'docs' / 'watch' / 'ds-snapshot.json'

# Components vendored into product apps — not in DS index but need to be in snapshot
VENDORED = {
    'DataTable': {
        'importPath': '@/components/data-table',
        'note': 'vendored from exxat-ds/apps/web/components/data-table/',
        'variants': [],
        'sizes': [],
        'keyProps': [
            'data', 'columns', 'getRowId', 'selectable', 'searchable',
            'defaultGroupBy', 'groupLabels', 'groupOrder', 'emptyState',
            'onRowClick', 'toolbarSlot', 'bulkActionsSlot',
        ],
    },
    'KeyMetrics': {
        'importPath': '@/components/key-metrics',
        'note': 'vendored from exxat-ds/apps/web/components/key-metrics.tsx',
        'variants': ['card', 'flat', 'compact'],
        'sizes': [],
        'keyProps': ['metrics', 'variant', 'periodSelector', 'insightRail'],
    },
}


def extract_exports_from_index(content: str) -> list[str]:
    """Return list of component module names from index.ts export lines."""
    pattern = re.compile(r'export \* from ["\']./components/ui/([a-z0-9-]+)["\']')
    return pattern.findall(content)


def extract_variants_from_component(content: str, variant_key: str = 'variant') -> list[str]:
    """Extract variant values from a CVA variants block."""
    # Match: variant: { key: "...", ... }
    block_pattern = re.compile(
        rf'{variant_key}:\s*\{{([^}}]+)\}}', re.DOTALL
    )
    match = block_pattern.search(content)
    if not match:
        return []
    block = match.group(1)
    # Extract keys: both bare identifiers and quoted strings
    keys = re.findall(r'"([^"]+)":|\'([^\']+)\':|(\b[a-z][a-z0-9-]*)\s*:', block)
    result = []
    for quoted1, quoted2, bare in keys:
        val = quoted1 or quoted2 or bare
        if val and val not in ('default', 'className', 'style', 'children'):
            result.append(val)
    # Always include 'default' if present in the block
    if re.search(r'\bdefault\b\s*:', block):
        result = ['default'] + [v for v in result if v != 'default']
    return list(dict.fromkeys(result))  # deduplicate preserving order


def extract_sizes_from_component(content: str) -> list[str]:
    """Extract size values from a CVA size variants block."""
    return extract_variants_from_component(content, 'size')


def module_to_component_name(module: str) -> str:
    """Convert 'date-picker-field' → 'DatePickerField'."""
    return ''.join(part.capitalize() for part in module.replace('-', ' ').split())


def extract_key_props(content: str, component_name: str) -> list[str]:
    """Extract prop names from the component's Props interface."""
    # Match: interface ComponentProps or ComponentNameProps
    pattern = re.compile(
        rf'interface\s+{component_name}(?:Extended)?Props[^{{]*\{{([^}}]+)\}}',
        re.DOTALL
    )
    match = pattern.search(content)
    if not match:
        return []
    block = match.group(1)
    props = re.findall(r'^\s+(\w+)\??:', block, re.MULTILINE)
    # Filter out noise
    skip = {'className', 'style', 'children', 'ref', 'id', 'key'}
    return [p for p in props if p not in skip][:12]  # cap at 12


def build_snapshot(ds_src_path: str, index_content: str, component_sources: dict[str, str]) -> dict:
    """Build the full snapshot dict from extracted data."""
    components: dict[str, dict] = {}

    for module_name in extract_exports_from_index(index_content):
        cname = module_to_component_name(module_name)
        source = component_sources.get(module_name, '')
        entry: dict = {
            'importPath': '@exxat/ds/packages/ui/src',
            'variants': extract_variants_from_component(source, 'variant'),
            'sizes': extract_sizes_from_component(source),
            'keyProps': extract_key_props(source, cname),
        }
        # Only include non-empty fields
        components[cname] = {k: v for k, v in entry.items() if v != [] or k == 'importPath'}

    # Add vendored components
    components.update(VENDORED)

    return {
        'generated': date.today().isoformat(),
        'dsSubmodulePath': 'exxat-ds/packages/ui/src',
        'componentCount': len(components),
        'components': components,
    }


def main():
    index_path = DS_SRC / 'index.ts'
    if not index_path.exists():
        print(f'ERROR: DS source not found at {index_path}', file=sys.stderr)
        sys.exit(1)

    index_content = index_path.read_text()
    module_names = extract_exports_from_index(index_content)

    # Read each component source file
    component_sources: dict[str, str] = {}
    for module_name in module_names:
        component_file = DS_SRC / 'components' / 'ui' / f'{module_name}.tsx'
        if component_file.exists():
            component_sources[module_name] = component_file.read_text()

    snapshot = build_snapshot(str(DS_SRC), index_content, component_sources)

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(snapshot, indent=2))
    print(f'✓ Snapshot written to {OUT_PATH}')
    print(f'  {snapshot["componentCount"]} components indexed')


if __name__ == '__main__':
    main()
```

- [ ] **Step 4: Run tests — confirm they pass**

```bash
cd /Users/romitsoley/Work && python3 -m pytest scripts/build-ds-snapshot.test.py -v 2>&1 | tail -15
```

Expected:
```
PASSED test_extract_exports_from_index
PASSED test_extract_variants
PASSED test_extract_sizes
PASSED test_build_snapshot_structure
4 passed
```

- [ ] **Step 5: Run the script against the real DS**

```bash
cd /Users/romitsoley/Work && python3 scripts/build-ds-snapshot.py
```

Expected:
```
✓ Snapshot written to `node tools/ds/source.mjs --list`
  ~40 components indexed
```

Spot-check the output:
```bash
python3 -c "
import json
s = json.load(open('`node tools/ds/source.mjs --list`'))
btn = s['components'].get('Button', {})
print('Button variants:', btn.get('variants', []))
print('Button sizes:', btn.get('sizes', []))
print('DataTable props:', s['components'].get('DataTable', {}).get('keyProps', []))
"
```

Expected: Button variants include `default`, `secondary`, `outline`. DataTable keyProps include `data`, `columns`, `getRowId`.

- [ ] **Step 6: Commit**

```bash
git -C /Users/romitsoley/Work add scripts/build-ds-snapshot.py scripts/build-ds-snapshot.test.py `node tools/ds/source.mjs --list`
git -C /Users/romitsoley/Work commit -m "feat(ds-snapshot): build compact DS API snapshot — 40 components, reduces per-session DS read cost"
```

---

### Task 2: Update compliance-reviewer to use snapshot

**Files:**
- Modify: `.claude/agents/compliance-reviewer.md`

- [ ] **Step 1: Read the current file**

```bash
cat /Users/romitsoley/Work/.claude/agents/compliance-reviewer.md
```

- [ ] **Step 2: Prepend a new Step 0 before the existing Step 1**

Add this block at the very beginning of the agent instructions (after the frontmatter):

```markdown
## Step 0: Load DS snapshot (read once, use for all checks)

Read `node tools/ds/source.mjs --list`. This gives you the compact API surface for every DS component — variants, sizes, key props, import paths — without reading full source files.

Use it to answer:
- "Is `variant='ghost'` valid for Button?" → check `components.Button.variants`
- "What's the correct import path for DatePickerField?" → check `components.DatePickerField.importPath`
- "Does DataTable accept a `searchable` prop?" → check `components.DataTable.keyProps`

**Only read a full DS source file if the snapshot doesn't contain the answer.** The snapshot covers ~40 components. If a component is missing, fall back to reading `exxat-ds/packages/ui/src/components/ui/<name>.tsx`.
```

- [ ] **Step 3: Commit**

```bash
git -C /Users/romitsoley/Work add .claude/agents/compliance-reviewer.md
git -C /Users/romitsoley/Work commit -m "feat(compliance-reviewer): load ds-snapshot.json in Step 0 — avoids full source reads"
```

---

### Task 3: Create scheduled agent prompt for DS snapshot refresh

**Files:**
- Create: `docs/watch/agent-prompts/ds-snapshot-refresh.md`

- [ ] **Step 1: Write the agent prompt**

```markdown
# DS Snapshot Refresh — Agent Prompt

You are the DS snapshot refresh agent. Run when the DS submodule updates.

## Step 1: Check if DS submodule has changed

```bash
git submodule status exxat-ds
git log --oneline exxat-ds | head -3
```

Compare the current submodule commit to what was recorded in `node tools/ds/source.mjs --list`'s `generated` field. If the snapshot was generated today, it may already be current — but run the refresh anyway to be safe.

## Step 2: Rebuild the snapshot

```bash
python3 scripts/build-ds-snapshot.py
```

Expected output: `✓ Snapshot written to `node tools/ds/source.mjs --list`

## Step 3: Spot-check for regressions

```bash
python3 -c "
import json
s = json.load(open('`node tools/ds/source.mjs --list`'))
print('Total components:', s['componentCount'])
for name in ['Button', 'Badge', 'DataTable', 'KeyMetrics']:
    c = s['components'].get(name)
    if c:
        print(f'{name}: variants={c.get(\"variants\", [])} sizes={c.get(\"sizes\", [])}')
    else:
        print(f'WARNING: {name} missing from snapshot')
"
```

If any expected component is missing, append a warning to `docs/watch/flags/system.md`:
```
## DS SNAPSHOT WARNING — [date]
Component [name] missing from snapshot after rebuild. Check exxat-ds/packages/ui/src/index.ts.
```

## Step 4: Commit if snapshot changed

```bash
git diff --quiet `node tools/ds/source.mjs --list` || (
  git add `node tools/ds/source.mjs --list` &&
  git commit -m "chore(ds-snapshot): refresh after DS submodule update [$(date +%Y-%m-%d)]"
)
```
```

- [ ] **Step 2: Commit**

```bash
git -C /Users/romitsoley/Work add docs/watch/agent-prompts/ds-snapshot-refresh.md
git -C /Users/romitsoley/Work commit -m "chore(watch): add ds-snapshot-refresh agent prompt"
```

---

### Task 4: Schedule the DS snapshot refresh

- [ ] **Step 1: Create the scheduled routine**

Use the `/schedule` skill or `RemoteTrigger` to create:
- **Name:** `ds-snapshot-refresh`
- **Schedule:** `0 14 * * *` (daily at 10am EDT = 14:00 UTC)
- **Prompt:** "Read `docs/watch/agent-prompts/ds-snapshot-refresh.md` in this repository and execute every step exactly as written."
- **No MCP connectors needed** (only Bash/Python, no SharePoint)

- [ ] **Step 2: Verify the routine appears in the list**

Run `/schedule list` and confirm `ds-snapshot-refresh` is enabled with cron `0 14 * * *`.

- [ ] **Step 3: Confirm snapshot is committed to repo**

```bash
git -C /Users/romitsoley/Work log --oneline -3 | grep ds-snapshot
```

Expected: the snapshot commit appears.

---

**Plan 1 complete.** DS snapshot is built, compliance-reviewer loads it first, and it refreshes daily so it stays current when the DS submodule updates.
