# Job: Settings & preferences

**Reference:** `src/views/settings.tsx`, settings drill-in nav in `navigation.tsx`.

---

## Job-to-be-done

Let a user **configure personal or workspace preferences** — appearance, profile, organization — with clear scope (what affects only me vs everyone) and predictable save behavior.

---

## Decision

| Signal | Choose |
|--------|--------|
| Flat list of distinct settings routes | **SidebarDrillIn** under Settings |
| Single preference with few fields | Section on one scroll page |
| Multi-step workspace setup | Focus workflow or wizard route |

---

## Pattern checklist

- [ ] **Scope labeled** — personal vs workspace vs organization in copy and brief
- [ ] **Search** if > ~20 settings rows (future); flat list OK for small sets
- [ ] **Save model** explicit — apply-on-change vs explicit Save button (document in brief)
- [ ] One H1 per settings section via `PageHeader` or section headings (not duplicate page title in body)
- [ ] Destructive workspace actions → `AlertDialog`, not toast

---

## Navigation

- Settings uses **`SidebarDrillIn`** — primary nav replaced by flat settings list with ← Back
- **MUST NOT** use `SecondaryPanel` for a flat settings route list

---

## Ship gate

- [ ] Empty/error/loading for async saves
- [ ] Persistent format hints on fields (`FormDescription`)
- [ ] Keyboard: Save = Enter where applicable; Esc on dialogs
- [ ] No toast for save confirmation — inline status or banner

---

## Rules & skills

| Layer | Path |
|-------|------|
| Nav | `.cursor/skills/exxat-sidebar-nav/SKILL.md` |
| Overlays | `.cursor/skills/exxat-overlays/SKILL.md` |
| Tokens / appearance | `settings-appearance-card.tsx`, `token-taxonomy.md` |
