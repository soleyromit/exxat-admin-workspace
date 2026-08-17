/**
 * Sign-in flows, as data rather than three hard-coded branches.
 *
 * Sign-in is not one decision. Some workspaces drop you straight in, some make
 * you pick which app you bought, some branch on who you are, and some do two of
 * those in a row. Encoding that as a list of steps means a new flow is a row in
 * storage instead of a code change, which is the point: the builder at
 * `/builder/sign-in-flows` writes these and `LoginPage` reads them.
 *
 * A flow always starts with the identifier, because the identifier is what
 * decides how someone authenticates. Everything after it is configurable:
 *
 *   identifier (implicit) → [auth: password | sso] → [choice] → [choice] → …
 *
 * Prototype wiring, not a customer preference. When real auth lands the server
 * answers these questions from session claims and this module goes away.
 */

import { getStorageItem, setStorageItem } from "@exxatdesignux/ui/lib/persisted-state"
import {
  OPERATOR_LABELS,
  type FilterOperator,
} from "@exxatdesignux/ui/lib/table-properties-types"
import type { Product } from "@exxatdesignux/product-framework"

import { isStudentHomePath } from "./student-shell"
import {
  clearLoginSession,
  DEFAULT_LOGIN_SESSION,
  GRANTABLE_PRODUCTS,
  isWorkspaceRole,
  OPEN_AS_LABEL,
  readWorkspaceRole,
  setLoginSession,
  WORKSPACE_ROLES,
  type LoginSession,
  type WorkspaceRole,
} from "./login-session"

/** Re-exported so callers that already reach for the flow model keep one import. */
export { GRANTABLE_PRODUCTS, WORKSPACE_ROLES }
export type { LoginSession, WorkspaceRole }

// ── Conditions ──────────────────────────────────────────────────────────────

/**
 * What a condition reads. Only two things are knowable during sign-in: what was
 * typed, and what was answered earlier in this same run.
 */
export type ConditionSubject =
  | { kind: "identifier" }
  | { kind: "answer"; stepId: string }

/**
 * One condition, shaped as a sentence: subject, operator, value.
 *
 * The operator vocabulary is the design system's `FilterOperator` rather than a
 * private enum, so "does not contain" means the same thing here as it does in a
 * hub filter and the labels are already written.
 */
export interface Condition {
  id: string
  subject: ConditionSubject
  operator: FilterOperator
  /** Free text for an identifier subject; an option id for an answer subject. */
  value: string
}

/**
 * A condition list gates whether something runs. Empty means always.
 *
 * Conditions are a visibility predicate on the step, not a jump from the step
 * before it. That keeps the flow a flat list the runtime walks, so Back is always
 * "the previous step that ran" and no step can become unreachable. Jump-based
 * models cannot express "run when the identifier is X *and* they answered Y", and
 * they let you author steps nothing routes to.
 *
 * Rows combine with AND, matching how `ActiveFilter[]` already behaves on a hub.
 * There is no OR and no nesting: those buy expressiveness nobody has asked for at
 * the cost of a builder you have to learn.
 */
export type ConditionList = Condition[]

// ── Model ───────────────────────────────────────────────────────────────────

/** Both are mock. `sso` stands in for an identity-provider handoff. */
export type AuthMethod = "password" | "sso"

export interface AuthStep {
  id: string
  kind: "auth"
  method: AuthMethod
  showWhen?: ConditionList
}

/**
 * What picking an option does.
 *
 * `continue` is what makes flows composable rather than a menu of presets: a
 * School option can hand off to an app-choice step, so "role, then app" needs no
 * new step kind.
 */
export type ChoiceOutcome = { kind: "continue" } | { kind: "land"; path: string }

export interface ChoiceOption {
  id: string
  label: string
  description: string
  icon: string
  /**
   * Narrows entitlement to this one product. This is the whole mechanism behind
   * "the app you did not pick moves to More from Exxat" — the switcher and the
   * products home both split their lists on the entitlement answer.
   */
  grantsProduct: Product | null
  /**
   * Who signs in down this branch, when the branch is what decides it.
   *
   * Absent means the flow's own role stands, which is the usual case: most
   * branches ask which app or which door, not which person. It is set when one
   * human has two identities and the flow has to ask which one this session is,
   * such as a student who also teaches.
   *
   * A role could already be *implied* by landing on the student home, and that
   * inference stays (see `applyLoginSession`). It is not enough on its own: two
   * branches that both land on the products home and differ only in who they open
   * as have nowhere to put the difference. Saying it outright also lets the canvas
   * read the branch back rather than asking the author to know that a path
   * carries a role.
   */
  role?: WorkspaceRole
  outcome: ChoiceOutcome
  showWhen?: ConditionList
}

export interface ChoiceStep {
  id: string
  kind: "choice"
  heading: string
  options: ChoiceOption[]
  showWhen?: ConditionList
}

export type FlowStep = AuthStep | ChoiceStep

/**
 * What the flow hands the session, and where it lands.
 *
 * This is the flow's answer for a run where no branch decided, which is most of
 * them: a role flow is an identifier, a password, and a statement about what that
 * person gets. A branch that grants an app still wins over `products`, because a
 * branch is the more specific answer and it is asked later.
 *
 * `landing` empty means the ordinary ladder in `post-auth-landing.ts` (a deep
 * link if one was requested, then onboarding on a first run, then products home).
 */
export type FlowSession = LoginSession & { landing: string }

export const DEFAULT_FLOW_SESSION: FlowSession = { ...DEFAULT_LOGIN_SESSION, landing: "" }

export interface LoginFlowDefinition {
  id: string
  name: string
  /** Everything after the implicit identifier step, in order. */
  steps: FlowStep[]
  /** Optional so flows authored before this field existed still parse. */
  session?: FlowSession
}

/**
 * A flow's session config with every field present.
 *
 * Read through this rather than `flow.session` directly: the field is optional in
 * storage, and a hand-edited record can be missing any part of it.
 */
export function flowSession(flow: LoginFlowDefinition): FlowSession {
  const stored = flow.session
  if (!stored) return DEFAULT_FLOW_SESSION
  const products = Array.isArray(stored.products)
    ? stored.products.filter(product =>
        GRANTABLE_PRODUCTS.some(entry => entry.value === product),
      )
    : null
  const role = flowRole(flow)
  const opensAs = Array.isArray(stored.opensAs)
    ? stored.opensAs.filter(isWorkspaceRole)
    : []
  return {
    products: products && products.length > 0 ? products : null,
    showYourApp: stored.showYourApp !== false,
    showMoreFromExxat: stored.showMoreFromExxat !== false,
    role,
    // Kept as authored and normalised on the way into the session, so a flow that
    // names a pair and then has its role edited out from under it reads as one
    // identity rather than as a fork with a door nobody can take.
    opensAs: opensAs.includes(role) ? opensAs : [],
    landing: typeof stored.landing === "string" ? stored.landing : "",
  }
}

/**
 * The role a stored flow means, including the one it could not write down.
 *
 * The role used to be `adminAccess`, a boolean, so a flow saved before the rename
 * can say "administers" and "does not" and nothing else. `readWorkspaceRole` maps
 * that boolean honestly, which is right for a session record and wrong for the
 * three seeded student flows: their whole point is a student, and the boolean had
 * no way to say it. A browser holding those older copies signed a student in as
 * an administrator, with the coordinator's release notes and the console's front
 * door to match.
 *
 * So when a stored flow names no role and the seed for its id says `student`, the
 * seed answers. Only for `student`: `member` and `administrator` survived the old
 * boolean faithfully, so overriding those would discard a real edit to recover a
 * value that was never lost. A flow saved since the rename names its role and is
 * never second-guessed, including a student flow someone deliberately changed.
 */
function flowRole(flow: LoginFlowDefinition): WorkspaceRole {
  const stored = flow.session
  if (!stored) return DEFAULT_FLOW_SESSION.role
  if (isWorkspaceRole(stored.role)) return stored.role
  return seededRole(flow.id) === "student" ? "student" : readWorkspaceRole(stored)
}

function seededRole(id: string): WorkspaceRole | undefined {
  return SEEDED_FLOWS.find(seed => seed.id === id)?.session?.role
}

// ── Storage ─────────────────────────────────────────────────────────────────

const FLOWS_KEY = "demo:login-flows:v1"
const ACTIVE_KEY = "demo:login-flow-active:v1"
/** Pre-builder key. Its values are the seeded flow ids, so it migrates as-is. */
const LEGACY_FLOW_KEY = "demo:login-flow:v1"
/**
 * Set once the seeded flows have been offered to this browser. Without it a
 * later seed could never reach anyone who has already authored a flow, since
 * stored flows replace the seeds wholesale.
 */
const SEEDS_OFFERED_KEY = "demo:login-flows-seeded:v1"

export const AUTH_METHOD_LABEL: Record<AuthMethod, string> = {
  password: "Password",
  sso: "Single sign-on",
}

/** Where a landing option may send someone. Free text is allowed too. */
export const COMMON_LANDING_PATHS: readonly { value: string; label: string }[] = [
  { value: "/home", label: "Products home" },
  { value: "/student", label: "Student home" },
  { value: "/prism/dashboard", label: "Clinical Education dashboard" },
  { value: "/one-schools/dashboard", label: "Exxat One dashboard" },
]

// ── Seeds ───────────────────────────────────────────────────────────────────

function authStep(method: AuthMethod = "password"): AuthStep {
  return { id: "auth", kind: "auth", method }
}

/**
 * A role, as a whole flow rather than a branch of one.
 *
 * Each role is its own entry in the picker, so seeing what a faculty member sees
 * is switching the active flow and signing in, with nothing to answer on the way
 * through. The six differ only in what they hand the session, which is the point:
 * the steps are identical, the experience is not.
 */
function roleFlow(
  id: string,
  name: string,
  session: Partial<FlowSession>,
): LoginFlowDefinition {
  return {
    id: `role-${id}`,
    name,
    steps: [authStep()],
    session: { ...DEFAULT_FLOW_SESSION, ...session },
  }
}

export const SEEDED_FLOWS: readonly LoginFlowDefinition[] = [
  {
    id: "direct",
    name: "Straight in",
    steps: [authStep()],
  },
  {
    id: "product",
    name: "Pick an app",
    steps: [
      authStep(),
      {
        id: "app",
        kind: "choice",
        heading: "Which app are you opening?",
        options: [
          {
            id: "prism",
            label: "Clinical Education",
            description: "Placements, rotations, and student compliance.",
            icon: "fa-light fa-hospital-user",
            grantsProduct: "exxat-prism",
            outcome: { kind: "land", path: "/home" },
          },
          {
            id: "one",
            label: "Exxat One",
            description: "Site and location coordination across a brand.",
            icon: "fa-light fa-building",
            grantsProduct: "exxat-one-schools",
            outcome: { kind: "land", path: "/home" },
          },
        ],
      },
    ],
  },
  {
    id: "role",
    name: "Pick a role",
    steps: [
      authStep(),
      {
        id: "role",
        kind: "choice",
        heading: "How are you signing in?",
        options: [
          {
            id: "student",
            label: "Student",
            description: "See your placements, hours, and requirements.",
            icon: "fa-light fa-graduation-cap",
            grantsProduct: null,
            // The student home would imply this on its own. Said outright so the
            // branch carries the claim rather than the path carrying it.
            role: "student",
            outcome: { kind: "land", path: "/student" },
          },
          {
            id: "school",
            label: "School",
            description: "Run a program: cohorts, sites, and compliance.",
            icon: "fa-light fa-school",
            grantsProduct: null,
            outcome: { kind: "land", path: "/home" },
          },
        ],
      },
    ],
  },

  // The six roles. Everything below differs from "Straight in" only in what it
  // hands the session, so the canvas for each is one password step and a
  // statement about the workspace they arrive in.
  // Administrator belongs to exactly two of these six, and the other four cannot
  // acquire it: the console is a role, so the tile, the switcher row, and
  // `/admin` itself all read the one `role` field, and a student who types the
  // URL is turned away rather than merely not invited.
  roleFlow("faculty", "Faculty", { role: "member" }),
  roleFlow("admin", "Admin", {}),
  // Identical to Admin today. Seeded as its own flow anyway: nothing in the mock
  // separates the two yet, and this is where that difference will go when it
  // arrives rather than a flow someone has to invent at the time.
  roleFlow("super-admin", "Super Admin", {}),
  roleFlow("student", "Student", { role: "student", landing: "/student" }),
  roleFlow("student-two-apps", "Student with two apps", {
    role: "student",
    products: ["exxat-prism", "exxat-one-schools"],
    showMoreFromExxat: false,
  }),
  // Named for the access someone asked about, and neither identity here has it:
  // the console is a role and this flow hands out the two that deny it. What it
  // does hand out is both of them, because this is one human with two identities
  // in the same program. Which one they are opening as is not asked at sign-in —
  // it is asked by the product card on the way into the app, where the question
  // can be answered again tomorrow without signing out.
  roleFlow("student-admin", "Student with admin access", {
    role: "student",
    opensAs: ["student", "member"],
    showMoreFromExxat: false,
  }),
]

// ── Reading ─────────────────────────────────────────────────────────────────

/**
 * Parsed defensively rather than cast. This is hand-editable `localStorage` on a
 * prototype, so a half-written or older shape has to degrade to the seeds
 * instead of throwing inside a render on the sign-in page, which would leave no
 * way back in.
 */
function parseFlows(raw: string | null): LoginFlowDefinition[] | null {
  if (!raw) return null
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return null
    const flows = parsed.filter(isFlowDefinition)
    return flows.length > 0 ? flows : null
  } catch {
    return null
  }
}

function isFlowDefinition(value: unknown): value is LoginFlowDefinition {
  if (typeof value !== "object" || value === null) return false
  const flow = value as Record<string, unknown>
  return (
    typeof flow.id === "string" &&
    typeof flow.name === "string" &&
    Array.isArray(flow.steps) &&
    flow.steps.every(isFlowStep)
  )
}

function isFlowStep(value: unknown): value is FlowStep {
  if (typeof value !== "object" || value === null) return false
  const step = value as Record<string, unknown>
  if (step.kind === "auth") return step.method === "password" || step.method === "sso"
  if (step.kind !== "choice") return false
  return typeof step.heading === "string" && Array.isArray(step.options)
}

/**
 * Every flow this browser has, reconciled with the seeds twice over: seeds it has
 * never been offered are added, and a stored copy of a seed that has since
 * changed shape is replaced. Both are migrations, and doing them behind the one
 * read keeps every caller from having to remember either.
 */
export function getLoginFlows(): LoginFlowDefinition[] {
  return adoptReshapedSeeds(readStoredOrSeededFlows())
}

/**
 * A seeded flow whose shape changed after it had already been handed out.
 *
 * Stored flows replace the seeds wholesale, which is what keeps a deleted flow
 * deleted, and also means a reshaped seed stays invisible to every browser
 * holding the older copy.
 *
 * `Student with admin access` has now been two earlier shapes. It first had no
 * branch at all and could only claim one identity; then it asked which identity
 * at sign-in; now it claims both and lets the product card ask, so the answer can
 * be changed tomorrow without signing out. A browser left on either earlier copy
 * would show a sign-in question that no longer exists, or a card with one door.
 *
 * `supersedes` recognises those two shapes and nothing else. A flow someone has
 * authored their own branch onto is left alone, which is why the sign-in question
 * is matched by its own step id rather than by "has a choice step".
 */
const RESHAPED_SEEDS: readonly {
  id: string
  supersedes: (flow: LoginFlowDefinition) => boolean
}[] = [
  {
    id: "role-student-admin",
    supersedes: flow =>
      flow.steps.some(step => step.kind === "choice" && step.id === "hat") ||
      (!flow.steps.some(step => step.kind === "choice") &&
        !flowSession(flow).opensAs.includes("member")),
  },
]

function adoptReshapedSeeds(flows: LoginFlowDefinition[]): LoginFlowDefinition[] {
  let changed = false
  const next = flows.map(flow => {
    const seed = SEEDED_FLOWS.find(entry => entry.id === flow.id)
    const reshaped = RESHAPED_SEEDS.find(entry => entry.id === flow.id)
    if (!seed || !reshaped?.supersedes(flow)) return flow
    changed = true
    return cloneFlow(seed)
  })
  if (!changed) return flows
  saveLoginFlows(next)
  return next
}

/**
 * Stored flows, plus any seed this browser has never been offered.
 *
 * Stored flows replace the seeds rather than merging with them, which is right
 * (a deleted flow must stay deleted) and leaves new seeds unreachable for anyone
 * who has already authored one. So the seeds are offered exactly once, marked,
 * and never resurrected.
 */
function readStoredOrSeededFlows(): LoginFlowDefinition[] {
  const stored = parseFlows(getStorageItem(FLOWS_KEY))
  if (getStorageItem(SEEDS_OFFERED_KEY)) return stored ?? SEEDED_FLOWS.map(cloneFlow)

  setStorageItem(SEEDS_OFFERED_KEY, "true")
  if (!stored) return SEEDED_FLOWS.map(cloneFlow)

  const missing = SEEDED_FLOWS.filter(
    seed => !stored.some(flow => flow.id === seed.id),
  ).map(cloneFlow)
  if (missing.length === 0) return stored

  const merged = [...stored, ...missing]
  saveLoginFlows(merged)
  return merged
}

export function getActiveFlowId(): string {
  const flows = getLoginFlows()
  // The pre-builder key stored exactly these ids, so it needs no translation.
  const stored = getStorageItem(ACTIVE_KEY) ?? getStorageItem(LEGACY_FLOW_KEY)
  if (stored && flows.some(flow => flow.id === stored)) return stored
  return flows[0].id
}

export function getActiveFlow(): LoginFlowDefinition {
  const flows = getLoginFlows()
  const activeId = getActiveFlowId()
  return flows.find(flow => flow.id === activeId) ?? flows[0]
}

// ── Writing ─────────────────────────────────────────────────────────────────

export function saveLoginFlows(flows: LoginFlowDefinition[]): void {
  setStorageItem(FLOWS_KEY, JSON.stringify(flows))
  // An explicit save makes this list authoritative, so the seed merge above must
  // not add to it later.
  setStorageItem(SEEDS_OFFERED_KEY, "true")
}

/**
 * Switching flows drops whatever the last run granted. Leaving it behind would
 * keep an entitlement the new flow never asked about, so the product switcher
 * would contradict the flow that is now active.
 */
export function setActiveFlowId(id: string): void {
  setStorageItem(ACTIVE_KEY, id)
  clearLoginSession()
}

/**
 * Narrow the session to one app. What a choice branch does, and the more
 * specific answer than the flow's own app list, so it replaces it.
 */
export function grantProduct(product: Product): void {
  setLoginSession({ ...DEFAULT_LOGIN_SESSION, products: [product] })
}

/**
 * Hand the flow's session config to the session being opened, on the way out.
 *
 * Called at every exit from the runtime rather than when the flow starts: a run
 * that is abandoned halfway should leave no claims behind. `grantedProduct` is
 * whatever a branch narrowed to during this run, and it wins over the flow's own
 * list for the reason in `FlowSession`.
 *
 * `landing` and `chosenRole` are what a branch knows that the flow's own config
 * does not: where this run is going, and who it is going as.
 */
export function applyLoginSession(
  flow: LoginFlowDefinition,
  grantedProduct: Product | null,
  landing: string,
  chosenRole: WorkspaceRole | null = null,
): void {
  const session = flowSession(flow)
  setLoginSession({
    products: grantedProduct ? [grantedProduct] : session.products,
    showYourApp: session.showYourApp,
    showMoreFromExxat: session.showMoreFromExxat,
    // Three answers, most specific first.
    //
    // The student home is a role landing rather than a product page
    // (`student-shell.ts`), so arriving there is being a student and no branch
    // may claim otherwise on the way. That guard is why the seeded "Pick a role"
    // flow's Student branch cannot open a session one typed `/admin` from the
    // console.
    //
    // Then the branch, which was asked after the flow was authored and knows
    // which of two identities this session is. Then the flow, the answer for the
    // runs where nobody was asked, which is most of them.
    role: isStudentHomePath(landing) ? "student" : (chosenRole ?? session.role),
    // Handed over as authored. `setLoginSession` drops a pair the role is not part
    // of, so a run that landed on the student home keeps only a pair a student may
    // hold.
    opensAs: session.opensAs,
  })
}

// ── Evaluating conditions ───────────────────────────────────────────────────

/** Everything knowable mid-run. `answers` maps a choice step id to an option id. */
export interface FlowRunContext {
  identifier: string
  answers: Record<string, string>
}

export const EMPTY_RUN_CONTEXT: FlowRunContext = { identifier: "", answers: {} }

function compare(actual: string, operator: FilterOperator, expected: string): boolean {
  const a = actual.trim().toLowerCase()
  const b = expected.trim().toLowerCase()
  switch (operator) {
    case "is":
      return a === b
    case "is_not":
      return a !== b
    case "contains":
      return b.length === 0 || a.includes(b)
    case "not_contains":
      return b.length === 0 || !a.includes(b)
  }
}

export function conditionHolds(condition: Condition, context: FlowRunContext): boolean {
  // A condition on a step that never ran reads its answer as absent rather than
  // failing outright, so `is not Student` holds for someone who was never asked.
  // That is the useful reading: they did not choose it.
  const actual =
    condition.subject.kind === "identifier"
      ? context.identifier
      : (context.answers[condition.subject.stepId] ?? "")
  return compare(actual, condition.operator, condition.value)
}

export function conditionsHold(
  showWhen: ConditionList | undefined,
  context: FlowRunContext,
): boolean {
  return (showWhen ?? []).every(condition => conditionHolds(condition, context))
}

/** Options whose conditions hold. A choice step renders these, not all of them. */
export function visibleOptions(step: ChoiceStep, context: FlowRunContext): ChoiceOption[] {
  return step.options.filter(option => conditionsHold(option.showWhen, context))
}

/**
 * The next step at or after `from` that applies, or `null` when the flow is out.
 * The runtime asks this at each hop rather than resolving the whole path up front,
 * because an answer given at step 2 can decide whether step 3 runs.
 */
export function nextApplicableStep(
  flow: LoginFlowDefinition,
  context: FlowRunContext,
  from: number,
): number | null {
  for (let index = Math.max(from, 0); index < flow.steps.length; index += 1) {
    if (conditionsHold(flow.steps[index].showWhen, context)) return index
  }
  return null
}

/**
 * Whether a flow can authenticate everyone who reaches it.
 *
 * False when every auth step is conditional, which means some identifier walks
 * the flow without ever authenticating. The builder warns rather than blocks,
 * since you may be mid-edit; the runtime enforces the floor independently by
 * falling back to a password step.
 */
export function alwaysAuthenticates(flow: LoginFlowDefinition): boolean {
  return flow.steps.some(
    step => step.kind === "auth" && (step.showWhen ?? []).length === 0,
  )
}

// ── Describing (the builder reads these back as sentences) ──────────────────

export const IDENTIFIER_SUBJECT_LABEL = "Username or email"

/** `Answer to "Which app are you opening?"` — quoted so the heading reads as one. */
export function subjectLabel(subject: ConditionSubject, flow: LoginFlowDefinition): string {
  if (subject.kind === "identifier") return IDENTIFIER_SUBJECT_LABEL
  const step = flow.steps.find(current => current.id === subject.stepId)
  return step && step.kind === "choice"
    ? `Answer to "${step.heading}"`
    : "A step that no longer exists"
}

/** The value as a person reads it: an option's label, not its id. */
export function conditionValueLabel(
  condition: Condition,
  flow: LoginFlowDefinition,
): string {
  const { subject } = condition
  if (subject.kind === "identifier") return condition.value || "anything"
  const step = flow.steps.find(current => current.id === subject.stepId)
  if (!step || step.kind !== "choice") return condition.value
  const option = step.options.find(current => current.id === condition.value)
  return option?.label ?? "a removed option"
}

export function describeCondition(condition: Condition, flow: LoginFlowDefinition): string {
  return [
    subjectLabel(condition.subject, flow),
    OPERATOR_LABELS[condition.operator],
    conditionValueLabel(condition, flow),
  ].join(" ")
}

/** One sentence for a whole list, or `null` when it always runs. */
export function describeConditions(
  showWhen: ConditionList | undefined,
  flow: LoginFlowDefinition,
): string | null {
  const conditions = showWhen ?? []
  if (conditions.length === 0) return null
  return conditions.map(condition => describeCondition(condition, flow)).join(", and ")
}

/** `as a student`, with the article, since it reads inside a sentence. */
export function roleClause(role: WorkspaceRole): string {
  return role === "administrator" ? "as an administrator" : `as a ${role}`
}

/** What an option does, as a sentence. Used on the canvas branch labels. */
export function describeOutcome(option: ChoiceOption): string {
  const destination =
    option.outcome.kind === "continue"
      ? "continues to the next step"
      : `goes to ${option.outcome.path}`
  const claims = [
    option.grantsProduct
      ? `${GRANTABLE_PRODUCTS.find(entry => entry.value === option.grantsProduct)?.label ?? option.grantsProduct} only`
      : null,
    option.role ? `opens ${roleClause(option.role)}` : null,
  ].filter((claim): claim is string => claim !== null)
  return [destination, ...claims].join(", ")
}

/**
 * Whether anything can reach the end of the flow.
 *
 * A final choice whose every branch lands somewhere ends the flow at that fan, so
 * the flow's own landing never applies and the canvas must not draw a path to it.
 * A conditional step or a conditional branch could be skipped, which puts the
 * fall-through back.
 */
export function reachesEnd(flow: LoginFlowDefinition): boolean {
  const last = flow.steps[flow.steps.length - 1]
  if (!last || last.kind !== "choice") return true
  if ((last.showWhen ?? []).length > 0) return true
  return last.options.some(
    option => option.outcome.kind === "continue" || (option.showWhen ?? []).length > 0,
  )
}

/** `Products home`, or the path itself when it is not one of the common ones. */
export function landingLabel(path: string): string {
  if (!path) return "Products home"
  return COMMON_LANDING_PATHS.find(entry => entry.value === path)?.label ?? path
}

function joinList(labels: string[], conjunction: "and" | "or"): string {
  if (labels.length <= 1) return labels.join("")
  return `${labels.slice(0, -1).join(", ")} ${conjunction} ${labels[labels.length - 1]}`
}

function productLabels(products: Product[]): string {
  return joinList(
    products.map(
      product => GRANTABLE_PRODUCTS.find(entry => entry.value === product)?.label ?? product,
    ),
    "and",
  )
}

/**
 * What a flow's session config does, as short phrases for the canvas.
 *
 * Empty when the flow changes nothing, so a plain flow draws no chips at all and
 * the ones that do carry a badge are the ones worth reading. Landing is always
 * included: where a flow ends is the first thing anyone looks for.
 */
export function sessionEffects(session: FlowSession, includeLanding = true): string[] {
  const effects = includeLanding ? [`Lands on ${landingLabel(session.landing)}`] : []
  if (session.products) effects.push(`${productLabels(session.products)} only`)
  if (!session.showYourApp) effects.push("Your App hidden")
  if (!session.showMoreFromExxat) effects.push("More from Exxat hidden")
  // The role, only when it is not the workspace default. Phrased as who they are
  // rather than what is hidden: this field closes the console's route as well as
  // its tile, and "hidden" would read as an affordance still reachable.
  if (session.role === "student") effects.push("Signs in as a student")
  else if (session.role === "member") effects.push("No Administrator access")
  // Said after the role, because it reads as an amendment to it: this person is a
  // student *and* may open the app as the school instead, chosen on the card.
  if (session.opensAs.length > 1) {
    effects.push(
      `Opens as ${joinList(
        session.opensAs.map(role => OPEN_AS_LABEL[role]),
        "or",
      )}`,
    )
  }
  return effects
}

// ── Dry run (the builder's tester) ──────────────────────────────────────────

/**
 * Whether a step would run for a given identifier, before any answer exists.
 *
 * `depends` is its own answer rather than a guess. A condition that reads an
 * earlier answer cannot be settled from an identifier alone, and showing it as
 * skipped would be a lie the author would then design around.
 */
export type DryRunStatus = "runs" | "skipped" | "depends"

export function dryRun(flow: LoginFlowDefinition, identifier: string): DryRunStatus[] {
  const context: FlowRunContext = { identifier, answers: {} }
  return flow.steps.map(step => {
    const conditions = step.showWhen ?? []
    if (conditions.length === 0) return "runs"
    if (conditions.some(condition => condition.subject.kind === "answer")) return "depends"
    return conditionsHold(conditions, context) ? "runs" : "skipped"
  })
}

// ── Editing helpers (used by the builder) ───────────────────────────────────

function cloneFlow(flow: LoginFlowDefinition): LoginFlowDefinition {
  return structuredClone(flow) as LoginFlowDefinition
}

/** Ids only need to be unique within one browser, so a counter suffices. */
let idCounter = 0
function nextId(prefix: string): string {
  idCounter += 1
  return `${prefix}-${Date.now().toString(36)}-${idCounter}`
}

export function createFlow(name = "New flow"): LoginFlowDefinition {
  return {
    id: nextId("flow"),
    name,
    steps: [authStep()],
    session: { ...DEFAULT_FLOW_SESSION },
  }
}

export function createChoiceStep(): ChoiceStep {
  return {
    id: nextId("step"),
    kind: "choice",
    heading: "What would you like to do?",
    options: [createChoiceOption(), createChoiceOption()],
  }
}

export function createChoiceOption(): ChoiceOption {
  return {
    id: nextId("option"),
    label: "Untitled option",
    description: "",
    icon: "fa-light fa-circle-dot",
    grantsProduct: null,
    outcome: { kind: "land", path: "/home" },
  }
}

export function createAuthStep(method: AuthMethod = "password"): AuthStep {
  return { id: nextId("step"), kind: "auth", method }
}

/** Defaults to the identifier, the only subject that always exists. */
export function createCondition(): Condition {
  return {
    id: nextId("cond"),
    subject: { kind: "identifier" },
    operator: "contains",
    value: "",
  }
}

export function duplicateFlow(flow: LoginFlowDefinition): LoginFlowDefinition {
  const copy = cloneFlow(flow)
  copy.id = nextId("flow")
  copy.name = `${flow.name} copy`
  return copy
}

/** One-line summary of a flow's shape, for the builder's flow picker. */
export function describeFlow(flow: LoginFlowDefinition): string {
  const parts = ["Username"]
  for (const step of flow.steps) {
    const label =
      step.kind === "auth"
        ? AUTH_METHOD_LABEL[step.method].toLowerCase()
        : `choice of ${step.options.length}`
    parts.push((step.showWhen ?? []).length > 0 ? `${label} (conditional)` : label)
  }
  return parts.join(", ")
}

/**
 * The canvas as prose, for screen readers.
 *
 * A diagram that only exists as boxes and lines is unreadable without sight, so
 * the same structure ships as a sentence per step. This is the text alternative
 * the visual canvas is labelled by, not a summary bolted on afterwards.
 */
export function describeFlowForScreenReaders(flow: LoginFlowDefinition): string {
  const lines = [`Flow ${flow.name}.`, "Step 1, username or email, always runs."]
  const session = flowSession(flow)
  flow.steps.forEach((step, index) => {
    const when = describeConditions(step.showWhen, flow)
    const gate = when ? `runs when ${when}` : "always runs"
    if (step.kind === "auth") {
      lines.push(`Step ${index + 2}, ${AUTH_METHOD_LABEL[step.method]}, ${gate}.`)
      return
    }
    lines.push(
      `Step ${index + 2}, choice, ${step.heading}, ${gate}. ` +
        `${step.options.length} branches: ` +
        step.options
          .map(option => {
            const optionWhen = describeConditions(option.showWhen, flow)
            const shown = optionWhen ? `, shown when ${optionWhen}` : ""
            return `${option.label} ${describeOutcome(option)}${shown}`
          })
          .join("; ") +
        ".",
    )
  })
  const effects = sessionEffects(session, reachesEnd(flow))
  lines.push(
    effects.length > 0
      ? `Signed in: ${effects.join(", ")}.`
      : "Signed in: the workspace as it is, with nothing hidden.",
  )
  if (!alwaysAuthenticates(flow)) {
    lines.push("Warning: every sign-in step is conditional, so a password step is added as a fallback.")
  }
  return lines.join(" ")
}
