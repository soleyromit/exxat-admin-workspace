---
type: decision
date: 2026-05-13
product: exam-management
status: Accepted
source: conversation
session: 2026-05-13-qb-folder-actions
---

# ADR-003 — All Questions is the canonical location for archived and untagged questions, with row anchor on navigation

## Status

Accepted

## Context

Two edge-case question states need a defined location display:

1. **Untagged questions** — questions removed from all folders, existing only in the master repository with no folder links.
2. **Archived questions** — questions marked not for future use; may still be linked to folders (shown at list bottom per ADR-002), but their location metadata needs a canonical display.

The team needed to decide: introduce a dedicated "Untagged / No Location" bucket, or anchor these questions to All Questions with navigable affordances.

## Decision

**All Questions is the canonical location** for both untagged and archived questions. The Location field for such questions displays **"All Questions"** as a tappable/clickable label.

### End-to-end workflow

**Seeing the location:**
- In any context where a question's location is surfaced (question detail, row metadata, search results), untagged or archived questions show **"All Questions"** as their location — not blank, not "Untagged."

**Navigating to the location:**
1. User clicks "All Questions" in the Location field.
2. The app navigates to the Question Bank root and selects the **All Questions** view in the library sidebar.
3. The question's row is **anchored**: the list scrolls to bring the row into view and applies a **highlight state** (timed, ~2–3s, then fades) to identify the specific question.
4. If the question is archived and the "Archived" filter is not active, the filter is automatically enabled so the row is visible before the anchor scroll fires.

**Why this works:**
- All Questions is the master repository — every question exists there regardless of folder state.
- Anchoring the row eliminates the need to search manually after navigating.
- Auto-enabling the Archived filter prevents a "row not found" dead end for archived questions.

### What is NOT introduced
- No dedicated "Untagged / No Location" bucket or sidebar entry.
- Untagged questions are findable via All Questions search or filter (`Location: none`), not via a separate navigation item.

## Alternatives considered

- **Dedicated "Untagged / No Location" bucket** — rejected because it adds a persistent sidebar entry for an edge-case state, increases navigation complexity, and duplicates All Questions functionality.

## Consequences

- Positive: Consistent mental model — All Questions is always the source of truth; no parallel navigation structures.
- Positive: Row anchor eliminates user friction of manually locating the question after navigation.
- Negative: Auto-enabling the Archived filter on navigate is a side effect that must be communicated clearly (e.g., a filter chip appears visibly so the user knows why their view changed).
- Follow-up required: Design the anchor + highlight animation and the auto-filter behavior in the wireframe pass.
- Follow-up required: Define `Location: none` as an explicit filter option so untagged questions are discoverable without relying on the location link.
