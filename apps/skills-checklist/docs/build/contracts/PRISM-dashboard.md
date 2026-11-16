# PRISM-dashboard: Exxat PRISM home (the starting screen `/`)

Consulted: docs/knowledge/00-design-brief.md, glossary.md, 02-decisions-ledger.md (no entry covers the PRISM home; this page is a static look-alike of the host product, not a Skills Tracking design). Spec source: the live page https://steps.exxat.com/dashboard, captured 2026-11-15 in the user's logged-in Chrome.

Scope: a look-alike of Prism's existing home, so the walkthrough starts where a Prism admin starts. Skills checklist is entered from the left drawer under Competency Management. No requirement ID applies; no OD is decided here. Source tag: [PROTO-LIVE] the live Prism page. Placement of the entry (a child of Competency Management) is the one [INFER], to confirm with Romit.

## Single job
Show the PRISM home as it is today and give one working way into Skills checklist (the Skill lists screen).

## Primary action
Skills checklist, linking to /admin/lists: an always-visible, slightly indented drawer row (icon plus label, normal row anatomy) under Competency Management, and a full row in the Curriculum Management card after Competency Management: orange icon (fa-list-check, light, 24px like the other rows), 18/600 orange title with no underline, one 14px description, no badge (added to the live look; Romit may veto it). The row copy "Set up skills, evaluation settings and course mapping." is [INFER]: not approved by Romit. Both visible without any click.

## Other actions
| Action | Where | Why |
|---|---|---|
| Open or close the navigation drawer | Hamburger in the top bar; Close button in the drawer; Escape; scrim click | Same as live; drawer is an overlay at every width |
| Open Skills checklist from the page | The Skills checklist row in the Curriculum Management card | Findable without opening the drawer |
| Every other nav row, card row, top-bar button, search, user menu, banner Explore | Rendered, inert: aria-disabled, no href, no navigation | The demo must not leave the walkthrough; an inert control still looks like live |

## Tasks
| Task | Entry | Steps | Finish | Landing |
|---|---|---|---|---|
| Reach Skills checklist by mouse | Home `/` | Press the Skills checklist link on the Competency Management card, or open the drawer and press the Skills checklist sub-row | The browser goes to /admin/lists | Skill lists (walkthrough stop) |
| Reach Skills checklist by keyboard | Tab to the hamburger | Tab reaches the card link directly (Enter), or Enter on the hamburger opens the drawer and Tab goes close, then Skills checklist (Enter) | Same landing; Escape closes the drawer and returns focus to the hamburger | Skill lists |
| Come back | Any walkthrough page | Press the PRISM crumb at the start of the header breadcrumb | `/` | PRISM home |

## States
- Default: three section cards side by side at 1280 px and wider; one column below 960 px; between, as live (cards stay columns until the live breakpoint, captured below).
- Drawer closed / open. No disclosure: the sub-row is always shown. Open drawer scrolls inside itself; page behind is dimmed.
- Inert control: pointer cursor kept as live, aria-disabled, no focus trap, no route change. No loading, empty or error state: the page is static.
- Reduced motion: no drawer animation.

## Not on this page
No requirement IDs, no OD notes, no Skills Tracking data or numbers, no toast, no dead `#` anchors, no lab bar, no persona switcher, no Sample data tag, no extra copy that the live page does not have.

## Task test IDs
P1 `/` returns 200 with no redirect. P2 the drawer sub-row and the card link both have href /admin/lists and are visible without a click. P3 keyboard path reaches it. P4 no `href="#"` on the page. P5 the walkthrough breadcrumb root links to `/`.

## Pixel spec (captured, live values)
Fonts: Source Sans Pro. Page text 14/19.6, colour 87% black. Top bar 48 px high, white, 1px bottom border (12% black), hamburger 48 wide with a 24 px light FA bars, h1 "Home Page" 18/600, search 398 wide x 40, radius 12, 1px border 12% black, 8 px padding; right group: grid, bell with green "New" pill (bg PRISM green, 12 px, radius 20), tasks (memo-circle-check), help (solid circle-question, pink) with red count badge "8" (28 px circle), "Chat" button (indigo fill, white 14/600, radius 4, 80x32, light comments-alt icon), "Ask Leo" button (pink fill, 14/600, radius 4, 103x32, Leo mark), user button "Romit Soley  PA DEMO (DPT)" 14/600 with light angle-down. At 948: search 221 wide, user name hidden (chevron only), cards stack.
Content: padding 16. Banner row: banner card 1170 wide (bg lilac, 1px border 12% black, radius 12, padding 8/16), Exxat One wordmark 114x30, title 18/600 with a gradient "New" pill, one line 14/400, "Explore" 20/600 indigo with external-link icon at the right; white PRISM logo tile 212x64 radius 4 at the far right (hidden at 948).
Cards: 1px border in the section colour, radius 8, header 8/16 with bottom border in the section colour, title 16/600 in the section's text colour, body padding 16, rows padding 12/16, icon 24 px light FA, title 18/600 section colour (link), description 14/400, gap icon to title 16. Pink Program (header has "Nov 15" indigo 16/600 with light calendar icon), orange Curriculum Management, teal Placement Management. Badges: New (green, 12 px, radius 20), Beta (yellow, 12 px, radius 20), Leo Powered (pill, soft pink/orange/yellow gradient, 14 px). Footer: "©2026 Exxat, Inc." 14 px, fixed bottom, 36 px, white, 1px top border.
Drawer: 265 wide, overlay below the top bar (top 48), white, shadow, header (logo 65x40 + close X) with bottom border, rows 40 high with 12 px side margin, icon 16 px, 16 gap, label 14/400; active Dashboard row bg 10% black; groups separated by a 1px 12% border with 16 px padding; Forms (Exxat Internal) last, indigo icon.
Screenshots: scratchpad/prism/live-1440-top.jpg, live-1440-scrolled.jpg, live-1440-drawer.jpg, live-1440-drawer-scrolled.jpg, live-948-top.jpg, live-948-drawer.jpg (the 948 captures were taken in an iframe at 948 px because the browser window could not be narrowed). Full path: /private/tmp/claude-501/-Users-romitsoley-Work-apps-skills-checklist/0157058e-671a-43d2-88cc-2d07e5ab08d9/scratchpad/prism/.

## DS mapping
Hand-rolled (reasons in docs/governance/ds-adoption.md, "Documented hand-rolls"): drawer, section cards, promo banner, pills, search field, inert links. DS Button (ghost, colour-only overrides) for toolbar buttons, Chat, Ask Leo, drawer close and the Competency toggle. Colours with no DS token live in app/(prism)/prism.css as `--prism-*` variables, each commented with the live computed value it came from.
