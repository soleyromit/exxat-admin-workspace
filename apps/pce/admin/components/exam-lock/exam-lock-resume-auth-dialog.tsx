"use client"

/**
 * ExamLockResumeAuthDialog — proctor password gate after Retry on a hard pause.
 * Demo default code is `proctor`. Production would verify against the session API.
 */

import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldLabel } from "@/components/ui/field"
import {
  FloatingSheetPanel,
  FloatingSheetPanelBody,
  FloatingSheetPanelContent,
  FloatingSheetPanelFooter,
  FloatingSheetPanelHeader,
  FloatingSheetPanelToolbar,
} from "@/components/ui/floating-sheet-panel"
import { Input } from "@/components/ui/input"

/** Demo-only resume code. Replace with session/proctor verification in production. */
export const EXAM_LOCK_DEMO_PROCTOR_PASSWORD = "proctor"

export interface ExamLockResumeAuthDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Called after a valid password. Parent should resume the session. */
  onAuthorized: () => void
  /** Expected password. Defaults to the demo proctor code. */
  expectedPassword?: string
}

export function ExamLockResumeAuthDialog({
  open,
  onOpenChange,
  onAuthorized,
  expectedPassword = EXAM_LOCK_DEMO_PROCTOR_PASSWORD,
}: ExamLockResumeAuthDialogProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [password, setPassword] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [instructionsOpen, setInstructionsOpen] = React.useState(false)

  React.useEffect(() => {
    if (!open) {
      setInstructionsOpen(false)
      return
    }
    setPassword("")
    setError(null)
  }, [open])

  React.useEffect(() => {
    if (!open || instructionsOpen) return
    const id = window.requestAnimationFrame(() => inputRef.current?.focus())
    return () => window.cancelAnimationFrame(id)
  }, [instructionsOpen, open])

  const submit = React.useCallback(
    (event?: React.FormEvent) => {
      event?.preventDefault()
      if (password === expectedPassword) {
        setError(null)
        onOpenChange(false)
        onAuthorized()
        return
      }
      setError("Incorrect password. Ask your proctor for the resume code.")
      inputRef.current?.select()
    },
    [expectedPassword, onAuthorized, onOpenChange, password],
  )

  return (
    <>
      <Dialog
        open={open && !instructionsOpen}
        onOpenChange={(nextOpen) => {
          if (!instructionsOpen) onOpenChange(nextOpen)
        }}
      >
        <DialogContent className="max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Enter proctor password</DialogTitle>
            <DialogDescription>
              A proctor must authorize resume before the exam continues. Your timer stays paused.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <Field data-invalid={error ? true : undefined}>
              <FieldLabel htmlFor="exam-lock-proctor-password">Proctor password</FieldLabel>
              <Input
                ref={inputRef}
                id="exam-lock-proctor-password"
                type="password"
                autoComplete="off"
                value={password}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? "exam-lock-proctor-password-error" : undefined}
                onChange={(event) => {
                  setPassword(event.target.value)
                  if (error) setError(null)
                }}
              />
              {error ? (
                <p
                  id="exam-lock-proctor-password-error"
                  className="text-sm text-destructive-ink"
                  role="alert"
                >
                  {error}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">Demo code: {expectedPassword}</p>
              )}
            </Field>
            <DialogFooter className="flex-col gap-3 sm:flex-row sm:justify-between">
              <Button
                type="button"
                variant="link"
                className="h-auto w-fit self-start p-0 text-sm underline underline-offset-4 sm:self-center"
                onClick={() => setInstructionsOpen(true)}
              >
                View instructions
              </Button>
              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Resume exam</Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <FloatingSheetPanel
        open={open && instructionsOpen}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setInstructionsOpen(false)
        }}
      >
        <FloatingSheetPanelContent contentSlot="exam-lock-resume-instructions">
          <FloatingSheetPanelToolbar />
          <FloatingSheetPanelHeader title="Resume instructions" />
          <FloatingSheetPanelBody className="px-4 pb-4">
            <ol className="space-y-4 text-sm text-foreground">
              {[
                "Keep this exam open. The timer remains paused.",
                "Ask your proctor to review the pause status.",
                "Your proctor enters the resume password.",
                "Select Resume exam to continue.",
              ].map((instruction, index) => (
                <li key={instruction} className="flex gap-3">
                  <span
                    className="flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-foreground ring-1 ring-border"
                    aria-hidden="true"
                  >
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1 leading-relaxed">{instruction}</span>
                </li>
              ))}
            </ol>
          </FloatingSheetPanelBody>
          <FloatingSheetPanelFooter>
            <Button
              type="button"
              className="w-full"
              onClick={() => setInstructionsOpen(false)}
            >
              Return to password
            </Button>
          </FloatingSheetPanelFooter>
        </FloatingSheetPanelContent>
      </FloatingSheetPanel>
    </>
  )
}
