#!/usr/bin/env python3
"""DS Snapshot — generates docs/foundations/ds-snapshot.json from DS source.

Walks exxat-ds/packages/ui/src/ and studentUX/src/ to extract:
- Component exports (from index.ts barrel + per-file ui/ exports)
- CSS custom properties (from theme.css / globals.css)

Output: docs/foundations/ds-snapshot.json — agent-readable surface map.
The PreToolUse hook (later v0.2) will use this to validate that imported
components actually exist for the active profile (DS-010).

Run via: python3 scripts/ds-snapshot.py
Should be triggered by post-merge hook on submodule update (P5 governance loop).
"""
import json
import re
from datetime import datetime, timezone
from pathlib import Path


WORKSPACE = Path("/Users/romitsoley/Work")


def extract_admin_components() -> dict:
    """Read exxat-ds/packages/ui/src/index.ts; extract component + hook exports."""
    index_path = WORKSPACE / "exxat-ds/packages/ui/src/index.ts"
    if not index_path.exists():
        return {"components": [], "hooks": [], "error": f"missing {index_path}"}

    text = index_path.read_text()
    component_re = re.compile(
        r"export\s+(?:\*|\{[^}]+\})\s+from\s+['\"]\./components/ui/([a-z0-9-]+)['\"]"
    )
    hook_wildcard_re = re.compile(
        r"export\s+\*\s+from\s+['\"]\./hooks/([a-z0-9-]+)['\"]"
    )
    hook_named_re = re.compile(
        r"export\s+\{([^}]+)\}\s+from\s+['\"]\./hooks/([a-z0-9-]+)['\"]"
    )

    def kebab_to_camel(s: str) -> str:
        parts = s.split("-")
        return parts[0] + "".join(p.title() for p in parts[1:])

    components = sorted(set(component_re.findall(text)))
    hooks: list[dict] = []
    seen_modules: set[str] = set()

    # Wildcard exports: derive hook name from module name (kebab → camel)
    for module in hook_wildcard_re.findall(text):
        if module in seen_modules:
            continue
        seen_modules.add(module)
        hooks.append({"name": kebab_to_camel(module), "module": module})

    # Named exports
    for match in hook_named_re.finditer(text):
        module = match.group(2)
        names = [n.strip().split(" as ")[0] for n in match.group(1).split(",")]
        for n in names:
            if n and not n.startswith("type"):
                if not any(h["name"] == n for h in hooks):
                    hooks.append({"name": n, "module": module})

    return {
        "components": [{"name": c} for c in components],
        "hooks": hooks,
    }


def extract_student_components() -> dict:
    """Read studentUX/src/components/ui/*.tsx + shared/index.ts."""
    ui_dir = WORKSPACE / "studentUX/src/components/ui"
    shared_index = WORKSPACE / "studentUX/src/components/shared/index.ts"

    primitives: list[dict] = []
    if ui_dir.exists():
        for f in sorted(ui_dir.glob("*.tsx")):
            primitives.append({"name": f.stem, "module": f.stem})

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
    """Extract CSS custom property declarations as { name: value } pairs.

    First declaration wins (rough approximation of CSS cascade — real cascade
    requires resolving selector specificity, which we skip in v0.1).
    """
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
    admin_components = extract_admin_components()
    student_components = extract_student_components()

    admin_tokens = extract_tokens(
        WORKSPACE / "exxat-ds/packages/ui/src/theme.css"
    )
    student_tokens = extract_tokens(
        WORKSPACE / "studentUX/src/styles/globals.css"
    )

    snapshot = {
        "version": "0.1.0",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "workspace": str(WORKSPACE),
        "profiles": {
            "admin": {
                "ds_name": "Exxat-DS",
                "package": "@exxat-ds/ui",
                "source": "exxat-ds/packages/ui/src/",
                "import_path": "@exxat/ds/packages/ui/src",
                "css_import": "exxat-ds/packages/ui/src/theme.css",
                "components": admin_components.get("components", []),
                "hooks": admin_components.get("hooks", []),
                "tokens": admin_tokens,
                "token_count": len(admin_tokens),
                "component_count": len(admin_components.get("components", [])),
                "hook_count": len(admin_components.get("hooks", [])),
            },
            "student": {
                "ds_name": "StudentUX",
                "source": "studentUX/src/",
                "import_path_primitives": "@exxat/student/components/ui/<name>",
                "import_path_shared": "@exxat/student/components/shared",
                "css_import": "studentUX/src/styles/globals.css",
                "primitives": student_components.get("primitives", []),
                "shared": student_components.get("shared", []),
                "tokens": student_tokens,
                "token_count": len(student_tokens),
                "primitive_count": len(student_components.get("primitives", [])),
                "shared_count": len(student_components.get("shared", [])),
            },
        },
    }

    out_path = WORKSPACE / "docs/foundations/ds-snapshot.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(snapshot, indent=2))

    rel = out_path.relative_to(WORKSPACE)
    print(f"DS snapshot written → {rel}")
    print(f"  admin:   {snapshot['profiles']['admin']['component_count']} components, "
          f"{snapshot['profiles']['admin']['hook_count']} hooks, "
          f"{snapshot['profiles']['admin']['token_count']} tokens")
    print(f"  student: {snapshot['profiles']['student']['primitive_count']} primitives, "
          f"{snapshot['profiles']['student']['shared_count']} shared, "
          f"{snapshot['profiles']['student']['token_count']} tokens")


if __name__ == "__main__":
    main()
