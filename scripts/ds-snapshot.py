#!/usr/bin/env python3
"""DS Snapshot — generates docs/foundations/ds-snapshot.json from DS source.

Walks exxat-ds/packages/ui/src/ and studentUX/src/ to extract:
- Component file list (kebab-case modules)
- Per-file ACTUAL EXPORTED IDENTIFIERS (Button, Sidebar, SidebarMenu, etc.)
- Hooks
- CSS custom properties (tokens) from theme.css / globals.css

Output: docs/foundations/ds-snapshot.json — agent-readable surface map.
The PreToolUse hook (DS-010) uses the per-export identifiers to validate
that imported components actually exist for the active profile.

Run via: python3 scripts/ds-snapshot.py
Triggered automatically by post-merge hook on submodule update (P5.5).
"""
import json
import re
from pathlib import Path


WORKSPACE = Path(__file__).resolve().parents[1]


def extract_exports_from_tsx(path: Path) -> set[str]:
    """Parse a .tsx/.ts file and return the set of named exports.

    Handles:
      export const Foo = ...
      export function Foo(...) {...}
      export class Foo {...}
      export { Foo, Bar, Baz as Qux } from ...
      export { Foo, Bar as Baz }
    Skips type-only exports (export type Foo, export interface Foo).
    Skips default exports unless re-exported.
    """
    if not path.exists() or not path.is_file():
        return set()
    try:
        text = path.read_text()
    except (OSError, UnicodeDecodeError):
        return set()

    exports: set[str] = set()

    # `export const|function|class Foo`
    for m in re.finditer(r"export\s+(?:const|let|var|function|async\s+function|class)\s+([A-Za-z_][A-Za-z0-9_]*)", text):
        exports.add(m.group(1))

    # `export { Foo, Bar as Baz, … }` — both with and without `from`
    for m in re.finditer(r"export\s+\{([^}]+)\}", text):
        for raw in m.group(1).split(","):
            name = raw.strip()
            if not name:
                continue
            # Skip `type Foo` or `type Foo as Bar`
            if name.startswith("type "):
                continue
            # `Foo as Bar` — exported name is `Bar`
            if " as " in name:
                exported = name.split(" as ")[1].strip()
            else:
                exported = name
            if exported and not exported.startswith("type"):
                exports.add(exported)

    return exports


def extract_admin_components() -> dict:
    """Read exxat-ds/packages/ui/src/index.ts; extract component + hook exports.

    For each `export * from './components/ui/<name>'`, walk the component file
    to find actual exported identifiers (Button, ButtonProps, SidebarMenu, etc.).
    """
    src_root = WORKSPACE / "exxat-ds/packages/ui/src"
    index_path = src_root / "index.ts"
    if not index_path.exists():
        return {"components": [], "hooks": [], "exports": [], "error": f"missing {index_path}"}

    text = index_path.read_text()

    # Modules referenced from index.ts
    component_module_re = re.compile(
        r"export\s+(?:\*|\{[^}]+\})\s+from\s+['\"]\./components/ui/([a-z0-9-]+)['\"]"
    )
    hook_wildcard_re = re.compile(
        r"export\s+\*\s+from\s+['\"]\./hooks/([a-z0-9-]+)['\"]"
    )
    hook_named_re = re.compile(
        r"export\s+\{([^}]+)\}\s+from\s+['\"]\./hooks/([a-z0-9-]+)['\"]"
    )
    util_module_re = re.compile(
        r"export\s+\*\s+from\s+['\"]\./lib/([a-z0-9-/]+)['\"]"
    )

    def kebab_to_camel(s: str) -> str:
        parts = s.split("-")
        return parts[0] + "".join(p.title() for p in parts[1:])

    component_modules = sorted(set(component_module_re.findall(text)))

    # Walk each component file to extract actual exports
    all_exports: set[str] = set()
    components: list[dict] = []
    for module in component_modules:
        # Try .tsx first, then .ts
        for ext in (".tsx", ".ts"):
            p = src_root / "components" / "ui" / f"{module}{ext}"
            if p.exists():
                module_exports = extract_exports_from_tsx(p)
                # Skip type-only / props exports for the import allowlist
                runtime_exports = {e for e in module_exports if not e.endswith("Props") and not e.endswith("Variants")}
                all_exports.update(runtime_exports)
                components.append({"name": module, "exports": sorted(runtime_exports)})
                break
        else:
            components.append({"name": module, "exports": []})

    # Hooks
    hooks: list[dict] = []
    seen_modules: set[str] = set()
    for module in hook_wildcard_re.findall(text):
        if module in seen_modules:
            continue
        seen_modules.add(module)
        hooks.append({"name": kebab_to_camel(module), "module": module})
    for match in hook_named_re.finditer(text):
        module = match.group(2)
        names = [n.strip().split(" as ")[0] for n in match.group(1).split(",")]
        for n in names:
            if n and not n.startswith("type"):
                if not any(h["name"] == n for h in hooks):
                    hooks.append({"name": n, "module": module})
    all_exports.update(h["name"] for h in hooks)

    # Util exports (cn, etc.)
    for util_module in util_module_re.findall(text):
        for ext in (".tsx", ".ts"):
            p = src_root / "lib" / f"{util_module}{ext}"
            if p.exists():
                all_exports.update(extract_exports_from_tsx(p))
                break

    return {
        "components": components,
        "hooks": hooks,
        "exports": sorted(all_exports),  # Flat list — what's importable from '@exxat/ds/packages/ui/src'
    }


def extract_student_components() -> dict:
    """Walk studentUX/src/components/ui/*.tsx + shared/index.ts."""
    ui_dir = WORKSPACE / "studentUX/src/components/ui"
    shared_index = WORKSPACE / "studentUX/src/components/shared/index.ts"

    primitives: list[dict] = []
    if ui_dir.exists():
        for f in sorted(ui_dir.glob("*.tsx")):
            module_exports = extract_exports_from_tsx(f)
            runtime_exports = {e for e in module_exports if not e.endswith("Props") and not e.endswith("Variants")}
            primitives.append({
                "name": f.stem,
                "module": f.stem,
                "exports": sorted(runtime_exports),
            })

    shared: list[str] = []
    if shared_index.exists():
        text = shared_index.read_text()
        export_named_re = re.compile(r"export\s+\{([^}]+)\}")
        for match in export_named_re.finditer(text):
            for raw in match.group(1).split(","):
                name = raw.strip().split(" as ")[0].strip()
                if name and not name.startswith("type"):
                    shared.append(name)

    return {
        "primitives": primitives,
        "shared": sorted(set(shared)),
    }


def extract_tokens(css_path: Path) -> dict[str, str]:
    """Extract CSS custom property declarations as { name: value } pairs."""
    if not css_path.exists():
        return {}
    text = css_path.read_text()
    token_re = re.compile(r"(--[a-zA-Z0-9-]+)\s*:\s*([^;]+);")
    tokens: dict[str, str] = {}
    for match in token_re.finditer(text):
        name = match.group(1).strip()
        value = match.group(2).strip()
        if name not in tokens:
            tokens[name] = value
    return tokens


def main() -> None:
    admin = extract_admin_components()
    student = extract_student_components()

    admin_tokens = extract_tokens(WORKSPACE / "exxat-ds/packages/ui/src/theme.css")
    student_tokens = extract_tokens(WORKSPACE / "studentUX/src/styles/globals.css")

    # NOTE: this file is committed and diffed by CI to detect staleness, so its
    # contents must depend only on DS source — no timestamps, no absolute paths.
    snapshot = {
        "version": "0.2.0",  # bumped: now includes per-export identifiers
        "profiles": {
            "admin": {
                "ds_name": "Exxat-DS",
                "package": "@exxat-ds/ui",
                "source": "exxat-ds/packages/ui/src/",
                "import_path": "@exxat/ds/packages/ui/src",
                "css_import": "exxat-ds/packages/ui/src/theme.css",
                "components": admin.get("components", []),
                "hooks": admin.get("hooks", []),
                "exports": admin.get("exports", []),  # NEW — flat allowlist
                "tokens": admin_tokens,
                "token_count": len(admin_tokens),
                "component_count": len(admin.get("components", [])),
                "hook_count": len(admin.get("hooks", [])),
                "export_count": len(admin.get("exports", [])),
            },
            "student": {
                "ds_name": "StudentUX",
                "source": "studentUX/src/",
                "import_path_primitives": "@exxat/student/components/ui/<name>",
                "import_path_shared": "@exxat/student/components/shared",
                "css_import": "studentUX/src/styles/globals.css",
                "primitives": student.get("primitives", []),
                "shared": student.get("shared", []),
                "tokens": student_tokens,
                "token_count": len(student_tokens),
                "primitive_count": len(student.get("primitives", [])),
                "shared_count": len(student.get("shared", [])),
            },
        },
    }

    out_path = WORKSPACE / "docs" / "foundations" / "ds-snapshot.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(snapshot, indent=2))

    rel = out_path.relative_to(WORKSPACE)
    print(f"DS snapshot written → {rel}")
    print(f"  admin:   {snapshot['profiles']['admin']['component_count']} components, "
          f"{snapshot['profiles']['admin']['hook_count']} hooks, "
          f"{snapshot['profiles']['admin']['export_count']} exports, "
          f"{snapshot['profiles']['admin']['token_count']} tokens")
    print(f"  student: {snapshot['profiles']['student']['primitive_count']} primitives, "
          f"{snapshot['profiles']['student']['shared_count']} shared, "
          f"{snapshot['profiles']['student']['token_count']} tokens")


if __name__ == "__main__":
    main()
