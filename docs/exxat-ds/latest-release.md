# @exxatdesignux/ui — upgrade notes (bundled)

> **Agents:** read this before porting shell after `pnpm add @exxatdesignux/ui@…` / `npm install`.
> Default is **install only**. Run `exxat-ui upgrade` only when the notes (or the user) ask for shell sync.
> Binding rule: `exxat-consumer-package-upgrade`. Skill: `exxat-package-upgrade`.
>
> This file is the **latest 5 releases** only. Full history:
> https://github.com/ExxatDesign/Exxat-DS-Workspace/blob/main/packages/ui/RELEASES.md
>
> Also available as `docs/exxat-ds/latest-release.md` after `exxat-ui sync-extras`.

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

## 1.1.0 — 2026-08-15

Never published: its changes ship inside 1.2.0 above.

A grouped hub reads as batches now instead of as one long list with grey rules
in it. Every divider carries a fill, names its value the way the rows beneath it
do, and offers the whole group in one click. Column headers admit what the
Properties drawer did to them. Leo's launcher gets the same drifting field the
composer has, with its own settings, because the chip is in the shell on every
route while the composer only exists inside Leo.

### Added

- **Group dividers carry colour and identity.** A grouped `DataTable` tints each
  band with the column's declared status tone where there is one, and with a
  categorical chart hue hashed off the value otherwise, so grouping by owner,
  type, or term still heads every batch with a colour that survives sorts,
  filters, and reloads. `neutral` takes a hue too: one grey band among coloured
  ones reads as a divider that failed to paint, so the chip in the rows keeps its
  grey and only the band takes a hue. Dividers also read the grouped column's
  `cellKind`, so a person group is headed by an avatar and name and other kinds
  are prefixed by the column's own glyph. Both fills are inline styles, so
  forced colours drop the whole band to `Canvas`.
- **Take a whole group in one click.** A grouped, selectable table leads each
  divider with a tri-state checkbox, in a slot the width of the select column and
  on the same axis as the row checkboxes below it. It adds or releases only that
  group's rows, so a batch the user already took elsewhere survives.
- **Headers mark what is applied to them.** A column narrowed by a filter,
  grouped, or carrying a conditional rule now says so in its header, so the state
  the Properties drawer set is legible without reopening the drawer. Each marker
  has a label and a visible tip.
- **A conditional rule can borrow the status badge's fill.** Rule colour now
  comes from the rule palette, from the status badge tone the column already
  uses, or from a colour the workspace brings. A rule that matches a status stays
  in step with its chip in both schemes instead of drifting from it, and every
  source stays inside the contrast budget a single cell's ink depends on.
- **`ToggleSwitch` and `ButtonSegmentedControl` accept `disabled`.** A row that
  waits on a parent switch is still announced and still shows which answer is in
  force, but is out of the tab order.
- **`exxat-ui doctor` reports install health, and the CLI says when it is old.**
  Ownership and installation failures surface through postinstall and `doctor`
  rather than being discovered later as missing files. Consumers on a stale
  version get a notice with the version to move to.

### Changed

- **The Ask Leo launcher paints Leo's blob field.** The chip's single travelling
  gradient is replaced by the same lobes the composer uses, sized to a chip so
  each drift crosses it top to bottom. The field is the chip's resting surface
  rather than a flash on load: it idles under the label's contrast budget and
  spends the rest only while Leo is arriving, open, or working. It stands down
  entirely for reduced motion and forced colours.
- **Leo appearance carries the launcher's own settings.** A new Ask Leo button
  tab holds the chip's switch, blob intensity, field strength, and sheen,
  separate from the Leo search bar's. Field strength scales the per-scheme
  contrast budget rather than replacing it, so the label's ink stays safe in both
  schemes. Motion is still one decision on the Motion tab.
- **Exclusive settings choices use `ButtonSegmentedControl`.** The outline toggle
  group they used could be clicked into a fourth, empty state; a preference with
  no answer is not a state the app can honour.

### Removed

- **`--ask-leo-chip-wash`.** It described the travelling gradient that no longer
  exists. The launcher's budget is now `--ask-leo-chip-blob-opacity`, the
  opacity the field is allowed to spend behind the label. Nothing outside the
  launcher read the old token; a consumer who copied it into their own chrome
  should move to the new one.

### Fixed

- **The sticky column header stopped pinning after a column menu was used.** A
  mouse click parked focus on the `⋯` trigger, which the header read as keyboard
  focus and then suppressed the pinned header for the rest of the session. Focus
  has to be visible (`:focus-visible`) to take the header out of its pinned
  state, so grouping and scrolling keep their header.

### Upgrading from 1.0.1

Install 1.2.0 and run `exxat-ui upgrade`, then `exxat-ui doctor` to confirm the
install. If your own chrome referenced `--ask-leo-chip-wash`, point it at
`--ask-leo-chip-blob-opacity` instead. Nothing else in this release requires a
change on your side.

## 1.0.1 — 2026-08-14

This is the corrective release for 1.0.0. It publishes the matching
`@exxatdesignux/product-framework@0.2.3` artifact before the UI package and then
installs the UI tarball against that registry artifact, so npm consumers receive
the same navigation APIs the workspace tested.

### Fixed

- A malformed persisted tenant product is skipped and reported without
  preventing valid custom products from registering. Invalid shipped or edited
  nav is validated before it can poison the tenant store.
- Mixed legacy and `NavLinkSpec` trees preserve nested icon classes. The nav
  codemod reports helper-produced icons, leaves their declaration unchanged,
  handles type-only imports, and plans every target before writing any file.
- `upgrade` and `eject` reject paths outside the app root. A malformed
  `.exxat-ui/ejected.json` aborts before writes, ledger updates are atomic, and
  every legacy patch uses the same ownership-aware backup path.
- First-run drift is no longer guessed into ownership. A trustworthy previous
  baseline distinguishes edited files from untouched old package copies;
  otherwise the CLI asks for `--declare-existing-owned` or `--force`.
- `eject --adopt` restores the current generated-starter copy immediately and
  backs up the app-owned version before removing its ledger entry.
- Add-only seams are import-closed. Product-specific `app-shell-wiring.tsx` and
  `panel-bridges.tsx` remain starter references rather than being synthesized
  into apps that may not have their dependencies.
- Product console rows, theme-family selection, and special settings active
  rules moved out of the generic shell and into app wiring or the product
  framework registry.
- Release gates now include the layer audit. The release wrapper publishes the
  framework first and runs a registry-realistic consumer smoke before uploading
  the UI package.

### Upgrading from 1.0.0

Install 1.0.1, then run `exxat-ui upgrade`. If this is the first declarative
ownership run and the app has no trustworthy baseline, review the listed files
and choose either `--declare-existing-owned` to preserve them or `--force` to
take package copies with backups.

## 1.0.0 — 2026-08-14

**Why 1.0 now.** Not because your code has to change — the *Upgrading* list below
is the whole of it. It is 1.0 because the thing a version number is supposed to
promise finally exists: an update contract. Until now an upgrade wrote 534 files
into your repo and hoped none of them were yours, which made "take the fix" and
"keep my work" the same operation competing for the same file. A release now
writes 120 — of which only 33 can overwrite anything, the other 87 being created
just when missing — flags 7 more for you to merge by hand, and leaves everything
else alone at every version. What it will not touch is app-owned by declaration
now rather than by luck. 0.12 and 0.13 were planned along the way and
never published, so this release also carries their work: the layer boundaries,
nav-as-data, and the shell move.

### Added

- **The app shell ships as code instead of being copied.** `AppSidebar` and the
  sixteen files around it live in the package now, at
  `@exxatdesignux/ui/components/shell`, so sidebar fixes, a11y work, and new
  chrome arrive with a version bump and write nothing into your source tree.
  Everything the shell used to know about one specific app is now something you
  hand it: `AppShellSlotsProvider` takes `slots` (notification bell, brand
  lock-up, product switcher rows, scope menu body, identity-menu rows, drill-in
  panel bodies), `on` (open the command menu, open Ask Leo, log out), `routes`
  (which paths hide the sidebar, what the rail does when a panel closes), and
  `data` (nav, scope, active product, workspace-settings destination). Every one
  is optional — an unfilled slot renders nothing, an absent callback is a no-op —
  so an older wiring file still gets a working sidebar after the bump. Secondary
  panels became a registry (`{ id, title, Body, flyoutRoute, autoOpen? }`) with
  the shell owning the route state machine, so adding a hub panel no longer means
  editing a 748-line file with two product ids named inside it.
- **Navigation is data.** Built-in and tenant products alike author
  `NavLayoutSpec` — ungrouped rows, labelled sections, trailing rows, drill-ins —
  with icons as Font Awesome class strings rather than JSX nodes, so a nav tree
  survives `JSON.stringify` and can come from a server later.
  `assertNavLayoutSpec` throws on duplicate section keys, and `assertNavSpecs`
  throws on a missing `iconClass`. `ShellNav.rowActive` lets an app override one
  row's active state and return `undefined` to defer, which is how the last piece
  of Exxat route knowledge left the package.
- **`exxat-ds/layer-boundaries` ESLint rule + `pnpm layers:audit`.** A single
  `@/…` import added to `packages/ui` is what turns a publishable component back
  into a file an upgrade has to copy, so it now fails a lint rather than being
  found a release later.

- **`exxat-ui codemod nav-specs` moves your nav rows onto the current shape, and tells you what it will not decide.** A nav row's icon travels as a Font Awesome class string now (`iconClass: "fa-light fa-books"`). The JSX form still renders, by reading the class name back off the node — which works for a bare `<i>` and quietly falls back to a grey circle for a wrapper component, a conditional, or an icon with a sibling badge, without throwing. The codemod converts the icon pairs and retypes the builders it can prove, transitively: converting one row builder retypes the section builder that calls it. Then it stops at the parts that are your call and names them by file and line — an **exported** registry that now receives specs (retype it and let callers render, or wrap it in `navLayoutToJsx()` / `navToJsx()`), an icon it cannot read, a row with no type annotation, a `sectionRouteMatch` function with no data form. `--dry-run` shows both lists; re-running is a no-op and keeps reporting the outstanding boundaries. Secondary nav still takes nodes and is left alone. `upgrade` counts the rows still in the old shape and names the command; it never rewrites your nav file.

### Fixed

- **`@exxatdesignux/ui/components/ui/<name>` resolves again.** The package exposed `./components/*` mapped onto `dist/components/ui/`, so the `components/ui/…` form every doc and the component map recommends doubled the segment and failed with `ERR_MODULE_NOT_FOUND`. 69 of the 77 specifiers in `component-map.json` were unresolvable, which only started to bite when 0.11.0 moved `chart` out of the root barrel and sent people to a subpath for the first time. Both `components/chart` and `components/ui/chart` now work.
- **`exxat-ui upgrade` no longer overwrites files an app has made its own — and the app says which those are.** New `exxat-ui eject <path>` forks one package file into the app, rewrites its relative imports back to package specifiers, and records it in `.exxat-ui/ejected.json`. `upgrade` leaves every listed path alone, lists them under *"Your version kept"* with the package copy's path, and brings everything else current with a backup. `eject --list` flags forks whose package version has moved since; `eject --adopt <path>` hands one back. `--force` still takes the package version everywhere. Starting in 1.0.1, first-run drift is resolved from a trustworthy prior baseline or an explicit ownership choice rather than being guessed. The tarball ships `src/` now, because a fork needs a source.
- **`upgrade --check` reports what it can actually do.** Exit 10 now means portable work exists, 11 means the app edited package-owned files and nothing is portable, 0 means nothing to do. App-owned manual-merge files no longer force a 10, which is what made `sync-extras` auto-run a no-op upgrade on every install.
- **`LeoIcon`, `MessageScroller`, and `AiThinkingSurface` ship from the package, so fixes to them reach you.** All three lived in the app tree, which meant `upgrade` had to overwrite them in your repo to deliver a change — and `message-scroller.tsx` existed twice, byte-identical in both trees, one edit away from two behaviours. They are now `@exxatdesignux/ui/components/leo-icon`, `/components/message-scroller`, and `/components/ai-thinking-surface`, and the files in your `components/ui/` are one-line re-exports. Existing `@/components/ui/leo-icon` imports keep working; nothing in your app has to change. `upgrade` now overwrites 33 files rather than 36.
- **`exxat-ui upgrade` writes a bounded set instead of 534 files, and only framework wiring can overwrite.** The port list was the union of the groups that make the *starter* compile, so shipping a shell fix meant writing every demo hub, page, and mock module into the consumer's repo, then reporting the ones it had just replaced. It now writes three sets deliberately: **framework wiring** (product identity, routing, scope, shell layout, switcher chrome) is ported because an app on an older copy gates the wrong products; **seams** are import-closed re-export shims and generic slot fills created only when missing; product-specific shell wiring remains reference; everything else is left alone at every version. New `upgrade --only <path>` fetches one reference file on request, with a backup and a report of any `@/` imports the app does not have yet.
- **If you scaffolded on 0.10.2 or earlier and never customised the library or columns demos, refresh three of them.** 0.11.0 made `HubTableHandle` generic, and stale copies of `components/library-table.tsx`, `components/columns-showcase.tsx`, and `components/columns-client.tsx` annotate the old shape, so they fail `tsc` after upgrading. `exxat-ui upgrade --only <path>` on each takes the current version. 58 other reference files in the same app compiled fine, which is why they stay yours rather than being ported: their import closure reaches `page-header.tsx`, `templates/list-page.tsx`, and `lib/mock/library.ts`, and overwriting a consumer's page header to deliver a table fix is the failure this release exists to end. The upgrade-path gate now applies that remedy itself and fails if it does not restore a clean typecheck.

### Upgrading

A major version, and still a short list. Nothing was removed, so an app that
upgrades and changes nothing keeps working; each item below is something you
gain by doing, not something that breaks by waiting.

1. **Delete the retired shell files under `components/sidebar/`.** `upgrade`
   names each one it still finds. A local copy is neither overwritten nor an
   error, so nothing breaks if you keep it — it just goes on rendering your old
   sidebar instead of the one in this release. Keep the drill-in panel bodies you
   own and register them through the `drillInPanels` slot.
2. **Only if you scaffolded on 0.10.2 or earlier**, refresh three reference files
   you have probably never touched: `components/library-table.tsx`,
   `components/columns-showcase.tsx`, `components/columns-client.tsx`. 0.11.0
   made `HubTableHandle` generic and stale copies annotate the old shape, so they
   fail `tsc`. Run `exxat-ui upgrade --only <path>` on each. Coming from 0.11.0
   there is nothing to do here — the upgrade-path gate scaffolds an 0.11.0 app,
   installs this release over it, and typechecks it clean with no refreshes.
3. **Move your nav rows onto specs when convenient:**
   `npx exxat-ui codemod nav-specs --dry-run`. JSX icons still render through
   `navFromJsx()`, which reads the class name back off the node — reliable for a
   bare `<i>` and a grey-circle fallback for anything composed. `navFromJsx()` is
   supported through 1.x and goes away in 2.0.
4. **Declare the package files you have forked**, with `exxat-ui eject <path>`.
   From 1.0.1 onward, unknown first-run drift requires an explicit choice:
   `--declare-existing-owned` preserves it, while `--force` takes package copies
   after writing backups.
