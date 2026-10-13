"use client"

import * as React from "react"
import { ButtonSegmentedControl } from "@exxatdesignux/ui/components/ui/button-segmented-control"
import { Checkbox } from "@exxatdesignux/ui/components/ui/checkbox"
import { FieldDescription, FieldLabel } from "@exxatdesignux/ui/components/ui/field"
import { ToggleSwitch } from "@exxatdesignux/ui/components/ui/toggle-switch"
import { r2c } from "@/lib/copy/r2-configure"
import { useConfigure } from "./context"
import { describedBy, Errors, Panel } from "./section-card"

const c = r2c.step2.comment
const w = r2c.step2.workflow
const r = r2c.step2.roles

/**
 * Prototype card "Evaluator comment" (SC-14): Optional / Required, with the sentence that says what each means.
 */
export function CommentSection() {
  const { cfg, setCfg } = useConfigure()
  return (
    <Panel id="sec-comment" title={c.title} description={c.body}>
      <ButtonSegmentedControl
        aria-label={c.title}
        aria-describedby="cfg-comment-help"
        value={cfg.evaluatorComment}
        onValueChange={(v) => setCfg((x) => ({ ...x, evaluatorComment: v }))}
        options={[
          { value: "optional", label: c.optional },
          { value: "mandatory", label: c.required },
        ]}
      />
      <FieldDescription id="cfg-comment-help">{cfg.evaluatorComment === "mandatory" ? c.requiredHelp : c.optionalHelp}</FieldDescription>
    </Panel>
  )
}

/** Prototype card "Review workflow" (SC-15): two switch rows with On / Off text. OD-09 is open: one form, two respondents. */
export function WorkflowSection() {
  const { cfg, setCfg } = useConfigure()
  const row = (id: string, label: string, on: boolean, onText: string, offText: string, set: (v: boolean) => void) => (
    <div className="flex items-start justify-between gap-4">
      <div className="flex flex-col">
        <span id={`${id}-label`} className="text-sm font-medium">
          {label}
        </span>
        <span id={`${id}-help`} className="text-sm text-muted-foreground">
          {on ? onText : offText}
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="text-xs text-muted-foreground" aria-hidden="true">
          {on ? w.on : w.off}
        </span>
        <ToggleSwitch id={id} aria-labelledby={`${id}-label`} checked={on} onChange={set} />
      </div>
    </div>
  )
  return (
    <Panel id="sec-workflow" title={w.title} description={w.body}>
      {row("cfg-selfeval", w.selfEval, cfg.selfEvaluation, w.selfEvalOn, w.selfEvalOff, (v) => setCfg((x) => ({ ...x, selfEvaluation: v })))}
      {row("cfg-approval", w.approval, cfg.requiresApproval, w.approvalOn, w.approvalOff, (v) => setCfg((x) => ({ ...x, requiresApproval: v })))}
    </Panel>
  )
}

/**
 * "Who can evaluate this skill" (SC-16): role chips from DATA rows (OD-06 is open: no enum), the helper, and the Route
 * sentence that shows only the active steps. The role-by-evidence map is read from data (OD-25 is open).
 */
export function RolesSection() {
  const { db, cfg, setCfg, visible, touch } = useConfigure()
  const roleErrs = visible((p) => p === "allowedRoles")
  const toggle = (id: string, on: boolean) => setCfg((x) => ({ ...x, allowedRoles: on ? [...x.allowedRoles, id] : x.allowedRoles.filter((v) => v !== id) }))
  const steps = ["Student selects", ...(cfg.selfEvaluation ? ["Student self-evaluates"] : []), "Evaluator completes the form", ...(cfg.requiresApproval ? ["Administrator approves"] : []), "Counts as evidence"]
  return (
    <section id="sec-evaluator" aria-labelledby="sec-evaluator-heading" className="flex flex-col gap-3">
      <h3 id="sec-evaluator-heading" className="text-sm font-medium text-foreground">
        {r.title}
      </h3>
      <ul aria-labelledby="sec-evaluator-heading" className="flex flex-wrap gap-2">
        {db.roles.map((role, i) => {
          const map = db.roleEvidenceMap[role.id]
          const where = map ? [map.clinical ? "clinical" : null, map.lab ? "lab or simulation" : null].filter(Boolean).join(" and ") : ""
          const id = i === 0 ? "cfg-allowedRoles" : `cfg-role-${role.id}`
          return (
            <li key={role.id} className="flex items-center gap-2 rounded-full border border-border px-3 py-1.5 has-[[data-state=checked]]:border-ring has-[[data-state=checked]]:bg-muted/40">
              <Checkbox id={id} aria-invalid={roleErrs.length > 0} aria-describedby={describedBy(roleErrs, "cfg-roles")} checked={cfg.allowedRoles.includes(role.id)} onCheckedChange={(v) => toggle(role.id, v === true)} onBlur={() => touch("evaluator")} />
              <FieldLabel htmlFor={id} className="font-normal">
                {role.label}
                {where ? <span className="ml-2 text-xs text-muted-foreground">Can sign off {where} evidence</span> : null}
              </FieldLabel>
            </li>
          )
        })}
      </ul>
      <FieldDescription>{r.help}</FieldDescription>
      <Errors issues={roleErrs} for="cfg-roles" />
      <p className="text-sm text-foreground" data-testid="route-sentence">
        <span className="font-medium">{r.route} </span>
        {steps.join(" → ")}
      </p>
    </section>
  )
}
