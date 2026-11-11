"use client"

/**
 * The optional conditions of an achievement rule, shared by Configure sets 1, 2 and 3 (Romit 2026-10-27: "this hierarchy looks
 * bad, with different text sizes used, too many text again"). One list, one row per condition, one Remove per row, and ONE
 * "Add a condition" menu instead of a button per kind:
 * - at least N in a clinical setting [REQ SC-11]; lab and simulation never count toward it [REQ SC-12], said once, in one muted
 *   line, only while a setting minimum is set;
 * - at least N at a level or above [REQ SC-10] (independence level only);
 * - from N different evaluators (a delegated default, D-X6; marked in the lab notes, never in product copy);
 * Limits kept from an earlier rule (not in REQ) are not edited here: Check and save lists them, once (Romit 2026-10-27).
 * Body size throughout (text-sm), DS controls at their own height, narrow numeric inputs. Every control keeps the id a
 * validation issue names (cfg-...), so the fix list can focus it.
 */
import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@exxatdesignux/ui/components/ui/dropdown-menu"
import { FieldError } from "@exxatdesignux/ui/components/ui/field"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@exxatdesignux/ui/components/ui/select"
import { FieldLegend, FieldSet } from "@exxatdesignux/ui/components/ui/field"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { settingNote, type LabRule, type RuleIssue } from "@/lib/lab/configure"
import { useFieldLayer } from "./field-layer"
import { NUMBER_WIDTH } from "./number-field"

type SetRule = (fn: (r: LabRule) => LabRule) => void

const toNum = (v: string) => (v.trim() === "" ? Number.NaN : Number(v))
const val = (n: number) => (Number.isFinite(n) ? String(n) : "")

/** A narrow number box at the DS control height, labelled for screen readers. */
export function RuleNumber({ id, label, value, onChange, error, placeholder }: { id: string; label: string; value: number; onChange: (n: number) => void; error?: boolean; placeholder?: string }) {
  return (
    <Input
      id={id}
      type="number"
      inputMode="numeric"
      min={1}
      aria-label={label}
      aria-invalid={error || undefined}
      aria-describedby={error ? `${id}-error` : undefined}
      className={NUMBER_WIDTH}
      placeholder={placeholder}
      value={val(value)}
      onChange={(e) => onChange(toNum(e.target.value))}
    />
  )
}

function Row({ label, onRemove, errors, note, children }: { label: string; onRemove: () => void; errors: Array<{ id: string; message: string }>; note?: string; children: React.ReactNode }) {
  return (
    <li className="flex flex-col gap-1 px-3 py-2">
      <div className="flex flex-wrap items-center gap-2 text-sm text-foreground">
        {children}
        {/* One Remove style on every configure list: icon-only, named for its row (fields.tsx RemoveButton). */}
        <Button type="button" variant="ghost" size="icon-sm" className="ms-auto" aria-label={`Remove condition: ${label}`} onClick={onRemove}>
          <i className="fa-light fa-xmark" aria-hidden="true" />
        </Button>
      </div>
      {note ? <p className="text-sm text-muted-foreground">{note}</p> : null}
      {errors.map((e) => (
        <FieldError key={e.id} id={`${e.id}-error`}>
          {e.message}
        </FieldError>
      ))}
    </li>
  )
}

export function RuleConditions({ rule, setRule, issues, showErrors, settings, addButtons = false }: { rule: LabRule; setRule: SetRule; issues: RuleIssue[]; showErrors: boolean; settings: string[]; /** The bulk page (map D4): one Add per kind of minimum, not one menu. */ addButtons?: boolean }) {
  const errs = (...fields: string[]) =>
    showErrors ? fields.flatMap((f) => issues.filter((i) => i.field === f).map((i) => ({ id: f, message: i.message }))).slice(0, 1) : []
  const bad = (f: string) => showErrors && issues.some((i) => i.field === f)
  const used = new Set(rule.settingMinimums.map((m) => m.setting))
  const distinctOn = rule.distinctEvaluators >= 2 || !Number.isFinite(rule.distinctEvaluators)
  const namedLevels = rule.levels.filter((l) => l.trim()).length
  const note = settingNote(rule)
  const lastSetting = rule.settingMinimums.length - 1
  const any = rule.settingMinimums.length + rule.levelMinimums.length + (distinctOn ? 1 : 0) > 0
  const addSetting = () => setRule((r) => ({ ...r, settingMinimums: [...r.settingMinimums, { setting: settings.find((s) => !used.has(s)) ?? "", min: 1 }] }))
  const addLevel = () => setRule((r) => ({ ...r, levelMinimums: [...r.levelMinimums, { levelIndex: Math.max(0, r.levels.length - 1), min: 1 }] }))
  const addDistinct = () => setRule((r) => ({ ...r, distinctEvaluators: 2 }))

  return (
    <div className="flex flex-col gap-2" data-rule-conditions>
      {any ? (
        <ul aria-label="Conditions" className="flex flex-col divide-y divide-border rounded-[var(--radius)] border border-border">
          {rule.settingMinimums.map((m, i) => (
            <Row
              key={`s${i}`}
              label={`${m.setting || "setting"} minimum`}
              onRemove={() => setRule((r) => ({ ...r, settingMinimums: r.settingMinimums.filter((_, k) => k !== i) }))}
              errors={errs(`cfg-setting-${i}`, `cfg-setting-min-${i}`)}
              // The hard stop, once, under the last setting row [REQ SC-12].
              note={i === lastSetting ? note : undefined}
            >
              <span>At least</span>
              <RuleNumber id={`cfg-setting-min-${i}`} label={`Minimum in setting ${i + 1}`} value={m.min} error={bad(`cfg-setting-min-${i}`)} onChange={(n) => setRule((r) => ({ ...r, settingMinimums: r.settingMinimums.map((x, k) => (k === i ? { ...x, min: n } : x)) }))} />
              <span>in</span>
              <Select value={m.setting} onValueChange={(v) => setRule((r) => ({ ...r, settingMinimums: r.settingMinimums.map((x, k) => (k === i ? { ...x, setting: v } : x)) }))}>
                <SelectTrigger id={`cfg-setting-${i}`} className="w-44" aria-label={`Clinical setting ${i + 1}`} aria-invalid={bad(`cfg-setting-${i}`) || undefined}>
                  <SelectValue placeholder="Choose a setting" />
                </SelectTrigger>
                <SelectContent>
                  {(m.setting && !settings.includes(m.setting) ? [...settings, m.setting] : settings).map((s) => (
                    <SelectItem key={s} value={s} disabled={s !== m.setting && used.has(s)}>
                      {settings.includes(s) ? s : `${s} (inactive)`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Row>
          ))}

          {rule.levelMinimums.map((lm, i) => (
            <Row key={`l${i}`} label={`level minimum ${i + 1}`} onRemove={() => setRule((r) => ({ ...r, levelMinimums: r.levelMinimums.filter((_, k) => k !== i) }))} errors={errs(`cfg-lmin-${i}`, `cfg-lmin-level-${i}`)}>
              <span>At least</span>
              <RuleNumber id={`cfg-lmin-${i}`} label={`Level minimum ${i + 1}`} value={lm.min} error={bad(`cfg-lmin-${i}`)} onChange={(n) => setRule((r) => ({ ...r, levelMinimums: r.levelMinimums.map((x, k) => (k === i ? { ...x, min: n } : x)) }))} />
              <span>at</span>
              <Select value={String(lm.levelIndex)} onValueChange={(v) => setRule((r) => ({ ...r, levelMinimums: r.levelMinimums.map((x, k) => (k === i ? { ...x, levelIndex: Number(v) } : x)) }))}>
                <SelectTrigger id={`cfg-lmin-level-${i}`} className="w-44" aria-label={`Level for minimum ${i + 1}`}>
                  <SelectValue placeholder="Choose a level" />
                </SelectTrigger>
                <SelectContent>
                  {rule.levels.map((l, k) => (
                    <SelectItem key={k} value={String(k)} disabled={!l.trim()}>
                      {l.trim() || `Level ${k + 1}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span>or above</span>
            </Row>
          ))}

          {distinctOn ? (
            <Row label="different evaluators" onRemove={() => setRule((r) => ({ ...r, distinctEvaluators: 1 }))} errors={errs("cfg-distinct")}>
              <span>From</span>
              <RuleNumber id="cfg-distinct" label="Different evaluators" value={rule.distinctEvaluators} error={bad("cfg-distinct")} onChange={(n) => setRule((r) => ({ ...r, distinctEvaluators: n }))} />
              <span>different evaluators</span>
            </Row>
          ) : null}

        </ul>
      ) : null}

      {addButtons ? (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2" data-add-minimums>
          <Button type="button" variant="link" size="sm" className="h-auto min-h-6 px-0 text-foreground" id="cfg-add-condition" disabled={used.size >= settings.length} onClick={addSetting}>Add minimum from a clinical setting</Button>
          {rule.model === "demonstration" ? <Button type="button" variant="link" size="sm" className="h-auto min-h-6 px-0 text-foreground" disabled={namedLevels === 0} onClick={addLevel}>Add minimum at a level</Button> : null}
          <Button type="button" variant="link" size="sm" className="h-auto min-h-6 px-0 text-foreground" disabled={distinctOn} onClick={addDistinct}>Add different evaluators</Button>
        </div>
      ) : (
      <div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="ghost" size="sm" id="cfg-add-condition">
              Add a condition
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem
              disabled={used.size >= settings.length}
              onSelect={addSetting}
            >
              At least a number in a clinical setting
            </DropdownMenuItem>
            {rule.model === "demonstration" ? (
              <DropdownMenuItem disabled={namedLevels === 0} onSelect={addLevel}>
                At least a number at a level
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem disabled={distinctOn} onSelect={addDistinct}>
              From different evaluators
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      )}
    </div>
  )
}

interface ConditionProps {
  rule: LabRule
  setRule: SetRule
  issues: RuleIssue[]
  showErrors: boolean
}

const fieldErr = (p: ConditionProps, f: string) => (p.showErrors ? p.issues.find((i) => i.field === f)?.message : undefined)

/** Minimum at each level, one number per named level [REQ SC-10] (the Library edit panel, map D1a row 6). The ids are the ones validation names. */
export function LevelMinimumsField(p: ConditionProps) {
  const { rule, setRule } = p
  const named = rule.levels.map((name, i) => ({ name: name.trim(), i })).filter((l) => l.name)
  if (!named.length) return null
  return (
    <FieldSet data-level-minimums>
      <FieldLegend variant="label">Minimum at each level</FieldLegend>
      <div className="flex flex-col gap-2">
        {named.map(({ name, i }) => {
          const at = rule.levelMinimums.findIndex((m) => m.levelIndex === i)
          const id = at >= 0 ? `cfg-lmin-${at}` : `cfg-lmin-new-${i}`
          const message = fieldErr(p, id)
          return (
            <div key={i} className="flex flex-col gap-1">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor={id} className="min-w-0 font-normal">{name}</Label>
                <RuleNumber
                  id={id}
                  label={`Minimum at ${name}`}
                  value={at >= 0 ? rule.levelMinimums[at]!.min : Number.NaN}
                  error={!!message}
                  onChange={(n) => setRule((r) => {
                    const rest = r.levelMinimums.filter((m) => m.levelIndex !== i)
                    return { ...r, levelMinimums: Number.isNaN(n) ? rest : [...rest, { levelIndex: i, min: n }].sort((a, b) => a.levelIndex - b.levelIndex) }
                  })}
                />
              </div>
              {message ? <FieldError id={`${id}-error`}>{message}</FieldError> : null}
            </div>
          )
        })}
      </div>
    </FieldSet>
  )
}

/** Minimum from a clinical setting [REQ SC-11]. Clinical settings only: lab and simulation are never offered [REQ SC-12]. */
export function SettingMinimumsField(p: ConditionProps & { settings: string[] }) {
  const { rule, setRule, settings } = p
  const layer = useFieldLayer()
  const used = new Set(rule.settingMinimums.map((m) => m.setting))
  const note = settingNote(rule)
  return (
    <FieldSet data-setting-minimums>
      <FieldLegend variant="label">Minimum from a clinical setting</FieldLegend>
      {rule.settingMinimums.length ? (
        <ul aria-label="Setting minimums" className="flex flex-col divide-y divide-border rounded-[var(--radius)] border border-border">
          {rule.settingMinimums.map((m, i) => {
            const message = fieldErr(p, `cfg-setting-${i}`) ?? fieldErr(p, `cfg-setting-min-${i}`)
            const errId = fieldErr(p, `cfg-setting-${i}`) ? `cfg-setting-${i}` : `cfg-setting-min-${i}`
            return (
              <Row
                key={i}
                label={`${m.setting || "setting"} minimum`}
                onRemove={() => setRule((r) => ({ ...r, settingMinimums: r.settingMinimums.filter((_, k) => k !== i) }))}
                errors={message ? [{ id: errId, message }] : []}
              >
                <RuleNumber id={`cfg-setting-min-${i}`} label={`Minimum in setting ${i + 1}`} value={m.min} error={!!fieldErr(p, `cfg-setting-min-${i}`)} onChange={(n) => setRule((r) => ({ ...r, settingMinimums: r.settingMinimums.map((x, k) => (k === i ? { ...x, min: n } : x)) }))} />
                <span>in</span>
                <Select value={m.setting} onValueChange={(v) => setRule((r) => ({ ...r, settingMinimums: r.settingMinimums.map((x, k) => (k === i ? { ...x, setting: v } : x)) }))}>
                  <SelectTrigger id={`cfg-setting-${i}`} className="w-40" aria-label={`Clinical setting ${i + 1}`} aria-invalid={!!fieldErr(p, `cfg-setting-${i}`) || undefined}>
                    <SelectValue placeholder="Choose a setting" />
                  </SelectTrigger>
                  <SelectContent className={layer.menu}>
                    {/* A setting deactivated since keeps showing on the rule that holds it [REQ SL-07, INFER from SL-06]; it is not offered anywhere else. */}
                    {(m.setting && !settings.includes(m.setting) ? [...settings, m.setting] : settings).map((s) => <SelectItem key={s} value={s} disabled={s !== m.setting && used.has(s)}>{settings.includes(s) ? s : `${s} (inactive)`}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Row>
            )
          })}
        </ul>
      ) : null}
      {note ? <p className="text-sm text-muted-foreground">{note}</p> : null}
      <div>
        <Button type="button" variant="ghost" size="sm" id="cfg-add-minimum" disabled={used.size >= settings.length} onClick={() => setRule((r) => ({ ...r, settingMinimums: [...r.settingMinimums, { setting: "", min: Number.NaN }] }))}>
          Add minimum
        </Button>
      </div>
    </FieldSet>
  )
}

/** Different evaluators: a number from 1 (map D1a row 14). */
export function DifferentEvaluatorsField(p: ConditionProps) {
  const message = fieldErr(p, "cfg-distinct")
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor="cfg-distinct">Different evaluators</Label>
        <RuleNumber id="cfg-distinct" label="Different evaluators" value={p.rule.distinctEvaluators} error={!!message} onChange={(n) => p.setRule((r) => ({ ...r, distinctEvaluators: n }))} />
      </div>
      {message ? <FieldError id="cfg-distinct-error">{message}</FieldError> : null}
    </div>
  )
}

/**
 * Minimums for one skill as one row (map D1c, D4): "None" until there are some, one Add minimum menu [REQ SC-10, SC-11]. Clinical settings only, lab and simulation never offered [REQ SC-12]. Each choice names its level or setting, so the added row needs only its number, and focus goes there.
 */
export function MinimumsField(p: ConditionProps & { settings: string[]; /** The skills differ: no one word stands for them all. */ noNone?: boolean }) {
  const { rule, setRule, settings } = p
  const layer = useFieldLayer()
  const nextFocus = React.useRef<string | null>(null)
  const usedSettings = new Set(rule.settingMinimums.map((m) => m.setting))
  const usedLevels = new Set(rule.levelMinimums.map((m) => m.levelIndex))
  const distinctOn = rule.distinctEvaluators >= 2 || !Number.isFinite(rule.distinctEvaluators)
  const levels = rule.model === "demonstration" ? rule.levels.map((name, i) => ({ name: name.trim(), i })).filter((l) => l.name && !usedLevels.has(l.i)) : []
  const offered = settings.filter((s) => !usedSettings.has(s))
  const note = settingNote(rule)
  const any = rule.settingMinimums.length + rule.levelMinimums.length + (distinctOn ? 1 : 0) > 0
  const errs = (...fields: string[]) => (p.showErrors ? fields.flatMap((f) => p.issues.filter((i) => i.field === f).map((i) => ({ id: f, message: i.message }))).slice(0, 1) : [])
  const bad = (f: string) => p.showErrors && p.issues.some((i) => i.field === f)
  const addable = levels.length + offered.length + (distinctOn ? 0 : 1) > 0
  return (
    <div className="flex flex-col gap-2" data-minimums>
      {any ? (
        <ul aria-label="Minimums" className="flex flex-col divide-y divide-border rounded-[var(--radius)] border border-border">
          {rule.levelMinimums.map((m, i) => {
            const name = rule.levels[m.levelIndex]?.trim() || `Level ${m.levelIndex + 1}`
            return (
              <Row key={`l${i}`} label={`${name} minimum`} onRemove={() => setRule((r) => ({ ...r, levelMinimums: r.levelMinimums.filter((_, k) => k !== i) }))} errors={errs(`cfg-lmin-${i}`, `cfg-lmin-level-${i}`)}>
                <span>At least</span>
                <RuleNumber id={`cfg-lmin-${i}`} label={`Minimum at ${name}`} value={m.min} error={bad(`cfg-lmin-${i}`)} onChange={(n) => setRule((r) => ({ ...r, levelMinimums: r.levelMinimums.map((x, k) => (k === i ? { ...x, min: n } : x)) }))} />
                <span>{`at ${name} or above`}</span>
              </Row>
            )
          })}
          {rule.settingMinimums.map((m, i) => (
            <Row key={`s${i}`} label={`${m.setting || "setting"} minimum`} onRemove={() => setRule((r) => ({ ...r, settingMinimums: r.settingMinimums.filter((_, k) => k !== i) }))} errors={errs(`cfg-setting-min-${i}`, `cfg-setting-${i}`)}>
              <span>At least</span>
              <RuleNumber id={`cfg-setting-min-${i}`} label={`Minimum in ${m.setting || `setting ${i + 1}`}`} value={m.min} error={bad(`cfg-setting-min-${i}`)} onChange={(n) => setRule((r) => ({ ...r, settingMinimums: r.settingMinimums.map((x, k) => (k === i ? { ...x, min: n } : x)) }))} />
              <span id={`cfg-setting-${i}`} tabIndex={-1} className="outline-none">{`in ${m.setting}${m.setting && !settings.includes(m.setting) ? " (inactive)" : ""}`}</span>
            </Row>
          ))}
          {distinctOn ? (
            <Row label="different evaluators" onRemove={() => setRule((r) => ({ ...r, distinctEvaluators: 1 }))} errors={errs("cfg-distinct")}>
              <span>From</span>
              <RuleNumber id="cfg-distinct" label="Different evaluators" value={rule.distinctEvaluators} error={bad("cfg-distinct")} onChange={(n) => setRule((r) => ({ ...r, distinctEvaluators: n }))} />
              <span>different evaluators</span>
            </Row>
          ) : null}
        </ul>
      ) : null}
      {note ? <p className="text-sm text-muted-foreground">{note}</p> : null}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {any || p.noNone ? <span /> : <span className="text-sm text-foreground">None</span>}
        {addable ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button id="cfg-add-minimum" type="button" variant="outline" size="sm">Add minimum</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className={layer.menu}
              onCloseAutoFocus={(e) => {
                const id = nextFocus.current
                if (!id) return
                nextFocus.current = null
                e.preventDefault()
                requestAnimationFrame(() => document.getElementById(id)?.focus())
              }}
            >
              {levels.length ? <DropdownMenuLabel>At a level</DropdownMenuLabel> : null}
              {levels.map((l) => (
                <DropdownMenuItem key={l.i} data-minimum-kind="level" onSelect={() => { nextFocus.current = `cfg-lmin-${rule.levelMinimums.length}`; setRule((r) => ({ ...r, levelMinimums: [...r.levelMinimums, { levelIndex: l.i, min: 1 }] })) }}>{l.name}</DropdownMenuItem>
              ))}
              {levels.length && offered.length ? <DropdownMenuSeparator /> : null}
              {offered.length ? <DropdownMenuLabel>From a clinical setting</DropdownMenuLabel> : null}
              {offered.map((s) => (
                <DropdownMenuItem key={s} data-minimum-kind="setting" onSelect={() => { nextFocus.current = `cfg-setting-min-${rule.settingMinimums.length}`; setRule((r) => ({ ...r, settingMinimums: [...r.settingMinimums, { setting: s, min: 1 }] })) }}>{s}</DropdownMenuItem>
              ))}
              {!distinctOn ? (
                <>
                  {levels.length || offered.length ? <DropdownMenuSeparator /> : null}
                  <DropdownMenuItem onSelect={() => { nextFocus.current = "cfg-distinct"; setRule((r) => ({ ...r, distinctEvaluators: 2 })) }}>Different evaluators</DropdownMenuItem>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
    </div>
  )
}
