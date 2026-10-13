"use client"

import * as React from "react"
import { Field, FieldDescription, FieldLabel } from "@exxatdesignux/ui/components/ui/field"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { SkillsMultiPick } from "@/components/skills"
import { r2c } from "@/lib/copy/r2-configure"
import { evidencePerEvaluation, qualifiesWhen } from "@/lib/copy"
import { setCriteria } from "./draft"
import { useConfigure } from "./context"
import { NumberInput } from "./number-input"
import { describedBy, Errors, Panel } from "./section-card"

const t = r2c.step3

/**
 * Step 3, Achievement criteria (SC-09, SC-10, SC-11): the intro banner, then the card "Achievement criteria / Evidence available:
 * ...", limited to what the chosen model can produce.
 */
export function CriteriaSection() {
  const { cfg } = useConfigure()
  const demo = cfg.model?.kind === "demonstration"
  const evidence = cfg.model ? evidencePerEvaluation(cfg.model) : ""
  const rule = cfg.model ? qualifiesWhen(cfg.model) : ""
  return (
    <div className="flex flex-col gap-4" id="sec-criteria">
      <LocalBanner variant="info">{t.intro}</LocalBanner>
      <Panel id="sec-criteria-card" title={t.title} description={t.evidenceAvailable(evidence)}>
        <RequiredCount demo={demo} />
        {demo ? <LevelMinimumEditor /> : <p className="text-sm text-muted-foreground">{rule ? t.qualifyingOne(rule) : ""} {t.noLevels}</p>}
        <SettingMinimumEditor />
      </Panel>
    </div>
  )
}

function RequiredCount({ demo }: { demo: boolean }) {
  const { cfg, setCfg, visible, touch } = useConfigure()
  const errs = visible((p) => p === "criteria.requiredCount")
  return (
    <Field>
      <FieldLabel htmlFor="cfg-required-count">{demo ? t.totalDemonstrations : t.requiredCount}</FieldLabel>
      <NumberInput id="cfg-required-count" className="w-28" aria-invalid={errs.length > 0} aria-describedby={describedBy(errs, "cfg-required-count")} value={cfg.criteria.requiredCount} onChange={(n) => setCfg((c) => setCriteria(c, { requiredCount: n }))} onBlur={() => touch("criteria")} />
      <Errors issues={errs} for="cfg-required-count" />
    </Field>
  )
}

/** C-5: minimum at each level, with a live sum check in words as well as symbols (never colour alone). */
function LevelMinimumEditor() {
  const { cfg, setCfg, visible, touch } = useConfigure()
  const m = cfg.model
  if (m?.kind !== "demonstration") return null
  const total = cfg.criteria.requiredCount
  const mins = m.levels.map((l) => ({ l, n: cfg.criteria.levelMinimums[l.id] }))
  const set = mins.filter((x) => typeof x.n === "number" && x.n > 0)
  const sum = set.reduce((a, x) => a + (x.n as number), 0)
  const errs = visible((p) => p === "criteria.levelMinimums" || p.startsWith("criteria.levelMinimums."))
  const within = total !== null && Number.isFinite(total) ? sum <= total : null
  return (
    <Field>
      <FieldLabel id="cfg-levelmin-label">{t.perLevel}</FieldLabel>
      <div role="group" aria-labelledby="cfg-levelmin-label" className="flex flex-wrap items-end gap-3">
        {mins.map(({ l, n }, i) => (
          <div key={l.id} className="flex flex-col gap-1">
            <FieldLabel htmlFor={`cfg-levelmin-${l.id}`}>{l.label.trim() || `Level ${i + 1}`}</FieldLabel>
            <NumberInput
              id={`cfg-levelmin-${l.id}`}
              className="w-24"
              aria-invalid={errs.length > 0}
              aria-describedby={describedBy(errs, "cfg-levelmin")}
              value={n ?? null}
              onChange={(v) =>
                setCfg((c) => {
                  const next = { ...c.criteria.levelMinimums }
                  if (v === null) delete next[l.id]
                  else next[l.id] = v
                  return setCriteria(c, { levelMinimums: next })
                })
              }
              onBlur={() => touch("criteria")}
            />
          </div>
        ))}
      </div>
      {set.length > 0 && total !== null ? (
        <p className="text-sm text-foreground" data-testid="sum-check">
          {total} {within ? "≥" : "<"} {set.map((x) => x.n).join(" + ")} ({within ? "Within total" : `Over total by ${sum - total}`})
        </p>
      ) : null}
      <Errors issues={errs} for="cfg-levelmin" />
    </Field>
  )
}

/**
 * C-6: optional minimum per named clinical setting, counted per setting, never as one clinical total (SC-11). Lab
 * or simulation evidence never counts toward a setting (SC-12): said in the helper.
 */
function SettingMinimumEditor() {
  const { db, cfg, setCfg, visible, warnings, touch } = useConfigure()
  const mins = cfg.criteria.settingMinimums
  const ids = Object.keys(mins)
  const settings = db.clinicalSettings
  const errs = visible((p) => p === "criteria.settingMinimums" || p.startsWith("criteria.settingMinimums."))
  const notes = warnings("criteria.settingMinimums")
  return (
    <Field>
      <FieldLabel htmlFor="cfg-setting-picker">{t.perSetting}</FieldLabel>
      <FieldDescription>{t.perSettingHelp}</FieldDescription>
      <div className="w-80 max-w-full">
        <SkillsMultiPick
          id="cfg-setting-picker"
          label="Clinical settings with a minimum"
          placeholder={t.chooseSettings}
          searchPlaceholder="Search settings"
          options={settings.filter((x) => x.active || ids.includes(x.id)).map((x) => ({ value: x.id, label: x.name, inactive: !x.active }))}
          value={ids}
          onChange={(next) =>
            setCfg((c) => {
              const out: Record<string, number> = {}
              for (const id of next) out[id] = c.criteria.settingMinimums[id] ?? 1
              return setCriteria(c, { settingMinimums: out })
            })
          }
        />
      </div>
      {ids.length === 0 ? <p className="text-sm text-muted-foreground">{t.noSettings}</p> : null}
      <ul className="flex flex-col gap-2">
        {ids.map((id) => {
          const name = settings.find((x) => x.id === id)?.name ?? id
          const e = visible((p) => p === `criteria.settingMinimums.${id}`)
          return (
            <li key={id} className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <FieldLabel htmlFor={`cfg-setmin-${id}`} className="w-48">
                  {name}
                </FieldLabel>
                <NumberInput id={`cfg-setmin-${id}`} aria-label={`Minimum in ${name}`} className="w-24" aria-invalid={e.length > 0} aria-describedby={describedBy(e, `cfg-setmin-${id}`)} value={mins[id]} onChange={(v) => setCfg((c) => setCriteria(c, { settingMinimums: { ...c.criteria.settingMinimums, [id]: v ?? NaN } }))} onBlur={() => touch("criteria")} />
              </div>
              <Errors issues={e} for={`cfg-setmin-${id}`} />
            </li>
          )
        })}
      </ul>
      {notes.map((n) => (
        <FieldDescription key={n.key} data-testid="setting-sum-note">
          {n.message}
        </FieldDescription>
      ))}
      <Errors issues={errs.filter((i) => !i.path.startsWith("criteria.settingMinimums."))} for="cfg-setting" />
    </Field>
  )
}
