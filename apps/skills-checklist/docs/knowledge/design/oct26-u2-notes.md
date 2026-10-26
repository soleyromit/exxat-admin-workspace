# U2 notes: Oct 26 call items 6, 7, 12, 21 (library, add, import, starting points, settings)

**Source:** `granola-2026-10-26-updates.md` items 6, 7, 12, 21 `[CALL 10-26]`. Existing screens and variants updated; no new screens or variants.

## Item 6: import is phase 2; manual add and the one-time bulk add are phase 1
- Library A, B, C (shared `library-chrome.tsx`): "Add a skill" stays the one filled primary. More menu order: "Add several by name (bulk add)", "Start a new list", separator, "Import a file" (Later badge), "Copy from a starter library" (Later badge). "Start a new list for a new standard" became "Start a new list" (item 12: standards live elsewhere).
- Library A and B now open the add-several sheet in place (as C already did), so the phase 1 bulk path never routes into the phase 2 import screen. No href changed.
- Empty library: "Add a skill", "Add several by name" (outline), then "Import a file" (ghost, Later badge). Body: "Add one skill at a time, or several by name at once."
- Add several sheet (Add a skill C, and the sheet in A and B): description "For a one-time bulk add by the school or the implementation team."
- Import A, B, C and Starting points A, B: a "Later" badge beside the title (`LaterTitle`, keeps the DS h1 and title type). The one-line note "Import and AI reading arrive in a later phase" was tried as the subtitle first: it put import A at 34 of 30 words and C at 35 of 30 (wizard budget), so the badge fallback applies. Starting points already used its 11-word subtitle, so the note would also have broken the 12-word subtitle limit.
- Nothing was removed: every phase 2 route stays reachable.

## Item 7: the program names the item
- Settings A: a "Naming" tab after Lab instructors. Settings B: a "Naming" row after Lab instructors in the lists pane; the form spans the entries and detail panes. Placed last so Categories stays the default landing and existing `?tab=` / `?list=` links keep working.
- Form: heading "What do you call these?", one section line "Every screen uses these words, for every role.", fields "For one" and "For more than one" (defaults skill, skills), example chips skill, competency, EPA (one click fills both), one filled primary "Save names", success LocalBanner.
- `lib/lab/terms.ts`: `setTerms` now keeps the noun in the lab session (sessionStorage `lab:terms`) and notifies subscribers; `loadStoredTerms` reads it once after mount; `aNoun()` picks "a" or "an" ("an EPA"). Server render always uses the default noun, so hydration never mismatches. Client hook: `components/lab/library/use-terms.ts`.
- Live: the library title follows the noun at once and after reload. The admin nav row follows it on the next client URL change (verified: "Dashboard | EPAs | Approvals | Attainment" after a tab change). It does NOT follow on the save itself or on a hard reload, because `lab-frame.tsx` (B4) memoises the nav on `[approvals, link]`. Fix for B4, in `makeData().useNav`: call `useTerms()` and add it to the memo deps. Screens that call `skillNoun()` without the hook update on the next navigation, not on a hard reload; a `key={terms.skillNounPlural}` boundary in `LabProviders` would cover every screen.

## Item 12: nothing for standards in Settings. Item 21: left nav unchanged
- Admin nav on every changed screen and variant reads "Dashboard | Skills | Approvals | Attainment" (Playwright, 16 cases).

## Open
- Add a skill A fails the density budget on controls (13 of 8) as a split page. None of the 13 controls is new (tabs, search, More, Add a skill, view, and the add sheet's 4 fields and 4 buttons); the split classification for this variant is new today. Needs a call: count it as a form over the page (passed before at 7 fields), or cut the sheet (for example drop Close, defer tags).
- Many screens hard-code "a " before the noun ("Add a EPA"). `aNoun()` exists; only the library chrome uses it so far.
