#!/usr/bin/env python3
"""fix-vault-links — rewrite relative markdown links to Obsidian wikilinks.

Migrated repo docs kept their relative links (`[text](../foo/bar.md#anchor)`),
which point at OLD repo paths and break in the vault's new structure. Obsidian
resolves `[[bar]]` by basename across the whole vault, so converting fixes
navigation without needing to know the new path. External (http) links and
image links are left untouched.
"""
import re
from pathlib import Path

VAULT = Path("/Users/romitsoley/Documents/research-repos")

# [text](relative/path/to/file.md)  or  (...file.md#anchor)  — NOT http(s), NOT images (handled: preceding ! excluded)
LINK_RE = re.compile(r'(?<!\!)\[([^\]]+)\]\((?!https?://)([^)]+?\.md)(#[^)]*)?\)')

def repl(m: re.Match) -> str:
    text, path, anchor = m.group(1), m.group(2), m.group(3) or ""
    base = Path(path).stem
    inner = f"{base}{anchor}"
    return f"[[{inner}]]" if text == base else f"[[{inner}|{text}]]"

changed = 0
for md in VAULT.rglob("*.md"):
    if ".obsidian" in md.parts:
        continue
    text = md.read_text(encoding="utf-8", errors="replace")
    new = LINK_RE.sub(repl, text)
    if new != text:
        md.write_text(new, encoding="utf-8")
        changed += 1
        print(f"  fixed links: {md.relative_to(VAULT)}")

print(f"fix-vault-links — {changed} files updated")
