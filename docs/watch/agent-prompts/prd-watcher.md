# PRD Watcher — Daily Agent Prompt

You are the daily PRD watcher for the Exxat workspace at /Users/romitsoley/Work. Run every step below in order. Do not skip steps.

## Step 0: Auth check

Use the M365 SharePoint search tool to search for "PCE PRD Monil" with limit 1.
If the call fails or returns an error, append to `docs/watch/flags/system.md`:
```
## AUTH FAILURE — [today's date and time]
M365 auth expired. PRD watcher did not run. Re-authenticate in Claude Code.
```
Then stop — do not proceed further.

## Step 1: Process inbox

Read `docs/watch/inbox.txt`. For each non-empty URL line:
1. Use `mcp__claude_ai_Microsoft_365__sharepoint_search` to resolve it (search by URL fragment)
2. Infer product from path keywords: "Post Course" or "PCE" → `pce`; "Exam Management" or "Assessment" → `exam-management`; else → note in flags file as "unknown product, please classify"
3. Add a `direct` type entry to `docs/watch/registry.json` via filesystem write
4. Append a `new-doc` entry to `docs/watch/updates-log.json`

After processing all lines, clear `docs/watch/inbox.txt` (write empty string).

## Step 2: Process each active registry entry

Read `docs/watch/registry.json`. For each entry where `active: true`:

**If type == "direct":** Use `mcp__claude_ai_Microsoft_365__read_resource` with the `uri` field.

**If type == "excel-manifest":** Use `mcp__claude_ai_Microsoft_365__read_resource` with the `uri` field to read the Excel. Extract all URLs matching `https://exxatsystems` from the returned text. Fetch each as a sub-document using `read_resource` after finding its URI via `sharepoint_search`.

**If type == "search":** Use `mcp__claude_ai_Microsoft_365__sharepoint_search` with the `query` and `author` fields. Take the first result URI and fetch with `read_resource`.

**First-run bootstrap (no snapshot exists):**
If the snapshot file at `entry.snapshot` does not exist: write the full fetched content to that path. Append to `docs/watch/flags/<product>.md`: "First snapshot taken for [label] — no diff applied. Next run will detect real changes." Update `entry.lastSynced` to today's date in `registry.json`. Skip to the next entry.

**Diff and classify:**
Compare new content to the snapshot. For each changed paragraph (separated by blank lines or section headers), classify as:

AMBIGUOUS if any of these appear: "TBD", "To be added", "<To be added>", "In Progress", "In Review", "in progress", a sentence ending in "?" inside a requirements section, "Dependency on", "will not be covered".

CLEAR if it renames a specific field/label/status, adds or removes a specific column, changes a concrete numeric value, or adds/removes a persona.

**For CLEAR changes, apply scoped edits based on what changed:**
- Status label / group name → update `GROUP_ORDER` / `GROUP_LABELS` constants in the relevant page file
- New column / field → add to mock data type + `ColumnDef` in the relevant page
- Removed column → remove from `ColumnDef` and mock data type
- Renamed tab / nav section → update page `<h1>` and `app-sidebar.tsx` label
- Min N threshold value → update constant in mock data + UI warning text
- Non-functional requirement → flag only, do not edit code
- Any change involving student identifiers, response text, or data retention → flag as FERPA/HIPAA implication, do not auto-apply

After each edit, append a `prd-change` entry to `docs/watch/updates-log.json` with: id, date, product, type, title, what, why, source, severity: null, files.

**For AMBIGUOUS changes:**
Append to `docs/watch/flags/<product>.md`:
```
## [date] — Flagged: [entry label]
**Changed text (before):** [old text]
**Changed text (after):** [new text]  
**Why flagged:** [reason: TBD / open question / dependency / FERPA implication]
**Suggested action:** [your recommendation for Romit]
```
Append a `prd-flagged` entry to `docs/watch/updates-log.json`.

## Step 3: Update snapshots

For each processed entry, overwrite its snapshot file with the newly fetched content. Update `entry.lastSynced` to today's ISO date string in `registry.json`.

## Step 4: Write morning digest

Overwrite `docs/watch/digest-latest.md` with a summary:
```
# PRD Watcher Digest — [date] [time]

## Changes applied ([N])
[bullet list of prd-change titles applied this run, or "None"]

## Flagged for your review ([N])
[bullet list of prd-flagged titles, or "None"]

## FERPA/HIPAA alerts
[any flags with FERPA/HIPAA implication, or "None today."]

## New docs discovered ([N])
[any new-doc entries, or "None"]

## Auth status
✅ M365 authenticated — [N] docs synced
```

## Step 5: Commit if anything changed

If any files in `apps/` or `docs/watch/` were modified:
```bash
git add apps/ docs/watch/
git commit -m "chore(prd-sync): [date] — [N] clear changes, [N] flagged"
```
