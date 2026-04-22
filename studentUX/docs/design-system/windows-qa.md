# Windows QA Validation

## Recommended Test Environment

Validate the Exxat design system on:

- **OS:** Windows 11
- **Display scaling:** 125% (Settings → Display → Scale)
- **Browser:** Chrome 100% zoom (no browser zoom)

This matches how many enterprise users run the app and aligns with Microsoft Fluent’s guidance on compact scaling and system scaling.

## What to Verify

1. **Density toggle**
   - User menu (Avatar) → Density → Comfortable / Compact
   - Compact reduces control height, table row height, and padding
   - Preference persists across sessions (localStorage)

2. **Layout rail**
   - Primary content max-width 1040px (desktop), 768px (tablet) with 24px gutters; mobile full width with 16px gutters
   - No full-width stretch on wide monitors

3. **Tables**
   - `<DataTable density="compact" />` or global compact mode
   - Row height ~42px in compact vs ~48px in comfortable

4. **Controls**
   - Buttons and inputs use `--control-height` (40px → 36px in compact)
   - No clipping or overflow at 125% scaling

## Reference

- Material Design: [Applying density](https://m3.material.io/foundations/layout/understanding-layout)
- Microsoft Fluent: [Compact sizing](https://fluent2.microsoft.design/design-tokens/compact-sizing/)
