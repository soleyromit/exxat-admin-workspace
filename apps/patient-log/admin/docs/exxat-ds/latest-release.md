# @exxatdesignux/ui — upgrade notes (bundled)

> **Agents:** read this before porting shell after `pnpm add @exxatdesignux/ui@…` / `npm install`.
> Default is **install only**. Run `exxat-ui upgrade` only when the notes (or the user) ask for shell sync.
> Binding rule: `exxat-consumer-package-upgrade`. Skill: `exxat-package-upgrade`.
>
> This file is the **latest 5 releases** only. Full history:
> https://github.com/ExxatDesign/Exxat-DS-Workspace/blob/main/packages/ui/RELEASES.md
>
> Also available as `docs/exxat-ds/latest-release.md` after `exxat-ui sync-extras`.

## 1.5.1 — 2026-08-20

Vite consumers of 1.5.0 crash on load with `useLeoAmbience must be used within
LeoAmbienceProvider` even when `LeoAmbienceProvider` is mounted. The published
build inlined a private copy of every shared module into each entry, so the
provider and the Ask Leo launcher held different React contexts. Install 1.5.1
only. No `exxat-ui upgrade` and no app-source change.

### Fixed

- **Singleton dist entries.** Sibling imports stay imports in the published
  JS (`@exxatdesignux/ui/components/ui/leo-ambience-context` from the launcher,
  not an inlined copy). The same repair covers ThemeProvider, shortcut scope,
  and other modules that hold runtime identity.
- **Publish gate.** `check:dist-singletons` fails the release if a context or
  store is duplicated across `dist/` bundles.

### Upgrading from 1.5.0

Install `@exxatdesignux/ui@1.5.1` and `@exxatdesignux/product-framework@0.2.5`.
Restart the Vite dev server so `node_modules/.vite/deps` is rebuilt. The Leo
crash does not need `exxat-ui upgrade`.

If `tsc` fails on a Product map after this install, the Programs product is
new. Apps that still own `lib/product-glyph.ts` from a 1.2.0-era ledger should
run `exxat-ui upgrade --only lib/product-glyph.ts --force` (and the same for
`lib/mock/navigation.tsx` if the typechecker names it).

## 1.5.0 — 2026-08-18

Campus home is a fifth products-home layout. The workspace sets school and
program once, then opens licensed apps into that campus. Compliance and
Curriculum Mapping stay in Your App. Unlicensed school-family apps move to
More from Exxat as catalog rows, not Open.

### Added

- **Campus home.** `/home/campus` greeting, one Your App heading with a
  workspace `ProductScopePicker`, Whats new, and More from Exxat. People
  Management and Course Management sit in the same owned index.
- **Campus licence split.** School-family apps that the picker program does
  not license leave Your App for More from Exxat. Compliance and Curriculum
  Mapping stay on campus even when the picker program is outside their grant.
- **Default entitlement.** Compliance and Curriculum Mapping ship as owned
  apps alongside Prism and Exxat One.

### Changed

- Shared record doors are labelled **People Management**, **Course
  Management**, and **Personnel Management**.
- Off-campus owned apps use the catalog row to `/home/:slug` instead of Open.
- `MarketingBanner` shows the visual column from 20rem and can overlay copy
  on featured art. Whats New screenshot cards and featured product art use
  cover fit.

### Upgrading from 1.4.0

Install 1.5.0 and run `exxat-ui upgrade --check`. If the report lists Campus
home shell files (`campus-home.tsx`, `home-mosaic.tsx`, product-home routes,
or marketing banner), run `exxat-ui upgrade`. Product-framework 0.2.4 ships
with this release for the door labels.

## 1.4.0 — 2026-08-18

The component catalog now documents complete form controls, editing patterns,
responsive shell chrome, and page templates. Consumer upgrades can also repair
a missing Design OS entry point without replacing app-owned navigation.

### Added

- **Form and editing primitives.** Accessible OTP, rich-text editing, inline
  text editing, inline select editing, and table-sized editing cells.
- **Catalog coverage.** Form hierarchy, textarea states, responsive page
  headers, production utility bar modes, sidebar variants, application shell,
  details page template, and long wizard guidance.
- **Catalog navigation repair.** `exxat-ui upgrade` can add the Design OS account
  menu entry when an older consumer has routes but no reachable entry point.

### Changed

- `PageHeader` supports embedded heading levels for accessible documentation.
- `Field` is a neutral grouping element. Descendant controls own their native
  disabled state.
- Product side panels are documented under the canonical **Sheet** composition.

### Upgrading from 1.3.0

Install 1.4.0 and run `exxat-ui upgrade --check`. If the report identifies a
missing Design OS entry point, run `exxat-ui upgrade`. Review any stored rich
text as untrusted HTML and sanitize it before rendering outside the editor.

## 1.3.0 — 2026-08-17

Customer upgrades can now move an old application into the managed architecture
without treating package installation as proof that routes, flows, ownership,
and browser state survived. Leo's complete launcher also moves into the package,
so DS fixes no longer stop at a consumer-owned utility bar.

### Added

- **Transactional consumer migrations.** `exxat-ui migrate` inventories legacy
  routes, navigation, authorization, mutations, drafts, and persisted state;
  verifies a reasoned human review; creates a checksummed plan; and applies it
  in an isolated Git worktree. Validation, framework idempotence, source commit,
  package artifacts, installed versions, and receipt provenance must all agree
  before one binary-safe patch reaches the customer checkout.
- **Persisted-state protection.** The public copy-only storage migration engine
  preserves source keys, rejects collisions and dynamic key guesses, backs up
  before writing, verifies each target, rolls back partial writes, coordinates
  tabs with a lease, and records idempotency receipts for local and session
  storage.
- **A packaged Ask Leo launcher.** `AskLeoLauncher` now owns the chip, halo,
  wash, star slot, label, one-shot arrival, and staged greeting. The package
  also exports the launcher wash, animated blob background, Leo ambience
  provider and preferences, utility bar chrome, and related greeting hooks.
- **Two shell seams.** `userMenuAccountItems` adds account actions without
  forking `NavUser`, and `useExclusiveShellOverlay` lets app-owned overlays
  yield the secondary column when another shell layer opens.

### Changed

- App-side Leo modules remain as re-exports, so existing imports continue to
  resolve while package updates deliver implementation fixes.
- Upgrade guidance now pins the destination package CLI for planning and apply,
  and prepublish plans can bind exact UI and product-framework tarball
  checksums.

### Upgrading from 1.2.0

Pin the destination CLI, create a migration plan, and follow its detected mode:

```bash
TARGET_VERSION=1.3.0
npx --yes --package="@exxatdesignux/ui@$TARGET_VERSION" \
  exxat-ui migrate plan
```

Managed apps can write and apply the plan directly. Legacy apps must complete
`migrate legacy inspect` and `migrate legacy verify`, commit the ownership and
review artifacts, then create a fresh plan and apply it from a clean Git root.
`AskLeoToggle` no longer accepts `introActive`; the packaged launcher stages its
own greeting. See migrations 0005 and 0006.

## 1.2.0 — 2026-08-15

Leo's launcher answers the pointer, arrives instead of appearing, and its field
can be placed. 1.1.0 gave the chip Leo's drifting lobes; this makes the chip
behave like something holding them. Everything here is chrome on one control, and
every new light pass stands down for reduced motion and forced colours.

1.1.0 was tagged in the workspace but never published, so its notes are below and
its changes ship inside this release.

### Added

- **Hover and keyboard focus lift the chip's field.** The lobes only ever
  brightened for Leo's own states, so hovering the launcher looked the same as not
  hovering it apart from a border step every other action in the bar shares.
  Hover and `:focus-visible` now spend the same field budget the live states do,
  in CSS rather than through the React flag that also decides intensity and sheen
  when the field mounts — routing hover through that flag would restart the
  lobes' drift under the pointer.
- **The outline is lit by the lobes, and the light reaches past the box.** A
  second copy of the field is masked to a ring straddling the border and blurred,
  so an arriving lobe brightens the outline where it reaches it and blooms about
  6px beyond the chip. Without it the control read as a window cut into a field
  rather than as a chip holding light. Nothing measures lobe positions: same
  lobes, same size, same mount, so each bloom sits under its own lobe by
  construction. Where `mask-composite` is unsupported the layer stays off rather
  than painting a blurred field across the label.
- **The launcher's field can be placed.** Leo appearance gains the offset pad the
  search bar already had, on the chip's own range — 14px against the composer's
  120, so the pad nudges the field inside the control instead of parking it off
  it. `launcherWashOffsetX` and `launcherWashOffsetY` join the persisted
  preferences and are clamped on read, so a value stored from a wider range
  cannot survive.
- **The chip arrives.** It lands icon-only and opens into icon and name: the
  label's box grows from nothing, and since the chip's width is its content that
  is the whole mechanism, with the halo, wash, and edge light following for free.
  The outline draws itself in behind that — `border-color` runs from transparent
  up past its resting strength and settles — and then the name rises 2px, takes
  one bloom of the sheen's colour, and one band of that colour crosses it on the
  border sheen's own envelope, so the two read as one light rather than two
  highlights travelling independently. The cost is honest: the utility icons left
  of the chip slide about 60px as it opens, once, during the shell's first paint.
- **Leo greets on load, visibly.** The star's slot turns a quarter as the chip
  opens and lands upright. The icon's own gesture is sized for hover — a 6%
  squash, a 5deg tip — which on a 20px glyph is under a pixel of travel and was
  invisible beside a chip changing width, so the turn carries the movement while
  the gesture's sparkle brightening rides along. A quarter and only a quarter,
  because the mark is 4-fold symmetric: 90deg lands the star on itself, so no
  frame of it shows something that could be read as a different icon. One eased
  pass, never repeated, since repetition is what makes a turning mark read as
  indeterminate progress.

### Changed

- **The chip's field keeps a lower connective floor than the composer's.** Across
  ~110px the composer's level was most of what you saw and the three lobes
  disappeared into it. The edge light's copy drops that floor entirely, which is
  what lets the outline be lit unevenly instead of holding one flat colour.

### Upgrading from 1.1.0 or 1.0.1

Install 1.2.0 and run `exxat-ui upgrade`, then `exxat-ui doctor` to confirm the
install. Coming from 1.0.1, the one thing that may need a change on your side is
1.1.0's removed `--ask-leo-chip-wash`: point any chrome that read it at
`--ask-leo-chip-blob-opacity` instead. Nothing in 1.2.0 requires a change.
