#!/usr/bin/env python3
"""build-insights — turn the curation manifests into a navigable insight layer.

Reads `.curation/*.jsonl` (written by the curation agents), then:
  1. injects `title · summary · relevance · value · theme` into each note's
     existing YAML frontmatter (idempotent — replaces those keys if present),
  2. builds `_Insights.md`: the curated "scan one-liners, not files" index,
     grouped by theme and ranked high→med→low.
"""
from __future__ import annotations
import json
from pathlib import Path

VAULT = Path("/Users/romitsoley/Documents/research-repos")
CUR = VAULT / ".curation"

THEME_ORDER = ["Exam-Assessment", "PCE-CourseEval", "ExxatOne", "FaaS",
               "DS-Architecture", "Research-Findings", "Org-Strategy", "Personal-Other"]
VALUE_RANK = {"high": 0, "med": 1, "low": 2}

# ── load manifests ──
entries = []
for jf in sorted(CUR.glob("*.jsonl")):
    for line in jf.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            entries.append(json.loads(line))
        except json.JSONDecodeError:
            pass

print(f"loaded {len(entries)} manifest entries from {len(list(CUR.glob('*.jsonl')))} batches")

CURATED_KEYS = ("title", "summary", "relevance", "value", "theme")

def yval(v):
    if isinstance(v, list):
        return "[" + ", ".join(str(x) for x in v) + "]"
    return json.dumps(v, ensure_ascii=False)  # safe double-quoted YAML scalar

def inject(path: Path, e: dict):
    if not path.exists():
        return False
    text = path.read_text(encoding="utf-8", errors="replace")
    if not text.startswith("---"):
        return False
    parts = text.split("\n")
    # find closing --- of frontmatter (first line is ---, find next ---)
    close = None
    for i in range(1, len(parts)):
        if parts[i].strip() == "---":
            close = i
            break
    if close is None:
        return False
    fm = [l for l in parts[1:close]
          if not any(l.startswith(f"{k}:") for k in CURATED_KEYS)]
    add = [f"title: {yval(e.get('title',''))}",
           f"summary: {yval(e.get('summary',''))}",
           f"relevance: {yval(e.get('relevance',[]))}",
           f"value: {e.get('value','')}",
           f"theme: {e.get('theme','')}"]
    new = ["---"] + fm + add + ["---"] + parts[close + 1:]
    path.write_text("\n".join(new), encoding="utf-8")
    return True

injected = 0
for e in entries:
    p = VAULT / e.get("path", "")
    if inject(p, e):
        injected += 1
print(f"injected frontmatter into {injected} notes")

# ── build _Insights.md ──
by_theme = {}
for e in entries:
    by_theme.setdefault(e.get("theme", "Personal-Other"), []).append(e)

lines = [
    "---\ntype: insights\ntags: [moc, insights, index]\n---\n",
    "# 💡 Insights — start here\n",
    "> Curated, value-ranked index of the insight-bearing notes (decisions, research, meetings, storytelling). "
    "**Scan the one-liners; open only what's relevant.** Claude: this is the retrieval layer — read here, then open the single matching note (no whole-vault search).\n",
    f"> {len(entries)} notes curated. Value: **high** = directly actionable for research/design · med = context · low = admin/personal.\n",
    "> Filter in Obsidian (Dataview) by `relevance` (research/design/decision) or `value`.\n",
]
total_high = sum(1 for e in entries if e.get("value") == "high")
lines.append(f"\n**{total_high} high-value insights** across {len([t for t in by_theme if by_theme[t]])} themes.\n")

for theme in THEME_ORDER + [t for t in by_theme if t not in THEME_ORDER]:
    items = by_theme.get(theme)
    if not items:
        continue
    items.sort(key=lambda e: (VALUE_RANK.get(e.get("value"), 3), e.get("path", "")))
    hi = sum(1 for e in items if e.get("value") == "high")
    lines.append(f"\n## {theme}  ·  {len(items)} notes ({hi} high)\n")
    for e in items:
        if e.get("value") == "low":
            continue  # keep low out of the curated stream (still in frontmatter/folders)
        path, title = e.get("path", ""), e.get("title", "untitled")
        # make vault-relative + drop .md so the Obsidian wikilink resolves
        vrel = path.replace(str(VAULT) + "/", "").lstrip("/")
        if vrel.endswith(".md"):
            vrel = vrel[:-3]
        summary = e.get("summary", "")
        rel = "/".join(e.get("relevance", [])) or "—"
        badge = "🔹" if e.get("value") == "high" else "▫️"
        lines.append(f"- {badge} **[[{vrel}|{title}]]** — {summary}  · _{rel}_")
    low_n = sum(1 for e in items if e.get("value") == "low")
    if low_n:
        lines.append(f"\n  _({low_n} low-value/admin notes hidden — in the folders + frontmatter, not here.)_")

(VALUE := VAULT / "_Insights.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
print(f"wrote _Insights.md — {total_high} high-value, {len(entries)} total")
