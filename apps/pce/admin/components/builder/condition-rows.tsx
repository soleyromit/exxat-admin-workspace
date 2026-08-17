"use client"

/**
 * Condition editor: one row per condition, shaped as a sentence.
 *
 * Subject, operator, value, in that order, because a rule is only readable when
 * it follows the grammar of a sentence. The operators come from the design
 * system's `FilterOperator` rather than a private enum, so "does not contain"
 * means here what it means in a hub filter and the wording is already decided.
 *
 * The value control follows the subject: free text for the identifier, and a
 * picker of that step's options when the subject is an earlier answer. Typing an
 * option id by hand is not a thing anyone should have to do.
 *
 * Rows combine with AND, shown as a leading "and" rather than a toggle. There is
 * no OR: it doubles the model and the reading cost to serve a case nobody has
 * asked for, and two conditions is already an unusual flow.
 */

import * as React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  IDENTIFIER_SUBJECT_LABEL,
  createCondition,
  type Condition,
  type ConditionList,
  type LoginFlowDefinition,
} from "@/lib/login-flow"
import {
  OPERATOR_LABELS,
  type FilterOperator,
} from "@exxatdesignux/ui/lib/table-properties-types"

const OPERATORS = Object.keys(OPERATOR_LABELS) as FilterOperator[]
const IDENTIFIER_VALUE = "identifier"

/**
 * Choice steps before this one. Only earlier answers are offered, because a
 * condition on a later step's answer can never hold: at the moment it is read,
 * that step has not been asked yet. Offering it would author a step that silently
 * never runs.
 */
function earlierChoiceSteps(flow: LoginFlowDefinition, beforeIndex: number) {
  return flow.steps
    .slice(0, Math.max(beforeIndex, 0))
    .filter(step => step.kind === "choice")
}

function ConditionRow({
  condition,
  index,
  flow,
  beforeIndex,
  onChange,
  onRemove,
}: {
  condition: Condition
  index: number
  flow: LoginFlowDefinition
  beforeIndex: number
  onChange: (next: Condition) => void
  onRemove: () => void
}) {
  const base = `cond-${condition.id}`
  const choices = earlierChoiceSteps(flow, beforeIndex)
  const { subject } = condition
  const subjectValue = subject.kind === "identifier" ? IDENTIFIER_VALUE : subject.stepId
  const answerStep =
    subject.kind === "answer"
      ? choices.find(step => step.id === subject.stepId)
      : undefined

  return (
    <li className="flex flex-col gap-2 rounded-md border border-border bg-muted/20 p-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">
          {index === 0 ? "When" : "and"}
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={onRemove}
              aria-label={`Remove condition ${index + 1}`}
            >
              <i className="fa-light fa-xmark" aria-hidden="true" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Remove condition</TooltipContent>
        </Tooltip>
      </div>

      {/* Stacked, not three across. This lives in a narrow properties pane, and a
          viewport breakpoint would widen it based on a window size the pane does
          not have, crushing all three controls into a few characters each. */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-1">
          <Label htmlFor={`${base}-subject`} className="text-xs text-muted-foreground">
            Subject
          </Label>
          <Select
            value={subjectValue}
            onValueChange={value =>
              onChange({
                ...condition,
                subject:
                  value === IDENTIFIER_VALUE
                    ? { kind: "identifier" }
                    : { kind: "answer", stepId: value },
                // The old value belongs to the old subject. An option id read as
                // identifier text would silently never match.
                value: "",
              })
            }
          >
            <SelectTrigger id={`${base}-subject`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={IDENTIFIER_VALUE}>{IDENTIFIER_SUBJECT_LABEL}</SelectItem>
              {choices.map(step => (
                <SelectItem key={step.id} value={step.id}>
                  {step.kind === "choice" ? `Answer to "${step.heading}"` : step.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor={`${base}-operator`} className="text-xs text-muted-foreground">
            Operator
          </Label>
          <Select
            value={condition.operator}
            onValueChange={value =>
              onChange({ ...condition, operator: value as FilterOperator })
            }
          >
            <SelectTrigger id={`${base}-operator`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OPERATORS.map(operator => (
                <SelectItem key={operator} value={operator}>
                  {OPERATOR_LABELS[operator]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor={`${base}-value`} className="text-xs text-muted-foreground">
            Value
          </Label>
          {answerStep && answerStep.kind === "choice" ? (
            <Select
              value={condition.value}
              onValueChange={value => onChange({ ...condition, value })}
            >
              <SelectTrigger id={`${base}-value`}>
                <SelectValue placeholder="Pick an option" />
              </SelectTrigger>
              <SelectContent>
                {answerStep.options.map(option => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              id={`${base}-value`}
              value={condition.value}
              onChange={event => onChange({ ...condition, value: event.target.value })}
              placeholder="@school.edu"
            />
          )}
        </div>
      </div>
    </li>
  )
}

export function ConditionRows({
  label,
  emptyHint,
  conditions,
  flow,
  beforeIndex,
  onChange,
}: {
  label: string
  emptyHint: string
  conditions: ConditionList | undefined
  flow: LoginFlowDefinition
  /** Index of the step being edited, so only earlier answers are offered. */
  beforeIndex: number
  onChange: (next: ConditionList) => void
}) {
  const rows = conditions ?? []

  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm font-medium">{label}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyHint}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map((condition, index) => (
            <ConditionRow
              key={condition.id}
              condition={condition}
              index={index}
              flow={flow}
              beforeIndex={beforeIndex}
              onChange={next =>
                onChange(rows.map(current => (current.id === condition.id ? next : current)))
              }
              onRemove={() => onChange(rows.filter(current => current.id !== condition.id))}
            />
          ))}
        </ul>
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-fit"
        onClick={() => onChange([...rows, createCondition()])}
      >
        <i className="fa-light fa-plus" aria-hidden="true" />
        Add condition
      </Button>
    </section>
  )
}
