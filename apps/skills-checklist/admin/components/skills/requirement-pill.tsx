import { Badge } from "@exxatdesignux/ui/components/ui/badge"
import type { Requirement } from "@/lib/domain/types"
import { term } from "@/lib/copy"

/** Mandatory or non-mandatory for an offering (CM-03). Text only; outline vs secondary is the only visual difference. */
export function RequirementPill({ requirement, forCourse = false }: { requirement: Requirement; forCourse?: boolean }) {
  const mandatory = requirement === "mandatory"
  const label = forCourse ? (mandatory ? term.mandatoryForCourse : term.nonMandatoryForCourse) : mandatory ? term.mandatory : term.nonMandatory
  return <Badge variant={mandatory ? "outline" : "secondary"}>{label}</Badge>
}
