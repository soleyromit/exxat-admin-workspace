# Eval Settings — Redesign Spec (Jun 29 2026)

> Supersedes the ad-hoc settings build. Authoritative parent: `2026-06-29-live-vs-local-gap-analysis.md §7 + §8`.
> Surface: `/admin/eval-settings`. Model: designed on Opus, implemented same pass.

> **CORRECTION (Jun 29, after live walkthrough).** The first pass (and §3 below) used 3 invented top-tabs
> built from a WebFetch *text inventory*, not the live render. Opening pce-three.vercel.app/settings in
> Playwright revealed the real IA: a **left sub-nav with 4 sections** —
> **Evaluation Rules · Evaluation Dates · Communication · Role Access Grid**. What was actually built:
> - **Left sub-nav** (not top tabs); breadcrumb is just "Settings" (no invented "Setup ›" parent); title "Central Settings".
> - **Evaluation Dates** uses live's **Anchor Date + signed-offset** model (anchor = Course/Term End, Opens −7, Closes +7, Releases +14) — plus a "resolves-to" date preview.
> - **Communication** = full **Email Templates manager** (Invitation + Reminder groups, per-template preview/edit/duplicate/delete, New Template in a DS Sheet) + **Reminder Cadence engine** (frequency · anchor · start · schedule preview).
> - **Role Access Grid** embeds the real role × scope × faculty matrix (from the former `/admin/permissions`), not "Coming soon".
> - The separate routes `/admin/{permissions,email-templates,reminder-schedule}` now **redirect** into the matching Settings section (Romit approved folding-in).
>
> Lesson recorded: [[feedback_experience_live_page_not_webfetch]]. The §1 problem analysis and §2 Mobbin refs still hold; §3's tab IA below is the superseded version, kept for history.

---

## 1. Problem (why redesign)

The current build matched the live field list but failed UX:

| Problem | Evidence | Principle violated |
|---|---|---|
| **Word-heavy** | Every `SettingRow` hint restates its label ("Likert N → Number of points") | Hints must add what the label can't say (Krug, "Don't make me think") |
| **Duplicated editors** | Communication tab inlines email editor (dup of `/admin/email-templates`) + reminder cadence `[10/7/3/1]` (dup of `/admin/reminder-schedule`, source `setupDefaults.activeReminderIntervals`) | §8.1 ONE source; `feedback_no_unauthorized_consolidation` |
| **Conflicting reminder anchor** | Settings cadence = days-before-*close*; reminder-schedule = days-before-*term-end* | §8.1 one anchor |
| **No downstream visibility** | Settings is the single source other surfaces read — but nothing shows *where* a value is applied | §7 "set once, applied everywhere" |
| **No "resolves to" preview** | Only the scale has a preview; window offsets + benchmarks show raw numbers | §7 derived-value preview; Apollo/Chatbase/GitBook pattern |

---

## 2. Product analogies (Mobbin, web)

| Pattern we adopt | Source | Link |
|---|---|---|
| **Live label band above editable rows** — labels update as you edit the scale | Apollo · Configure scoring distribution | https://mobbin.com/screens/e41e87dc-300c-4998-9098-ccdc6d3500d9 |
| **Predefined scale dropdown → per-point Name + Description rows** | Employment Hero · Edit Review Template | https://mobbin.com/screens/b9564458-a9c2-4648-85be-9c83cb493f78 |
| **Left sub-nav + flat toggle rows w/ one-line desc + live preview pane** | GitBook · Customize → Configure | https://mobbin.com/screens/da102238-bedd-4af6-bc44-468c2c414aef |
| **Config left / live preview right + sticky unsaved-changes bar** | Chatbase · Chat widget Style | https://mobbin.com/screens/d0f6e7fa-2b68-4c36-9475-fc19cd8a700e |
| **Coupling awareness — "this choice has no valid X downstream"** | 15Five · Performance Ratings formula | https://mobbin.com/screens/21f800f4-ae97-4fab-8d1c-9be9b9dab2b9 |

**UX analogy:** Linear/GitBook settings — tabbed, flat rows, label bold + one short clarifier, control right-aligned; a contextual preview where the rule is *derived* (not literal).

---

## 3. IA — three tabs by job-to-be-done

```
/admin/eval-settings
├─ Standards          "What we measure, and the bar for good"
│   ├─ Rating scale        points (3·4·5·7) + type → LIVE LABEL BAND (Apollo)
│   ├─ Answer labels       low / high end (seeded from scale, editable)
│   ├─ Faculty roles        multi-select chips + add   ↳ Used in: Templates · Term activation
│   └─ Benchmarks           response % · course /N · faculty /N  ↳ Used in: Analytics reference lines
│
├─ Schedule & release  "When it runs, when faculty see results"
│   ├─ Evaluation window    open −Nd / close +Nd / release +Nd  → RESOLVES TO (real term dates)
│   ├─ Release method        Direct / Review (radio + 1-line each)
│   ├─ Minimum threshold     N responses before results share
│   └─ Comment moderation    toggle
│
└─ Communication       "How we reach students"
    ├─ Invitation email     summary card → "Edit templates →" (/admin/email-templates)  — NO inline dup
    └─ Reminder cadence     reads setupDefaults.activeReminderIntervals (term-end anchor)
                            chip row [21·14·10·7·5·3·1] + schedule preview → "Manage in Reminder Schedule →"
```

Why this grouping: each tab answers one admin question. Benchmarks live under **Standards** (they're program standards set once), not under Results — they're a *bar*, not an *outcome*. Window + release + moderation all gate the *lifecycle*, so they co-locate. Email + reminders are the *outbound* surface.

---

## 4. The two new UX primitives

### 4a. Live label band (Rating scale + Answer labels) — Apollo pattern
```
 Points  ( ) 3   ( ) 4   (•) 5   ( ) 7        Type [ Agreement ▾ ]

 ●━━━━━━━━━●━━━━━━━━━●━━━━━━━━━●━━━━━━━━━●        ← single derived band
 1         2         3         4         5
 Strongly  Disagree  Neutral   Agree     Strongly
 Disagree                                Agree
```
Editing either endpoint in **Answer labels** mutates this same band (single source — no second preview).

### 4b. "Resolves to" preview (Evaluation window) — derived-rule pattern
```
 Open    [ 7 days  ▾ ] before term ends
 Close   [ 14 days ▾ ] after term ends
 Release [ 1 day   ▾ ] after close

 ┌ Resolves to · Spring 2026 (ends May 8) ───────────────┐
 │  Opens May 1   →   Closes May 22   →   Results May 23  │
 └────────────────────────────────────────────────────────┘
```
Turns 3 abstract offsets into a concrete timeline the admin can sanity-check — the spec's "resolves to…" requirement.

### 4c. Coupling hint (faculty roles, benchmarks)
A muted one-liner under the section title naming the downstream surfaces it feeds:
`↳ Applied in Template builder and Term activation` — makes "set once, applied everywhere" visible.

---

## 5. Couplings wired (the reason Settings is built first — §7)

| Setting | Source const | Read by |
|---|---|---|
| Faculty roles | `EVAL_FACULTY_ROLES` / `EVAL_DEFAULT_FACULTY_ROLE_IDS` | Template builder, Term activation audit |
| Benchmarks | `EVAL_BENCHMARKS` | Analytics reference lines |
| Scale | `EVAL_DEFAULT_SCALE` | Template editor (locks Likert options) |
| Window | (local offsets) | Push wizard, Term activation |
| Reminder cadence | `setupDefaults.activeReminderIntervals` | Push wizard, Reminder Schedule page |

This pass *displays* the couplings (hints) and reads the real sources. It does **not** consolidate the distinct `reminder-schedule` / `email-templates` routes (`feedback_no_unauthorized_consolidation`) — it links to them and shares their source of truth.

---

## 6. Banned-pattern & copy discipline

- No hint that restates its label. Hint only where the control is non-obvious (window offsets, threshold, roles coupling).
- No inline email editor (link out). No second reminder source (read `setupDefaults`).
- Flat rows (`border-b`), no rounded card-per-row. `text-xs` floor. Brand-color reserved for the Save CTA only.
- Benchmarks `/N` is dynamic from the chosen scale, never hardcoded `/5`.

---

## 7. State coverage

| State | Handling |
|---|---|
| empty (no faculty roles) | icon + one-line + the Select to add |
| disabled | Add button disabled until a role is picked |
| success | `LocalBanner` success, auto-dismiss w/ `useEffect` cleanup |
| derived-empty (window preview) | always resolvable (static example term) |
| out-of-range (benchmarks) | clamped in `onChange` (no invalid state reachable) |
