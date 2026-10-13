# Mobbin evidence for design brief v2

Run 2026-10-08 with the Mobbin MCP (web and iOS, deep mode). Job types, not domains. Every URL below was returned by the tool and the preview images were viewed. **None of these products is clinical education**; they are analogues for a structure. Patterns only, no pixels. The earlier S-09 and S-08 to S-17 searches are in `docs/research/meetings/2026-10-08-mobbin-*.md` and are not repeated here.

## Job type 1: guided setup with visible progress (Direction A, hybrid home)

| Product | URL | Pattern | What we take |
|---|---|---|---|
| HoneyBook | https://mobbin.com/screens/7c915d6b-2a99-4eb0-956d-e7a3a97bb265 | "Setup" is the first nav item with a mini progress ("6/7 completed"); home shows steps with time estimates ("2 mins") and a chevron into each | Setup as a first-class, always-reachable destination; per-step effort labels |
| Vanta | https://mobbin.com/screens/d6c8a960-3253-4ca4-b4aa-06e902fa0e4e | Collapsible step groups with "4 of 4 complete", locked steps shown as locked ("Confirm auditor selection"), a banner progress in the nav | Group steps; show dependencies as locked, not hidden |
| Remote | https://mobbin.com/screens/156170a2-7331-438f-9a0a-e7eba294b489 | "6 tasks remaining" plus a percent bar, each task a card with a one-line why | Plain "what remains" count; one-line reason per step |
| Adaline | https://mobbin.com/screens/bb39ed29-a03c-4516-9951-420e326da441 | Steps grouped by outcome, each row completed or not, expandable | Group by outcome ("Bring in", "Prepare", "Go live") rather than by screen |

## Job type 2: work queue / inbox with a detail pane (Direction B, hybrid review)

| Product | URL | Pattern | What we take |
|---|---|---|---|
| Klaviyo Helpdesk | https://mobbin.com/screens/59324e5f-91ad-49d1-9c3f-a5a958120291 | Primary rail + **secondary panel** ("My Inbox, All tickets, Unassigned") + list + detail | The same primary nav + secondary panel hierarchy the Exxat DS shell uses; counts on secondary items |
| Gorgias | https://mobbin.com/screens/5dddc6f5-d48f-4fac-9cdc-8c86c81fbd7a | Views with counts (Inbox 1, Unassigned 3, All 4, Snoozed 0), select-all with bulk icons | Counted queue views; select-all for bulk action |
| Plain | https://mobbin.com/screens/03143e01-39f7-4352-a836-041ff5e3260e | Thread list, centre detail, right context pane, keyboard hints (R, N) | Keyboard-first triage; context pane for the student and skill |
| Wrike | https://mobbin.com/screens/20ad47f6-2249-48aa-a3c2-e8fb4503b4b0 | Work grouped by status with counts, detail pane on the right | Group by state with counts; row stays visible while the detail is open |
| Zendesk | https://mobbin.com/screens/f2e7d89f-72b1-4da1-8820-fd9bd4df3350 | "Tickets requiring your attention (27)" grouped by priority | An explicit attention section that is a list, not a chart |
| Oyster | https://mobbin.com/screens/ffefa4cd-b1d6-4b73-9b46-d4184f2eaf06 | "Requiring attention" by area with "You don't have any ... tasks that require your attention" as the empty state | Positive empty state per queue |

## Job type 3: people x items matrix with status and drill-down (Direction C, hybrid report)

| Product | URL | Pattern | What we take |
|---|---|---|---|
| Airtable | https://mobbin.com/screens/b582185d-6401-42a4-bcc7-f2f76d2639d0 | Grid with a colour-by-field control (status colours editable, legend of states) | A legend that names each state; colour is secondary to a label |
| Fresha | https://mobbin.com/screens/3b1a8630-7e3d-4e22-aa49-f38180943f60 | List of people with status pills ("To be completed", "Completed", "Not completed") and dates | Person rows with textual status pills |
| Miro table | https://mobbin.com/screens/3cc382a7-ae87-4d28-a04f-8cecd412cafb | Dense grid with typed status and priority cells, add column control | Typed cells; header controls |
| Aboard | https://mobbin.com/screens/d6a6ad47-6520-44f4-af42-41feb0a611de | Approvals table with Document / Employee / Status ("Pending") and filter chips | Approvals as a filterable table with status chip |
| **Gap** | | No result showed a **people x skills heat grid with drill-down** at 150 x 100 scale. The matrix design is ours and must be tested for density and keyboard use | Treat Direction C as the highest design risk |

## Job type 4: mobile portfolio / progress list with a primary add (student)

| Product | URL | Pattern | What we take |
|---|---|---|---|
| Acorns | https://mobbin.com/screens/4705850a-207b-4209-891c-37fbce629d4c | Item list with value and chevron, large primary at the bottom | Rows that show the number first, large bottom primary |
| Public | https://mobbin.com/screens/23364d02-6b08-4a26-95ec-333fda4f4795 | Segment switch at the top, list rows with a score, bottom action | Two-state segment ("Needed" / "All") over one list |
| Believe | https://mobbin.com/screens/414901db-ef40-4732-9705-16ad5296f049 | List with a floating "New" button | Floating primary reachable by thumb |
| Binance | https://mobbin.com/screens/c4f0d398-e96d-4db2-ac7a-3bad7a7ff336 | Summary at top, filter row, bottom tab bar | Summary first, filters second, tab bar for a student shell |

## Job type 5: quick log / recents (student submit)

| Product | URL | Pattern | What we take |
|---|---|---|---|
| BitePal | https://mobbin.com/screens/62ca4e3b-cba9-4bc0-8d7d-0c4a04f9828f | Bottom sheet with "Recent logs" chips under the input | "Recent evaluators" chips under the person field |
| Oura | https://mobbin.com/screens/e36be41d-a899-40b0-a1f8-5cb2f2a412c3 | Tabs "Text input / Recent meals / Favorites" inside the sheet, one primary button | Recents as a first-class tab inside the log sheet |
| MacroFactor | https://mobbin.com/screens/b4ed83e3-6b7a-46c3-9d79-fbf126cb7a7f | Numeric keypad sheet with Quick Add and Log Foods | Sheet adapts the keyboard to the field type (date, number) |

## Job type 6: bulk import with mapping and per-line errors (setup)

| Product | URL | Pattern | What we take |
|---|---|---|---|
| Zapier (flow, 14 screens) | https://mobbin.com/flows/aee2762e-5616-4ea7-bd10-2d5a0841edc1 | Import dialog states limits up front ("only .csv, up to 50 MB"), progress state "Creating table...", then the populated table | State limits before upload; land on the result, not a banner |
| Bonsai (flow, 11 screens) | https://mobbin.com/flows/75528a02-5c95-4904-abb0-4859948a3906 | Header-mapping selects with a "sample imported data" preview; failure screen lists **"Line 2 - Billable value must be blank, true or false"** per line | Per-line failure text with line numbers (IM-08) |
| Featurebase (flow, 7 screens) | https://mobbin.com/flows/d6b13408-74e2-4282-a8d6-be90657de06e | Map column to data type via searchable select, "Start Importing", "Import started" result with a link to the data | Result screen with a direct link to the imported items |

## Job type 7: approval with context, note and consequence (review)

| Product | URL | Pattern | What we take |
|---|---|---|---|
| Aboard | https://mobbin.com/screens/473a91f7-3b9f-4e2b-9c22-ff199209aa7f | Approve dialog with an optional Comment; approval flow stepper on the right | Approval chain visible beside the item |
| Deel | https://mobbin.com/screens/9769884d-9bfb-4666-9287-3e8e1c1fb12b | Full-height review: preview left, details and status right, Deny / Approve in a footer | Footer pair with both outcomes; details beside the artefact |
| Airwallex | https://mobbin.com/screens/f13414b4-443f-4484-bd3a-4b5970db2cc3 | Side drawer over a table with comments, attachments, Reject / Create; success banner states what happens next | Say what happens next after the decision |
| Deputy | https://mobbin.com/screens/4060eb3a-fb01-4b17-976e-dca0af92843c | Request page with "balance impact" table, Approve & notify / Decline & notify | Show the consequence of approving before the button |
| **Gap** | | The "guest approval from an email link, no account" query returned only signed-in approval screens. There is no external reference for the no-login evaluator entry (EV-01); it relies on the earlier M-8 gap note | Test with real preceptors |

## Job type 8: two-pane configuration workspace (setup, Direction A)

| Product | URL | Pattern | What we take |
|---|---|---|---|
| Klaviyo Customer Agent | https://mobbin.com/screens/f52a782b-e32c-4215-92f2-d4bfd18a8dce | Secondary nav of sections, a long page of rule cards, a floating "Unsaved changes / Discard / Save" bar | Configure as a workspace page with a floating unsaved bar |
| Greptile Custom Context | https://mobbin.com/screens/2a746782-8550-4a0f-9ce6-862b6384b4ee | Rules table with an in-place Details panel (Save / Cancel), status column | List and editor on one screen; the editor does not leave the list |
| Chatbase Deploy | https://mobbin.com/screens/80f2af65-c869-4e7b-955b-ffbd0c1e50c2 | Settings left, **live preview** right, unsaved bar bottom | Live student and preceptor preview next to the editor |

Total: 31 distinct Mobbin URLs across 8 job types, plus 2 recorded gaps (no people x skills heat grid at scale; no guest-link approval page). Earlier S-09 / S-08 to S-17 searches add a further 50 or so URLs in `docs/research/meetings/`.
