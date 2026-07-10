# PCE — Romit's UX Direction & Product Alignment
**Date:** 2026-06-04 · **Source:** Transcript (Meeting with Romit Soley, 1h 8m) · Local file: `/Users/romitsoley/Downloads/Meeting with Romit Soley.docx`
**Participants:** Romit Soley + PCE designer (India)
**Context:** Design alignment before Baroda. PCE architecture, student UX, exam management direction.

> PCE-relevant content: timestamps 0:03 – ~40 min. Remainder of transcript is Exam Management assessment creation — captured separately.

---

## Architectural Directives

### 1. Coexistence with Prism (non-negotiable)

Verbatim: *"Now we are redoing this page in React, and we are taking the opportunity to structure the app and everything. So it need not be copy paste of what Prism is because that will be a wasted effort."*

And: *"Prism is also going to exist in its current format and the new things we are going to develop is going to be following some of the new principles, but we cannot reinvent everything."*

**Decision:** New modules (PCE/CE) follow new design principles; old modules (Prism) stay as-is. The transition is managed — not a big-bang replacement. Three old modules stay in older architecture, newer modules in newer architecture. They must coexist and not look like they came from two different companies.

**Alignment required:** Himanshu (design director in Bangalore) must be included for sign-off on anything new. Romit owns new modules; Himanshu owns existing Prism modules.

---

### 2. Two Navigational Sections (product structure)

Verbatim: *"We have said that course and faculty is a unique type of survey and then institutional surveys is it. So we are going to have these two entry points and almost treat them as two sections of the product. And I'm good with that. Course and faculty feedback and institutional surveys."*

**Decision:** PCE = two sections:
- **Course & Faculty Evaluation** — specialized, structured per-course (anonymous, CE-specific logic)
- **Institutional Surveys** — programmatic surveys (alumni, preceptor, graduating student) — **NOT anonymous**

Each section needs: dashboard, selection screen, template/setup, and its own navigable applications. Assess whether any setup surfaces can be shared across both.

---

### 3. Independent Module Operation (no mandatory Prism dependency)

Verbatim: *"This needs to function independently. They're still saving data in the student entity, but this is operating independent."*

And: *"I am not going to be in the situation, oh, you go to Prism, import the students, then you come here. Oh, you go to prison, you do that, then you come here. That's not going to happen."*

And: *"Only this module roles will also exist. And so all the base entities that you need to be able to edit, you have to have them in here."*

**Decision:** PCE must be self-sufficient. Users who only have PCE access must be able to:
- Register students directly in PCE (not import from Prism)
- Assign courses to faculty directly in PCE
- Manage all required entities without leaving the module

When Prism integration IS available, it's still the preferred source of truth. But PCE cannot require it. This resolves the "two flows" problem — PCE must be standalone-capable.

---

### 4. Super Admin Only for P1

Verbatim: *"I'm aligned on the fact that even though we may think we have like 5 different variations of admin that we want to do, today we just want to worry about the super admin role. Like we don't want to worry about like, oh, you can do this, but not this, so you can do the, we'll get to that as we evolve the module, but to get it launched, I don't want to worry about it."*

**Decision:** P1 admin persona = super admin only. Full access. Fine-grained role-based restrictions (which admin can see what) are deferred to post-launch. No partial-admin variations in P1.

**Note:** This does NOT contradict the "3 personas" (admin/faculty/student) framing — it clarifies that the admin view is super-admin full-access. Faculty and student views are still needed.

---

### 5. Anonymity Distinction: CE ≠ Institutional Surveys

Verbatim: *"All of the data that the students submit in here is anonymous. So if you have institutional surveys that they have done that is not anonymous, that's a different thing."*

And: *"You won't have dashboards for students because it's anonymous, like in this case... The student is building anonymous surveys everywhere, so you're not going to show what has the student filled."*

**Decision:**
- **Course & Faculty Evaluation** responses = **fully anonymous**. No student-level attribution in results. Admin sees aggregate only. No student dashboard for CE results.
- **Institutional Surveys** = **NOT anonymous** by default. Student identity can be linked.
- Both types merged in the student entity directory (see §7 below).

---

### 6. Faculty View: Competitive/Comparative Analytics Required

Verbatim: *"I need competitive faculty data so I can look at my performance. I can look at comparatively how am I doing compared to other people. Historically, how have I done in this turn? How am I going, etc."*

And: *"People sell and buy this software. So what is it that I need to do the setup? What is it that I need?"*

**Decision:** Faculty view must show:
- Own performance (ratings, completion %)
- Comparative context (dept avg, school avg)
- Historical trend (course-level, across terms)

This positions PCE as a standalone competitive product. Framing: *"There are competitors who only do this."*

---

## Student UX Directives

### 7. Email: Two CTAs (direct + dashboard)

Verbatim: *"This email should have both buttons, like see all my pending activities or click here to complete this survey. And if they see all pending activities, they go here. And if this survey, they go here, they fill the survey, they're done."*

**Decision:** Every survey invitation email must have **two** CTAs:
1. `[ Complete this survey → ]` — deep link directly into the specific survey
2. `[ See all my pending activities → ]` — link to the lightweight student activity dashboard

Current spec only has one CTA. This is a gap.

---

### 8. Lightweight No-Auth Student Activity Dashboard

Verbatim: *"You can directly go here or in this email, you can get a link to go to like a dashboard to see all the activities that you need to complete. And you go here and if you have 5 emails that were sent out to you, they're all aggregated. All the action items for those 5 emails are aggregated here."*

And: *"If an email was sent to rawmethat.com and I click on my dashboard, any pending survey that rawmethat.com needs to fulfill can be shown here."*

And: *"I don't expect a lot of people to go here. I expect them to barely do this call to action, click done, test it."*

**Decision:** A lightweight student activity dashboard exists. Key properties:
- Accessed via email link (no username/password)
- Identity = email address from the link token
- Shows ALL pending surveys across ALL programs that sent to that email
- Shows completion state per survey (pending / submitted)
- Optional, low-traffic surface — most students go direct-to-survey
- Dashboard shows: course name + faculty + deadline + status (pending/completed) per row

**Route:** `/student/activities` or similar (net-new, email-token auth only)

---

### 9. Survey Form: Progress Bar

Romit showed a Canvas survey as reference. Verbatim: *"They have a bar at the top. So as I go to the next section, I know what I have completed. So I know I'm one fourth done and I can keep going and keep writing the details."*

And: *"They have it in groups. So it's not overwhelming."*

**Decision:** Student survey form must have:
- Progress bar at top showing section completion (% or 1-of-N framing)
- Questions grouped into sections (not one flat list)
- Clean, minimal layout — no visual overwhelm

This applies to the main survey-taking route (`/student/surveys/[id]`).

---

### 10. Student Entity: Merged View (CE + Institutional Surveys)

Verbatim: *"When you're looking at the student entity, what course and faculty evaluations they have failed and what institutional surveys they have failed should all be merged together because it's talking to each other. Yeah, it's one product, one system."*

**Decision:** In the admin student directory, the completion/completion columns must show BOTH:
- Course & Faculty Evaluation submissions
- Institutional Survey submissions

One merged view. The Jun 10 brief shows CE-only columns — this needs to be extended.

---

## Scope Removals (P2 / Deferred)

### Faculty Question Assignment → P2

Verbatim (in context of assessment builder discussion):
*"OK, you can like hide that right now, right? Because for like the immediate rollout, we won't be able to accommodate that... is this feature going in the first phase? No, not yet."*

The feature: allowing the assessment author to assign specific sections/questions to a faculty member, who then adds questions on behalf of the main author.

**Decision:** Faculty question assignment is deferred. Not P1 for any module.

---

## Process Directives (Romit → Designer)

1. **Big picture before nuance**: *"We have to have a little bit of a product thinking before we do a deep dive into the nuances of a question bank."* — Landing page, IA, main workflows must be aligned first.

2. **Two-layer design artifacts**: *"From this conversation right here, what I have now understood is there are going to be two different kind of design activities from my side. One is purely concept — this is just our exclusive discussion where everything is possible. And then there is a part of it where we say that a cleaned up version... for phase one we can only focus on these things."* — Maintain big-picture concepts + P1-scoped clean version separately.

3. **Alignment before delivery**: Engineering (Himanshu) + Product (Monil/Vishaka) + Design must be aligned before declaring anything "ready." Romit reviews last, then sign-off.

---

## Reference: Canvas Survey (shown during meeting)

Romit demonstrated a canvas survey email and form as reference UX. Key properties observed:
- Clean email with institution branding
- Survey form: questions grouped by section
- Progress bar at top (section completion indicator)
- Faculty divided into two sections (Main faculty + supporting faculty)
- Not overwhelming — focused Q&A, not data collection form

No visual pixel-copying — IA and interaction patterns only (per anti-pattern rules).
