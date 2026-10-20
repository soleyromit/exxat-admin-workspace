# V2-02c Request sign-off, four ways (scenario step 6)

**Status:** Stage 2 contract. Narrows `00-cross-cutting.md` and `V2-02a`. Tags: `[REQ]`, `[OD-n]`, `[PROPOSED]`, `[INFER]`.

```
Surface:              Ask for sign-off on logged skills by QR code, by handing over the phone, by a link, or by a photo of a
                      signed paper form. Route /v2/student/request-signoff.                         Wave: V2 Stage 2
Persona(s) & role:    Maya Ferreira, with J. Delgado, RN (preceptor, no account) beside her or elsewhere. Preceptors have no
                      login (hard stop): every method reaches an evaluator without an account.
Scope / data seen:    Maya's clinical log entries that have no request yet, the evaluators on record with their credentials,
                      each skill's configured roles and qualification rule, her existing requests.
Job-to-be-done:       Get her logged skills in front of a qualified evaluator with the fewest decisions, whatever the situation
                      (evaluator present, evaluator elsewhere, paper form already signed).
Why -> So what:       Exxat FAQ gaps made visible: sign-off is one at a time, a log can go to only one preceptor, preceptors
                      have no read-only view. Here one request carries several skills, a link request can go to several
                      qualified evaluators at once, and the preceptor view needs no account. Missing bulk actions and lost
                      requests are top complaints, so every request is stored on the device first and shows its sync state.
Requirements:         ST-08 (evaluator role constrained by setting and by the roles the skill permits; told why when no valid
                      combination), ST-09 (pick the evaluator from those on record), ST-10, ST-13 (confirmation: what, to
                      whom, in what role, setting and location), ST-04 (several skills together), EV-01 (completable without
                      a login; the request opens directly), EV-02 (more than one kind of evaluator; valid roles depend on
                      where it happened), EV-05 (several skills in one sitting), AR-01 (a paper submission appears in the
                      review queue with student, skill, setting, evaluator), RV-05 (a request awaiting approval is not
                      edited or resent), SC-16 (who may sign off), SC-12 (lab evidence never satisfies a named setting)
Open decisions hit:   OD-18 (link lifecycle) not decided: no expiry text is shown. OD-17 (evaluator never sees achievement
                      status) kept: the evaluator link carries the request id only. OD-19 untouched. [PROPOSED] QR code, hand
                      over the phone (handover mode), one link to several evaluators (first to finish completes it), photo
                      of a signed paper form to the review queue. Hard stop D2 labels these proposals; they are not requirements.
Prototype reference:  None for v2. The QR encodes the v2 preceptor link /v2/preceptor/preceptor-evaluation?request=<id>, the
                      Stage 3 route.
Pattern:              One page: skills to send, a four-tile method chooser, the method panel, and a list of her requests.
                      Reference: ux/07 S-13, S-18; mobbin-evidence "Job type 5".
DS mapping:           Card, Checkbox, RadioGroup, SelectionTileGrid (method), Button, Badge, StatusBadge, LocalBanner, Dialog
                      (QR), Sheet size full (handover), Input (read-only link), Label, Field -> IMPORT. QR code display (SVG from
                      lib/v2/qr.ts, a small dependency-free generator, no new package), evaluator picker row, handover mode:
                      composed (new-components-needed.md). File chooser: native file input behind a DS Button (existing
                      registered hand-roll, item 18). Hand-rolls: QR matrix generator (no DS equivalent, no dependency).
States:               L  Seed first, saved state after mount.
                      E  No unrequested entries: "Nothing to send yet" with a link to log a skill. No qualified evaluator:
                         ST-08 message naming the skill and the failed requirement.
                      Er Photo not an image, over 10 MB or unreadable: "That file is a PDF. Choose a photo (JPG, PNG, HEIC or
                         WebP) under 10 MB." Clipboard blocked: the link is shown selected for manual copy. Store refusal
                         (evaluator no longer qualified, entry already requested): LocalBanner error.
                      V  Method needs an evaluator; link needs at least one; photo needs a photo and the signer.
                      S  Creating a request: the entries leave the list, the request appears under "Your requests".
                      Su "Request sent to J. Delgado, RN for IV catheter insertion and Sterile dressing change."
                      D  Unqualified evaluators are disabled and the reason is shown beside them, never a bare grey control.
                      P  Offline: "Saved on this phone. It is sent when you are online." The request shows Queued and the QR
                         and link say they work once it is sent. Handover works offline (the phone is the channel).
                      Bl  A skill whose roles allow nobody on record: "No evaluator on record can sign off X. Ask your program
                         to add one."
Edge cases:           QR and handover take exactly one evaluator; link takes one or more; photo takes the person who signed
                      the paper form. Evaluators are shown only if qualified for EVERY selected skill. Lab instructors are
                      disabled for clinical entries ("Lab instructors sign off in the lab"). A lab or simulation entry is a
                      practice trial and is not listed here. An entry already in a request cannot be sent again (RV-05).
                      Two methods for the same entries are impossible (the entries leave the list). A request in conflict is
                      held until resolved (see V2-02d).
Copy:                 Method tiles: "QR code", "Hand over phone", "Link", "Photo of paper form". Buttons: "Create request and
                      show QR code", "Create request and hand over phone", "Create request and copy link", "Send photo for
                      review". Handover: "Hand your phone to J. Delgado, RN", "Give the phone back to Maya". Photo: "Choose a
                      photo", "Take a photo", "Remove photo". Reasons: "Needs RN credential (has LPN)", "Needs 2 or more
                      years of practice (has 1)".
A11y:                 Method tiles are a radio group. Disabled evaluator reasons are linked with aria-describedby. The QR has
                      role=img with a text name and a text link beside it, plus Copy link, for people who cannot scan. Handover
                      is a full-screen dialog with focus trapped, large targets (at least 56 px) and a clear way back. Photo
                      preview has alt text. Targets 44 px. Status is text plus icon.
Out of scope:         The preceptor form itself (Stage 3). Reminders and escalation (requirements section 14). Link expiry
                      (OD-18). Naming a lab instructor not on record (ST-09 second half). Server delivery: the prototype writes
                      to the shared store only.
Acceptance tests:     1. evaluatorChoices: qualified and unqualified evaluators for one and for two skills, with reasons;
                      lab instructors disabled for clinical; faculty listed only when qualified; nobody qualifies is detected
                      (tests/v2/student.test.ts).
                      2. createRequest for each method: qr, handover, link (one and several evaluators), photo; ties the request
                      to both skills and all entries, refuses unqualified evaluators, already requested entries, photo with a
                      non-image, QR or handover with two evaluators; photo goes to awaiting-review assigned to the reviewer;
                      others to with-evaluator; offline gives on-device until synced.
                      3. qr.ts: finder and timing patterns, format information BCH, Reed-Solomon syndromes zero, decoded
                      text equals the input for a short and a long URL (tests/v2/qr.test.ts).
                      4. Browser: four requests created in turn; counters on the preceptor and reviewer pages change; the QR
                      dialog shows a link equal to the encoded text; handover opens, hands over and returns.
Risks / unknowns:     (1) "First evaluator to finish completes it" for a multi-evaluator link is a proposal; Stage 3 must honour
                      it. (2) The QR cannot be scanned inside the automated run; the encoder is verified by an independent
                      decoder in tests and by matching a reference implementation once, outside the repo.
Vault notes consulted:Same as V2-02a.
```
