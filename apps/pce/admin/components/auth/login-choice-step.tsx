"use client"

/**
 * A configurable choice step: whichever question the active flow put here.
 *
 * Picking an app, picking a role, and anything else authored in the flow builder
 * are the same interaction with different words, so one component renders them
 * all from the step's data. Each option is its own button that commits on
 * activation, the way an account chooser works, rather than a radio group plus a
 * Continue. A chooser has no primary option by design: making one of several
 * peers look primary would be a recommendation nobody asked for, and the extra
 * confirm click only asks "are you sure" about a decision that is one click to
 * reverse.
 */

import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  visibleOptions,
  type ChoiceOption,
  type ChoiceStep,
  type FlowRunContext,
} from "@/lib/login-flow"

export function LoginChoiceStep({
  step,
  context,
  identifier,
  onChoose,
  onBack,
}: {
  step: ChoiceStep
  context: FlowRunContext
  identifier: string
  onChoose: (option: ChoiceOption) => void
  onBack: () => void
}) {
  const firstOptionRef = React.useRef<HTMLButtonElement>(null)
  // An option whose condition fails is absent, not disabled. A greyed-out door is
  // an invitation to wonder what you did wrong on a screen with no way to ask.
  const options = visibleOptions(step, context)

  // The step swap replaces the whole form, so focus has to be placed or a
  // keyboard user restarts from the top of the document.
  React.useEffect(() => {
    firstOptionRef.current?.focus()
  }, [step.id])

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-balance">
        {step.heading}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Signed in as <span className="font-medium text-foreground">{identifier}</span>
      </p>

      <ul
        className="mt-6 flex flex-col gap-2"
        onKeyDown={event => {
          if (event.key !== "Escape") return
          event.preventDefault()
          onBack()
        }}
      >
        {options.map((option, index) => (
          <li key={option.id}>
            <Button
              ref={index === 0 ? firstOptionRef : undefined}
              type="button"
              variant="ghost"
              onClick={() => onChoose(option)}
              className="h-auto w-full items-center justify-start gap-3 rounded-lg border border-border bg-card p-3 text-start font-normal hover:border-auth-primary/40 hover:bg-accent"
            >
              <span
                aria-hidden="true"
                className="flex size-9 shrink-0 items-center justify-center rounded-md bg-auth-primary/10 text-auth-ink"
              >
                <i className={option.icon} />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="font-medium">{option.label}</span>
                {option.description ? (
                  <span className="text-sm text-muted-foreground">{option.description}</span>
                ) : null}
              </span>
              <i
                className="fa-light fa-chevron-right shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
            </Button>
          </li>
        ))}
      </ul>

      <Button
        type="button"
        variant="link"
        // See the Forgot Password link: the variant's `text-primary` is a fill
        // inside this surface and is too dark to read as text in dark mode.
        className="mt-4 h-auto w-fit p-0 text-sm text-auth-ink underline underline-offset-4"
        onClick={onBack}
      >
        Back
        <span className="sr-only">to the previous step</span>
      </Button>
    </>
  )
}
