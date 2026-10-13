# Exxat DS shell: anatomy of the real header and menu hierarchy, and what Skills now does

Written 2026-10-08 after Romit's correction: "the header doesn't match the Exxat design system header, menu hierarchy."
Evidence is captured, not remembered: screenshots in `docs/source/ds-shell/` (`pce-*`, `starter-*`, `skills-*`, `compare-three-way.png`) taken from the running apps, and the sources named below. Tags: `[PCE]` shipped PCE admin, `[STARTER]` the canonical generated starter (`exxat-ui init`, @exxatdesignux/ui 1.6.5), `[EM]` Exam Management admin, `[PKG]` the installed package types, `[INFER]` my reading.

## 1. Which shell is the target

Two shells ship today.

| Shell | Where | Header | Rail |
|---|---|---|---|
| **Design OS compact shell** (target) | PCE admin, the starter | Full-width utility bar above sidebar and content | Flat primary rows, icon-only or expanded, optional secondary panel |
| Classic shell | Exam Management admin | Brand header inside the sidebar, thin top bar with breadcrumb, persona switch, Ask Leo | Primary list plus a nested secondary panel and footer rows (Roles & Access, Settings, Get Help, user card) |

Workspace memory ("ALL products follow Design OS", "PCE compact-shell migration, Aug 2026") makes the compact shell the target. The Skills shell follows it. `[PCE]` `[STARTER]`

## 2. Anatomy of the real header (utility bar)

One row, full width, above both the rail and the page. Left to right `[PCE]` `[STARTER]` (`docs/source/ds-shell/pce-rail-expanded.png`, `starter-page-prism-learning.png`):

| # | Control | What it is | Source of truth |
|---|---|---|---|
| 1 | Sidebar toggle | Collapses the rail to icons or expands it; chord Cmd/Ctrl+B | `SidebarTrigger` |
| 2 | **Product switcher** | Round Exxat mark + product name + chevron; menu "Switch product" lists the Exxat products with the current one ticked | app-owned `utility-bar-product-switcher.tsx`; products from `@exxatdesignux/product-framework` brands |
| 3 | Breadcrumb / page title | Top-level page: the page title only ("Dashboard"). Hub detail: "Learning activities > All courses". No product or program text here | app-owned `UtilityBarBreadcrumbSlot` |
| 4 | Search | Opens the command palette; Cmd/Ctrl+K | command menu |
| 5 | Notifications | Bell with unread badge | slot `NotificationsSlotProps` `[PKG]` |
| 6 | What's new | Megaphone with badge; opens the what's-new sheet | `whats-new-sheet` |
| 7 | Help | Question-mark | app |
| 8 | Chat with support | Speech bubble | app event |
| 9 | Onboarding | Flag | app |
| 10 | **Ask Leo** | Outlined pill with the Leo star and label | package `AskLeoLauncher` (needs `LeoAmbienceProvider` and the DS `ThemeProvider`) |
| 11 | **Scope (school / program) switcher** | School logo button; menu = school header with "Change", then a "Program" list with the current program ticked | app-owned `utility-bar-school-switcher.tsx` |
| 12 | **Profile menu** | Avatar; menu = identity, Profile settings, **Switch to \<other\> view**, Appearance, Demo account, Dashboard layout, Log out | app-owned `utility-user-menu.tsx` |

Density: at under 768px Search / What's new / Help / Onboarding fold into a More menu; Notifications and Ask Leo stay. `[STARTER]` file header.

## 3. Anatomy of the menu hierarchy

Hierarchy is expressed in three levels, none of which is a role group:

1. **Product** (utility bar, level 2 above): which Exxat product's nav is shown. `[PCE]` Clinical Education vs Surveys vs Exam Management.
2. **Primary rail rows**, one flat list per product (`NavLinkItem[]`). A row is either a page (starter: Dashboard, Courses, Placements ...) or a **module group with children** (PCE: "Course Surveys" with Dashboard / Analytics / Settings; the children appear as a flyout on the icon rail and nested when expanded). Single-page modules (PCE Directory) use **horizontal tabs inside the page** for their peers (Courses / Faculty / Students / Term). `[PCE]` `lib/pce-nav.tsx`
3. **Secondary panel** for hubs that scope a list: starter "Learning activities" opens a panel (All courses / Reports / Auto Notification, then a GROUP of folders) beside a collapsed icon rail. `[STARTER]` `NavLinkItem.secondaryPanel`, `NavDrillInConfig` `[PKG]`

Rail default: the starter opens **expanded with labels**; PCE opens **icon-only** (a deliberate Aug 2026 migration). Both are valid; the toggle is Cmd/Ctrl+B. Skills follows the starter (four rows do not read well as bare icons). `[INFER]`

Page chrome: serif page title, one-line description, primary action at the top right of the content (PCE "Set Up Surveys", "Add Course Offering"), then filter bar and table. No breadcrumb above the title. `[PCE]`

### How Exxat products switch persona and scope (the part I had wrong)
- **Persona:** the profile menu offers "Switch to Faculty view" (PCE). Choosing it replaces the nav set (`NAV_ADMIN` to `NAV_FACULTY`). Personas are never sibling groups in the rail.
- **Scope:** school then program, in the scope switcher at the right of the bar. Not in the breadcrumb.
- **Product:** the product switcher at the left of the bar.

## 4. Delta: my first shell versus the real one

| Area | Real DS shell | My first shell | Fixed |
|---|---|---|---|
| Brand | Product switcher with mark + product name | Static "exxat Prism" wordmark link | Yes: `ProductSwitcher`, menu lists products |
| Breadcrumb | Page title only on top-level pages | "Skills & Competencies / Nursing / Overview" trail | Yes: page title only; program moved to the scope switcher |
| Right side | Search, Notifications, What's new, Help, Support, Onboarding, Ask Leo, scope, profile | Search and an avatar | Partly, by design (section 5) |
| Scope | School/program switcher | Absent (text in the breadcrumb) | Yes: `ScopeSwitcher` |
| Profile menu | Identity, Switch view, Appearance, ... | One link | Yes: identity, Switch to student/evaluator/administrator view, Appearance, Sample data |
| Menu hierarchy | One flat list per view; persona via profile menu | Three role groups (ADMINISTRATOR / STUDENT / EVALUATOR) as siblings | Yes: flat list per view; view derived from the route |
| Persona cue | n/a in PCE; "Switch to Faculty view" item | None | Added: bar chip "Previewing as student" with "Back to administrator" `[INFER]` |
| Ask Leo | Pill in the bar | Absent | Yes, with an honest "not connected" panel |
| Command menu | Opens a palette | **Crashed on open** (DS `CommandDialog` needs a cmdk `Command` root; no test had ever opened it) | Fixed, regression test added, mutation-checked |
| Avatars | Logo for school, photo for person | Same initials twice | Building icon for scope, initials for person |

## 5. Decisions on controls that cannot be real here (justified)

Rule used: render a bar control only if it does something true in this prototype; leave out one that would be dead.

| Control | Decision | Why |
|---|---|---|
| Search | Rendered, opens the real command menu | Real |
| Notifications | Rendered, honest empty state, no badge | The control is part of the bar; there is no feed. In-app notifications and reminders are out of scope (REQ section 14) |
| Help | Rendered, lists the two real shortcuts | Real, small |
| Ask Leo | Rendered via the package launcher; opens a panel that says Leo is not connected | It is the DS bar's flagship control; hiding it is a visible mismatch. Flagged for Romit |
| What's new, Chat with support, Onboarding flag | **Left out** | They need content or a service this product does not have. The bar layout leaves their slot position |
| Product switcher rows | Clinical Education current; other products listed but disabled with a one-line explanation | Switching needs the Prism launcher; OD-P1 (standalone app or Prism section) is open. No dead links |
| Scope switcher | Sample University > Nursing, one program | Sample data covers one program |
| Log out | Absent | There is no sign-in |

## 6. What Skills renders now

```
Utility bar:  [toggle] [(E) Clinical Education v] | <Page title> [chip: Previewing as ...]      ...  [Search][Bell][?][Ask Leo] | [Scope][Profile]
Rail (admin): Overview / Skills Library / Course Mapping / Review & Approve (only when a skill needs approval, SC-15)
Rail (student view):    Student View / My skills
Rail (evaluator view):  Preceptor Evaluation
Page:         serif title, description, content (Skills Library peers are tabs: Skills, Categories, Tags, Clinical Settings, Lab Instructors)
Outside the shell: /e/[token] (evaluator link, no login, no nav; EV-01)
```

Files: `components/shell/{utility-bar,product-switcher,scope-switcher,user-menu,utility-controls,product-mark,products,view,page-titles,command-menu,shell-frame}.tsx|ts`, `components/app-shell-wiring.tsx`, `lib/skills-nav.tsx`. Brand colours come from `@exxatdesignux/product-framework` (`EXXAT_PRISM_BRAND` etc.), the mark geometry is the DS's own.

## 7. Verification (real browser, production build, temp copy; 2026-10-08)

- Control order, by accessible name: Toggle sidebar, Current product, Search, Notifications, Help, Ask Leo, Scope, Profile, then rail rows, then page. Tab order matches. Cmd/Ctrl+B collapses the rail; Cmd/Ctrl+K opens the command menu (previously crashed).
- axe (wcag2a/aa, 2.1 a/aa, best-practice, contrast on): **0 violations** on the closed bar and rail, Notifications, Help, Ask Leo panel, command menu, student view, evaluator view. With the product, scope or profile menu open: `aria-hidden-focus` and `region`, identical findings (and more) on shipped PCE (`axe-pce.mjs`), so they come from the DS menu surface, not from this shell.
- Console: 0 errors or warnings across the pass. 390px: no horizontal overflow; Ask Leo collapses to an icon; the product name truncates.
- Tests: `tests/ui/shell-chrome.test.tsx` (bar anatomy and order, switchers, profile menu, command menu), `tests/ui/shell-views.test.tsx` (student view nav and chip), `tests/shell.test.tsx`, `tests/ui/shells.test.tsx`.

## 8. What still differs, and why

- **Rail default and secondary panel:** none used; four primary rows with tabs inside the library page is the PCE Directory pattern. If the library later needs a scoping rail, `NavLinkItem.secondaryPanel` is the DS route.
- **No What's new, Chat with support, onboarding flag, notification badges:** section 5.
- **Open menus fail two axe rules:** DS-inherent (section 7).
- **Not verified:** a visual diff against the DS catalogue at `localhost:4000` (not running here), hover and focus rendering of every control, a real phone, a screen reader.

## 9. Decisions for Romit

1. **Persona switching** as a profile-menu view switch with a bar chip (this is how PCE does "Switch to Faculty view"); the prototype's three role groups are gone from the rail. Say if you want a dedicated "Preview as" control in the bar instead.
2. **Product switcher** lists Exxat products but only Clinical Education is live. Depends on OD-P1.
3. **Ask Leo** is shown but not connected. Remove it, or keep as a placeholder?
4. **Rail default:** expanded (starter) versus icon-only (PCE).
