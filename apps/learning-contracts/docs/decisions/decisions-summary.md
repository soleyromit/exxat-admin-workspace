# Learning Contracts — Decisions Summary

Master log of all product design decisions for the learning-contracts product.
Granola transcripts are the source of truth; summaries here are secondary.

---

## §1 — Sep 3, 2026 — Configuration, workflows, and phased rollout

**Meeting:** `docs/research/meetings/2026-09-03-learning-contracts-config-workflows-phased-rollout.md`
**Granola ID:** `7957f86d-f692-49cb-9c76-8c0366dc08bd`
**Participants:** Aarti (Adi), Vishaka, Ankit (presenter), Katie, Kunal, Kanti, Nava, Akshay, Romit

### §1.1 — Core concept

Learning contracts are written agreements between a student, the site reviewer(s), and faculty/admin — documenting what tasks/activities a student will perform to achieve specific competencies. Disciplines include social work (primary), OT, public health, counseling, teacher education.

**The five pain points** in the current Prism LC implementation that this product addresses:
1. Contract is locked after sign-off — students cannot continue editing. Replaced by perpetual/living document model.
2. Contract is not shareable across multiple placements at the same site. Now a standalone document attachable to multiple placements.
3. No audit trail — no field-level change history.
4. Checkpoint model is backend-coded, not admin-configurable from the front end.
5. Rating scales are not configurable per checkpoint.

### §1.2 — Document model

| Property | Decision |
|---|---|
| Document type | Standalone — not tethered to a single placement |
| Edit mode | Perpetual — any party can edit after approval |
| Sharing levels | Placement / Course (across placements in one course) / Year (across courses) / Student-universal |
| Audit trail | Field-level — who, what field, when |
| Student initiation | Before placement exists — at course or program level |

### §1.3 — Configuration screen (admin)

The admin configuration screen is a **full-page multi-step flow**. Drawer/grid approach was explicitly rejected by Aarti.

If a drawer is used anywhere within the config, it must be **2/3 width** (never 1/3).

A rich **summary/review step** is shown before the admin confirms/saves configuration, listing all policies set across all steps.

Configuration is restricted to **super admin / program administrator only**.

Steps in the configuration flow:
1. Pick a competency framework from existing standards; or create a new one via the standard section.
2. Define taxonomy labels (what the discipline calls "competency", "sub-competency", etc. — e.g., "practice behavior", "KPI").
3. Set data entry level (standard only / sub-standard only / both).
4. Enable/disable data fields per competency: start/end dates, methods of evaluation (and their options), additional open-text questions.
5. Define checkpoints.
6. Set program-level policies (secondary reviewer, notifications, reapproval).
7. Summary review before save.

### §1.4 — Checkpoint design

| Property | Decision |
|---|---|
| Minimum | Mid (or equivalent) + Final — configurable labels |
| Final checkpoint | Protected slot — cannot be removed; can be relabeled |
| Scope | Placement-scoped; if contract spans multiple placements, each placement has its own checkpoints |
| Program → Course pull-down | Program-level defaults populate course level; editable at course level |
| Rating scale | Configurable per checkpoint; mid and final can have different scales |
| Scale mismatch warning | Caution notice shown if mid and final use different scales |
| Considered for competency | Toggle per checkpoint (yes/no) — flags whether rating feeds competency tracker |
| Self-assessment | Toggle per checkpoint — student rates themselves |
| Justification comments | Toggle per checkpoint — student adds qualitative comments |
| N/A handling | Null scenario — not added to numerator or denominator (consistent with evaluation module) |

### §1.5 — Secondary reviewer policy

Two distinct toggles — NOT a single toggle:
1. **Allow secondary reviewer to participate** — yes/no
2. **Mandate secondary reviewer when available** — yes/no

Primary reviewer sign-off is always mandatory. Secondary reviewer is always optional by default unless toggle 2 is enabled.

### §1.6 — Notification policy

- **Stage-level notifications** for the sequential workflow (student → field instructor → field liaison).
- **Not field-level** — triggering a notification on every field save was explicitly rejected.
- For post-approval edits: end-of-day digest summarizing all changes is the preferred approach. Full configuration flexibility is acceptable (but must be thought through carefully).

### §1.7 — Competency tracker integration

- Which checkpoint feeds the competency tracker is configurable per checkpoint ("considered for competency: yes/no").
- Current Prism logic: mid checkpoints calculate until finals are available; finals then replace mids. This flexibility must be maintained.
- Needs engineering sync with Sankalp on scoring/denominator logic when N/A is used.

### §1.8 — Navigation

Learning contracts appear as a new nav item in the **placement management section** (the third card — alongside sites, placements, evaluations).

### §1.9 — Out of scope for Phase 1

| Feature | Status | Notes |
|---|---|---|
| Pre-placement supervisor sign-off | Phase 2 | Supervisor anchored to placement in base entity model; CMHC counseling requirement |
| Cross-course score visibility configuration | Phase 2 | Whether evaluation scores from one course are visible in another course's contract reference |
| Weighted scoring across checkpoints | Future | Which checkpoint(s) contribute to competency and with what weight |
| Evaluation linked from a separate form (OT-style) | Existing evaluation module | Learning contracts integrates contract + evaluation; standalone evaluation stays in evaluation module |

### §1.10 — Timeline and release strategy

- **Hard deadline: Q1** (Aarti: "this cannot miss the q1 deadline").
- Q4 delivery is uncertain — may stretch to Q1.
- **No lightweight/partial release** — must launch a complete Phase 1 or hold until full Phase 1 is ready.
- Social work adoption will be highest in fall rotations; missing Q1 means waiting for next fall cycle.
- After release, CX team needs time for videos, webinars, and beta customer onboarding before broad adoption.
- **Cohere session: Sep 15, 2026** — Aarti, Katie, Kanti to walk through prototype and collect discipline-specific feedback (counseling, teacher education, OT in addition to SW).
