"use client"

/**
 * The single-sign-on auth step. Mock, like the password step beside it.
 *
 * A real SSO step is a handoff, not a form: the credential is collected by the
 * identity provider on a page this app does not own. So this screen's whole job
 * is to name where you are about to go and let you leave before you go there,
 * which is why it has one button and no fields.
 *
 * The identifier stays visible for the same reason it does on the password step:
 * it is the reason there is a second step at all.
 */

import * as React from "react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export function LoginSsoStep({
  identifier,
  onContinue,
  onChangeIdentifier,
}: {
  identifier: string
  onContinue: () => void
  onChangeIdentifier: () => void
}) {
  const continueRef = React.useRef<HTMLButtonElement>(null)

  // The step swap replaces the whole form, so focus has to be placed or a
  // keyboard user restarts from the top of the document.
  React.useEffect(() => {
    continueRef.current?.focus()
  }, [])

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-balance">
        Continue with single sign-on
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Your organization manages this account. You will finish signing in on their page.
      </p>

      <Card size="sm" className="mt-4 flex-row items-center justify-between gap-3 bg-muted/40">
        <span className="flex min-w-0 items-center gap-2 text-sm">
          <i className="fa-light fa-user shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="truncate font-medium">{identifier}</span>
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="shrink-0"
          onClick={onChangeIdentifier}
        >
          <i className="fa-light fa-arrow-rotate-left" aria-hidden="true" />
          Change
          <span className="sr-only">the username or email you are signing in with</span>
        </Button>
      </Card>

      <div
        className="mt-4"
        onKeyDown={event => {
          if (event.key !== "Escape") return
          event.preventDefault()
          onChangeIdentifier()
        }}
      >
        <Button ref={continueRef} type="button" className="w-full" onClick={onContinue}>
          <i className="fa-light fa-shield-check" aria-hidden="true" />
          Continue to your provider
        </Button>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
        No provider is contacted in this demo. Continue completes the step.
      </p>
    </>
  )
}
