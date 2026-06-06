# Design Contract Enforcement
**Date:** 2026-06-06
**Scope:** All products — exam-management, pce, portal
**Status:** Proposed

---

## Problem

### Four systematic violation patterns (found across EM + PCE, 100+ instances)

| # | Pattern | Example | Frequency |
|---|---------|---------|-----------|
| P1 | Raw `<button>` with inline reset | `<button style={{fontSize:12, background:'none', border:'none'}}>` | 65+ instances |
| P2 | Inline `fontSize` on FA icons | `<i style={{fontSize:12}} />` | 60+ instances |
| P3 | Banned card row padding | `px-3 py-2.5 rounded-lg border` | 9+ instances |
| P4 | Raw `<input>`/`<select>`/`<table>` | `<input style={{fontSize:13, height:36}}>` | 15+ instances |

### Root causes

```
DS package exists → Claude writes from training data memory, not from DS API
Spec doc is shared → Claude reads for intent, not line-by-line requirements
Skills exist      → Claude invokes them selectively, not as enforced gates
Agents run post-code → Violations caught after they're baked in (rewrites = token waste)
```

### What is NOT the problem

- The DS (`@exxatdesignux/ui`) is not too complex — ~100 exports, standard shadcn structure
- The monorepo is not broken — three products sharing one DS package is normal
- The skills and agents are not wrong — they run at the wrong stage (post vs pre)

---

## Solution: Three additive artifacts

Nothing is removed. `exxat-senior-ux` is unchanged.

```
┌─────────────────────────────────────────────────────────────────────┐
│                        DESIGN PIPELINE                              │
│                                                                     │
│  MD spec open / referenced                                          │
│    └─ [NEW] Spec Parse: REQ-XX per line, gaps + contradictions      │
│         ↓ confirmed                                                 │
│  Surface decision (new page, redesign, rebuild)                     │
│    └─ exxat-senior-ux: WHAT, pattern, reference  [UNCHANGED]        │
│         ↓ brief confirmed                                           │
│  Component implementation                                           │
│    └─ [NEW] exxat-design-contract: HOW each component is built      │
│         § 0  Spec Parse (if doc present)                            │
│         § 1  Mobbin (3 MCP-verified screen IDs)                     │
│         § 2  UX analogy (named SaaS pattern)                        │
│         § 3  DS component table (snapshot-verified)                 │
│         § 4  Interaction states (all 5 declared)                    │
│         § 5  WCAG pre-flight (actual numbers)                       │
│         § 6  Banned patterns declaration                            │
│         ↓ confirmed                                                 │
│  Code write                                                         │
│    └─ [NEW] ds-snapshot-inject.mjs: DS exports injected in context  │
│    └─ [UPDATED] exxat-brief-gate.mjs: banned pattern detection      │
│         ↓                                                           │
│  Post-code (unchanged)                                              │
│    └─ verification-reviewer / compliance-reviewer / state-review    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Artifact 1 — `exxat-design-contract` skill

**File:** `.claude/skills/exxat-design-contract/SKILL.md`

### Trigger conditions (additive to `exxat-senior-ux`, never replacing)

| Condition | Load? |
|-----------|-------|
| `exxat-senior-ux` brief confirmed → build phase begins | **YES — always** |
| Adding ≥2 new DS component imports to existing file | **YES** |
| `ds-adoption-reviewer` returns IMPORT or VENDOR verdict | **YES** |
| MD spec doc is open in IDE or referenced in prompt | **YES — for § 0** |
| Single-prop tweak, copy change, token swap | No |

### Hard gate

Next message after loading = the Design Contract block. No `Write`, `Edit`, or `MultiEdit` tool fires in the same turn. End turn with "Contract ready — confirm or edit."

### Contract format

```
### Design Contract — [ComponentName / FeatureName]

## § 0  Spec Parse  (skip if no spec doc present)
Source: [path/to/spec.md]

REQ-01  [requirement text from doc]   → IMPLEMENTING / PARTIAL / DEFERRED / NOT IN SCOPE
REQ-02  [requirement text]            → IMPLEMENTING / PARTIAL / DEFERRED / NOT IN SCOPE
...

⚠ Contradictions:  [spec says X, current code does Y — or "none"]
⚠ Scope gaps:      [requirements with no corresponding component — or "none"]

---

## § 1  Mobbin
query: "[job-type not domain]"  →  [Product / Flow / ScreenID]
query: "[job-type]"             →  [Product / Flow / ScreenID]
query: "[job-type]"             →  [Product / Flow / ScreenID]

## § 2  UX analogy
[SaaS product] — [specific named interaction pattern]
e.g. "Linear — inline status picker: click → popover, Esc dismisses, no modal"

## § 3  DS components
Component     | Variant   | Size | Token used           | Snapshot line
------------- | --------- | ---- | -------------------- | -------------
Button        | ghost     | sm   | —                    | exports[42]
Input         | —         | —    | —                    | exports[67]
Badge         | secondary | —    | --muted-foreground   | exports[8]

## § 4  Interaction states
State     | Trigger        | Visual change    | DS prop / component
--------- | -------------- | ---------------- | --------------------
loading   | async fetch    | Skeleton         | —
empty     | no items       | EmptyState       | —
error     | API failure    | LocalBanner      | variant="error"
disabled  | no permission  | Button disabled  | disabled={true}
success   | save complete  | LocalBanner      | variant="success"

## § 5  WCAG pre-flight
Element        | Check            | Result          | Fix
-------------- | ---------------- | --------------- | ----
text-xs muted  | contrast ≥4.5:1  | X.X:1 PASS/FAIL | —
icon-only btn  | aria-label       | present / MISS  | add aria-label
focus order    | logical tab seq  | verified / MISS | —

## § 6  Banned patterns  (each must be ✓ none used OR ⚠ exception + reason)
☐ Raw <button>                        ✓ none used / ⚠ [reason]
☐ Raw <input> / <select>              ✓ none used / ⚠ [reason]
☐ Raw <table> / <tr> / <td>           ✓ none used / ⚠ [reason]
☐ fontSize: N on FA icons             ✓ none used / ⚠ [reason]
☐ px-3 py-2.5 rounded-lg border       ✓ none used / ⚠ [reason]
☐ color-mix(in oklch                  ✓ none used / ⚠ [reason]
☐ toast() for product feedback        ✓ none used / ⚠ [reason]
☐ uppercase tracking-wide             ✓ none used / ⚠ [reason]

## Scope boundary
This component does NOT: [explicit list]
```

### § 0 Spec Parse — when it triggers

Triggers when ANY of these is true:
- A `.md` file path appears in the IDE system-reminder (file is open in editor)
- The user's message contains a file path ending in `.md`
- The user says "per the spec", "per the doc", "as per the requirements", or similar

Does NOT trigger on: CLAUDE.md files, governance docs, pattern docs, or memory files.

### § 0 Spec Parse — how to extract requirements

1. Read the `.md` file completely — not for intent, line by line
2. Every requirement, constraint, decision, and scope note gets a `REQ-XX` line
3. Status options: `IMPLEMENTING` / `PARTIAL` (partially covered) / `DEFERRED` (known gap, deliberate) / `NOT IN SCOPE` (explicitly excluded)
4. Flag any contradiction between the spec and existing code
5. Flag any requirement that has no corresponding component or file
6. Do not start REQ count from 1 each time — continue numbering across sessions if the spec was parsed before (check for prior parse in conversation)

---

## Artifact 2 — `ds-snapshot-inject.mjs`

**File:** `.claude/hooks/ds-snapshot-inject.mjs`
**Hook type:** `PreToolUse`
**Matcher:** `Write|Edit|MultiEdit` where file path ends in `.tsx` or `.jsx`
**Permission:** Always `allow` — advisory only, never blocks

### Behavior

```
1. Read tool input → extract file_path
2. If file_path ends with .tsx or .jsx:
   a. Read docs/foundations/ds-snapshot.json
   b. Extract profiles.admin.exports (flat component list)
   c. Return permission: "allow" with agent_message:
      "DS SNAPSHOT — valid @exxatdesignux/ui exports at write time:
       [comma-separated list]
       Cross-check every import against this list before writing.
       If a component name is not here, it does not exist in the DS."
3. If not a TSX/JSX file: silent allow, no message
```

### Why advisory and not blocking

The hook can't read the conversation to know if the Design Contract was already confirmed. Making it a hard block creates false positives on valid post-contract writes. The value is context injection — Claude sees the actual API before writing, eliminating the training-data-memory fallback.

---

## Artifact 3 — `exxat-brief-gate.mjs` updates

**File:** `.claude/hooks/exxat-brief-gate.mjs` (existing file, additive change)

### Four new pattern checks (added inside existing content inspection logic)

When the tool input content is available (Write with content, or Edit with new_string):

```
Pattern P1: content contains `<button` (lowercase, not <Button)
  → escalate to ask
  → agent_message: "[P1] Raw <button> detected. Use DS Button with explicit variant + size."
  → user_message: "Raw <button> about to be written — approve only if Design Contract § 6 declared an exception."

Pattern P2: content contains `fontSize:` anywhere in a style prop (covers icons, inputs, spans)
  → escalate to ask  
  → agent_message: "[P2] Inline fontSize detected. Use DS text-xs / text-sm / text-base class. For inputs use DS Input component."

Pattern P3: content contains `px-3 py-2.5` with `rounded-lg border`
  → escalate to ask
  → agent_message: "[P3] Banned card row pattern. Use flat border-b row or DS ListItem."

Pattern P4: content contains `<input ` or `<select ` or `<table ` (raw HTML)
  → escalate to ask
  → agent_message: "[P4] Raw HTML form/table element. Use DS Input / Select / DataTable."
```

Pattern checks run after existing design-critical-path check. They do not replace it.

---

## Settings.json change

Add `ds-snapshot-inject.mjs` as a second PreToolUse hook entry:

```json
{
  "matcher": "Write|Edit|MultiEdit",
  "hooks": [
    {
      "type": "command",
      "command": "node .claude/hooks/ds-snapshot-inject.mjs"
    }
  ]
}
```

Sits alongside existing `exxat-brief-gate.mjs` entry. Both fire on every TSX write.

---

## What this does NOT change

| Thing | Stays the same |
|-------|---------------|
| `exxat-senior-ux` skill | Unchanged — still owns surface decisions |
| `ds-component-check` skill | Unchanged — still handles import resolution |
| `ds-adoption-reviewer` agent | Unchanged — still fires before new component files |
| `verification-reviewer` / `compliance-reviewer` | Unchanged — still run post-code |
| `exxat-brief-gate.mjs` existing logic | Unchanged — pattern checks are additive |
| Per-product CLAUDE.md files | No changes needed — Design Contract is workspace-level |
| Root CLAUDE.md | Pre-task declaration section updated to reference Design Contract |

---

## CLAUDE.md update (root)

Replace the current pre-task declaration block:

```
// CURRENT (vague — remove)
**Pre-task declaration (BEFORE touching any file — no exceptions):**
Write this block before any code: ...
```

With:

```
// NEW
**Pre-task declaration (BEFORE touching any file — no exceptions):**

Step 1 — If a .md spec is open in IDE or referenced in the prompt:
  Load exxat-design-contract → run § 0 Spec Parse
  Output: REQ-XX per line with IMPLEMENTING / PARTIAL / DEFERRED / NOT IN SCOPE
  Call out contradictions and scope gaps explicitly
  End turn. Wait for confirmation.

Step 2 — Before writing any JSX:
  Load exxat-design-contract → output full contract (§ 1–6)
  End turn. Wait for confirmation before any Write/Edit/MultiEdit.

These two steps replace the current 6-field declaration block.
The DS environment line, violation list, and WCAG static read are
now covered by § 3 (DS components), § 6 (banned patterns), and § 5 (WCAG).
```

---

## Success criteria

| Signal | Current | Target |
|--------|---------|--------|
| Raw `<button>` per session | 27+ (EM), 38+ (PCE) | 0 — hook catches at write time |
| Inline `fontSize` on icons | 60+ | 0 — P2 pattern check |
| Spec requirements tracked | Intent only | REQ-XX per line, status per item |
| DS component verified before use | Never | Always — snapshot injected at write time |
| Contradictions with spec surfaced | Never | Every session, before first line of code |

---

## Out of scope

- Fixing existing violations in EM/PCE — separate cleanup task
- Changing `exxat-senior-ux` brief template
- Adding new post-code review agents
- Any changes to the DS package itself
- Portal product (apply after EM + PCE validated)
