# ADMIN-D1c Configure one skill

Page spec: docs/build/2026-11-04-admin-workflow-map.md#D1c

Written 2026-11-06 from the designer's approved design (D-L115). The map is the spec; nothing here restates it. Density is the acceptance test: the budget table in map D1c is asserted per model by task CFG1, and no number in it is raised silently.

## Task test IDs
CFG1 CFG2 CFG3 CFG4 CFG5 CFG6 CFG7 CFG8 CFG9 CFG9b CFG10 CFG11 CFG12 CFG13 CFG14 CFG15 CFG16 CFG17 CFG18 CFG19 CFG20 CFG21 CFG22 CFG23 CFG24 CFG25 CFG26 CFG27 CFG28 CFG29 CFG30 CFG31

## Primary action
Save changes, filled, top right. It exists only after a change. Under Not configured (a), before a model is chosen, Set how skills are judged is the one filled action.

## Other actions
| Action | Where | Why |
|---|---|---|
| Cancel | Top right, only after a change | Asks "Discard your changes?", then returns to where the admin came from |
| Preview | Header, below 1100 px | Dialog with both forms; closing keeps the draft |
| Edit levels, Edit questions, Choose, Edit fields, Add minimum | Their rows | A Dialog or menu; the result stays in the draft until Save changes |

## States
| State | What shows |
|---|---|
| Loading | Skeleton, under the title |
| Empty | Not configured (a), tiles with none preselected, preview line |
| Error | Sticky problem list, field errors, closed sections read "1 to fix"; a failed save reads "{Skill} was not saved. Try again." and keeps the form |
| Not found | The configure not-found block, naming the link as out of date |
| Inactive | Badge, every field live (D-L93); saves name no students |
| Not configured (b) | No questions yet with Add questions, preview line |

## Not on this page
Status (the panel's header switch); name, description, category and tags (the panel's Details); Used in (the panel); a sticky footer; a Steps panel; a Check table; anchor chips; Start from (D4 only).

## Tasks
| Task | Entry | Steps | Finish | Landing |
|---|---|---|---|---|
| Change a skill's Times needed | Any door | Type the number, Save changes, confirm when named | Saved | Library, same filters and scroll, panel open, banner |
| Give a skill its own settings | Any door | Custom, change in a section, Save changes, confirm when named | Saved, reads Custom | Library, same filters and scroll, panel open, banner |
| Go back to the default | Any door on a Custom skill | Default, Save changes, confirm when named | Saved, reads Default | Library, same filters and scroll, panel open, banner |
| Add questions | Not configured (b) | Add questions, write them, Save, Save changes | Saved, reads Default or Custom | Library, same filters and scroll, panel open, banner |
| Leave without saving | Any door, a change made | Cancel, Discard | Nothing saved | Where the admin came from |
