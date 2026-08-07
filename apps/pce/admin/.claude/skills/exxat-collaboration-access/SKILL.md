---
name: exxat-collaboration-access
description: Shared hub collaboration — PageHeader face rail, InviteCollaboratorsDrawer, library access vs directory role tags. Use when adding invite people, access roster, or collaboration variant headers.
user-invocable: true
---

# Exxat DS — collaboration & access

**Handbook:** `apps/web/AGENTS.md` §4.7  
**Narrative:** `apps/web/docs/collaboration-access-pattern.md`  
**Cursor rule:** `.cursor/rules/exxat-collaboration-access.mdc`  
**Related (Library folder scope + ⋯ Customize folder):** `.cursor/rules/exxat-library-hub-header.mdc` · `docs/library-hub-header-pattern.md`

## Wiring checklist

1. **`PageHeaderCollaborator`** — `name`, `email`, `access`, optional `roles[]`, avatar fields (`components/page-header.tsx`).
2. **Mock/API** — `lib/mock/<entity>-header-collaborators.ts`; one shape for header + invite sheet.
3. **Entity header** — `variant="collaboration"`; **Invite people** first in **⋯ More**; pass **`onAddCollaborator`** and **`onCollaboratorsOpen`**.
4. **Hub client** — **`CollaborationAccessFlow`** (preferred) or `collaborators` + `inviteOpen` + **`InviteCollaboratorsDrawer`**; on invite, append to **`collaborators`**.
5. **Access maps** — `lib/collaborator-access.ts` for Owner / Editor / Commenter / Viewer, invite options, and **`COLLABORATION_HEADER_ADD_LABEL`**.
6. **Header** — empty roster → outline **Add collaborator**; non-empty → face rail; both open the invite sheet.
7. **Invite sheet** — `InviteCollaboratorsDrawer`: export-style **`Sheet`**, combined email + access menu, grouped roster (name → email → role tags → access badge).
8. **Library — folder URL scope** — When **`?scope=folder`**, **`LibraryPageHeader`** **⋯** also lists **Customize folder**; **`LibraryNewFolderSheet`** on **`LibraryClient`** — **`.cursor/rules/exxat-library-hub-header.mdc`**, **`docs/library-hub-header-pattern.md`**.

## MUST NOT

- A second invite control beside a populated face rail.
- Per-hub access label forks or parallel collaborator types.
- Toast/snackbar for invite outcomes (**`exxat-no-toast.mdc`**).
- **`Select`** in **`InputGroupAddon`** for access inside the sheet.

## Reference

- `components/collaboration-access-flow.tsx`, `components/library-page-header.tsx`, `components/library-client.tsx`
- `components/invite-collaborators-drawer.tsx`, `components/export-drawer.tsx`
