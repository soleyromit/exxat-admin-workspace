"use client"

/**
 * Sign-in flow builder: canvas on the left, properties for the selected node on
 * the right, one toolbar across the top.
 *
 * The layout is the argument. A flow is a sequence with branches, so it is drawn
 * as one (`flow-canvas.tsx`) instead of being implied by nested cards, and only
 * the node you selected is editable (`flow-properties.tsx`) instead of every field
 * in every flow being open at once. Those two changes are what the previous
 * version got wrong.
 *
 * The tester earns its place for the same reason. Conditions are worth nothing if
 * you cannot tell whether one fires, and you cannot look at a sign-in page while
 * signed in, so typing an email here marks the canvas with what would run.
 *
 * Edits are held as a draft and written on Save. Live-saving a flow you are
 * halfway through renaming would leave the sign-in page running a half-built one,
 * and sign-in is the surface you cannot recover from inside the app.
 *
 * **Which flow runs is not part of that draft**, and it is not a second picker
 * either. One selector says which flow you are looking at, and `Try this flow`
 * saves it, points the sign-in page at it, and ends the session, because seeing a
 * flow run is the reason to open this page and you cannot see a sign-in page while
 * signed in. A badge next to the selector says whether the flow on screen is the
 * one that currently runs.
 *
 * Both halves of that were wrong before. A separate "Runs on the sign-in page"
 * picker held its value in the draft, so choosing a role applied nothing until
 * Save and was discarded by any other way out of the page; and once two pickers
 * could disagree, the primary action had to silently overrule one of them.
 */

import * as React from "react"
import { useNavigate } from "react-router"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { StatusBadge } from "@/components/ui/status-badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { FlowCanvas, type CanvasSelection } from "@/components/builder/flow-canvas"
import { FlowInspector } from "@/components/builder/flow-inspector"
import { useLogOut } from "@/hooks/use-log-out"
import {
  alwaysAuthenticates,
  createAuthStep,
  createChoiceStep,
  createFlow,
  describeFlow,
  dryRun,
  duplicateFlow,
  getActiveFlowId,
  getLoginFlows,
  saveLoginFlows,
  setActiveFlowId,
  type LoginFlowDefinition,
} from "@/lib/login-flow"

/**
 * The flow list, split into the shapes and the roles.
 *
 * Two groups rather than one list of nine. The role flows are all the same shape
 * and differ only in what they hand the session, so reading them as a set is the
 * point; mixed in with "Straight in" and "Pick an app" they looked like six more
 * variations on sign-in, which is the opposite of what they are.
 */
function FlowOptions({ flows }: { flows: LoginFlowDefinition[] }) {
  const roles = flows.filter(flow => flow.id.startsWith("role-"))
  const rest = flows.filter(flow => !flow.id.startsWith("role-"))

  if (roles.length === 0) {
    return (
      <>
        {rest.map(item => (
          <SelectItem key={item.id} value={item.id}>
            {item.name}
          </SelectItem>
        ))}
      </>
    )
  }

  return (
    <>
      <SelectGroup>
        <SelectLabel>Shapes</SelectLabel>
        {rest.map(item => (
          <SelectItem key={item.id} value={item.id}>
            {item.name}
          </SelectItem>
        ))}
      </SelectGroup>
      <SelectGroup>
        <SelectLabel>User roles</SelectLabel>
        {roles.map(item => (
          <SelectItem key={item.id} value={item.id}>
            {item.name}
          </SelectItem>
        ))}
      </SelectGroup>
    </>
  )
}

export function SignInFlowsClient() {
  const navigate = useNavigate()
  const logOut = useLogOut()

  const [flows, setFlows] = React.useState<LoginFlowDefinition[]>(getLoginFlows)
  const [activeId, setActiveId] = React.useState<string>(getActiveFlowId)
  const [editingId, setEditingId] = React.useState<string>(getActiveFlowId)
  const [selection, setSelection] = React.useState<CanvasSelection>({ kind: "flow" })
  const [testIdentifier, setTestIdentifier] = React.useState("")
  const [dirty, setDirty] = React.useState(false)
  const [saved, setSaved] = React.useState(false)

  const flow = flows.find(current => current.id === editingId) ?? flows[0]

  function markDirty() {
    setDirty(true)
    setSaved(false)
  }

  const updateFlow = React.useCallback((next: LoginFlowDefinition) => {
    setFlows(current => current.map(item => (item.id === next.id ? next : item)))
    setDirty(true)
    setSaved(false)
  }, [])

  const persist = React.useCallback(() => {
    saveLoginFlows(flows)
    setDirty(false)
    setSaved(true)
  }, [flows])

  /**
   * Point the sign-in page at a flow, now.
   *
   * Not deferred to Save, because this is a pointer rather than an edit: there is
   * no half-written state to protect, and the only thing deferring it bought was a
   * choice that looked applied and was not.
   */
  const chooseActive = React.useCallback((id: string) => {
    setActiveId(id)
    setActiveFlowId(id)
  }, [])

  /** Only run the tester when there is something to test. */
  const statuses = testIdentifier.trim() ? dryRun(flow, testIdentifier) : null

  function openFlow(id: string) {
    setEditingId(id)
    setSelection({ kind: "flow" })
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ── Toolbar ──────────────────────────────────────────── */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex min-w-56 flex-col gap-1.5">
            <Label htmlFor="flow-picker">Flow</Label>
            <Select value={flow.id} onValueChange={openFlow}>
              <SelectTrigger id="flow-picker">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <FlowOptions flows={flows} />
              </SelectContent>
            </Select>
          </div>

          {/* Whether the flow on screen is the one sign-in runs. The badge, and
              not a second selector: two pickers meant the page could hold two
              answers at once, and the primary action had to silently pick one. */}
          {flow.id === activeId ? (
            <StatusBadge
              label="Runs at sign-in"
              tone="success"
              icon="fa-circle-check"
              size="sm"
              className="mb-2"
            />
          ) : null}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline">
                <i className="fa-light fa-ellipsis" aria-hidden="true" />
                Flow
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem
                onSelect={() => {
                  const created = createFlow()
                  setFlows(current => [...current, created])
                  openFlow(created.id)
                  markDirty()
                }}
              >
                <i className="fa-light fa-plus" aria-hidden="true" />
                New flow
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  const copy = duplicateFlow(flow)
                  setFlows(current => [...current, copy])
                  openFlow(copy.id)
                  markDirty()
                }}
              >
                <i className="fa-light fa-copy" aria-hidden="true" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={flows.length < 2}
                onSelect={() => {
                  const remaining = flows.filter(item => item.id !== flow.id)
                  setFlows(remaining)
                  // The sign-in page needs a flow to run, so deleting the active
                  // one has to hand the role to another.
                  if (activeId === flow.id) chooseActive(remaining[0].id)
                  openFlow(remaining[0].id)
                  markDirty()
                }}
              >
                <i className="fa-light fa-trash" aria-hidden="true" />
                Delete flow
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            type="button"
            variant="outline"
            onClick={() =>
              updateFlow({ ...flow, steps: [...flow.steps, createChoiceStep()] })
            }
          >
            <i className="fa-light fa-split" aria-hidden="true" />
            Add choice
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => updateFlow({ ...flow, steps: [...flow.steps, createAuthStep()] })}
          >
            <i className="fa-light fa-key" aria-hidden="true" />
            Add sign-in
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {dirty ? (
            <span className="text-sm text-muted-foreground">Unsaved changes.</span>
          ) : saved ? (
            <span className="text-sm text-muted-foreground" role="status">
              Saved.
            </span>
          ) : null}
          <Button type="button" variant="outline" onClick={persist} disabled={!dirty}>
            <i className="fa-light fa-floppy-disk" aria-hidden="true" />
            Save
          </Button>
          {/* The primary action, because looking at a flow and wanting to see it run
              is the whole reason for this page, and you cannot see a sign-in page
              while signed in. It saves, points the runtime at this flow, and ends
              the session, so trying a role is one click rather than three controls
              in the right order. */}
          <Button
            type="button"
            onClick={() => {
              persist()
              chooseActive(flow.id)
              logOut()
            }}
          >
            <i className="fa-light fa-play" aria-hidden="true" />
            Try this flow
          </Button>
        </div>
      </div>

      {/* ── Flow name + tester ───────────────────────────────── */}
      <Card size="sm" className="flex-row flex-wrap items-end gap-4">
        {/* The flow's own name is not a node on the canvas, so it lives with the
            other flow-level controls rather than in the node inspector. */}
        <div className="flex min-w-48 flex-col gap-1.5">
          <Label htmlFor="flow-name">Name</Label>
          <Input
            id="flow-name"
            value={flow.name}
            onChange={event => updateFlow({ ...flow, name: event.target.value })}
          />
        </div>

        <div className="flex min-w-56 flex-1 flex-col gap-1.5">
          <Label htmlFor="test-identifier">Try an email</Label>
          <Input
            id="test-identifier"
            value={testIdentifier}
            onChange={event => setTestIdentifier(event.target.value)}
            placeholder="student@school.edu"
          />
          <p className="text-xs text-muted-foreground">
            Marks the canvas with the steps this email would see.
          </p>
        </div>

      </Card>

      {!alwaysAuthenticates(flow) ? (
        <p
          role="status"
          className="flex items-start gap-2 rounded-lg border border-chip-4/40 bg-chip-4/15 p-3 text-sm"
        >
          <i className="fa-light fa-triangle-exclamation mt-0.5" aria-hidden="true" />
          <span>
            Every sign-in step in this flow is conditional, so some people would reach the
            end without signing in. The sign-in page adds a password step for them. Add one
            sign-in step with no conditions to decide it yourself.
          </span>
        </p>
      ) : null}

      {/* ── Canvas ──────────────────────────────────────────── */}
      {/* Full width. The config for a node opens in the floating inspector, so the
          diagram never gives up room to a panel that is empty most of the time. */}
      <FlowCanvas
        flow={flow}
        selection={selection}
        dryRunStatuses={statuses}
        onSelect={setSelection}
        onInsertAfter={index => {
          const step = createChoiceStep()
          const steps = [...flow.steps]
          steps.splice(index, 0, step)
          updateFlow({ ...flow, steps })
          setSelection({ kind: "step", stepId: step.id })
        }}
      />

      <FlowInspector
        flow={flow}
        selection={selection}
        onChangeFlow={updateFlow}
        onSelect={setSelection}
      />

      <div className="flex flex-wrap items-center gap-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button type="button" variant="outline" onClick={() => navigate("/login")}>
              <i className="fa-light fa-arrow-up-right-from-square" aria-hidden="true" />
              Open the sign-in page
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            The sign-in page reads the active flow when it loads
          </TooltipContent>
        </Tooltip>
        <p className="text-sm text-muted-foreground">{describeFlow(flow)}</p>
      </div>
    </div>
  )
}
