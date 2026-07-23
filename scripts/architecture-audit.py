#!/usr/bin/env python3
"""Architecture audit — meta-tool that verifies the workspace
infrastructure is wired correctly. Unlike backlink-audit (citations)
and staleness-check (decay), this script answers "is everything that
SHOULD exist actually wired?"

Checks:

1. **Hooks wired** — every non-helper .py in `.claude/hooks/` has a
   matching command in `.claude/settings.json`.
2. **Skills load** — every `.claude/skills/<name>/SKILL.md` has valid
   frontmatter with `name` + `description`.
3. **Agents load** — every `.claude/agents/<name>.md` has valid
   frontmatter with `name` + `description`.
4. **CLAUDE.md doc-map integrity** — every relative path mentioned in
   `## 10. Workspace Doc Map` actually exists.
5. **Registry coverage** — every file in `_registries.py REGISTRIES`
   exists.
6. **PRODUCTS.md / per-product CLAUDE.md sync** — every active or scoped
   product has an `apps/<id>/CLAUDE.md` (alias rows excepted).
7. **Trigger action descriptions** — every action ID emitted by
   `user-prompt-submit.py` has a description and points to a real
   target (skill / agent / mcp).

Run from repo root:

    python3 scripts/architecture-audit.py             # human report
    python3 scripts/architecture-audit.py --strict    # exit 1 if any gaps
    python3 scripts/architecture-audit.py --json      # machine-readable
    python3 scripts/architecture-audit.py --fix       # auto-patch missing skill frontmatter
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent


@dataclass
class Gap:
    category: str
    where: str
    rule: str
    message: str

    def to_dict(self) -> dict[str, str]:
        return {"category": self.category, "where": self.where,
                "rule": self.rule, "message": self.message}


@dataclass
class Report:
    gaps: list[Gap] = field(default_factory=list)
    checks_run: int = 0

    def add(self, gap: Gap) -> None:
        self.gaps.append(gap)


def read(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except OSError:
        return ""


def parse_frontmatter(text: str) -> dict[str, str]:
    if not text.startswith("---"):
        return {}
    end = text.find("\n---", 4)
    if end < 0:
        return {}
    out: dict[str, str] = {}
    for line in text[4:end].splitlines():
        if ":" not in line or line.strip().startswith("#"):
            continue
        key, _, value = line.partition(":")
        out[key.strip()] = value.strip().strip("'\"")
    return out


# ----------------------------------------------------------------------
# 1. Hooks wired


def check_hooks_wired(report: Report) -> None:
    report.checks_run += 1
    hooks_dir = REPO_ROOT / ".claude" / "hooks"
    settings_path = REPO_ROOT / ".claude" / "settings.json"
    if not settings_path.exists():
        report.add(Gap("hooks", str(settings_path.relative_to(REPO_ROOT)),
                       "missing-settings", ".claude/settings.json not found"))
        return
    try:
        settings = json.loads(read(settings_path))
    except json.JSONDecodeError:
        report.add(Gap("hooks", ".claude/settings.json", "bad-json",
                       "settings.json is not valid JSON"))
        return

    settings_text = read(settings_path)
    for path in sorted(hooks_dir.glob("*.py")):
        if path.name.startswith("_"):
            continue
        if path.name not in settings_text:
            report.add(Gap("hooks", str(path.relative_to(REPO_ROOT)),
                           "not-wired",
                           f"{path.name} exists but isn't referenced in settings.json"))


# ----------------------------------------------------------------------
# 2. Skills load


def _derive_skill_frontmatter(skill_md: Path) -> tuple[str, str]:
    """Return (name, description) derived from directory slug + file content."""
    slug = skill_md.parent.name
    text = read(skill_md)
    heading_m = re.search(r"^#\s+(.+)$", text, re.MULTILINE)
    heading = heading_m.group(1).strip() if heading_m else slug
    # First non-empty, non-heading body line — strip markdown bold/code
    first_body = ""
    past_heading = False
    for line in text.splitlines():
        if re.match(r"^#+\s", line):
            past_heading = True
            continue
        if past_heading and line.strip() and not line.startswith("-"):
            first_body = re.sub(r"\*\*([^*]+)\*\*", r"\1",
                                re.sub(r"`([^`]+)`", r"\1", line.strip()))
            break
    description = f"{heading}. {first_body}" if first_body else heading
    return slug, description


def fix_skill_frontmatter(skill_md: Path) -> bool:
    """Prepend/patch YAML frontmatter for missing name: or description:.
    Returns True if the file was modified."""
    text = read(skill_md)
    fm = parse_frontmatter(text)
    if fm.get("name") and fm.get("description"):
        return False

    name, description = _derive_skill_frontmatter(skill_md)

    if text.startswith("---"):
        # Existing block — inject missing keys right after opening ---
        end = text.find("\n---", 4)
        inner = text[4:end]
        prefix = ""
        if not fm.get("name"):
            prefix += f"name: {name}\n"
        if not fm.get("description"):
            prefix += f"description: {description}\n"
        new_text = "---\n" + prefix + inner + text[end:]
    else:
        # No frontmatter at all — prepend a complete block
        new_text = f"---\nname: {name}\ndescription: {description}\n---\n\n{text}"

    skill_md.write_text(new_text, encoding="utf-8")
    return True


def check_skills(report: Report) -> None:
    skills_dir = REPO_ROOT / ".claude" / "skills"
    if not skills_dir.is_dir():
        return
    for skill_md in sorted(skills_dir.glob("*/SKILL.md")):
        report.checks_run += 1
        text = read(skill_md)
        fm = parse_frontmatter(text)
        rel = str(skill_md.relative_to(REPO_ROOT))
        if not fm.get("name"):
            report.add(Gap("skills", rel, "missing-name",
                           "SKILL.md has no `name:` in frontmatter"))
        if not fm.get("description"):
            report.add(Gap("skills", rel, "missing-description",
                           "SKILL.md has no `description:` in frontmatter — "
                           "Claude Code uses this to decide relevance"))


# ----------------------------------------------------------------------
# 3. Agents load


def check_agents(report: Report) -> None:
    agents_dir = REPO_ROOT / ".claude" / "agents"
    if not agents_dir.is_dir():
        return
    for path in sorted(agents_dir.glob("*.md")):
        if path.name == "README.md":
            continue
        report.checks_run += 1
        text = read(path)
        fm = parse_frontmatter(text)
        rel = str(path.relative_to(REPO_ROOT))
        if not fm.get("name"):
            report.add(Gap("agents", rel, "missing-name",
                           "agent has no `name:` in frontmatter"))
        if not fm.get("description"):
            report.add(Gap("agents", rel, "missing-description",
                           "agent has no `description:` in frontmatter"))


# ----------------------------------------------------------------------
# 4. CLAUDE.md doc-map integrity


def check_claude_md_docmap(report: Report) -> None:
    report.checks_run += 1
    claude_md = REPO_ROOT / "CLAUDE.md"
    text = read(claude_md)
    # Find the Doc Map section: "## 10. Workspace Doc Map"
    m = re.search(r"##\s+\d+\.\s+Workspace Doc Map.*?(?=\n##\s|\Z)", text,
                  re.DOTALL)
    if not m:
        report.add(Gap("docmap", "CLAUDE.md", "missing-docmap",
                       "CLAUDE.md has no `## NN. Workspace Doc Map` section"))
        return
    section = m.group(0)
    # Extract paths from inline code spans within the table — typical pattern:
    # | `path/to/file.md` | description |
    paths = set()
    for m2 in re.finditer(r"`([^`]+\.md)`", section):
        candidate = m2.group(1)
        # Skip glob-y patterns (have * or <var> or {brace,expansion})
        if "*" in candidate or "<" in candidate or "{" in candidate:
            continue
        paths.add(candidate)

    for p in sorted(paths):
        # Strip a leading slash so "/DESIGN.md" resolves to "<repo>/DESIGN.md"
        # — CLAUDE.md uses /-prefixed paths to mean repo-root-relative.
        rel = p.lstrip("/")
        full = REPO_ROOT / rel
        if not full.exists():
            report.add(Gap("docmap", "CLAUDE.md", "broken-pointer",
                           f"§10 Doc Map references `{p}` which does not exist"))


# ----------------------------------------------------------------------
# 5. Registry coverage


def check_registries(report: Report) -> None:
    report.checks_run += 1
    helpers_path = REPO_ROOT / ".claude" / "hooks" / "_registries.py"
    if not helpers_path.exists():
        return
    text = read(helpers_path)
    # Pull strings from the REGISTRIES list literal
    list_match = re.search(r"REGISTRIES\s*:\s*list\[str\]\s*=\s*\[(.*?)\]",
                           text, re.DOTALL)
    if not list_match:
        return
    paths = re.findall(r'"([^"]+)"', list_match.group(1))
    for p in paths:
        full = REPO_ROOT / p
        if not full.exists():
            report.add(Gap("registries",
                           ".claude/hooks/_registries.py",
                           "broken-registry-ref",
                           f"REGISTRIES references `{p}` which does not exist"))


# ----------------------------------------------------------------------
# 6. PRODUCTS.md ↔ per-product CLAUDE.md sync


def check_per_product_claude(report: Report) -> None:
    products_path = REPO_ROOT / "docs" / "PRODUCTS.md"
    if not products_path.exists():
        return
    text = read(products_path)
    # Limit parsing to the section starting at "## Registry" so the schema
    # table at the top doesn't get mistaken for product rows.
    registry_match = re.search(r"##\s+Registry\b.*?(?=\n##\s|\Z)", text, re.DOTALL)
    if not registry_match:
        return
    section = registry_match.group(0)

    for line in section.splitlines():
        if not line.startswith("| `"):
            continue
        cells = [c.strip() for c in line.split("|")[1:-1]]
        if not cells:
            continue
        m = re.match(r"`([\w-]+)`", cells[0])
        if not m:
            continue
        product_id = m.group(1)
        # Skip aliases — they don't get their own app dir
        if len(cells) > 2 and "alias" in cells[2].lower():
            continue
        # Skip products explicitly `planned` (no app dir yet)
        if len(cells) > 2 and cells[2].lower() == "planned":
            continue
        report.checks_run += 1
        per_product = REPO_ROOT / "apps" / product_id / "CLAUDE.md"
        if not per_product.exists():
            rel = f"apps/{product_id}/CLAUDE.md"
            report.add(Gap("per-product", "docs/PRODUCTS.md",
                           "missing-product-claude-md",
                           f"PRODUCTS.md lists `{product_id}` but `{rel}` does not exist"))


# ----------------------------------------------------------------------
# 7. Trigger action descriptions match the action IDs emitted


def check_trigger_actions(report: Report) -> None:
    report.checks_run += 1
    hook_path = REPO_ROOT / ".claude" / "hooks" / "user-prompt-submit.py"
    if not hook_path.exists():
        return
    text = read(hook_path)

    # Pull the second element of every TRIGGERS tuple — the action id
    trigger_section = re.search(r"TRIGGERS\s*:\s*list\[tuple\[.*?\]\]\s*=\s*\[(.*?)\n\]",
                                text, re.DOTALL)
    if not trigger_section:
        return
    actions = set(re.findall(r',\s*"([^"]+:[^"]+)"', trigger_section.group(1)))
    actions.add("intake:transcript-paste")  # added programmatically in main()

    # Pull the keys of ACTION_DESCRIPTIONS
    descs_section = re.search(r"ACTION_DESCRIPTIONS\s*:\s*dict\[str,\s*str\]\s*=\s*\{(.*?)\n\}",
                              text, re.DOTALL)
    if not descs_section:
        return
    described = set(re.findall(r'"([^"]+:[^"]+)"\s*:', descs_section.group(1)))

    for action in actions:
        if action not in described:
            report.add(Gap("triggers",
                           ".claude/hooks/user-prompt-submit.py",
                           "missing-action-description",
                           f"TRIGGERS emits `{action}` but ACTION_DESCRIPTIONS has no entry for it"))


# ----------------------------------------------------------------------
# output


def print_human(report: Report) -> None:
    if not report.gaps:
        print(f"✓ Architecture wired cleanly. {report.checks_run} checks ran, no gaps.")
        return

    by_cat: dict[str, list[Gap]] = {}
    for g in report.gaps:
        by_cat.setdefault(g.category, []).append(g)

    print(f"Architecture audit ran {report.checks_run} checks. Found "
          f"{len(report.gaps)} gap(s):\n")
    order = ["hooks", "skills", "agents", "docmap", "registries",
             "per-product", "triggers"]
    for cat in order:
        gaps = by_cat.get(cat, [])
        if not gaps:
            continue
        print(f"## {cat.upper()} — {len(gaps)} gap(s)\n")
        for g in gaps:
            print(f"  [{g.rule}]")
            print(f"    {g.where}")
            print(f"    → {g.message}")
            print()


def main() -> int:
    parser = argparse.ArgumentParser(description="Audit workspace architecture wiring.")
    parser.add_argument("--strict", action="store_true", help="Exit 1 if any gaps")
    parser.add_argument("--json", action="store_true", help="Machine-readable output")
    parser.add_argument("--fix", action="store_true",
                        help="Auto-patch missing skill frontmatter (name + description), then audit")
    args = parser.parse_args()

    if args.fix:
        skills_dir = REPO_ROOT / ".claude" / "skills"
        fixed = 0
        if skills_dir.is_dir():
            for skill_md in sorted(skills_dir.glob("*/SKILL.md")):
                if fix_skill_frontmatter(skill_md):
                    print(f"  [fix] patched frontmatter: {skill_md.relative_to(REPO_ROOT)}")
                    fixed += 1
        if fixed:
            print(f"  [fix] {fixed} skill(s) patched — re-running audit\n")

    report = Report()
    check_hooks_wired(report)
    check_skills(report)
    check_agents(report)
    check_claude_md_docmap(report)
    check_registries(report)
    check_per_product_claude(report)
    check_trigger_actions(report)

    if args.json:
        print(json.dumps({
            "checks_run": report.checks_run,
            "gap_count": len(report.gaps),
            "gaps": [g.to_dict() for g in report.gaps],
        }, indent=2))
    else:
        print_human(report)

    return 1 if (args.strict and report.gaps) else 0


if __name__ == "__main__":
    sys.exit(main())
