---
description: Shared hubs — collaboration header, invite sheet, library access vs directory roles
activation: glob
globs: {components,lib,src}/**/*.{tsx,ts},lib/**/*.{tsx,ts}
---

<!-- Synced from .agents/rules/exxat-collaboration-access.mdc - run npx exxat-ui sync-extras after Cursor rule edits -->

# Exxat DS — collaboration & access

**Authoritative detail:** **`./AGENTS.md` §4.7** and **`docs/exxat-ds/collaboration-access-pattern.md`**.

## MUST

1. **Shared hubs** — Use **`PageHeader`** **`variant="collaboration"`** with **`collaborators`** (`PageHeaderCollaborator[]`) and optional **`accessInfo`**.
2. **Header chrome** — **Empty roster:** outline **Add collaborator** (`COLLABORATION_HEADER_ADD_LABEL` / **`addCollaboratorLabel`**) opens the invite sheet. **Non-empty roster:** face rail only; faces and **`+N`** open the same sheet via **`onCollaboratorsOpen`**.
3. **Invite entry** — **⋯ More** → **Invite people** on the entity page header; opens **`InviteCollaboratorsDrawer`** (floating sheet, same family as **`ExportDrawer`**).
4. **State** — Prefer **`CollaborationAccessFlow`** on hub **`*-client.tsx`**; otherwise own **`collaborators`** + **`inviteOpen`**. Successful invite updates **`collaborators`** so the header and sheet roster match.
5. **Library access** — Labels and invite options from **`lib/collaborator-access.ts`**; trailing roster badge = access (Owner / Editor / Commenter / Viewer).
6. **Directory roles** — Optional **`roles`** on **`PageHeaderCollaborator`** as **`Badge variant="outline"`** chips (Faculty, Program coordinator, Director) — **not** library access.
7. **Roster layout** — One bordered list with row dividers; per row: **name**, **email**, role tags, access badge — **not** one card per person.
8. **Invite field** — **`FieldGroup`** + **`Field`**; combined email + access row uses **`InputGroup`** + **`InputGroupInput`** + **`InputGroupAddon`** with shadcn **`Select`** (**`SelectGroup`** / **`SelectItem`**, **`position="popper"`**); persistent **`FieldDescription`** for email format; **no** **`toast()`** (**`exxat-no-toast.md`**).

## MUST NOT

- A second invite control **beside** a populated face rail.
- Fork access enums/labels per hub — extend **`collaborator-access.ts`** once.
- Use **`Select`** inside **`InputGroupAddon`** without **`InputGroupInput`** / **`SelectGroup`**; put email above name in the roster (order is **name → email → role tags**).

## See also

- **`exxat-page-vs-drawer.md`** — invite is a **sheet**, not a new route.
- **`exxat-kbd-shortcuts.md`** — workflow **Cancel** / **Send invite** shortcuts on the sheet.
- **`exxat-library-hub-header.md`** — Library library: when URL is **folder-scoped**, **⋯ More** also includes **Customize folder** (hub client hosts **`LibraryNewFolderSheet`**).
