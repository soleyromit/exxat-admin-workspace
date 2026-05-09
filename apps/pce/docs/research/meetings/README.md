# PCE — Research / Meetings

Granola transcripts and meeting notes related to PCE. Maintained by the intake skill (INTAKE-001).

## Naming

`YYYY-MM-DD-<short-slug>.md` — e.g., `2026-05-08-aarti-pce-review.md`

## Frontmatter

```yaml
---
type: meeting
date: YYYY-MM-DD
product: pce
participants: [Aarti, Romit]
source: granola | paste
session: <claude-session-id>
---
```

## How to add one

Don't write directly. Either:

1. Reference a meeting in conversation ("yesterday's call with Aarti about PCE…") — the intake skill will offer to pull from Granola.
2. Paste a Granola transcript into the chat — the skill detects the format and offers to save.
3. Use `/intake` to force the intake routing on the current selection or paste.

The skill extracts decisions (→ ADR) and glossary candidates (→ `apps/pce/docs/content.md`) at save time, with confirmation per item.
