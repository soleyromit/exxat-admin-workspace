# WCAG 2.1 Level AA — criterion matrix (Exxat DS)

**Target:** WCAG 2.1 Level AA = **50 success criteria** (30 A + 20 AA).  
**Exxat also adopts** selected WCAG 2.2 criteria (notably **2.5.8** target size).

**How to use:** Ship checklist = pre-merge gate. This matrix = full conformance map. A route is AA-ready only when every **applicable** row passes.

| Status | Meaning |
|--------|---------|
| ✅ | Covered by DS rule + component; verify on change |
| ⚠️ | Partial — product or manual test required |
| ❌ | Gap — fix or document owner |
| ➖ | Not applicable to DS chrome (product/content owns) |

---

## 1. Perceivable

| SC | Name | Lvl | Status | DS / test |
|----|------|-----|--------|-----------|
| 1.1.1 | Non-text Content | A | ✅ | Icon Cases A/B/C · `exxat-accessibility` skill |
| 1.2.1 | Audio-only / Video-only | A | ➖ | Product: transcript / alt for media |
| 1.2.2 | Captions (Prerecorded) | A | ➖ | Product: `<track kind="captions">` |
| 1.2.3 | Audio Description / Media Alt | A | ➖ | Product |
| 1.2.4 | Captions (Live) | AA | ➖ | Product: live events |
| 1.2.5 | Audio Description (Prerecorded) | AA | ➖ | Product |
| 1.3.1 | Info and Relationships | A | ✅ | `tablist` vs `toolbar`, tables, one H1, landmarks |
| 1.3.2 | Meaningful Sequence | A | ⚠️ | Tab order = DOM order; avoid CSS reorder without audit |
| 1.3.3 | Sensory Characteristics | A | ⚠️ | Color + icon/text; no “click green button” copy |
| 1.3.4 | Orientation | AA | ✅ | Responsive shell; no orientation lock |
| 1.3.5 | Identify Input Purpose | AA | ⚠️ | `autoComplete` on PII fields — ship checklist |
| 1.4.1 | Use of Color | A | ✅ | Status badges + icons; link underline on `variant="link"` |
| 1.4.2 | Audio Control | A | ➖ | No auto-play audio in DS |
| 1.4.3 | Contrast (Minimum) | AA | ✅ | Tokens + ESLint; 4 theme modes |
| 1.4.4 | Resize Text | AA | ⚠️ | Text zoom 200% test (separate from reflow width) |
| 1.4.5 | Images of Text | AA | ⚠️ | Logos exempt; no marketing image-text |
| 1.4.10 | Reflow | AA | ✅ | `reflow-viewport.ts` · checklist § Reflow |
| 1.4.11 | Non-text Contrast | AA | ✅ | Focus rings, borders, chart rules, HC |
| 1.4.12 | Text Spacing | AA | ⚠️ | User spacing override test — checklist |
| 1.4.13 | Content on Hover or Focus | AA | ⚠️ | Radix Tooltip/Popover (Esc, hoverable) |

## 2. Operable

| SC | Name | Lvl | Status | DS / test |
|----|------|-----|--------|-----------|
| 2.1.1 | Keyboard | A | ✅ | Radix, `ChartFigure`, `Shortcut`, command palette |
| 2.1.2 | No Keyboard Trap | A | ✅ | Dialog/sheet focus trap + Esc |
| 2.1.4 | Character Key Shortcuts | A | ⚠️ | Modifier chords only; no bare `←`/`→` app-wide |
| 2.2.1 | Timing Adjustable | A | ⚠️ | Exam/session timeouts — product pattern |
| 2.2.2 | Pause, Stop, Hide | A | ⚠️ | `prefers-reduced-motion`; pause auto-rotate if added |
| 2.3.1 | Three Flashes | A | ➖ | Product media |
| 2.4.1 | Bypass Blocks | A | ✅ | Skip link · `#main-content` |
| 2.4.2 | Page Titled | A | ✅ | `useDocumentTitle` via `SiteHeader` |
| 2.4.3 | Focus Order | A | ⚠️ | No `tabIndex > 0`; manual tab pass |
| 2.4.4 | Link Purpose | A | ⚠️ | Descriptive link text in content |
| 2.4.5 | Multiple Ways | AA | ✅ | Nav + ⌘K search |
| 2.4.6 | Headings and Labels | AA | ✅ | `PageHeader`, format hints, icon labels |
| 2.4.7 | Focus Visible | AA | ✅ | `focus-visible:ring-*` on primitives |
| 2.5.1 | Pointer Gestures | A | ⚠️ | DnD: `KeyboardSensor` on dashboard canvas |
| 2.5.2 | Pointer Cancellation | A | ✅ | Native buttons |
| 2.5.3 | Label in Name | A | ✅ | Visible label ⊆ accessible name |
| 2.5.4 | Motion Actuation | A | ➖ | No shake/tilt in DS |

**WCAG 2.2 (adopted):** **2.5.8** Target Size — **24×24** min (`exxat-accessibility.mdc`); **44px** on coarse pointer mobile (`globals.css`).

## 3. Understandable

| SC | Name | Lvl | Status | DS / test |
|----|------|-----|--------|-----------|
| 3.1.1 | Language of Page | A | ✅ | `<html lang="en">` |
| 3.1.2 | Language of Parts | AA | ⚠️ | `lang` on foreign phrases in content |
| 3.2.1 | On Focus | A | ✅ | No focus-triggered navigation |
| 3.2.2 | On Input | A | ⚠️ | No select→navigate without warning |
| 3.2.3 | Consistent Navigation | AA | ✅ | `AppSidebar` / product nav |
| 3.2.4 | Consistent Identification | AA | ✅ | Shared icons/labels |
| 3.3.1 | Error Identification | A | ✅ | `FormMessage`, `aria-invalid` |
| 3.3.2 | Labels or Instructions | A | ✅ | Persistent `FormDescription` |
| 3.3.3 | Error Suggestion | AA | ⚠️ | Actionable error copy |
| 3.3.4 | Error Prevention | AA | ⚠️ | Confirm on destructive / legal |

## 4. Robust

| SC | Name | Lvl | Status | DS / test |
|----|------|-----|--------|-----------|
| 4.1.1 | Parsing | A | ⚠️ | Valid React/HTML; optional W3C validator |
| 4.1.2 | Name, Role, Value | A | ✅ | Radix + shadcn patterns |
| 4.1.3 | Status Messages | AA | ⚠️ | `aria-live` / banners (no toast) |

---

## Shell alignment (secondary panel)

The **system banner** must render inside **`[data-app-shell-main]`** only. A full-width banner above the shell row pushes the library secondary rail down while the primary sidebar stays `fixed` to the viewport — visible as a top gap on the Library panel.

**Reference:** `apps/web/src/App.tsx`, `system-banner-slot.tsx`, `nested-secondary-panel-shell.tsx`.

---

## Reference routes for regression

| Surface | Route |
|---------|--------|
| Library + secondary rail | `/prism/library/all` |
| List hub | `/prism/placements` |
| Settings + contrast | `/settings/profile` |
| Exam lock shortcuts | `/prism/exam-lock` (showcase) |

---

*Binding: `.cursor/rules/exxat-accessibility.mdc` · Ship gate: `accessibility-ship-checklist.md`*
