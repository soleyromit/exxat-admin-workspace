# V2-06 Admin setup checklist, program evaluation settings, times needed (lab, Proposed)

Status: Proposed working default (2026-11-02), built for the Wednesday review with Aarti (setup and configuration only). Analysis: `../2026-11-02-admin-flow-gap-and-placement.md`. OD-02 (where skills sit against competencies and Standards) stays open.

## Job and roles
Admin (program coordinator) sets skills up in Sankalp's six steps [CALL 11-02]: add skills, categories and tags, evaluation settings for the program with times needed per skill, groups of skills (optional), assign to student groups, course mapping both ways.
Receiver-side cue: what the admin sets reaches students through the assigned groups and the mapped courses (existing screens); the checklist shows each step's state from the same data those screens use.

## Requirements (quoted, REQ wins over the call)
- SL-03, SL-04, SL-05, SL-10 (categories, tags, filters): existing screens.
- IM-09 "Imported skills are created unconfigured and are distinguishable as such. An unconfigured skill cannot be mapped to a course offering and cannot be submitted against."
- IM-10 "A program must be able to see how many skills still require configuration and work through them".
- IM-13 "No skill, category or evaluation configuration may be created without explicit human confirmation." Program settings reach a skill only through Save (with a count) or Apply to new skills.
- IM-14 "it must be possible to copy the configuration of one skill to another or apply a configuration to several selected skills at once." Program settings are that, for all.
- SC-01, SC-02 ("The model must be chosen explicitly; no default is assumed"): the program chooses; nothing is preselected; the times-needed number is typed.
- SC-03 to SC-10, SC-17, SC-18, SC-19: the reused configure sections and validation.
- SC-14, SC-15, SC-16 (per skill): met by the per-skill override ("Change for this skill"), off the main path.
- CM-03, CM-06: course mapping A and B, unchanged.

## Surfaces
| Screen | Variants | Page type |
|---|---|---|
| `admin/evaluation-settings` "Evaluation settings" | A one page of sections, times needed per skill in a collapsed optional section; B summary with edit sheets and the times table on one page | form |
| `admin/setup-result` "Setup summary" | A table per student group; B chain per student group | list |

## States
Loading (`?state=loading`), first use (no program settings: Not set, next action), saved receipt (banner with counts), skipped skills listed with reason, new skills since save (apply prompt), times table empty search.

## DS mapping
PageFrame/FormPage, StickyFooter, Button, StatusBadge, Tabs, Table, Input, Sheet, LocalBanner, Dialog (AlertDialog) for the apply confirmation.

## Not on the page
Reporting figures, lab labels, requirement IDs, OD numbers, stakeholder names.

## Acceptance
- Admin walkthrough starts at the library; no checklist page (Romit 2026-11-02, D-L34). Each page is title, controls, primary action.
- Saving program settings writes each active skill's rule (validated), keeping each skill's own times needed; skills that cannot take them are listed with the reason.
- Times needed edits write that skill's rule only.
