import * as React from "react"
import { render } from "@testing-library/react"
import axe from "axe-core"
import { TooltipProvider } from "@exxatdesignux/ui/components/ui/tooltip"
import { expect } from "vitest"
import type { Db } from "@/lib/domain/types"
import { buildSeed } from "@/lib/seed"
import { reviewEvaluation, type Result } from "@/lib/store"
import { ReviewView, type DecisionInput, type ReviewViewProps } from "@/components/review/review-view"

export const seedDb = (): Db => buildSeed()

export interface HarnessProps extends Partial<Pick<ReviewViewProps, "status" | "onRetry">> {
  db?: Db
  /** A deep link /review/{submissionId}. */
  current?: string | null
  /** Replace the commit, to simulate a failing save or count calls. */
  decide?: (input: DecisionInput, db: Db) => Result<{ reviewId: string }> | Promise<Result<{ reviewId: string }>>
  onDb?: (db: Db) => void
  onSettled?: () => void
}

export const NOW = "2026-10-09T10:00:00.000Z"

/** Holds the program database the connected page keeps, so the whole surface runs without a router. */
export function Harness({ db: initial = seedDb(), current = null, decide, onDb, onSettled, ...rest }: HarnessProps) {
  const [db, setDb] = React.useState<Db>(initial)
  const dbRef = React.useRef(db)
  dbRef.current = db
  return (
    <TooltipProvider>
      <main>
        <ReviewView
          db={db}
          currentSubmissionId={current}
          onSettled={onSettled}
          onDecide={(input) => {
            if (decide) return decide(input, dbRef.current)
            const r = reviewEvaluation(dbRef.current, input, { now: NOW })
            if (r.ok) {
              setDb(r.db)
              onDb?.(r.db)
            }
            return r
          }}
          {...rest}
        />
      </main>
    </TooltipProvider>
  )
}

export const renderReview = (p: HarnessProps = {}) => render(<Harness {...p} />)

// color-contrast cannot be computed in jsdom; the real-browser run checks it.
const noContrast = { rules: { "color-contrast": { enabled: false } } }
export async function expectNoAxeViolations(el: HTMLElement = document.body) {
  const r = await axe.run(el, noContrast)
  expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.html.slice(0, 120)).join(" | ")}`)).toEqual([])
}

/** Filled (primary) buttons: the DS `default` variant carries the bg-primary token. */
export const filledButtons = (root: ParentNode = document.body): HTMLElement[] => Array.from(root.querySelectorAll<HTMLElement>("button")).filter((b) => /(^|\s)bg-primary(\s|$)/.test(b.className))
