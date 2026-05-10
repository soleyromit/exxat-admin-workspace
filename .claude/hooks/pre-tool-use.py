#!/usr/bin/env python3
"""PreToolUse hook — Design Intelligence Harness DS conformance + a11y enforcement.

v0.2: blocking mode for DS-001..011 + A11Y-004. Hallucinated DS imports and
typography literals are now hard-blocked, not warned.

Rules enforced (workspace DESIGN.md §4):
- DS-001  — No raw <button>; use DS Button
- DS-002  — No hex / rgb() / hsl() literals; use var(--token)
- DS-003  — No inline boxShadow; use shadow tokens
- DS-004  — No raw <table>; use DS Table or DataTable
- DS-005  — No toast()/Sonner in admin apps
- DS-007  — Component imports must match active DS profile (per file path)
- DS-010  — Imported DS identifiers must resolve in ds-snapshot.json
- DS-011  — No inline typography literals (fontSize/fontWeight/fontFamily); use tokens
- A11Y-004 — FA icons require aria-hidden="true"

Skipped: DS-006 (file-system-level submodule guard, not content-level), DS-008
(Tailwind allowlist needs a class extractor — Phase 2), DS-009 (visual review).
"""
import json
import os
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
try:
    from _telemetry import emit as _telemetry_emit
except ImportError:
    def _telemetry_emit(*a, **k): pass


WORKSPACE = Path("/Users/romitsoley/Work")
SNAPSHOT_PATH = WORKSPACE / "docs/foundations/ds-snapshot.json"


# Pattern-based rules: (rule_id, regex_pattern, message, file_path_pattern, blocking)
PATTERN_RULES: list[tuple[str, str, str, str, bool]] = [
    ("DS-001", r"<button(\s|>)",
     "Raw <button> banned in apps/** (DS-001). Use DS Button with explicit variant + size.",
     r"/apps/", True),
    ("DS-002a", r"#[0-9a-fA-F]{3,8}\b",
     "Hex color literal banned in apps/** (DS-002). Use var(--token).",
     r"/apps/", True),
    ("DS-002b", r"\brgba?\s*\(",
     "rgb()/rgba() banned in apps/** (DS-002). Use var(--token).",
     r"/apps/", True),
    ("DS-002c", r"\bhsla?\s*\(",
     "hsl()/hsla() banned in apps/** (DS-002). Use var(--token).",
     r"/apps/", True),
    ("DS-003", r"\bbox[Ss]hadow\s*[:=]",
     "Inline boxShadow banned (DS-003). Use shadow-{sm,md,lg} or DS shadow tokens.",
     r"/apps/", True),
    ("DS-004", r"<table(\s|>)",
     "Raw <table> banned in apps/** (DS-004). Use DS Table (admin) or DataTable (student).",
     r"/apps/", True),
    ("DS-005", r"\btoast\s*\(|from\s+['\"]sonner['\"]",
     "toast()/Sonner banned in admin apps (DS-005). Use LocalBanner / SystemBanner.",
     r"/apps/[^/]+/admin/", True),
    ("A11Y-004", r"<i\s+className\s*=\s*[\"']fa-[^\"']+[\"'](?![^>]*aria-hidden)",
     "FA icon missing aria-hidden=\"true\" (A11Y-004 / WCAG 1.3.1).",
     r"/apps/", True),
    # A11Y-001 (WCAG 4.1.2) — Icon-only DS Button (size="icon*") requires aria-label
    # Match: <Button ... size=("icon" | "icon-sm" | "icon-xs" | "icon-lg") ... > without aria-label in same tag
    ("A11Y-001", r"<Button(?=[^>]*size\s*=\s*[\"']icon)(?![^>]*aria-label)[^>]*>",
     "Icon-only DS Button missing aria-label (A11Y-001 / WCAG 4.1.2). Add aria-label=\"…\" describing the action.",
     r"/apps/", True),
    # A11Y-002 (WCAG 2.4.7) — outline-none requires focus-visible:ring-* in same className
    ("A11Y-002", r"\boutline-none\b(?:(?![\"']).)*?(?<![-:])(?<!focus-visible:)\bring-(?:0|none)\b",
     "outline-none used without focus-visible:ring-* (A11Y-002 / WCAG 2.4.7). Pair outline-none with focus-visible:ring-2 + focus-visible:ring-ring.",
     r"/apps/", True),
    # A11Y-006 (WCAG 1.3.1) — DialogContent / SheetContent must contain DialogTitle / SheetTitle
    # Catch the obvious gap: DialogContent or SheetContent opens but no Title sibling text in same file.
    # Note: file-scope check, not block-scope. False positives possible if DialogContent spans files.
    ("A11Y-006-dialog", r"<DialogContent[\s>](?:(?!</DialogContent>).)*?</DialogContent>(?<!<DialogTitle[\s>])",
     "DialogContent appears to be missing DialogTitle (A11Y-006 / WCAG 1.3.1). Add <DialogTitle> (use className=\"sr-only\" if visually hidden).",
     r"/apps/", False),  # warning-only — regex is heuristic, false positives possible
    ("A11Y-006-sheet", r"<SheetContent[\s>](?:(?!</SheetContent>).)*?</SheetContent>(?<!<SheetTitle[\s>])",
     "SheetContent appears to be missing SheetTitle (A11Y-006 / WCAG 1.3.1). Add <SheetTitle> (use className=\"sr-only\" if visually hidden).",
     r"/apps/", False),  # warning-only
    # DS-011 typography literals — block raw fontSize/Family/Weight in style props
    ("DS-011a", r"\bfontSize\s*:\s*['\"]?\d",
     "Inline fontSize literal banned (DS-011). Use Tailwind text-{xs,sm,...} class or var(--text-*) token.",
     r"/apps/", True),
    ("DS-011b", r"\bfontWeight\s*:\s*['\"]?(?:\d|bold|normal|light)",
     "Inline fontWeight literal banned (DS-011). Use Tailwind font-{normal,medium,semibold,bold} class or var(--font-weight-*) token.",
     r"/apps/", True),
    # DS-011c — block raw font-family literals only; allow var(--font-*) tokens.
    # Regex matches: fontFamily: '<anything>serif|sans|mono' or fontFamily: '<UpperCaseStart>'
    # Does NOT match: fontFamily: 'var(--...)' (lowercase 'v', no serif/sans/mono in tokens).
    ("DS-011c", r"\bfontFamily\s*:\s*['\"]((?:[^'\"]*?(?:serif|sans|mono))|[A-Z][^'\"]*)['\"]",
     "Inline fontFamily literal banned (DS-011). Use var(--font-sans) / var(--font-heading) tokens or a Tailwind font-* class.",
     r"/apps/", True),

    # ─── Added 2026-05-10 audit: close gaps between ds-check (R1-R12) and PreToolUse ───

    # DS-013 (was ds-check R7) — raw oklch() literal in style prop banned.
    # DS-002 already catches hex/rgb/hsl. This adds oklch.
    ("DS-013", r"\bstyle\s*=\s*\{\s*\{[^}]*\boklch\s*\(",
     "Raw oklch() in style prop banned (DS-013). Define a CSS variable in globals.css and reference it as var(--token).",
     r"/apps/", True),

    # DS-014 (was ds-check R11) — `white` keyword inside color-mix banned.
    # CSS's bare `white` short-circuits theme. Use var(--background) instead so dark mode works.
    # Note: `[^)]*` doesn't work because nested var(--token) has a `)` that closes the class
    # too early. Lazy `.*?` spans nested parens within a line.
    ("DS-014", r"color-mix\s*\(.*?\bwhite\b",
     "`white` inside color-mix banned (DS-014). Use var(--background) so dark mode honors the theme.",
     r"/apps/", True),

    # DS-015 (was ds-check R6) — DS Button without explicit variant prop.
    # Regex: <Button followed by attributes that DON'T include variant=, terminating in >.
    # Best-effort; may false-positive if variant is on a wrapping props spread. Warning-only.
    ("DS-015", r"<Button(?![^>]*\bvariant\s*=)[^>]*>",
     "DS Button missing explicit variant prop (DS-015). Add variant=\"default|outline|secondary|ghost|destructive|link\" — never rely on the implicit default.",
     r"/apps/", False),

    # DS-016 (was ds-check R12) — rounded wrapper around <Table> needs overflow-hidden.
    # Catches the most-common pattern: <div className="...rounded-{lg|xl|2xl}..."> with <Table inside.
    # Heuristic; warning-only.
    ("DS-016", r"<div[^>]*\bclassName\s*=\s*[\"'][^\"']*\brounded-(?:lg|xl|2xl)\b(?:(?![\"'][^>]*overflow-hidden)[^>])*?>\s*(?:<[^>]*>\s*)*<Table[\s>]",
     "<Table> inside rounded-{lg|xl|2xl} wrapper without overflow-hidden (DS-016). Rounded corners won't clip the scroll container.",
     r"/apps/", False),

    # DS-017 (was ds-check R3) — DS-token color in style prop should be Tailwind class.
    # Catches: style={{ color: 'var(--foreground)' }} when className="text-foreground" exists.
    # Warning-only — false positives when color is conditional / dynamic.
    ("DS-017", r"\bstyle\s*=\s*\{\s*\{[^}]*\bcolor\s*:\s*['\"]\s*var\s*\(\s*--(?:foreground|muted-foreground|destructive|primary-foreground|brand-color|brand-color-dark)\s*\)['\"]",
     "DS-token color in inline style (DS-017). Prefer Tailwind class — `text-foreground`, `text-muted-foreground`, `text-destructive`, etc.",
     r"/apps/", False),
]


def get_content(tool_name: str, tool_input: dict) -> str:
    if tool_name == "Write":
        return tool_input.get("content", "") or ""
    if tool_name == "Edit":
        return tool_input.get("new_string", "") or ""
    if tool_name == "MultiEdit":
        edits = tool_input.get("edits", [])
        return "\n".join(e.get("new_string", "") or "" for e in edits)
    return ""


def detect_profile(file_path: str) -> str | None:
    """Return 'admin' / 'student' based on the file's app-type segment."""
    if "/apps/" not in file_path:
        return None
    if "/admin/" in file_path:
        return "admin"
    if "/student/" in file_path or "/assessment-taker/" in file_path:
        # assessment-taker uses Exxat-DS (admin) by exception per CLAUDE.md
        if "/assessment-taker/" in file_path:
            return "admin"
        return "student"
    return None


_snapshot_cache: dict | None = None


def load_snapshot() -> dict | None:
    global _snapshot_cache
    if _snapshot_cache is not None:
        return _snapshot_cache
    if not SNAPSHOT_PATH.exists():
        return None
    try:
        _snapshot_cache = json.loads(SNAPSHOT_PATH.read_text())
        return _snapshot_cache
    except (json.JSONDecodeError, OSError):
        return None


def check_ds_imports(content: str, profile: str) -> list[tuple[str, str]]:
    """DS-010 — verify every DS import resolves in ds-snapshot.json.

    Returns list of (rule_id, message) violations.
    """
    snap = load_snapshot()
    if not snap:
        return []  # Snapshot missing — fail open, don't block

    violations: list[tuple[str, str]] = []

    if profile == "admin":
        admin = snap["profiles"]["admin"]
        allowed_exports = set(admin.get("exports", []))
        # Match: import { Foo, Bar as Baz } from '@exxat/ds/packages/ui/src'
        admin_import_re = re.compile(
            r"import\s+(?:type\s+)?\{([^}]+)\}\s+from\s+['\"]@exxat/ds/packages/ui/src['\"]"
        )
        for m in admin_import_re.finditer(content):
            for raw in m.group(1).split(","):
                name = raw.strip()
                if not name or name.startswith("type "):
                    continue
                # Handle `Foo as Bar` — the source name is what must exist
                source_name = name.split(" as ")[0].strip()
                if source_name and source_name not in allowed_exports:
                    suggestions = [e for e in allowed_exports if e.lower().startswith(source_name.lower()[:3])][:3]
                    suggestion_str = f" (close matches: {', '.join(suggestions)})" if suggestions else ""
                    violations.append((
                        "DS-010",
                        f"Hallucinated import: '{source_name}' not in @exxat/ds/packages/ui/src exports{suggestion_str}. "
                        f"Run `python3 scripts/ds-snapshot.py` if DS submodule was updated, OR use a real DS component.",
                    ))

    elif profile == "student":
        student = snap["profiles"]["student"]
        primitives = {p["name"]: set(p.get("exports", [])) for p in student.get("primitives", [])}
        shared = set(student.get("shared", []))

        # Match: import { Foo, Bar } from '@exxat/student/components/ui/<name>'
        student_primitive_re = re.compile(
            r"import\s+(?:type\s+)?\{([^}]+)\}\s+from\s+['\"]@exxat/student/components/ui/([a-z0-9-]+)['\"]"
        )
        for m in student_primitive_re.finditer(content):
            primitive_name = m.group(2)
            if primitive_name not in primitives:
                violations.append((
                    "DS-010",
                    f"Hallucinated student primitive: '{primitive_name}' not in studentUX/src/components/ui/. "
                    f"Run snapshot generator if recently added.",
                ))
                continue
            allowed = primitives[primitive_name]
            if not allowed:
                # Couldn't parse exports — fail open
                continue
            for raw in m.group(1).split(","):
                name = raw.strip()
                if not name or name.startswith("type "):
                    continue
                source_name = name.split(" as ")[0].strip()
                if source_name and source_name not in allowed:
                    violations.append((
                        "DS-010",
                        f"Hallucinated import: '{source_name}' not exported by '@exxat/student/components/ui/{primitive_name}'. "
                        f"File exports: {sorted(allowed)[:5]}{'...' if len(allowed) > 5 else ''}.",
                    ))

        # Match: import { Foo } from '@exxat/student/components/shared'
        student_shared_re = re.compile(
            r"import\s+(?:type\s+)?\{([^}]+)\}\s+from\s+['\"]@exxat/student/components/shared['\"]"
        )
        for m in student_shared_re.finditer(content):
            for raw in m.group(1).split(","):
                name = raw.strip()
                if not name or name.startswith("type "):
                    continue
                source_name = name.split(" as ")[0].strip()
                if source_name and source_name not in shared:
                    suggestions = [s for s in shared if s.lower().startswith(source_name.lower()[:3])][:3]
                    suggestion_str = f" (close matches: {', '.join(suggestions)})" if suggestions else ""
                    violations.append((
                        "DS-010",
                        f"Hallucinated student shared component: '{source_name}'{suggestion_str}.",
                    ))

    return violations


def check_ds_007(content: str, profile: str) -> list[tuple[str, str]]:
    """DS-007 — Component imports must match the active DS profile.

    Admin file importing from @exxat/student → violation (and vice versa).
    Exception: a few utility imports are cross-profile-safe (none defined yet).
    """
    violations: list[tuple[str, str]] = []
    if profile == "admin":
        if re.search(r"from\s+['\"]@exxat/student/components/", content):
            violations.append((
                "DS-007",
                "Admin file imports from @exxat/student. Use @exxat/ds/packages/ui/src instead.",
            ))
    elif profile == "student":
        if re.search(r"from\s+['\"]@exxat/ds/packages/ui/src", content):
            violations.append((
                "DS-007",
                "Student file imports from @exxat/ds. Use @exxat/student/components/ui/<name> or /shared.",
            ))
    return violations


def main() -> None:
    try:
        payload = json.load(sys.stdin)
    except json.JSONDecodeError:
        sys.exit(0)

    tool_name = payload.get("tool_name", "")
    if tool_name not in ("Edit", "Write", "MultiEdit"):
        sys.exit(0)

    tool_input = payload.get("tool_input", {})
    file_path = tool_input.get("file_path", "")

    if not file_path or "/apps/" not in file_path:
        sys.exit(0)
    if not file_path.endswith((".tsx", ".ts")):
        sys.exit(0)
    if any(skip in file_path for skip in ["/node_modules/", ".test.", ".spec.", "/.next/", "/dist/"]):
        sys.exit(0)

    content = get_content(tool_name, tool_input)
    if not content:
        sys.exit(0)

    violations: list[tuple[str, str, bool]] = []

    # Pattern-based rules
    for rule_id, pattern, message, path_pattern, blocking in PATTERN_RULES:
        if not re.search(path_pattern, file_path):
            continue
        try:
            if re.search(pattern, content):
                violations.append((rule_id, message, blocking))
        except re.error:
            continue

    # DS profile-based rules (DS-010 + DS-007)
    profile = detect_profile(file_path)
    if profile:
        for rule_id, message in check_ds_imports(content, profile):
            violations.append((rule_id, message, True))  # DS-010 always blocks
        for rule_id, message in check_ds_007(content, profile):
            violations.append((rule_id, message, True))  # DS-007 always blocks

    if not violations:
        _telemetry_emit(
            "pretooluse.pass",
            tool=tool_name,
            file_path=file_path,
            profile=profile or "",
            content_chars=len(content),
        )
        sys.exit(0)

    has_blocking = any(b for _, _, b in violations)
    _telemetry_emit(
        "pretooluse.violation",
        tool=tool_name,
        file_path=file_path,
        profile=profile or "",
        rules=[v[0] for v in violations],
        violation_count=len(violations),
        blocked=has_blocking,
    )

    lines = [
        "[Design Intelligence Harness — PreToolUse v0.2 (blocking)]",
        f"File: {file_path}",
        f"Profile: {profile or 'unknown'}",
        "",
    ]
    for rule_id, message, blocking in violations:
        marker = "BLOCK" if blocking else "WARN"
        lines.append(f"  [{marker}] {rule_id}: {message}")

    if has_blocking:
        lines.extend([
            "",
            "Blocked. Fix the violations above and retry.",
            "If a violation is intentional and rule-bending is justified, file an override ADR via /intake (P5 INTAKE-004).",
            "Override template: docs/decisions/_override-template.md",
        ])
    else:
        lines.extend([
            "",
            "Warnings only — proceed with caution.",
        ])

    print("\n".join(lines), file=sys.stderr)
    sys.exit(2 if has_blocking else 0)


if __name__ == "__main__":
    main()
