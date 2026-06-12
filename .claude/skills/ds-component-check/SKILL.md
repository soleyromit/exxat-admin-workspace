---
name: ds-component-check
description: Use BEFORE writing any DS import in a .tsx file. Verifies the component exists in the installed @exxatdesignux/ui (read live via `node tools/ds/source.mjs`), surfaces the correct import path + props/variants + the live localhost:4000/library URL. Prevents hallucinated APIs and incorrect substructure (e.g., raw <button> inside <Sidebar>, fontSize literals, wrong nav nesting).
---

# DS Component Check — Pre-flight Skill

Run this skill BEFORE generating any DS import statement or component composition. It's the human-side complement to DS-010 (PreToolUse hook blocks hallucinated imports; this skill prevents you from authoring them in the first place).

---

## When to use

| Situation | Use this skill? |
|---|---|
| Writing a new import from `@exxatdesignux/ui` | YES |
| Writing a new import from `@exxat/student/components/ui/<name>` | YES |
| Writing a new import from `@exxat/student/components/shared` | YES |
| Composing a Sidebar / Breadcrumb / Tabs / Sheet / Dialog | YES — substructure matters (A11Y-009) |
| Setting `fontSize` / `fontFamily` / `fontWeight` (would violate DS-011) | YES — surface the correct token instead |
| Importing a hook (`useAppTheme`, `useMobile`) | YES |
| Editing existing imports without changes | NO — DS-010 hook validates on write |

## What this skill does

### Step 1 — Resolve the active DS profile

Determine profile from current cwd:

```
cwd contains /apps/<product>/admin/   → profile = admin (uses Exxat-DS)
cwd contains /apps/<product>/student/ → profile = student (uses StudentUX)
cwd contains /apps/<product>/assessment-taker/ → profile = admin (exception per CLAUDE.md)
```

If no product context, ask user.

### Step 2 — Read the REAL package (not a snapshot)

Source of truth is the **installed `@exxatdesignux/ui`** package, read live — never a hand-maintained snapshot (those drift; the old `ds-snapshot.json` was deleted for exactly that reason).

For **admin** — run the source tool:
```bash
node tools/ds/source.mjs <Component...>   # real exports + props/variants/sizes from dist/*.d.ts
node tools/ds/source.mjs --list           # every importable name from @exxatdesignux/ui
```
It prints the exact import, the live `localhost:4000/library/<id>` URL, and the real type surface. A name not in `--list` does not exist in the DS.

For **student** (`@exxat/student`): read the real source directly — `studentUX/src/components/ui/` for primitives and `studentUX/src/components/shared/` for shared exports.

### Step 3 — Verify the component exists

Before writing `import { Foo } from '...'`, check:

| Profile | Path | Allowlist source |
|---|---|---|
| admin | `@exxatdesignux/ui` | `node tools/ds/source.mjs --list` |
| student primitive | `@exxat/student/components/ui/<name>` | `student.primitives[<name>].exports` |
| student shared | `@exxat/student/components/shared` | `student.shared` |

If `Foo` not in allowlist → **don't write the import.** Either:
- Find the correct DS component name (run `node tools/ds/source.mjs --list` and grep, or `node tools/ds/source.mjs Foo` for a did-you-mean)
- Build a **product feature component** locally if no DS equivalent exists
- Use `/intake` to file an override + propose adding it to DS

### Step 4 — Verify nav substructure (A11Y-009)

For Sidebar / Breadcrumb / Tabs / Sheet / Dialog, the substructure is non-trivial. Cross-check against the profile doc before composing.

**Sidebar (admin):**
```tsx
<SidebarProvider className="h-svh">           {/* required */}
  <Sidebar variant="inset" collapsible="icon"> {/* required */}
    <SidebarHeader>…</SidebarHeader>
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>…</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton>…</SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
    <SidebarFooter>…</SidebarFooter>
  </Sidebar>
  <SidebarInset className="flex flex-col overflow-hidden">
    {children}
  </SidebarInset>
</SidebarProvider>
```

**Breadcrumb (admin):**
```tsx
<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem><BreadcrumbLink href="…">…</BreadcrumbLink></BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem><BreadcrumbPage>…</BreadcrumbPage></BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>
```

**Tabs (admin):**
```tsx
<Tabs value={…} onValueChange={…}>
  <TabsList variant="line">    {/* or default for pill style */}
    <TabsTrigger value="a">A</TabsTrigger>
  </TabsList>
  <TabsContent value="a">…</TabsContent>
</Tabs>
```

**Dialog (admin):**
```tsx
<Dialog open={…} onOpenChange={…}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>…</DialogTitle>            {/* required — A11Y-006 */}
      <DialogDescription>…</DialogDescription>
    </DialogHeader>
    {/* body */}
    <DialogFooter>…</DialogFooter>
  </DialogContent>
</Dialog>
```

Skipping levels (e.g., `<Sidebar><SidebarMenuItem>…` without SidebarContent + SidebarMenu wrappers) breaks keyboard nav and screen-reader semantics.

### Step 5 — Verify typography (DS-011)

Never write inline `fontSize / fontFamily / fontWeight` literals. Use:

| Need | Use |
|---|---|
| Heading font | `className="font-heading"` (admin) or `var(--font-heading)` |
| Body font | `className="font-sans"` or default |
| Specific size | Tailwind `text-xs` / `text-sm` / `text-base` / `text-lg` etc. |
| Specific weight | `font-light` / `font-normal` / `font-medium` / `font-semibold` / `font-bold` |
| Token reference | `style={{ fontSize: 'var(--text-xs)' }}` (acceptable — DS-011 only blocks raw literals) |

### Step 6 — Surface the result

After verification, generate the import + composition. The DS-010 PreToolUse hook double-checks before write succeeds.

### Step 7 — Telemetry

Emit a `skill.invocation` event per `docs/telemetry/README.md`:

```bash
python3 -c "import sys; sys.path.insert(0, '/Users/romitsoley/Work/.claude/hooks'); \
  from _telemetry import emit; emit('skill.invocation', skill='ds-component-check', \
  action='verify-import', outcome='completed')"
```

If verification fails (component not in snapshot), use `outcome='blocked'`.

## Skip the skill when

- Editing existing code without adding new imports
- Writing files outside `apps/**/*.tsx`
- The DS source itself (forbidden by DS-006 anyway)

## Anti-patterns

- ❌ Writing a DS import without checking the snapshot first → DS-010 hook will block, but you waste the round-trip
- ❌ Composing Sidebar/Breadcrumb/Tabs/Dialog from memory without checking the template
- ❌ Inline `fontSize: '13px'` because "it's just a quick tweak" — DS-011 blocks
- ❌ Cross-profile imports (admin file importing from `@exxat/student`) — DS-007 blocks
- ❌ Searching old source files instead of the snapshot — `@exxatdesignux/ui` npm package is now the source of truth

## Output to the conversation

After running this skill, surface (briefly):
- "Verified: <component> exists in <profile> snapshot"
- "Substructure: see <profile.md> template" (if applicable)
- "Tokens to use: <relevant tokens>" (if applicable)

Then proceed with the import + composition.
