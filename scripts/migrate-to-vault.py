#!/usr/bin/env python3
"""migrate-to-vault — copy the workspace knowledge graph into the Obsidian vault.

Model: "vault = shared brain". Durable knowledge lives canonically in the vault;
both Romit (Obsidian) and Claude read/write it via a tiny _Home index + frontmatter
queries. This script does Phase 1 (everything local): repo knowledge docs + the 90
memory atoms, with frontmatter injected and MOC indexes generated.

Idempotent-ish: re-running overwrites the migrated files + regenerates MOCs.
Granola meetings (MCP) and Insights-Hub (Drive/downloads) are separate phases.
"""
from __future__ import annotations
import datetime
from pathlib import Path

REPO = Path("/Users/romitsoley/Work")
VAULT = Path("/Users/romitsoley/Documents/research-repos")
MEM = Path("/Users/romitsoley/.claude/projects/-Users-romitsoley-Work/memory")
TODAY = datetime.date.today().isoformat()

SKIP_DIRS = {"node_modules", ".next", ".git", "exxat-ds", "studentUX",
             ".claude", ".cursor", "dist", "build", ".obsidian"}

def product_of(rel_parts: tuple[str, ...]) -> str:
    if rel_parts and rel_parts[0] == "apps" and len(rel_parts) > 1:
        return rel_parts[1]
    return "workspace"

def has_frontmatter(text: str) -> bool:
    return text.lstrip().startswith("---")

def inject(text: str, meta: dict) -> str:
    if has_frontmatter(text):
        return text  # memory atoms + already-tagged docs: leave as-is
    fm = "---\n" + "\n".join(f"{k}: {v}" for k, v in meta.items()) + "\n---\n\n"
    return fm + text

def classify(rel: str) -> str | None:
    if "/docs/decisions/" in rel: return "Decisions"
    if "/docs/research/" in rel:  return "Research"
    if "/specs/" in rel:          return "Specs"
    if "/docs/" in rel:           return "Products"
    return None

def safe_write(dest: Path, content: str):
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(content, encoding="utf-8")

migrated: dict[str, list[Path]] = {k: [] for k in
    ["Architecture", "Decisions", "Research", "Specs", "Products", "Memory"]}

def do_migrate(src: Path, category: str, dest: Path):
    try:
        text = src.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return
    rel_parts = src.relative_to(REPO).parts if str(src).startswith(str(REPO)) else src.parts
    product = product_of(rel_parts)
    meta = {
        "type": category.lower().rstrip("s"),
        "product": product,
        "source": str(src.relative_to(REPO)) if str(src).startswith(str(REPO)) else src.name,
        "migrated": TODAY,
        "tags": f"[{category.lower()}, {product}]",
    }
    safe_write(dest, inject(text, meta))
    migrated[category].append(dest.relative_to(VAULT))

# ── 1. apps/** knowledge docs ──
for md in (REPO / "apps").rglob("*.md"):
    if any(p in SKIP_DIRS for p in md.parts):
        continue
    rel = "/" + str(md.relative_to(REPO))
    cat = classify(rel)
    if not cat:
        continue
    parts = md.relative_to(REPO).parts
    product = product_of(parts)
    # path after the first 'docs' or 'specs' anchor, for clean substructure
    anchor = "docs" if "docs" in parts else ("specs" if "specs" in parts else None)
    if anchor and anchor in parts:
        tail = Path(*parts[parts.index(anchor) + 1:])
    else:
        tail = Path(md.name)
    dest = VAULT / cat / product / tail
    do_migrate(md, cat, dest)

# ── 2. workspace docs/ → Architecture ──
for md in (REPO / "docs").rglob("*.md"):
    if any(p in SKIP_DIRS for p in md.parts):
        continue
    tail = md.relative_to(REPO / "docs")
    do_migrate(md, "Architecture", VAULT / "Architecture" / tail)

# ── 3. top-level DESIGN.md / CLAUDE.md → Architecture ──
for name in ("DESIGN.md", "CLAUDE.md"):
    f = REPO / name
    if f.exists():
        do_migrate(f, "Architecture", VAULT / "Architecture" / name)

# ── 4. memory atoms → Memory (already schema-perfect; copy verbatim) ──
for md in sorted(MEM.glob("*.md")):
    dest = VAULT / "Memory" / md.name
    safe_write(dest, md.read_text(encoding="utf-8", errors="replace"))
    migrated["Memory"].append(dest.relative_to(VAULT))

# ── 5. generate MOC indexes (static link lists — no plugin needed) ──
MOC_DIR = VAULT / "MOCs"
MOC_DIR.mkdir(parents=True, exist_ok=True)

def write_moc(category: str):
    files = sorted(migrated[category])
    by_product: dict[str, list[Path]] = {}
    for f in files:
        # product = 2nd path segment for app docs, else 'workspace'
        prod = f.parts[1] if len(f.parts) > 2 else "_"
        by_product.setdefault(prod, []).append(f)
    lines = [f"---\ntype: moc\ntags: [moc, {category.lower()}]\n---\n",
             f"# MOC — {category}\n", f"> {len(files)} notes. Generated {TODAY}.\n"]
    for prod in sorted(by_product):
        if prod != "_":
            lines.append(f"\n## {prod}\n")
        for f in sorted(by_product[prod]):
            title = f.stem
            lines.append(f"- [[{f.as_posix()}|{title}]]")
    safe_write(MOC_DIR / f"MOC-{category.lower()}.md", "\n".join(lines) + "\n")

for cat in migrated:
    write_moc(cat)

# ── 6. _Home.md (Tier-0 index — the ONLY file Claude always loads) ──
home = [
    "---\ntype: home\ntags: [moc, index]\n---\n",
    "# 🧠 Knowledge Home\n",
    "> Shared brain for Romit (Obsidian) + Claude. **Claude: load only this file, "
    "then grep notes by frontmatter (`type:`/`tags:`/`product:`). Never load the whole vault.**\n",
    f"> Last built {TODAY}.\n",
    "## Maps of Content\n",
]
for cat in ["Architecture", "Decisions", "Research", "Specs", "Products", "Memory"]:
    home.append(f"- [[MOCs/MOC-{cat.lower()}|{cat}]] — {len(migrated[cat])} notes")
home += [
    "\n## Pending phases\n",
    "- **Meetings/** — Granola (all folders) → 1 note per meeting (MCP pull)",
    "- **Insights-Hub/** — Claude.ai project files (Drive fetch + manual downloads)",
    "\n## Frontmatter schema\n",
    "`type · product · tags · status · source · date · links` — query these from "
    "Obsidian (Dataview) and Claude (grep).\n",
]
safe_write(VAULT / "_Home.md", "\n".join(home) + "\n")

# ── summary ──
print("migrate-to-vault — Phase 1 complete")
for cat, files in migrated.items():
    print(f"  {cat:14s} {len(files):4d} notes")
print(f"  total: {sum(len(v) for v in migrated.values())} notes → {VAULT}")
