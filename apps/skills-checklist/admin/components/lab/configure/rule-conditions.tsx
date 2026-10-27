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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@exxatdesignux/ui/components/ui/dropdown-menu"
import { FieldError } from "@exxatdesignux/ui/components/ui/field"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@exxatdesignux/ui/components/ui/select"
import { settingNote, type LabRule, type RuleIssue } from "@/lib/lab/configure"

type SetRule = (fn: (r: LabRule) => LabRule) => void

const toNum = (v: string) => (v.trim() === "" ? Number.NaN : Number(v))
const val = (n: number) => (Number.isFinite(n) ? String(n) : "")

/** A narrow number box at the DS control height, labelled for screen readers. */
export function RuleNumber({ id, label, value, onChange, error }: { id: string; label: string; value: number; onChange: (n: number) => void; error?: boolean }) {
  return (
    <Input
      id={id}
      type="number"
      inputMode="numeric"
      min={1}
      aria-label={label}
      aria-invalid={error || undefined}
      aria-describedby={error ? `${id}-error` : undefined}
      className="w-16"
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

export function RuleConditions({ rule, setRule, issues, showErrors, settings }: { rule: LabRule; setRule: SetRule; issues: RuleIssue[]; showErrors: boolean; settings: string[] }) {
  const errs = (...fields: string[]) =>
    showErrors ? fields.flatMap((f) => issues.filter((i) => i.field === f).map((i) => ({ id: f, message: i.message }))).slice(0, 1) : []
  const bad = (f: string) => showErrors && issues.some((i) => i.field === f)
  const used = new Set(rule.settingMinimums.map((m) => m.setting))
  const distinctOn = rule.distinctEvaluators >= 2 || !Number.isFinite(rule.distinctEvaluators)
  const namedLevels = rule.levels.filter((l) => l.trim()).length
  const note = settingNote(rule)
  const lastSetting = rule.settingMinimums.length - 1
  const any = rule.settingMinimums.length + rule.levelMinimums.length + (distinctOn ? 1 : 0) > 0

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
                  {settings.map((s) => (
                    <SelectItem key={s} value={s} disabled={s !== m.setting && used.has(s)}>
                      {s}
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
              onSelect={() => setRule((r) => ({ ...r, settingMinimums: [...r.settingMinimums, { setting: settings.find((s) => !used.has(s)) ?? "", min: 1 }] }))}
            >
              At least a number in a clinical setting
            </DropdownMenuItem>
            {rule.model === "demonstration" ? (
              <DropdownMenuItem disabled={namedLevels === 0} onSelect={() => setRule((r) => ({ ...r, levelMinimums: [...r.levelMinimums, { levelIndex: Math.max(0, r.levels.length - 1), min: 1 }] }))}>
                At least a number at a level
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem disabled={distinctOn} onSelect={() => setRule((r) => ({ ...r, distinctEvaluators: 2 }))}>
              From different evaluators
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
