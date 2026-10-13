# Mobbin pattern research — remaining surfaces (M-1, M-4 to M-12)

Date: 2026-10-08 · Tool: Mobbin MCP (deep mode, 4 results per query; M-8 on iOS, rest web). Companion to `2026-10-08-mobbin-s09-configure-patterns.md` (M-2, M-3).
Patterns only, no pixel copying. None is a skills or clinical tool. Fit ratings are mine `[INFER]`: **Strong** = answers the requirement, **Partial** = one useful idea, **Weak** = does not answer the job.

## M-1 Import review (S-08) — Fit: Strong
| Reference | Pattern | Maps to |
|---|---|---|
| [Melio vendor import](https://mobbin.com/screens/997a8e01-8187-42f8-9c77-cc7fc6fb5303) | Banner "2 of 10 vendors are ready to import. You can import now or resolve errors for 8"; "Show only rows with errors" toggle; per-row Edit; Re-upload file; button carries the count "Import 2 vendors" | IM-05, IM-13, counters |
| [Copy.ai Review & finalize](https://mobbin.com/screens/614ac071-a8fc-4499-bc43-38388ce19777) | Tabs "All rows 2 / Clean rows 2 / Rows with issues 0" | IM-08 (issues as a visible set) |
| [7shifts import](https://mobbin.com/screens/6b45f042-7f89-46f1-b46f-8270604842b8) | Warning "unable to import one or more"; red cells with quick fix; "Import employees (1/2)" | IM-08 |
| [Attio import](https://mobbin.com/screens/60a1cfe5-3788-49e3-b3ae-3da62a33f7ee) | 4-step stepper; "Needs review 3" group; raw value to mapped value, inline edit of the invalid one | IM-05 |
So what: put the confirm count on the primary button, offer a "needs attention only" filter and an issues tab, and show raw text beside the interpreted value. **Gap:** none lists lines it could not read with their original text (IM-08) as a separate block; that stays our design.

## M-4 Master-detail with counts and toggles (S-10) — Fit: Weak to Partial
[Asana list + task pane](https://mobbin.com/screens/bfe4aa10-a69d-4bb4-976a-ca14365c9c59) and [Linear project](https://mobbin.com/screens/b6b43915-82db-42a6-81e7-a6e9a46dc36d) show list-left, detail-right. [Deputy](https://mobbin.com/screens/c992fba7-8a4b-4aec-8680-9fa1ec3f8d6c) shows a checklist of sections with a tick each and a detail pane. [Superlist](https://mobbin.com/screens/c4d33ca2-9379-474d-8411-007b0135153d) is not relevant.
So what: confirms the master-detail layout only. **Gap:** nothing shows per-row Mandatory / Non-mandatory toggles with a mapped-count pill; our own composition (contract S-10) stands.

## M-5 Approval with comparison (S-11) — Fit: Partial to Strong
| Reference | Pattern |
|---|---|
| [ClassDojo](https://mobbin.com/screens/225128f0-1acf-49e8-a5e7-86532d8c7dfb) | Item under review, comment box, "Approve" and "Return as draft", explains who sees it after approval |
| [Hex review](https://mobbin.com/screens/b6d30984-785d-4ae1-a740-986428e63945) | Review panel with Comment / Approve / Request changes radio and a note field |
| [Semrush](https://mobbin.com/screens/ed82aafc-c4dc-442d-87fc-359f7347f940) | Original vs new side by side, "Keep original" and "Continue with new" |
| [LangChain](https://mobbin.com/screens/0472f73c-0bd0-4e93-94bb-52c5a9962b9d) | "Needs review" queue, reviewer notes field, one confirm |
So what: two outcomes with the consequence stated (ClassDojo), a note field beside them (Hex), and a two-column compare (Semrush). Supports S-11's Approve-in-detail-sheet decision. **Note:** Hex's three-way choice includes a no-decision "Comment" option; AR-05 has only approve or return, so do not add one.

## M-6 Multi-select with action bar then dialog (S-12, S-13) — Fit: Partial
[Copilot Money](https://mobbin.com/screens/7628c5f2-479c-431b-89ec-978c45b91d6e): floating bar "4 selected" with actions and overflow, plus a confirm dialog. [Magnific](https://mobbin.com/screens/20f7ca1a-83d3-4a7b-85c4-278d0c2d0a88): bottom bar summarising the selection and a single Save. [Depop](https://mobbin.com/screens/a2d6e5bc-5b01-48b5-a14a-5621254a185d): selected count with actions in a header row. [Behance](https://mobbin.com/screens/d7ba0551-4eab-4cb2-9f22-2ed4d20fa67d): searchable grouped checklist modal.
So what: a bottom bar with count, Clear, and one primary action matches ST-04. **Gap:** none derives defaults in the following dialog (setting from placement); that rule is ours (ST-06).

## M-7 Attempt history timeline (S-14) — Fit: Weak
[7shifts](https://mobbin.com/screens/8b845427-b403-4eb7-87c9-aa771a00d378), [ClickUp](https://mobbin.com/screens/24b02790-d66b-4595-9c72-a112281d00a2), [Toggl Track](https://mobbin.com/screens/2deef352-1f6b-4757-a4c9-dcce106b0e6a) are activity or audit logs (who did what, when, with a status tag). [Ghost](https://mobbin.com/screens/cf780439-e782-4f56-a6c1-231facf234fc) is a marketing graphic.
So what: the only transferable idea is a compact row with actor, event, time and a status chip. **Gap:** nothing shows attempts with a failed-rule reason and a next-step action (SH-02, SH-03). Our S-14 design has no external precedent.

## M-8 Tokenised external form on mobile (S-16) — Fit: Weak to Partial
[eBay](https://mobbin.com/screens/c30d348c-ce93-4bd9-bd21-31def22deae1): large radio rows, "optional" labels on non-required questions, helper text, disabled Send until valid. [talabat](https://mobbin.com/screens/786c1204-6240-4d31-8b87-11b2199055ba): checkbox reasons plus Finish and Back. [Klarna](https://mobbin.com/screens/9e4b5f6b-e09e-4464-9c91-86fcc3315ab4) and [Shangri-La Circle](https://mobbin.com/screens/acd21127-643c-40d6-bdce-9e4d5e802c49): short single-page forms, one dark primary button.
So what: large single-choice rows, explicit "optional" on non-mandatory fields, one primary, Send disabled until valid (EV-06). **Gap:** all are in-app, signed-in feedback screens. None shows an email-link entry with no account, so the no-login experience (EV-01) is not evidenced.

## M-9 Report table with chips and drill detail (S-01 to S-03) — Fit: Strong
[Navattic](https://mobbin.com/screens/d209473e-43ef-4a2c-abf5-3c0324bb9cbf): "Filter 1" button, removable chip row with Clear, sort menu, rows-per-page. [Mixpanel](https://mobbin.com/screens/bca36f14-795f-4542-a854-eb4765d3b76e): filter row with delete per filter, Export, columns, "Showing 0 of 0 matches". [AirOps](https://mobbin.com/screens/482970f2-967b-4d55-a824-27245d8ef15a): click a row to open a detail panel with its own filters and trend. [Semrush](https://mobbin.com/screens/c2ea4534-58e7-49c8-8405-eb3ddf3e9a4d): tabs with totals, Export, pagination.
So what: each applied filter is its own removable chip with a Clear all (RP-01), export sits next to the table, and a row opens a detail panel (RP-05). Note AirOps uses a chart in the panel; our rules say no progress-bar-only viz.

## M-10 Empty state explaining a filter result (S-01) — Fit: Partial
[OpenSea](https://mobbin.com/screens/45a834a8-d95b-43fe-8420-7f0660bb528b): chips stay visible above "No results found. Try removing some filters" and Clear filters. [Delphi](https://mobbin.com/screens/14f1556c-eba4-427e-aa8d-8bb7c20008c8): "No contacts match these filters. Try adjusting or clearing them." [Render](https://mobbin.com/screens/0da9bd06-539f-41e1-aa94-a8c78368e69a) and [Fey](https://mobbin.com/screens/7ff1da87-ed3c-4b42-b83d-1d0889946ef3) are similar.
So what: keep the chips visible and give a Clear action. **Gap:** every example is generic. None explains *why this specific combination cannot produce evidence* (RP-09: a location that does not offer the chosen setting). That explanation is ours to write (docs/ux/09).

## M-11 Blocked option with inline reason (S-13) — Fit: Strong (one reference)
[Workable edit](https://mobbin.com/screens/37176881-d027-402b-8f1a-2e3fc965020c): fields greyed out with a yellow banner above them "You cannot edit the name and email … because they've already signed in", and an alternative action. [Fresha disable](https://mobbin.com/screens/849061eb-251c-49f8-99bc-7f4e6dda03d6): lists what you will no longer be able to do, asks for a reason. [Zendesk](https://mobbin.com/screens/afdfc57d-80c4-42f9-b2d5-b1db91348b5a) and [Coda](https://mobbin.com/screens/c3a8e1d8-ba3e-48f6-aac8-d3ed2a5e7e88): confirmation with consequence text.
So what: disable plus a visible reason above the control, plus an alternative action, maps to ST-08 and S-09's blocked-save. Warning styling is amber, not red.

## M-12 Export scope with filters (S-17) — Fit: Strong
[Wix](https://mobbin.com/screens/c03413e3-7999-4b36-a00a-43f37ece36b2): radio "Entire collection (28 rows)" / "Filtered data (7 rows)" / "Collection fields", each with a one-line explanation. [HubSpot](https://mobbin.com/screens/88fa0f24-5c98-442c-aae8-6a4743ee3bc6): export name, format, "Data included in export" list, Customize. [Qatalog](https://mobbin.com/screens/24b657ee-393c-47e5-978c-04b7d1053555): field checklist with "9 of 9 fields selected". [Whop](https://mobbin.com/screens/6e465675-4365-4b64-accc-34e00565d6f0): columns and statuses, "9 columns".
So what: show the row count for each scope, say whether filters apply, and list what is included. Matches RP-10 (aggregate versus row-per-evaluation, full filtered scope). **Gap:** none writes the filters into the file header; our `#` comment-block proposal has no precedent.

## Summary of gaps (stay hand-designed)
Skill-attempt history with failed-rule reasons (S-14), per-row mapping toggles with counts (S-10), unread-lines block with original text (S-08), the "impossible filter combination" explanation (S-01), no-login email-link entry (S-16), filters recorded in the export file (S-17), plus the lineage panel and minimum editors from the S-09 note.
