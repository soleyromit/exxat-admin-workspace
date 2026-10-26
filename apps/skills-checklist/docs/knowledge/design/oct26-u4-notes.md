# U4 notes: Oct 26 call items 13, 14, 18 (builder U4, 2026-10-26)

Authority: `granola-2026-10-26-updates.md` items 13, 14, 18 `[CALL 10-26]`. No new screens or variants; existing ones updated.

## 13. Evaluator not assigned, and Assign to someone else
- Cause label for evidence from a name not adopted yet reads **Evaluator not assigned** (`lib/v2/labels.ts` `EVALUATOR_NOT_ASSIGNED_LABEL`, read by `CAUSE_LABEL` in `lib/v2/approvals.ts`). Internal id stays `new-evaluator`. Every consumer (Approvals A/B/C, Review item A/B/C, Admin Approvals A/B, dashboard exceptions, board column) reads it.
- **Assign to someone else** is a reviewer decision (`{ kind: "assign" }`, `assignEntry` in `lib/lab/reviewer.ts`), committed to the shared store through `commitDecision` like approve, return and adopt. A row with a request sends that request back out (with-evaluator, reassignment recorded); evidence with no request gets a new link request. The held evaluations stay on the record, never edited, marked returned with the note "Sent to {name} for a new evaluation" and linked to the request, so they do not count and do not show as a separate return.
- Effect on facts (`lib/v2/facts.ts`): awaitingApproval minus 1, waitingRequests plus 1, nothing else moves (unit test `tests/lab/reviewer-assign.test.ts`; Playwright step in `tests/lab/consistency.mjs`).
- Picker: the Return dialog's compact evaluator Select, extracted as `EvaluatorSelect`. Assign offers only adopted preceptors, lab instructors and clinical faculty qualified for every skill, the evaluator's site first (`assignTargets`); the Return list is unchanged.
- Placement: Approvals A rows show "Adopt or merge" and "Assign" side by side (outline). The decision bar (Approvals B panel, Review item A/B/C) and the Approvals C column use one outline menu "Adopt, merge or assign" holding "Adopt or merge evaluator" and "Assign to someone else", because two separate buttons put Approvals B (9 of 8), Approvals C (7 of 6) and Review item C (7 of 6) over the strategy/07 control budget. Approve stays the only filled button.
- No-login copy: the Assign dialog says "They open an email link and sign without an account."

## 14. Send for evaluation A/B
- One sentence, "They see only the skills you chose." (with ", with your self-rating" when a chosen skill asks for one), via `scopeSentence` in `components/lab/student2/request-parts.tsx`. A: under the request summary. B: replaces the old count sentence (the count is on the skills heading). B "They are not here" now reads "Email a link, no account needed" (lab instructors and placement faculty use the same link).

## 18. Remediation
- `lib/lab` and `components/lab` had no remediation, intervention or plan call to action on director or reviewer screens; nothing to remove. `tests/lab/wording.test.ts` now fails if "remediation" or "intervention" appears in a string literal there.

## Open
- In Approvals B the Assign dialog opens partly under the floating panel, so long option names are clipped. Return and Adopt use the same Dialog inside the same provider, so they probably sit the same way (not checked). A DS layering question (Dialog vs FloatingSheetPanel), not changed here.
- The student sees the held attempt as "Returned for correction" with the note "Sent to {name} for a new evaluation" beside the new waiting request (lib/v2/student.ts wording, outside U4's files).
