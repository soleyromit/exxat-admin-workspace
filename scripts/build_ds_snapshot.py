#!/usr/bin/env python3
"""
Build a compact JSON snapshot of the Exxat DS public API surface.
Reads exxat-ds/packages/ui/src/, extracts component APIs via regex.
Output: docs/watch/ds-snapshot.json
Run: python3 scripts/build_ds_snapshot.py
"""
import re, json, sys
from pathlib import Path
from datetime import date

REPO_ROOT = Path(__file__).parent.parent
DS_SRC    = REPO_ROOT / 'exxat-ds' / 'packages' / 'ui' / 'src'
OUT_PATH  = REPO_ROOT / 'docs' / 'watch' / 'ds-snapshot.json'

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

def extract_exports_from_index(content: str) -> list:
    pattern = re.compile(r'export \* from ["\']./components/ui/([a-z0-9-]+)["\']')
    return pattern.findall(content)

def extract_variants_from_component(content: str, variant_key: str = 'variant') -> list:
    block_pattern = re.compile(rf'{variant_key}:\s*\{{([^}}]+)\}}', re.DOTALL)
    match = block_pattern.search(content)
    if not match:
        return []
    block = match.group(1)
    # Strip Tailwind value strings (contain spaces or colons inside the value)
    # but preserve short quoted keys like "icon-sm" which have no spaces.
    # Strategy: strip quoted strings that are VALUES (follow a colon),
    # then extract keys normally.
    # Remove quoted values that appear after `:` (Tailwind class strings)
    stripped = re.sub(r':\s*"[^"]*"', ': ""', block)
    stripped = re.sub(r":\s*'[^']*'", ": ''", stripped)
    skip = {'className', 'style', 'children', 'variants', 'size', 'variant'}
    result = []
    seen = set()
    # Match quoted keys like "icon-sm": or bare keys like default:
    for m in re.finditer(r'"([a-z][a-z0-9-]+)"\s*:|\'([a-z][a-z0-9-]+)\'\s*:|(\b[a-z][a-z0-9]*)\s*:', stripped):
        val = m.group(1) or m.group(2) or m.group(3)
        if val and val not in skip and val not in seen:
            seen.add(val)
            result.append(val)
    if 'default' in seen:
        result = ['default'] + [v for v in result if v != 'default']
    return result

def extract_sizes_from_component(content: str) -> list:
    return extract_variants_from_component(content, 'size')

def module_to_component_name(module: str) -> str:
    return ''.join(part.capitalize() for part in module.replace('-', ' ').split())

def extract_key_props(content: str, component_name: str) -> list:
    pattern = re.compile(
        rf'interface\s+{component_name}(?:Extended)?Props[^{{]*\{{([^}}]+)\}}', re.DOTALL
    )
    match = pattern.search(content)
    if not match:
        return []
    block = match.group(1)
    props = re.findall(r'^\s+(\w+)\??:', block, re.MULTILINE)
    skip = {'className', 'style', 'children', 'ref', 'id', 'key'}
    return [p for p in props if p not in skip][:12]

def build_snapshot(ds_src_path: str, index_content: str, component_sources: dict) -> dict:
    components = {}
    for module_name in extract_exports_from_index(index_content):
        cname = module_to_component_name(module_name)
        source = component_sources.get(module_name, '')
        entry = {
            'importPath': '@exxat/ds/packages/ui/src',
            'variants': extract_variants_from_component(source, 'variant'),
            'sizes': extract_sizes_from_component(source),
            'keyProps': extract_key_props(source, cname),
        }
        components[cname] = {k: v for k, v in entry.items() if v != [] or k == 'importPath'}
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
    component_sources = {}
    for module_name in module_names:
        component_file = DS_SRC / 'components' / 'ui' / f'{module_name}.tsx'
        if component_file.exists():
            component_sources[module_name] = component_file.read_text()
    snapshot = build_snapshot(str(DS_SRC), index_content, component_sources)
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(snapshot, indent=2))
    print(f'Snapshot written to {OUT_PATH}')
    print(f'  {snapshot["componentCount"]} components indexed')

if __name__ == '__main__':
    main()
