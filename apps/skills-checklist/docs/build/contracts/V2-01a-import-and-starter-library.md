# V2-01a Import and starter library (scenario step 1)

**Status:** Stage 1 contract for the connected prototype v2 (`docs/v2/README.md`). Narrows `00-cross-cutting.md` and `V2-00-foundation.md`. Tags: `[REQ]`, `[OD-n]`, `[PROPOSED]`, `[INFER]`.

```
Surface:              Add skills to the program library two ways: (1) copy an editable specialty starter library
                      (BSN medical-surgical, radiography, surgical technology, paramedic); (2) upload a PDF or text
                      checklist and review AI-proposed skills next to the source lines they came from.
                      Route /v2/admin/starter-library. Includes the program library table with Edit skill.  Wave: V2 Stage 1
Persona(s) & role:    Program administrator (A. Ross). RBAC: 00-cross-cutting.md section 7. All data is sample data.
Scope / data seen:    The program library (store.skills), the four starter catalogues (static sample data, not in the
                      store until copied), import batches (store.batches). No student data.
Job-to-be-done:       Get a first set of skills into the library in minutes, with nothing created until the admin
                      confirms, then see how many still need configuring.
Why -> So what:       Entering hundreds of skills by hand is the biggest barrier to adoption (REQ section 3 intro).
                      A reviewable proposal removes the typing; a visible "still to configure" count turns a part-built
                      library into progress (IM-10).                    (journeys/01)
Requirements:         SL-01, IM-01, IM-02, IM-03, IM-04, IM-05, IM-06, IM-07, IM-08, IM-09, IM-10, IM-11, IM-12,
                      IM-13, IM-14 (copy half only: see Out of scope)
Open decisions hit:   OD-12 (should interpretation propose a model): NOT decided, the proposal never sets a model or
                      criteria; imported and copied skills are created unconfigured (IM-09, SC-01).
                      Seam: starter libraries conflict with SL-01 ("Prism does not supply a standard library"); v2 treats
                      them as admin-copied, editable [PROPOSED] content per decisions D2. Nothing is created until a
                      single confirm.
Prototype reference:  None for v2 (layout from the DS base shell). v1 S-08 import dialog is a pattern reference only
                      (docs/build/contracts/S-08-import.md); v1 routes are untouched.
Pattern:              Page with Tabs ("Starter libraries", "Import from a file"), a Sheet to review a starter library
                      before copying, a Dialog to edit one skill.   Reference: apps/skills-checklist/admin/components/import
DS mapping:           PageFrame/PageSection (existing wrapper over DS PageHeader)  -> IMPORT
                      Tabs, Card, Badge, Button, Checkbox, Input, Textarea, Field, Sheet, Dialog, LocalBanner,
                      ToggleGroup (accept / reject), Select (category)  -> IMPORT
                      DataTable via components/v2/v2-grid.tsx (read-only grid, interactive cells)  -> IMPORT
                      File choice: components/skills/skills-file-upload.tsx (existing local hand-roll, native input
                      behind a DS Button).  PDF text: local /api/import/extract (code only, no network, no AI key).
                      Source-line pairing: composed from Card/Badge, registered in docs/v2/new-components-needed.md.
States:               L  Reading a file shows a "Reading the file" status (aria-busy) and disables the choose button.
                      E  No proposal yet: instruction text. Library has skills in the seed, so the table is never empty;
                         a filter with no match says what to change.
                      Er File cannot be read (unsupported type, empty, scanned PDF with no text, server unavailable):
                         LocalBanner error says what happened and what to do (paste the list or use a text file).
                      V  Create is disabled with a visible reason until at least one row is accepted; an edited name
                         that is blank or duplicates another accepted row blocks that row with an inline message.
                      S  Accept / reject / edit change the row and the "Create N skills" label immediately.
                      Su Success banner: "N skills created. They are not configured yet." with a link to configure.
                      D  Duplicates of existing skills are flagged and not selected by default (IM-06: skip or keep both).
                      P  n/a (client-side).   Bl  Copy/Create while nothing is selected is disabled with a reason.
Edge cases:           Same list imported twice (duplicates flagged, batches stay distinct, IM-11). Heading detection wrong
                      (admin can change the category per row). Lines that look like neither (page numbers, signature
                      lines) are listed under "Not picked up" with their original text (IM-08). Two-column PDF text
                      order is whatever the extractor returns; the admin sees the source line beside each proposal.
Copy:                 Buttons: "Review BSN medical-surgical skills", "Copy 7 skills", "Choose a PDF or text file",
                      "Use the sample checklist", "Accept all", "Create 7 skills", "Save skill", "Cancel".
                      Banner: "7 skills created. They are not configured yet, so they cannot be mapped to a course
                      until you configure them." Error: "We could not read text from this file. It may be a scanned
                      image. Paste the list instead, or use a text or Word file."
A11y:                 Tabs per DS (arrow keys). Each proposal row: accept/reject is a labelled toggle group per row
                      ("Decision for <skill>"), the source line is text in the same row. Decision is shown with text,
                      not colour. Sheet and Dialog trap and return focus (Radix). Status text in a polite live region.
                      Targets 24 px minimum on desktop.
Out of scope:         Merge and split rows (IM-05 mentions them; the review supports edit, rename, discard, add a missing
                      skill is NOT built), Excel and Word sources through this screen's sample (the extractor supports them,
                      the screen only exercises PDF and text), IM-14 "apply a configuration to several selected skills"
                      (the copy-from-another-skill half is on the configure wizard), SL-02..SL-11, section 14.
Acceptance tests:     1. Proposal parser: numbered, bulleted and "name - description" lines become skills; short lines
                      followed by skill lines become categories; everything else is returned as unread with its text and
                      line number (IM-04, IM-07, IM-08).  tests/v2/import.test.ts
                      2. Duplicates of existing skill names are flagged (IM-06).
                      3. Creating accepted rows adds skills with model null, configured false, published false, a batch
                      id, and one audit entry (IM-09, IM-11, IM-13).  tests/v2/admin-actions.test.ts
                      4. Nothing is created before the confirm; reject and pending rows never create (IM-05).
                      5. Copying a starter library adds only the selected, non-duplicate skills, unconfigured, with a
                      batch id (SL-01 seam, IM-11).
                      6. Browser: upload sample PDF -> N proposals with source lines -> Accept all -> Create -> the
                      "Skills still to configure" counter rises by N and survives reload (docs/v2/verify/stage1.e2e.mjs).
Risks / unknowns:     (1) PDF text order depends on the extractor. (2) Starter catalogues are invented sample content,
                      not clinical guidance. (3) Heuristic proposal stands in for AI; the real interpretation is OD-12 and
                      a v1 server concern.
Vault notes consulted:Not consulted in this run (no Obsidian vault access). Source docs read: requirements.extracted.txt
                      sections 2 and 3, docs/v2/*, V2-00-foundation.md, S-08-import.md.
```
