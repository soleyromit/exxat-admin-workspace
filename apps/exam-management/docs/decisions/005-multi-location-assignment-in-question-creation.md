---
type: decision
date: 2026-05-13
product: exam-management
status: Accepted
source: conversation
session: 2026-05-13-qb-folder-actions
---

# ADR-005 — Question creation supports multi-location assignment; Copy to Folder serves post-creation location expansion

## Status

Accepted

## Context

A question's folder assignments (locations) are references/tags in the master repository (see ADR-004). Historically, a new question defaulted to a single folder determined by the entry point (e.g., the folder the author was browsing when they clicked "+ Add Question"). This single-location default is insufficient for workflows where faculty intend a question to live in multiple places from the start, and creates unnecessary friction (create → then separately Copy to Folder for each additional location).

## Decision

### Creation-time: multi-location assignment

The **Question creation form** includes a **Locations** field — a multi-select — that allows the author to assign the question to one or more folders at the time of creation.

**Workflow:**
1. Author opens "+ Add Question" (from any entry point — folder, All Questions, toolbar).
2. The Locations field is pre-populated with the folder the author navigated from (if any), as a sensible default.
3. Author can add or remove folders from the Locations field before saving.
4. On save, the question is linked to all selected folders simultaneously in the master repository.
5. If no folder is selected, the question exists in All Questions only (untagged) — valid state per ADR-003.

### Post-creation: Copy to Folder

**Copy to Folder** (defined in ADR-004) remains the canonical action for adding a new folder link to an **existing** question. It is not replaced by the creation-time Locations field — both entry points serve different moments in the workflow.

**Post-creation workflow:**
1. From any folder view or All Questions, author opens the question's action menu.
2. Selects "Copy to folder" (or "Link to folder" — name TBD per ADR-004 follow-up).
3. A folder picker opens; author selects one or more target folders.
4. On confirm, the question is linked to the new folder(s). Existing links are unchanged.
5. The UI confirms the action (success state) and optionally navigates to the newly linked folder.

### Design scope (both workflows)

Both flows require wireframes covering:
- Locations multi-select in the creation form (field placement, search, folder hierarchy display, pre-population logic).
- Copy to Folder picker (modal or sheet, folder tree with search, multi-select support, confirmation).
- In-edit propagation warning: when editing a question linked to multiple folders, surface a contextual prompt ("Edits apply to all N linked locations — or Duplicate to make an independent copy").

## Alternatives considered

- **Creation-time only, no post-creation Copy to Folder** — rejected because it forces authors to re-create a question when they want to add it to a new folder after the fact, especially when the question has an established history.
- **Post-creation Copy to Folder only, no creation-time multi-select** — rejected because it creates a two-step workflow for a common intent (question belongs in multiple places from day one).

## Consequences

- Positive: Authors can express multi-location intent at the earliest possible moment, reducing follow-up actions.
- Positive: Copy to Folder remains valid for the "I realized later this question belongs elsewhere" scenario.
- Negative: The Locations field adds surface area to the creation form — placement and progressive disclosure need care so it doesn't overwhelm first-time authors.
- Follow-up required: Define the folder picker component (creation form + Copy to Folder reuse the same picker).
- Follow-up required: Confirm whether Locations is required at creation time or optional (untagged is valid per ADR-003).
- Follow-up required: Design the propagation warning for multi-linked question edits (shared with ADR-004).
