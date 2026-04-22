"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface ProfileEditDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Dialog title — used for aria-labelledby */
  title: string;
  /** "add" or "edit" — affects aria-describedby for context */
  mode: "add" | "edit";
  /** Primary action label. Default: "Save" */
  saveLabel?: string;
  /** Called when Save is clicked. Caller handles validation and close. */
  onSave: () => void;
  /** Optional secondary save action, e.g. save and add another item. */
  onSecondarySave?: () => void;
  /** Label for the secondary save action. */
  secondarySaveLabel?: string;
  /** Whether the form is submitting (disables Save) */
  isSubmitting?: boolean;
  /** Optional error summary to announce to screen readers */
  errorSummary?: string;
  /** Form content */
  children: React.ReactNode;
  /** Optional class for DialogContent */
  className?: string;
}

/**
 * Reusable profile edit/add dialog with ARIA labels, error states, and consistent layout.
 * Use for Address, Membership, Licensure, and other profile sections.
 */
export function ProfileEditDialog({
  open,
  onOpenChange,
  title,
  mode,
  saveLabel = "Save",
  onSave,
  onSecondarySave,
  secondarySaveLabel,
  isSubmitting = false,
  errorSummary,
  children,
  className,
}: ProfileEditDialogProps) {
  const titleId = React.useId();
  const descriptionId = React.useId();
  const errorRegionId = React.useId();

  const ariaDescribedBy = [
    descriptionId,
    errorSummary ? errorRegionId : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={["max-w-lg max-h-[90vh] overflow-y-auto profile-card-dialog-form", className]
          .filter(Boolean)
          .join(" ")}
        aria-labelledby={titleId}
        aria-describedby={ariaDescribedBy || undefined}
      >
        <DialogHeader>
          <DialogTitle id={titleId}>{title}</DialogTitle>
          <p id={descriptionId} className="sr-only">
            {mode === "add" ? `Add new ${title.toLowerCase()}` : `Edit ${title.toLowerCase()}`}
          </p>
        </DialogHeader>

        {errorSummary && (
          <div
            id={errorRegionId}
            role="alert"
            className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {errorSummary}
          </div>
        )}

        <div className="space-y-4 py-2">{children}</div>

        <DialogFooter>
          <Button
            variant="outline"
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Cancel and close dialog"
          >
            Cancel
          </Button>
          {onSecondarySave && secondarySaveLabel && (
            <Button
              variant="outline"
              onClick={onSecondarySave}
              disabled={isSubmitting}
              aria-label={isSubmitting ? "Saving..." : secondarySaveLabel}
            >
              {isSubmitting ? "Saving..." : secondarySaveLabel}
            </Button>
          )}
          <Button
            onClick={onSave}
            disabled={isSubmitting}
            aria-label={isSubmitting ? "Saving..." : saveLabel}
          >
            {isSubmitting ? "Saving..." : saveLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
