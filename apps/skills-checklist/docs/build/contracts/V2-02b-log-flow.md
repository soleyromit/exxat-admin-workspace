# V2-02b Log skills: pick, confirm setting, self-rate (scenario step 5)

**Status:** Stage 2 contract. Narrows `00-cross-cutting.md` and `V2-02a`. Tags: `[REQ]`, `[OD-n]`, `[PROPOSED]`, `[INFER]`.

```
Surface:              Log one or more skills in four short steps: pick skills, confirm where it happened, rate yourself on the
                      skill's own levels, review and save. Route /v2/student/pick-and-rate.        Wave: V2 Stage 2
Persona(s) & role:    Maya Ferreira on a phone, between tasks, possibly with no signal, signed out or with an update pending.
Scope / data seen:    The published, configured skills of the program (mapped skills first), Maya's placements for NURS 350,
                      her evaluations, lab check-offs and practice trials (for prerequisites).
Job-to-be-done:       Record what she performed, with the context the program needs, in under a minute, without losing it.
Why -> So what:       "Lost entries" is a top complaint about the current mobile app. Every entry is saved to the device
                      first (the sync queue), the draft survives a reload, and nothing waits for the network.
Requirements:         ST-04 (several skills together), ST-05 (clinical or lab or simulation recorded), ST-06 (clinical setting
                      derived from the placement; single option inferred; several options chosen from), ST-07 (no placement:
                      the program's full list), ST-10 (required details enforced before saving), ST-11 (self-evaluation on the
                      same criteria the evaluator uses), ST-12 (at most one narrative note, kept apart from the evaluator's),
                      ST-13 (confirmation of what was saved), SC-08 (levels are the program's own names, never hard-coded),
                      SC-11 and SC-12 (named settings; lab and simulation never satisfy them), IM-09 (unconfigured skills
                      cannot be logged against), ST-02 (a published skill not mapped to NURS 350 can still be logged, CM-05)
Open decisions hit:   OD-07 (setting once per submission or per skill): this flow asks once for the whole log and shows it on
                      each entry. Not decided; the reading is [INFER]. SC-15 (self-evaluation toggle) is not built in Stage 1,
                      so a rating is asked wherever the skill has a scale. [PROPOSED] Prerequisite gating copy and the
                      practice-trial rule (a lab or simulation entry is a practice trial and is not sent for sign-off).
Prototype reference:  v1 S-13 send dialog (field set only). None for v2 layout.
Pattern:              Four-step flow on one route with Back and Continue, a step label ("Step 2 of 4") and one primary per step.
                      Reference: ux/07 S-13, mobbin-evidence "Job type 5" (log sheet, recents, one primary).
DS mapping:           PageHeader, Card, Checkbox, RadioGroup, RadioGroupItem, Textarea, Field, FieldLabel, FieldDescription,
                      FieldError, Button, Badge, StatusBadge, LocalBanner, Label, Input -> IMPORT. Mobile skill card and
                      sticky action bar: composed (new-components-needed.md). Hand-rolls: none.
States:               L  Seed first, saved state and saved draft after mount.
                      E  No skill is open: "No skills are open to log yet" with the reason.
                      Er Save refused by the store (skill not in use, locked prerequisite, missing field): LocalBanner error
                         that says what happened and what to do. Device full or blocked storage: entries stay in memory and
                         the banner says "Not saved to this phone".
                      V  Inline FieldError per field: no skill picked, no setting, rating missing, location missing.
                      S  Saving shows the entry list with a sync chip each (Queued or Synced).
                      Su "2 entries saved" with next actions "Ask for sign-off" and "Log more skills".
                      D  A skill that is not open has a disabled checkbox with the reason beside it.
                      P  Draft: every edit is saved in the store (not audited); returning shows "Draft restored".
                      Bl  Clinical setting with a locked prerequisite blocks Continue and says why and what to do.
Edge cases:           Placement offers one setting: preselected and read-only wording "From your placement". Two placements:
                      the first is preselected, the other is one tap away. No placement: the program's list plus a free
                      location. A skill with no rating scale (scored without an overall rating) skips the rating. Picking a
                      skill twice is impossible (checkbox). Offline, signed out or update pending: identical behaviour, the
                      entry is queued. Prerequisite rule: ALL configured items must hold (lab check-off, N practice trials,
                      each prerequisite skill met); this is the Stage 1 wording, read as "and".
Copy:                 Steps: "Pick skills", "Where did you do it?", "Rate yourself", "Review and save". Errors: "Pick at
                      least one skill to log." "Rate yourself on IV catheter insertion, or remove it from this log." Blocked:
                      "IV catheter insertion cannot be logged in a clinical setting yet. Log 1 more practice trial in the lab
                      or simulation first." Buttons: "Continue to setting", "Continue to rating", "Review", "Save 2
                      entries", "Back", "Ask for sign-off", "Log more skills".
A11y:                 Each step is a labelled region with a heading and focus moves to it on Continue. Radio groups have
                      accessible names that include the skill. Errors are linked with aria-describedby and announced. Touch
                      targets 44 px. No colour-only state.
Out of scope:         Picking an evaluator (step 6). Editing a saved entry (only a conflict resolution can change one in v2).
                      Photo attachments on a log entry.
Acceptance tests:     1. prerequisiteStatus: all of lab check-off, practice trials and prerequisite skills are required and each
                      unmet item names what to do (tests/v2/student.test.ts).
                      2. logEntries refuses: no skills, unconfigured or unpublished skill, clinical with a locked prerequisite,
                      missing rating, unknown level (not one of the skill's levels), missing location.
                      3. A saved entry creates one sync item per entry, an audit entry, and is Synced when online and signed
                      in, Queued when offline or signed out (tests/v2/sync.test.ts).
                      4. Browser: pick IV catheter insertion and Sterile dressing change, confirm setting, rate with the
                      program's level names, save; both appear in the store; reload keeps them; Reset demo removes them.
Risks / unknowns:     (1) Self-rating for a question model is Yes or No per question; scored skills have no scale in the Stage
                      1 config, so they skip the rating. (2) The draft lives in the store and is not shared across devices.
Vault notes consulted:Same as V2-02a.
```
