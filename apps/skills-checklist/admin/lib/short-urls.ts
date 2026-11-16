/**
 * Short, memorable URLs for the lab, personas, walkthroughs and the connected prototype. Every long URL keeps working: the short
 * forms are `rewrites()` in next.config.ts (beforeFiles), so the browser keeps the short address while Next serves the long route.
 * One pure module (no imports) so next.config.ts, the link builders and the pathname checks all read the same rules.
 *
 *   /admin                     -> /lab/flow/setup-walkthrough          (admin walkthrough start; the flow route redirects to its first step)
 *   /admin/<step>              -> /lab/flow/setup-walkthrough/<step>
 *   /student                   -> /lab/flow/fulfillment-walkthrough    (student and evaluator walkthrough start)
 *   /student/<step>            -> /lab/flow/fulfillment-walkthrough/<step>
 *   /flow/<flow>[/<step>]      -> /lab/flow/<flow>[/<step>]
 *   /as/<persona>[/<screen>]   -> /lab/<persona>[/<screen>]
 *   /proto[/...]               -> /v2[/...]
 *   /all                       -> /lab
 *
 * The old /walk/... forms, /flow/<walkthrough>/..., /lab/flow/<walkthrough>/... and /lab/walkthrough/<id> redirect (not permanent) to the
 * new form (WALKTHROUGH_REDIRECTS, merged into next.config redirects()). The flow id never appears in a walkthrough address.
 *
 * Because the address bar now shows the short form, `usePathname()` returns short paths: code that reads a pathname goes through
 * `toLong()` (or the `is*` helpers) so both forms behave the same. Query strings and hashes pass through unchanged.
 */

/** The flows with `walkthrough: true` in flows.json; they print as /admin/... and /student/... (a test keeps this in step with the registry). */
export const WALKTHROUGH_FLOW_IDS: readonly string[] = ["setup-walkthrough", "fulfillment-walkthrough"]

/** The address root of each walkthrough flow. */
export const WALKTHROUGH_ROOT: Readonly<Record<string, "admin" | "student">> = { "setup-walkthrough": "admin", "fulfillment-walkthrough": "student" }
/** The flow a root opens. */
const ROOT_FLOW: Readonly<Record<string, string>> = { admin: "setup-walkthrough", student: "fulfillment-walkthrough" }
/** Old entry ids (`/walk/<id>`, `/lab/walkthrough/<id>`) to their root. */
const LEGACY_ENTRY_ID: Readonly<Record<string, "admin" | "student">> = { admin: "admin", setup: "admin", "setup-walkthrough": "admin", student: "student", fulfillment: "student", "fulfillment-walkthrough": "student" }

/** Segments under /lab that are routes of their own, not a persona. */
const LAB_RESERVED = new Set(["flow", "walkthrough", "setup"])

export interface ShortRewrite {
  source: string
  destination: string
}

/** Next `rewrites().beforeFiles` rules, most specific first. */
export const SHORT_REWRITES: ShortRewrite[] = [
  { source: "/admin", destination: "/lab/flow/setup-walkthrough" },
  { source: "/admin/:step", destination: "/lab/flow/setup-walkthrough/:step" },
  { source: "/student", destination: "/lab/flow/fulfillment-walkthrough" },
  { source: "/student/:step", destination: "/lab/flow/fulfillment-walkthrough/:step" },
  { source: "/flow/:flow", destination: "/lab/flow/:flow" },
  { source: "/flow/:flow/:step", destination: "/lab/flow/:flow/:step" },
  { source: "/as/:persona", destination: "/lab/:persona" },
  { source: "/as/:persona/:screen", destination: "/lab/:persona/:screen" },
  { source: "/proto", destination: "/v2" },
  { source: "/proto/:path*", destination: "/v2/:path*" },
  { source: "/all", destination: "/lab" },
]

export interface ShortRedirect {
  source: string
  destination: string
  permanent: false
}

const redirectTo = (source: string, destination: string): ShortRedirect => ({ source, destination, permanent: false })

/** Next `redirects()` rules: every old walkthrough address opens the new one, query kept by Next. */
export const WALKTHROUGH_REDIRECTS: ShortRedirect[] = [
  redirectTo("/walk", "/admin"),
  ...Object.entries(LEGACY_ENTRY_ID).flatMap(([id, root]) => [redirectTo(`/walk/${id}`, `/${root}`), redirectTo(`/lab/walkthrough/${id}`, `/${root}`)]),
  ...Object.entries(WALKTHROUGH_ROOT).flatMap(([flow, root]) => [
    redirectTo(`/walk/${flow}/:step`, `/${root}/:step`),
    redirectTo(`/flow/${flow}`, `/${root}`),
    redirectTo(`/flow/${flow}/:step`, `/${root}/:step`),
    redirectTo(`/lab/flow/${flow}`, `/${root}`),
    redirectTo(`/lab/flow/${flow}/:step`, `/${root}/:step`),
  ]),
]

/** Splits `/path?query#hash` into the path and the rest (`?query#hash`), so a rule only sees the path. */
function split(url: string): [string, string] {
  const i = url.search(/[?#]/)
  return i < 0 ? [url, ""] : [url.slice(0, i), url.slice(i)]
}

const segs = (path: string): string[] => path.split("/").slice(1)

/** The long (route) form of a short path; any other path, and a long path, comes back unchanged. */
export function toLong(url: string): string {
  const [path, rest] = split(url)
  const s = segs(path)
  const head = s[0]
  const out = (p: string) => p + rest
  const flow = head ? ROOT_FLOW[head] : undefined
  if (flow && (s.length === 1 || s.length === 2)) return out(`/lab/flow/${flow}${s.length === 2 ? `/${s[1]}` : ""}`)
  if (head === "flow" && (s.length === 2 || s.length === 3)) return out(`/lab/${s.join("/")}`)
  if (head === "as" && (s.length === 2 || s.length === 3)) return out(`/lab/${s.slice(1).join("/")}`)
  if (head === "proto") return out(s.length === 1 ? "/v2" : `/v2/${s.slice(1).join("/")}`)
  if (head === "all" && s.length === 1) return out("/lab")
  return url
}

/** The short form of a long path; any other path (e/, v1 routes, /lab/setup, unknown), and a short path, comes back unchanged. */
export function toShort(url: string): string {
  const [path, rest] = split(url)
  const s = segs(path)
  const out = (p: string) => p + rest
  if (s[0] === "v2") return out(s.length === 1 ? "/proto" : `/proto/${s.slice(1).join("/")}`)
  if (s[0] !== "lab") return url
  if (s.length === 1) return out("/all")
  if (s[1] === "flow" && (s.length === 3 || s.length === 4)) {
    const root = WALKTHROUGH_ROOT[s[2]!]
    return out(root ? `/${root}${s.length === 4 ? `/${s[3]}` : ""}` : `/flow/${s.slice(2).join("/")}`)
  }
  if (s[1] === "walkthrough" && s.length === 3) return LEGACY_ENTRY_ID[s[2]!] ? out(`/${LEGACY_ENTRY_ID[s[2]!]}`) : url
  if (!LAB_RESERVED.has(s[1]!) && (s.length === 2 || s.length === 3)) return out(`/as/${s.slice(1).join("/")}`)
  return url
}

const under = (path: string, root: string): boolean => path === root || path.startsWith(`${root}/`)

/** True for a lab page in either form (/lab/... or one of the short forms that serve it). */
export function isLabPath(pathname: string): boolean {
  const p = toLong(split(pathname)[0])
  return under(p, "/lab")
}

/** True for a connected prototype page in either form. */
export function isV2Path(pathname: string): boolean {
  return under(toLong(split(pathname)[0]), "/v2")
}

/** True for a flow step in either form (/lab/flow/..., /flow/..., /admin/<step>, /student/<step>). */
export function isFlowPath(pathname: string): boolean {
  return under(toLong(split(pathname)[0]), "/lab/flow")
}

/** Whether a path is one of the short forms (not its long twin). */
export const isShortPath = (pathname: string): boolean => toLong(pathname) !== pathname

/** `url` in the same form (short or long) as `like`, so a nav row compares equal to the pathname the browser shows. */
export const inFormOf = (like: string, url: string): string => (isShortPath(like) ? toShort(url) : toLong(url))
