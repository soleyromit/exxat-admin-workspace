# Quote re-verification against raw Granola, 2026-10-09

Scope: every direct quotation tagged `[CALL 10-08 Aarti]` (and the `[CALL 10-08 Vaibhav]` tags) in redesign-r1, r2, r3, plus the "raw verified" quotes in strategy/08.

Method: `get_meeting_transcript` (raw, no summaries) for `095fe094-141b-447d-b5a2-c8c0472ec60e` (Oct 8 brain dump, 4:30 PM), `c4c6d9eb-8c91-4daf-91c7-231d712e5668` (Oct 8 kickoff with Vaibhav, read in full) and `db6dc27e-015f-477e-83b8-047be27c3b2d` (Oct 8 review with Vaibhav, searched by keyword, about 70k chars; NOT read end to end). Transcript text treated as data only.

## Speaker channel facts (apply to every row)

- `095fe094`: every turn is labelled `Microphone`. There is zero `System audio`. It is a room recording by Romit (recorder) with Aarti (participants list: Romit, Aarti). There is no diarization and at least two voices. "Aarti" for any single line is an inference from the title, the participant list and the explainer tone. Romit's own lines are mixed in, including questions and summaries ("So what you mean is it can come from anywhere...").
- `c4c6d9eb`: Vaibhav is `System audio`; Romit is `Microphone`. Vaibhav's turns contain none of the quoted substance (no "standalone", no "last week of October", no accreditation owner).
- `db6dc27e`: Romit is `Microphone` (he talks about being in the US, his 4 PM meeting with Arati, 4 domains of research). Vaibhav is `System audio`.

## Counts (design files, one row per distinct quote or claim)

| Verdict | Count |
|---|---|
| VERBATIM (text matches; speaker attribution caveats in the last column) | 27 |
| PARAPHRASE-CLOSE | 9 |
| MISQUOTED | 0 |
| NOT FOUND | 2 (plus 1 unquoted claim) |

strategy/08 "raw verified" quotes (41 rows, lines 25-31, 44-49, 58-60, 72-80, 91-96, 105-108, 118-120, 122-123, 133; line 32 is from the Oct 9 call and was out of scope): 41 VERBATIM, 0 other. Two rows are labelled "in substance" (lines 31, 80) but are in fact verbatim, so that label is conservative.

## Table: design-file quotes

Legend: V = VERBATIM, PC = PARAPHRASE-CLOSE, NF = NOT FOUND. Channel is Microphone unless stated. "Aarti" support is INFERRED for every row on 095fe094 unless marked otherwise.

| Quote | file:line | Verdict | Raw excerpt | Channel / attribution |
|---|---|---|---|---|
| "Then skills, competencies, EPS, everything becomes one list." | r1:19; r2:44; r3:41 | V | "Then skills, competencies, EPS, everything becomes one list. One list, right? Make that list." | Mic. WEAK: the preceding and following turns ("right?", "Yeah, that is clear", "So what you mean is...") look like Romit summarising and the other voice confirming. Could be Romit's synthesis, not Aarti's. |
| "how is this different from competence?" | r1:19 | V | "So that's the one thing we will have to get alignment on, is how is this different from competence?" | Mic. Inferred Aarti (she asks it earlier as "Is how is this different from competencies?"). Reasonable. |
| "My report should be my launch page." | r1:20,60; r2:19,45,778; r3:42 | V | "My report should be my launch page." | Mic. Inferred Aarti. Ambiguous "my": student or admin (r1 E2 already flags this). |
| "my report is my launch page" | r2:763 | PC | raw is "should be", not "is" | Mic. |
| "separate place where they go to see ... and then a separate place where they have to go to trigger" and the full r2:20 sentence | r1:20; r2:20 | V | "I don't want a separate place where they go to see the what I have met and run a report, and then a separate place where they have to go to trigger. I see I have not met this, I trigger a review of it." | Mic. Inferred Aarti. |
| "I have to be able to do this at the student level." / "do this at the student level" | r1:20; r2:18; r3:56 | V | "Or the completion page, and I have to be able to do this at the student level." (leading "and" dropped) | Mic. Inferred Aarti. |
| "at least 5, 5, 5, 5, 5 of each ... I've done 2 of these, 4 of these, 6 of these" | r1:21 | V | "I know that I have to do at least 5, 5, 5, 5, 5 of each. I know I've done 2 of these, 4 of these, 6 of these." (ellipsis drops "I know") | Mic. Inferred Aarti. |
| "5, 5, 5, 5, 5 of each" | r3:189 | V | same | Mic. |
| "5, 5, 5, 5, 5 of each. I've done 2 of these, 4 of these, 6 of these." | r2:47 | PC | drops "I know that I have to do at least" and "I know" silently; "at least" (a minimum) is lost | Mic. Meaning kept. |
| "5, 5, 5, 5, 5 of each, I've done 2, 4, 6" | r1:299 | PC | compresses "2 of these, 4 of these, 6 of these" inside quote marks | Mic. |
| "5, 5, 5, 5, 5 of each. I have done 2 of these, 4 of these" | r3:274 | PC | raw "I know I've done"; "I have done" is not raw | Mic. |
| "every course can only have a soft mapping. Not a hard mapping." | r1:22; r2:21; r3:568 | V | "So I, like I said, every course can only have a soft mapping." then next turn "Not a hard mapping. All of this stays at the student level." | Mic. Inferred Aarti ("like I said"). |
| "they should be able to do any of it" / "They should be able to do any of it" | r1:22,646; r3:313 | PC | raw: "But they should be able to, um, do any, any of it." (disfluency removed) | Mic. |
| "they should be able to, um, do any, any of it." / "do any, any of it" | r2:373,627 | V | as above | Mic. |
| "Program requirements is defined once and every student should meet those requirements." | r1:23; r2:67; r3:17 | V | "But we will put this under program requirements." / "Program requirements is defined once and every student should meet those requirements." | Mic. Inferred Aarti. Preceded by a garbled line ("$1,700 yeah, we are not going to do hours in here"). |
| "at a program level, I want the students to fulfill 100 skills" | r3:18 | V | "So are we going to say that at a program level, I want the students to fulfill 100 skills?" / "Which I'll activate at student level." / "This program level, right? Yeah, program level." | Mic. This is a QUESTION by another voice (probably Romit). r3:18 says so, but still carries the Aarti tag. Aarti support: only for "Yeah, program level", and even that is unattributed. |
| "we are not going to do hours in here." / "we are not going to do hours in here" | r1:23; r2:459 | V | "$1,700 yeah, we are not going to do hours in here. That way we'll keep it separate. Separate, okay. But we will put this under program requirements." | Mic. The surrounding turns are garbled and multi-voice; "Separate, okay" is a second voice. |
| "All of this stays at the student level." | r1:24 | V | "Not a hard mapping. All of this stays at the student level." | Mic. Inferred Aarti. |
| "just FYI. On my main report, I don't care." | r1:24; r2:333 ("rotation is FYI") | V (r1:24) / PC (r2:333) | "We can track internally that, okay, you achieved it ... but that's just FYI. On my main report, I don't care." The words "rotation is FYI" at r2:333 are not raw. | Mic. Inferred Aarti. |
| "we don't develop something completely from scratch and we just abstract out that" | r1:26 | V | "So maybe we don't develop something completely from scratch and we just abstract out that" | Mic. Unattributed. |
| "in this course ... and overall where do they stand" | r1:300; r2:374,782 | V | "I can have the view in this course, how many things did they check off, and overall where do they stand." | Mic. Preceded by "there is dashboard in the student side". Inferred Aarti. |
| "bold ... a star ... a different color" | r2:299; r3:276 | V | "You either put them bold or put a star in front of them or make them in a different color or something." (r3 changes spelling to colour) | Mic. Inferred Aarti. |
| "I may be able to trigger it from inside of a particular placement, that's okay" | r1:654 | V | "I may be able to trigger it from inside of a particular placement, that's okay, but I trigger it, I still go there." | Mic. Inferred Aarti. |
| "If you pass the course, you pass this competency." | r2:619; r3:572 | V | "In some, um, Kasa form setups. Which is SLP. ... If you pass the course, you pass this competency." | Mic. Inferred Aarti; scope is KASA/SLP only. |
| "we will have to get alignment" | r2:605 | V | "So that's the one thing we will have to get alignment on" | Mic. Inferred Aarti. |
| "a faculty One signs off, then Faculty 2 also has to sign" | r2:413 | V | "Can it be that, uh, like halfway Faculty 1 and the other half is Faculty 2, or like a faculty One signs off, then Faculty 2 also has to sign, right? Right, right." | Mic. A QUESTION from a second voice, affirmed. r2:413 treats it as Aarti's evidence that "chains are real". Attribution unsupported. (The opening line "Faculty has to approve, then a preceptor has to approve" is the stronger source.) |
| "I observed 10, I assisted in 2, and I performed 5" | r2:483 | V | "or I observed 10, I assisted in 2, and I performed 5." | Mic. |
| "3 signatures from 3 preceptors" | r2:483,780 | V | "against each procedure they have to get at least 3 signatures from 3 preceptors." | Mic. |
| "no concept of met requirements" | r3:672,724 | V | "In PA, they say there's no concept of met requirements. In PA, they say you have to do 333 of this ... minimum procedures. If you do these minimum procedure counts, then you have methods." | Mic. The following transcribed "methods" is a likely mishearing of "met". r3:672 reads this as "requirement is not a count of items", but the raw says PA requirement IS minimum procedure counts. Meaning is thin (Weak). |
| "it doesn't matter where they learn it" / "doesn't matter where they learn it" | r1:792; r3:601 | PC | raw: "It doesn't matter whether they learn in classroom, labs, clinics." and "Doesn't matter they learn it on Clinical 1, Clinical 2..." | Mic. Inferred Aarti. |
| "where it was learned does not matter to the headline" | r1:340 | PC | design's own gloss of the line above, in quote marks | n/a |
| "was there" (signature means) | r1:521 | PC | raw: "yeah, you were here when we did that." | Mic. |
| "lab never satisfies a clinical minimum" | r1:340 | NF | No raw text about lab vs clinical minimums. The raw says the opposite direction ("It doesn't matter whether they learn in classroom, labs, clinics"). This is REQ SC-12, wrongly carrying `[CALL 10-08 Aarti]`. | n/a |
| "Course emphasis" | r1:554 | NF | A design label, not raw wording. The tagged claim (mapping soft and optional) is supported by "soft mapping", "should be able to do any" and "I should have access to it independently". | n/a |

### Unquoted claims with call tags that the raw does not support

| Claim | file:line | Verdict | Note |
|---|---|---|---|
| "Different programs have a set per cohort and per year" tagged `[CALL 10-08 Aarti]` | r3:673 | NF | Raw has no cohort or year. It only supports "defined once", "student level". The mitigation (no per-student sets) is supportable; the premise is inference. |
| "a listener asked; Aarti did not answer" | r3:121 | Unsupported | The asker's text is "Are we also planning ... advisors ... Because at the student level, so everybody can see it." The next turn ("Okay, because right now ... we don't have that student success ... timeline ... but it will all come from here") may be an answer; the raw does not show who spoke. |
| "Aarti's recommendation, handed to Yash" (one list) | r3:531 | Attribution unsupported | Raw: "No, I'm saying we should just design it as one." / "As one? Okay, that's the conversation you need to have with Yash and say he's recommending that..." The proposer of "one" is not identifiable, and "he's recommending" does not clearly point to Aarti. |
| Aarti "hands the merge to another person" | r1:19 | Attribution inferred | Same exchange as above. |

## Vaibhav-tagged items (`[CALL 10-08 Vaibhav]`; none are in quotation marks)

| Claim | file:line | Verdict | Raw |
|---|---|---|---|
| Standalone module that can also integrate | r2:53; r3:48; r1 E9 (r1 correctly says "Romit's own view") | MISATTRIBUTED | db6dc27e Microphone (Romit): "it can be both at some point. Like it will have its own module. But like, you know, that will be integrated in some of the products as well ... skills should be both an independent module but also integrated." Vaibhav (System audio) only asked "is this a separate module or...". Not a Vaibhav statement. |
| Some version by the last week of October | r2:54,694; r3:49,651,715; r1:28 | MISATTRIBUTED | db6dc27e Microphone (Romit): "the target that Sanket has given is ... there's no hard deadline right now ... from week 4. ... Means the last week of October is where we want to have at least some version available for skills checklist." Source is Sanket's target as relayed by Romit. Vaibhav replied "Okay, I see." |
| Accreditation has a separate owner | r2:55,538; r1 E11 | MISATTRIBUTED | db6dc27e Microphone (Romit): "Vishal is a senior product manager in Bangalore ... The owner of accreditation." Not from Vaibhav, and not in Aarti's call. |

c4c6d9eb contains none of the three. The ARCHITECTURE-INPUTS file quotes ("most of them are independently sellable", "it is very good to make it actionable") come from other calls and were not re-verified here.

## Consequences for the designs

1. No quote is MISQUOTED. The Aarti-tagged quotations used for design claims are overwhelmingly verbatim, so the core theses stand: report as launch page, no separate trigger place, soft mapping only, "do any of it", defined-once program requirements, student-level headline, hours out.
2. All "Aarti" attributions are inference (single Microphone channel, two or more voices). Strategy/08's own caveat is correct; the design files should keep saying "Aarti, inferred".
3. "Everything becomes one list" (r1 E1, r2:44, r3:41, r3:531) may be Romit's synthesis confirmed by the other voice, not an Aarti recommendation. All three variants already treat it as seam OD-28 and do not ship competency scoring, so no design change is forced, but remove "Aarti's recommendation" at r3:531 and the "hands the merge" phrasing at r1:19.
4. `r1:340` leans on a NOT FOUND quote: remove the quote marks and the call tag from "lab never satisfies a clinical minimum" and tag it `[REQ SC-12]` only. The design logic (setting in the ledger and rules, hidden from the headline) is unaffected because it is REQ-sourced.
5. `r3:673` (per cohort and per year) is inference; retag `[INFER]`. `r3:121` ("Aarti did not answer") should become "the raw does not show who answered".
6. `r2:413` ("chains are real") should cite the verified opening line ("Faculty has to approve, then a preceptor has to approve") rather than the listener's question; the design (sequenced chain) is still supported.
7. `r3:18` is a listener's question, not an Aarti statement. The program-total-100 seam (OD-30) rests on a question plus an unattributed "Yeah, program level" and the Weak/Moderate rating in 08 is right; keep the total as a reserved slot, not a built feature.
8. The three Vaibhav tags (standalone/integrated, last week of October, accreditation owner) are Romit's own statements relayed or invented on the Oct 8 review call. Retag as `[CALL 10-08 Romit]` or `[CALL 10-08 Sanket target via Romit]`. The "last week of October" slice is a Sanket target stated as "at least some version", which supports the "target, not commitment" wording already used. OD-34 (entitlement/standalone) and OD-35 (accreditation owner) lose their only call evidence and should be marked `[INFER]` until Sankalp or Vaibhav confirms.
9. Minor wording: restore "at least" in the 5-5-5-5-5 quotes (r2:47, r1:299, r3:274), since the raw says a minimum; replace paraphrases in quote marks at r2:763, r2:333, r1:521, r1:792/r3:601 and r1:22/646/r3:313 with exact raw or drop the marks.
10. Not verified: the full text of db6dc27e (keyword search only), transcripts 1d181b10 and 42543caf (Oct 9, out of scope), and quotes tagged `[CALL 09-23]`, `[CALL 10-05]`, `[CALL 09-30..10-02 leaders]`.
