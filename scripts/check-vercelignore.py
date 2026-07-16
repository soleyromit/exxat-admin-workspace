#!/usr/bin/env python3
"""Fail if .vercelignore would delete a file the Next build actually reaches.

Run locally:  python3 scripts/check-vercelignore.py
In CI:        .github/workflows/vercel-config.yml

WHY (2026-07-15): `.vercelignore` listed four tracked components
(library-folder-picker-panel, library-new-folder-sheet, library-secondary-nav,
new-library-item-form). They were excluded as "untracked exxat-ui leftovers that
pull in react-router-dom" — but they were tracked, live Next code imported them,
and next.config.ts aliases react-router-dom to a compat shim. Vercel deleted them
at clone time and every PCE build died with:

    Module not found: Can't resolve '@/components/library-new-folder-sheet'

Nothing local could catch it: .vercelignore is inert outside Vercel, so
`pnpm build` passed on every machine while every deployment failed.

THE RULE IS NOT "never ignore a tracked file". Two shapes are legitimate:

  1. apps/pce/admin/src/ — 41 tracked files, correctly ignored. It is a Vite
     shell the Next build must never see.
  2. contexts/product-root-gate.tsx imports "@/src/pages/_dashboard-loading",
     which IS ignored — but the only importer of that context is src/routes.tsx,
     itself ignored. Nothing under app/ reaches it, so webpack never compiles it
     and never resolves the import. A dangling import in dead code is not a
     build failure.

So the rule is REACHABILITY: walk the module graph from the Next entry points
(everything under app/ + middleware/next.config), and fail only when a file the
graph actually reaches has been deleted. That is precisely the library-* bug and
precisely not the two shapes above.

Exit 0 = safe. Exit 1 = this .vercelignore breaks a build on Vercel only.
"""

from __future__ import annotations

import fnmatch
import pathlib
import re
import subprocess
import sys

REPO_ROOT = pathlib.Path(__file__).resolve().parent.parent
VERCELIGNORE = REPO_ROOT / ".vercelignore"

EXTS = (".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs")

# Next compiles everything under these dirs; they are the graph's roots.
ENTRY_DIRS = ("app", "pages")
ENTRY_FILES = ("middleware.ts", "next.config.ts", "next.config.js", "next.config.mjs")

IMPORT_RE = re.compile(
    r"""(?:from\s*|import\s*\(\s*|require\s*\(\s*)['"]([^'"]+)['"]"""
)


def sh(*args: str) -> str:
    return subprocess.run(
        args, cwd=REPO_ROOT, capture_output=True, text=True, check=True
    ).stdout


def tracked_files() -> list[str]:
    return [p for p in sh("git", "ls-files", "-z").split("\0") if p]


def read_patterns() -> list[str]:
    if not VERCELIGNORE.exists():
        return []
    out: list[str] = []
    for raw in VERCELIGNORE.read_text().splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or line.startswith("!"):
            continue
        out.append(line)
    return out


def matches(path: str, pattern: str) -> bool:
    """Approximate .gitignore semantics for the shapes this repo actually uses."""
    pat = pattern.lstrip("/")
    if pat.endswith("/"):
        return path.startswith(pat)
    if path == pat or path.startswith(pat + "/"):
        return True
    return fnmatch.fnmatch(path, pat)


def app_roots(tracked: list[str]) -> list[str]:
    """Every dir with a tsconfig.json under apps/ — the dirs `@/*` resolves against."""
    roots = set()
    for p in tracked:
        if p.startswith("apps/") and p.endswith("/tsconfig.json"):
            roots.add(p[: -len("/tsconfig.json")])
    return sorted(roots)


class Resolver:
    def __init__(self, tracked: set[str], app_root: str) -> None:
        self.tracked = tracked
        self.app_root = app_root

    def _candidates(self, base: str):
        yield base
        for e in EXTS:
            yield base + e
        for e in EXTS:
            yield f"{base}/index{e}"

    def resolve(self, importer: str, spec: str) -> str | None:
        if spec.startswith("@/"):
            base = f"{self.app_root}/{spec[2:]}"
        elif spec.startswith("."):
            base = (pathlib.PurePosixPath(importer).parent / spec).as_posix()
            # normalise ../
            parts: list[str] = []
            for seg in base.split("/"):
                if seg == "." or seg == "":
                    continue
                if seg == "..":
                    if parts:
                        parts.pop()
                    continue
                parts.append(seg)
            base = "/".join(parts)
        else:
            return None  # bare specifier -> node_modules, not our problem
        for cand in self._candidates(base):
            if cand in self.tracked:
                return cand
        return None


def reachable(app_root: str, tracked: set[str]) -> tuple[set[str], dict[str, set[str]]]:
    """BFS the module graph from Next's entry points. Ignores .vercelignore entirely —
    we want the graph as authored, then ask which of it got deleted."""
    resolver = Resolver(tracked, app_root)
    roots = [
        p for p in tracked
        if p.startswith(app_root + "/")
        and p.endswith(EXTS)
        and (
            any(p.startswith(f"{app_root}/{d}/") for d in ENTRY_DIRS)
            or any(p == f"{app_root}/{f}" for f in ENTRY_FILES)
        )
    ]
    seen: set[str] = set()
    edges: dict[str, set[str]] = {}
    queue = list(roots)
    while queue:
        cur = queue.pop()
        if cur in seen:
            continue
        seen.add(cur)
        try:
            text = (REPO_ROOT / cur).read_text()
        except (OSError, UnicodeDecodeError):
            continue
        for m in IMPORT_RE.finditer(text):
            target = resolver.resolve(cur, m.group(1))
            if target is None:
                continue
            edges.setdefault(target, set()).add(cur)
            if target not in seen:
                queue.append(target)
    return seen, edges


def main() -> int:
    patterns = read_patterns()
    if not patterns:
        print("No .vercelignore patterns — nothing to validate.")
        return 0

    tracked_list = tracked_files()
    tracked = set(tracked_list)
    ignored = {p for p in tracked_list if any(matches(p, pat) for pat in patterns)}

    if not ignored:
        print(f"OK — {len(patterns)} pattern(s), none match a tracked file.")
        return 0

    errors: list[str] = []
    total_reached = 0

    for app_root in app_roots(tracked_list):
        reached, edges = reachable(app_root, tracked)
        total_reached += len(reached)
        for victim in sorted(reached & ignored):
            importers = sorted(edges.get(victim, set()) - ignored)
            if not importers:
                continue
            shown = "\n".join(f"        {i}" for i in importers[:4])
            more = f"\n        … and {len(importers) - 4} more" if len(importers) > 4 else ""
            errors.append(
                f"{victim}\n"
                f"      .vercelignore deletes this file, but the Next graph of "
                f"{app_root} reaches it from:\n{shown}{more}"
            )

    if errors:
        print("\nFAIL — .vercelignore deletes files the Next build imports.", file=sys.stderr)
        print("Vercel removes these at clone time, so the deployment dies with", file=sys.stderr)
        print('"Module not found" while `pnpm build` still passes locally.\n', file=sys.stderr)
        for err in errors:
            print(f"  - {err}\n", file=sys.stderr)
        print("Fix: drop the pattern from .vercelignore, or remove the importer.", file=sys.stderr)
        return 1

    print(
        f"OK — {len(ignored)} tracked file(s) ignored; "
        f"{total_reached} file(s) reachable from Next entry points across "
        f"{len(app_roots(tracked_list))} app(s); no overlap."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
