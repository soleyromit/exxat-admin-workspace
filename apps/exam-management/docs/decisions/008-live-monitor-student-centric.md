---
type: decision
date: 2026-05-08
product: exam-management
status: Accepted
source: granola
session: 4e9c57ba-aa2a-4f03-b509-e78d27121d25
granola_meeting: 4e1c850e-d760-4d05-81a1-a52287b9ae21
---

# Exam Management ADR-008 — Live monitor is student-centric, not question-centric

## Status

Accepted (Aarti, 2026-05-08)

## Context

During the May 8 design review, a prototype of the live exam monitor showed per-question response distribution as the primary focus — how many students picked option A vs B vs C, per question, in real time.

Aarti redirected the design:

> "While I'm live monitoring it, I'm not so much concerned about what's going on with question nine. I'm more concerned about what's going on with the students. All these numbers that you have for the students — five students not started, in-progress, submitted — if I can see those counts in the different buckets, that might be good."

The course coordinator's job during a live exam is student logistics (who hasn't started, who's stuck, who's done) not question-level statistical analysis. Question analysis belongs post-exam once all submissions are in.

## Decision

The live monitor's primary display is a **student status board** showing each student's progress state (not started / in progress / submitted) as scan-band buckets. The course coordinator sees the student cohort at a glance.

Per-question response distribution may appear as a **secondary panel** once the student board is present — it is not removed, but it is not the hero. The layout is student board (primary, left/top) + question distribution (secondary, right/bottom).

Live monitoring is available to **course coordinators (editor role) and admins only** — not to course instructors (viewer role), since they are not responsible for managing the exam administration.

## Alternatives considered

- **Question-centric primary view** — rejected. Aarti: during the exam, the coordinator is proctoring and managing students, not doing psychometric analysis. Real-time per-option counts are a distraction.
- **No live monitor at all** — rejected. Parity item with ExamSoft; Aarti confirmed it's a must-have for launch.

## Consequences

- Positive: Coordinator can quickly identify students who haven't started (e.g., no device, wrong password) and intervene.
- Positive: Clean role separation — Viewers (instructors) don't need live access to exam administration.
- Negative: Post-exam analytics (per-question breakdown) must be clearly distinguished from live monitor so coordinators don't expect real-time psychometrics during the exam.
- Follow-up: Live monitor is course-coordinator-only — role gate implemented in `live-monitor-client.tsx` using `accessLevel === 'editor'`.
