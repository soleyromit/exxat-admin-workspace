"use client"

/**
 * The live path a skill's evidence takes, from its rule (D-L52; docs/build/2026-11-04-configure-b-layout-concepts.md section 5):
 * Student logs, Student rates themselves (when on), Evaluator signs off, Approval before it counts (when on), Achieved. Read back,
 * never edited here, so it is an ordered list of real text, not a stepper (the DS has no read-only path; WizardNav needs a Wizard
 * and renders focusable buttons). Its nodes wear the DS wizard marker skin. A step that does not apply is simply not drawn.
 *
 * - From 1280 px: `ConfigurePanel` in the page's side column, [Steps | Evaluator | Student]. Below: `StepsRow`, icon and label only.
 * - Several skills (D-L48): an optional step or a value the skills differ on shows one Mixed badge per node, never "Not set yet.".
 * - No charts, no progress and no "repeats 3 times" loop: the number is in the Achieved sentence once.
 */
import * as React from "react"
import { Badge } from "@exxatdesignux/ui/components/ui/badge"
import { Separator } from "@exxatdesignux/ui/components/ui/separator"
import { StatusBadge } from "@exxatdesignux/ui/components/ui/status-badge"
import { ViewSegmentedControl } from "@exxatdesignux/ui/components/ui/view-segmented-control"
import { wizardMarkerClass } from "@exxatdesignux/ui/components/ui/wizard"
import { cn } from "@exxatdesignux/ui/lib/utils"
import { StateBadge } from "@/components/lab/status-pill"
import { TYPE } from "@/components/lab/type-scale"
import { ruleAllowsCheckOff, ruleSentence, type LabRule } from "@/lib/lab/configure"
import { inSentence } from "@/lib/lab/terms"
import { useV2State } from "@/lib/v2/react"
import { evaluatorScreenText, EvaluatorScreen, ExamplePicker, studentScreenText, StudentScreen, whoLine, type Example } from "./program-preview"

export type PathNodeId = "student" | "self" | "evaluator" | "approval" | "achieved"

export interface PathNode {
  id: PathNodeId
  icon: string
  label: string
  values: string[]
  /** The selected skills differ on this step (several skills only). */
  mixed: boolean
  /** A save attempt found this step's value missing. */
  missing: boolean
}

const MARKER = wizardMarkerClass("upcoming", "icons")

/** What the evaluator does under the rule, in a few words; null until there is something to say. */
function evidenceLine(rule: LabRule): string | null {
  const questions = rule.questions.filter((q) => q.trim()).length
  const levels = rule.levels.filter((l) => l.trim()).length
  const count = (n: number, one: string) => `${n} ${one}${n === 1 ? "" : "s"}`
  if (rule.model === "binary") {
    const [a, b] = rule.outcomeLabels.map((l) => l.trim())
    return a && b ? `Picks ${inSentence(a)} or ${inSentence(b)}` : null
  }
  if (rule.model === "question") return questions ? `Answers ${count(questions, "question")}` : null
  if (rule.model === "scored") return questions ? `Scores ${count(questions, "question")}, 1 to ${rule.scaleMax}` : null
  if (rule.model === "demonstration") return levels ? `Picks 1 of ${count(levels, "level")}` : null
  return null
}

/** The nodes drawn for a rule. `mixed` names the steps the selected skills differ on: an optional one stays, since some skills have it. */
export function pathNodes(rule: LabRule, { mixed = new Set<PathNodeId>(), showErrors = false }: { mixed?: ReadonlySet<PathNodeId>; showErrors?: boolean } = {}): PathNode[] {
  const fields = rule.studentFields.map((f) => f.label.trim()).filter(Boolean)
  const student = fields.length === 1 ? `Adds ${inSentence(fields[0]!)}` : fields.length > 1 ? `Adds ${fields.length} details` : null
  const evidence = evidenceLine(rule)
  const noRole = rule.evaluatorRoles.length === 0
  const nodes: PathNode[] = [{ id: "student", icon: "fa-user-graduate", label: "Student logs", values: mixed.has("student") || !student ? [] : [student], mixed: mixed.has("student"), missing: false }]
  if (rule.selfEvaluation || mixed.has("self")) nodes.push({ id: "self", icon: "fa-pen-to-square", label: "Student rates themselves", values: [], mixed: mixed.has("self"), missing: false })
  nodes.push({
    id: "evaluator",
    icon: "fa-signature",
    label: "Evaluator signs off",
    values: mixed.has("evaluator")
      ? []
      : [evidence, noRole ? null : whoLine(rule.evaluatorRoles), rule.feedbackRequired ? "Feedback required" : null, ruleAllowsCheckOff(rule) ? "Group check-off allowed" : null].filter((v): v is string => !!v),
    mixed: mixed.has("evaluator"),
    missing: showErrors && noRole && !mixed.has("evaluator"),
  })
  if (rule.approvalRequired || mixed.has("approval")) nodes.push({ id: "approval", icon: "fa-stamp", label: "Approval before it counts", values: [], mixed: mixed.has("approval"), missing: false })
  const sentence = ruleSentence(rule)
  nodes.push({ id: "achieved", icon: "fa-circle-check", label: "Achieved", values: mixed.has("achieved") ? [] : [sentence], mixed: mixed.has("achieved"), missing: false })
  return nodes
}

const MixedBadge = () => <Badge variant="outline" data-mixed>Mixed</Badge>

/** The vertical path. Text is real text in an ordered list; the connector and glyphs are decoration. */
export function StepsPath({ nodes }: { nodes: PathNode[] }) {
  return (
    <ol className="flex flex-col" data-steps-path>
      {nodes.map((n, i) => {
        const last = i === nodes.length - 1
        return (
          <li key={n.id} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-x-3" data-path-node={n.id}>
            <span className="flex flex-col items-center">
              <span aria-hidden="true" className={cn(MARKER, "size-8 border")}>
                <i className={`fa-light ${n.icon}`} />
              </span>
              {last ? null : <Separator orientation="vertical" decorative className="min-h-4 flex-1" />}
            </span>
            <div className={cn("flex min-w-0 flex-col items-start gap-1 pt-1.5", !last && "pb-5")}>
              {n.id === "achieved" ? <StateBadge state="achieved" /> : <p className={TYPE.label}>{n.label}</p>}
              {n.values.map((v) => <p key={v} className={TYPE.meta}>{v}</p>)}
              {n.mixed ? <MixedBadge /> : null}
              {n.missing ? <StatusBadge label="Not set" tone="warning" icon="fa-triangle-exclamation" size="sm" /> : null}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

/** Below 1280 px, where the side column is hidden: the same steps as one row of icon and label, above "Who does what". */
export function StepsRow({ nodes }: { nodes: PathNode[] }) {
  return (
    <ol className="flex flex-wrap items-center gap-x-2 gap-y-2 min-[1280px]:hidden" data-steps-row>
      {nodes.map((n, i) => (
        <li key={n.id} className="flex items-center gap-2">
          {i > 0 ? <Separator orientation="horizontal" decorative className="w-4" /> : null}
          <span aria-hidden="true" className={cn(MARKER, "size-8 border")}>
            <i className={`fa-light ${n.icon}`} />
          </span>
          <span className={TYPE.label}>{n.label}</span>
        </li>
      ))}
    </ol>
  )
}

type View = "steps" | "evaluator" | "student"
const VIEW_OPTIONS = [
  { value: "steps", label: "Steps" },
  { value: "evaluator", label: "Evaluator" },
  { value: "student", label: "Student" },
] as const

/**
 * The side column of Configure B and of several skills: the path, or the real evaluator or student screen for this draft, with the
 * Example picker when more than one skill is being configured. The path text is announced politely as it changes.
 */
export function ConfigurePanel({ nodes, rule, examples }: { nodes: PathNode[]; rule: LabRule; examples: Example[] }) {
  const state = useV2State()
  const [view, setView] = React.useState<View>("steps")
  const [pick, setPick] = React.useState<string | null>(null)
  const example = examples.find((x) => x.id === pick) ?? examples[0] ?? null
  const shown = example?.rule ?? rule
  const program = `${state.program.school} ${state.program.name}`
  const live = `${nodes.filter((n) => n.id !== "achieved").map((n) => n.label).join(", ")}. ${nodes.find((n) => n.id === "achieved")?.values[0] ?? ""}`
  return (
    <section className="flex flex-col gap-4" aria-labelledby="cfg-panel-title" data-configure-panel>
      <h2 id="cfg-panel-title" className="sr-only">What happens</h2>
      <ViewSegmentedControl<View> aria-label="Show" value={view} onValueChange={setView} options={VIEW_OPTIONS} />
      <p className="sr-only" aria-live="polite">{live}</p>
      {view === "steps" ? <StepsPath nodes={nodes} /> : null}
      {view !== "steps" && example ? (
        <>
          {examples.length > 1 ? <ExamplePicker options={examples} value={example} onChange={setPick} /> : null}
          {/* A long question set scrolls inside the panel, keeping the page's one sticky column in view. */}
          <div role="region" tabIndex={0} aria-label="Preview" className="flex max-h-[calc(100dvh-14rem)] flex-col overflow-y-auto outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]" data-panel-preview>
            <p className="sr-only">{view === "evaluator" ? evaluatorScreenText(shown, shown.evaluatorRoles, example.name) : studentScreenText(shown, example.name)}</p>
            {view === "evaluator" ? <EvaluatorScreen rule={shown} example={example} program={program} /> : <StudentScreen rule={shown} example={example} />}
          </div>
        </>
      ) : null}
    </section>
  )
}
