"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@exxatdesignux/ui/components/ui/card"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { RadioGroup, RadioGroupItem } from "@exxatdesignux/ui/components/ui/radio-group"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { Block, StudentPage } from "@/components/v2/student/student-frame"
import { SyncChip } from "@/components/v2/student/sync-chip"
import { Announce, BANNER_TOUCH, fmtDate, TOUCH, useStudentRun, BTN } from "@/components/v2/student/use-student"
import { useV2State } from "@/lib/v2/react"
import { flushQueue, resolutionAllowed, resolveConflict, retryItem, syncBlock, syncSummary, type FlushResult, type Resolution } from "@/lib/v2/sync"
import { STUDENT_ID } from "@/lib/v2/student"
import type { SyncItem } from "@/lib/v2/types"

type Msg = { variant: "success" | "info" | "error" | "warning"; title: string; text: string; retry?: boolean }

const ORDER: Record<SyncItem["state"], number> = { conflict: 0, failed: 1, queued: 2, synced: 3 }

function flushMessage(f: FlushResult): Msg {
  if (f.blocked) return { variant: "warning", title: f.blocked === "offline" ? "You are offline" : "You are signed out", text: f.blocked === "offline" ? "Nothing was sent. Your changes are saved on this phone and send when you are back online." : "Nothing was sent. Your changes are saved on this phone and send after you sign in." }
  if (f.attempted === 0) return { variant: "info", title: "Nothing waiting", text: "Everything is already saved and sent." }
  const bits = [f.synced ? `${f.synced} synced` : "", f.failed ? `${f.failed} failed` : "", f.conflicts ? `${f.conflicts} in conflict` : ""].filter(Boolean)
  return { retry: f.failed > 0, variant: f.failed ? "error" : f.conflicts ? "warning" : "success", title: f.failed ? "Some changes did not send" : f.conflicts ? "Sent, with a conflict" : "Sent", text: `${bits.join(", ")}.${f.failed ? " They are still saved on this phone. Try again." : ""}${f.conflicts ? " Open the conflict to choose which version to keep." : ""}` }
}

/** Walkthrough step 7: connection status, the sync queue with retry one or all, the conflict screen and the demo controls. */
export function SyncPage() {
  const s = useV2State()
  const run = useStudentRun()
  const params = useSearchParams()
  const [resolving, setResolving] = React.useState<string | null>(params?.get("resolve") ?? null)
  const [msg, setMsg] = React.useState<Msg | null>(null)
  const sum = syncSummary(s)
  const block = syncBlock(s.device)
  const items = s.syncQueue.filter((i) => i.studentId === STUDENT_ID).slice().reverse().sort((a, b) => ORDER[a.state] - ORDER[b.state])
  const entryName = (i: SyncItem) => {
    const e = s.logEntries.find((x) => x.id === i.entryId)
    return e ? (s.skills.find((k) => k.id === e.skillId)?.name ?? "") : ""
  }

  const send = (ids?: string[]) => {
    const r = run((st, at) => {
      const f = ids ? retryItem(st, ids[0], at) : flushQueue(st, at)
      return { ok: true as const, state: f.state, result: f.result }
    })
    if (r.ok) setMsg(flushMessage(r.result))
  }

  const item = resolving ? s.syncQueue.find((i) => i.id === resolving && i.state === "conflict") : null
  if (item?.conflict) {
    return (
      <ConflictScreen
        item={item}
        skill={entryName(item)}
        onBack={() => setResolving(null)}
        onResolve={(choice) => {
          const r = run((st, at) => resolveConflict(st, item.id, choice, at))
          if (!r.ok) return setMsg({ variant: "error", title: "Not resolved", text: r.error })
          setResolving(null)
          const queued = r.flush.blocked
          setMsg({
            variant: "success",
            title: "Conflict resolved",
            text: `${choice === "mine" ? "Kept this phone's version." : choice === "theirs" ? "Kept the server's version." : "Kept both versions in one note."} ${queued ? "It is queued and sends when you are back online." : "The server and this phone now match."}`,
          })
        }}
      />
    )
  }

  return (
    <StudentPage title="Sync and offline">
      <Announce message={msg ? `${msg.title}. ${msg.text}` : ""} />
      {msg ? (
        <LocalBanner className={BANNER_TOUCH} variant={msg.variant} title={msg.title} dismissible onDismiss={() => setMsg(null)} retry={msg.variant === "error" && msg.retry && !block ? { label: "Send failed changes again", onClick: () => send() } : undefined} data-sync-message>
          {msg.text}
        </LocalBanner>
      ) : null}

      <Card size="sm">
        <CardContent>
          <dl className="grid grid-cols-3 gap-3 text-sm" aria-label="Phone status">
            <div className="flex flex-col gap-0.5">
              <dt className="text-muted-foreground">Connection</dt>
              <dd className="font-medium" data-status="connection">{s.device.offline ? "Offline" : "Online"}</dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className="text-muted-foreground">Account</dt>
              <dd className="font-medium" data-status="account">{s.device.signedOut ? "Signed out" : "Signed in"}</dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className="text-muted-foreground">App</dt>
              <dd className="font-medium" data-status="app">{s.device.updatePending ? "Update ready" : "Up to date"}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardContent>
          <dl className="grid grid-cols-2 gap-3 text-sm" aria-label="Sync counts">
            {(["queued", "synced", "failed", "conflict"] as const).map((st) => (
              <div key={st} className="flex items-center justify-between gap-2">
                <dt>
                  <SyncChip state={st} />
                </dt>
                <dd className="text-xl font-semibold tabular-nums" data-sync-count={st}>
                  {sum[st]}
                </dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2">
        <Button type="button" variant="default" size="lg" className={BTN} disabled={sum.waiting === 0 || !!block} aria-describedby="send-why" onClick={() => send()} data-send-all>
          {`Send all waiting (${sum.waiting})`}
        </Button>
        <p id="send-why" className="text-sm text-muted-foreground">
          {sum.waiting === 0 ? "Nothing is waiting to send." : block === "offline" ? "You are offline. Go online to send." : block === "signed-out" ? "You are signed out. Sign in to send." : "Sends every queued and failed change, in order."}
        </p>
      </div>

      <Block id="queue" title={`Changes (${items.length})`}>
        {items.length === 0 ? <p className="text-sm text-muted-foreground">Everything is saved. Nothing is waiting to send.</p> : null}
        <ul className="flex flex-col gap-3">
          {items.map((i) => (
            <li key={i.id}>
              <Card size="sm" role="article" aria-label={i.label} data-sync-item={i.state} data-item-id={i.id}>
                <CardHeader className="gap-1">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle asChild className="text-sm">
                      <h3>{i.label}</h3>
                    </CardTitle>
                    <SyncChip state={i.state} />
                  </div>
                  <CardDescription>{`Saved on this phone ${fmtDate(i.at)}${i.attempts ? `. Tried ${i.attempts} ${i.attempts === 1 ? "time" : "times"}` : ""}.`}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-2 text-sm">
                  <p className="text-foreground">
                    {i.state === "synced"
                      ? "Sent. The program has it."
                      : i.state === "queued"
                        ? block === "offline"
                          ? "Waiting for a connection."
                          : block === "signed-out"
                            ? "Waiting for sign in."
                            : "Waiting to send."
                        : i.state === "failed"
                          ? (i.error ?? "The server did not take this change. It is still saved on this phone.")
                          : `This ${i.conflict?.field === "rating" ? "rating" : "note"} was changed on another device. Choose which version to keep.`}
                  </p>
                  {i.state === "queued" || i.state === "failed" ? (
                    <div>
                      <Button type="button" variant="outline" size="lg" className={BTN} disabled={!!block} aria-label={`${i.state === "failed" ? "Retry" : "Send now"}: ${i.label}`} onClick={() => send([i.id])}>
                        {i.state === "failed" ? "Retry" : "Send now"}
                      </Button>
                    </div>
                  ) : null}
                  {i.state === "conflict" ? (
                    <div>
                      <Button type="button" variant="default" size="lg" className={BTN} aria-label={`Resolve conflict: ${i.label}`} onClick={() => setResolving(i.id)}>
                        Resolve conflict
                      </Button>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      </Block>
    </StudentPage>
  )
}

const CHOICES: Array<{ value: Resolution; label: string; consequence: (field: "note" | "rating") => string }> = [
  { value: "mine", label: "Keep this phone's version", consequence: (f) => `Your ${f} replaces the server's. The other device will show yours.` },
  { value: "theirs", label: "Keep the server's version", consequence: (f) => `The server's ${f} replaces what you wrote on this phone. What you wrote here is discarded.` },
  { value: "both", label: "Keep both", consequence: () => "Joins them into one note, server text first, then yours. Nothing is discarded." },
]

function ConflictScreen({ item, onBack, onResolve }: { item: SyncItem; skill: string; onBack: () => void; onResolve: (c: Resolution) => void }) {
  const c = item.conflict!
  const [choice, setChoice] = React.useState<Resolution | "">("")
  const headingRef = React.useRef<HTMLHeadingElement>(null)
  React.useEffect(() => headingRef.current?.focus(), [])
  const noun = c.field === "rating" ? "rating" : "note"
  return (
    <StudentPage title="Fix a sync conflict">
      <h2 ref={headingRef} tabIndex={-1} className="text-lg font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/50">{`Two versions of the ${noun}`}</h2>
      <div className="grid gap-3 md:grid-cols-2">
        <Card size="sm" role="region" aria-label="Version on this phone" data-version="mine">
          <CardHeader>
            <CardTitle asChild className="text-sm">
              <h3>On this phone</h3>
            </CardTitle>
            <CardDescription>Written on this phone and not sent yet.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-foreground">{c.mine || "Empty"}</p>
          </CardContent>
        </Card>
        <Card size="sm" role="region" aria-label="Version on the server" data-version="theirs">
          <CardHeader>
            <CardTitle asChild className="text-sm">
              <h3>On the server</h3>
            </CardTitle>
            <CardDescription>{`Saved by ${c.theirsBy.toLowerCase()} on ${fmtDate(c.theirsAt)}.`}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-foreground">{c.theirs}</p>
          </CardContent>
        </Card>
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium text-foreground">What should happen?</legend>
        <RadioGroup aria-label="Resolution" value={choice} onValueChange={(v) => setChoice(v as Resolution)} className="flex flex-col gap-2">
          {CHOICES.map((o) => {
            const ok = resolutionAllowed(c.field, o.value)
            const id = `resolve-${o.value}`
            return (
              <Label key={o.value} htmlFor={id} className={`${TOUCH} flex items-start gap-3 rounded-lg border border-border bg-card p-3 font-normal`}>
                <RadioGroupItem id={id} value={o.value} disabled={!ok.ok} aria-describedby={`${id}-d`} className="mt-0.5" />
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-foreground">{o.label}</span>
                  <span id={`${id}-d`} className="text-xs text-muted-foreground">
                    {ok.ok ? o.consequence(c.field) : ok.reason}
                  </span>
                </span>
              </Label>
            )
          })}
        </RadioGroup>
      </fieldset>
      <div className="flex flex-col gap-2">
        <Button type="button" variant="default" size="lg" className={BTN} disabled={!choice} aria-describedby={choice ? undefined : "resolve-why"} onClick={() => choice && onResolve(choice)} data-resolve>
          Resolve conflict
        </Button>
        {!choice ? (
          <p id="resolve-why" className="text-sm text-muted-foreground">
            Choose a version first.
          </p>
        ) : null}
        <Button type="button" variant="outline" size="lg" className={BTN} onClick={onBack}>
          Back to sync
        </Button>
      </div>
    </StudentPage>
  )
}
