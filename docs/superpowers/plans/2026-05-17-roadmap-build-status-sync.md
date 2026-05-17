# Roadmap → BUILD-STATUS Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When Nipun updates the Excel roadmap on SharePoint (feature statuses, phase completions), automatically reflect those changes in `docs/BUILD-STATUS.md` so the repo always has an accurate build status without manual updates.

**Architecture:** The PRD watcher already reads Nipun's Excel as an `excel-manifest` entry. This plan adds a new Step 7 to the PRD watcher prompt that specifically processes the project status grid from the Excel content and diffs it against `BUILD-STATUS.md`. Status changes are applied directly to the relevant sections of `BUILD-STATUS.md`. A lightweight status-mapping table in the agent prompt translates Excel status values to BUILD-STATUS language.

**Tech Stack:** Agent prompt modification only — no new code. The Excel is already being read; this adds status-extraction and BUILD-STATUS update logic to the existing watcher.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `docs/watch/agent-prompts/prd-watcher.md` | Modify | Add Step 7: extract status from Excel, update BUILD-STATUS.md |
| `docs/BUILD-STATUS.md` | Runtime write | Agent updates product status rows when Excel changes |
| `docs/watch/updates-log.json` | Runtime write | Agent appends `prd-change` entries for status updates |

---

### Task 1: Understand the Excel status grid structure

Before modifying the agent prompt, document what Nipun's Excel contains so the agent knows what to look for.

- [ ] **Step 1: Re-read the Excel content we already captured**

From the session where we read the Excel, the content included these columns:
```
Release Item | Status | Phase | QA Env Status | UAT Env Status
```

Status values seen:
- `In Progress (final review)` → maps to 🟡 In Progress
- `In Progress` → maps to 🟡 In Progress
- `Completed` → maps to 🟢 Built
- `Not Started` → maps to ⚪ Not started
- `Initial Prototyping` → maps to 🔵 Prototyping
- `In progress` → maps to 🟡 In Progress
- `TBD` → no change (skip)

Phase values seen:
- Phase 1: The Foundation
- Phase 2: Readiness for Cohere

This is the mapping table the agent will use.

- [ ] **Step 2: Document the mapping** in a reference comment (no code needed — this is for the agent prompt):

```
Excel Status          → BUILD-STATUS emoji + label
─────────────────────────────────────────────────
Completed             → 🟢 Built / Shipped
In Progress           → 🟡 In Progress
In Progress (final review) → 🟡 In Progress (final review)
Initial Prototyping   → 🔵 Initial Prototyping
Not Started           → ⚪ Not started
TBD                   → (skip — no update)
```

---

### Task 2: Extend PRD watcher with BUILD-STATUS update step

**Files:**
- Modify: `docs/watch/agent-prompts/prd-watcher.md`

- [ ] **Step 1: Read the current agent prompt**

```bash
cat /Users/romitsoley/Work/docs/watch/agent-prompts/prd-watcher.md
```

- [ ] **Step 2: Append Step 7 to the agent prompt** (after the existing Step 6: Extract decisions):

```markdown
## Step 7: Sync Excel roadmap to BUILD-STATUS.md

This step runs ONLY when the `exam-roadmap-nipun` registry entry was processed in Step 2 (Nipun's Excel manifest).

### 7a: Extract the project status grid from the Excel content

The Excel content contains a table with these columns (or similar):
- `Release Item` — the feature name
- `Requirement Readiness` / `Status` — current status
- `Development` — dev status  

Look for lines that match the pattern: `[Feature Name] | [Status]` or rows in the project status section (labeled "Project Status | Exam Management").

Extract each item as: `{ feature: string, status: string, phase: string }`

### 7b: Map Excel status values to BUILD-STATUS language

Use this exact mapping:
```
"Completed"                  → "🟢 Shipped"
"In Progress (final review)" → "🟡 In Progress (final review)"  
"In Progress"                → "🟡 In Progress"
"Initial Prototyping"        → "🔵 Initial Prototyping"
"Not Started"                → "⚪ Not started"
"TBD"                        → SKIP (no update)
"In progress"                → "🟡 In Progress"
```

### 7c: Read BUILD-STATUS.md and update the Exam Management section

Read `docs/BUILD-STATUS.md`. Find the `## Exam Management` section.

For each extracted feature-status pair:
1. Search for the feature name (or a close match) in the Exam Management section
2. If found and the status has changed: update the status emoji and label inline
3. If not found: append the item to the "What's built" or "What's NOT done yet" list based on status — Completed/In Progress items go in "What's built", Not Started items go in "What's NOT done yet"

### 7d: Update the "Last updated" date at the top of BUILD-STATUS.md

Change `> Last updated: YYYY-MM-DD` to today's date.

### 7e: Write the changes

If any status changed:
1. Write the updated `BUILD-STATUS.md`
2. Append a `prd-change` entry to `docs/watch/updates-log.json`:
```json
{
  "id": "[date]-exam-management-build-status-[seq]",
  "date": "[today]",
  "product": "exam-management",
  "type": "prd-change",
  "title": "BUILD-STATUS updated from Nipun's roadmap Excel",
  "what": "[list of features whose status changed, e.g. 'Question Bank: In Progress → Shipped']",
  "why": "Nipun's roadmap Excel updated — status changes detected in project status grid",
  "source": "Exam Mgmt Roadmap — Nipun (Excel manifest)",
  "severity": null,
  "files": ["docs/BUILD-STATUS.md"]
}
```

If nothing changed: skip — no commit, no log entry.
```

- [ ] **Step 3: Commit**

```bash
git -C /Users/romitsoley/Work add docs/watch/agent-prompts/prd-watcher.md
git -C /Users/romitsoley/Work commit -m "feat(prd-watcher): add Step 7 — sync Nipun Excel roadmap status to BUILD-STATUS.md"
```

---

### Task 3: Add a BUILD-STATUS section for PCE to make it sync-able

The current `BUILD-STATUS.md` has Exam Management and Portal sections. PCE needs a consistent structure so the agent can update it when Monil's PRD phases change.

- [ ] **Step 1: Read the current PCE section of BUILD-STATUS.md**

```bash
grep -n "PCE\|pce" /Users/romitsoley/Work/docs/BUILD-STATUS.md | head -10
```

- [ ] **Step 2: Ensure the PCE section has explicit status markers**

If the PCE section doesn't already have a "What's built" / "What's NOT done yet" structure, add it. Find the PCE section and ensure it has:

```markdown
## PCE (`apps/pce/admin/`) — port 3005

**Status:** 🟡 In Progress — routes built, mock data, no real API

**What's built:**
- [list of built features]

**What's NOT done yet:**
- [list of pending features]
```

- [ ] **Step 3: Commit if changed**

```bash
git -C /Users/romitsoley/Work add docs/BUILD-STATUS.md
git -C /Users/romitsoley/Work diff --cached --quiet || git -C /Users/romitsoley/Work commit -m "chore(build-status): standardise PCE section structure for agent sync"
```

---

### Task 4: Extend PRD watcher to also sync PCE phases from PRD

**Files:**
- Modify: `docs/watch/agent-prompts/prd-watcher.md`

- [ ] **Step 1: Append to Step 7** (the BUILD-STATUS step) with a sub-section for PCE:

```markdown
### 7f: Sync PCE PRD phases to BUILD-STATUS.md (when PCE PRD was synced)

This sub-step runs ONLY when the `pce-prd-monil` entry was processed.

From the PCE PRD, extract the timeline section:
- Phase 1 launch target: 30 August 2026
- Development breakdown: June (Template + Push Survey), July (Student + per-survey analytics), August (Multi-survey analytics)

Map to BUILD-STATUS:
- If any phase is described as complete in the PRD → mark as 🟢 Shipped in BUILD-STATUS PCE section
- If a phase has a concrete date → add it as a target date annotation

Update the PCE section of BUILD-STATUS.md with the current phase status and target date.
```

- [ ] **Step 2: Commit**

```bash
git -C /Users/romitsoley/Work add docs/watch/agent-prompts/prd-watcher.md
git -C /Users/romitsoley/Work commit -m "feat(prd-watcher): Step 7f — sync PCE PRD phases to BUILD-STATUS.md"
```

---

**Plan 4 complete.** `BUILD-STATUS.md` stays current automatically — whenever Nipun marks a feature complete in the Excel or Monil updates the PCE PRD timeline, the status in the repo reflects it by next morning.
