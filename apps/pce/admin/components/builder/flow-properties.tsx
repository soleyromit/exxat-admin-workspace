"use client"

/**
 * The properties pane: whatever one node is selected on the canvas.
 *
 * Exactly one thing is editable at a time, and it is the thing you clicked. That
 * is the fix for the previous builder, where every flow, step, and option could be
 * expanded at once and the page became a wall of fields with no indication of
 * where you were.
 *
 * Nothing here is a surprise: the canvas already told you what this node does, so
 * the pane is only the controls behind that sentence.
 */

import * as React from "react"

import { Button } from "@/components/ui/button"
import { Checkbox, CheckboxLabel } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem, RadioGroupLabel } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { ConditionRows } from "@/components/builder/condition-rows"
import type { CanvasSelection } from "@/components/builder/flow-canvas"
import {
  AUTH_METHOD_LABEL,
  COMMON_LANDING_PATHS,
  GRANTABLE_PRODUCTS,
  WORKSPACE_ROLES,
  createChoiceOption,
  flowSession,
  reachesEnd,
  type AuthMethod,
  type ChoiceOption,
  type ChoiceStep,
  type FlowSession,
  type FlowStep,
  type LoginFlowDefinition,
  type WorkspaceRole,
} from "@/lib/login-flow"
import { isStudentHomePath } from "@/lib/student-shell"
import type { Product } from "@exxatdesignux/product-framework"

/** `Select` values are strings, so "no product" needs a stand-in. */
const NO_PRODUCT = "none"
/** Likewise "this branch names nobody, so the flow's own role stands". */
const FLOW_ROLE = "flow"

/**
 * What each role costs, in the terms the author is about to check.
 *
 * Member and student read differently on purpose. Both deny the console, but a
 * member is staff who simply has no console, while a student is why the choice is
 * a choice: there is no way to tick administrator back on for them.
 */
const ROLE_HINT: Record<WorkspaceRole, string> = {
  administrator: "Gets the Administrator console: the home tile, the switcher row, and /admin.",
  member: "No Administrator console. The tile and the switcher row go, and /admin sends them home.",
  student: "Never administers. The console is closed to students whatever else this flow grants.",
}

/**
 * What the window is titled. The title lives in the window chrome rather than the
 * body, so the node you picked is named once, in the place that stays put while
 * you scroll the fields.
 */
export function selectionLabel(
  flow: LoginFlowDefinition,
  selection: CanvasSelection,
): { title: string; meta: string } | null {
  if (selection.kind === "flow") return null
  if (selection.kind === "session") {
    return { title: "Signed in", meta: "What this flow hands the session" }
  }
  const index = flow.steps.findIndex(step => step.id === selection.stepId)
  const step = flow.steps[index]
  if (!step) return null

  if (selection.kind === "option" && step.kind === "choice") {
    const option = step.options.find(current => current.id === selection.optionId)
    if (option) {
      return {
        title: option.label || "Untitled branch",
        meta: `Branch of "${step.heading}"`,
      }
    }
  }
  return {
    title: step.kind === "auth" ? AUTH_METHOD_LABEL[step.method] : "Choice",
    meta: `Step ${index + 2}`,
  }
}

/**
 * The delete action for whatever is selected, as a value rather than a callback.
 *
 * Pure so the window chrome can render the button, its label, and its reason for
 * being disabled without knowing which kind of node it is looking at, and without
 * the pane and the chrome each holding half of the same edit.
 */
export function deleteTarget(
  flow: LoginFlowDefinition,
  selection: CanvasSelection,
): {
  label: string
  disabledReason: string | null
  next: LoginFlowDefinition
  nextSelection: CanvasSelection
} | null {
  // Neither the flow nor the end of it is a thing you can remove: every flow ends
  // somewhere, so the session node has settings but no delete.
  if (selection.kind === "flow" || selection.kind === "session") return null
  const index = flow.steps.findIndex(step => step.id === selection.stepId)
  const step = flow.steps[index]
  if (!step) return null

  if (selection.kind === "option" && step.kind === "choice") {
    const remaining = step.options.filter(option => option.id !== selection.optionId)
    return {
      label: "Delete branch",
      // Two is what makes it a choice. One branch is a question with one answer.
      disabledReason: remaining.length >= 2 ? null : "A choice needs at least two branches",
      next: {
        ...flow,
        steps: flow.steps.map((current, i) =>
          i === index ? { ...step, options: remaining } : current,
        ),
      },
      nextSelection: { kind: "step", stepId: step.id },
    }
  }

  return {
    label: "Delete step",
    disabledReason: null,
    next: { ...flow, steps: flow.steps.filter((_, i) => i !== index) },
    nextSelection: { kind: "flow" },
  }
}

/**
 * What the flow hands the session: which apps, where it lands, and which of the
 * home sections it asks for.
 *
 * Checkboxes rather than switches for all of it. A switch in this design system
 * labels itself "On" or "Off", so three of them in a column would announce as
 * three controls with the same name; a checkbox takes its name from the label
 * beside it, which is what a properties form wants anyway.
 *
 * "Apps" is a set rather than a single select because two apps is a real answer:
 * a student with Clinical Education and Exxat One is not the same person as a
 * student with one of them, and the old single-grant field could not say it.
 */
function SessionPane({
  flow,
  onChangeFlow,
}: {
  flow: LoginFlowDefinition
  onChangeFlow: (next: LoginFlowDefinition) => void
}) {
  const session = flowSession(flow)
  const branchesDecide = !reachesEnd(flow)

  function update(next: Partial<FlowSession>) {
    onChangeFlow({ ...flow, session: { ...session, ...next } })
  }

  function toggleProduct(product: Product, on: boolean) {
    const current = session.products ?? []
    const next = on
      ? [...current, product]
      : current.filter(entry => entry !== product)
    update({ products: next.length > 0 ? next : null })
  }

  return (
    <div className="flex flex-col gap-4">
      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1 text-sm font-medium">Apps</legend>
        {GRANTABLE_PRODUCTS.map(entry => {
          const id = `session-${entry.value}`
          return (
            <div key={entry.value} className="flex items-center gap-2">
              <Checkbox
                id={id}
                checked={(session.products ?? []).includes(entry.value)}
                onCheckedChange={checked => toggleProduct(entry.value, checked === true)}
              />
              <CheckboxLabel htmlFor={id}>{entry.label}</CheckboxLabel>
            </div>
          )
        })}
        <p className="text-xs text-muted-foreground">
          {session.products
            ? "Everything else moves to More from Exxat."
            : "None checked, so this flow leaves the workspace apps alone."}
        </p>
      </fieldset>

      <Separator />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="session-landing">Lands on</Label>
        <Input
          id="session-landing"
          value={session.landing}
          onChange={event => update({ landing: event.target.value })}
          list="session-landing-paths"
          placeholder="Products home"
        />
        <datalist id="session-landing-paths">
          {COMMON_LANDING_PATHS.map(entry => (
            <option key={entry.value} value={entry.value}>
              {entry.label}
            </option>
          ))}
        </datalist>
        <p className="text-xs text-muted-foreground">
          {branchesDecide
            ? "Every branch in this flow lands somewhere of its own, so this is only a fallback."
            : "Leave it blank for the products home, or onboarding on a first run."}
        </p>
      </div>

      <Separator />

      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1 text-sm font-medium">Home shows</legend>
        <div className="flex items-center gap-2">
          <Checkbox
            id="session-your-app"
            checked={session.showYourApp}
            onCheckedChange={checked => update({ showYourApp: checked === true })}
          />
          <CheckboxLabel htmlFor="session-your-app">Your App</CheckboxLabel>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="session-more-from-exxat"
            checked={session.showMoreFromExxat}
            onCheckedChange={checked => update({ showMoreFromExxat: checked === true })}
          />
          <CheckboxLabel htmlFor="session-more-from-exxat">More from Exxat</CheckboxLabel>
        </div>
      </fieldset>

      <Separator />

      {/* Its own group, not a third row under "Home shows". This is not about what
          a page displays: it decides whether the console exists for this session.
          One choice rather than an "administers the workspace" checkbox, because a
          checkbox beside a student landing let both be true, and a student who
          administers the workspace is the one thing this flow must not be able to
          say. */}
      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1 text-sm font-medium">Signs in as</legend>
        <RadioGroup
          value={session.role}
          onValueChange={value => update({ role: value as WorkspaceRole })}
          className="flex flex-col gap-2"
          aria-label="Signs in as"
        >
          {WORKSPACE_ROLES.map(entry => (
            <div key={entry.value} className="flex items-center gap-2">
              <RadioGroupItem value={entry.value} id={`session-role-${entry.value}`} />
              <RadioGroupLabel htmlFor={`session-role-${entry.value}`}>
                {entry.label}
              </RadioGroupLabel>
            </div>
          ))}
        </RadioGroup>
        <p className="text-xs text-muted-foreground">{ROLE_HINT[session.role]}</p>

        {/* Inside the role group, because it is an amendment to the answer above
            rather than a fourth thing the flow hands out: this person is a student
            *and* may walk in as the school instead.
            Not offered to an administrator, and not for tidiness: the pair is the
            two identities that deny the console, so pairing one with the console
            is the combination the role field exists to make unwritable. */}
        {session.role === "administrator" ? null : (
          <div className="mt-1 flex flex-col gap-1.5 border-s border-border ps-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="session-opens-as"
                checked={session.opensAs.length > 1}
                onCheckedChange={checked =>
                  update({ opensAs: checked === true ? ["student", "member"] : [] })
                }
              />
              <CheckboxLabel htmlFor="session-opens-as">
                Also opens as {session.role === "student" ? "school" : "a student"}
              </CheckboxLabel>
            </div>
            <p className="text-xs text-muted-foreground">
              {session.opensAs.length > 1
                ? "The product card offers both doors, so they choose each time they open the app. Neither door gets the console."
                : "One identity. The product card keeps a single Open."}
            </p>
          </div>
        )}
      </fieldset>
    </div>
  )
}

function OptionPane({
  flow,
  step,
  stepIndex,
  option,
  onChangeStep,
}: {
  flow: LoginFlowDefinition
  step: ChoiceStep
  stepIndex: number
  option: ChoiceOption
  onChangeStep: (next: ChoiceStep) => void
}) {
  const base = `option-${option.id}`
  const landing = option.outcome.kind === "land" ? option.outcome.path : ""

  function update(next: ChoiceOption) {
    onChangeStep({
      ...step,
      options: step.options.map(current => (current.id === option.id ? next : current)),
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${base}-label`}>Label</Label>
        <Input
          id={`${base}-label`}
          value={option.label}
          onChange={event => update({ ...option, label: event.target.value })}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${base}-description`}>Description</Label>
        <Input
          id={`${base}-description`}
          value={option.description}
          onChange={event => update({ ...option, description: event.target.value })}
          placeholder="Optional. Shown under the label."
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${base}-icon`}>Icon class</Label>
        <Input
          id={`${base}-icon`}
          value={option.icon}
          onChange={event => update({ ...option, icon: event.target.value })}
          placeholder="fa-light fa-graduation-cap"
        />
      </div>

      <Separator />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${base}-product`}>Grants app</Label>
        <Select
          value={option.grantsProduct ?? NO_PRODUCT}
          onValueChange={value =>
            update({
              ...option,
              grantsProduct: value === NO_PRODUCT ? null : (value as Product),
            })
          }
        >
          <SelectTrigger id={`${base}-product`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_PRODUCT}>Nothing. Keep all apps</SelectItem>
            {GRANTABLE_PRODUCTS.map(entry => (
              <SelectItem key={entry.value} value={entry.value}>
                {entry.label} only
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Granting one app moves the others to More from Exxat.
        </p>
      </div>

      {/* The second thing a branch can hand the session, next to the first. Most
          branches leave it alone: they ask which app or which door, not which
          person. It exists for the flow where one human has two identities in the
          program and only they know which one today. */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${base}-role`}>Opens as</Label>
        <Select
          value={option.role ?? FLOW_ROLE}
          onValueChange={value => {
            if (value === FLOW_ROLE) {
              const { role: _cleared, ...rest } = option
              update(rest)
              return
            }
            update({ ...option, role: value as WorkspaceRole })
          }}
        >
          <SelectTrigger id={`${base}-role`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={FLOW_ROLE}>Whoever the flow signs in</SelectItem>
            {WORKSPACE_ROLES.map(entry => (
              <SelectItem key={entry.value} value={entry.value}>
                {entry.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {isStudentHomePath(landing)
            ? "The student home signs in as a student whatever this says."
            : "Two branches that land in the same place can still open as different people."}
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${base}-outcome`}>Then</Label>
        <Select
          value={option.outcome.kind}
          onValueChange={value =>
            update({
              ...option,
              outcome:
                value === "continue"
                  ? { kind: "continue" }
                  : { kind: "land", path: landing || "/home" },
            })
          }
        >
          <SelectTrigger id={`${base}-outcome`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="land">Sign in and land somewhere</SelectItem>
            <SelectItem value="continue">Continue to the next step</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {option.outcome.kind === "land" ? (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${base}-path`}>Lands on</Label>
          <Input
            id={`${base}-path`}
            value={landing}
            onChange={event =>
              update({ ...option, outcome: { kind: "land", path: event.target.value } })
            }
            list={`${base}-paths`}
            placeholder="/home"
          />
          {/* A datalist rather than a Select: the common targets are worth
              offering, but any internal path is valid and the point of a builder
              is not having to ask an engineer to add one. */}
          <datalist id={`${base}-paths`}>
            {COMMON_LANDING_PATHS.map(entry => (
              <option key={entry.value} value={entry.value}>
                {entry.label}
              </option>
            ))}
          </datalist>
        </div>
      ) : null}

      <Separator />

      <ConditionRows
        label="Show this branch"
        emptyHint="Always shown."
        conditions={option.showWhen}
        flow={flow}
        beforeIndex={stepIndex}
        onChange={showWhen => update({ ...option, showWhen })}
      />
    </div>
  )
}

function StepPane({
  flow,
  step,
  stepIndex,
  onChange,
}: {
  flow: LoginFlowDefinition
  step: FlowStep
  stepIndex: number
  onChange: (next: FlowStep) => void
}) {
  return (
    <div className="flex flex-col gap-4">
      {step.kind === "auth" ? (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`step-${step.id}-method`}>Method</Label>
          <Select
            value={step.method}
            onValueChange={value => onChange({ ...step, method: value as AuthMethod })}
          >
            <SelectTrigger id={`step-${step.id}-method`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="password">{AUTH_METHOD_LABEL.password}</SelectItem>
              <SelectItem value="sso">{AUTH_METHOD_LABEL.sso}</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Both are mock. Single sign-on shows the provider handoff, not a form.
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`step-${step.id}-heading`}>Question</Label>
            <Input
              id={`step-${step.id}-heading`}
              value={step.heading}
              onChange={event => onChange({ ...step, heading: event.target.value })}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={() =>
              onChange({ ...step, options: [...step.options, createChoiceOption()] })
            }
          >
            <i className="fa-light fa-plus" aria-hidden="true" />
            Add branch
          </Button>
          <p className="text-xs text-muted-foreground">
            Select a branch on the canvas to edit what it does.
          </p>
        </>
      )}

      <Separator />

      <ConditionRows
        label="Run this step"
        emptyHint="Always runs."
        conditions={step.showWhen}
        flow={flow}
        beforeIndex={stepIndex}
        onChange={showWhen => onChange({ ...step, showWhen } as FlowStep)}
      />
    </div>
  )
}

export function FlowProperties({
  flow,
  selection,
  onChangeFlow,
  onSelect,
}: {
  flow: LoginFlowDefinition
  selection: CanvasSelection
  onChangeFlow: (next: LoginFlowDefinition) => void
  onSelect: (selection: CanvasSelection) => void
}) {
  if (selection.kind === "session") {
    return <SessionPane flow={flow} onChangeFlow={onChangeFlow} />
  }

  const stepIndex =
    selection.kind === "flow"
      ? -1
      : flow.steps.findIndex(step => step.id === selection.stepId)
  const step = stepIndex >= 0 ? flow.steps[stepIndex] : null

  if (!step) return null

  function replaceStep(next: FlowStep) {
    onChangeFlow({
      ...flow,
      steps: flow.steps.map((current, index) => (index === stepIndex ? next : current)),
    })
  }

  if (selection.kind === "option" && step.kind === "choice") {
    const option = step.options.find(current => current.id === selection.optionId)
    if (option) {
      return (
        <OptionPane
          flow={flow}
          step={step}
          stepIndex={stepIndex}
          option={option}
          onChangeStep={next => {
            replaceStep(next)
            // Deleting the selected branch has to move the selection, or the window
            // keeps editing something the canvas no longer shows.
            if (!next.options.some(current => current.id === option.id)) {
              onSelect({ kind: "step", stepId: step.id })
            }
          }}
        />
      )
    }
  }

  return (
    <StepPane flow={flow} step={step} stepIndex={stepIndex} onChange={replaceStep} />
  )
}
