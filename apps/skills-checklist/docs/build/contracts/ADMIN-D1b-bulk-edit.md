# ADMIN-D1b Bulk edit

Page spec: docs/build/2026-11-04-admin-workflow-map.md#D1b

Written 2026-11-05 for the leftovers build. The spec's sketch, primary, tasks and states stand. This contract supplies only what that section lacks.

## Other actions
| Action | Where | Why |
|---|---|---|
| Cancel | Panel footer, outline, with the discard question once a field is set | E3, E6. Close and Esc do the same |
| Configure N skills | Selection bar, first after "N selected", opens D4 | Evaluation settings are not here; D-L48 |
| Edit N skills | Selection bar, opens this panel | [REQ IM-14, SL-03, SL-04] |
| Deactivate N | Selection bar, dialog with summed counts, banner with Reactivate | [REQ SL-11] |
| Clear selection | Selection bar, the DS bar's own button | DS |
| Set times needed | Moved here, as the Times needed row | D1, D1b. Names students first when progress changes [REQ AE-02] |
| Copy settings | Moved to D4, Start from, which takes a skill or the default | D1, D1b [REQ IM-14]. Each skill keeps its own number and minimums, as Copy settings did |

## Tasks
| Task | Entry | Steps | Finish | Landing |
|---|---|---|---|---|
| Deactivate N | Library, rows selected, selection bar | Deactivate N, read the summed counts in the dialog, confirm | Banner "N skills deactivated." with Reactivate; selection cleared | Library, rows muted with the Inactive badge |

## Task test IDs
B1 B2 B3 B4 B5 B6 B7 B8 B9 B10 B11 B12 B13 B14 B15
