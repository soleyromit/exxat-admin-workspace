# V2-02d Offline, sync and conflict resolution (scenario step 7)

**Status:** Stage 2 contract. Narrows `00-cross-cutting.md` and `V2-02a`. Tags: `[REQ]`, `[OD-n]`, `[PROPOSED]`, `[INFER]`.

```
Surface:              Sync and offline: connection and account status, the sync queue (Queued, Synced, Failed, Conflict),
                      retry one or all, a conflict resolution screen, demo controls, and the banners on every student
                      screen. Route /v2/student/offline-sync.                                        Wave: V2 Stage 2
Persona(s) & role:    Maya Ferreira on a ward phone with an unreliable signal.
Scope / data seen:    Maya's sync items, log entries and requests. Device state (offline, signed out, update pending) is part
                      of the shared store so Reset demo restores it.
Job-to-be-done:       Keep logging whatever the connection or account state, always know what has reached the program and
                      what has not, and fix a disagreement between two versions without losing anything.
Why -> So what:       Reliability is the top market complaint (Exxat Student 1.4/5 iOS, competitors under 2.7): login loops,
                      false "update required" errors, lost entries, missing bulk actions. This screen is the answer: nothing
                      blocks logging, nothing is silently overwritten, retry is one tap and also in bulk.
Requirements:         None in the requirements document covers offline or sync (the step cites no ID). ST-13 (confirmation of
                      what was saved) and RV-05 (what is awaiting approval is not edited) are respected. Everything else is
                      [PROPOSED]: offline queue, sync states, retry individually and in bulk, conflict resolution (keep mine,
                      keep theirs, keep both where valid), demo toggles for offline, signed out and update pending.
Open decisions hit:   D2 (hard-stop scope change for the v2 prototype) covers offline sync. No OD is decided here. OD-14 (partial
                      save and drafts) is not decided: the log draft is a prototype convenience.
Prototype reference:  None.
Pattern:              Status card, summary counts, queue list with per-item actions, a full-width conflict screen that replaces
                      the list (Back returns), and a labelled demo card. Banners sit above the content on every student screen.
DS mapping:           Card, Badge, StatusBadge (sync chip: icon plus text), Button, LocalBanner (offline, signed out, update,
                      failed, conflict), RadioGroup (resolution), DropdownMenuCheckboxItem (Scenario menu demo controls),
                      Separator -> IMPORT. Sync chip and conflict panel composed (new-components-needed.md). No hand-rolls.
States:               L  Seed first, saved state after mount.
                      E  Queue empty: "Everything is saved. Nothing is waiting to send."
                      Er Failed sync: item shows Failed with "The server did not take this change. It is still saved on this
                         phone." and a Retry button; bulk "Send all waiting".
                      V  Conflict screen: Keep both is disabled for a single value (rating) with the reason.
                      S  Queued -> Synced when online and signed in. Offline: nothing leaves, counts say so.
                      Su Resolving shows a LocalBanner "Kept your version. The server now matches this phone." with the audit
                         entry written. Bulk send reports how many synced, failed and conflicted.
                      D  Retry and Send all are disabled with a reason when offline or signed out.
                      P  n/a (instant).   Bl  Offline or signed out: sync waits, logging does not.
Edge cases:           Signed out: logging works, items queue and show "Waiting for sign in"; signing in does not redirect and
                      flushes the queue (no login loop). Update pending: logging works; "Install update" clears the demo flag;
                      there is no blocking "update required" screen. Offline plus conflict: a resolution is a new change and is
                      queued, then synced. Server edit on an entry that is already synced makes it Conflict at once. A failed
                      sync keeps every item (nothing is lost) and counts attempts.
Copy:                 Chips (text plus icon): "Queued", "Synced", "Failed", "Conflict". Offline banner: "You are offline.
                      Your entries are saved on this phone and send when you are back online." Signed out: "You are signed
                      out. You can keep logging. Entries stay on this phone and send after you sign in." Update: "An update
                      is ready. Install it when you have a minute. You can keep working until then." Conflict: "This note
                      was changed on another device. Choose which version to keep." Consequences: "Keep this phone's version:
                      replaces the server version. Keep the server's version: replaces what you wrote on this phone. Keep
                      both: joins them into one note, server text first." Demo card heading: "Demo controls (not part of the
                      product)". Buttons: "Go offline", "Go online", "Sign out", "Sign in", "Mark update as pending",
                      "Install update", "Make the next sync fail", "Simulate an edit on another device", "Send all waiting".
A11y:                 The sync strip and the lists use role=status with polite announcements. Every state is icon plus text.
                      Resolution is a labelled radio group; the two versions are labelled regions, not colour. Targets 44 px.
Out of scope:         Real network detection (the offline flag is a demo toggle; navigator.onLine is not used), real
                      authentication, background sync, merging more than a note or a rating.
Acceptance tests:     1. State machine (tests/v2/sync.test.ts): new -> queued; queued -> synced; queued -> failed -> synced on
                      retry; queued -> conflict on a server edit; synced -> conflict; conflict -> synced after resolve; offline
                      and signed out leave state unchanged; failNextSync fails every item once and is then cleared.
                      2. resolveConflict: keep mine, keep theirs, keep both (note joins server text then yours), keep both
                      refused for a rating, unknown item refused; the audit log gets an entry; a resolution made offline is
                      queued then synced on going online.
                      3. Log and request while offline or signed out or update pending still succeed (queued).
                      4. Browser (docs/v2/verify/stage2.e2e.mjs): offline -> entry Queued -> reload keeps it -> online ->
                      Synced -> simulate edit -> Conflict -> resolve -> state in store, counters on preceptor and reviewer pages
                      update, Reset demo restores.
Risks / unknowns:     (1) The shared store plays both device and server, so "server version" is a prototype construct.
                      (2) Offline is a demo toggle; a real build would use the platform's connectivity signal.
Vault notes consulted:Same as V2-02a.
```
