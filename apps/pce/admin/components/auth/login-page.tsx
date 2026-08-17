"use client"

/**
 * LoginPage — identifier first, then whatever the active flow says comes next.
 *
 * The identifier is always its own step, because it is what decides how the
 * person authenticates. Asking for a password up front means asking for one from
 * people who will never type it, and a password field that turns out to be
 * irrelevant is worse than a second step.
 *
 * Everything after it is data. The flow authored at `/builder/sign-in-flows`
 * supplies an ordered list of steps, so this component walks that list rather
 * than hard-coding a branch per variant: an auth step (password or SSO) and any
 * number of choice steps for questions the credentials cannot imply, such as
 * which app this workspace bought or which kind of person is signing in. See
 * `lib/login-flow.ts` for the vocabulary.
 *
 * Each step owns the page `h1`, so there is exactly one heading at a time and it
 * names the step you are on. Later steps keep the identifier visible: the whole
 * point of collecting it first is that the rest can say who is signing in.
 *
 * Demo behaviour: no auth server, so any non-empty password opens a session and
 * the SSO step contacts no provider. See `lib/auth-session.ts`.
 */

import * as React from "react"
import { useNavigate, useSearchParams } from "react-router"

import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Separator } from "@/components/ui/separator"
import { AuthShell } from "@/components/auth/auth-shell"
import { LoginChoiceStep } from "@/components/auth/login-choice-step"
import { LoginSsoStep } from "@/components/auth/login-sso-step"
import { signIn } from "@/lib/auth-session"
import {
  applyLoginSession,
  flowSession,
  getActiveFlow,
  nextApplicableStep,
  type AuthStep,
  type ChoiceOption,
  type FlowRunContext,
  type FlowSession,
  type WorkspaceRole,
} from "@/lib/login-flow"
import {
  PRODUCTS_HOME_PATH,
  postAuthLandingPath,
  postChoiceLandingPath,
  type PostChoiceAllowance,
} from "@/lib/post-auth-landing"
import { productSlug, type Product } from "@exxatdesignux/product-framework"
import { useDocumentTitle } from "@/hooks/use-document-title"

const IDENTIFIER_FIELD_ID = "login-identifier"
const PASSWORD_FIELD_ID = "login-password"
const ERROR_ID = "login-error"

function LoginError({ message }: { message: string }) {
  return (
    <p id={ERROR_ID} role="alert" className="text-sm text-destructive-ink">
      {message}
    </p>
  )
}

/** Step one. The identifier decides the second step, so it is asked alone. */
function IdentifierStep({
  identifier,
  onIdentifierChange,
  error,
  onSubmit,
  inputRef,
}: {
  identifier: string
  onIdentifierChange: (value: string) => void
  error: string | null
  onSubmit: (event: React.FormEvent) => void
  inputRef: React.RefObject<HTMLInputElement | null>
}) {
  return (
    <>
      {/* Sans, not the DS `font-heading` serif. The auth pages are the only
          place the product speaks before a workspace exists, and the production
          sign-in page sets that voice in the sans face. */}
      <h1 className="text-2xl font-semibold tracking-tight text-balance">
        Access all your Exxat Applications
      </h1>
      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4" noValidate>
        <Field data-invalid={error ? true : undefined}>
          <FieldLabel htmlFor={IDENTIFIER_FIELD_ID}>Username or email</FieldLabel>
          <InputGroup>
            <InputGroupAddon align="inline-start">
              <i className="fa-light fa-envelope" aria-hidden="true" />
            </InputGroupAddon>
            <InputGroupInput
              ref={inputRef}
              id={IDENTIFIER_FIELD_ID}
              name="identifier"
              type="text"
              autoComplete="username"
              placeholder="Enter your username or email"
              value={identifier}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? ERROR_ID : undefined}
              onChange={event => onIdentifierChange(event.target.value)}
            />
          </InputGroup>
          {error ? <LoginError message={error} /> : null}
        </Field>
        <Button type="submit" className="w-full">
          Continue
        </Button>
      </form>

      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
        By continuing, you agree to our{" "}
        <a
          href="https://www.exxat.com/"
          className="underline underline-offset-4 hover:text-foreground"
        >
          Terms of Service
        </a>{" "}
        and that you have read and understood our{" "}
        <a
          href="https://www.exxat.com/"
          className="underline underline-offset-4 hover:text-foreground"
        >
          Privacy Policy
        </a>
        .
      </p>

      <Separator className="my-6" />

      <ul className="flex flex-col gap-2 text-sm">
        <li className="flex flex-wrap items-center gap-x-1.5">
          <span className="text-muted-foreground">New student?</span>
          <a
            href="https://www.exxat.com/"
            className="font-medium text-auth-ink underline underline-offset-4"
          >
            Join Exxat One Network
          </a>
        </li>
        <li className="flex flex-wrap items-center gap-x-1.5">
          <span className="text-muted-foreground">New school or site?</span>
          <a
            href="https://www.exxat.com/"
            className="inline-flex items-center gap-1.5 font-medium text-auth-ink underline underline-offset-4"
          >
            Contact Sales
            <i className="fa-light fa-arrow-up-right-from-square text-xs" aria-hidden="true" />
            <span className="sr-only">Opens in a new tab</span>
          </a>
        </li>
      </ul>
    </>
  )
}

/** Step two. Identity stays on screen, and changing it is one control away. */
function PasswordStep({
  identifier,
  password,
  onPasswordChange,
  error,
  onSubmit,
  onChangeIdentifier,
  inputRef,
}: {
  identifier: string
  password: string
  onPasswordChange: (value: string) => void
  error: string | null
  onSubmit: (event: React.FormEvent) => void
  onChangeIdentifier: () => void
  inputRef: React.RefObject<HTMLInputElement | null>
}) {
  const [revealed, setRevealed] = React.useState(false)

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-balance">Welcome back</h1>

      {/* A plain row, not a filled box. The identifier here is confirmed context
          rather than an editable field, and a bordered well next to the real
          password input read as a second input someone might try to type in. */}
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="flex min-w-0 items-center gap-2 text-sm">
          <i className="fa-light fa-user shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="truncate font-medium">{identifier}</span>
        </span>
        {/* Ghost keeps the 32px target while reading as plain text. Stripping the
            padding to match the reference more closely would drop it under the
            24×24 floor. */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="shrink-0"
          onClick={onChangeIdentifier}
        >
          <i className="fa-light fa-arrow-rotate-left" aria-hidden="true" />
          Change
          <span className="sr-only">the username or email you are signing in with</span>
        </Button>
      </div>

      <form
        onSubmit={onSubmit}
        className="mt-4 flex flex-col gap-4"
        noValidate
        onKeyDown={event => {
          // Esc backs out of the step, matching the visible Change control.
          if (event.key !== "Escape") return
          event.preventDefault()
          onChangeIdentifier()
        }}
      >
        <Field data-invalid={error ? true : undefined}>
          <FieldLabel htmlFor={PASSWORD_FIELD_ID}>Password</FieldLabel>
          <InputGroup>
            <InputGroupAddon align="inline-start">
              <i className="fa-light fa-lock" aria-hidden="true" />
            </InputGroupAddon>
            <InputGroupInput
              ref={inputRef}
              id={PASSWORD_FIELD_ID}
              name="password"
              type={revealed ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? ERROR_ID : undefined}
              onChange={event => onPasswordChange(event.target.value)}
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                size="icon-xs"
                aria-label={revealed ? "Hide password" : "Show password"}
                aria-pressed={revealed}
                onClick={() => setRevealed(value => !value)}
              >
                <i
                  className={revealed ? "fa-light fa-eye-slash" : "fa-light fa-eye"}
                  aria-hidden="true"
                />
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
          {error ? <LoginError message={error} /> : null}
        </Field>
        <Button type="submit" className="w-full">
          Sign in
        </Button>
      </form>

      <Button
        type="button"
        variant="link"
        // `text-auth-ink` rather than the variant's `text-primary`: inside the
        // auth surface `--primary` is the button fill, which is too dark to read
        // as text on a dark canvas.
        className="mt-2 h-auto w-fit p-0 text-sm text-auth-ink underline underline-offset-4"
        onClick={() => window.open("https://www.exxat.com/", "_blank", "noopener")}
      >
        Forgot Password?
      </Button>
    </>
  )
}

/**
 * How much of a `?next=` deep link survives a branch.
 *
 * A choice option that sends you somewhere specific was authored as a deliberate
 * destination for that branch, so a link captured before the choice must not
 * override it: a student who deep-linked a coordinator hub still belongs on the
 * student home. The products home is the exception, because it is a launcher
 * rather than a destination, so a real deep link is strictly better than it.
 *
 * When the option grants a product, the link survives only inside that product.
 * Honouring `/prism/library` after someone chose Exxat One would land them in the
 * app they just gave up.
 */
function allowanceFor(option: ChoiceOption): PostChoiceAllowance {
  if (option.grantsProduct) return { withinRoot: `/${productSlug(option.grantsProduct)}` }
  if (option.outcome.kind === "land" && option.outcome.path === PRODUCTS_HOME_PATH) return "any"
  return "none"
}

/**
 * The same question for a run where no branch decided, answered from the flow's
 * own session config.
 *
 * A flow that grants exactly one app is the narrowing case: a link into the other
 * app has to be dropped even though nobody chose anything. Two apps or none is not
 * a narrowing, so a link is as good as the ladder. An authored destination
 * outranks the link for the reason above, unless it is the products home.
 */
function flowAllowance(session: FlowSession): PostChoiceAllowance {
  if (session.products?.length === 1) {
    return { withinRoot: `/${productSlug(session.products[0])}` }
  }
  if (!session.landing || session.landing === PRODUCTS_HOME_PATH) return "any"
  return "none"
}

/**
 * Which screen is showing. A trail of these rather than one index, because
 * conditions mean the steps that ran are not a prefix of the steps that exist:
 * Back has to return to the previous step that actually ran, not the previous one
 * in the list.
 */
type Screen =
  | { kind: "identifier" }
  | { kind: "step"; index: number }
  | { kind: "fallbackAuth" }

/**
 * The floor. If a flow's every auth step is conditional, some identifier reaches
 * the end having proved nothing, so the runtime asks for a password instead of
 * opening a session. The builder warns about this, but the guarantee cannot live
 * there: a flow can be edited into that shape, and sign-in must hold anyway.
 */
const FALLBACK_AUTH_STEP: AuthStep = { id: "fallback-auth", kind: "auth", method: "password" }

export function LoginPage() {
  useDocumentTitle("Sign in")
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Read once on mount. Re-reading would let the flow change under someone
  // mid-sign-in, which is how you get an auth step that hands off to a question
  // the person was never shown.
  const [flow] = React.useState(getActiveFlow)
  // No privileged action is pre-filled from the URL: `next` is a return-to path and
  // nothing else. It grants no role and no entitlement (a choice option does that),
  // and it is never used raw. `safeInternalPath` resolves it against this origin with
  // the URL parser, so off-origin values and the `/\evil.example` backslash bypass are
  // both rejected, and pre-auth paths are refused so it cannot loop back to sign-in.
  // `postChoiceLandingPath` then lets a branch's own destination outrank the link, so a
  // student who deep-linked a coordinator hub still lands on the student home. Covered
  // by `lib/post-auth-landing.test.ts` and the deep-link cases in `login-flows.test.tsx`.
  const next = searchParams.get("next")

  const session = React.useMemo(() => flowSession(flow), [flow])

  const [trail, setTrail] = React.useState<Screen[]>([{ kind: "identifier" }])
  const [identifier, setIdentifier] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [answers, setAnswers] = React.useState<Record<string, string>>({})
  // What a branch narrowed the session to on this run. Held here rather than
  // written on the way past, so a run that is abandoned or walked back leaves no
  // entitlement behind for the next visitor to inherit.
  const [granted, setGranted] = React.useState<Product | null>(null)
  // Which identity a branch said this run is, held for the same reason as
  // `granted`: a person who is asked "which app" after "which hat" must not lose
  // the hat, and a run walked back must not leave one behind.
  const [openedAs, setOpenedAs] = React.useState<WorkspaceRole | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  const identifierRef = React.useRef<HTMLInputElement>(null)
  const passwordRef = React.useRef<HTMLInputElement>(null)

  const screen = trail[trail.length - 1]
  const step =
    screen.kind === "identifier"
      ? null
      : screen.kind === "fallbackAuth"
        ? FALLBACK_AUTH_STEP
        : (flow.steps[screen.index] ?? null)

  // The step swap replaces the whole form, so focus has to be placed or it falls
  // back to the document and a keyboard user starts the step from the top of the
  // page. Steps whose first control is a button place their own focus.
  React.useEffect(() => {
    if (screen.kind === "identifier") identifierRef.current?.focus()
    else if (step?.kind === "auth" && step.method === "password") passwordRef.current?.focus()
  }, [screen, step])

  /**
   * Leave the page, handing the session what this run decided.
   *
   * Every exit goes through here so the claims are written exactly once, at the
   * moment they become true. `grantedProduct` and `role` are passed explicitly by
   * the branch that just decided them, because that state has not settled yet in
   * the same tick.
   */
  const land = React.useCallback(
    (
      path: string,
      grantedProduct: Product | null = granted,
      role: WorkspaceRole | null = openedAs,
    ) => {
      applyLoginSession(flow, grantedProduct, path, role)
      navigate(path, { replace: true })
    },
    [flow, granted, navigate, openedAs],
  )

  /** Where an authenticated run ends when no branch chose a destination. */
  const authLanding = React.useCallback(
    () =>
      postChoiceLandingPath(
        next,
        session.landing || postAuthLandingPath(null),
        flowAllowance(session),
      ),
    [next, session],
  )

  /**
   * Move past `from`, or leave the page when the flow is out of applicable steps.
   * Takes the context explicitly because an answer just given has to be visible to
   * the conditions on every later step, and state has not settled yet.
   */
  const advance = React.useCallback(
    (
      from: number,
      context: FlowRunContext,
      authenticated: boolean,
      grantedProduct: Product | null = granted,
      role: WorkspaceRole | null = openedAs,
    ) => {
      setError(null)
      const index = nextApplicableStep(flow, context, from + 1)
      if (index !== null) {
        setTrail(current => [...current, { kind: "step", index }])
        return
      }
      if (!authenticated) {
        setTrail(current => [...current, { kind: "fallbackAuth" }])
        return
      }
      land(authLanding(), grantedProduct, role)
    },
    [authLanding, flow, granted, land, openedAs],
  )

  /** Whether an auth step has already run on this trail. */
  const authenticated = React.useMemo(
    () =>
      trail.some(
        entry =>
          entry.kind === "fallbackAuth" ||
          (entry.kind === "step" && flow.steps[entry.index]?.kind === "auth"),
      ),
    [flow, trail],
  )

  const submitIdentifier = React.useCallback(
    (event: React.FormEvent) => {
      event.preventDefault()
      if (identifier.trim().length === 0) {
        setError("Enter your username or email.")
        return
      }
      setError(null)
      const context: FlowRunContext = { identifier, answers: {} }
      const index = nextApplicableStep(flow, context, 0)
      if (index !== null) {
        setTrail(current => [...current, { kind: "step", index }])
        return
      }
      // No step applies to this identifier, so nothing has authenticated it.
      setTrail(current => [...current, { kind: "fallbackAuth" }])
    },
    [flow, identifier],
  )

  /**
   * The session opens when an auth step completes, in every flow. Later steps ask
   * which door to walk through, not whether the credentials were good, so holding
   * the session back past them would make Back look like a failed sign-in.
   */
  const completeAuth = React.useCallback(() => {
    signIn(identifier)
    const context: FlowRunContext = { identifier, answers }
    if (screen.kind === "fallbackAuth") {
      land(authLanding())
      return
    }
    advance(screen.kind === "step" ? screen.index : -1, context, true)
  }, [advance, answers, authLanding, identifier, land, screen])

  const submitPassword = React.useCallback(
    (event: React.FormEvent) => {
      event.preventDefault()
      if (password.length === 0) {
        setError("Enter your password.")
        return
      }
      completeAuth()
    },
    [completeAuth, password],
  )

  const choose = React.useCallback(
    (option: ChoiceOption) => {
      if (screen.kind !== "step" || !step || step.kind !== "choice") return

      const nextAnswers = { ...answers, [step.id]: option.id }
      setAnswers(nextAnswers)
      // A branch that grants nothing leaves an earlier grant alone: two choice
      // steps in a row can be "which app" then "what now".
      const nextGranted = option.grantsProduct ?? granted
      setGranted(nextGranted)
      // Same reading for the identity: a branch that names nobody leaves the one
      // an earlier branch named alone.
      const nextRole = option.role ?? openedAs
      setOpenedAs(nextRole)

      if (option.outcome.kind === "continue") {
        advance(
          screen.index,
          { identifier, answers: nextAnswers },
          authenticated,
          nextGranted,
          nextRole,
        )
        return
      }
      land(
        postChoiceLandingPath(next, option.outcome.path, allowanceFor(option)),
        nextGranted,
        nextRole,
      )
    },
    [advance, answers, authenticated, granted, identifier, land, next, openedAs, screen, step],
  )

  const changeIdentifier = React.useCallback(() => {
    setPassword("")
    setAnswers({})
    setGranted(null)
    setOpenedAs(null)
    setError(null)
    setTrail([{ kind: "identifier" }])
  }, [])

  const goBack = React.useCallback(() => {
    setPassword("")
    setError(null)

    // Read the step being left from the rendered trail rather than from inside the
    // `setTrail` updater. React may replay an updater, so queueing another state
    // update in there can run twice; both setters here stay pure.
    const leaving = trail[trail.length - 1]
    if (leaving.kind === "step") {
      const left = flow.steps[leaving.index]
      // Drop the answer the step being left had recorded, or a later step's
      // conditions would still be satisfied by a choice no longer on the trail.
      if (left?.kind === "choice") {
        setAnswers(({ [left.id]: _removed, ...rest }) => rest)
        // And the app it granted, or backing out of "Clinical Education" and
        // picking a branch that grants nothing would keep the narrower session.
        if (left.options.some(option => option.grantsProduct)) setGranted(null)
        // Same for the identity, or backing out of "As a student" would sign the
        // faculty branch in as one.
        if (left.options.some(option => option.role)) setOpenedAs(null)
      }
    }
    setTrail(current => (current.length > 1 ? current.slice(0, -1) : current))
  }, [flow, trail])

  if (!step) {
    return (
      <AuthShell>
        <IdentifierStep
          identifier={identifier}
          onIdentifierChange={value => {
            setIdentifier(value)
            if (error) setError(null)
          }}
          error={error}
          onSubmit={submitIdentifier}
          inputRef={identifierRef}
        />
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      {step.kind === "auth" ? (
        step.method === "sso" ? (
          <LoginSsoStep
            identifier={identifier}
            onContinue={completeAuth}
            onChangeIdentifier={changeIdentifier}
          />
        ) : (
          <PasswordStep
            identifier={identifier}
            password={password}
            onPasswordChange={value => {
              setPassword(value)
              if (error) setError(null)
            }}
            error={error}
            onSubmit={submitPassword}
            onChangeIdentifier={changeIdentifier}
            inputRef={passwordRef}
          />
        )
      ) : (
        <LoginChoiceStep
          step={step}
          context={{ identifier, answers }}
          identifier={identifier}
          onChoose={choose}
          onBack={goBack}
        />
      )}
    </AuthShell>
  )
}
