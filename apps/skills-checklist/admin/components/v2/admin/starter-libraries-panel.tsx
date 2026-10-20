"use client"

import * as React from "react"
import { Badge } from "@exxatdesignux/ui/components/ui/badge"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@exxatdesignux/ui/components/ui/card"
import { Checkbox } from "@exxatdesignux/ui/components/ui/checkbox"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@exxatdesignux/ui/components/ui/sheet"
import { ADMIN_ID, useAdminRun } from "@/components/v2/admin/use-admin"
import { copyStarterSkills } from "@/lib/v2/admin-actions"
import { useV2State } from "@/lib/v2/react"
import { STARTER_LIBRARIES, type StarterLibrary } from "@/lib/v2/starter-libraries"

const norm = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()

/** Four specialty starter lists. Reviewing opens a sheet; nothing is added until "Copy N skills" (IM-05 spirit, SL-01 seam). */
export function StarterLibrariesPanel({ onCopied }: { onCopied: (message: string, firstSkillId: string) => void }) {
  const state = useV2State()
  const [open, setOpen] = React.useState<StarterLibrary | null>(null)
  const existing = React.useMemo(() => new Set(state.skills.map((k) => norm(k.name))), [state.skills])
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        {STARTER_LIBRARIES.map((lib) => {
          const copied = state.batches.filter((b) => b.kind === "starter-library" && b.label === `${lib.label} starter library`).length
          const dups = lib.skills.filter((k) => existing.has(norm(k.name))).length
          return (
            <Card key={lib.specialty}>
              <CardHeader>
                <CardTitle className="text-base">{lib.label}</CardTitle>
                <CardDescription>{lib.blurb}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                <Badge variant="secondary">{lib.skills.length} skills</Badge>
                {dups > 0 ? <Badge variant="outline">{dups} already in your library</Badge> : null}
                {copied > 0 ? <Badge variant="outline">{`Copied ${copied} ${copied === 1 ? "time" : "times"}`}</Badge> : null}
              </CardContent>
              <CardFooter>
                <Button type="button" variant="outline" size="default" onClick={() => setOpen(lib)}>
                  {`Review ${lib.label} skills`}
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>
      {open ? <ReviewSheet key={open.specialty} lib={open} existing={existing} onClose={() => setOpen(null)} onCopied={onCopied} /> : null}
    </>
  )
}

function ReviewSheet({ lib, existing, onClose, onCopied }: { lib: StarterLibrary; existing: Set<string>; onClose: () => void; onCopied: (m: string, firstSkillId: string) => void }) {
  const run = useAdminRun()
  const isDup = (i: number) => existing.has(norm(lib.skills[i].name))
  const [picked, setPicked] = React.useState<Set<number>>(() => new Set(lib.skills.map((_, i) => i).filter((i) => !existing.has(norm(lib.skills[i].name)))))
  const [error, setError] = React.useState<string | null>(null)
  const n = picked.size
  const toggle = (i: number, on: boolean) => {
    setPicked((p) => {
      const next = new Set(p)
      if (on) next.add(i)
      else next.delete(i)
      return next
    })
    setError(null)
  }
  const copy = () => {
    const r = run((s, at) => copyStarterSkills(s, lib.specialty, [...picked], ADMIN_ID, at))
    if (!r.ok) {
      setError(r.error)
      return
    }
    onCopied(`${r.created} ${r.created === 1 ? "skill" : "skills"} copied from ${lib.label}. They are not configured yet, so they cannot be mapped to a course until you configure them.`, r.state.batches[r.state.batches.length - 1].skillIds[0])
    onClose()
  }
  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" size="lg" className="flex flex-col gap-0 p-0">
        <SheetHeader className="border-b border-border p-4 pe-12">
          <SheetTitle>{lib.label} starter library</SheetTitle>
          <SheetDescription>Choose the skills to copy into your program. After copying you can rename, recategorize or remove them. Nothing is added until you copy.</SheetDescription>
        </SheetHeader>
        <ul className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-4" aria-label={`${lib.label} skills`}>
          {lib.skills.map((k, i) => {
            const id = `starter-${lib.specialty}-${i}`
            return (
              <li key={id} className="flex items-start gap-3 rounded-md border border-border p-3">
                <Checkbox id={id} checked={picked.has(i)} onCheckedChange={(v) => toggle(i, v === true)} className="mt-0.5" />
                <label htmlFor={id} className="flex min-w-0 flex-1 cursor-pointer flex-col gap-0.5">
                  <span className="text-sm font-medium text-foreground">{k.name}</span>
                  <span className="text-xs text-muted-foreground">{`${k.category}. ${k.description}`}</span>
                  {isDup(i) ? <span className="text-xs text-muted-foreground">Already in your library. Tick it to add a second copy.</span> : null}
                </label>
              </li>
            )
          })}
        </ul>
        <SheetFooter className="border-t border-border p-4">
          {error ? (
            <p role="alert" className="text-sm text-foreground">
              {error}
            </p>
          ) : null}
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" size="default" onClick={onClose}>
              Cancel
            </Button>
            <Button type="button" variant="default" size="default" disabled={n === 0} aria-describedby={n === 0 ? "copy-reason" : undefined} onClick={copy}>
              {`Copy ${n} ${n === 1 ? "skill" : "skills"}`}
            </Button>
          </div>
          {n === 0 ? (
            <p id="copy-reason" className="text-right text-xs text-muted-foreground">
              Tick at least one skill to copy.
            </p>
          ) : null}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
