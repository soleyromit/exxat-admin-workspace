# Exxat DS: Avatar pattern

**Audience:** engineers + AI agents. **Binding rule:** [`.cursor/rules/exxat-person-identity-display.mdc`](../../.cursor/rules/exxat-person-identity-display.mdc).

`Avatar` identifies **known people** with photo, initials fallback, presence, verified overlay, and non-overlapping group rows.

**Job:** Recognize a person at a glance and support stacked identity (name, email) on product surfaces.

---

## When to use

| Surface | Show | Skip |
|---------|------|------|
| Dedicated person column | Avatar + name + email | |
| PageHeader collaborator rail | AvatarGroup + Tip per face | |
| Board / kanban card | Avatar + name only | Email line |
| Icon-only rail | Avatar + Tip (name + email) | |
| Ask Leo chrome | AvatarLeoAssistant only | On generic users |

---

## MUST requirements

- **MUST** pair avatars with visible name on person surfaces; email on a muted second line when not dense.
- **MUST** use `AvatarGroup` with gap. Never overlap `-space-x-*` piles.
- **MUST** wrap each face and `AvatarGroupCount` in `Tip` with person names.
- **MUST** pass `label` to `AvatarStatus` (sr-only status text).
- **MUST NOT** show email as the only visible identifier when a display name exists.

---

## Composition example

```tsx
<div className="flex min-w-0 items-center gap-2">
  <AvatarInitials initials={initialsFromDisplayName(name)} decorative />
  <div className="min-w-0">
    <p className="truncate text-sm font-medium">{name}</p>
    <p className="truncate text-xs text-muted-foreground">{email}</p>
  </div>
</div>

<AvatarGroup>
  {people.slice(0, 3).map((p) => (
    <Tip key={p.id} label={p.name}>
      <AvatarInitials initials={p.initials} decorative />
    </Tip>
  ))}
  <Tip label={hiddenNames}>
    <AvatarGroupCount aria-label={`${hidden} more`}>+{hidden}</AvatarGroupCount>
  </Tip>
</AvatarGroup>
```

---

## See also

- **Primitive:** [`packages/ui/src/components/ui/avatar.tsx`](../../packages/ui/src/components/ui/avatar.tsx)
- **Rule:** [`.cursor/rules/exxat-person-identity-display.mdc`](../../.cursor/rules/exxat-person-identity-display.mdc)
- **Related:** `people-avatar-rail-cell`, `page-header`, `tip`
