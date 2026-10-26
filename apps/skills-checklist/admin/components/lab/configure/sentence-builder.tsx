"use client"

/**
 * The rule as one editable sentence (variant C): "Get [3] evaluations rated [Met], at least [2] at [level] or above, from [2]
 * different evaluators, with [1] in [Inpatient]." Each bracket is a DS control with its own label for screen readers. Clauses
 * are added and removed whole, so the sentence never reads half built.
 */
import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { FieldError } from "@exxatdesignux/ui/components/ui/field"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@exxatdesignux/ui/components/ui/select"
import type { LabRule, RuleIssue } from "@/lib/lab/configure"
import { ProposedBadge } from "./fields"

const toNum = (v: string) => (v.trim() === "" ? Number.NaN : Number(v))
const val = (n: number) => (Number.isFinite(n) ? String(n) : "")

function Num({ id, label, value, onChange, invalid }: { id: string; label: string; value: number; onChange: (n: number) => void; invalid?: boolean }) {
  return <Input id={id} type="number" inputMode="numeric" min={1} aria-label={label} aria-invalid={invalid || undefined} className="inline-flex h-9 w-16 text-base" value={val(value)} onChange={(e) => onChange(toNum(e.target.value))} />
}

function Punct({ children }: { children: React.ReactNode }) {
  if (children === "") return null
  return <span className="-ms-2 text-foreground" aria-hidden="true">{children}</span>
}

function Remove({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button type="button" variant="ghost" size="icon-sm" aria-label={label} onClick={onClick}>
      <i className="fa-light fa-xmark" aria-hidden="true" />
    </Button>
  )
}

export function SentenceBuilder({ rule, setRule, issues, showErrors, settings }: { rule: LabRule; setRule: (fn: (r: LabRule) => LabRule) => void; issues: RuleIssue[]; showErrors: boolean; settings: string[] }) {
  const bad = (field: string) => showErrors && issues.some((i) => i.field === field)
  const ruleIssues = showErrors ? issues.filter((i) => i.section === "rule" || i.field.startsWith("cfg-setting") || i.field === "cfg-qualifying") : []
  const usedSettings = new Set(rule.settingMinimums.map((m) => m.setting))
  const distinctOn = rule.distinctEvaluators >= 2 || !Number.isFinite(rule.distinctEvaluators)
  const order = [...rule.levelMinimums.map((_, i) => `l${i}`), ...(distinctOn ? ["d"] : []), ...rule.settingMinimums.map((_, i) => `s${i}`)]
  const after = (key: string): string => {
    const k = order.indexOf(key)
    if (k === order.length - 1) return "."
    return key.startsWith("s") && order[k + 1].startsWith("s") ? "" : ","
  }
  const T = ({ children }: { children: React.ReactNode }) => <span className="text-foreground">{children}</span>

  return (
    <div className="flex flex-col gap-4">
      <div role="group" aria-label="Achievement rule" className="flex flex-wrap items-center gap-x-2 gap-y-3 text-lg leading-relaxed" data-sentence-builder>
        <T>Get</T>
        <Num id="cfg-need" label="How many times: valid attempts needed" value={rule.need} invalid={bad("cfg-need")} onChange={(n) => setRule((r) => ({ ...r, need: n }))} />
        <T>{rule.need === 1 ? "evaluation" : "evaluations"}</T>

        {rule.model === "binary" ? (
          <>
            <T>rated</T>
            <Select value={rule.qualifyingLabel === null ? "" : String(rule.qualifyingLabel)} onValueChange={(v) => setRule((r) => ({ ...r, qualifyingLabel: v === "1" ? 1 : 0 }))}>
              <SelectTrigger id="cfg-qualifying" className="h-9 w-40 text-base" aria-label="Outcome that qualifies" aria-invalid={bad("cfg-qualifying") || undefined}><SelectValue placeholder="choose" /></SelectTrigger>
              <SelectContent>
                {[0, 1].map((i) => <SelectItem key={i} value={String(i)} disabled={!rule.outcomeLabels[i].trim()}>{rule.outcomeLabels[i].trim() || `Outcome ${i + 1}`}</SelectItem>)}
              </SelectContent>
            </Select>
          </>
        ) : null}

        {rule.model === "question" ? (
          <>
            <T>with</T>
            <Select value={rule.questionRule?.kind ?? ""} onValueChange={(v) => setRule((r) => ({ ...r, questionRule: v === "all" ? { kind: "all" } : v === "atLeast" ? { kind: "atLeast", n: Math.max(1, r.questions.length - 1) } : { kind: "subset", indices: r.questionRule?.kind === "subset" ? r.questionRule.indices : [] } }))}>
              <SelectTrigger id="cfg-qrule" className="h-9 w-48 text-base" aria-label="Which answers qualify" aria-invalid={bad("cfg-qrule") || undefined}><SelectValue placeholder="choose" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">every question</SelectItem>
                <SelectItem value="atLeast">at least</SelectItem>
                <SelectItem value="subset">named questions</SelectItem>
              </SelectContent>
            </Select>
            {rule.questionRule?.kind === "atLeast" ? (
              <>
                <Num id="cfg-qrule-n" label="Questions that must be answered Yes" value={rule.questionRule.n} invalid={bad("cfg-qrule-n")} onChange={(n) => setRule((r) => ({ ...r, questionRule: { kind: "atLeast", n } }))} />
                <T>{`of ${rule.questions.length} ${rule.questions.length === 1 ? "question" : "questions"}`}</T>
              </>
            ) : null}
            <T>answered Yes</T>
          </>
        ) : null}

        {rule.model === "scored" ? (
          <>
            <Select value={rule.scoredRule?.kind ?? ""} onValueChange={(v) => setRule((r) => ({ ...r, scoredRule: { kind: v as "average" | "minEach" | "total", value: r.scoredRule?.value ?? Math.ceil(r.scaleMax * 0.6) } }))}>
              <SelectTrigger id="cfg-srule" className="h-9 w-48 text-base" aria-label="How a score qualifies" aria-invalid={bad("cfg-srule") || undefined}><SelectValue placeholder="choose a method" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="average">averaging at least</SelectItem>
                <SelectItem value="minEach">scoring on every question at least</SelectItem>
                <SelectItem value="total">totalling at least</SelectItem>
              </SelectContent>
            </Select>
            {rule.scoredRule ? <Num id="cfg-srule-value" label="Pass mark" value={rule.scoredRule.value} invalid={bad("cfg-srule-value")} onChange={(n) => setRule((r) => ({ ...r, scoredRule: r.scoredRule ? { ...r.scoredRule, value: n } : null }))} /> : null}
          </>
        ) : null}

        {rule.model ? <Punct>{order.length ? "," : "."}</Punct> : null}

        {rule.levelMinimums.map((lm, i) => (
          <span key={`l${i}`} className="inline-flex flex-wrap items-center gap-2">
            <T>at least</T>
            <Num id={`cfg-lmin-${i}`} label={`Level minimum ${i + 1}`} value={lm.min} invalid={bad(`cfg-lmin-${i}`)} onChange={(n) => setRule((r) => ({ ...r, levelMinimums: r.levelMinimums.map((x, k) => (k === i ? { ...x, min: n } : x)) }))} />
            <T>at</T>
            <Select value={String(lm.levelIndex)} onValueChange={(v) => setRule((r) => ({ ...r, levelMinimums: r.levelMinimums.map((x, k) => (k === i ? { ...x, levelIndex: Number(v) } : x)) }))}>
              <SelectTrigger id={`cfg-lmin-level-${i}`} className="h-9 w-44 text-base" aria-label={`Level for minimum ${i + 1}`}><SelectValue placeholder="choose a level" /></SelectTrigger>
              <SelectContent>
                {rule.levels.map((l, k) => <SelectItem key={k} value={String(k)} disabled={!l.trim()}>{l.trim() || `Level ${k + 1}`}</SelectItem>)}
              </SelectContent>
            </Select>
            <T>or above</T>
            <Punct>{after(`l${i}`)}</Punct>
            <Remove label={`Remove level minimum ${i + 1}`} onClick={() => setRule((r) => ({ ...r, levelMinimums: r.levelMinimums.filter((_, k) => k !== i) }))} />
          </span>
        ))}

        {distinctOn ? (
          <span className="inline-flex flex-wrap items-center gap-2">
            <T>from</T>
            <Num id="cfg-distinct" label="Different evaluators" value={rule.distinctEvaluators} invalid={bad("cfg-distinct")} onChange={(n) => setRule((r) => ({ ...r, distinctEvaluators: n }))} />
            <T>different evaluators</T>
            <Punct>{after("d")}</Punct>
            <ProposedBadge note="Not yet agreed for the first release." />
            <Remove label="Remove different evaluators" onClick={() => setRule((r) => ({ ...r, distinctEvaluators: 1 }))} />
          </span>
        ) : null}

        {rule.settingMinimums.map((m, i) => (
          <span key={`s${i}`} className="inline-flex flex-wrap items-center gap-2">
            <T>{i === 0 ? "with" : "and"}</T>
            <Num id={`cfg-setting-min-${i}`} label={`Minimum in setting ${i + 1}`} value={m.min} invalid={bad(`cfg-setting-min-${i}`)} onChange={(n) => setRule((r) => ({ ...r, settingMinimums: r.settingMinimums.map((x, k) => (k === i ? { ...x, min: n } : x)) }))} />
            <T>in</T>
            <Select value={m.setting} onValueChange={(v) => setRule((r) => ({ ...r, settingMinimums: r.settingMinimums.map((x, k) => (k === i ? { ...x, setting: v } : x)) }))}>
              <SelectTrigger id={`cfg-setting-${i}`} className="h-9 w-40 text-base" aria-label={`Clinical setting ${i + 1}`} aria-invalid={bad(`cfg-setting-${i}`) || undefined}><SelectValue placeholder="choose" /></SelectTrigger>
              <SelectContent>
                {settings.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Punct>{after(`s${i}`)}</Punct>
            <Remove label={`Remove ${m.setting || "setting"} minimum`} onClick={() => setRule((r) => ({ ...r, settingMinimums: r.settingMinimums.filter((_, k) => k !== i) }))} />
          </span>
        ))}
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Add to the rule">
        {rule.model === "demonstration" ? <Button type="button" variant="outline" size="sm" disabled={rule.levels.filter((l) => l.trim()).length === 0} onClick={() => setRule((r) => ({ ...r, levelMinimums: [...r.levelMinimums, { levelIndex: Math.max(0, r.levels.length - 1), min: 1 }] }))}>Add a level minimum</Button> : null}
        {rule.distinctEvaluators < 2 ? <Button type="button" variant="outline" size="sm" onClick={() => setRule((r) => ({ ...r, distinctEvaluators: 2 }))}>Add different evaluators</Button> : null}
        <Button type="button" variant="outline" size="sm" disabled={usedSettings.size >= settings.length} onClick={() => setRule((r) => ({ ...r, settingMinimums: [...r.settingMinimums, { setting: settings.find((s) => !usedSettings.has(s)) ?? "", min: 1 }] }))}>Add a setting minimum</Button>
      </div>

      {ruleIssues.length ? (
        <ul className="flex flex-col gap-1" aria-label="Problems in the rule">
          {ruleIssues.map((i) => <li key={i.id}><FieldError>{i.message}</FieldError></li>)}
        </ul>
      ) : null}
    </div>
  )
}
