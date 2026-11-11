/**
 * Short, memorable URLs for the lab, personas, walkthroughs and the connected prototype. Every long URL keeps working: the short
 * forms are `rewrites()` in next.config.ts (beforeFiles), so the browser keeps the short address while Next serves the long route.
 * One pure module (no imports) so next.config.ts, the link builders and the pathname checks all read the same rules.
 *
 *   /walk                      -> /lab/walkthrough/admin       (walkthrough start)
 *   /walk/<flow>               -> /lab/walkthrough/<flow>      (start of that flow; also the old ids admin, student, setup, fulfillment)
 *   /walk/<flow>/<step>        -> /lab/flow/<flow>/<step>
 *   /flow/<flow>[/<step>]      -> /lab/flow/<flow>[/<step>]
 *   /as/<persona>[/<screen>]   -> /lab/<persona>[/<screen>]
 *   /proto[/...]               -> /v2[/...]
 *   /all                       -> /lab
 *
 * Because the address bar now shows the short form, `usePathname()` returns short paths: code that reads a pathname goes through
 * `toLong()` (or the `is*` helpers) so both forms behave the same. Query strings and hashes pass through unchanged.
 */

/** The flows with `walkthrough: true` in flows.json; they print as /walk/... (a test keeps this in step with the registry). */
export const WALKTHROUGH_FLOW_IDS: readonly string[] = ["setup-walkthrough", "fulfillment-walkthrough"]

/** Segments under /lab that are routes of their own, not a persona. */
const LAB_RESERVED = new Set(["flow", "walkthrough", "setup"])

export interface ShortRewrite {
  source: string
  destination: string
}

/** Next `rewrites().beforeFiles` rules, most specific first. */
export const SHORT_REWRITES: ShortRewrite[] = [
  { source: "/walk", destination: "/lab/walkthrough/admin" },
  { source: "/walk/:flow", destination: "/lab/walkthrough/:flow" },
  { source: "/walk/:flow/:step", destination: "/lab/flow/:flow/:step" },
  { source: "/flow/:flow", destination: "/lab/flow/:flow" },
  { source: "/flow/:flow/:step", destination: "/lab/flow/:flow/:step" },
  { source: "/as/:persona", destination: "/lab/:persona" },
  { source: "/as/:persona/:screen", destination: "/lab/:persona/:screen" },
  { source: "/proto", destination: "/v2" },
  { source: "/proto/:path*", destination: "/v2/:path*" },
  { source: "/all", destination: "/lab" },
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
  if (head === "walk" && s.length === 1) return out("/lab/walkthrough/admin")
  if (head === "walk" && s.length === 2) return out(`/lab/walkthrough/${s[1]}`)
  if (head === "walk" && s.length === 3) return out(`/lab/flow/${s[1]}/${s[2]}`)
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
  if (s[1] === "flow" && (s.length === 3 || s.length === 4)) return out(`/${WALKTHROUGH_FLOW_IDS.includes(s[2]!) && s.length === 4 ? "walk" : "flow"}/${s.slice(2).join("/")}`)
  if (s[1] === "walkthrough" && s.length === 3) return out(`/walk/${s[2]}`)
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

/** True for a flow step in either form (/lab/flow/..., /flow/..., /walk/<flow>/<step>). */
export function isFlowPath(pathname: string): boolean {
  return under(toLong(split(pathname)[0]), "/lab/flow")
}

/** Whether a path is one of the short forms (not its long twin). */
export const isShortPath = (pathname: string): boolean => toLong(pathname) !== pathname

/** `url` in the same form (short or long) as `like`, so a nav row compares equal to the pathname the browser shows. */
export const inFormOf = (like: string, url: string): string => (isShortPath(like) ? toShort(url) : toLong(url))
