"use client"

import type { ComponentDocSpec } from "@/lib/design-system/component-doc-types"

/** Auto-authored by `pnpm ds:doc:author dialog`. Live previews: design-system-previews.tsx */
export const dialogComponentDoc: ComponentDocSpec = {
  slug: "dialog",
  summary: "Modal dialog and alert dialog for destructive actions, confirmations, and focus-breaking tasks.",
  sections: [],
  anatomy: [
    { part: "Dialog", description: "Root context provider managing open state and focus trap" },
    { part: "DialogTrigger", description: "Button or element that opens the dialog" },
    { part: "DialogOverlay", description: "Backdrop with blur and dim effect" },
    { part: "DialogContent", description: "Modal container with close button and animations" },
    { part: "DialogHeader", description: "Title and description section" },
    { part: "DialogTitle", description: "Primary heading for screen reader navigation" },
    { part: "DialogDescription", description: "Supporting context text" },
    { part: "DialogFooter", description: "Action buttons with optional close button" },
    { part: "DialogClose", description: "Trigger to close dialog programmatically" },
  ],
  api: [
    { prop: "showCloseButton", type: "boolean", defaultValue: "true", description: "Show X button in top-right corner (false for alert dialogs)" },
    { prop: "overlayClassName", type: "string", description: "Custom styles for backdrop (e.g. Bg-transparent for no dim)" },
  ],
  ux: {
    job: "Force user attention to a critical decision or blocking task that must be resolved before continuing.",
    budgets: [
      { label: "Max content height", value: "80vh", rationale: "Prevent viewport overflow; use Sheet for tall content" },
      { label: "Max width", value: "sm (24rem)", rationale: "Keep focus tight; wider content belongs in dedicated routes" },
      { label: "Stacking limit", value: "1 dialog", rationale: "Never stack dialogs; use sequential flow or route navigation" },
    ],
    principles: ["P1", "P2", "P3", "P6", "P7"],
    modernReferences: [
      "Stripe payment confirmation (M4, M6)",
      "Linear issue deletion (M1, M4)",
      "Figma destructive action confirm (M1, M3)",
    ],
    patternDoc: "apps/web/docs/dialog-pattern.md",
    rulePath: ".cursor/rules/exxat-drawer-vs-dialog.mdc",
    whenToUse: [
      "Destructive actions requiring explicit confirmation (delete student, archive program)",
      "Blocking errors that prevent workflow continuation (network failure, validation errors)",
      "Critical alerts requiring immediate acknowledgment (session expiring, data conflicts)",
      "Simple forms with 1-3 fields that complete a focused task (quick add, rename)",
      "Authentication flows that gate access (login, MFA verification)",
    ],
    whenNotToUse: [
      "Non-destructive context actions. Use Sheet for properties, export, invite flows",
      "Multi-step workflows. Use Wizard in dedicated route or Sheet for simple sequences",
      "Content preview or detail views. Use Sheet to maintain navigation context",
      "Success confirmations. Use LocalBanner with undo action per exxat-no-toast",
      "Help content or tutorials. Use dedicated help routes or contextual tips",
    ],
  },
  guidelines: {
    do: [
      "Use DialogTitle for screen reader navigation and focus management",
      "Include DialogDescription for context beyond the title",
      "Place primary action on the right in DialogFooter (destructive = danger variant)",
      "Use showCloseButton={false} for alert dialogs requiring explicit choice",
      "Provide keyboard shortcuts for common actions (Enter = confirm, Escape = cancel)",
      "Auto-focus the primary action button or first form field on open",
    ],
    dont: [
      "Stack multiple dialogs. Use sequential flow or route to next step",
      "Use for non-blocking notifications. Use LocalBanner instead per P6",
      "Put complex forms or long content. Use dedicated route or Sheet",
      "Show success messages in dialogs. Use optimistic UI + undo banner",
      "Use generic 'OK' or 'Submit'. Be specific like 'Delete Student' or 'Save Changes'",
    ],
  },
  accessibility: [
    {
      principle: "perceivable",
      criterion: "1.3.1",
      criterionTitle: "Info and Relationships",
      level: "A",
      guidance:
        "DialogContent uses role=dialog; DialogTitle and DialogDescription wire aria-labelledby and aria-describedby.",
    },
    {
      principle: "operable",
      criterion: "2.1.1",
      criterionTitle: "Keyboard",
      level: "A",
      guidance:
        "Focus is trapped inside the dialog while open; Tab cycles within; Escape closes unless showCloseButton={false} for alerts.",
    },
    {
      principle: "operable",
      criterion: "2.4.3",
      criterionTitle: "Focus Order",
      level: "A",
      guidance: "On open, focus moves to the first field or primary action; on close, focus returns to the trigger.",
    },
    {
      principle: "operable",
      criterion: "2.4.7",
      criterionTitle: "Focus Visible",
      level: "AA",
      guidance: "Footer actions and the close control keep visible focus rings.",
    },
    {
      principle: "understandable",
      criterion: "2.4.6",
      criterionTitle: "Headings and Labels",
      level: "AA",
      guidance:
        "DialogTitle names the modal; action buttons use specific labels (Delete student), not generic OK or Submit.",
    },
    {
      principle: "understandable",
      criterion: "3.3.2",
      criterionTitle: "Labels or Instructions",
      level: "A",
      guidance: "DialogDescription carries destructive context and consequences before the user confirms.",
    },
    {
      principle: "robust",
      criterion: "4.1.2",
      criterionTitle: "Name, Role, Value",
      level: "A",
      guidance: "Open state is exposed to assistive tech; do not remove Radix dialog semantics when styling.",
    },
  ],
  relatedSlugs: ["sheet", "button", "local-banner", "wizard", "field", "tip"],
}
