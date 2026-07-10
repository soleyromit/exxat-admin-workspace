---
description: Harvest a shipped design project from the Obsidian vault's projects/ stage into atomic wiki notes (Decisions/Research) with full schema, updating MOCs + _Insights. Enforces the rule that wiki notes are never written directly — only harvested from finished work.
---

Harvest a shipped project from the knowledge vault (`/Users/romitsoley/Documents/research-repos`) into durable wiki notes. This is the distillation step of the Karpathy pipeline (`inbox → projects → wiki`). Read the vault's `CLAUDE.md` first for stage semantics.

**Argument:** `/harvest <project-slug>` names the project file in `projects/`. If no argument, list the `projects/*.md` files whose `status: active` and ask which to harvest (or offer the most recently dated one).

Run the harvest:

1. **Read the project file** in `projects/<slug>.md` fully. Identify its "Decisions reached" bullets and any durable research findings. If the project has no settled conclusions yet, STOP and tell Romit it isn't ready to harvest.

2. **For each durable conclusion, draft an atomic wiki note** — one idea per note — in the correct topic folder:
   - Settled design/product decision → `Decisions/<product>/YYYY-MM-DD-<slug>.md`
   - Research insight / competitor/user finding → `Research/YYYY-MM-DD-<slug>.md`
   - Use the **full schema** from the vault CLAUDE.md (`type · product · source · date · tags · title · summary · relevance · value · theme · status`). `source:` must reference the project (`Harvested from projects/<slug>`). `status:` = `accepted` for settled, `provisional` if still pending a stakeholder.
   - Link related existing notes with `[[…]]`.

3. **Confirm before writing** (vault intake convention): present the drafted notes (path + frontmatter + body) to Romit as a batch and get a yes before creating files. Do not silently write into the shared brain.

4. **On approval, create the notes**, then update the indices:
   - Add each new note to the relevant `MOCs/MOC-*.md` (bump its count).
   - Add insight-bearing notes to `_Insights.md` under the right theme (one-line, value-ranked).

5. **Close out the project**: set the project file's `status: shipped`, populate `harvested: [[[note1]], [[note2]], …]`, and add a `## Harvested` section listing the new wiki notes. Optionally move it to `projects/_shipped/` if that folder exists.

6. **Triage the inbox** (optional, if `inbox/` has items related to this project): promote or delete the raw scraps that got absorbed.

**Hard rule — never violate:** wiki notes (`Decisions/`, `Research/`, `Meetings/`, `Architecture/`) are created **only** through this harvest path from a real project. Never hand-author a wiki note for something that didn't come from shipped work. If Romit asks to "add a decision," first check there's a project it harvests from — if not, capture it in `inbox/` or open a `projects/` file instead.

**Do NOT commit** the vault — it's a separate git repo Romit syncs weekly. Just create/edit the files.
