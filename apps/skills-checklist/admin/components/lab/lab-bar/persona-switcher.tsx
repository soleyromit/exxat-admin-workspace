"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@exxatdesignux/ui/components/ui/dropdown-menu"
import { PERSONAS, PERSONA_BY_ID, isPersonaId } from "@/lib/lab/personas"
import { screenHref, type PersonaId } from "@/lib/lab/screens"
import { flowHref, flowsForPersona, mainSteps } from "@/lib/lab/flows"

export function personaFromPath(pathname: string): PersonaId | null {
  const seg = pathname.split("/")[2] ?? ""
  return isPersonaId(seg) ? seg : null
}

/**
 * Where switching persona lands: on a flow page, the new persona's first flow at step 1 (recommended set); elsewhere, the
 * persona's landing screen.
 */
export function personaTarget(id: PersonaId, inFlow: boolean): string {
  const first = inFlow ? flowsForPersona(id)[0] : undefined
  const step = first ? mainSteps(first)[0] : undefined
  return first && step ? flowHref(first.id, step.id, first.recommendedSet) : screenHref(id, PERSONA_BY_ID[id].landing)
}

export function PersonaRadioItems({ value, onPick }: { value: string; onPick: (id: PersonaId) => void }) {
  return (
    <DropdownMenuRadioGroup value={value} onValueChange={(v) => { if (isPersonaId(v)) onPick(v) }}>
      {PERSONAS.map((p) => (
        <DropdownMenuRadioItem key={p.id} value={p.id} className="min-h-9">{p.label}</DropdownMenuRadioItem>
      ))}
    </DropdownMenuRadioGroup>
  )
}

/** "View as" persona menu. `persona` wins over the URL (the flow route has no persona segment). */
export function PersonaSwitcher({ persona: given, inFlow = false, variant = "outline" }: { persona?: PersonaId | null; inFlow?: boolean; variant?: "outline" | "ghost" }) {
  const router = useRouter()
  const fromPath = personaFromPath(usePathname() ?? "")
  const persona = given ?? fromPath
  const label = persona ? PERSONA_BY_ID[persona].label : "Choose persona"
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant={variant} size="sm" aria-label={`View as ${label}. Switch persona`} className="max-w-48 min-w-0 shrink gap-1.5">
          <span className="truncate">{label}</span>
          <i className="fa-light fa-chevron-down text-xs text-muted-foreground" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={8} className="w-64">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">View as</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <PersonaRadioItems value={persona ?? ""} onPick={(id) => router.push(personaTarget(id, inFlow))} />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
