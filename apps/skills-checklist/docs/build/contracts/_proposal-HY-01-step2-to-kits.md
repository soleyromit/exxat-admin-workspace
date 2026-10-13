# Proposal: HY-01 Home, step 2 "Continue" offers Kits (diff against a CONFIRMED contract)

**Status: PROPOSAL 2026-10-09, not applied.** `HY-01-home.md` is CONFIRMED. This file changes nothing until **Romit explicitly approves** it in chat. Until then the premise of `_draft-HY-02-kits.md` (Home step 2 offering Kits) is not in force and the only entry to Kits is the Kits tab (`ROUTES.kits`).
Tags follow the contract: `[REQ id]` · `[OD-n]` · `[INFER]` · `[CODE path]`. Sentence case, no em-dashes.

## 1. Why

Home step 2 is the moment of truth for the fatigue point: 86 unconfigured skills and one "Continue" that opens the first skill's dialog, which leads to 86 repetitions `[HY-01 section 4, INFER]`. `[REQ IM-14]` requires applying one configuration to several skills; `[CALL 09-23 line 112]` says one-by-one is cumbersome. HY-02 Kits is the surface that does it. Without a pointer from Home, the admin who follows the setup card never discovers it `[INFER]`.

## 2. Trigger condition

Applies **only after Kits slice 1 ships** (pool, editor, Apply). It must not appear while the Kits tab is a placeholder (`PLACEHOLDERS.kits` `[CODE admin/lib/skills-routes.ts:82]`). The condition is a single constant, `KITS_AVAILABLE`, in `lib/home/links.ts`, so shipping and showing are one switch `[INFER]`.

## 3. The diff

### 3.1 Section 9.6 Behaviour (current line 204)
Current:
> "Continue" in step 2 opens the **first unconfigured skill's configure dialog** (`ROUTES.skillConfigure`) `[INFER]`, so one click resumes work. Bulk apply (`IM-14`) is reached from the library bulk bar, not owned by Home.

Proposed:
> "Continue" in step 2 opens the **first unconfigured skill's configure dialog** (`ROUTES.skillConfigure`) `[INFER]`, so one click resumes work. **When Kits slice 1 has shipped, step 2 also offers a second text action, "Configure skills together", that links to the Kits tab (`ROUTES.kits`)**; it sits beside "Continue" with equal prominence and neither is the only path `[INFER]`. Home performs no bulk action itself and shows no kit, selection or apply control: it only links. Bulk apply (`IM-14`) is done in Kits.

### 3.2 Section 9.5 Copy, Step 2 row
Add one string: action label "Configure skills together" (tooltip not needed, text-only button `variant="outline"`; "Continue" keeps its current variant). Step 2 description is unchanged (it already says unconfigured skills cannot be mapped or used `[REQ IM-09]`). Not used: "Create kits", "Automatically", "Smart", "Recommended" (that word is reserved for step 4 `[REQ CM-05]`).

### 3.3 Section 12 acceptance tests, IM-14 (current line 220)
Current:
> **IM-14** Given unconfigured skills exist, When I read Home, Then no bulk or kit action is offered on Home and step 2 links to the library where bulk apply is available.

Proposed:
> **IM-14** Given unconfigured skills exist, When I read Home, Then Home offers no bulk action, no selection control and no kit-creation control itself. Given Kits slice 1 has not shipped, Then step 2 offers only "Continue" (first unconfigured skill's dialog). Given Kits slice 1 has shipped, Then step 2 offers "Continue" and "Configure skills together", and "Configure skills together" navigates to the Kits tab and changes nothing on Home or in any skill.

Add one test:
> **IM-14b** Given Kits slice 1 has shipped and all skills are configured, When I read Home, Then "Configure skills together" is absent (step 2 is Done and the setup card is collapsed).

### 3.4 Unchanged
Home stays read-only (section 9.3 V and S rows), no new state, no new count, no change to IM-09, IM-10, IM-11, SC-01, SC-02, CM-05 tests. The "Not used" list gains nothing. Section 11 out of scope: the phrase "Bulk apply" is no longer a statement that Home links only to the library; Home links to Kits.

## 4. What it changes in a confirmed contract

HY-01 section 9.6 and the IM-14 test (both CONFIRMED) and, by extension, HY-01 section 11's implication that bulk work is a library affair. That is why this needs Romit's explicit approval; the author may not apply it. It also removes the only wording that kept Home independent of Kits.

## 5. Files a builder would touch (after approval and after Kits slice 1)

| File | Change |
|---|---|
| `admin/components/home/setup-card.tsx` | Step 2 renders a second `Button variant="outline" size` link when `KITS_AVAILABLE` and unconfigured count > 0 |
| `admin/lib/home/links.ts` | `KITS_AVAILABLE` constant, link target `ROUTES.kits`, selector for visibility |
| `admin/lib/copy/home.ts` | Add "Configure skills together" (copy tests enforce voice rules) |
| `admin/tests/ui/home/home.test.tsx` | Revise IM-14, add IM-14b, keep the "no `<button>`, no hex, no toast" grep test green |
| `docs/build/contracts/HY-01-home.md` | Apply the 3.1 to 3.3 edits (Romit only after approval) |
| `docs/strategy/04-requirements-traceability.md` | Run `skills-req-trace` after |

No change to `admin/lib/store/**`, `lib/skills-routes.ts` or any Kits file.

## 6. Cost and risk

Cost `[INFER]`: small, one component branch, one constant, one string, two test edits; the cost is the contract change, not the code. Risks: (1) a second action beside "Continue" splits attention at the fatigue moment, so it should be tested with an admin before it is permanent; (2) it ships Home dependent on a Kits constant, so a revert of Kits must flip `KITS_AVAILABLE`; (3) if QK1 resolves to "saved selection, not a lasting kit" the label "Configure skills together" still holds (it describes the job, not the object), which is why the label avoids the word "kit" `[INFER]`.

## 7. Decision requested from Romit

Approve, approve with changes, or decline. If declined, `_draft-HY-02-kits.md` keeps the Kits tab as the sole entry and section 1a stands as written.
