# DS Conformance + Typography Review — Skills Checklist Design Lab

Date: 2026-10-30
Reviewer: DS conformance agent (visual-diff + ds-conformance + axe + static grep)
Scope: 11 MARQUEE recommended-variant screens at 1440x900; evaluator/student also at 375x812
Screenshots: apps/skills-checklist/docs/knowledge/design/review-shots/ds/

Full findings in the SubagentHandback message for this session.

Verdict: DEVIATIONS / NEEDS-MORE

Top 10 Actions:
1. type-scale.ts:17 - section to text-lg (18px) font-semibold. Fixes S1/S2/S4 on all 11 screens.
2. evaluator form - add h2 above skill cards (S9, axe moderate).
3. admin-course-mapping - scrollLabel on each DS Table (S8, axe moderate).
4. configure/live-panel.tsx:194 - h2 className to TYPE.section (S5).
5. configure/check.tsx:184,261,278 - remove text-sm override on CardTitle (S6).
6. evaluator/outcome-variants.tsx:90 - text-[10px] to text-xs + aria-hidden (S7).
7. student/dashboard.tsx PaceCard - add pt-2 gap between ChartCard title and figure (S3).
8. student/progress.tsx PaceChart SVG - lock axis label fontSize to 12 (S10).
9. reviewer/approvals-frame.tsx - TYPE.figure strip for queue stats 35/60d/11d.
10. admin-a/parts.tsx:289 PaneHeading h2 - text-lg (18px) on split-pane screens.
