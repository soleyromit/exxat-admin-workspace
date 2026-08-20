# Job: Dedicated search (landing + results)

**Skill:** `.cursor/skills/exxat-dedicated-search-surfaces/SKILL.md`. **Rule:** `.cursor/rules/exxat-dedicated-search-surfaces.mdc`.

---

## Job-to-be-done

Help a user **find something across the product** with a dedicated search experience — empty landing with recents, then results — without polluting the global ⌘K palette or a data hub.

---

## Decision

| Signal | Choose |
|--------|--------|
| Find inside current hub table | Hub toolbar search (⌘K scoped to hub) |
| Global nav + quick actions | `CommandMenu` (⌘K) |
| Long AI answer | Ask Leo (⌘⌥K) |
| **Dedicated search product surface** | `DedicatedSearch*` templates (this job) |

---

## Pattern

Two routes or one route with query split:

| Phase | UX |
|-------|-----|
| **Landing** | Empty `?q=` — recents, suggested scopes, large search input |
| **Results** | Same route with `?q=…` — results header + list/table |

Use **`DedicatedSearchLandingTemplate`** + **`DedicatedSearchResultsHeaderChrome`**.

---

## Checklist

- [ ] Recents persisted via `usePersistedState` / documented key — not raw `localStorage`
- [ ] Product-namespaced persist key when scoped to a product hub
- [ ] Landing and results share search composer behavior
- [ ] No duplicate CommandMenu logic — palette stays global
- [ ] Empty / error / loading on results fetch
- [ ] One H1 on results via header chrome

---

## Ship gate

- [ ] Keyboard: focus search on landing; Esc clears or closes per spec
- [ ] axe on landing + results `<main>`
- [ ] No toast for "no results" — inline empty state

---

## Reference

- Skill: `exxat-dedicated-search-surfaces`
- Pattern: extend `command-menu-pattern.md` for ⌘K vs dedicated search split
