# Skills Tracking, admin app (scaffold)

Package `@exxat/skills-checklist-admin`, port **3007**, Next 15 + React 19 + Tailwind 4, `@exxatdesignux/ui` **1.6.5** (npm `latest` on 2026-10-08) and `@exxatdesignux/product-framework` 0.2.5.
Wave 0 foundation: three route groups with shells, the achievement engine, a typed in-memory data layer with sample data, shared product components and the copy library. All 18 surfaces (S-01 to S-18) are built against the confirmed contracts in `../docs/build/contracts/`.

```bash
pnpm install --ignore-scripts   # see "Install decision"
pnpm dev                        # http://localhost:3007
pnpm build && pnpm test && pnpm lint
```

## Wave 0 foundation (what surface workers build on)

```
app/
  (admin)/…           admin shell (DS AppSidebar) + every admin route, plus /dev/state
  (student)/…         student shell: mobile-first header nav, /courses, /my-skills
  (evaluator)/e/[token]   NO shell: wordmark and request only, no-referrer, noindex
lib/
  engine/             pure achievement engine (Wave W1 exit tests)
  domain/             types.ts (all entities), ids.ts (deterministic ids and tokens)
  seed/               deterministic SAMPLE database (buildSeed, SCENARIO ids)
  store/              pure actions + selectors + runtime (localStorage) + React hooks
  copy/               every string, keyed to docs/ux/09 (surface workers import, never retype)
components/skills/    shared product components (hand-rolls and vendors from docs/ux/10 §10)
tests/                engine, store, copy, ui
```

**Import contract.** Surfaces import data code from `@/lib/store` (pure) and `@/lib/store/react` (hooks), copy from `@/lib/copy`, components from `@/components/skills`. Surface workers must NOT edit `lib/store`, `lib/seed`, `lib/domain`, `lib/engine`, `lib/copy` or `components/skills`.

**Decisions (all `[INFER]`, none decides an open decision)**
- **One Next app, three route groups** instead of two apps: the student and evaluator surfaces share the engine and store. OD-P1 (standalone vs a section of Prism) stays open: `SKILLS_BASE` is `""` and the student and evaluator routes sit at the root.
- **No backend.** State is a typed plain-JSON `Db` held in memory and persisted to `localStorage` under a versioned key (`skills-checklist:db:v1`). Server and first client render both use the seed (SSR-safe `useSyncExternalStore`); persisted state loads after mount. `/dev/state` resets it.
- **SAMPLE data only (SL-01).** Prism ships no skills. Names such as "IV insertion" are demo content; categories and tags are neutral placeholders. Nothing in `lib/seed` is a recommended list.
- **Actions are pure** `(db, input, ctx) => Result`: no mutation, injected clock and token, deterministic ids from `Db.seq`. Skill status and submission outcomes are DERIVED from retained evidence and the CURRENT rule (AE-02); nothing stores them.
- **Evaluations are immutable (RV-03).** A revision after a return appends a new Evaluation; reviews are separate records.
- **OD-03:** the engine returns four states; ONE flag, `skillStatusDisplay` (default `four`, `lib/config.ts`, toggled at `/dev/state`), is read by `SkillStatusBadge` and the copy helpers.
- **OD-25 and OD-06:** which evaluator roles may sign off clinical or lab evidence is DATA in `lib/seed/roles.ts` (`db.roleEvidenceMap`), read by the send options and the S-09 BL-1 check. Roles are rows, not an enum.
- **OD-26 (proposed):** a clinical setting that a skill minimum names cannot be deactivated (`settingReferenced`).
- **OD-17, OD-18:** the evaluator view returns only the request behind the token and never achievement status; invalid, superseded and submitted links share neutral errors; opening a link never consumes it (only a submit does).
- **OD-01, OD-10, OD-11, OD-12, OD-13, OD-14, OD-16:** seams only. `copyMappings` is a plain helper, exports are CSV through one adapter with the evaluator column off, import interpretation is deterministic and never proposes a model, Replace is refused when evidence exists, partial save does not exist, and the return action is neutral about who corrects.
- **Course filter (RP-01):** scopes the population (enrolled cohorts) and the skills (mapped); evidence from any course still counts (CM-07).

**Sample data.** 12 skills (all four evaluation models; per-level and per-setting minimums; one with approval and self-evaluation; one with a mandatory comment; two unconfigured from an import), 3 categories, 4 tags (one inactive and still assigned), 5 settings, 6 locations, 2 lab instructors plus one student-named, 14 offerings, 40 students and about 530 submissions that cover every state. `SCENARIO` in `lib/seed/index.ts` names the students the tests rely on.

**Known gaps.** `tsc` and `next build` are green because the app has no postinstall and never runs `exxat-ui upgrade`. Spreadsheet, document and PDF parsing for import is not implemented (text and CSV only; `readTextFile` returns null for the rest so S-08 shows its unreadable error). No visual-diff or real-browser axe has run.

## Decisions

**Install decision (no postinstall).** `apps/pce/admin` runs `exxat-ui sync-extras` and `exxat-ui upgrade` in `postinstall`. `exxat-ui upgrade` is a Vite-scaffold porter: it generates roughly 70 shell files and makes `tsc` fail by design. The 1.6.x release notes say the default after a package bump is install only, and `upgrade` only when the notes ask for it. This app has no `postinstall`, never runs `upgrade`, and wires the few shell pieces it needs by hand. Use `pnpm install --ignore-scripts` if you want to be sure.

**Isolation.** `pnpm-workspace.yaml` in this folder keeps the app out of the repo-root pnpm workspace, like PCE.

**Imports are deep paths, never the barrel.** `import ... from '@exxatdesignux/ui'` fails `next build` (webpack): "conflicting star exports" for `buttonVariants`, `DROPDOWN_MENU_*` and `STATUS_BADGE_TONE_CLASS`. Use `@exxatdesignux/ui/components/ui/<name>` and `@exxatdesignux/ui/components/shell`. Deep paths also keep a single React context instance with the shell. The product `CLAUDE.md` still shows barrel imports; that text is outdated for this setup.

**Router shim.** The DS dist imports `react-router` / `react-router-dom`. `lib/react-router-compat.tsx` (copied from PCE) is aliased in `next.config.ts` (turbopack and webpack) and `vitest.config.ts`.

**Shell.** Packaged `AppSidebar` + `SidebarShell` filled through `AppShellSlotsProvider` (`components/app-shell-wiring.tsx`). Navigation is `lib/skills-nav.tsx`; routes are `lib/skills-routes.ts`. Review and approve is hidden until a skill has approval turned on (REQ SC-15).

**Theme.** `theme-prism` and `data-shell-density="compact"` on `<html>`. A Prism module takes the Prism theme; the theme for a standalone product is part of the open placement decision OD-P1.

**Route base.** `SKILLS_BASE` in `lib/skills-routes.ts` is `""`. OD-P1 (standalone app vs section of Prism) is open, so changing it is a one-line edit.

## Not in this scaffold

Student app (port 3008), command palette, Ask Leo, product switcher, notifications, any data layer, the achievement engine. Engine tests come first: see `tests/engine/README.md`.


## Verification status (2026-10-08, after the gate fix pass)

**Design system version.** The app resolves `@exxatdesignux/ui` **1.6.5** and `@exxatdesignux/product-framework` 0.2.5 from `admin/node_modules` (checked with `node -e "require('./node_modules/@exxatdesignux/ui/package.json').version"`). The workspace tool `node tools/ds/source.mjs` resolves the WORKSPACE copy (1.5.1); do not read its output as this app's version.

**Run in this fix pass (literal results are in the fix report):** `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm test`, `pnpm coverage:req` (test-level requirement coverage), `next build`, `node ../.claude/hooks/check-req-ids.mjs`, and a real-browser run on a production build (`.verify/e2e-fix/check.mjs`, 30 checks, axe with contrast on).

**Decisions made in the fix pass (`[INFER]`, OD-18 and the rest stay open):**
- S-16 keeps the contract's two neutral states: an invalid or superseded link share one message; "already submitted" is the only distinct one (DEC-015).
- The S-14 outstanding counter reads "Awaiting evaluation" (DEC-012).
- The S-09 model picker works around a design-system defect in `SelectionTileGrid` (DEC-014, `docs/ux/10`).
- A keyboard choice in the model picker keeps focus on the radio group; a pointer choice moves focus to the new model's first field.

**NOT verified:**
- Visual diff against the design system catalogue (`localhost:4000`).
- Hover and focus ring rendering in a tab walk, and tooltip or popover clipping.
- A real phone: the 390px checks used headless Chromium only, no device or touch run.
- A screen reader (VoiceOver or NVDA) and a full keyboard-only pass.
- Spreadsheet, document and PDF import (text and CSV only).
- Anything that needs a backend: real sign-in, multi-user conflicts, email sending.

## Shell (rework wave R0, 2026-10-08)

Romit's correction: build Sankalp's prototype layout inside the DS base shell. The shell now follows the DS Design OS compact layout, composed like `apps/pce/admin/app/(app)/layout.tsx`:

- `app/(shell)/layout.tsx` -> `components/shell/shell-frame.tsx`: `SidebarShell` (`data-shell-utility-bar-full`) > full-width `UtilityBar` > `[data-app-shell-row]` with `AppSidebar` + `SidebarInset` (single scroll owner, `data-page-scroll`). Without those two data attributes the DS stylesheet does not offset the rail below the bar.
- `components/shell/utility-bar.tsx`: sidebar toggle, `exxat Prism` lock-up, breadcrumb "Skills & Competencies / Nursing / <page>", Search (opens the DS CommandDialog, `components/shell/command-menu.tsx`, also ⌘K) and a profile menu. No notifications, help or Ask Leo controls (no such surfaces in scope).
- `lib/skills-nav.tsx`: groups ADMINISTRATOR / STUDENT / EVALUATOR with the prototype's labels. Skills Library's URL is `/skills/library` so every library tab keeps it active.
- Route groups: `app/(shell)/(admin)`, `app/(shell)/(student)` (a slim student strip: acting student + Course skills / My skills), `app/(shell)/student` (alias to `/courses`), `app/(shell)/preceptor` (prototype mailbox + the same form inline). The shell-free evaluator link `/e/[token]` stays outside the shell (EV-01).
- Ported from the generated starter (`exxat-ui init` in a scratch dir, not run in this app): only the composition pattern and data attributes. The starter's `utility-bar-slot.tsx` (800 lines, product/school switchers, Ask Leo, notifications) was NOT ported; `components/shell/utility-bar.tsx` is a reduced equivalent built from DS primitives.

## Verification status (integration pass, 2026-10-08)
Gates: `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm test`, `pnpm coverage:req`, `next build`, `node ../.claude/hooks/check-req-ids.mjs`. Real-browser pass (production build, Playwright, axe with contrast on): `.verify/integrated/run.mjs` (re-runnable; start `next start --port 3081` first).
NOT verified: visual diff against the live DS catalogue (localhost:4000), hover and focus rendering states, a real phone, a screen reader, anything needing a backend. Import parsing is text and CSV only.

## Shell (updated 2026-10-08)
The utility bar and menu hierarchy follow the Exxat Design OS shell: product switcher, page title, Search, Notifications, Help, Ask Leo, scope switcher and profile menu in the DS order; the rail is one flat list per view (Administrator, Student, Evaluator), and the persona is switched from the profile menu. Anatomy, evidence, delta and decisions: `docs/build/ds-shell-anatomy.md`. The DS `CommandDialog` does not supply the cmdk root: wrap its children in `<Command>` (regression test in `tests/ui/shell-chrome.test.tsx`).

