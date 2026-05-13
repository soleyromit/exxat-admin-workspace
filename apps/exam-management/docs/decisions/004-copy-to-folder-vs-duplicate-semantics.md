---
type: decision
date: 2026-05-13
product: exam-management
status: Accepted
source: granola
granola_meeting: 233ffd31-aa34-472a-aadc-2deff5b9d3db
session: 2026-05-13-qb-folder-actions
---

# ADR-004 — Copy to Folder creates a linked reference; Duplicate creates an independent copy

## Status

Accepted

## Context

The QB action set includes two surface-similar actions — **Copy to Folder** and **Duplicate** — that have distinct behavioral contracts defined by Nipun. Conflating them causes user confusion and incorrect data model expectations. This ADR records the canonical distinction to guide both implementation and UX copy.

The underlying data model: all questions are single entities in the institute's master repository. Folders are tags/references, not physical containers. This principle is the foundation for both actions below.

## Decision

### Copy to Folder
- Adds a **linked reference** to the same question entity in one or more additional folders.
- The question is **one underlying entity** — it exists in multiple folder views simultaneously.
- **Edits propagate** to all linked locations. There is no forking; collaborators in any folder see the same question.
- Use case: faculty want the same question accessible across multiple subfolders or courses without maintaining separate copies.

### Duplicate
- Creates a **fully independent copy** — a new, separate question entity with its own ID, version history, and metrics.
- Edits to the duplicate **do not affect** the original, and vice versa.
- Use case: faculty want to use an existing question as a template and modify it without touching the original ("I don't want linking").
- The duplicate starts as a Draft in the current folder; the author assigns it to locations independently.

### Shared principles (both actions)
- Neither action modifies the original question's metrics or past assessment data.
- Neither action removes the original from its current folders.
- Both actions are folder-level operations — they do not require question-edit permissions, only folder add/remove rights.

## Alternatives considered

None — these definitions were established by Nipun as the authoritative behavioral contract.

## Consequences

- Positive: Clear behavioral distinction prevents user confusion between "link" and "copy."
- Positive: Copy to Folder supports multi-course question reuse without data duplication.
- Positive: Duplicate supports template workflows cleanly without coupling.
- Negative: The UI must make the propagation behavior of Copy to Folder visible — users need to know edits affect all linked locations before they act.
- Follow-up required: Design the in-edit prompt that surfaces when a user edits a question linked to multiple folders ("This question is used in N locations — edits will update all of them. Duplicate instead?").
- Follow-up required: Define where Duplicate lands (same folder? author chooses folder at creation?).
- Follow-up required: Finalize UX copy — "Copy to folder" vs "Link to folder" to avoid confusion with OS-level "copy."
