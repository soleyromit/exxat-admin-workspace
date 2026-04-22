# Prompt Template Library

> AI-ready prompts for building Exxat One UI from natural language. For PMs, designers, and developers.

---

## How to Use

1. **Find** the prompt template that matches your task (see files below)
2. **Fill** in the `[variable]` placeholders with your specifics
3. **Paste** into Claude Code, Cursor, or any AI assistant
4. **Iterate** using component-level prompts to refine the output

The AI will automatically apply:
- Correct component selection (PrimaryPageTemplate, DataTable, etc.)
- Design tokens (no hardcoded colors)
- Product conventions (dates, navigation, specialization rules)
- Accessible markup
- Mock data generation

---

## Files

| File | What it covers |
|------|---------------|
| `quick-reference.md` | One-page cheat sheet — fastest way to get started |
| `creating-pages.md` | Full page prompts: list, report, detail, dashboard section |
| `creating-components.md` | Component-level: add column, filter, metric, section, chart |

---

## In-App Prompt Builder

The **Design System page** (sidebar → Design System → Prompt Library tab) has an interactive version of these prompts with:
- Variable fill-in fields
- "Load examples" button
- Live preview of resolved prompt
- One-click copy

Use the in-app builder when you want to fill variables interactively before copying.

---

## Quick Examples

### "Create a page to list and manage preceptors"
→ Use `creating-pages.md` → **Template 1: List Page**

### "Add a compliance percentage column to the Student Schedule table"
→ Use `creating-components.md` → **Add a Column to DataTable**

### "We need an analytics page for compliance trends"
→ Use `creating-pages.md` → **Template 2: Report Page**

### "Add an empty state when there are no students in the Upcoming tab"
→ Use `creating-components.md` → **Add an Empty State**

### "Add a 'Confirmation Rate' metric to the Slots page"
→ Use `creating-components.md` → **Add a Metric Card**
