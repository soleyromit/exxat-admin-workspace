"use client"

/**
 * A skill's evaluation method, chosen on a list's page (D-LS1116-b, Proposed; prototype 11-16 [11] "Method, all lists"). The method is the skill's, the
 * same on every list. The choices are the saved methods of Evaluation settings (lib/lab/methods.ts). A skill with none reads "Choose a method":
 * nothing is assumed [REQ SC-01, SC-02]. A choice that changes someone's progress names them first [REQ AE-02], with the dialog every rule change uses.
 */
import * as React from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@exxatdesignux/ui/components/ui/select"
import { FieldError } from "@exxatdesignux/ui/components/ui/field"
import { useV2Store } from "@/lib/v2/react"
import { DEMO_TODAY, IDS } from "@/lib/v2/seed-core"
import { setSkillMethod, skillMethodImpact, type EvaluationMethod } from "@/lib/lab/methods"
import { ImpactDialog } from "./times-needed"

/** What every row reads, worked out once for the table (methodsOf walks every skill). */
export interface MethodsInView {
  choices: EvaluationMethod[]
  /** Skill id to the method it uses now. */
  of: ReadonlyMap<string, EvaluationMethod>
}
export const MethodsContext = React.createContext<MethodsInView>({ choices: [], of: new Map() })

const stamp = () => ({ at: `${DEMO_TODAY}T${new Date().toISOString().slice(11, 19)}Z`, byId: IDS.ross })
const stop = (e: React.SyntheticEvent) => e.stopPropagation()

export function MethodCell({ id, name, inactive }: { id: string; name: string; inactive: boolean }) {
  const { choices, of } = React.useContext(MethodsContext)
  const store = useV2Store()
  const now = of.get(id) ?? null
  const [ask, setAsk] = React.useState<{ methodId: string; label: string; students: Array<{ id: string; name: string }> } | null>(null)
  const [said, setSaid] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const apply = (methodId: string, label: string) => {
    let failed: string | null = null
    store.update((s) => {
      const r = setSkillMethod(s, id, methodId, stamp())
      if (!r.ok) { failed = r.error; return s }
      return r.state
    })
    setError(failed)
    setSaid(failed ? "" : `${name} now uses ${label}.`)
  }
  const choose = (methodId: string) => {
    const m = choices.find((x) => x.id === methodId)
    if (!m || m.id === now?.id) return
    const students = skillMethodImpact(store.getSnapshot(), id, methodId)
    if (students.length) setAsk({ methodId, label: m.name, students })
    else apply(methodId, m.name)
  }
  // An inactive skill counts in nothing: its method is read, not changed, here (its panel can still change it).
  if (inactive) return <span className="block truncate text-muted-foreground" data-method-cell={id}>{now?.name ?? "None"}</span>
  return (
    <span className="flex min-w-0 flex-col gap-0.5" onClick={stop} onKeyDown={stop} data-method-cell={id}>
      <Select value={now?.id ?? ""} onValueChange={choose} disabled={!choices.length}>
        <SelectTrigger size="sm" className="h-8 w-full min-w-0" aria-label={`Evaluation method for ${name}`} aria-invalid={!!error} aria-describedby={error ? `method-error-${id}` : undefined}>
          <SelectValue placeholder={choices.length ? "Choose a method" : "No methods yet"} />
        </SelectTrigger>
        <SelectContent position="popper" align="start">
          {choices.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
        </SelectContent>
      </Select>
      {error ? <FieldError id={`method-error-${id}`} className="text-xs">{error}</FieldError> : null}
      <span className="sr-only" aria-live="polite">{said}</span>
      <ImpactDialog
        open={!!ask}
        title={ask ? `Use ${ask.label} for ${name}?` : ""}
        students={ask?.students ?? []}
        confirm="Change method"
        skillId={id}
        onCancel={() => setAsk(null)}
        onConfirm={() => { if (ask) apply(ask.methodId, ask.label); setAsk(null) }}
      />
    </span>
  )
}
