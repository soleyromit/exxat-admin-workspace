# Design contract — S-18 Evaluation-request email (text layout)

**Status: CONFIRMED by Romit, 2026-10-08.** Confirmation covers this contract as written: `[INFER]` items are accepted proposals and every `OD-*` stays OPEN, built as its named seam.
**Surface:** S-18 · **Flow:** F-06 → F-07 (sent when the student sends in S-13; resent via F-09/RV-04) · **Wave:** W3 · **Patterns:** P-17; copy `ux/09 §5 S-18` and `§6`.
This is a **text-layout contract**. It specifies content, structure and behaviour. It does not specify mail infrastructure; where infrastructure matters it is written as a question.

## 1. Surface and wave

Design contract — S-18 Evaluation-request email (text layout). Wave: W3 (docs/build/01-build-plan.md §4). Derived from the contract title; no separate surface label was drafted.

## 2. Persona and RBAC

| Item | Value | Source |
|---|---|---|
| Recipients | P-P preceptor (no login), P-F clinical faculty, P-L lab instructor (not a Prism user) | `[REQ EV-02, SL-08]` |
| Sender | The product on behalf of the program, because the **student** chose the evaluator and triggered the request | `[CALL 03-05]` student-initiated; `[REQ ST-09]` |
| RBAC row | Clinical Site / Preceptor: verify and submit via tokenised email links; no curriculum, no analytics, no password wall | `[exxat-domain-context RBAC]` |
| Email reveals | Student name, course, skills requested, performed-in context (clinical setting and location, or lab or simulation), the role they are asked to act in, the link | `[REQ EV-04, ST-13]` |
| Never reveals | Student progress, scores, achievement status, other students, other evaluators, program-internal notes (OD-17 default) | `[INFER]` |

## 3. Scope and data seen

Covered in §2 (Persona and RBAC) and §5.

## 4. Job to be done and why

- **JTBD:** *When a student asks me to evaluate skills they performed with me, I want an email that tells me who, what and where in a few lines and opens one form, so I can act without logging in or guessing whether the message is legitimate.* `[REQ EV-01]`
- **Why:** The email is the only entry point for people with no Prism login `[REQ EV-01]`. If it is unclear, long or untrustworthy, the request stalls.
- **So what:** A clear, calm message increases completion without reminders (reminders are out of scope `[REQ §14]`); including the role and place helps a busy preceptor recognise the request instantly.

## 5. Requirements and open decisions

**Requirements.**
| ID | How S-18 satisfies it |
|---|---|
| EV-01 | One link opens the evaluation directly; copy states that no sign-in is needed and no account is created |
| EV-02 | The email states the role the recipient is asked to act in (preceptor, clinical faculty or lab instructor) |
| EV-05 | One email per request lists all skills in the request; one link; the form completes them in one sitting |
| ST-09 | Recipient is chosen by the student from recorded evaluators, or a lab instructor named by the student with an email so the request can reach them |
| SL-08 | A lab instructor needs only a name and an email to be reachable |
| SL-09 | Names the student typed (misspelt or new) do not change what the email says about the role; the admin adopts the person into the roster separately |
| RV-04 | A revised or further attempt may go to a different evaluator and triggers a new email to that person |
| ST-13 | The student's confirmation (what, to whom, role, setting, location) is a separate surface (S-13/S-14); the email must carry the same facts so both agree |
| SC-16 | Email is only sent to a role the skill permits (enforced before sending, `ST-08`) |
| AR-06 / AE-01 | The email never states that evidence counts; counting is explained on S-16 after submit |

**Open decisions and seams.**
| OD | Seam | Default |
|---|---|---|
| OD-18 link lifecycle | A single optional line in the template, `{validity text}`, empty until decided | No validity statement |
| OD-17 achievement disclosure | The template has no data field for status or progress | None |
| OD-06 roles | Role label read from role data; a fourth role needs no template change | Three roles |
| OD-05 external evaluators | Recipient fields (name, email, role) come from an evaluator record whose owner (Skills vs Prism-wide) is undecided | Same fields either way |
| OD-16 return target | The email for a corrected submission uses the same template; whether a returned item re-sends to the same evaluator is S-13/S-14's decision | Same template |
| OD-24 | If a skill is deactivated before the evaluator opens the link | Undefined; no copy invented |

## 6. Prototype reference (keep / do not copy)

Screens: `docs/source/screens/23-preceptor-form.png` shows only the "Evaluations sent" mailbox simulation; **no email is rendered in the prototype**. The prototype says "Preceptors receive a delegator link by email. Faculty and lab instructors can open the same form in Prism."
**Keep:** one request lists several skills; the requested date; the role in brackets.
**Do not copy:** the in-app "Evaluations sent" list as if it were the email; QR codes `[CALL 09-23, not in REQ]`; any progress or status.

## 7. Pattern and reference hub

Not applicable: an email, no route or component hub.

## 8. DS mapping (proposal; final verdict: ds-adoption-reviewer)

Email is outside the web DS. The DS tokens and typography guide the HTML email's colours and type (a single brand colour for the button, system-safe font stack), but there is no DS email component. Whether the product has an existing email template system (workspace or Prism) is an open question for engineering; **no mail library, provider or sender domain is chosen here**.

## 9. Layout, content and behaviour

**Layout and content (final copy source: `docs/ux/09 §5 S-18`).**
```
From:     {Program name} via Prism <sender address TBD by infrastructure owner>
To:       {Evaluator email}
Subject:  {Student name} has asked you to evaluate {n} skill(s)

Hello {Evaluator name},

{Student name} ({course code}, {program name}) has asked you to evaluate
{n} skill(s) they performed:

  - {Skill 1}
  - {Skill 2}

Where: {Clinical (setting) at location | Lab or simulation}
You are asked to complete this as: {Preceptor | Clinical faculty | Lab instructor}

Open the evaluation:
[ Open evaluation ]
{full URL as plain text}

What to expect
- The link opens the evaluation directly. You do not need to sign in and no account is created.
- The form shows what {Program name} has set up for each skill. You only record your assessment.
{- Validity line, only when OD-18 is decided}

After you submit
- Your answers are recorded for {Student name}.
- {Program name} may review an evaluation before it counts.

If you are not the right person to evaluate {Student name}, please let them know so they can send the request to someone else.

Thank you,
{Program name} via Prism
```
Rules:
- Subject uses the count so a multi-skill request is not mistaken for several (`ux/07` improvement) and follows `ux/09`'s wording "has asked you to evaluate".
- Plain-text part is a first-class alternative; HTML part uses the same words, one button, the URL repeated as text, no images required to understand it.
- Body length target: readable without scrolling on a phone; one action only.
- No attachments, no tracking pixels that change content, no marketing, no social links.
- "About {estimate} minutes" is omitted until measured in research `[ux/12]`.
- No promise of a decline link exists; the line about telling the student reflects `RV-04` only.
- Professional register, sentence case, no em-dashes, no colloquialisms, no internal notes `[workspace memory]`.

**Deliverability and trust (questions only, no decisions).**
| # | Question | Owner to ask |
|---|---|---|
| E-1 | Which sender address and domain, and does the program name appear in the display name? | Platform/email owner |
| E-2 | Is SPF/DKIM/DMARC already configured for the sending domain used by Prism notifications? | Platform |
| E-3 | Is there an existing email template system and notification service in Prism to reuse? | Platform / FAST team |
| E-4 | What happens on a hard bounce, and who is told? | Product (Sankalp); links to SH-02 "waiting, with whom" |
| E-5 | Are link-scanning gateways expected (hospital mail systems) and does prefetch consume a single-use token? | Security (cross-cutting L-10) |
| E-6 | Should the email include a way to verify legitimacy (program name, student name, course) without extra links? | Design / security |
| E-7 | Is there a locale and time-zone expectation for dates in the email? | Product |
| E-8 | Is the evaluator's email address shown to the student after sending, or only the name and role? | Privacy (FERPA) |

## 10. States (L E Er V S Su D P Bl)

| State | Applies | Behaviour |
|---|---|---|
| **L / S** | Sending | Triggered after S-13 "Send request" succeeds; S-13 shows its own sending state; the email is queued, not user-visible |
| **E** | n/a | A request always has at least one skill |
| **Er** Undelivered (bounce, wrong address) | Yes, undefined | REQ has no bounce handling and reminders/escalation are out of scope `[REQ §14]`. Question: does the student see "could not be delivered" on S-14 (SH-02 requires "waiting, identifying who it is with")? Do not invent copy |
| **V** Address validation | At send | Unlisted lab instructor requires a syntactically valid email (`ST-09`); message on S-13, not in the email |
| **Su** Delivered | Yes | Student's S-14 shows "waiting" with the evaluator's name and role (`SH-02`) |
| **D** n/a | — | — |
| **P** Partial | Multi-skill | One email covers all skills; partial answers are an S-16 concern |
| **Bl** Blocked | Pre-send | No email when ST-08 finds no valid role and setting combination; the student is told why on S-13 |
| Resend | RV-04 | A new email is sent to the (possibly different) evaluator; whether the previous link stops working is OD-18 / L-3 |
| Not opened | n/a | No reminder is sent (out of scope); the student sees "waiting" |

## 11. Edge cases

Evaluator is a lab instructor named by the student with a misspelt name; same evaluator receives several requests from the same student (separate emails or batched is undefined; default separate per request); evaluator forwards the message; shared mailbox; email client strips the button (plain URL is the fallback); very long skill names or many skills (list truncation rule needed: show all up to a stated cap and then "and {k} more" `[INFER]`); non-ASCII names; evaluator's name unknown (greeting "Hello," without a name); a student with the same name as another; the course has no code.

## 12. Copy and interactions

Copy is owned by docs/ux/09 (section for S-18); this contract adds no further copy rules.

## 13. Accessibility (WCAG 2.1 AA)

Real text, not an image of text; button has descriptive text "Open evaluation" and the URL is repeated; contrast of the button at least 4.5:1; heading structure minimal; language set in the HTML part; reading order matches visual order; plain-text alternative included; no information only by colour; works at 320px width; dark-mode safe (no hard-coded white backgrounds that clash).

## 14. Out of scope

Reminders, escalation, notifications for incomplete evaluations `[REQ §14]`; QR codes; confirmation email back to the evaluator or student (not required; the student sees status in S-14); marketing content; attachments; calendar invites; SMS; email authoring UI for admins (templates are not configurable in REQ).

## 15. Acceptance tests (Given / When / Then)

| # | REQ | Test |
|---|---|---|
| AT-1 | EV-01 | Given a sent request, when the evaluator clicks the button in a mail client with no session, then S-16 opens directly with no sign-in and no account is created |
| AT-2 | EV-01 | Given the email, when inspected, then it states that no sign-in is needed and no account is created |
| AT-3 | EV-02 | Given requests for each of the three roles, when the emails render, then each states the correct role |
| AT-4 | EV-05 | Given a request with three skills, when sent, then exactly one email is sent listing all three with one link |
| AT-5 | ST-09, SL-08 | Given a lab instructor named by the student with name and email only, when sent, then the email reaches that address and renders with the entered name |
| AT-6 | RV-04 | Given a returned submission re-sent to a different evaluator, when sent, then the new evaluator receives a new email and the content matches the new request |
| AT-7 | ST-13 | Given the student's confirmation and the email, when compared, then student, skills, role, setting and location agree |
| AT-8 | OD-17 | Given any request, when the email body is searched, then it contains no score, count, progress or achievement status |
| AT-9 | SC-16 / ST-08 | Given a skill that permits only lab instructors, when a student tries to send it to a preceptor, then no email is created |
| AT-10 | §14 | Given an unopened request after any period, when time passes, then no reminder email is sent |
| AT-11 | a11y | Given the HTML and plain-text parts, when rendered at 320px and read by a screen reader, then the order, the button text and the URL fallback are correct |
| AT-12 | OD-18 | Given OD-18 undecided, when the email renders, then no validity or expiry sentence appears |
| AT-13 | SL-09 | Given a student-named lab instructor with a supplied email, When the request is sent, Then the email goes to that address and states no roster status. |
| AT-14 | AR-06, AE-01 | Given an evaluation that will be held for approval, When the email is read, Then it states only that the program may review before it counts and never states progress or achievement (see OD-17). |

## 16. Risks and unknowns (max 3)

1. **Delivery to hospital mail systems** (filters, link scanners) may silently block or consume links; undefined in REQ.
2. **Trust:** a link-only email from an unknown sender looks like phishing; E-1/E-6 need answers before launch.
3. **Copy divergence:** `ux/07` and `ux/09` carry two versions of the email text; if both are used the template drifts.

## 17. Vault notes consulted

- `…/Transcripts/exxat/2026-09-23-skills-checklist-with-sankalp.md` (raw): delegator links unique; QR codes mentioned; lab instructors given a free email; FAST forms.
- `…/Meetings/exam-management/2026-03-05-day-4-marriott-meeting-skills-checklist-and-learning-contract.md`: evaluations sent to whoever worked with the student that day.
- `docs/ux/07 S-18`, `09 §5 S-18`, `ux/03 §2.3`, `docs/strategy/05, 06, 07`, `journeys/03`; `_Insights.md` entries for the two meetings only. No Mobbin references (Mobbin not authenticated in this session).

## 18. Open questions for Romit

None.

## 19. Contradictions found / review log

**Review log.**
| Reviewer | Verdict | Date |
|---|---|---|
| ds-adoption-reviewer | not applicable (no DS surface) | — |
| skills-requirements-auditor | not yet run | — |
| skills-ux-critic | not yet run | — |
| Romit confirmation | pending | — |

**Contradictions found while drafting.**
1. `ux/07 S-18` subject "asks you to evaluate {n} clinical skill(s)" and `ux/09` "has asked you to evaluate {n} skill(s)"; the `07` body also puts setting in a sentence while `09` uses a "Where:" line and adds a "What to expect" block; this contract follows `09`.
2. `ux/07` says "Mobile-first rendering is the default for email" (an assumption); REQ is silent.
3. `ux/07` includes a validity placeholder `{OD-18: link validity text}`; `ux/09` omits it; this contract keeps it as an empty optional line.
4. `ux/03 §9` lists S-18 as a surface "receives" for all three evaluator roles without covering the email sent to a student's evaluator when the student is also the requester of a resend (no extra recipient is designed).

**Deviations from the cross-cutting contract.**
Section 7 (DS mapping) is not applicable; accessibility rules are adapted for email.

## 20. What was not verified

Any rendering in real mail clients; deliverability; the existence of a Prism email template system; legal and privacy review of student names in subject lines.
