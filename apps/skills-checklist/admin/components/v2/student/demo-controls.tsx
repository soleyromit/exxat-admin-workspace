"use client"

import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@exxatdesignux/ui/components/ui/card"
import { useV2State } from "@/lib/v2/react"
import { simulateServerEdit } from "@/lib/v2/sync"
import { TOUCH, useDevice, useStudentRun, BTN } from "@/components/v2/student/use-student"

/** Demo controls for the student phone. They are not part of the product: they stand in for the real connection, account and update state. */
export function DemoControls({ onMessage }: { onMessage: (text: string, variant: "success" | "info" | "error") => void }) {
  const s = useV2State()
  const device = useDevice()
  const run = useStudentRun()
  const d = s.device
  const flushText = (f: ReturnType<typeof device>, base: string) => {
    if (!f) return base
    const bits = [f.synced ? `${f.synced} synced` : "", f.failed ? `${f.failed} failed` : "", f.conflicts ? `${f.conflicts} in conflict` : ""].filter(Boolean)
    return bits.length ? `${base} ${bits.join(", ")}.` : base
  }
  return (
    <Card data-demo-controls>
      <CardHeader>
        <CardTitle asChild className="text-base">
          <h2>Demo controls (not part of the product)</h2>
        </CardTitle>
        <CardDescription>They stand in for the phone's real connection, account and update state, so a presenter can show every case.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <Button type="button" variant="outline" size="lg" className={BTN} onClick={() => onMessage(flushText(device({ offline: !d.offline }), d.offline ? "Back online." : "Offline. Logging keeps working."), "info")}>
          {d.offline ? "Go online" : "Go offline"}
        </Button>
        <Button type="button" variant="outline" size="lg" className={BTN} onClick={() => onMessage(flushText(device({ signedOut: !d.signedOut }), d.signedOut ? "Signed in. No redirect, you are where you were." : "Signed out. Logging keeps working."), "info")}>
          {d.signedOut ? "Sign in" : "Sign out"}
        </Button>
        <Button type="button" variant="outline" size="lg" className={BTN} onClick={() => { device({ updatePending: !d.updatePending }); onMessage(d.updatePending ? "Update installed." : "An update is pending. It never blocks logging.", "info") }}>
          {d.updatePending ? "Install update" : "Mark update as pending"}
        </Button>
        <Button type="button" variant="outline" size="lg" className={BTN} disabled={d.failNextSync} onClick={() => { device({ failNextSync: true }); onMessage("The next sync will fail once. Nothing is lost.", "info") }}>
          {d.failNextSync ? "Next sync will fail" : "Make the next sync fail"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          className={TOUCH}
          onClick={() => {
            const r = run((st, at) => simulateServerEdit(st, at))
            onMessage(r.ok ? "Another device changed the latest entry. The conflict shows when it syncs, or now if it already synced." : r.error, r.ok ? "info" : "error")
          }}
        >
          Simulate an edit on another device
        </Button>
      </CardContent>
    </Card>
  )
}
