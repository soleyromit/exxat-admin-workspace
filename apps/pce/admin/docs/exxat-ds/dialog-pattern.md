# Exxat DS: Dialog pattern

**Audience:** engineers + AI agents. **Binding rule:** [`.cursor/rules/exxat-drawer-vs-dialog.mdc`](../../.cursor/rules/exxat-drawer-vs-dialog.mdc).

`Dialog` forces user attention to critical decisions or blocking tasks. Use for destructive actions, errors, and focused forms that must be resolved before continuing.

**Job:** Force attention to critical decision that blocks workflow continuation.

---

## When to use

| Surface | Use Dialog | Use Sheet Instead |
|---------|------------|-------------------|
| Delete confirmation | ✓ Destructive, requires explicit choice | |
| Blocking error | ✓ Prevents continuation | |
| Quick add form (1-3 fields) | ✓ Focused task completion | |
| Authentication gate | ✓ Blocks access | |
| Properties panel | | ✓ Non-destructive context |
| Export options | | ✓ Maintains navigation |
| Multi-step workflow | | ✓ Use Wizard in route |
| Content preview | | ✓ Keeps context visible |

---

## MUST requirements

- **MUST** include `DialogTitle` for screen reader navigation.
- **MUST** use specific action labels ('Delete Student', not 'OK').
- **MUST** place primary action on right in footer.
- **MUST** auto-focus primary action or first form field.
- **MUST NOT** stack dialogs. Use sequential flow instead.
- **MUST NOT** use for success messages. Use LocalBanner per exxat-no-toast.

## MUST NOT anti-patterns

- **Never** use generic button labels ('Submit', 'OK').
- **Never** put complex forms or long content in dialogs.
- **Never** show success confirmations in dialogs.
- **Never** stack multiple dialogs.

---

## Composition example

```tsx
<Dialog>
  <DialogTrigger asChild>
    <Button variant="destructive">Delete Student</Button>
  </DialogTrigger>
  <DialogContent showCloseButton={false}>
    <DialogHeader>
      <DialogTitle>Delete student record?</DialogTitle>
      <DialogDescription>
        This will permanently remove Sarah Chen from Clinical Rotations. 
        This action cannot be undone.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <DialogClose asChild>
        <Button variant="outline">Cancel</Button>
      </DialogClose>
      <Button variant="destructive" onClick={handleDelete}>
        Delete Student
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

## See also

- **Pattern:** [Sheet vs Dialog decision tree](./drawer-vs-dialog-pattern.md)
- **Primitive:** [`packages/ui/src/components/ui/dialog.tsx`](../../packages/ui/src/components/ui/dialog.tsx)
- **Rule:** [`.cursor/rules/exxat-drawer-vs-dialog.mdc`](../../.cursor/rules/exxat-drawer-vs-dialog.mdc)
