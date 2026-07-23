# Design Anti-Patterns & Execution Protocol

> Enforced for every UI session. Read before writing any component.  
> **Source:** Romit's explicit rejection (2026-05-21) of "basic Claude design."  
> **Pairs with:** `node tools/ds/source.mjs` (+ globals.css), `node tools/ds/source.mjs --list`, Mobbin MCP

---

## The Problem

Claude defaults produce visually generic UIs: every card looks the same, every label uses the same style, every selection state is a 5% brand tint, and every empty state is a centered icon + text + button. These waste Mobbin tokens when looked up after the fact and misrepresent the Exxat product.

---

## Pre-Implementation Protocol (3 required steps)

**Do these before writing a single line of component JSX:**

### Step 1 — Mobbin search (mandatory)
Search for the specific UI pattern you are about to build. Not the component — the **interaction context**.

| Building | Search query |
|---|---|
| Multi-step form/wizard | "multi-step campaign setup recipients scope" |
| List with selection | "batch selection all-selected deselect exclusions" |
| Empty state | "empty state [specific noun — surveys / templates / courses]" |
| Success state | "success confirmation bulk send pushed" |
| Form section builder | "form builder template sections drag reorder" |
| Card with type indicator | "item card type badge left border color" |
| Summary / review step | "review summary before sending recipients count" |

Look at ≥3 apps. Extract: layout approach, information density, selection state treatment, typography weight, spacing rhythm.

### Step 2 — DS component check (`/ds-component-check`)
Before importing anything, verify the component exists in `ds-snapshot.json`. Look for:
- Exact import path
- All available variants and sizes
- What the DS already handles (don't re-implement)

### Step 3 — Token mapping
Map every color decision to a DS token. If you cannot find a token, **do not use raw oklch or hex** — use `color-mix` only with two var() tokens, never with oklch values.

---

## The Anti-Pattern Blacklist

Every pattern below is banned. The table shows what to do instead.

### Typography

| ❌ Banned | ✅ Instead | Why |
|---|---|---|
| `text-xs font-semibold uppercase tracking-wide` everywhere | Use once per screen max for section dividers only. For form labels: `text-sm font-medium`. For metadata: `text-xs text-muted-foreground` | Claude tell #1 — appears 7+ times per file |
| `text-sm font-medium` for all body text | Vary weight deliberately: headings `font-semibold`, labels `font-medium`, metadata `font-normal text-muted-foreground` | Everything the same weight = no hierarchy |
| Same label style for everything | Group-level labels differ from field labels differ from inline metadata | Context determines weight |

### Cards & Surfaces

| ❌ Banned | ✅ Instead | Why |
|---|---|---|
| `rounded-lg border border-border bg-card px-3 py-2.5` as the default card | Use DS `Card` component; or full-width table rows with `border-b` only (no box); or DS `Sheet` for overlays | Every element looks the same — no hierarchy |
| `rounded-xl border border-border` "nice card" | Either use a DS surface token or give it a distinct visual role (e.g., context panel with `bg-card sticky top-0`) | Rounded-xl is not a DS pattern |
| `bg-muted border border-border rounded-lg p-4` muted info box | DS `LocalBanner` for notifications; contextual note inline as `text-sm text-muted-foreground` without a box; or a proper card with a role | Generic catch-all — used for summaries, notes, warnings, everything |
| Same card for item rows AND summary containers AND form sections | Each surface type has its own treatment | No visual system |

### Selection States

| ❌ Banned | ✅ Instead | Why |
|---|---|---|
| `color-mix(in oklch, var(--brand-color) 5%, var(--background))` | Use `var(--brand-tint)` DS token for selected backgrounds | DS provides this token; ad-hoc oklch breaks theming |
| Border color change on selection (`borderColor: checked ? 'var(--brand-color)' : 'var(--border)'`) | DS Checkbox/Radio with proper selected state; or row with `bg-brand-tint` surface swap | Border-as-selection is visual noise on dense lists |
| Brand-color on hover AND active AND selected simultaneously | `var(--muted)` hover, `var(--brand-tint)` selected, `var(--brand-color)` primary CTA only | Per memory: neutral for active states, brand only for primary CTA |

### Spacing

| ❌ Banned | ✅ Instead | Why |
|---|---|---|
| `gap-2` and `gap-4` for everything | 8px grid: `gap-2`(8px) within-element, `gap-4`(16px) between-elements, `gap-6`(24px) between-sections, `gap-8`(32px) between-groups | Rhythm requires deliberate scale |
| `px-3 py-2.5` for all row items | List rows: `px-4 py-3` (16/12). Dense rows: `px-3 py-2`. Card content: `p-4` or `p-5`. Never mix arbitrary half-values | Uniform padding = no density signal |
| Inline `style={{ padding: '...' }}` on every element | Use Tailwind utility classes; only use inline style for pixel-precise measurements from pattern doc | Inline styles accumulate and drift |

### Color

| ❌ Banned | ✅ Instead | Why |
|---|---|---|
| `color-mix(in oklch, var(--destructive) 60%, var(--border))` | Use `var(--destructive)` at reduced opacity: `opacity-60` wrapper, or DS error variant | Raw oklch in color-mix violates DS token rule |
| `color-mix(in oklch, var(--brand-color) 60%, var(--muted-foreground))` for "warning" text | Use `var(--muted-foreground)` — no custom warning color outside DS | DS doesn't define warning text; don't invent it |
| Ad-hoc amber/orange via oklch | No amber color until DS defines one — use muted for below-threshold states | VIZ-004 says amber; but use DS token when available |
| `opacity-50` / `opacity-*` on any text node | Use a different DS token to de-emphasise (`--muted-foreground` on light bg = 5.5:1, already low-contrast by design). Opacity multiplies against the base and makes contrast unpredictable. **A11Y-020** | `--muted-foreground` at `opacity-50` ≈ 2.5:1 — hard WCAG fail |
| `var(--border)` as the only visual indicator for a UI state (swatch, dot, ring, underline) | Use `var(--muted-foreground)` minimum for non-text state indicators (3:1 required by WCAG 1.4.11). **A11Y-021** | `--border` on white ≈ 1.2:1 — fails non-text contrast |
| Changing `text-muted-foreground` → `text-foreground` or `text-xs` → `text-[12px]` to "fix WCAG" | Check the contrast ratio, not the pixel size. `--muted-foreground` on `bg-card` = 5.5:1 in all themes — already passes 4.5:1. WCAG AA has no minimum px size. **CLARIFICATION A11Y-003** | Unnecessary changes add noise and erode the muted hierarchy |

### Step Indicators

| ❌ Banned | ✅ Instead | Reference |
|---|---|---|
| Numbered dot circles `rounded-full w-6 h-6` | Underline tab stepper for ≤5 steps (Customer.io pattern) | Customer.io broadcasts |
| Left-nav step tracker | Only for 6+ steps or complex flows (ElevenLabs onboarding). 3-step wizard doesn't need it | Spec had this wrong |

### Progress & Viz

| ❌ Banned | ✅ Instead | Reference |
|---|---|---|
| Progress bar for completion % | Count badge ("4/6 assigned"), bullet chart, strip plot | VIZ-001 + memory: progress-bars-last-resort |
| Stacked bar chart | Bullet + target | viz/bullet-vs-target.md |
| Red for below-threshold in scores | Amber/orange (no destructive token) | VIZ-004 + Aarti |

### Empty & Success States

| ❌ Banned | ✅ Instead |
|---|---|
| `flex flex-col items-center gap-3 py-20 text-center` + icon + "No X yet" + button | Search Mobbin for "empty state [noun]" first. Match the density of the list it replaces. |
| `flex flex-col items-center gap-6 py-16 text-center` success centered column | Show content-relevant confirmation: course code pills, timeline, recipient count. The success state should reflect the content. |

---

## The 60-Second Pre-Build Check

Before writing the first `<div>`:

```
□ Did I search Mobbin for this specific pattern? (min 3 screens looked at)
□ Did I check ds-snapshot.json for the right DS component?
□ Is every color decision a DS token (no raw oklch/hex)?
□ Is my spacing following the 8px grid?
□ Am I using brand-color only for the primary CTA?
□ Have I avoided uppercase tracking-wide more than once per screen?
□ Does each surface type have a distinct visual role (not all bg-card)?
□ Is the empty state content-specific (not generic centered icon)?
□ Does any text node have opacity-* applied? (ban — use a token instead)
□ Is var(--border) used as a state indicator? (ban — use muted-foreground min)
```

If any answer is "no" — fix before writing code.

---

## Correct Patterns (Mobbin-sourced)

### List rows — information-dense but clean (Customer.io / HubSpot)
```tsx
// Row: Avatar + primary info + secondary metadata + action
<div className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0">
  <Avatar style={{ width: 32, height: 32 }}>
    <AvatarFallback style={{ fontSize: 11, backgroundColor: 'var(--avatar-initials-bg)', color: 'var(--avatar-initials-fg)' }}>
      KC
    </AvatarFallback>
  </Avatar>
  <div className="flex flex-col gap-0.5 flex-1 min-w-0">
    <span className="text-sm font-semibold">BIO 201</span>
    <span className="text-xs text-muted-foreground">Dr. Kevin Chen · 50 enrolled</span>
  </div>
  <Badge ...>didactic</Badge>
</div>
```

### Context panel — live summary (Customer.io right panel)
```tsx
<aside className="w-56 shrink-0 rounded-xl border border-border bg-card p-4 sticky top-0">
  {/* Term header */}
  {/* Divider */}
  {/* Live counts: courses, students */}
  {/* Progressive disclosure: templates (step 2+), window (step 3) */}
</aside>
```

### Step indicator — underline tabs (Customer.io)
```tsx
<div className="flex border-b border-border px-7">
  {steps.map((label, i) => (
    <div key={i} className="py-3 mr-6 text-sm border-b-2 transition-colors"
      style={{
        borderColor: current === i ? 'var(--brand-color)' : 'transparent',
        color: current === i ? 'var(--foreground)' : 'var(--muted-foreground)',
        fontWeight: current === i ? 600 : 400,
        marginBottom: -1,
      }}>
      {isDone(i) && <i className="fa-solid fa-check text-xs mr-1.5 text-brand-color" />}
      {label}
    </div>
  ))}
</div>
```

### Type indicator — Jira-style left border strip
```tsx
<div className="flex items-stretch rounded-lg border border-border bg-card overflow-hidden group">
  {/* 3px colored left strip */}
  <div style={{ width: 3, background: type === 'likert' ? 'var(--brand-color)' : 'var(--border)' }} />
  {/* Content */}
  <div className="flex items-start gap-2 flex-1 px-3 py-3">...</div>
</div>
```

### Colored type badge — Aboard style
```tsx
<Badge variant="secondary" className="rounded" style={{
  fontSize: 10, paddingInline: 6, paddingBlock: 2,
  backgroundColor: type === 'likert' ? 'var(--brand-tint)' : 'var(--muted)',
  color: type === 'likert' ? 'var(--brand-color)' : 'var(--muted-foreground)',
}}>
  <i className="fa-light fa-chart-bar mr-1" aria-hidden="true" />
  Likert 5
</Badge>
```

---

## Source Reference

- Mobbin: Customer.io broadcasts, HubSpot send-or-schedule, Aboard form builder, Maze survey builder, Typeform question editor, ElevenLabs multi-step onboarding, Fresha campaign creation, Intercom accordion wizard
- Romit feedback: 2026-05-21 — "I am not liking the basic Claude design that is being used all the time. For example: Inset shadows card, progress bar, etc."
- Memory: `feedback_basic_claude_design.md`
