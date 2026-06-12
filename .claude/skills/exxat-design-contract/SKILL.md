---
name: exxat-design-contract
description: >-
  Produce a verified Design Contract before any JSX — Spec Parse, Mobbin
  research, DS component table, interaction states, WCAG, banned patterns.
  Load AFTER exxat-senior-ux brief is confirmed, or when a spec doc or Claude
  Design HTML is present. § 0 uses Opus; implementation uses Sonnet.
user-invocable: true
---

# Exxat Design Contract — pre-code gate

This skill runs BETWEEN the exxat-senior-ux brief and the first line of JSX.
It produces one mandatory output block. No `Write`, `Edit`, or `MultiEdit`
fires in the same turn as the contract.

## When to load

| Condition | Load? |
|---|---|
| `exxat-senior-ux` brief confirmed → build phase begins | **YES — always** |
| ≥2 new DS component imports being added to an existing file | **YES** |
| A `.md` spec doc is open in IDE OR referenced in prompt | **YES — for § 0** |
| A Claude Design HTML file is shared | **YES — for § 3 mapping** |
| `ds-adoption-reviewer` returns IMPORT or VENDOR verdict | **YES** |
| Single prop tweak, copy change, token swap | No |

## Model directive

**Switch to Opus before running this skill** (`/model claude-opus-4-8`).
Return to Sonnet for implementation (`/model claude-sonnet-4-6`).

| Task | Model |
|---|---|
| § 0 Spec Parse — reading source docs, extracting requirements | **Opus** |
| § 1–2 — Mobbin research + UX analogy | **Opus** |
| § 3–6 — DS mapping, states, WCAG, banned patterns | Sonnet |
| All Write/Edit/MultiEdit (implementation) | Sonnet |

## Hard gate

Your next message after loading this skill = the Design Contract block.
No code tools fire in the same turn.
End the turn with **"Contract ready — confirm or edit."**
User reply is the green light to write code.

---

## § 0 — Spec Parse

### When § 0 triggers
- A `.md` file path appears in the IDE system-reminder (file open in editor)
- User's message contains a file path ending in `.md`
- User says "per the spec", "per the doc", "as per the requirements", or similar
- Does NOT trigger on: CLAUDE.md, governance docs, pattern docs, memory files

### Source doc priority (always go to source, not the interpreted MD)

| Source type | How to read |
|---|---|
| SharePoint PRD (`.docx`) | `mcp__claude_ai_Microsoft_365__read_resource` with the file URI |
| Granola meeting transcript | `mcp__claude_ai_Granola__get_meeting_transcript` with the meeting ID |
| Claude Design HTML | Read the file locally, decompress the `__bundler/template` script |
| Interpreted `.md` file | Starting point only — find its "Source:" header, then read the actual source |

**Assessment creation sources** (for reference):
- PRD URI: `file:///b!_2xYksJpY02i2c_IMdywfj_GsYw4nixMmuYHQiw9DyEF5rFuOn4TQp2p2E75ioRS/01TEBFVP2VHHTFHJ5TAJH2DS74JZCL3LVT`
- Claude Design HTML: `/Users/romitsoley/Downloads/Assessment Creation (offline).html`
- Granola meetings: `d4f85e99` (Jun 3), `e97078d1` (Jun 4), `af529725` (May 14)

### Extraction format
```
### § 0 Spec Parse — [document name]
Source: [path or URI]

REQ-01  [requirement text]   → IMPLEMENTING / PARTIAL / DEFERRED / NOT IN SCOPE
REQ-02  [requirement text]   → IMPLEMENTING / PARTIAL / DEFERRED / NOT IN SCOPE
...

⚠ Contradictions:  [spec says X, current code does Y — or "none"]
⚠ Scope gaps:      [requirements with no corresponding component — or "none"]
```

Every requirement, constraint, decision, and scope note gets a REQ-XX line.
Flag every contradiction between the spec and existing code.
Flag every requirement with no corresponding component or file.
Do NOT start from 1 if the spec was parsed in a prior turn — continue numbering.

---

## § 1 — Mobbin

Run `mcp__mobbin__search_screens` and/or `mcp__mobbin__search_flows` BEFORE
writing the contract. Search for job types, not domain names.

```
query: "[job type not domain]"  →  [Product / Flow / ScreenID]   [mobbin_url]
query: "[job type]"             →  [Product / Flow / ScreenID]   [mobbin_url]
query: "[job type]"             →  [Product / Flow / ScreenID]   [mobbin_url]
```

Minimum 3 results. Always cite the `mobbin_url` so the user can open it.
If Mobbin returns no relevant results, state that explicitly.

---

## § 2 — UX analogy

Name a specific SaaS product and a specific interaction pattern.

```
UX analogy:  [SaaS product] — [specific named pattern]
             e.g. "Linear — inline status picker: click → popover, Esc dismisses, no modal"
             e.g. "Notion — property panel: side-docked, collapses to icon rail at < 900px"
```

Generic references ("similar to Google Forms") are not acceptable.
Name the exact pattern and how it behaves.

---

## § 3 — DS components

Before writing this section:
1. Run `python3 -c "import json; snap=json.load(open('`node tools/ds/source.mjs --list`')); [print(e) for e in snap['profiles']['admin']['exports']]"` or grep the snapshot
2. Verify every component in your plan exists in the exports list
3. If a component isn't in the list → it doesn't exist; find the correct name or build locally

**If a Claude Design HTML was shared:** map every design class to a DS component first.
Common mappings:
- `.btn.primary` → `<Button variant="default">`
- `.btn.brand` → `<Button className="bg-[var(--brand-color)] text-white">`
- `.btn.ghost` → `<Button variant="ghost">`
- `.btn.outline` → `<Button variant="outline">`
- `.btn.ai` → `<Button className="[background:var(--leo-gradient)] text-white">`
- `.card` → `<Card>`
- `.chip` → `<Badge variant="outline" className="rounded-full">`
- `.tag` → `<Badge variant="secondary">`
- `.input` → `<Input>`
- `.tabs button[aria-selected]` → `<TabsTrigger>`
- `.nav-item[aria-current]` → `<SidebarMenuButton isActive>`
- Radio tile label + hidden RadioGroupItem → `<RadioGroup>` + `<RadioGroupItem className="sr-only">` + `<label>`

```
DS components:
  Component     | Variant      | Size | Token used           | Snapshot ✓ | DS ref (localhost:4000)
  ------------- | ------------ | ---- | -------------------- | ---------- | ------------------------
  Button        | default      | sm   | —                    | exports[N] | localhost:4000/library/button
  Badge         | secondary    | —    | --muted-foreground   | exports[N] | localhost:4000/library/badge
  DataTable     | —            | —    | —                    | exports[N] | localhost:4000/library/data-table
  ...
```

**The `DS ref` column is the handoff to implementation.** Every row must cite the
exact localhost:4000 surface the component should look like — including the
variant the DS uses for *this kind of surface* (list surface → list-card 12px,
not generic Card 16px). This is what tells the implementer (often Sonnet) what to
build, instead of leaving it to re-derive from memory. A contract with no DS ref
URLs is not a complete handoff. Post-implementation, `visual-diff.mjs` is run
against these same surfaces (the Stop gate `ds-claim-gate.py` enforces it).

---

## § 4 — Interaction states

Declare all 5 states or mark N/A. No code until all states are decided.

```
Interaction states:
  State     | Trigger        | Visual              | DS prop / component
  --------- | -------------- | ------------------- | --------------------
  loading   | async fetch    | Skeleton            | —
  empty     | no items       | EmptyState          | —
  error     | API failure    | LocalBanner         | variant="error"
  disabled  | no permission  | Button disabled     | disabled={true}
  success   | save complete  | LocalBanner         | variant="success"
```

---

## § 5 — WCAG pre-flight

Check before writing, not after.

```
WCAG pre-flight:
  Element        | Check            | Result          | Fix
  -------------- | ---------------- | --------------- | ----
  text-xs muted  | contrast ≥4.5:1  | X.X:1 PASS/FAIL | —
  icon-only btn  | aria-label       | present / MISS  | add aria-label="…"
  focus order    | logical tab seq  | verified / MISS | —
  min font size  | ≥12px everywhere | PASS / FAIL     | replace text-[10px]
```

---

## § 6 — Banned patterns

Declare ✓ none used OR ⚠ exception + reason for each.
No exception is acceptable without a written reason.

```
Banned patterns:
  ☐ Raw <button>                        ✓ none / ⚠ [reason — DS Button used instead]
  ☐ Raw <input> / <select>              ✓ none / ⚠ [reason]
  ☐ Raw <table> / <tr> / <td>           ✓ none / ⚠ [reason]
  ☐ fontSize: N on FA icons             ✓ none / ⚠ [reason — use text-xs/text-sm]
  ☐ px-3 py-2.5 rounded-lg border      ✓ none / ⚠ [reason — use flat border-b rows]
  ☐ color-mix(in oklch                  ✓ none / ⚠ [reason]
  ☐ toast() for product feedback        ✓ none / ⚠ [reason — use LocalBanner]
  ☐ uppercase tracking-wide             ✓ none / ⚠ [reason]
  ☐ hardcoded hex or rgb                ✓ none / ⚠ [reason — use var(--token)]
```

---

## Full contract template (copy verbatim into chat)

```
### Design Contract — [ComponentName / FeatureName]

## § 0  Spec Parse  (skip if no spec doc present)
Source: [path]
REQ-01  ...  → IMPLEMENTING
...
⚠ Contradictions: [or "none"]
⚠ Scope gaps:     [or "none"]

---

## § 1  Mobbin
query: "..."  →  [Product/Flow/ScreenID]  [url]
query: "..."  →  [Product/Flow/ScreenID]  [url]
query: "..."  →  [Product/Flow/ScreenID]  [url]

## § 2  UX analogy
[SaaS product] — [specific named interaction pattern]

## § 3  DS components
Component     | Variant  | Size | Token              | Snapshot ✓ | DS ref (localhost:4000)
------------- | -------- | ---- | ------------------ | ---------- | ------------------------
...

## § 4  Interaction states
State    | Trigger  | Visual     | DS prop
-------- | -------- | ---------- | -------
loading  | ...      | Skeleton   | —
empty    | ...      | EmptyState | —
error    | ...      | LocalBanner| variant="error"
disabled | ...      | ...        | disabled={true}
success  | ...      | LocalBanner| variant="success"

## § 5  WCAG pre-flight
Element  | Check       | Result  | Fix
-------- | ----------- | ------- | ---
...

## § 6  Banned patterns
☐ Raw <button>               ✓ none
☐ Raw <input> / <select>     ✓ none
☐ Raw <table>/<tr>/<td>      ✓ none
☐ fontSize: N on FA icons    ✓ none
☐ px-3 py-2.5 rounded-lg     ✓ none
☐ color-mix(in oklch          ✓ none
☐ toast()                    ✓ none
☐ uppercase tracking-wide    ✓ none
☐ hardcoded hex/rgb           ✓ none

Scope boundary: [what this does NOT do]
```

End the turn with: **Contract ready — confirm or edit.**

---

## Scope boundary field

State explicitly what this component does NOT do.
This prevents scope creep during implementation and post-code review surprises.

Examples:
- "Does not handle multi-course association — single course only in V0"
- "Does not persist dates — state only until builder navigation"
- "Does not validate date order — deferred to server validation"

---

## Anti-patterns (do not do these)

- Writing § 3 from memory without grepping the snapshot
- Writing § 6 "✓ none" without actually checking the content you're about to write
- Skipping § 0 because "the MD file covers it" — the MD file loses context
- Running Mobbin AFTER deciding on a layout — run it before
- Writing the contract and then immediately writing code in the same turn
