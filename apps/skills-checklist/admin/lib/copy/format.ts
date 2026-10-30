// Structured criteria to readable text (S-04 "Achievement criteria" column, S-09 lineage, S-12 progress).
import { inSentence } from "@/lib/lab/terms"
import type { CriteriaPart } from "@/lib/store/selectors/shared"

export function criteriaSummary(parts: CriteriaPart[]): string {
  if (parts.length === 0) return "No criteria set"
  return parts
    .map((p) => {
      switch (p.kind) {
        case "required":
          return `${p.n} ${p.noun === "demonstrations" ? (p.n === 1 ? "demonstration" : "demonstrations") : p.n === 1 ? "qualifying evaluation" : "qualifying evaluations"}`
        case "level":
          return `${p.min} at ${inSentence(p.label)}`
        case "setting":
          return `${p.min} in ${inSentence(p.name)}`
      }
    })
    .join(", ")
}
