# High Contrast — Style Guidelines (Exxat One)

This document is the **product and design strategy** for high contrast. It sits alongside the compliance-focused [High Contrast & WCAG AA](./high-contrast-wcag-aa.md) doc.

**Triggers in the app**

| Mechanism | HTML / CSS |
|-----------|------------|
| Manual toggle | `html[data-contrast="high"]` (Profile → Appearance → Contrast → High contrast) |
| OS “Increase contrast” | `@media (prefers-contrast: more)` (unless user chose Default and we set `data-contrast="off"`) |
| Windows High Contrast | `@media (forced-colors: active)` — system palette; see WCAG doc |

---

## Why High Contrast Matters (Beyond Compliance)

Research and practice show high contrast helps **all** users, not only those with permanent low vision:

1. **Cognitive load** — Strong contrast clarifies **visual hierarchy**: primary actions (e.g. “Submit clinical hours”) read as primary without scanning the whole screen.
2. **Situational use** — Bright environments (e.g. tablet in a hospital corridor), glare, and lower-quality displays all reduce perceived contrast; a high-contrast theme compensates.
3. **Reading performance** — Body text at **≥ 4.5:1** (AA) supports faster, more accurate reading for dense clinical and scheduling content.

---

## High Contrast vs Dark Mode

| | **Dark mode** | **High contrast** |
|---|----------------|-------------------|
| **Purpose** | Comfort in low light; often aesthetic | **Legibility** and boundary clarity |
| **Palette** | Mid grays, soft surfaces | Strong foreground/background split; **borders over soft fills** |
| **Decorative chrome** | Gradients, soft shadows often kept | **Reduced or removed** in our manual/OS contrast modes; system strips them in **forced-colors** |

Do not treat “dark” and “high contrast” as interchangeable in specs or QA.

---

## Strategic Implementation Patterns (Exxat)

### 1. Forced-colors mindset (even outside Windows HCM)

Modern OS high contrast **removes non-essential styling** (gradients, many shadows). We mirror that in `data-contrast="high"` / `prefers-contrast: more`:

- **Remove / hide** decorative **brand gradients** behind metrics and cards (`data-slot="brand-gradient"` is suppressed).
- **Prefer borders over fills** for “card shape” where possible: cards use a **2px** border token in high contrast.
- **Drop elevation shadows** for floating surfaces; rely on **border + ring** so affordances survive when `box-shadow` is forced to `none` (Windows HCM).

### 2. Don’t rely on color alone

- **Errors:** Use **icon + text + thick border** (not red fill only). Align with existing `aria-invalid` patterns on inputs.
- **Charts / dashboards:** Use **patterns, dash styles, or labels** in addition to `chart-1` … `chart-5` colors. See [Patterns](./patterns.md) and chart components when adding new series.
- **Links:** Already **underlined by default** in global styles — keep that in high contrast.

### 3. Elevation in high contrast

- **Modals / sheets / popovers:** Clear **border**; no reliance on shadow-only separation.
- **Focus:** Keep **visible focus ring** (3:1+); in **forced-colors**, use system `Highlight` (implemented in `globals.css`).

### 4. Luminance and “vibration”

- **Test in grayscale** — If hierarchy fails in black and white, contrast strategy is insufficient.
- **Avoid hue-only contrast** — Red-on-blue (etc.) can **vibrate** even when hue differs; prioritize **luminance** separation for text and critical UI.

---

## Pro Checklist (Design & Code Review)

- [ ] Critical paths readable at **100% zoom** with high contrast on.
- [ ] **No information conveyed by gradient or shadow alone**.
- [ ] **Cards and dialogs** have visible **borders** in high contrast.
- [ ] **Charts** distinguish series by **more than color** where feasible.
- [ ] **Error states** include **non-color** cues (icon, text, border).
- [ ] Verified in **grayscale** (browser devtools or preview filter).
- [ ] **Windows HCM** and **macOS Increase contrast** spot-checked for main flows.

---

## Implementation Map (Codebase)

| Guideline | Where it lives |
|-----------|----------------|
| Token overrides (text, borders, ring, tabs, inputs) | `src/styles/globals.css` — `html[data-contrast="high"]`, `prefers-contrast: more` |
| Strip brand gradients | `globals.css` hides `[data-slot="brand-gradient"]` |
| Stronger cards, no shadow utilities | `globals.css` — `[data-slot="card"]`, `.shadow-*` under high contrast |
| Forced colors (Windows) | `globals.css` — `@media (forced-colors: active)` |
| Toggle wiring | `top-nav-profile.tsx`, `nav-user.tsx`, `App.tsx` |

When adding **new** decorative backgrounds or heavy shadows, either:

- mark decorative layers with `data-slot="brand-gradient"` (or a documented slot), **or**
- add a high-contrast exception in `globals.css` with a short comment linking here.

---

## References

- [High Contrast & WCAG AA](./high-contrast-wcag-aa.md) — criteria, tokens, forced-colors
- [Accessibility](./accessibility.md) — WCAG AA behavior
- [WCAG 1.4.11 Non-text contrast](https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast.html)
- [MDN: forced-colors](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/forced-colors)
