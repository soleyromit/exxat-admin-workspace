"use client"

import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { DragHandleGripIcon } from "@exxatdesignux/ui/components/ui/drag-handle-grip"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { r2c } from "@/lib/copy/r2-configure"
import { addLevel, moveLevel, removeLevelFromDraft, setLevelLabel } from "./draft"
import { useConfigure } from "./context"
import { describedBy, Errors } from "./section-card"

/** The "Add level" button lives in the card header (prototype P-08); the focus target id stays `cfg-add-level`. */
export function AddLevelButton() {
  const { setCfg } = useConfigure()
  return (
    <Button id="cfg-add-level" type="button" variant="outline" size="sm" onMouseDown={(e) => e.preventDefault()} onClick={() => setCfg((c) => addLevel(c))}>
      <i className="fa-light fa-plus" aria-hidden="true" />
      {r2c.step2.demonstration.add}
    </Button>
  )
}

/**
 * C-4: the ordered level rows (SC-08), numbered 1..n with up, down and remove icon controls like the prototype. Levels are
 * program-defined and ordered most-supervised first. Reorder has a keyboard path (the arrow buttons) and a pointer path
 * (drag the row); neither is the only way.
 */
export function LevelRows() {
  const { cfg, setCfg, visible, touch, announce, removal, setRemoval } = useConfigure()
  const [drag, setDrag] = React.useState<number | null>(null)
  const m = cfg.model
  if (m?.kind !== "demonstration") return null
  const listErrors = visible((p) => p === "model.levels")

  const move = (from: number, to: number) => {
    if (to < 0 || to >= m.levels.length) return
    setCfg((c) => moveLevel(c, from, to))
    announce(`${m.levels[from].label || `Level ${from + 1}`} moved to position ${to + 1} of ${m.levels.length}.`)
  }

  return (
    <div className="flex flex-col gap-2">
      <ol aria-label="Levels of supervision" className="flex flex-col gap-2">
        {m.levels.map((l, i) => {
          const errs = visible((p) => p === `model.levels.${i}`)
          return (
            <li
              key={l.id}
              className="flex flex-col gap-1"
              draggable
              onDragStart={() => setDrag(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (drag !== null && drag !== i) move(drag, i)
                setDrag(null)
              }}
              onDragEnd={() => setDrag(null)}
            >
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground" aria-hidden="true">
                  <DragHandleGripIcon />
                </span>
                <span className="w-5 text-xs text-muted-foreground" aria-hidden="true">
                  {i + 1}
                </span>
                <Input
                  id={`cfg-level-${i}`}
                  aria-label={`Level ${i + 1}`}
                  aria-invalid={errs.length > 0}
                  aria-describedby={describedBy(errs, `cfg-level-${i}`)}
                  value={l.label}
                  onChange={(e) => setCfg((c) => setLevelLabel(c, l.id, e.target.value))}
                  onBlur={() => touch("model")}
                />
                <Button type="button" variant="ghost" size="icon-sm" disabled={i === 0} aria-label={`Move up, level ${i + 1}`} onClick={() => move(i, i - 1)}>
                  <i className="fa-light fa-chevron-up" aria-hidden="true" />
                </Button>
                <Button type="button" variant="ghost" size="icon-sm" disabled={i === m.levels.length - 1} aria-label={`Move down, level ${i + 1}`} onClick={() => move(i, i + 1)}>
                  <i className="fa-light fa-chevron-down" aria-hidden="true" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Remove level ${i + 1}`}
                  onClick={() => {
                    const r = removeLevelFromDraft(cfg, l.id)
                    setCfg(() => r.cfg)
                    setRemoval({ kind: "level", n: r.removedFromRules })
                    announce(`Level ${i + 1} removed. Removed from ${r.removedFromRules} ${r.removedFromRules === 1 ? "rule" : "rules"}.`)
                  }}
                >
                  <i className="fa-light fa-trash-can" aria-hidden="true" />
                </Button>
              </div>
              <Errors issues={errs} for={`cfg-level-${i}`} />
            </li>
          )
        })}
      </ol>
      <Errors issues={listErrors} />
      {removal?.kind === "level" ? (
        <p className="text-sm text-muted-foreground" data-testid="removal-note">
          Removed from {removal.n} {removal.n === 1 ? "rule" : "rules"}. Evidence already recorded is kept; it stops counting toward this level until the level is restored.
        </p>
      ) : null}
      <p className="text-xs text-muted-foreground">{r2c.step2.demonstration.removeNote}</p>
    </div>
  )
}
