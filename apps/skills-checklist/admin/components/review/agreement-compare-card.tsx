import type { RecordedDetail } from "@/lib/store"
import { reviewCopy as rv } from "@/lib/copy"

/** One-line outcome for a recorded assessment. The full answers live in the responses disclosure (RP-07). */
export function outcomeOf(d: RecordedDetail): string {
  switch (d.kind) {
    case "binary":
      return d.label
    case "demonstration":
      return d.level
    case "question":
      return rv.yesOf(d.yes, d.total)
    case "scored":
      return rv.average(d.average)
  }
}
