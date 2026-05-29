---
type: meeting
date: 2026-05-28
product: exam-management
participants: [Romit, Nipun, Vishal]
source: granola
granola_id: 9781e589-ca26-44a8-b128-cdda0bcd5b37
---

# Design Priorities and Bandwidth Planning — Question Bank, Student Experience, and Assessment

**Date:** 2026-05-28 · **Time:** 10:04 AM EDT
**Context:** Romit–Nipun–Vishal sync on bandwidth, priority order, and design quality. Romit reported thin bandwidth. Nipun clarified priority order and identified QB pinning feature as a UX issue needing a fix before engineering builds it.

## Topics covered

1. Romit's current workload: QB feedback/fixes, assessment creation, student experience, PCE, base entities
2. Priority order alignment: QB → student experience → PCE template → assessment workflow
3. QB pinning feature — UX incorrectly designed; needs resolution before engineering builds
4. Assessment design review call (scheduled for May 29 with Aarti) — decision to cancel
5. Student experience PRD context: design tasks should be driven by reading PRD top-to-bottom, not just design-task description

---

## Decisions

| # | Decision | Scope | ADR |
|---|---|---|---|
| D_EM71 | **Design priority order: (1) Question Bank cleanup, (2) Student experience, (3) PCE template structure, (4) Assessment workflow.** "Tech team is already working on question bank and they're supposed to finish refining it by mid of next month. So question bank is something which really needs focus." — Nipun. After QB: student experience (most design already done, just refinements). After that: PCE template. Assessment creation workflow = last, scheduled for Wednesday Aarti review. | Design process | — |
| D_EM72 | **QB pinning feature — UX incorrectly designed per Nipun. Needs fix or removal before engineering builds it.** "There was a feature called pinning on the design. But that from the information hierarchy UX perspective, that each of us made wrongly. So either I would have to tell the tech team, just don't build this. Or I would have to get the UX fixed." — Nipun. Nipun will review and decide whether to remove or request redesign. Romit to be informed. DESIGN-REVIEW required. | Admin / Faculty | — |
| D_EM73 | **Assessment design review call with Aarti (scheduled May 29) → CANCELLED.** Romit to focus on QB and student experience per D_EM71. Next assessment design review: Wednesday (with Aarti, assessment workflow focus). "Let's cancel it because yeah, let's cancel it. And if RT asked why, tell that we are trying to prioritize." — Nipun. | Process | — |
| D_EM74 | **Student experience design tasks: design from PRD requirements top-to-bottom, not just design-task descriptions.** Nipun: "If you have gone through the PRD, all the details are already there... just simply scroll up and you can see." Design tasks in the PRD section are quick-reference only; the full PRD is the authoritative spec. Romit should read PRD and surface gaps rather than waiting for detailed task descriptions. | Design process | — |

---

## Verbatim quotes

> "Tech team has already started, and they need to finish it. Yeah. After that, there are one or two members in the tech team who are free. And I've told that since we already have most of student experience ready, we just need to finish the refinements." — Nipun

> "There was a feature called pinning on the design. But that from the information hierarchy UX perspective, that each of us made wrongly. So either I would have to tell the tech team, just don't build this. Or I would have to get the UX fixed." — Nipun

> "Things like that, I just say to review once. I'll do a thorough review. If I'm aware of the solution, I will fix it myself. If there are open areas, I'll give you the exact same changes to do in your design." — Nipun (re: QB pinning)

> "So I would say, Romit, please focus — and tomorrow assessment design review call, see if you can move it out. Right? So I think we should be focused — we all should work, you know, and work on the same set of priority list." — Nipun

> "And then after that, we should start working on assessment workflow because that is a major workflow. We should spend more time on it next week and then try and make a lot of progress and show those designs in our Wednesday call with Aarti." — Nipun

---

## Cross-reference — existing code findings (Pass 5)

| File | Finding | Action |
|---|---|---|
| `apps/exam-management/admin/app/(app)/question-bank/qb-sidebar.tsx:513–535` | Pinning feature exists: `pinnedFolderIds`, `toggleFolderPin`, "Pin to top" / "Unpin" in FolderContextMenu, thumbtack icon in FolderRow. `qb-state.tsx` likely holds the pinned state. | ⚠️ DESIGN-REVIEW (T76). Nipun says UX is wrong from information-hierarchy perspective. Do not remove until Nipun provides direction. Do not build additional pinning UI. |
| `apps/exam-management/admin/app/(app)/question-bank/qb-state.tsx` | Likely stores `pinnedFolderIds` Set. | ⚠️ See T76. No code change until UX direction is confirmed. |

---

## Design tasks generated

| Task | Priority | Notes |
|---|---|---|
| T76 | P1 — DESIGN-REVIEW | QB pinning feature: UX is incorrectly designed per Nipun. `qb-sidebar.tsx:513–535` shows the implementation. Nipun to provide direction (remove entirely OR redesign). Do not touch existing code until direction is given. Do not ask engineering to build additional pin UI. D_EM72. |
