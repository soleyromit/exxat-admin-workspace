/**
 * Where the Configure one skill page was opened from, and the scroll to restore there (map D1c, D-L115). Read when a link to the page is pressed, in the capture phase, so a dirty panel's guard (which holds the
 * press and navigates later) cannot lose it. In this tab's session storage, so a reload of the page keeps it. Every read and write tolerates storage being blocked: the fallback is the plain Library.
 */
import { toLong } from "@/lib/short-urls"

const ORIGIN = "lab:configure-origin"
const RETURN = "lab:configure-return"
const RETURN_SEARCH = "lab:configure-return-search"

export interface ConfigureOrigin {
  /** The skill's id, or the bulk page's `skills` list. */
  skill: string
  href: string
  scrollTop: number
  /** What the Library's search box held: it lives in the table, not the URL. */
  search: string
}

const read = <T,>(key: string): T | null => {
  try {
    const raw = window.sessionStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}
const write = (key: string, value: unknown) => {
  try {
    if (value === null) window.sessionStorage.removeItem(key)
    else window.sessionStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage blocked: the page falls back to the plain Library.
  }
}

const here = (): string => {
  const q = new URLSearchParams(window.location.search)
  q.delete("section")
  const s = q.toString()
  return s ? `${window.location.pathname}?${s}` : window.location.pathname
}

/** Remember this page as the way back from `skill`. */
export function rememberOrigin(skill: string) {
  const port = document.querySelector("[data-page-scroll]")
  const box = document.querySelector<HTMLInputElement>("main input[type=search]")
  write(ORIGIN, { skill, href: here(), scrollTop: port?.scrollTop ?? 0, search: box?.value ?? "" } satisfies ConfigureOrigin)
}

export function originFor(skill: string): ConfigureOrigin | null {
  const o = read<ConfigureOrigin>(ORIGIN)
  return o?.skill === skill ? o : null
}

/** What the next arrival on the Library does: the scroll to restore, and whether Configure in the panel takes focus. */
export function markReturn(value: { scrollTop: number; focusConfigure: string | null; search?: string }) {
  write(RETURN, value)
  write(RETURN_SEARCH, value.search ? value.search : null)
}

/** True while the Library is going back to a remembered scroll: its title is on its way out of view, so a result banner must not sit under it. */
let restoring = false
export const isRestoringScroll = () => restoring
export const doneRestoringScroll = () => { restoring = false }

export function takeReturn(): { scrollTop: number; focusConfigure: string | null } | null {
  const r = read<{ scrollTop: number; focusConfigure: string | null }>(RETURN)
  if (r) {
    write(RETURN, null)
    restoring = r.scrollTop > 0
  }
  return r
}

/** The search box to put back, once, read by the table when it mounts. */
export function takeReturnSearch(): string {
  const s = read<string>(RETURN_SEARCH) ?? ""
  if (s) write(RETURN_SEARCH, null)
  return s
}

/** Links to the two configure pages, in whichever form the option set wrote them: the key is the skill, or the bulk page's list. */
function skillOfDoor(href: string): string | null {
  if (!/configure-skill|\/lab\/flow\/[^/?]+\/configure\b/.test(toLong(href))) return null
  const q = new URL(href, window.location.origin).searchParams
  return q.get("skills") || q.get("skill")
}

let installed = false
/** One listener for the lab: any link to the page, from any page. Pressing one from the page itself is not a way in. */
export function installOriginCapture() {
  if (installed || typeof window === "undefined") return
  installed = true
  window.addEventListener("click", (e) => {
    if (e.button !== 0) return
    const a = e.target instanceof Element ? e.target.closest<HTMLAnchorElement>("a[href]") : null
    // Cancel on the page: the guard may hold the press, and the Library restores the scroll whenever it arrives.
    const cancelling = a?.getAttribute("data-configure-cancel")
    if (cancelling) {
      const o = originFor(cancelling)
      if (o) markReturn({ scrollTop: o.scrollTop, focusConfigure: null, search: o.search })
      return
    }
    const href = a?.getAttribute("href")
    const skill = href ? skillOfDoor(href) : null
    if (skill && !skillOfDoor(window.location.pathname + window.location.search)) rememberOrigin(skill)
  }, true)
}

/** The skill the page is on, for the breadcrumb: the frame sits outside the new program's store (`?program=new`), so it cannot read a skill added there. */
let shownSkill: { id: string; name: string } | null = null
const shownListeners = new Set<() => void>()
export function publishShownSkill(next: { id: string; name: string } | null) {
  shownSkill = next
  shownListeners.forEach((l) => l())
}
export const subscribeShownSkill = (l: () => void) => { shownListeners.add(l); return () => { shownListeners.delete(l) } }
export const shownSkillSnapshot = () => shownSkill
